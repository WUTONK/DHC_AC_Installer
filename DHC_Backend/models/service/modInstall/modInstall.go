package modinstall

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/infoGet"
	"DHC_Backend/models/service/servicelog"
	"DHC_Backend/models/service/types"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

/*
================================================================================
模组安装系统架构与流程说明
================================================================================

【系统架构】
─────────────────────────────────────────────────────────────────────────────
外部资源包 → DhcResoucePkgImport → 资源库 → MultiModInstall → 游戏目录
   pkg.zip      (引入)          resources/    (批量安装)    content/

                    ┌─────────────────────┐
                    │ DhcResoucePkgImport │  资源包引入
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │   资源库 Storage     │  resources/{type}/{pkg}/{mod}/
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │   MultiModInstall   │  批量安装入口
                    └──────────┬──────────┘
                    ┌──────────┴──────────┐
         ┌──────────▼──────────┐  ┌───────▼──────────────┐
         │  SingleModInstall   │  │SingleModInstallFromDir│
         │  (压缩包→中间→游戏)   │  │  (目录→游戏，跳过解压) │
         └──────────┬──────────┘  └───────┬──────────────┘
                    └──────────┬──────────┘
         ┌──────────▼─────────────────────▼──────────┐
         │  decompression.OverrideControl()          │  复制到游戏目录
         └──────────────────────────────────────────┘


【核心流程】
─────────────────────────────────────────────────────────────────────────────

1. 资源引入 (DhcResoucePkgImport)
   外部资源包 → 解压到临时缓存 → 检测资源 → 复制到资源库 → 清理缓存
   pkg.zip    importCache/      ResourceMap   resources/     删除缓存

2. 模组安装 (MultiModInstall)
   路径列表 → 展开路径 → 完整性检查 → 遍历安装
   ["cars/SHMC"]  expandPaths()  检查状态     SingleModInstall/FromDir

3. 单模组安装 (SingleModInstall - 压缩包)
   压缩包 → 解压到中间目录 → 读取配置 → 复制到游戏目录
   mod.rar  cache/{type}/{name}/  dft.json   content/...

4. 单模组安装 (SingleModInstallFromDir - 从已解压资源目录安装)
   目录 → 读取配置 → 直接复制到游戏目录 (跳过解压)
   dir/    dft.json   content/...


【关键目录】
─────────────────────────────────────────────────────────────────────────────
• 外部资源包: 用户提供的压缩包
• 临时引入缓存: resources/importResourceCache/ (引入时临时使用)
• 资源库: resources/ 或 test/simEnv/resources/ (存储已解压模组)
• 安装中间目录: resources/cache/{ModType}/{modName}/ (安装时临时使用)
• 游戏目录: content/{cars|tracks|...}/ (最终安装位置)


【函数调用链】
─────────────────────────────────────────────────────────────────────────────
DhcResoucePkgImport:
  解压 → 检测资源 → 复制到资源库 → 清理

MultiModInstall:
  获取资源状态 → 展开路径 → 完整性检查 → 遍历安装

SingleModInstall (压缩包):
  解压到中间目录 → 获取配置 → 复制到游戏目录

SingleModInstallFromDir (目录):
  获取配置 → 直接复制到游戏目录


【配置文件】
─────────────────────────────────────────────────────────────────────────────
dft.json: {modType, defaultAction, rules, overwriteStartingDir}
说明: dft 是 dhcFileTag 的缩写，模组类型与覆盖规则统一存放在 dft.json 中
查找位置: DftPathFromDir (源目录) | DftPathFromCompressRoot (解压根目录)

================================================================================
*/

// 资源包将会分为：
// - 完整包(全部资源)
// - 最小包(仅主图+一个C1环线副图+SHMC车包)
// - 完整地图包|完整车辆包|完整光影包|完整仪表盘包

