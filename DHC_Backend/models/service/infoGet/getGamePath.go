package infoGet

import (
	"fmt"
	"log"
	"path/filepath"
	"runtime"
)

type envType string

const (
	simEnvHasDlc envType = "simEnvhasDlc"
	simEnvnoDlc  envType = "simEnvnoDlc"
	tureEnv      envType = "tureEnv" // 用户本地游戏环境
)

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
	case simEnvHasDlc:
		gamePath = filepath.Join(backendDir, "test", "simEnv", "acRoot", "AC_SKELETON_HASDLC", "Assetto Corsa")
		return gamePath, nil
	case simEnvnoDlc:
		// TODO:补充无 DLC 环境
	case tureEnv:
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
