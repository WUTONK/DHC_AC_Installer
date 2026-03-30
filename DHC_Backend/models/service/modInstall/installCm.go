package modinstall

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/infoGet"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

// 自动安装 Content Manager 并解压到 windows 桌面文件夹
// 返回 CM 解压路径 和 错误

// ProgressWriter 包装一个 io.Reader，在每次 Read 时计算已读百分比。
// 通过 OnProgress 回调，可以把下载进度实时同步给 TaskTracker。
type ProgressWriter struct {
	io.Reader                          // 底层数据源（例如 HTTP Response Body）
	Total      int64                   // 总大小（字节），-1 表示未知
	Current    int64                   // 已读取大小（字节）
	OnProgress func(percentage float64) // 可选回调：每次 Read 后触发，参数是 0-100 百分比
}

// Read 实现 io.Reader 接口，在读取数据后计算进度并触发回调。
// 这个方法会被 io.Copy 内部循环调用，每调一次就更新一次进度。
func (pro *ProgressWriter) Read(p []byte) (n int, err error) {
	n, err = pro.Reader.Read(p)
	pro.Current += int64(n)

	// 只有当 Total > 0 时才能算百分比（ContentLength 可能为 -1 表示未知大小）
	if pro.Total > 0 {
		percentage := float64(pro.Current*100) / float64(pro.Total)

		// 触发进度回调（如果有），这里就是子进度同步给 TaskTracker 的入口
		if pro.OnProgress != nil {
			pro.OnProgress(percentage)
		}

		fmt.Printf("\r正在下载，下载进度：%.2f%%", percentage)
		if pro.Current == pro.Total {
			fmt.Printf("\r下载完成，下载进度：%.2f%%\n", percentage)
		}
	} else {
		// 如果总大小未知，只显示已下载的字节数
		fmt.Printf("\r正在下载，已下载：%d 字节", pro.Current)
	}

	return
}

// InstallCm 保持旧签名，不带进度追踪。
// 已有的调用方（测试、其他模块）无需修改。
func InstallCm() (string, error) {
	return InstallCmWithTracker(nil)
}