// 从资源包引入资源到本地资源库
// 参数：-资源包路径
// 返回值： -安装资源列表
func DhcResoucePkgImport(pkgPath string) (ResourceMap, error) {
	funcIdt := "-modInstall.DhcResoucePkgImport-"

	rm := ResourceMap{}

	// 解压到 DHC_Backend/resources/importResourceCache
	// 然后拿去覆盖 DHC_Backend/resources
	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return nil, fmt.Errorf("%s获取根目录路径时发生错误: %v", funcIdt, err)
	}

	var midFilePath string
	isDevMode := infoGet.IsDevModeGet()
	if isDevMode {
		midFilePath = filepath.Join(backendRootPath, "test", "simEnv", "resources", "importResourceCache")
	} else {
		midFilePath = filepath.Join(backendRootPath, "resources", "importResourceCache")
		// TODO：补充非开发模式下获取 windows desktop 路径函数
	}

	var resourceJsonFilePath string
	if isDevMode {
		resourceJsonFilePath = filepath.Join(backendRootPath, "test", "simEnv", "resources")
	} else {
		resourceJsonFilePath = filepath.Join(backendRootPath, "resources")
	}

	options := decompression.DecompressionOptions{
		SrcPath:     pkgPath,
		DstFilePath: midFilePath,
	}

	_, errorTiming, err := decompression.DecompressionWithOptions(options)
	if err != nil {
		return nil, fmt.Errorf("%s解压失败:errorTiming:%s, err:%s", funcIdt, errorTiming, err)
	}

	// 检测中间目录得到 ResouceMap
	rm, err = ImportResourceDetection(All, DetectionPath(midFilePath))
	if err != nil {
		return nil, fmt.Errorf("%s检测资源包ResourceMap失败: err:%s", funcIdt, err)
	}

	// 将中间目录中的文件复制到资源文件夹
	err = copyDir(midFilePath, resourceJsonFilePath)
	if err != nil {
		return nil, fmt.Errorf("%s复制资源文件失败: err:%s", funcIdt, err)
	}

	// 清除缓存
	err = os.RemoveAll(midFilePath)
	if err != nil {
		return nil, fmt.Errorf("%s重要错误: 引入资源包时资源包缓存清除失败: err:%s", funcIdt, err)
	}

	servicelog.Infof("资源引入成功\n")
	return rm, nil

}

// 单模组安装
func SingleModInstall(srcPath string, d types.DftPathGetModOrPath) {
	funcIdt := "-modinstall.SingleModInstall"
	// 逻辑：
	// 传入文件并解压（非压缩包直接复制）到中间目录
	opts := decompression.DecompressionOptions{
		SrcPath:             srcPath,
		IsMod:               true,
		DftPathGetModOrPath: d,
	}
	unDecompressionPath, errorTiming, err := decompression.DecompressionWithOptions(opts)
	if err != nil {
		servicelog.Errorf("%s在调用decompression.DecompressionWithOptions()时发生错误:%s,errorTiming:%s\n", funcIdt, err, errorTiming)
		return
	}
	servicelog.Debugf("%s解压完成,解压目录: %s\n", funcIdt, unDecompressionPath)
	// 检测覆盖规则

	dftPath := decompression.GetDftPath(srcPath, unDecompressionPath, d)
	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		servicelog.Errorf("%s获取游戏路径失败:%s\n", funcIdt, err)
		return
	}

	config, err := decompression.DecodeDhcFileTagConfig(dftPath)
	if err != nil {
		servicelog.Errorf("%s解码配置文件失败:%s\n", funcIdt, err)
		return
	}

	// 处理 OverwriteStartingDir 为空的情况（使用默认值）
	overwriteDir := config.OverwriteStartingDir
	overrideDstFile := filepath.Join(gamePath, overwriteDir)
	servicelog.Debugf("%s目标覆盖目录: %s\n", funcIdt, overrideDstFile)

	err = decompression.OverrideControl(unDecompressionPath, overrideDstFile, dftPath)
	if err != nil {
		servicelog.Errorf("%s执行OverrideControl时发生错误:%s\n", funcIdt, err)
		return
	}
	// 进行安装
}

