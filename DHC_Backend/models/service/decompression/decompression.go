package decompression

import (
	infoGet "DHC_Backend/models/service/infoGet"
	"DHC_Backend/models/service/servicelog"
	"DHC_Backend/models/service/types"
	sevenZipBootStrapSimple "DHC_Backend/pkg/sevenzipbootstrap_simple"
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
)

// 实现解压缩和安装功能
// >)功能注释：旨在提供类似手动安装操作体验的操作接口（ winrar 式的解压互动逻辑，windows finder 式的覆盖互动逻辑）
// >)解压相关 - 支持.zip / .7z / .rar等压缩格式，解压后放在 rootpath/resources/cache/(标记类型)/(文件名) 目录下，例如 rootpath/resources/mod/shutokoMap
// >)覆盖相关 - 支持覆盖/跳过同名目录或取消操作、覆盖警告模式（不警告、警告）被覆盖目录备份和还原，记录重点事件 (覆盖信息、安装时间戳)

// DecompressionOptions 解压配置选项
// 使用配置结构体模式来处理可选参数，这是Go中推荐的替代可选参数的方式
type DecompressionOptions struct {
	// SrcPath 源文件路径（必需）
	SrcPath string

	// FilePassword 压缩文件密码（可选，默认为空）
	FilePassword string

	// 模组解压相关选项
	// IsMod 是否为模组解压（与 DstFilePath 互斥，只能设置一个）
	IsMod bool
	// DftPathGetModOrPath 模组标记文件获取方式（仅在 IsMod=true 时使用）
	DftPathGetModOrPath types.DftPathGetModOrPath

	// 普通文件解压相关选项
	// DstFilePath 目标文件路径（与 IsMod 互斥，仅在 IsMod=false 时使用）
	DstFilePath string
}

// 检测 7zip 路径并添加 如果不存在就下载

func SzInstall() {
	targetFolder := infoGet.GetSysInfo().OsType
	servicelog.Debugf("系统类型: %+v\n", targetFolder)

	backendAbsPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		servicelog.Errorf("获取根目录失败 error:%s", err)
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
	servicelog.Debugf("系统类型: %+v\n", targetFolder)

	backendAbsPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		servicelog.Errorf("获取根目录失败 error:%s", err)
		return ""
	}

	szPath := filepath.Join(backendAbsPath, "models", "tools", "7z", targetFolder)
	_, pathStatErr := os.Stat(szPath)

	if pathStatErr != nil {
		servicelog.Debugf("目标目录不存在 开始安装")
		SzInstall()
	}

	// 完整性检测 检查目录下所有文件的总大小
	dirSize, err := infoGet.GetDirSize(szPath)
	if err != nil || dirSize < 5000000 {
		servicelog.Debugf("目标目录存在但完整性检查未通过 开始安装")
		servicelog.Debugf("now szpath:%s, dirSize:%d", szPath, dirSize)
		SzInstall()
	}

	// 通过检测后调用进行简单解压缩测试并且捕获异常
	servicelog.Debugf("7z路径: %s\n", szPath)

	if isTestSz {
		szTestResult := SzTest()

		if szTestResult != "PASS" {
			// 有异常 处理
		}

		servicelog.Debugf("7z解压缩测试通过")
		// 无异常 打印日志 返回绝对路径并写入

	}

	return szPath
}

// extractVolumeNumber 从文件名中提取分卷数字
// 支持的格式：
//   - zip分卷：file.z01, file.z02 -> 返回 1, 2
//   - 7z分卷：file.7z.001, file.7z.002 -> 返回 1, 2
//   - rar分卷：file.part1.rar, file.part2.rar -> 返回 1, 2
//
// 如果不是分卷文件或无法提取数字，返回 -1
func extractVolumeNumber(fileName string, comparableType string) int {
	fileNameList := strings.Split(fileName, ".")
	lastSuffix := fileNameList[len(fileNameList)-1]

	switch comparableType {
	case "zip":
		// zip分卷格式：file.z01, file.z02
		if strings.HasPrefix(lastSuffix, "z") && len(lastSuffix) >= 3 {
			// 提取 z 后面的数字
			numStr := lastSuffix[1:]
			num, err := strconv.Atoi(numStr)
			if err == nil {
				return num
			}
		}
	case "7z":
		// 7z分卷格式：file.7z.001, file.7z.002
		if len(fileNameList) >= 3 {
			secondLastSuffix := fileNameList[len(fileNameList)-2]
			if secondLastSuffix == "7z" && len(lastSuffix) == 3 {
				num, err := strconv.Atoi(lastSuffix)
				if err == nil {
					return num
				}
			}
		}
	case "rar":
		// rar分卷格式：file.part1.rar, file.part2.rar
		if len(fileNameList) >= 2 {
			secondLastSuffix := fileNameList[len(fileNameList)-2]
			if strings.HasPrefix(secondLastSuffix, "part") {
				// 提取 part 后面的数字
				numStr := strings.TrimPrefix(secondLastSuffix, "part")
				num, err := strconv.Atoi(numStr)
				if err == nil {
					return num
				}
			}
		}
	}

	return -1
}

