package decompression

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// OverrideControlConfig 覆盖控制配置结构体
type DhcFileTagConfig struct {
	ModType       string        `json:"ModType"`
	DefaultAction DefaultAction `json:"defaultAction"`
	Rules         []Rule        `json:"rules"`
}

// DefaultAction 默认操作结构体
type DefaultAction struct {
	Action string `json:"action"`
	Backup bool   `json:"backup"`
}

// Rule 规则结构体
type Rule struct {
	Pattern string `json:"pattern"`
	Action  string `json:"action"`
	Backup  bool   `json:"backup"`
}

// 将解压后文件复制到目标目录 覆盖/跳过同名项目 支持警告或不警告 被覆盖项目备份和还原 记录重点事件（覆盖信息、覆盖时间戳）
// 源文件目录 目标复制目录 dft文件
func OverrideControl(srcDir string, dstDir string, dftPath string) error {

	// --- 现在编写部分 ---

	// 解码文件
	config, err := decodeDhcFileTagConfig(dftPath)
	if err != nil {
		return fmt.Errorf("解码覆盖控制配置文件失败: %v", err)
	}

	// 分离出指定默认属性
	defaultAction := config.DefaultAction
	modType := config.ModType
	rules := config.Rules

	// 打印调试信息
	fmt.Printf("模组类型: %s\n", modType)
	fmt.Printf("默认操作: %s, 备份: %t\n", defaultAction.Action, defaultAction.Backup)
	fmt.Printf("规则数量: %d\n", len(rules))
	for i, rule := range rules {
		fmt.Printf("规则 %d: 模式=%s, 操作=%s, 备份=%t\n", i+1, rule.Pattern, rule.Action, rule.Backup)
	}

	// 辨别是否存在任何需备份文件（包含默认和指定路径操作）如果是那么创建备份文件夹
	if defaultAction.Backup || func() bool {
		for _, rule := range rules {
			if rule.Backup {
				fmt.Printf("规则模式 '%s' 需要备份\n", rule.Pattern)
				return true
			}
		}
		return false
	}() {
		if err := createBackupDirectory(modType, dstDir); err != nil {
			return fmt.Errorf("创建备份目录失败: %v", err)
		}
	}

	// --- 以后完成 ---
	// 遍历每一个文件并进行操作

	// 检测是否符合路径规则 如果是就按照操作执行 否则按照指定默认属性执行

	// 完成后输出信息

	return nil
}

// decodeOverrideControlConfig 解码覆盖控制配置文件
func decodeDhcFileTagConfig(dftPath string) (*DhcFileTagConfig, error) {
	// 检查文件是否存在
	if _, err := os.Stat(dftPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("配置文件不存在: %s", dftPath)
	}

	// 读取文件内容
	fileData, err := os.ReadFile(dftPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %v", err)
	}

	// 解码 JSON
	var config DhcFileTagConfig
	if err := json.Unmarshal(fileData, &config); err != nil {
		return nil, fmt.Errorf("解析 JSON 配置失败: %v", err)
	}

	return &config, nil
}

// ---备份处理部分---

// - 备份场景
// - 用户安装失败后 再次安装成功 那么需要删除备份
// - 备份操作应该被显示出来 并且应该被用户手动删除 所以不进行自动垃圾回收（从备份恢复场景以外）
// - 首次安装：无需备份｜重新安装以修复：无需备份｜更新且原版本可用：需要备份
// - 需要提供多备份 用版本号区分

// - 备份被删除后 序列号会乱掉 怎么办

// createBackupDirectory 创建备份目录
func createBackupDirectory(modType string, needBackupPath string) error {

	// 备份保存目录示例: rootpath/resources/backup/Map/shutoko_backup_01
	// 使用 filepath 包来处理跨平台路径

	// 获取后端根目录
	rootPath, err := GetBackendRootPath()
	if err != nil {
		return fmt.Errorf("获取根目录路径失败: %v", err)
	}

	// 从 needBackupPath 提取最后一个路径名
	lastPathName := filepath.Base(needBackupPath)

	// 构造完整路径: rootpath/resources/backup/(modType)/(最后一个路径名)
	backupPath := filepath.Join(rootPath, "resources", "backup", modType, lastPathName)

	// 在最后的目录名末尾加上 "_backup"
	backupPath = backupPath + "_backup"

	// 检查存在目录的版本号 格式：example_backup_01, example_backup_02, ...
	// 获取父目录路径
	parentDir := filepath.Dir(backupPath)
	baseName := filepath.Base(backupPath)

	// 读取父目录中的所有文件和目录
	entries, err := os.ReadDir(parentDir)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("无法读取目录 %s: %v", parentDir, err)
	}

	// 查找所有匹配 baseName_数字 格式的目录
	maxVersion := 0
	pattern := baseName + "_"

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		name := entry.Name()
		// 检查是否以 pattern 开头
		if strings.HasPrefix(name, pattern) {
			// 提取版本号部分
			versionStr := strings.TrimPrefix(name, pattern)
			// 尝试解析为整数
			if version, err := strconv.Atoi(versionStr); err == nil {
				if version > maxVersion {
					maxVersion = version
				}
			}
		}
	}

	// 生成新的版本号
	var backupDir string
	if maxVersion == 0 {
		// 不存在任何备份，使用 _01
		backupDir = backupPath + "_01"
	} else {
		// 存在备份，使用最大版本号+1
		backupDir = fmt.Sprintf("%s_%02d", backupPath, maxVersion+1)
	}

	// 创建备份目录
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return fmt.Errorf("无法创建备份目录 %s: %v", backupDir, err)
	}

	fmt.Printf("成功创建备份目录: %s\n", backupDir)
	return nil
}
