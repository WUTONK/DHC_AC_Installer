package decompression

import (
	"encoding/json"
	"fmt"
	"os"
)

// OverrideControlConfig 覆盖控制配置结构体
type OverrideControlConfig struct {
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
	config, err := decodeOverrideControlConfig(dftPath)
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

	// --- 以后完成 ---
	// 辨别是否存在任何需备份文件（包含默认和指定路径操作）如果是那么创建备份文件夹

	// 遍历每一个文件并进行操作

	// 检测是否符合路径规则 如果是就按照操作执行 否则按照指定默认属性执行

	// 完成后输出信息

	return nil
}

// decodeOverrideControlConfig 解码覆盖控制配置文件
func decodeOverrideControlConfig(dftPath string) (*OverrideControlConfig, error) {
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
	var config OverrideControlConfig
	if err := json.Unmarshal(fileData, &config); err != nil {
		return nil, fmt.Errorf("解析 JSON 配置失败: %v", err)
	}

	return &config, nil
}
