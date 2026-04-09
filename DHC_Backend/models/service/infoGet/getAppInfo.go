package infoGet

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// 状态检测：所有状态保存在 Database/appState.json

// AppState 应用持久化状态（与 Database/appState.json 对应）
type AppState struct {
	// FirstLaunchCompleted 为 true 表示用户已完成首次启动流程（非「第一次使用」）
	FirstLaunchCompleted bool `json:"firstLaunchCompleted"`
	// ServerDisclaimer 管理「服务器入服警告弹窗」相关的持久化状态
	ServerDisclaimer ServerDisclaimerState `json:"serverDisclaimer"`
}

// ServerDisclaimerState 对应前端 ServerListPage 的入服警告弹窗状态
type ServerDisclaimerState struct {
	// ShownCount: 历史累计显示次数（达到阈值后正常模式不再显示）
	ShownCount int `json:"shownCount"`
	// DevForceShowSuppressed: 开发者调试开关，允许显示本应被阈值抑制的弹窗
	DevForceShowSuppressed bool `json:"devForceShowSuppressed"`
}

func appStateFilePath() (string, error) {
	root, err := GetBackendRootPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(root, "Database", "appState.json"), nil
}

func readAppState() (AppState, error) {
	path, err := appStateFilePath()
	if err != nil {
		return AppState{}, err
	}
	if !IsFileOrDirExists(path) {
		return AppState{}, nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return AppState{}, err
	}
	if len(data) == 0 {
		return AppState{}, nil
	}
	var state AppState
	if err := json.Unmarshal(data, &state); err != nil {
		return AppState{}, err
	}
	return state, nil
}

func writeAppState(state AppState) error {
	path, err := appStateFilePath()
	if err != nil {
		return err
	}
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("创建 Database 目录失败: %w", err)
	}
	out, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化 appState 失败: %w", err)
	}
	if err := os.WriteFile(path, out, 0644); err != nil {
		return fmt.Errorf("写入 appState.json 失败: %w", err)
	}
	return nil
}

// GetAppState 返回当前 appState.json 的完整状态；文件缺失时返回默认零值结构。
func GetAppState() (AppState, error) {
	return readAppState()
}

// UpsertServerDisclaimerState 局部更新 serverDisclaimer，其他字段保持不变。
func UpsertServerDisclaimerState(next ServerDisclaimerState) error {
	state, err := readAppState()
	if err != nil {
		return err
	}
	state.ServerDisclaimer = next
	return writeAppState(state)
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
	state, err := readAppState()
	if err != nil {
		// 兼容损坏文件场景：沿用旧行为，尽量写入 firstLaunchCompleted
		state = AppState{}
	}
	state.FirstLaunchCompleted = true
	return writeAppState(state)
}
