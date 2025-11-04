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

// DhcFileTag 文件Tag结构体，用于识别模组类型
type DhcFileTag struct {
	ModType string `json:"ModType"`
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
		return filepath.Join(filepath.Dir(srcPath), "dft.json")
	case types.DftPathFromCompressRoot:
		return filepath.Join(unDecompressionPath, "dft.json")
	default:
		return string(d)
	}
}
