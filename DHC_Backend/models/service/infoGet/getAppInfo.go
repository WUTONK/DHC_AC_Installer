package infoGet

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// 状态检测：所有状态保存在 Databese/appState.json

// AppState 应用持久化状态（与 Databese/appState.json 对应）
type AppState struct {
	// FirstLaunchCompleted 为 true 表示用户已完成首次启动流程（非「第一次使用」）
	FirstLaunchCompleted bool `json:"firstLaunchCompleted"`
}

func appStateFilePath() (string, error) {
	root, err := GetBackendRootPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(root, "Databese", "appState.json"), nil
}

// IsFirstUseApp 检测是否为第一次使用 app。
// 当 appState.json 不存在、为空、解析失败或 firstLaunchCompleted 为 false 时视为首次使用。
func IsFirstUseApp() bool {
	path, err := appStateFilePath()
	if err != nil {
		return true
	}
	if !IsFileOrDirExists(path) {
		return true
	}
	data, err := os.ReadFile(path)
	if err != nil || len(data) == 0 {
		return true
	}
	var state AppState
	if err := json.Unmarshal(data, &state); err != nil {
		return true
	}
	return !state.FirstLaunchCompleted
}

// MarkFirstLaunchCompleted 将首次启动标记为已完成，写入 appState.json。
func MarkFirstLaunchCompleted() error {
	path, err := appStateFilePath()
	if err != nil {
		return err
	}
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("创建 Databese 目录失败: %w", err)
	}

	var state AppState
	if data, readErr := os.ReadFile(path); readErr == nil && len(data) > 0 {
		_ = json.Unmarshal(data, &state)
	}
	state.FirstLaunchCompleted = true

	out, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化 appState 失败: %w", err)
	}
	if err := os.WriteFile(path, out, 0644); err != nil {
		return fmt.Errorf("写入 appState.json 失败: %w", err)
	}
	return nil
}
