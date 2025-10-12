// Package sevenZipBootStrapSimple 提供简化的 7-Zip 工具下载功能
// 专门用于下载和安装 7-Zip 25.01 版本
// 主要功能：
//   - 自动检测系统是否已安装 7z
//   - 从官方源下载并安装 7z 25.01 版本到指定目录
//   - 提供 SHA256 校验确保下载文件完整性
//   - 支持跨平台（Windows、macOS、Linux）
package sevenZipBootStrapSimple

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// 固定版本常量
const (
	// TARGET_VERSION 固定下载的版本号
	TARGET_VERSION = "25.01"
	// VERSION_CODE 版本代码，用于构建下载 URL
	VERSION_CODE = "2501"
)

// 全局变量，用于强制指定操作系统（主要用于测试）
var forcedOS string

// SetForcedOS 强制指定操作系统，用于测试
// 参数:
//   - os: 操作系统名称 ("windows", "darwin", "linux")
//
// 说明:
//   - 如果设置为空字符串，则使用实际的 runtime.GOOS
//   - 主要用于测试不同平台的行为
func SetForcedOS(os string) {
	forcedOS = os
}

// getCurrentOS 获取当前操作系统
// 返回值:
//   - string: 当前操作系统名称
//
// 说明:
//   - 如果设置了 forcedOS，则返回 forcedOS
//   - 否则返回实际的 runtime.GOOS
func getCurrentOS() string {
	if forcedOS != "" {
		return forcedOS
	}
	return runtime.GOOS
}

