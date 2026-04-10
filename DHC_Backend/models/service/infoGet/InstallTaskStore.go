package infoGet

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

const maxHistoryTasks = 50

// CategorySnapshot 是 categoryProgress 的持久化投影。
type CategorySnapshot struct {
	CategoryID     string  `json:"categoryId"`
	CategoryName   string  `json:"categoryName"`
	Status         string  `json:"status"`
	Progress       float64 `json:"progress"`
	CurrentItem    string  `json:"currentItem,omitempty"`
	TotalItems     int     `json:"totalItems,omitempty"`
	CompletedItems int     `json:"completedItems,omitempty"`
	SubProgress    float64 `json:"subProgress"`
}

// InstallTaskRecord 是 installTask 的可持久化投影，不含运行时状态（demoPace 等）。
type InstallTaskRecord struct {
	ID         string                       `json:"id"`
	SetID      string                       `json:"setId"`
	Status     string                       `json:"status"`
	StartTime  int64                        `json:"startTime"`
	EndTime    *int64                       `json:"endTime,omitempty"`
	Error      string                       `json:"error,omitempty"`
	Categories map[string]*CategorySnapshot `json:"categories"`
}

func installTasksFilePath() (string, error) {
	root, err := GetBackendRootPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(root, "Database", "InstallTasks.json"), nil
}

// LoadInstallTasks 从 Database/InstallTasks.json 加载历史任务列表。
// 文件缺失或为空时返回空切片。
func LoadInstallTasks() ([]InstallTaskRecord, error) {
	path, err := installTasksFilePath()
	if err != nil {
		return nil, err
	}
	if !IsFileOrDirExists(path) {
		return nil, nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取 InstallTasks.json 失败: %w", err)
	}
	if len(data) == 0 {
		return nil, nil
	}
	var records []InstallTaskRecord
	if err := json.Unmarshal(data, &records); err != nil {
		return nil, fmt.Errorf("解析 InstallTasks.json 失败: %w", err)
	}
	return records, nil
}

// SaveInstallTasks 将任务列表序列化写入 Database/InstallTasks.json。
// 自动淘汰超出 maxHistoryTasks 的旧记录（按 StartTime 降序保留最近的）。
func SaveInstallTasks(records []InstallTaskRecord) error {
	if len(records) > maxHistoryTasks {
		sort.Slice(records, func(i, j int) bool {
			return records[i].StartTime > records[j].StartTime
		})
		records = records[:maxHistoryTasks]
	}

	path, err := installTasksFilePath()
	if err != nil {
		return err
	}
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("创建 Database 目录失败: %w", err)
	}
	out, err := json.MarshalIndent(records, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化 InstallTasks 失败: %w", err)
	}
	if err := os.WriteFile(path, out, 0644); err != nil {
		return fmt.Errorf("写入 InstallTasks.json 失败: %w", err)
	}
	return nil
}

// RecoverInterruptedTasks 将 installing/preparing 状态的任务标记为 interrupted，
// 用于进程非正常退出后的启动恢复。返回修正后的完整列表。
func RecoverInterruptedTasks(records []InstallTaskRecord) []InstallTaskRecord {
	for i := range records {
		if records[i].Status == "installing" || records[i].Status == "preparing" {
			records[i].Status = "interrupted"
			records[i].Error = "进程异常退出，任务被中断"
		}
	}
	return records
}
