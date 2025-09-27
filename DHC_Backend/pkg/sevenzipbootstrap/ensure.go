// Package sevenZipBootStrap 提供自动检测、下载和安装 7-Zip 工具的功能
// 支持跨平台（Windows、macOS、Linux）的 7z 可执行文件管理
// 主要功能：
//   - 自动检测系统是否已安装满足版本要求的 7z
//   - 从官方源下载并安装 7z 到指定目录
//   - 支持版本比较和最低版本要求
//   - 提供 SHA256 校验确保下载文件完整性
package sevenZipBootStrap

import (
	"archive/tar"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"github.com/ulikunitz/xz"
)

// 扼要：EnsureSevenZip
// - 确保在指定目录下存在可用的 7z 可执行文件
//
// 参数:
//   - installDir: 7z 可执行文件的安装目录路径
//   - minVersion: 最低版本要求，格式为 "主版本.次版本"（如 "23.01"），空字符串表示不检查版本
//   - targetVersion: 下载特定版本，格式为 "主版本.次版本"（如 "25.01"），空字符串表示自动检测最新版
//   - sha256: SHA256 下载用校验值，空字符串表示不进行校验
//
// 返回值:
//   - string: 7z 可执行文件的绝对路径
//   - error: 如果安装失败或版本不满足要求则返回错误
//
// 功能说明:
//   - 按优先级检查：私有目录 -> 系统 PATH -> 自动下载安装
//   - 支持版本检查和 SHA256 验证的可选控制
//   - 支持下载指定版本或自动检测最新版本
//   - 支持跨平台下载：Windows(MSI)、macOS/Linux(tar.xz)
//   - 自动处理文件权限和目录创建
func EnsureSevenZip(installDir string, minVersion string, targetVersion string, sha256 string) (string, error) {
	// 参数验证
	if installDir == "" {
		return "", errors.New("installDir 不能为空")
	}

	// 确保安装目录存在
	if err := os.MkdirAll(installDir, 0o755); err != nil {
		return "", err
	}

	// 1) 优先检查私有目录中是否已有满足版本要求的 7z
	if p := findPrivate7z(installDir); p != "" {
		// 如果没有版本要求，直接返回找到的 7z
		if minVersion == "" {
			return p, nil
		}
		// 检查版本是否满足要求
		ok, _ := versionMeets(p, minVersion)
		if ok {
			return p, nil
		}
	}

	// 2) 检查系统 PATH 中是否有满足版本要求的 7z
	if sys, err := exec.LookPath(candidateName()); err == nil {
		// 如果没有版本要求，直接返回系统 7z 路径
		if minVersion == "" {
			return sys, nil
		}
		// 检查版本是否满足要求
		if ok, _ := versionMeets(sys, minVersion); ok {
			return sys, nil
		}
	}

	// 3) 如果私有目录和系统 PATH 都没有满足要求的 7z，则自动下载安装
	spec, err := getDownloadSpec(targetVersion, sha256)
	if err != nil {
		return "", err
	}

	// 下载 7z 安装包到临时文件
	tmp := filepath.Join(installDir, "7z_download.tmp")
	if err := downloadFile(spec.URL, tmp); err != nil {
		return "", err
	}
	defer os.Remove(tmp) // 确保临时文件被清理

	// 如果提供了 SHA256 校验值，验证下载文件的完整性
	if spec.SHA256 != "" {
		if err := verifySHA256(tmp, spec.SHA256); err != nil {
			return "", err
		}
	}

	// 根据不同的归档类型进行解压和安装
	switch spec.Archive {
	case "tar.xz":
		// macOS/Linux: 解压 tar.xz 文件
		if err := extractTarXZ(tmp, installDir); err != nil {
			return "", err
		}
		bin := filepath.Join(installDir, spec.BinName)
		_ = os.Chmod(bin, 0o755) // 设置可执行权限
		return bin, nil
	case "msi":
		// Windows: 使用 MSI 静默安装
		cmd := exec.Command("msiexec.exe", "/i", tmp, "/qn", "TARGETDIR="+installDir, "ALLUSERS=1", "ADDLOCAL=ALL", "REBOOT=ReallySuppress")
		cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
		if err := cmd.Run(); err != nil {
			return "", fmt.Errorf("MSI 安装失败: %w", err)
		}
		// 查找安装后的 7z.exe 位置
		cands := []string{
			filepath.Join(installDir, "7-Zip", "7z.exe"),
			filepath.Join(installDir, "7z.exe"),
		}
		for _, c := range cands {
			if _, err := os.Stat(c); err == nil {
				return c, nil
			}
		}
		return "", errors.New("未找到 7z.exe（MSI 安装后路径不符合预期）")
	default:
		return "", fmt.Errorf("不支持的归档类型: %s", spec.Archive)
	}
}