// SingleModInstallFromDir 从已解压目录安装模组
// 用于处理资源库中存储的是已解压目录的情况
// 流程：目录 → 直接复制到游戏目录（跳过解压步骤）
func SingleModInstallFromDir(srcDirPath string, d types.DftPathGetModOrPath) {
	funcIdt := "-modinstall.SingleModInstallFromDir-"

	// 获取 dft 文件路径
	dftPath := decompression.GetDftPath(srcDirPath, srcDirPath, d)

	// 获取游戏路径
	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		servicelog.Errorf("%s获取游戏路径失败:%s\n", funcIdt, err)
		return
	}

	// 读取配置文件
	config, err := decompression.DecodeDhcFileTagConfig(dftPath)
	if err != nil {
		servicelog.Errorf("%s解码配置文件失败:%s\n", funcIdt, err)
		return
	}

	// 处理 OverwriteStartingDir 为空的情况（使用默认值）
	overwriteDir := config.OverwriteStartingDir
	overrideDstFile := filepath.Join(gamePath, overwriteDir)
	servicelog.Debugf("%s目标覆盖目录: %s\n", funcIdt, overrideDstFile)

	// 直接从源目录复制到游戏目录（跳过中间目录和解压步骤）
	err = decompression.OverrideControl(srcDirPath, overrideDstFile, dftPath)
	if err != nil {
		servicelog.Errorf("%s执行OverrideControl时发生错误:%s\n", funcIdt, err)
		return
	}

	servicelog.Debugf("%s从目录安装完成: %s -> %s\n", funcIdt, srcDirPath, overrideDstFile)
}

// copyDir 递归复制目录及其内容
func copyDir(srcDir, dstDir string) error {
	return filepath.WalkDir(srcDir, func(srcPath string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// 计算目标路径
		relPath, err := filepath.Rel(srcDir, srcPath)
		if err != nil {
			return err
		}
		dstPath := filepath.Join(dstDir, relPath)

		if d.IsDir() {
			// 创建目标目录
			return os.MkdirAll(dstPath, os.ModePerm)
		} else {
			// 复制文件
			// 确保目标目录存在
			if err := os.MkdirAll(filepath.Dir(dstPath), os.ModePerm); err != nil {
				return err
			}

			srcFile, err := os.Open(srcPath)
			if err != nil {
				return err
			}
			defer srcFile.Close()

			dstFile, err := os.Create(dstPath)
			if err != nil {
				return err
			}
			defer dstFile.Close()

			_, err = io.Copy(dstFile, srcFile)
			return err
		}
	})
}

// MultiModInstall 多模组安装
// 传入路径列表，支持多层级路径（如 ["cars", "cars/shmc", "tracks", "cars/shmc/r34"]）
// 路径格式：支持一级（cars）、二级（cars/shmc）、三级（cars/shmc/r34）路径
//
// 实现逻辑：
// 1. 从本地资源库中获取完整的 ResourceMap
// 2. 根据传入的路径列表，在 ResourceMap 中查找对应的资源
// 3. 展开路径（如选择 cars/shmc，需要展开为所有子项：cars/shmc/r34, cars/shmc/rx7...）
// 4. 遍历展开后的路径列表，调用 SingleModInstall 进行安装
func MultiModInstall(paths []string, dftFilePath string) error {
	funcIdt := "-modInstall.MultiModInstall-"

	var localResouceDir string
	isDevMode := infoGet.IsDevModeGet()
	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return fmt.Errorf("获取根目录失败 error:%s", err)
	}
	if isDevMode {
		localResouceDir = filepath.Join(backendRootPath, "test", "simEnv", "resources")
	} else {
		localResouceDir = filepath.Join(backendRootPath, "resources")
	}

	// 获取本地资源库的完整 ResourceMap
	rm, err := ImportResourceDetection(All, Local)
	if err != nil {
		return fmt.Errorf("%s获取资源状态失败: %v", funcIdt, err)
	}

	// 展开路径：将用户选择的路径展开为所有需要安装的具体 mod 路径
	// 例如：cars/shmc -> [cars/shmc/r34, cars/shmc/rx7, ...]
	expandedPaths, err := expandPaths(rm, paths)
	if err != nil {
		return fmt.Errorf("%s在展开需安装模组路径列表时 发现了不支持的路径: %v", funcIdt, err)
	}

	// 进行完整性检查 查看是否有未通过完整性检测的模组在 expandPaths 待安装列表中，如果有就报错
	err = PathCorresponModIntegrityCheck(expandedPaths)
	if err != nil {
		return fmt.Errorf("%s在对需安装模组路径列表进行完整性检查时 发现了未通过完整性检查的路径: %v", funcIdt, err)
	}

	for _, path := range expandedPaths {
		// 合成本地路径（使用 filepath.Join 确保路径正确）
		currentModPath := filepath.Join(localResouceDir, path)

		// 检查路径是文件还是目录
		fileInfo, err := os.Stat(currentModPath)
		if err != nil {
			servicelog.Warnf("%s警告: 无法访问路径 %s: %v\n", funcIdt, currentModPath, err)
			continue
		}

		if fileInfo.IsDir() {
			// 如果是目录，先尝试在目录中查找压缩包文件
			modFilePath := findModFileInDir(currentModPath)
			if modFilePath != "" {
				// 找到压缩包，使用压缩包安装流程
				servicelog.Debugf("%s在目录中找到压缩包: %s\n", funcIdt, modFilePath)
				SingleModInstall(modFilePath, types.DftPathGetModOrPath(dftFilePath))
			} else {
				// 目录中没有压缩包，说明是已解压目录，直接处理目录
				servicelog.Debugf("%s检测到已解压目录，直接安装: %s\n", funcIdt, currentModPath)
				SingleModInstallFromDir(currentModPath, types.DftPathGetModOrPath(dftFilePath))
			}
		} else {
			// 如果是文件，直接使用（应该是压缩包）
			servicelog.Debugf("%s检测到压缩包文件: %s\n", funcIdt, currentModPath)
			SingleModInstall(currentModPath, types.DftPathGetModOrPath(dftFilePath))
		}
	}

	servicelog.Debugf("%s需要安装的路径数量: %d\n", funcIdt, len(expandedPaths))
	for _, path := range expandedPaths {
		servicelog.Debugf("%s待安装路径: %s\n", funcIdt, path)
	}

	return nil
}