// findFirstVolumeFile 在指定目录中查找第一个分卷文件（数字最小的）
// 返回第一个分卷文件的完整路径，如果未找到则返回错误
func findFirstVolumeFile(dirPath string, comparableType string) (string, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return "", fmt.Errorf("读取目录失败: %v", err)
	}

	type volumeFile struct {
		path   string
		number int
	}

	var volumeFiles []volumeFile

	// 遍历目录，找到所有分卷文件
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		fileName := entry.Name()
		volumeNum := extractVolumeNumber(fileName, comparableType)

		if volumeNum != -1 {
			volumeFiles = append(volumeFiles, volumeFile{
				path:   filepath.Join(dirPath, fileName),
				number: volumeNum,
			})
		}
	}

	if len(volumeFiles) == 0 {
		return "", fmt.Errorf("在目录 %s 中未找到分卷文件", dirPath)
	}

	// 按分卷数字排序
	sort.Slice(volumeFiles, func(i, j int) bool {
		return volumeFiles[i].number < volumeFiles[j].number
	})

	// 返回第一个分卷文件（数字最小的）
	return volumeFiles[0].path, nil
}

func SzTest() string {
	// 写入 1.txt 和 2.txt , 内容分别为 lena 和 wutonk
	backendAbsPath, getBackendAbsPathErr := infoGet.GetBackendRootPath()
	if getBackendAbsPathErr != nil {
		servicelog.Errorf("获取后端根目录失败,errInfo:%s", getBackendAbsPathErr)
	}
	szPath := Get7zPath(false)
	szTestPath := filepath.Join(backendAbsPath, "models", "tools", "7z", "szFunctionTestFile")

	// 确保测试目录存在
	if err := os.MkdirAll(szTestPath, 0755); err != nil {
		servicelog.Errorf("创建测试目录失败,errInfo:%s", err)
		return "FAIL"
	}

	if err := os.WriteFile(filepath.Join(szTestPath, "1.txt"), []byte("lena"), 0666); err != nil {
		servicelog.Errorf("创建1.txt压缩测试文件失败,errInfo:%s", err)
		return "FAIL"
	}
	if err := os.WriteFile(filepath.Join(szTestPath, "2.txt"), []byte("wutonk"), 0666); err != nil {
		servicelog.Errorf("创建2.txt压缩测试文件失败,errInfo:%s", err)
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
	servicelog.Debugf("7z压缩命令1输出: %s, 错误: %s\n", outStr1, errStr1)

	// 创建压缩命令2：创建zip格式压缩包
	cmd2 := exec.Command(szExecutable, "a", "-tzip", "szTest_zip.zip", "1.txt", "2.txt")
	cmd2.Dir = szTestPath // 设置工作目录
	var stdout2, stderr2 bytes.Buffer
	cmd2.Stdout = &stdout2
	cmd2.Stderr = &stderr2

	err2 := cmd2.Run()
	outStr2, errStr2 := stdout2.String(), stderr2.String()
	servicelog.Debugf("7z压缩命令2输出: %s, 错误: %s\n", outStr2, errStr2)

	// 检查命令执行结果
	if err1 != nil || err2 != nil {
		servicelog.Errorf("压缩测试失败: cmd1错误=%v, cmd2错误=%v\n", err1, err2)
		return "FAIL"
	}

	return "PASS"
}

// DecompressionWithOptions 使用配置结构体的解压函数（推荐使用）
// 这是改进后的API，使用配置结构体来处理可选参数，更加清晰和类型安全
//
// 示例用法：
//
//	// 模组解压
//	opts := DecompressionOptions{
//	    SrcPath: "/path/to/mod.zip",
//	    IsMod: true,
//	    DftPathGetModOrPath: types.DftPathFromDir,
//	}
//	path, timing, err := DecompressionWithOptions(opts)
//
//	// 普通文件解压
//	opts := DecompressionOptions{
//	    SrcPath: "/path/to/file.zip",
//	    DstFilePath: "/path/to/destination",
//	}
//	path, timing, err := DecompressionWithOptions(opts)
func DecompressionWithOptions(opts DecompressionOptions) (unDecompressionPath, errorTiming string, err error) {
	funcIdt := "-service.decompression.DecompressionWithOptions-"

	// 参数验证
	if opts.SrcPath == "" {
		return "", "before", fmt.Errorf("%s源文件路径不能为空", funcIdt)
	}
	if opts.IsMod && opts.DstFilePath != "" {
		return "", "before", fmt.Errorf("%sIsMod 和 DstFilePath 不能同时设置", funcIdt)
	}
	if !opts.IsMod && opts.DstFilePath == "" {
		return "", "before", fmt.Errorf("%s非模组解压时必须提供 DstFilePath", funcIdt)
	}

	// 模组解压到底要不要只能传目录而不能直接传文件？？？
	// 可以两个都保留 如果要通过目录那就使用 DecompressionModWithOptions 否则直接调用 Decompression

	// 调用原有实现
	return Decompression(
		opts.SrcPath,
		opts.FilePassword,
		opts.IsMod,
		opts.DstFilePath,
		opts.DftPathGetModOrPath,
	)
}

// 解压功能 支持.zip / .7z / .rar压缩格式 支持分卷格式：传入任意序号的分卷压缩文件 函数会自动查找第一个分卷压缩文件并从其开始解压
// 解压后暂存在中间目录： rootpath/resources/(模组标记类型)/(文件名) 目录 例:rootpath/resources/mod/shutokoMap 然后再复制
// 参数：- 来源路径 文件密码 是否为模组 目标路径 dft文件路径或dft文件获取方式(从模组目录还是从压缩包内获取)
//   - dft 是 dhcFileTag 的缩写，模组类型与覆盖规则统一从 dft.json 读取
//
// 返回值：-解压目录 错误时机（nil:未发生错误 | "before":复制完成中间文件前 | "after":复制完成中间文件后 ），错误信息
func Decompression(srcPath string, filePassword string, isMod bool, dstFilePath string, dftPathGetModOrPath types.DftPathGetModOrPath) (unDecompressionPath, errorTiming string, error error) {
	funcIdt := "-service.decompression.Decompression-"

	// 获取后端根目录
	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return "", "before", fmt.Errorf("%s获取根目录路径时发生错误: %v", funcIdt, err)
	}

	// 识别压缩文件类型 可识别是否为分卷 是否为未压缩文件
	isVolume := false          //是否为分卷
	comparableType := ""       //压缩类型
	szPath := Get7zPath(false) // 获取7z路径
	// 先拆分出文件名
	fileInfo, fileInfoErr := os.Stat(srcPath)
	if fileInfoErr != nil {
		return "", "before", fmt.Errorf("%s 无法获取fileInfo", funcIdt)
	}
	fileName := fileInfo.Name()

	var dhcFileTag DhcFileTag

	if isMod {
		// dft 是 dhcFileTag 的缩写，缓存目录和覆盖规则统一读取 dft.json。
		servicelog.Debugf("%s开始识别模组标记类型\n", funcIdt)
		switch dftPathGetModOrPath {
		case types.DftPathFromDir:
			dstJsonPath := filepath.Join(filepath.Dir(srcPath), "dft.json")
			dhcFileTag, err = DhcFileTagIdentify(dstJsonPath)
		case types.DftPathFromCompressRoot:
			// TODO: 从压缩包根目录文件中读取 dft.json
		default:
			servicelog.Debugf("%s 正在从指定的dftJsonPath获取信息\n", funcIdt)
			dhcFileTag, err = DhcFileTagIdentify(string(dftPathGetModOrPath))
		}
		if err != nil {
			if err.Error() == "notFound" {
				dhcFileTag.ModType = "undefined"
			} else {
				return "", "before", fmt.Errorf("%s 获取dft配置中的ModType时发生错误:%s", funcIdt, err)
			}
		}
	}

	// 通过 `.` 分割文件名字符串并获取最后后缀
	fileNameList := strings.Split(fileName, ".")
	lastSuffix := fileNameList[len(fileNameList)-1]
	// 逻辑：首先识别是不是zip/7z/rar的非分卷/分卷。如果鉴定为非压缩文件或不受支持的压缩格式，那么直接复制到中间文件

	// zip分卷格式：file.z01, file.z02
	// 7z分卷格式： file.7z.001, file.7z.002
	// rar分卷格式 file.part1.rar, file.part2.rar
	servicelog.Debugf("开始识别文件类型\n")
	switch lastSuffix {
	case "zip":
		comparableType = "zip"
	case "7z":
		comparableType = "7z"
	case "rar":
		comparableType = "rar"
		// 识别是否为 rar分卷 - rar分卷格式：file.part1.rar, file.part2.rar
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
	var midDirPath string
	if isMod {
		midDirPath = filepath.Join(backendRootPath, "resources", "cache", dhcFileTag.ModType, removeSuffixFilename)
	} else {
		midDirPath = dstFilePath
	}

	// 确保中间目录存在且干净
	if infoGet.IsFileOrDirExists(midDirPath) {
		servicelog.Infof("%s清理旧的中间目录: %s\n", funcIdt, midDirPath)
		os.RemoveAll(midDirPath)
	}

	if err := os.MkdirAll(midDirPath, 0755); err != nil {
		return "", "before", fmt.Errorf("%s创建中间目录失败: %v", funcIdt, err)
	}

	servicelog.Infof("%s 准备开始解压: %s -> %s\n", funcIdt, srcPath, midDirPath)

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
		if err != nil {
			servicelog.Errorf("%s解压失败: 错误=%v, 7z标准输出=%s, 7z错误输出=%s\n", funcIdt, err, outStr, errStr)
			return "", "before", fmt.Errorf("%s解压失败: %v", funcIdt, err)
		}
		servicelog.Infof("7z解压命令完成\n")

		// 统计解压后的文件数量
		files, _ := os.ReadDir(midDirPath)
		servicelog.Infof("%s解压完成，中间目录文件数: %d\n", funcIdt, len(files))
	} else {

		// 获取分卷文件的目录
		volumeDir := filepath.Dir(srcPath)

		// 查找第一个分卷文件（数字最小的）
		firstVolumePath, err := findFirstVolumeFile(volumeDir, comparableType)
		if err != nil {
			return "", "before", fmt.Errorf("%s查找第一个分卷文件失败: %v", funcIdt, err)
		}

		servicelog.Debugf("%s找到第一个分卷文件: %s\n", funcIdt, firstVolumePath)

		// 创建7z可执行文件路径
		szExecutable := filepath.Join(szPath, "7zz")
		if runtime.GOOS == "windows" {
			szExecutable = filepath.Join(szPath, "7z.exe")
		}

		// 解压第一个分卷文件，7z会自动处理后续分卷
		// 使用-y参数自动覆盖所有文件
		cmd := exec.Command(szExecutable, "x", firstVolumePath, "-o"+midDirPath+"/", "-y")
		cmd.Dir = backendRootPath
		var stdout, stderr bytes.Buffer
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr

		err = cmd.Run()
		outStr, errStr := stdout.String(), stderr.String()
		if err == nil {
			errStr = "无错误输出"
		}
		servicelog.Debugf("7z分卷解压命令输出: %s\n 7z分卷解压命令错误: %s\n", outStr, errStr)

		if err != nil {
			servicelog.Errorf("%s分卷解压失败: 错误=%v\n", funcIdt, err)
			return "", "before", fmt.Errorf("%s分卷解压失败: %v", funcIdt, err)
		}

		servicelog.Debugf("%s解压分卷压缩文件并写入中间路径%s完成\n", funcIdt, midDirPath)
	}

	return midDirPath, "", nil
}

// TODO：保留此函数以保持向后兼容 如在测试后无实用性需删除
// 模组解压接口（推荐使用 DecompressionWithOptions）
// 保留此函数以保持向后兼容
func DecompressionMod(srcPath string, filePassword string, dftPathGetModOrPath types.DftPathGetModOrPath) (unDecompressionPath, errorTiming string, err error) {
	opts := DecompressionOptions{
		SrcPath:             srcPath,
		FilePassword:        filePassword,
		IsMod:               true,
		DftPathGetModOrPath: dftPathGetModOrPath,
	}

	return DecompressionWithOptions(opts)
}

// 其他文件解压接口（推荐使用 DecompressionWithOptions）
// 保留此函数以保持向后兼容
func DecompressionFile(srcPath string, filePassword string, dstFilePath string) (unDecompressionPath, errorTiming string, err error) {
	opts := DecompressionOptions{
		SrcPath:      srcPath,
		FilePassword: filePassword,
		IsMod:        false,
		DstFilePath:  dstFilePath,
	}
	return DecompressionWithOptions(opts)
}