// downloadSpec 定义下载规格，包含下载 URL、校验值、归档类型等信息
type downloadSpec struct {
	URL     string // 下载链接
	SHA256  string // SHA256 校验值（可选）
	Archive string // 归档类型：tar.xz（macOS/Linux）或 msi（Windows）
	BinName string // 解压后期望的二进制文件名
}

// getDownloadSpec 获取下载规格，支持自动检测最新版本
//
// 参数:
//   - targetVersion: 目标版本，格式为 "主版本.次版本"（如 "25.01"），空字符串表示自动下载最新版
//   - sha256: SHA256 校验值，空字符串表示不进行校验
//
// 返回值:
//   - downloadSpec: 包含下载 URL、校验值、归档类型等信息的结构体
//   - error: 如果获取失败则返回错误
//
// 功能说明:
//   - 如果 targetVersion 为空，尝试从官方页面检测最新版本
//   - 如果检测失败，回退到已知的最新版本(25.01)
//   - 支持跨平台：Windows(MSI)、macOS/Linux(tar.xz)
func getDownloadSpec(targetVersion string, sha256 string) (downloadSpec, error) {
	// 如果未指定版本，尝试检测最新版本
	if targetVersion == "" {
		latestVersion, err := detectLatestVersion()
		if err != nil {
			// 检测失败时回退到已知的最新版本
			targetVersion = "25.01" // 当前已知的最新版本
		} else {
			targetVersion = latestVersion
		}
	}

	return buildDownloadSpec(targetVersion, sha256)
}

// detectLatestVersion 从官方页面检测最新版本
//
// 返回值:
//   - string: 最新版本号，格式为 "主版本.次版本"（如 "25.01"）
//   - error: 如果检测失败则返回错误
//
// 说明:
//   - 尝试从 7-Zip 官方页面解析最新版本号
//   - 目前使用简单的 URL + 版本列表 尝试方法，后续可扩展为解析 HTML
func detectLatestVersion() (string, error) {
	// 尝试访问官方页面检测最新版本
	// 这里使用一个简化的方法：尝试几个可能的版本号
	// TODO:迭代为可以解析官方页面获取真实的最新版本

	// 已知的版本列表，按时间倒序
	knownVersions := []string{"25.01", "23.01", "22.01", "21.07"}

	for _, version := range knownVersions {
		// 尝试构建一个测试 URL 来验证版本是否存在
		testURL := buildTestURL(version)
		if urlExists(testURL) {
			return version, nil
		}
	}

	return "", errors.New("无法检测到最新版本")
}

// buildTestURL 构建测试 URL 来验证版本是否存在
func buildTestURL(version string) string {
	versionCode := strings.ReplaceAll(version, ".", "")
	os := runtime.GOOS

	switch os {
	case "darwin":
		return fmt.Sprintf("https://www.7-zip.org/a/7z%s-mac.tar.xz", versionCode)
	case "linux":
		return fmt.Sprintf("https://www.7-zip.org/a/7z%s-linux-x64.tar.xz", versionCode)
	case "windows":
		return fmt.Sprintf("https://www.7-zip.org/a/7z%s-x64.msi", versionCode)
	default:
		return ""
	}
}

// urlExists 检查 URL 是否存在（通过 HEAD 请求）
func urlExists(url string) bool {
	if url == "" {
		return false
	}

	resp, err := http.Head(url)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == 200
}