// MultiModInstallWithTracker 带进度追踪的多模组安装。
// 阶段划分：validate（完整性校验，10%）+ 每个模组均分剩余 90%。
// tracker 为 nil 时退化为 MultiModInstall。
func MultiModInstallWithTracker(paths []string, dftFilePath string, tracker *TaskTracker) error {
	if tracker == nil {
		return MultiModInstall(paths, dftFilePath)
	}

	funcIdt := "-modInstall.MultiModInstallWithTracker-"

	var localResouceDir string
	isDevMode := infoGet.IsDevModeGet()
	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return fmt.Errorf("获取根目录失败 error:%s", err)
	}
	if isDevMode {
		localResouceDir = filepath.Join(backendRootPath, "test", "simEnv", "resources")
	} else {
		localResouceDir = filepath.Join(backendRootPath, "resources")
	}

	// ── validate 阶段 ──
	tracker.AddPhase("validate", "校验资源完整性", 10)
	tracker.StartPhase("validate")

	rm, err := ImportResourceDetection(All, Local)
	if err != nil {
		tracker.FailPhase("validate")
		return fmt.Errorf("%s获取资源状态失败: %v", funcIdt, err)
	}
	tracker.SetSubProgress("validate", 30)

	expandedPaths, err := expandPaths(rm, paths)
	if err != nil {
		tracker.FailPhase("validate")
		return fmt.Errorf("%s在展开需安装模组路径列表时 发现了不支持的路径: %v", funcIdt, err)
	}
	tracker.SetSubProgress("validate", 60)

	err = PathCorresponModIntegrityCheck(expandedPaths)
	if err != nil {
		tracker.FailPhase("validate")
		return fmt.Errorf("%s完整性检查未通过: %v", funcIdt, err)
	}
	tracker.CompletePhase("validate")

	// ── 动态注册每个模组为独立阶段，均分 90% ──
	modCount := len(expandedPaths)
	if modCount == 0 {
		return nil
	}
	perModWeight := 90.0 / float64(modCount)

	for i, path := range expandedPaths {
		phaseID := fmt.Sprintf("mod_%d", i)
		tracker.AddPhase(phaseID, fmt.Sprintf("安装 %s", filepath.Base(path)), perModWeight)
	}

	// ── 逐个安装 ──
	for i, path := range expandedPaths {
		phaseID := fmt.Sprintf("mod_%d", i)
		tracker.StartPhase(phaseID)

		currentModPath := filepath.Join(localResouceDir, path)
		fileInfo, err := os.Stat(currentModPath)
		if err != nil {
			servicelog.Warnf("%s警告: 无法访问路径 %s: %v\n", funcIdt, currentModPath, err)
			tracker.FailPhase(phaseID)
			continue
		}

		if fileInfo.IsDir() {
			modFilePath := findModFileInDir(currentModPath)
			if modFilePath != "" {
				SingleModInstall(modFilePath, types.DftPathGetModOrPath(dftFilePath))
			} else {
				SingleModInstallFromDir(currentModPath, types.DftPathGetModOrPath(dftFilePath))
			}
		} else {
			SingleModInstall(currentModPath, types.DftPathGetModOrPath(dftFilePath))
		}

		tracker.CompletePhase(phaseID)
	}

	return nil
}

