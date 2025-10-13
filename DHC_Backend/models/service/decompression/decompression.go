package decompression

import (
	"DHC_Backend/models/service/infoGet"
	sevenZipBootStrapSimple "DHC_Backend/pkg/sevenzipbootstrap_simple"
	"fmt"
	"os"
	"os/exec"
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
	backendAbsPath, err := filepath.Abs(rootPath)
	if err != nil {
		fmt.Printf("获取绝对路径失败: %v\n", err)
		return "", err
	}

	fmt.Println("项目后端根目录:", backendAbsPath)
	return backendAbsPath, nil
}

func SzInstall() {
	targetFolder := infoGet.GetSysInfo().OsType
	fmt.Printf("系统类型: %+v\n", targetFolder)

	backendAbsPath, err := GetBackendRootPath()
	if err != nil {
		fmt.Printf("获取根目录失败 error:%s", err)
		return
	}

	installPath := filepath.Join(backendAbsPath, "models", "tools", "7z", targetFolder)
	sevenZipBootStrapSimple.EnsureSevenZipSimple(installPath, "")
}

func Get7zPath() string {

	// 检测7z目录下是否有和系统类型符合的版本 不存在就安装

	targetFolder := infoGet.GetSysInfo().OsType
	fmt.Printf("系统类型: %+v\n", targetFolder)

	backendAbsPath, err := GetBackendRootPath()
	if err != nil {
		fmt.Printf("获取根目录失败 error:%s", err)
		return ""
	}

	szPath := filepath.Join(backendAbsPath, "models", "tools", "7z", targetFolder)
	_, pathStatErr := os.Stat(szPath)

	if pathStatErr != nil {
		fmt.Printf("目标目录不存在 开始安装")
		SzInstall()
	}

	// 完整性检测 检查目录下所有文件的总大小
	dirSize, err := getDirSize(szPath)
	if err != nil || dirSize < 5000000 {
		fmt.Printf("目标目录存在但完整性检查未通过 开始安装")
		fmt.Printf("now szpath:%s, dirSize:%d", szPath, dirSize)
		SzInstall()
	}

	// 通过检测后调用进行简单解压缩测试并且捕获异常
	fmt.Printf("7z路径: %s\n", szPath)

	// szTestResult := SzTest()

	// if szTestResult != "PASS" {
	// 	// 有异常 处理
	// }

	// 无异常 打印日志 返回绝对路径并写入

	return szPath
}

func SzTest() string {
	// 写入 1.txt 和 2.txt , 内容分别为 lena 和 wutonk
	backendAbsPath, getBackendAbsPathErr := GetBackendRootPath()
	if getBackendAbsPathErr != nil {
		fmt.Printf("获取后端根目录失败,errInfo:%s", getBackendAbsPathErr)
	}
	SzTestPath := filepath.Join(backendAbsPath, "models", "tools", "7z", "szFunctionTestFile")

	if err := os.WriteFile(filepath.Join(SzTestPath, "1.txt"), []byte("lena"), 0666); err != nil {
		fmt.Printf("创建1.txt压缩测试文件失败,errInfo:%s", err)
	}
	if err := os.WriteFile(filepath.Join(SzTestPath, "2.txt"), []byte("wutonk"), 0666); err != nil {
		fmt.Printf("创建1.txt压缩测试文件失败,errInfo:%s", err)
	}

	// TODO:写完测试逻辑
	szPath := Get7zPath()
	exec.Command(szPath, "a", "szTest_7z.7z", "1.txt", "2.txt")
	exec.Command(szPath, "a", "-tzip", "szTest_zip.7z", "1.txt", "2.txt")

	return "PASS"
}

// getDirSize 计算目录下所有文件的总大小
func getDirSize(dirPath string) (int64, error) {
	var totalSize int64

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			totalSize += info.Size()
		}
		return nil
	})

	return totalSize, err
}
