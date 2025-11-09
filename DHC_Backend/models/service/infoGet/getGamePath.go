package infoGet

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

type envType string

const (
	SimEnvHasDlc envType = "simEnvhasDlc" // 模拟环境（有DLC）- 测试用
	SimEnvnoDlc  envType = "simEnvnoDlc"  // 模拟环境（无DLC）- 测试用
	TureEnv      envType = "tureEnv"      // 真实用户游戏环境 - 生产用
)

// isDev 是否为开发模式，全局变量
// true = 开发模式（使用测试环境）
// false = 生产模式（使用真实游戏环境）
var isDev bool

// testEnvType 测试环境类型（仅在开发模式下使用）
var testEnvType envType

// init 初始化函数，从环境变量读取或设置默认值
func init() {
	// 读取是否为开发模式，接受 true/false（默认 false）
	isDev := IsDevModeGet()

	// 如果为开发模式，读取测试环境类型（默认 SimEnvHasDlc）
	if isDev {
		envStr := os.Getenv("DHC_TEST_ENV")
		switch envStr {
		case "simEnvnoDlc":
			testEnvType = SimEnvnoDlc
		case "simEnvhasDlc":
			testEnvType = SimEnvHasDlc
		default:
			// 默认使用有DLC的测试环境
			testEnvType = SimEnvHasDlc
		}
	}
}

// SetDev 设置开发模式（主要用于测试）
func SetDev(dev bool) {
	isDev = dev
	// 如果切换到开发模式且 testEnvType 未初始化，设置默认值
	if isDev && testEnvType == "" {
		testEnvType = SimEnvHasDlc
	}
}

func IsDevModeGet() bool {
	devStr := os.Getenv("DHC_DEV")
	if devStr == "true" {
		return true
	} else {
		return false
	}
}

// GetTestEnvType 获取测试环境类型（仅在开发模式下有效）
func GetTestEnvType() envType {
	return testEnvType
}

// SetTestEnvType 设置测试环境类型（仅在开发模式下有效）
func SetTestEnvType(et envType) {
	testEnvType = et
}

// GetGamePathAuto 根据当前模式自动选择环境类型并获取游戏路径
// 开发模式：使用测试环境（SimEnvHasDlc 或 SimEnvnoDlc）
// 生产模式：使用真实游戏环境（TureEnv）
func GetGamePathAuto() (string, error) {
	if isDev {
		// 确保 testEnvType 已初始化，如果未初始化则使用默认值
		if testEnvType == "" {
			testEnvType = SimEnvHasDlc
		}
		return GetGamePath(testEnvType)
	}
	return GetGamePath(TureEnv)
}

// GetGamePath 从注册表中获取steam安装位置，以此获取 vdf 并解析获得神力科莎安装位置
// @TODO:待在windows中进行测试
func GetGamePath(et envType) (string, error) {
	funcIdt := "-service.infoGet.GetGamePath-"

	// TODO: 实现获取游戏路径的逻辑
	backendDir, err := GetBackendRootPath()
	if err != nil {
		log.Fatal(err)
	}
	gamePath := ""

	// DHC_Backend/test/simEnv/acRoot/AC_SKELETON_HASDLC/Assetto Corsa

	switch et {
	case SimEnvHasDlc:
		gamePath = filepath.Join(backendDir, "test", "simEnv", "acRoot", "AC_SKELETON_HASDLC", "Assetto Corsa")
		return gamePath, nil
	case SimEnvnoDlc:
		// TODO:补充无 DLC 环境
	case TureEnv:
		// TODO:补充获取真实游戏环境
	default:
		return "", fmt.Errorf("%s传入envType参数未命中", funcIdt)
	}

	return "", fmt.Errorf("%s错误的执行到了末尾", funcIdt)
}

// GetBackendRootPath 返回后端项目根目录的绝对路径
func GetBackendRootPath() (string, error) {
	// 获取当前文件的路径，从而获得项目后端根目录
	_, filename, _, _ := runtime.Caller(0)

	// 获取文件所在目录
	dir := filepath.Dir(filename)

	// 往上跳三级目录获取项目后端根目录
	// infoGet/ -> service/ -> models/ -> DHC_Backend/
	rootPath := filepath.Join(dir, "..", "..", "..")

	// 获取绝对路径
	backendAbsPath, err := filepath.Abs(rootPath)
	if err != nil {
		return "", fmt.Errorf("获取绝对路径失败: %w", err)
	}

	return backendAbsPath, nil
}