// 路径对应模组完整性检查
// 传入一个**展开了的**模组路径数组 此函数将会检查路径数组中的模组是否都在本地存在（完整的才被视为存在）
func PathCorresponModIntegrityCheck(expandedPaths []string) error {
	funcIdt := "-modInstall.PathCorresponModIntegrityCheck-"

	// 空列表检查
	if len(expandedPaths) == 0 {
		return fmt.Errorf("%s传入的路径列表为空", funcIdt)
	}

	// 从json获取目前resource的完整资源信息 并构建一个完整结构的 ResourceMap
	rm, err := ImportResourceDetection(All, Local)
	if err != nil {
		return fmt.Errorf("%s获取资源状态失败: %v", funcIdt, err)
	}

	for _, path := range expandedPaths {
		// 空路径检查
		path = strings.TrimSpace(path)
		if path == "" {
			return fmt.Errorf("%s检测到空路径", funcIdt)
		}

		splitPath := strings.Split(path, "/")
		pathLength := len(splitPath)

		// 严格检查：路径必须是精确的三级路径（resourceType/pkg/mod）
		if pathLength != 3 {
			return fmt.Errorf("%s检测到路径格式不正确:%s,期望格式为:resourceType/pkg/mod(如:cars/shmc/r34),实际长度为:%d", funcIdt, path, pathLength)
		}

		// 检查路径各段是否为空
		if splitPath[0] == "" || splitPath[1] == "" || splitPath[2] == "" {
			return fmt.Errorf("%s检测到路径包含空段:%s", funcIdt, path)
		}

		modState, isExist := rm.GetState(ResourceType(splitPath[0]), splitPath[1], splitPath[2])

		// 检查资源是否存在
		if !isExist {
			return fmt.Errorf("%s检测到资源在本地不存在(资源未定义):%s", funcIdt, path)
		}

		// 检查资源是否完整（只有 Pass 状态才被认为是完整的）
		if modState != Pass {
			var stateDesc string
			switch modState {
			case NotImported:
				stateDesc = "未导入"
			case Incomplete:
				stateDesc = "不完整"
			default:
				stateDesc = string(modState)
			}
			return fmt.Errorf("%s检测到资源在本地不完整,路径:%s,状态:%s", funcIdt, path, stateDesc)
		}

		// 资源存在且完整，继续检查下一个
	}

	return nil
}

// expandPaths 展开路径列表为所有需要安装的具体 mod 路径
// 例如：如果用户选择了 "cars/shmc"，需要展开为所有该包下的车辆路径
func expandPaths(rm ResourceMap, paths []string) ([]string, error) {
	var expanded []string

	for _, path := range paths {
		parts := strings.Split(path, "/")

		switch len(parts) {
		case 1:
			// 一级路径：cars -> 展开为所有 pkg 下的所有 mod
			resourceType := ResourceType(parts[0])
			if resourceInfo, exists := rm[resourceType]; exists {
				for pkgName, pkgInfo := range resourceInfo.Items {
					for modName := range pkgInfo.Items {
						expanded = append(expanded, fmt.Sprintf("%s/%s/%s", parts[0], pkgName, modName))
					}
				}
			}
		case 2:
			// 二级路径：cars/shmc -> 展开为所有该包下的 mod
			resourceType := ResourceType(parts[0])
			pkgName := parts[1]
			if resourceInfo, exists := rm[resourceType]; exists {
				if pkgInfo, exists := resourceInfo.Items[pkgName]; exists {
					for modName := range pkgInfo.Items {
						expanded = append(expanded, fmt.Sprintf("%s/%s/%s", parts[0], pkgName, modName))
					}
				}
			}
		case 3:
			// 三级路径：cars/shmc/r34 -> 直接添加
			expanded = append(expanded, path)
		default:
			// 不支持的路径格式，跳过

			continue
		}
	}

	// 去重：使用 map 记录已见过的路径，避免重复安装
	// 例如：如果用户同时选择了 "cars/shmc" 和 "cars/shmc/r34"，
	// 展开后可能都会产生 "cars/shmc/r34"，需要去重
	seen := make(map[string]bool) // 记录已经处理过的路径
	var result []string

	for _, path := range expanded {
		if !seen[path] {
			seen[path] = true
			result = append(result, path)
		}
	}

	return result, nil
}

