package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ==============================
// 开发模拟环境（SimEnv）工具函数
// ==============================
//
// 这些函数服务于 DEMO 安装流程，用于在 test/simEnv 目录下安全地写入模拟文件。
// 生产环境中不应调用这些函数（有 assertDevGamePathSafe 保护）。

// assertDevGamePathSafe 断言：当前运行环境允许写入 simEnv。
func assertDevGamePathSafe() (string, error) {
	if !infoGet.IsDevModeGet() {
		return "", fmt.Errorf("DEMO 安装仅允许在开发模式下运行：请设置 DHC_DEV=true")
	}

	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		return "", fmt.Errorf("获取游戏路径失败: %w", err)
	}

	// 双重保险：要求 gamePath 一定在 test/simEnv 下。
	// infoGet 在开发模式下会返回对应目录，但这里再校验一遍更安全。
	if !strings.Contains(filepath.ToSlash(gamePath), "test/simEnv/") {
		return "", fmt.Errorf("拒绝写入非测试 simEnv 目录：%s", gamePath)
	}
	return gamePath, nil
}

// writeDemoTxt 在 content 下写入一个 txt 模拟文件。
func writeDemoTxt(gamePath string, relUnderContent string, content string) error {
	target := filepath.Join(gamePath, "content", filepath.FromSlash(relUnderContent))

	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}
	if err := os.WriteFile(target, []byte(content), 0o644); err != nil {
		return fmt.Errorf("写入模拟文件失败: %w", err)
	}
	return nil
}

// writeDemoTxtAtRoot 在游戏根目录下写入一个 txt 模拟文件（用于 extension/ 等不在 content/ 下的路径）。
func writeDemoTxtAtRoot(gamePath string, relPath string, content string) error {
	target := filepath.Join(gamePath, filepath.FromSlash(relPath))

	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}
	if err := os.WriteFile(target, []byte(content), 0o644); err != nil {
		return fmt.Errorf("写入模拟文件失败: %w", err)
	}
	return nil
}

// SimEnvDevInstallCleanup 在实验安装流程结束后调用：清空后端中间目录，并将 simEnv 下游戏目录恢复为 envBackup 基线。
// 默认无论安装成功与否都应执行（例如在 handler 里 defer），除非显式跳过回收。
//
// 参数 skipRecycle：
//   - true：跳过全部回收，保留 resources/cache、importResourceCache 与 acRoot 写入内容（调试用）。
//
// 环境变量 DHC_SIMENV_SKIP_INSTALL_CLEANUP=true 时与 skipRecycle=true 等效，便于不改调用代码保留现场。
//
// 非开发模式（DHC_DEV≠true）下为安全起见整函数为空操作（返回 nil）。
//
// TODO：真实模组 / 生产场景下，在安装成功后按次删除 resources/cache 中对应解压目录（见 decompression），
// 以及可配置临时盘；本函数仅覆盖当前测试与 simEnv 需求，保持简单。
func SimEnvDevInstallCleanup(skipRecycle bool) error {
	if skipRecycle || infoGet.ReadEnvBool("DHC_SIMENV_SKIP_INSTALL_CLEANUP", false) {
		return nil
	}
	if !infoGet.IsDevModeGet() {
		return nil
	}
	if err := ClearBackendModInstallIntermediateDirs(); err != nil {
		return err
	}
	return ResetSimEnvModDirectoriesForDevCleanup()
}
