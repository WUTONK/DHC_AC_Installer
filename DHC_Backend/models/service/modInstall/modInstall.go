package modInstall

import (
	"fmt"
	"path/filepath"
	"runtime"
)

// 实现解压缩和安装功能
// >)功能注释：旨在提供类似手动安装操作体验的操作接口（ winrar 式的解压互动逻辑，windows finder 式的覆盖互动逻辑）
// >)解压相关 - 支持.zip / .7z / .rar等压缩格式，解压后放在 rootpath/resources/(标记类型)/(文件名) 目录下，例如 rootpath/resources/mod/shutokoMap
// >)覆盖相关 - 支持覆盖/跳过同名目录或取消操作、覆盖警告模式（不警告、警告）被覆盖目录备份和还原，记录重点事件 (覆盖信息、安装时间戳)

// 检测 7zip 路径并添加 如果不存在就下载

func GetBackendRootPath() (string, error) {
	// 获取当前文件的路径 从而获得项目根目录
	_, filename, _, _ := runtime.Caller(0)

	fmt.Println("当前文件路径:", filename)

	// 获取文件所在目录
	dir := filepath.Dir(filename)

	// 往上跳伞级目录获取项目后端根目录
	// modInstall/ -> service/ -> models/ -> DHC_Backend/
	rootPath := filepath.Join(dir, "..", "..", "..")

	// 获取绝对路径
	absPath, err := filepath.Abs(rootPath)
	if err != nil {
		fmt.Printf("获取绝对路径失败: %v\n", err)
		return "", err
	}

	fmt.Println("项目后端根目录:", absPath)
	return absPath, nil
}

func Get7zPath() string {

	// 检测7z路径是否存在 不存在就安装

	// 检测7z是否和系统版本符合，是否为需要的版本

	// 通过检测后调用进行简单解压缩测试并且捕获异常

	// 无异常 打印日志 返回绝对路径并写入

	return ""
}
