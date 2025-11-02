package decompression

import (
	"DHC_Backend/models/service/infoGet"
	"encoding/json"
	"fmt"
	"io"
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

type OverrideAction string

const (
	OverrideActionOverwrite OverrideAction = "overwrite" // 覆盖
	OverrideActionSkip      OverrideAction = "skip"      // 跳过
	OverrideActionBackup    OverrideAction = "backup"    // 备份后覆盖
	OverrideActionRename    OverrideAction = "rename"    // 重命名
	OverrideActionAsk       OverrideAction = "ask"       // 询问用户
)

type override interface {
	overwrite() error
	skip() error
	backup() error
	rename() error
	ask() error
}

type OverrideStruct struct {
}

// 接受*一个*文件并覆盖目标文件 如果目标文件不存在 它会被创建
func (o OverrideStruct) Overwrite(srcFilePath, dstFilePath string) error {
	funcIdt := "-service.decompression.Overwrite-"

	srcFile, err := os.Open(srcFilePath)
	if err != nil {
		return fmt.Errorf("%s无法打开srcfile: %v", funcIdt, err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dstFilePath)
	if err != nil {
		return fmt.Errorf("%s无法创建dstfile: %v", funcIdt, err)
	}
	defer dstFile.Close()

	bytesWritten, err := io.Copy(dstFile, srcFile)
	if err != nil {
		return fmt.Errorf("%s无法复制并覆盖srcFile:%s 到 dstFile:%s ,err:%v", funcIdt, srcFilePath, dstFilePath, err)
	}

	fmt.Printf("%s成功复制 %d 字节从 %s 到 %s\n", funcIdt, bytesWritten, srcFilePath, dstFilePath)
	return nil
}
func (o OverrideStruct) Skip() error {
	// funcIdt := "-service.decompression.Skip-"
	return nil
}

// - TODO:处理完备份场景
// - 用户安装失败后 再次安装成功 那么需要删除备份
// - 备份操作应该被显示出来 并且应该被用户手动删除 所以不进行自动垃圾回收（从备份恢复场景以外）

// - 首次安装：无需备份｜重新安装以修复：无需备份｜更新且原版本可用：需要备份
// - 需要提供多备份 用版本号区分

// - 备份被删除后 序列号会乱掉 怎么办

// Backup()接收模组类型和需备份目录路径 并存放在 rootpath/resources/backup/modType/needBackupDirName下
func (o OverrideStruct) Backup(modType string, needBackupPath string) error {
	funcIdt := "-service.decompression.Backup-"

	// 获取后端根目录
	rootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return fmt.Errorf("获取根目录路径失败: %v", err)
	}

	// 从 needBackupPath 提取最后一个路径名
	lastPathName := filepath.Base(needBackupPath)

	// 构造完整路径: rootpath/resources/backup/(modType)/(最后一个路径名)
	localBackupPath := filepath.Join(rootPath, "resources", "backup", modType, lastPathName)

	// 在最后的目录名末尾加上 "_backup"
	localBackupPath = localBackupPath + "_backup"

	// 检查存在目录的版本号 格式：example_backup_01, example_backup_02, ...
	// 获取父目录路径
	parentDir := filepath.Dir(localBackupPath)
	baseName := filepath.Base(localBackupPath)
	// dhc_backup

	// 读取父目录中的所有文件和目录
	entries, err := os.ReadDir(parentDir)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("%s无法读取目录 %s: %v", funcIdt, parentDir, err)
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
		// 匹配 dhc_backup_**
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
		backupDir = localBackupPath + "_01"
	} else {
		// 存在备份，使用最大版本号+1
		backupDir = fmt.Sprintf("%s_%02d", localBackupPath, maxVersion+1)
	}

	// 创建备份目录
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return fmt.Errorf("%s无法创建备份目录 %s: %v", funcIdt, backupDir, err)
	}

	return nil

}

// 覆盖起始目录

// 接收一个文件路径并提取出文件名 然后将传入的路径的文件改为此文件名
func (o OverrideStruct) Rename(srcFilePath, dstFilePath string) error {
	funcIdt := "-service.decompression.Rename-"
	// 获取dst去文件名路径
	dstDir := filepath.Dir(dstFilePath)
	// 读取src文件名
	srcFilename := filepath.Base(srcFilePath)
	// 合成new dstname
	newDstnamePath := dstDir + "/" + srcFilename
	// 标准化路径（统一使用 / 作为分隔符）
	err := os.Rename(dstFilePath, newDstnamePath)
	if err != nil {
		return fmt.Errorf("%s重命名操作失败 错误信息: %v", funcIdt, err)
	}

	return nil
}

func (o OverrideStruct) Ask(srcFilePath, dstFilePath string) error {
	// funcIdt := "-service.decompression.Ask-"
	return nil
}