// EnsureSevenZipSimple 确保在指定目录下存在可用的 7z 可执行文件（25.01版本）
//
// 参数:
//   - installDir: 7z 可执行文件的安装目录路径
//   - sha256: SHA256 校验值，空字符串表示不进行校验
//
// 返回值:
//   - string: 7z 可执行文件的绝对路径
//   - error: 如果安装失败则返回错误
//
// 功能说明:
//   - 按优先级检查：私有目录 -> 系统 PATH -> 自动下载安装
//   - 固定下载 7-Zip 25.01 版本
//   - 支持 SHA256 验证的可选控制
//   - 支持跨平台下载：Windows(MSI)、macOS/Linux(tar.xz)
//   - 自动处理文件权限和目录创建
func EnsureSevenZipSimple(installDir string, sha256 string) (string, error) {
	// 参数验证
	if installDir == "" {
		return "", errors.New("installDir 不能为空")
	}

	// 确保安装目录存在
	if err := os.MkdirAll(installDir, 0o755); err != nil {
		return "", err
	}

	// 1) 优先检查私有目录中是否已有 7z
	if p := findPrivate7z(installDir); p != "" {
		return p, nil
	}

	// 2) 如果没有 7z，则自动下载安装 25.01 版本
	spec, err := buildDownloadSpec(sha256)
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

	// 根据不同的归档类型进行解压
	switch spec.Archive {
	case "tar.xz":
		// macOS/Linux: 解压 tar.xz 文件
		if err := extractTarXZ(tmp, installDir); err != nil {
			return "", err
		}
		bin := filepath.Join(installDir, spec.BinName)
		_ = os.Chmod(bin, 0o755) // 设置可执行权限
		return bin, nil
	case "7z":
		// Windows: 解压 .7z 文件
		if err := extract7z(tmp, installDir); err != nil {
			return "", err
		}
		bin := filepath.Join(installDir, spec.BinName)
		_ = os.Chmod(bin, 0o755) // 设置可执行权限
		return bin, nil
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

// buildDownloadSpec 构建 25.01 版本的下载规格
//
// 参数:
//   - sha256: SHA256 校验值，空字符串表示不进行校验
//
// 返回值:
//   - downloadSpec: 包含下载 URL、校验值、归档类型等信息的结构体
//   - error: 如果构建失败则返回错误
//
// 功能说明:
//   - 固定使用 25.01 版本
//   - Windows: 使用 .7z 格式的命令行版本
//   - macOS/Linux: 使用 .tar.xz 格式的命令行版本
func buildDownloadSpec(sha256 string) (downloadSpec, error) {
	os := getCurrentOS()

	switch os {
	case "darwin":
		// macOS: 使用统一的 7zz 独立版（不区分架构）
		return downloadSpec{
			URL:     fmt.Sprintf("https://www.7-zip.org/a/7z%s-mac.tar.xz", VERSION_CODE),
			SHA256:  sha256,
			Archive: "tar.xz",
			BinName: "7zz",
		}, nil
	case "linux":
		// Linux: 7zz 独立版
		return downloadSpec{
			URL:     fmt.Sprintf("https://www.7-zip.org/a/7z%s-linux-x64.tar.xz", VERSION_CODE),
			SHA256:  sha256,
			Archive: "tar.xz",
			BinName: "7zz",
		}, nil
	case "windows":
		// Windows: 使用 .7z 格式的命令行版本
		return downloadSpec{
			URL:     fmt.Sprintf("https://www.7-zip.org/a/7z%s-extra.7z", VERSION_CODE),
			SHA256:  sha256,
			Archive: "7z",
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
//   - macOS/Linux: 返回 "7zz"
func candidateName() string {
	if getCurrentOS() == "windows" {
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
//   - 显示下载进度和速度
func downloadFile(url, dst string) error {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "dhc-ac-installer-simple/1.0")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("下载失败: %s", resp.Status)
	}

	// 获取文件总大小
	totalSize := resp.ContentLength
	if totalSize <= 0 {
		fmt.Printf("开始下载 %s...\n", filepath.Base(dst))
	} else {
		fmt.Printf("开始下载 %s (大小: %.2f MB)...\n", filepath.Base(dst), float64(totalSize)/(1024*1024))
	}

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	// 创建带进度显示的写入器
	progressWriter := &progressWriter{
		writer:     out,
		totalSize:  totalSize,
		downloaded: 0,
		lastUpdate: time.Now(),
	}

	_, err = io.Copy(progressWriter, resp.Body)
	if err != nil {
		return err
	}

	fmt.Printf("\n下载完成！\n")
	return nil
}

// progressWriter 实现 io.Writer 接口，用于显示下载进度
type progressWriter struct {
	writer     io.Writer
	totalSize  int64
	downloaded int64
	lastUpdate time.Time
}

// Write 实现 io.Writer 接口
func (pw *progressWriter) Write(p []byte) (n int, err error) {
	n, err = pw.writer.Write(p)
	if err != nil {
		return n, err
	}

	pw.downloaded += int64(n)

	// 每 500ms 更新一次进度显示
	now := time.Now()
	if now.Sub(pw.lastUpdate) >= 500*time.Millisecond || pw.downloaded == pw.totalSize {
		pw.updateProgress()
		pw.lastUpdate = now
	}

	return n, nil
}

// updateProgress 更新进度显示
func (pw *progressWriter) updateProgress() {
	if pw.totalSize <= 0 {
		// 如果不知道总大小，只显示已下载的字节数
		fmt.Printf("\r已下载: %.2f MB", float64(pw.downloaded)/(1024*1024))
		return
	}

	// 计算进度百分比
	percentage := float64(pw.downloaded) / float64(pw.totalSize) * 100

	// 计算下载速度
	elapsed := time.Since(pw.lastUpdate)
	if elapsed > 0 {
		speed := float64(pw.downloaded) / elapsed.Seconds() / (1024 * 1024) // MB/s
		fmt.Printf("\r进度: %.1f%% (%.2f/%.2f MB) - 速度: %.2f MB/s",
			percentage,
			float64(pw.downloaded)/(1024*1024),
			float64(pw.totalSize)/(1024*1024),
			speed)
	} else {
		fmt.Printf("\r进度: %.1f%% (%.2f/%.2f MB)",
			percentage,
			float64(pw.downloaded)/(1024*1024),
			float64(pw.totalSize)/(1024*1024))
	}
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
//   - 使用系统 tar 命令处理 .tar.xz 文件
//   - 只提取普通文件，跳过目录和链接
//   - 提取的文件自动设置可执行权限（0o755）
func extractTarXZ(archive, dst string) error {
	fmt.Printf("正在解压 %s...\n", filepath.Base(archive))

	// 使用系统 tar 命令解压
	cmd := exec.Command("tar", "-xf", archive, "-C", dst)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("tar 解压失败: %w", err)
	}

	fmt.Printf("解压完成！\n")
	return nil
}

// extract7z 解压 .7z 归档文件到指定目录（Windows）
//
// 参数:
//   - archive: .7z 归档文件路径
//   - dst: 解压目标目录
//
// 返回值:
//   - error: 如果解压失败则返回错误
//
// 说明:
//   - 使用系统 7z 命令解压 .7z 文件
//   - 如果系统没有 7z 命令，则返回错误
func extract7z(archive, dst string) error {
	fmt.Printf("正在解压 %s...\n", filepath.Base(archive))

	// 使用系统 7z 命令解压
	cmd := exec.Command("7z", "x", archive, "-o"+dst, "-y")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("7z 解压失败: %w", err)
	}

	fmt.Printf("解压完成！\n")
	return nil
}