// InstallCmWithTracker 安装 Content Manager，并通过 TaskTracker 追踪进度。
// 传 nil 表示不追踪进度（和旧版 InstallCm 行为一致）。
//
// 内部像 useEffect 一样注册了三个阶段：
//
//	"download" (权重25%) → "extract" (权重50%) → "move" (权重25%)
//
// 子进度区间映射示例：
//
//	下载进度 50% → 总进度 = 25 × 0.5 = 12.5%
//	解压完成      → 总进度 = 25 + 50 = 75%
//	移动完成      → 总进度 = 100%
func InstallCmWithTracker(tracker *TaskTracker) (string, error) {
	// 如果没有传入 tracker，创建一个静默的（不会报错，只是没有回调）
	if tracker == nil {
		tracker = NewTaskTracker(nil)
	}

	// ── 像 useEffect 一样，在函数开头集中注册所有阶段和权重 ──
	tracker.AddPhase("download", "下载CM安装包", 25)
	tracker.AddPhase("extract", "解压CM文件", 50)
	tracker.AddPhase("move", "移动到桌面", 25)

	funcIdt := "-modInstall.InstallCm-"

	// ══════════════════════════════════════════════════
	// 阶段 1: 下载（占总进度 0% ~ 25%）
	// ══════════════════════════════════════════════════
	tracker.StartPhase("download")

	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		tracker.FailPhase("download")
		return "", fmt.Errorf("%s获取后端根目录失败", funcIdt)
	}

	url := "https://acstuff.ru/app/latest.zip"
	cmDirFilepath := filepath.Join(backendRootPath, "resources", "cache", "cm")
	tmpFilepath := filepath.Join(cmDirFilepath, "zip")
	err = os.MkdirAll(tmpFilepath, 0755)
	if err != nil {
		tracker.FailPhase("download")
		return "", fmt.Errorf("%s创建目录失败: %s", funcIdt, err)
	}
	tmpFilePath := filepath.Join(tmpFilepath, "latest.zip")
	file, err := os.Create(tmpFilePath)
	if err != nil {
		tracker.FailPhase("download")
		return "", fmt.Errorf("%s文件保存出错: %s", funcIdt, err)
	}
	defer file.Close()

	res, err := http.Get(url)
	if err != nil {
		tracker.FailPhase("download")
		return "", fmt.Errorf("%s文件下载出错: %s", funcIdt, err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		tracker.FailPhase("download")
		return "", fmt.Errorf("%s文件下载失败，状态码: %d", funcIdt, res.StatusCode)
	}

	// ProgressWriter 在每次从网络读取数据后，自动把下载百分比同步给 tracker。
	// tracker.SetSubProgress 会自动换算：下载子进度 50% → 总进度 12.5%
	progress := &ProgressWriter{
		Reader: res.Body,
		Total:  res.ContentLength,
		OnProgress: func(pct float64) {
			tracker.SetSubProgress("download", pct)
		},
	}
	if _, err := io.Copy(file, progress); err != nil {
		tracker.FailPhase("download")
		return "", fmt.Errorf("%s文件保存出错: %s", funcIdt, err)
	}

	tracker.CompletePhase("download") // 总进度 → 25%

	// ══════════════════════════════════════════════════
	// 阶段 2: 解压（占总进度 25% ~ 75%）
	// ══════════════════════════════════════════════════
	tracker.StartPhase("extract")

	DecompDstPath := filepath.Join(cmDirFilepath, "unzip")
	DecompOption := decompression.DecompressionOptions{
		SrcPath:             tmpFilePath,
		FilePassword:        "",
		IsMod:               false,
		DftPathGetModOrPath: "",
		DstFilePath:         DecompDstPath,
	}

	_, errorTiming, err := decompression.DecompressionWithOptions(DecompOption)
	if errorTiming != "" || err != nil {
		tracker.FailPhase("extract")
		return "", fmt.Errorf("%s解压失败:errorTiming:%s, err:%s", funcIdt, errorTiming, err)
	}

	tracker.CompletePhase("extract") // 总进度 → 75%

	// ══════════════════════════════════════════════════
	// 阶段 3: 移动到桌面（占总进度 75% ~ 100%）
	// ══════════════════════════════════════════════════
	tracker.StartPhase("move")

	var dstFilePath string
	isDevMode := infoGet.IsDevModeGet()
	if isDevMode {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM")
	} else {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM")
		// TODO：补充非开发模式下获取 windows desktop 路径函数
	}

	err = os.MkdirAll(dstFilePath, 0755)
	if err != nil {
		tracker.FailPhase("move")
		return "", fmt.Errorf("%s创建目标目录失败: %s", funcIdt, err)
	}

	cmExePath := filepath.Join(DecompDstPath, "Content Manager.exe")
	movedCmExePath := filepath.Join(dstFilePath, "Content Manager.exe")
	err = os.Rename(cmExePath, movedCmExePath)
	if err != nil {
		tracker.FailPhase("move")
		return "", fmt.Errorf("%s移动文件失败: %s", funcIdt, err)
	}

	tracker.CompletePhase("move") // 总进度 → 100%

	fmt.Println("CM已成功安装到:", movedCmExePath)
	return movedCmExePath, nil
}

// 检测本地 cm 位置
// 返回值 cm是否存在 本地目录 错误
func DetectLocalCmPath() (isCmExist bool, cmPath string, err error) {
	funcIdt := "-modInstall.DetectLocalCmPath-"

	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return false, "", fmt.Errorf("%s获取后端根目录失败: %w", funcIdt, err)
	}

	isDevMode := infoGet.IsDevModeGet()
	var possiblePaths []string

	if isDevMode {
		// 开发模式：检查测试环境路径
		devPath := filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM", "Content Manager.exe")
		possiblePaths = append(possiblePaths, devPath)
	} else {
		// 非开发模式：检查 Windows 桌面路径
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return false, "", fmt.Errorf("%s获取用户主目录失败: %w", funcIdt, err)
		}

		// Windows 桌面可能的路径
		desktopPaths := []string{
			filepath.Join(homeDir, "Desktop", "CM", "Content Manager.exe"),
			filepath.Join(homeDir, "桌面", "CM", "Content Manager.exe"), // 中文系统
		}
		possiblePaths = append(possiblePaths, desktopPaths...)
	}

	// 遍历所有可能的路径，检查文件是否存在
	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			// 文件存在，返回目录路径（不包含文件名）
			cmPath = filepath.Dir(path)
			return true, cmPath, nil
		}
	}

	// 所有路径都不存在
	return false, "", nil
}
