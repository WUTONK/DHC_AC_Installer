package decompression

import (
	infoGet "DHC_Backend/models/service/infoGet"
	sevenZipBootStrapSimple "DHC_Backend/pkg/sevenzipbootstrap_simple"
	"bytes"
	"encoding/json"
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

// ---函数说明---
// 返回 7z 路径
// isTestSz 选择是否进行 7z 解压缩测试
func Get7zPath(isTestSz bool) string {

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
	dirSize, err := infoGet.GetDirSize(szPath)
	if err != nil || dirSize < 5000000 {
		fmt.Printf("目标目录存在但完整性检查未通过 开始安装")
		fmt.Printf("now szpath:%s, dirSize:%d", szPath, dirSize)
		SzInstall()
	}

	// 通过检测后调用进行简单解压缩测试并且捕获异常
	fmt.Printf("7z路径: %s\n", szPath)

	if isTestSz {
		szTestResult := SzTest()

		if szTestResult != "PASS" {
			// 有异常 处理
		}

		fmt.Printf("7z解压缩测试通过")
		// 无异常 打印日志 返回绝对路径并写入

	}

	return szPath
}

func SzTest() string {
	// 写入 1.txt 和 2.txt , 内容分别为 lena 和 wutonk
	backendAbsPath, getBackendAbsPathErr := GetBackendRootPath()
	if getBackendAbsPathErr != nil {
		fmt.Printf("获取后端根目录失败,errInfo:%s", getBackendAbsPathErr)
	}
	szPath := Get7zPath(false)
	szTestPath := filepath.Join(backendAbsPath, "models", "tools", "7z", "szFunctionTestFile")

	// 确保测试目录存在
	if err := os.MkdirAll(szTestPath, 0755); err != nil {
		fmt.Printf("创建测试目录失败,errInfo:%s", err)
		return "FAIL"
	}

	if err := os.WriteFile(filepath.Join(szTestPath, "1.txt"), []byte("lena"), 0666); err != nil {
		fmt.Printf("创建1.txt压缩测试文件失败,errInfo:%s", err)
		return "FAIL"
	}
	if err := os.WriteFile(filepath.Join(szTestPath, "2.txt"), []byte("wutonk"), 0666); err != nil {
		fmt.Printf("创建2.txt压缩测试文件失败,errInfo:%s", err)
		return "FAIL"
	}

	// 创建7z可执行文件路径
	szExecutable := filepath.Join(szPath, "7zz")
	if runtime.GOOS == "windows" {
		szExecutable = filepath.Join(szPath, "7z.exe")
	}

	// 创建压缩命令1：创建7z格式压缩包
	cmd1 := exec.Command(szExecutable, "a", "szTest_7z.7z", "1.txt", "2.txt")
	cmd1.Dir = szTestPath // 设置工作目录
	var stdout1, stderr1 bytes.Buffer
	cmd1.Stdout = &stdout1
	cmd1.Stderr = &stderr1

	err1 := cmd1.Run()
	outStr1, errStr1 := stdout1.String(), stderr1.String()
	fmt.Printf("7z压缩命令1输出: %s, 错误: %s\n", outStr1, errStr1)

	// 创建压缩命令2：创建zip格式压缩包
	cmd2 := exec.Command(szExecutable, "a", "-tzip", "szTest_zip.zip", "1.txt", "2.txt")
	cmd2.Dir = szTestPath // 设置工作目录
	var stdout2, stderr2 bytes.Buffer
	cmd2.Stdout = &stdout2
	cmd2.Stderr = &stderr2

	err2 := cmd2.Run()
	outStr2, errStr2 := stdout2.String(), stderr2.String()
	fmt.Printf("7z压缩命令2输出: %s, 错误: %s\n", outStr2, errStr2)

	// 检查命令执行结果
	if err1 != nil || err2 != nil {
		fmt.Printf("压缩测试失败: cmd1错误=%v, cmd2错误=%v\n", err1, err2)
		return "FAIL"
	}

	return "PASS"
}

// TODO: 写出智能识别函数

type DhcFileTag struct {
	ModType string `json:"ModType"`
}

// 文件Tag识别
func DhcFileTagIdentify(sourceFilePath string) (DhcFileTag, error) {
	funcIdt := "-service.decompression.DhcFileTagIdentify-"

	dhcFileTagJsonPath := filepath.Join(sourceFilePath, "dhcFileTag.json")
	if exist := infoGet.IsExists(dhcFileTagJsonPath); !exist {
		return DhcFileTag{}, fmt.Errorf("%s在%s目录下没有找到dhcFileTag.json", funcIdt, sourceFilePath)
	}

	dhcFileTagJsonFile, err := os.Open(dhcFileTagJsonPath)
	if err != nil {
		return DhcFileTag{}, fmt.Errorf("%s在os.Open()%s出现错误:\n%s", funcIdt, dhcFileTagJsonPath, err)
	}
	defer dhcFileTagJsonFile.Close()

	// 解码并识别文件类型
	var dft DhcFileTag
	dhcFileTagDecode := json.NewDecoder(dhcFileTagJsonFile)
	err = dhcFileTagDecode.Decode(&dft)
	if err != nil {
		return DhcFileTag{}, fmt.Errorf("%s在解码dhcFileTagFile:%s出现错误:\n%s", funcIdt, dhcFileTagJsonPath, err)
	}

	return dft, nil

}

// 解压功能 支持.zip / .7z / .rar等压缩格式，解压后放在 rootpath/resources/(标记类型)/(文件名) 目录下，例如 rootpath/resources/mod/shutokoMap
// 来源路径 标记类型
// func Decompression(sourceFilePath string, dstPath string) {
// 	funcIdt := "-service.decompression.Decompression-"

// 	// 识别压缩文件类型 可识别是否为分卷 是否为未压缩文件

// 	isUncompressedFile := false //是否为压缩文件
// 	isVolume := false           //是否为分卷
// 	comparableType := ""        //压缩类型

// 	// 先拆分出文件名
// 	fileInfo, fileInfoErr := os.Stat(sourceFilePath)
// 	if fileInfoErr != nil {
// 		fmt.Printf("%s 无法获取fileInfo",funcIdt)
// 	}
// 	fileName := fileInfo.Name()

// 	// 通过 `.` 分割文件名字符串并获取最后后缀
// 	fileNameList := strings.Split(fileName, ".")
// 	lastSuffix := fileNameList[len(fileNameList)]

// 	// 首先识别是不是zip/7z/rar的非分卷 如果不是 匹配剩下的4种情况
// 	if lastSuffix!="7z" && lastSuffix!="zip"{
// 		if lastSuffix=="rar" {

// 		}else{
// 			// 鉴定为非压缩文件或不受支持的压缩格式 直接复制一份到 dstPath
// 			_,err := io.Copy(dstPath,sourceFilePath)
// 			if err != nil{
// 				fmt.Printf("%s复制非压缩文件或不受支持的压缩格式文件时产生错误",funcIdt)
// 			}
// 		}
// 	}

// 是否为分卷格式识别
// switch lastSuffix{
// 	case
// }

// zip分卷格式：file.z01, file.z02
// 7z分卷格式： file.7z.001, file.7z.002
// rar分卷格式 file.part1.rar, file.part2.rar

// 非压缩文件格式识别
// }

// 将解压后文件复制到目标目录 覆盖/跳过同名项目 支持警告或不警告 被覆盖项目备份和还原 记录重点事件（覆盖信息、覆盖时间戳）
// cover
// 源文件目录 目标复制目录
func cover(SourceDir string, TargetDir string) {

}