// buildDownloadSpec 根据版本和 SHA256 构建下载规格
func buildDownloadSpec(targetVersion string, sha256 string) (downloadSpec, error) {
	os := runtime.GOOS

	// 将版本号转换为下载 URL 格式（如 "23.01" -> "2301"）
	versionCode := strings.ReplaceAll(targetVersion, ".", "")

	switch os {
	case "darwin":
		// macOS: 使用统一的 7zz 独立版（不区分架构）
		return downloadSpec{
			URL:     fmt.Sprintf("https://www.7-zip.org/a/7z%s-mac.tar.xz", versionCode),
			SHA256:  sha256,
			Archive: "tar.xz",
			BinName: "7zz",
		}, nil
	case "linux":
		// Linux: 7zz 独立版
		return downloadSpec{
			URL:     fmt.Sprintf("https://www.7-zip.org/a/7z%s-linux-x64.tar.xz", versionCode),
			SHA256:  sha256,
			Archive: "tar.xz",
			BinName: "7zz",
		}, nil
	case "windows":
		// Windows: 使用官方 MSI 安装包（x64 架构）
		return downloadSpec{
			URL:     fmt.Sprintf("https://www.7-zip.org/a/7z%s-x64.msi", versionCode),
			SHA256:  sha256,
			Archive: "msi",
			BinName: "7z.exe",
		}, nil
	default:
		return downloadSpec{}, fmt.Errorf("不支持的操作系统: %s", os)
	}
}

// candidateName 返回当前平台下 7z 可执行文件的候选名称
//
// 返回值:
//   - string: 7z 可执行文件的名称
//
// 说明:
//   - Windows: 返回 "7z.exe"
//   - 其他平台: 返回 "7zz"（独立版）
func candidateName() string {
	if runtime.GOOS == "windows" {
		return "7z.exe"
	}
	return "7zz"
}

// findPrivate7z 在指定目录中查找 7z 可执行文件
//
// 参数:
//   - dir: 要搜索的目录路径
//
// 返回值:
//   - string: 找到的 7z 可执行文件的完整路径，如果未找到则返回空字符串
//
// 说明:
//   - 按优先级搜索：7zz -> 7z -> 7za -> 7z.exe
//   - 只返回存在的文件，跳过目录
func findPrivate7z(dir string) string {
	cands := []string{"7zz", "7z", "7za", "7z.exe"}
	for _, n := range cands {
		p := filepath.Join(dir, n)
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	return ""
}

// versionMeets 检查指定 7z 可执行文件的版本是否满足最低版本要求
//
// 参数:
//   - binPath: 7z 可执行文件的路径
//   - minVersion: 最低版本要求，格式为 "主版本.次版本"（如 "23.01"）
//
// 返回值:
//   - bool: 如果版本满足要求返回 true，否则返回 false
//   - string: 7z 的版本输出信息
//
// 说明:
//   - 如果 minVersion 为空字符串，直接返回 true（不进行版本检查）
//   - 通过执行 "7z -version" 命令获取版本信息
//   - 使用正则表达式提取版本号并进行比较
func versionMeets(binPath, minVersion string) (bool, string) {
	if minVersion == "" {
		return true, ""
	}
	cmd := exec.Command(binPath, "-version")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return false, ""
	}
	s := string(out)
	ver := extractVersion(s)
	if ver == "" {
		return false, s
	}
	return compareVersion(ver, minVersion) >= 0, s
}

// extractVersion 从 7z/7zz -version 输出中提取版本号
//
// 参数:
//   - s: 7z -version 命令的输出字符串
//
// 返回值:
//   - string: 提取的版本号，格式为 "主版本.次版本"（如 "23.01"）
//     如果未找到版本号则返回空字符串
//
// 说明:
//   - 使用正则表达式 `\b(\d{1,3}\.\d{1,3})\b` 匹配版本号
//   - 支持 1-3 位数字的主版本和次版本号
func extractVersion(s string) string {
	re := regexp.MustCompile(`\b(\d{1,3}\.\d{1,3})\b`)
	m := re.FindStringSubmatch(s)
	if len(m) > 1 {
		return m[1]
	}
	return ""
}

