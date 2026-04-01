package decompression

import (
	"DHC_Backend/models/service/infoGet"
	"DHC_Backend/models/service/types"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// DhcFileTag 文件Tag结构体，用于识别模组类型。
// 历史上 dft 是 dhcFileTag 的缩写，现统一落在 dft.json 中。
type DhcFileTag struct {
	ModType string `json:"modType"`
}

// DhcFileTagConfig dft配置结构体
type DhcFileTagConfig struct {
	ModType              string        `json:"modType"`
	DefaultAction        DefaultAction `json:"defaultAction"`
	Rules                []Rule        `json:"rules"`
	OverwriteStartingDir string        `json:"overwriteStartingDir"`
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
	NewName string `json:"newName"`
}

// DhcFileTagIdentify 文件Tag识别
func DhcFileTagIdentify(dftJsonPath string) (DhcFileTag, error) {
	funcIdt := "-service.decompression.DhcFileTagIdentify-"

	if exist := infoGet.IsFileOrDirExists(dftJsonPath); !exist {
		// TODO:将这里修改为如果路径不存在就中止，只有在目录存在但是找不到
		return DhcFileTag{}, errors.New("notFound")
	}

	dhcFileTagJsonFile, err := os.Open(dftJsonPath)
	if err != nil {
		fmt.Printf("%s在os.Open()%s出现错误:\n%s", funcIdt, dftJsonPath, err)
		return DhcFileTag{}, fmt.Errorf("%s在os.Open()%s出现错误:\n%s", funcIdt, dftJsonPath, err)
	}
	defer dhcFileTagJsonFile.Close()

	// 解码并识别文件类型
	var dft DhcFileTag
	dhcFileTagDecode := json.NewDecoder(dhcFileTagJsonFile)
	err = dhcFileTagDecode.Decode(&dft)
	if err != nil {
		return DhcFileTag{}, fmt.Errorf("%s在解码dhcFileTagFile:%s出现错误:\n%s", funcIdt, dftJsonPath, err)
	}

	return dft, nil
}

// DecodeDhcFileTagConfig 解码覆盖控制配置文件
func DecodeDhcFileTagConfig(dftJsonPath string) (*DhcFileTagConfig, error) {
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

	// 覆盖路径默认值设定
	if config.OverwriteStartingDir == "" {
		config.OverwriteStartingDir = "content"
	}

	return &config, nil
}

// GetDftPath 根据 DftPathGetModOrPath 类型获取 dft 文件路径
func GetDftPath(srcPath string, unDecompressionPath string, d types.DftPathGetModOrPath) string {
	switch d {
	case types.DftPathFromDir:
		// 使用层级查找逻辑：mod -> pkg -> 大类（优先级从高到低）
		return FindDftJsonWithPriority(filepath.Dir(srcPath))
	case types.DftPathFromCompressRoot:
		return filepath.Join(unDecompressionPath, "dft.json")
	default:
		return string(d)
	}
}

// FindDftJsonWithPriority 按优先级查找 dft.json 文件
// 参数： - mod 目录在系统中的路径
// 返回值：最高层级的 modPath 的路径
// 优先级：mod级别 > pkg级别 > 大类级别（级别越高权限越高）
// 路径结构：resources/{resourceType}/{pkg}/{mod}/
// 查找顺序：
//  1. resources/{resourceType}/{pkg}/{mod}/dft.json  (mod级别，最高优先级)
//  2. resources/{resourceType}/{pkg}/dft.json       (pkg级别)
//  3. resources/{resourceType}/dft.json              (大类级别，最低优先级)
//
// 返回找到的第一个存在的 dft.json 路径，如果都不存在则返回 mod 级别的路径
func FindDftJsonWithPriority(modPath string) string {
	// 标准化路径
	modPath = filepath.Clean(modPath)

	// 1. 首先检查 mod 级别的 dft.json（最高优先级）
	modLevelPath := filepath.Join(modPath, "dft.json")
	if _, err := os.Stat(modLevelPath); err == nil {
		return modLevelPath
	}

	// 2. 检查 pkg 级别的 dft.json
	// 从 mod 路径向上跳一级到 pkg 路径
	pkgPath := filepath.Dir(modPath)
	if pkgPath != modPath && pkgPath != "." && pkgPath != "/" {
		pkgLevelPath := filepath.Join(pkgPath, "dft.json")
		if _, err := os.Stat(pkgLevelPath); err == nil {
			return pkgLevelPath
		}
	}

	// 3. 检查大类级别的 dft.json
	// 从 pkg 路径向上跳一级到大类路径
	typePath := filepath.Dir(pkgPath)
	if typePath != pkgPath && typePath != "." && typePath != "/" {
		typeLevelPath := filepath.Join(typePath, "dft.json")
		if _, err := os.Stat(typeLevelPath); err == nil {
			return typeLevelPath
		}
	}

	// 如果都不存在，返回 mod 级别的路径（让调用方处理文件不存在的情况）
	return modLevelPath
}
