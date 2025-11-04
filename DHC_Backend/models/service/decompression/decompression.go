package decompression

import (
	infoGet "DHC_Backend/models/service/infoGet"
	"DHC_Backend/models/service/types"
	sevenZipBootStrapSimple "DHC_Backend/pkg/sevenzipbootstrap_simple"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// 实现解压缩和安装功能
// >)功能注释：旨在提供类似手动安装操作体验的操作接口（ winrar 式的解压互动逻辑，windows finder 式的覆盖互动逻辑）
// >)解压相关 - 支持.zip / .7z / .rar等压缩格式，解压后放在 rootpath/resources/cache/(标记类型)/(文件名) 目录下，例如 rootpath/resources/mod/shutokoMap
// >)覆盖相关 - 支持覆盖/跳过同名目录或取消操作、覆盖警告模式（不警告、警告）被覆盖目录备份和还原，记录重点事件 (覆盖信息、安装时间戳)

// 检测 7zip 路径并添加 如果不存在就下载

func SzInstall() {
	targetFolder := infoGet.GetSysInfo().OsType
	fmt.Printf("系统类型: %+v\n", targetFolder)

	backendAbsPath, err := infoGet.GetBackendRootPath()
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

	backendAbsPath, err := infoGet.GetBackendRootPath()
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
	backendAbsPath, getBackendAbsPathErr := infoGet.GetBackendRootPath()
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
	if err1 == nil {
		errStr1 = "无错误输出"
	}
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

// TODO: 写出模组类型智能识别函数

type DhcFileTag struct {
	ModType string `json:"ModType"`
}

// 文件Tag识别
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

// 解压功能 支持.zip / .7z / .rar等压缩格式
// 解压后暂存在中间目录： rootpath/resources/(模组标记类型)/(文件名) 目录 例:rootpath/resources/mod/shutokoMap 然后再复制
// 参数：- 来源路径 目标路径 文件密码 dfc文件获取方式(详见源码)
//   - 覆盖控制文件地址（为空则从sourceFile的DhcFileTag.json中读取）
//
// 返回值：-解压目录 错误时机（nil:未发生错误 | "before":复制完成中间文件前 | "after":复制完成中间文件后 ），错误信息
func Decompression(srcPath string, filePassword string, dftPathGetModOrPath types.DftPathGetModOrPath) (unDecompressionPath, errorTiming string, error error) {
	funcIdt := "-service.decompression.Decompression-"

	// 获取后端根目录
	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return "", "before", fmt.Errorf("%s获取根目录路径时发生错误: %v", funcIdt, err)
	}

	// 识别压缩文件类型 可识别是否为分卷 是否为未压缩文件
	isVolume := false    //是否为分卷
	comparableType := "" //压缩类型

	dhcFileTag := DhcFileTag{}
	szPath := Get7zPath(false) // 获取7z路径
	// 先拆分出文件名
	fileInfo, fileInfoErr := os.Stat(srcPath)
	if fileInfoErr != nil {
		return "", "before", fmt.Errorf("%s 无法获取fileInfo", funcIdt)
	}
	fileName := fileInfo.Name()

	// 获取dhcFileTag.json路径
	fmt.Printf("%s开始识别模组标记类型\n", funcIdt)
	switch dftPathGetModOrPath {
	case types.DftPathFromDir:
		dstJsonPath := filepath.Join(filepath.Dir(srcPath), "dhcFileTag.json")
		dhcFileTag, err = DhcFileTagIdentify(dstJsonPath)
	case types.DftPathFromCompressRoot:
		// TODO: 从压缩包根目录文件中读取 dhcFileTag.json
	default:
		fmt.Printf("%s 正在从指定的dftJsonPath获取信息\n", funcIdt)
		dhcFileTag, err = DhcFileTagIdentify(string(dftPathGetModOrPath))
	}
	if err != nil {
		if err.Error() == "notFound" {
			dhcFileTag.ModType = "undefined"
		} else {
			return "", "before", fmt.Errorf("%s 获取DhcFileTag时发生错误:%s", funcIdt, err)
		}
	}

	// 通过 `.` 分割文件名字符串并获取最后后缀
	fileNameList := strings.Split(fileName, ".")
	lastSuffix := fileNameList[len(fileNameList)-1]
	// 逻辑：首先识别是不是zip/7z/rar的非分卷/分卷。如果鉴定为非压缩文件或不受支持的压缩格式，那么直接复制到中间文件

	// zip分卷格式：file.z01, file.z02
	// 7z分卷格式： file.7z.001, file.7z.002
	// rar分卷格式 file.part1.rar, file.part2.rar
	fmt.Printf("开始识别文件类型\n")
	switch lastSuffix {
	case "zip":
		comparableType = "zip"
	case "7z":
		comparableType = "7z"
	case "rar":
		comparableType = "rar"
		// 识别是否为分卷 - rar分卷格式：file.part1.rar, file.part2.rar
		if len(fileNameList) >= 2 {
			secondLastSuffix := fileNameList[len(fileNameList)-2]
			if strings.HasPrefix(secondLastSuffix, "part") {
				isVolume = true
			}
		}
	default:
		// 检查是否为分卷格式
		if strings.HasPrefix(lastSuffix, "z") && len(lastSuffix) >= 3 {
			comparableType = "zip"
			isVolume = true
		} else if len(fileNameList) >= 3 {
			secondLastSuffix := fileNameList[len(fileNameList)-2]
			if secondLastSuffix == "7z" && len(lastSuffix) == 3 {
				comparableType = "7z"
				isVolume = true
			}
		}
	}

	// 打开源文件
	srcFile, err := os.Open(srcPath)
	if err != nil {
		return "", "before", fmt.Errorf("%s打开源文件失败: %v", funcIdt, err)
	}
	defer srcFile.Close()

	// 创建中间目录
	// 例:rootpath/resources/cache/Map/shutoko
	// 去掉fileName的尾缀，只保留文件名部分
	removeSuffixFilename := fileNameList[0]
	midDirPath := filepath.Join(backendRootPath, "resources", "cache", dhcFileTag.ModType, removeSuffixFilename)
	fmt.Printf("%s开始创建中间目录%s\n", funcIdt, midDirPath)

	// 确保中间目录存在
	if err := os.MkdirAll(midDirPath, 0755); err != nil {
		return "", "before", fmt.Errorf("%s创建中间目录失败: %v", funcIdt, err)
	}

	// 鉴定是否为非压缩文件或不受支持的压缩格式 如果是 直接复制一份到中间目录
	if comparableType == "" {
		// 复制一份到中间目录
		midFilePath := filepath.Join(midDirPath, fileName)
		midFile, err := os.Create(midFilePath)
		if err != nil {
			return "", "before", fmt.Errorf("%s创建中间文件失败: %v", funcIdt, err)
		}
		defer midFile.Close()

		_, err = midFile.ReadFrom(srcFile)
		if err != nil {
			return "", "before", fmt.Errorf("%s复制非压缩文件或不受支持的压缩格式文件时产生错误: %v", funcIdt, err)
		}

		// TODO:调用OverrideControl()
		return midDirPath, "", nil
	}

	// 例:rootpath/resources/mod/shutokoMap
	if !isVolume {
		// 创建7z可执行文件路径
		szExecutable := filepath.Join(szPath, "7zz")
		if runtime.GOOS == "windows" {
			szExecutable = filepath.Join(szPath, "7z.exe")
		}

		// 普通解压逻辑 - 解压到中间目录，使用-y参数自动覆盖所有文件
		cmd := exec.Command(szExecutable, "x", srcPath, "-o"+midDirPath+"/", "-y")
		cmd.Dir = backendRootPath
		var stdout, stderr bytes.Buffer
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr

		err := cmd.Run()
		outStr, errStr := stdout.String(), stderr.String()
		if err == nil {
			errStr = "无错误输出"
		}
		fmt.Printf("7z解压命令输出: %s\n 7z解压命令错误: %s\n", outStr, errStr)

		if err != nil {
			fmt.Printf("%s解压失败: 错误=%v\n", funcIdt, err)
			return "", "before", fmt.Errorf("%s解压失败: %v", funcIdt, err)
		}

		fmt.Printf("%s解压普通压缩文件并写入中间路径%s完成\n", funcIdt, midDirPath)
	} else {
		// 分卷解压逻辑
		// TODO: 实现分卷解压逻辑
		return "", "before", fmt.Errorf("%s分卷解压功能尚未实现", funcIdt)
	}

	return midDirPath, "", nil
}