// findModFileInDir 在目录中查找模组文件（压缩包）
// 支持的格式：.rar, .zip, .7z
// 返回找到的第一个压缩包文件的完整路径，如果未找到则返回空字符串
func findModFileInDir(dirPath string) string {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return ""
	}

	// 支持的压缩包扩展名
	supportedExts := []string{".rar", ".zip", ".7z"}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		fileName := entry.Name()
		ext := strings.ToLower(filepath.Ext(fileName))

		// 检查是否是支持的压缩包格式
		for _, supportedExt := range supportedExts {
			if ext == supportedExt {
				return filepath.Join(dirPath, fileName)
			}
		}
	}

	return ""
}

// ResetSimEnvModDirectories 重置 simenv 模组目录，实现垃圾回收。
// 该入口只允许操作"临时复制出来的游戏目录"，避免误改 git 跟踪的骨架目录。
func ResetSimEnvModDirectories() error {
	funcIdt := "-modInstall.ResetSimEnvModDirectories-"

	isDevMode := infoGet.IsDevModeGet()
	if !isDevMode {
		return fmt.Errorf("%s此函数仅在开发模式下可用", funcIdt)
	}

	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		return fmt.Errorf("%s获取游戏路径失败: %v", funcIdt, err)
	}

	return ResetSimEnvModDirectoriesAtPath(gamePath)
}

// ResetSimEnvModDirectoriesAtPath 将指定游戏目录的 content 重置为 envBackup 中的基线内容。
// 这个函数适合测试时传入 t.TempDir() 下的临时目录，避免污染仓库内的骨架数据。
func ResetSimEnvModDirectoriesAtPath(gamePath string) error {
	funcIdt := "-modInstall.ResetSimEnvModDirectoriesAtPath-"

	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return fmt.Errorf("%s获取根目录失败: %v", funcIdt, err)
	}

	trackedSkeletonGamePath := filepath.Join(
		backendRootPath,
		"test", "simEnv", "acRoot", "AC_SKELETON_HASDLC", "Assetto Corsa",
	)
	if filepath.Clean(gamePath) == filepath.Clean(trackedSkeletonGamePath) {
		return fmt.Errorf("%s拒绝直接操作 git 跟踪的 simenv 骨架目录: %s，请先复制到临时目录后再重置", funcIdt, gamePath)
	}

	backupPath := filepath.Join(backendRootPath, "test", "simEnv", "acRoot", "envBackup", "AC_SKELETON_HASDLC")
	contentPath := filepath.Join(gamePath, "content")
	backupContentPath := filepath.Join(backupPath, "content")

	servicelog.Infof("%s开始重置 simenv 模组目录...\n", funcIdt)

	if _, err := os.Stat(backupContentPath); os.IsNotExist(err) {
		return fmt.Errorf("%s备份 content 目录不存在: %s", funcIdt, backupContentPath)
	}

	if err := os.RemoveAll(contentPath); err != nil {
		return fmt.Errorf("%s删除 content 目录失败: %s, 错误: %v", funcIdt, contentPath, err)
	}
	servicelog.Infof("%s已删除 content 目录: %s\n", funcIdt, contentPath)

	if err := copyDir(backupContentPath, contentPath); err != nil {
		return fmt.Errorf("%s从备份恢复 content 目录失败: %s -> %s, 错误: %v", funcIdt, backupContentPath, contentPath, err)
	}
	servicelog.Infof("%s已从备份恢复 content 目录: %s -> %s\n", funcIdt, backupContentPath, contentPath)

	servicelog.Infof("%s simenv 模组目录重置完成\n", funcIdt)
	return nil
}