// 将解压后文件复制到目标目录 覆盖/跳过同名项目 支持警告或不警告 被覆盖项目备份和还原 记录重点事件（覆盖信息、覆盖时间戳）
// 源文件目录 目标复制目录 dft文件
func OverrideControl(srcDirPath string, dstDirPath string, dftJsonPath string) error {

	funcIdt := "-service.decompression.overrideControl-"
	o := OverrideStruct{}

	// 解码文件
	config, err := decodeDhcFileTagConfig(dftJsonPath)
	if err != nil {
		return fmt.Errorf("解码覆盖控制配置文件失败: %v", err)
	}

	// 分离出指定默认属性
	defaultAction := config.DefaultAction
	modType := config.ModType
	rules := config.Rules
	// 根据开发/生产模式自动获取游戏路径
	_, err = infoGet.GetGamePathAuto()
	if err != nil {
		return fmt.Errorf("%s获取游戏路径失败: %v", funcIdt, err)
	}

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
		if err := o.Backup(modType, dstDirPath); err != nil {
			return fmt.Errorf("创建备份目录失败: %v", err)
		}
	}

	// 遍历每一个文件并进行操作
	entries, err := os.ReadDir(srcDirPath)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("无法读取目录 %s: %v", srcDirPath, err)
	}

	for _, entry := range entries {
		entryPath := entry.Name()
		isMatch := false
		var passMatchingRules OverrideAction
		// 检测是否符合路径规则 如果是就按照操作执行 否则按照指定默认属性执行
		for _, ruleEntry := range rules {
			isMatchCounter := 0
			if DirectoryMatching(ruleEntry.Pattern, entryPath) {
				isMatch = true
				isMatchCounter++
				if isMatchCounter > 1 {
					// TODO:处理一下匹配了多条规则的情况
					return fmt.Errorf("%s匹配到多条覆盖控制规则,发生冲突", funcIdt)
				}
				var err error
				passMatchingRules, err = stringToOverrideAction(ruleEntry.Action)
				if err != nil {
					return fmt.Errorf("%s转换操作类型失败: %v", funcIdt, err)
				}
			}
		}
		if isMatch {
			// 按照操作执行
			switch passMatchingRules {
			case OverrideActionOverwrite:
			case OverrideActionSkip:
				continue
			case OverrideActionBackup:
			case OverrideActionRename:

			case OverrideActionAsk:
				// TODO:完成Ask逻辑或者删除Ask
				continue
			}
		} else {
			// 没匹配上 按照默认操作执行
		}
		fmt.Print(entryPath)
	}

	// TODO：完成后输出信息

	return nil
}

func stringToOverrideAction(str string) (OverrideAction, error) {
	switch str {
	case "overwrite":
		return OverrideActionOverwrite, nil
	case "skip":
		return OverrideActionSkip, nil
	case "backup":
		return OverrideActionBackup, nil
	case "rename":
		return OverrideActionRename, nil
	case "ask":
		return OverrideActionAsk, nil
	default:
		return "", fmt.Errorf("未知的操作类型: %s", str)
	}
}

// DirectoryMatching 目录匹配
// rulePath: 匹配规则路径，支持通配符 * 和 **
// targetPath: 需要匹配的目标路径
// 返回: 是否匹配成功
func DirectoryMatching(rulePath, targetPath string) bool {
	// 标准化路径（统一使用 / 作为分隔符）
	rulePath = filepath.ToSlash(rulePath)
	targetPath = filepath.ToSlash(targetPath)

	// 如果规则路径以 /* 结尾，表示匹配该目录下的所有文件（不包括子目录）
	if strings.HasSuffix(rulePath, "/*") {
		// 去掉 /* 后缀
		baseDir := strings.TrimSuffix(rulePath, "/*")
		// 检查目标路径是否以这个基础目录开头
		if strings.HasPrefix(targetPath, baseDir+"/") {
			// 检测匹配后的路径是否还有下级目录
			removeDuplicatePath := targetPath[len(baseDir)+1:]
			for _, v := range removeDuplicatePath {
				if v == '/' {
					return false
				}
			}
			// 没有下级目录，匹配成功
			return true
		}
		return false
	}

	// 如果规则路径以 /** 结尾，表示递归匹配该目录下的所有文件
	if strings.HasSuffix(rulePath, "/**") {
		baseDir := strings.TrimSuffix(rulePath, "/**")
		return strings.HasPrefix(targetPath, baseDir+"/") || targetPath == baseDir
	}

	// 如果规则路径不包含路径分隔符，则只匹配文件名（例如 *.cfg 匹配任何路径下的 .cfg 文件）
	if !strings.Contains(rulePath, "/") {
		targetFileName := filepath.Base(targetPath)
		matched, err := filepath.Match(rulePath, targetFileName)
		if err != nil {
			fmt.Printf("路径匹配错误: %v\n", err)
			return false
		}
		return matched
	}

	// 使用 filepath.Match 进行标准的 glob 匹配
	matched, err := filepath.Match(rulePath, targetPath)
	if err != nil {
		fmt.Printf("路径匹配错误: %v\n", err)
		return false
	}

	return matched
}

// decodeOverrideControlConfig 解码覆盖控制配置文件
func decodeDhcFileTagConfig(dftJsonPath string) (*DhcFileTagConfig, error) {
	// 检查文件是否存在
	if _, err := os.Stat(dftJsonPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("配置文件不存在: %s", dftJsonPath)
	}

	// 读取文件内容
	fileData, err := os.ReadFile(dftJsonPath)
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