// compareVersion 比较两个版本号的大小
//
// 参数:
//   - v1, v2: 要比较的版本号，格式为 "主版本.次版本"（如 "23.01"）
//
// 返回值:
//   - int: 比较结果
//   - 1: v1 > v2
//   - 0: v1 == v2
//   - -1: v1 < v2
//
// 说明:
//   - 先比较主版本号，再比较次版本号
//   - 使用安全的字符串转整数函数，避免解析错误
func compareVersion(v1, v2 string) int {
	p1 := strings.SplitN(v1, ".", 2)
	p2 := strings.SplitN(v2, ".", 2)
	a1, b1 := atoiSafe(p1[0]), 0
	if len(p1) > 1 {
		b1 = atoiSafe(p1[1])
	}
	a2, b2 := atoiSafe(p2[0]), 0
	if len(p2) > 1 {
		b2 = atoiSafe(p2[1])
	}
	if a1 != a2 {
		if a1 > a2 {
			return 1
		}
		return -1
	}
	if b1 != b2 {
		if b1 > b2 {
			return 1
		}
		return -1
	}
	return 0
}

// atoiSafe 安全地将字符串转换为整数
//
// 参数:
//   - s: 要转换的字符串
//
// 返回值:
//   - int: 转换后的整数
//
// 说明:
//   - 只处理数字字符，遇到非数字字符时停止
//   - 避免使用 strconv.Atoi 可能出现的 panic
func atoiSafe(s string) int {
	n := 0
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c < '0' || c > '9' {
			break
		}
		n = n*10 + int(c-'0')
	}
	return n
}

// downloadFile 从指定 URL 下载文件到目标路径
//
// 参数:
//   - url: 要下载的文件 URL
//   - dst: 目标文件路径
//
// 返回值:
//   - error: 如果下载失败则返回错误
//
// 说明:
//   - 使用自定义 User-Agent 标识下载请求
//   - 检查 HTTP 状态码，确保下载成功
//   - 自动创建目标文件并写入下载内容
func downloadFile(url, dst string) error {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "dhc-ac-installer/1.0")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("下载失败: %s", resp.Status)
	}
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, resp.Body)
	return err
}

// verifySHA256 验证文件的 SHA256 校验值
//
// 参数:
//   - path: 要验证的文件路径
//   - want: 期望的 SHA256 校验值
//
// 返回值:
//   - error: 如果校验失败则返回错误
//
// 说明:
//   - 如果 want 为空字符串，跳过校验直接返回 nil
//   - 计算文件的 SHA256 值并与期望值比较
//   - 比较时忽略大小写和前后空白字符
func verifySHA256(path, want string) error {
	if want == "" {
		return nil
	}
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return err
	}
	sum := hex.EncodeToString(h.Sum(nil))
	w := strings.ToLower(strings.TrimSpace(want))
	if sum != w {
		return fmt.Errorf("SHA256 不匹配: got=%s want=%s", sum, w)
	}
	return nil
}

// extractTarXZ 解压 tar.xz 归档文件到指定目录
//
// 参数:
//   - archive: tar.xz 归档文件路径
//   - dst: 解压目标目录
//
// 返回值:
//   - error: 如果解压失败则返回错误
//
// 说明:
//   - 使用 xz 解压缩器处理 .xz 压缩
//   - 使用 tar 读取器处理 tar 归档
//   - 只提取普通文件（TypeReg, TypeRegA），跳过目录和链接
//   - 提取的文件自动设置可执行权限（0o755）
func extractTarXZ(archive, dst string) error {
	f, err := os.Open(archive)
	if err != nil {
		return err
	}
	defer f.Close()
	xzr, err := xz.NewReader(f)
	if err != nil {
		return err
	}
	tr := tar.NewReader(xzr)
	for {
		hdr, err := tr.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return err
		}
		name := filepath.Base(hdr.Name)
		if name == "" || name == "." {
			continue
		}
		target := filepath.Join(dst, name)
		switch hdr.Typeflag {
		case tar.TypeReg, tar.TypeRegA:
			out, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
			if err != nil {
				return err
			}
			if _, err := io.Copy(out, tr); err != nil {
				out.Close()
				return err
			}
			out.Close()
		default:
			// 跳过目录/链接等
		}
	}
	return nil
}
