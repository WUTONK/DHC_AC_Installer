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
// TODO: 实现显示下载进度

// 进度条
type ProgressWriter struct {
	io.Reader       // 读取器
	Total     int64 // 总大小
	Current   int64 // 当前大小
}

// 实现 io.Reader 接口，给 io.Copy 消费 从而显示下载进度
func (pro *ProgressWriter) Read(p []byte) (n int, err error) {
	n, err = pro.Reader.Read(p) // 从底层 Reader 读取数据
	pro.Current += int64(n)

	// 只有当 Total > 0 时才显示百分比进度（ContentLength 可能为 -1 表示未知大小）
	if pro.Total > 0 {
		percentage := float64(pro.Current*100) / float64(pro.Total)
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

func InstallCm() (string, error) {
	funcIdt := "-modInstall.InstallCm-"
	// 下载地址：https://acstuff.ru/app/latest.zip 压缩包下载到 DHC_Backend/resources/cache/cm/zip/

	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return "", fmt.Errorf("%s获取后端根目录失败", funcIdt)
	}

	url := "https://acstuff.ru/app/latest.zip"
	cmDirFilepath := filepath.Join(backendRootPath, "resources", "cache", "cm")
	tmpFilepath := filepath.Join(cmDirFilepath, "zip")
	err = os.MkdirAll(tmpFilepath, 0755)
	if err != nil {
		return "", fmt.Errorf("%s创建目录失败: %s", funcIdt, err)
	}
	tmpFilePath := filepath.Join(tmpFilepath, "latest.zip")
	file, err := os.Create(tmpFilePath)
	if err != nil {
		return "", fmt.Errorf("%s文件保存出错: %s", funcIdt, err)
	}
	defer file.Close()

	res, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("%s文件下载出错: %s", funcIdt, err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s文件下载失败，状态码: %d", funcIdt, res.StatusCode)
	}

	progress := &ProgressWriter{
		Reader: res.Body,
		Total:  res.ContentLength,
	}
	if _, err := io.Copy(file, progress); err != nil {
		return "", fmt.Errorf("%s文件保存出错: %s", funcIdt, err)
	}

	DecompDstPath := filepath.Join(cmDirFilepath, "unzip")
	// 调用解压缩工具解压缩到 DHC_Backend/resources/cache/cm/unzip/
	DecompOption := decompression.DecompressionOptions{
		SrcPath:             tmpFilePath,
		FilePassword:        "",
		IsMod:               false,
		DftPathGetModOrPath: "",
		DstFilePath:         DecompDstPath,
	}

	_, errorTiming, err := decompression.DecompressionWithOptions(DecompOption)
	if errorTiming != "" || err != nil {
		return "", fmt.Errorf("%s解压失败:errorTiming:%s, err:%s", funcIdt, errorTiming, err)
	}

	// 将CM剪切到桌面文件夹（开发环境下剪切到 DHC_Backend/test/simEnv/windows_finder/desktop 下进行模拟）
	// CM文件名: Content Manager.exe
	var dstFilePath string
	isDevMode := infoGet.IsDevModeGet()
	if isDevMode {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM")
	} else {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM")
		// TODO：补充非开发模式下获取 windows desktop 路径函数
	}

	// 确保目标目录存在
	err = os.MkdirAll(dstFilePath, 0755)
	if err != nil {
		return "", fmt.Errorf("%s创建目标目录失败: %s", funcIdt, err)
	}

	cmExePath := filepath.Join(DecompDstPath, "Content Manager.exe")
	movedCmExePath := filepath.Join(dstFilePath, "Content Manager.exe")
	err = os.Rename(cmExePath, movedCmExePath)
	if err != nil {
		return "", fmt.Errorf("%s移动文件失败: %s", funcIdt, err)
	}

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
