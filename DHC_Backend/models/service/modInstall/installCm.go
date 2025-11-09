package modinstall

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/infoGet"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

// 自动安装 Content Manager 并解压到 windows 桌面文件夹
// 返回 CM 解压路径 和 错误
// TODO: 实现显示下载进度
func InstallCm() (string, error) {
	funcIdt := "-modInstall.InstallCm-"
	// 下载地址：https://acstuff.ru/app/latest.zip 压缩包下载到 DHC_Backend/resources/cache/cm/zip/

	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return "", fmt.Errorf("%s获取后端根目录失败", funcIdt)
	}

	url := "https://acstuff.ru/app/latest.zip"
	cmDirFilepath := filepath.Join(backendRootPath, "resources", "cache", "cm")
	tmpFilepath := filepath.Join(cmDirFilepath, "zip")
	err = os.MkdirAll(tmpFilepath, 0755)
	if err != nil {
		return "", fmt.Errorf("%s创建目录失败: %s", funcIdt, err)
	}
	tmpFilePath := filepath.Join(tmpFilepath, "latest.zip")
	f, err := os.Create(tmpFilePath)
	if err != nil {
		return "", fmt.Errorf("%s文件保存出错: %s", funcIdt, err)
	}
	defer f.Close()

	res, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("%s文件下载出错: %s", funcIdt, err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s文件下载失败，状态码: %d", funcIdt, res.StatusCode)
	}

	_, err = io.Copy(f, res.Body)
	if err != nil {
		return "", fmt.Errorf("%s文件保存出错: %s", funcIdt, err)
	}

	DecompDstPath := filepath.Join(cmDirFilepath, "unzip")
	// 调用解压缩工具解压缩到 DHC_Backend/resources/cache/cm/unzip/
	DecompOption := decompression.DecompressionOptions{
		SrcPath:             tmpFilePath,
		FilePassword:        "",
		IsMod:               false,
		DftPathGetModOrPath: "",
		DstFilePath:         DecompDstPath,
	}

	_, errorTiming, err := decompression.DecompressionWithOptions(DecompOption)
	if errorTiming != "" || err != nil {
		return "", fmt.Errorf("%s解压失败:errorTiming:%s, err:%s", funcIdt, errorTiming, err)
	}

	// 将CM剪切到桌面文件夹（开发环境下剪切到 DHC_Backend/test/simEnv/windows_finder/desktop 下进行模拟）
	// CM文件名: Content Manager.exe
	var dstFilePath string
	isDevMode := infoGet.IsDevModeGet()
	if isDevMode {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM")
	} else {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "Windows_finder", "desktop", "CM")
		// TODO：补充非开发模式下获取 windows desktop 路径函数
	}

	// 确保目标目录存在
	err = os.MkdirAll(dstFilePath, 0755)
	if err != nil {
		return "", fmt.Errorf("%s创建目标目录失败: %s", funcIdt, err)
	}

	cmExePath := filepath.Join(DecompDstPath, "Content Manager.exe")
	movedCmExePath := filepath.Join(dstFilePath, "Content Manager.exe")
	err = os.Rename(cmExePath, movedCmExePath)
	if err != nil {
		return "", fmt.Errorf("%s移动文件失败: %s", funcIdt, err)
	}

	fmt.Println("CM已成功安装到:", movedCmExePath)
	return movedCmExePath, nil
}
