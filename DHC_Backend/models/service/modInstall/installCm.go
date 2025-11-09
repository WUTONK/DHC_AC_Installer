package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

// 自动安装 Content Manager 并解压到 windows 桌面文件夹
func installCm() error {
	funcIdt := "-modInstall/installCm-"
	// 下载地址：https://acstuff.ru/app/latest.zip

	var isDev bool
	isDevMode := infoGet.IsDevModeGet()

	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return fmt.Errorf("%s获取后端根目录失败", funcIdt)
	}

	url := "https://acstuff.ru/app/latest.zip"
	tmpFilepath := filepath.Join(backendRootPath, "resources", "cache", "cm")
	var dstFilePath string
	if isDevMode {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM")
	} else {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM")
		// TODO：补充非开发模式下获取 windows desktop 路径函数
	}
	os.MkdirAll(tmpFilepath, 0755)
	f, err := os.Create(dstFilePath)

	res, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("%s文件下载出错", funcIdt)
	}

	// 调用解压缩工具解压缩到 DHC_Backend/resources/cache/cm

	// 剪切到桌面文件夹（开发环境下剪切到 DHC_Backend/test/simEnv/windows_finder/desktop 下进行模拟）

	return nil
}
