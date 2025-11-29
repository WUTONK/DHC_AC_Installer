package modinstall

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/infoGet"
	"DHC_Backend/models/service/types"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

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

	fmt.Println("资源引入成功")
	return rm, nil

}

// 单模组安装
func SingleModInstall(srcPath string, filePassword string, d types.DftPathGetModOrPath) {
	funcIdt := "-modinstall.SingleModInstall"
	// 逻辑：
	// 传入文件并解压（非压缩包直接复制）到中间目录
	opts := decompression.DecompressionOptions{
		SrcPath:             srcPath,
		FilePassword:        filePassword,
		IsMod:               true,
		DftPathGetModOrPath: d,
	}
	unDecompressionPath, errorTiming, err := decompression.DecompressionWithOptions(opts)
	if err != nil {
		fmt.Printf("%s在调用decompression.DecompressionWithOptions()时发生错误:%s,errorTiming:%s\n", funcIdt, err, errorTiming)
		return
	}
	fmt.Printf("%s解压完成，解压目录: %s\n", funcIdt, unDecompressionPath)
	// 检测覆盖规则

	dftPath := decompression.GetDftPath(srcPath, unDecompressionPath, d)
	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		fmt.Printf("%s获取游戏路径失败:%s\n", funcIdt, err)
		return
	}

	config, err := decompression.DecodeDhcFileTagConfig(dftPath)
	if err != nil {
		fmt.Printf("%s解码配置文件失败:%s\n", funcIdt, err)
		return
	}

	// 处理 OverwriteStartingDir 为空的情况（使用默认值）
	overwriteDir := config.OverwriteStartingDir
	overrideDstFile := filepath.Join(gamePath, overwriteDir)
	fmt.Printf("%s目标覆盖目录: %s\n", funcIdt, overrideDstFile)

	err = decompression.OverrideControl(unDecompressionPath, overrideDstFile, dftPath)
	if err != nil {
		fmt.Printf("%s执行OverrideControl时发生错误:%s\n", funcIdt, err)
		return
	}
	// 进行安装
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
func MultiModInstall(paths []string) error {
	funcIdt := "-modInstall.MultiModInstall-"

	// 获取本地资源库的完整 ResourceMap
	rm, err := ImportResourceDetection(All, Local)
	if err != nil {
		return fmt.Errorf("%s获取资源状态失败: %v", funcIdt, err)
	}

	// 展开路径：将用户选择的路径展开为所有需要安装的具体 mod 路径
	// 例如：cars/shmc -> [cars/shmc/r34, cars/shmc/rx7, ...]
	expandedPaths := expandPaths(rm, paths)

	// TODO: 遍历 expandedPaths，对每个路径调用 SingleModInstall
	// 需要：
	// 1. 根据路径在本地资源库中找到对应的压缩包或文件
	// 2. 调用 SingleModInstall 进行安装

	fmt.Printf("%s需要安装的路径数量: %d\n", funcIdt, len(expandedPaths))
	for _, path := range expandedPaths {
		fmt.Printf("%s待安装路径: %s\n", funcIdt, path)
	}

	return nil
}

// expandPaths 展开路径列表为所有需要安装的具体 mod 路径
// 例如：如果用户选择了 "cars/shmc"，需要展开为所有该包下的车辆路径
func expandPaths(rm ResourceMap, paths []string) []string {
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
		// 如果路径还没见过（map 中不存在或值为 false），则添加
		if !seen[path] {
			seen[path] = true             // 标记为已见过
			result = append(result, path) // 添加到结果中
		}
		// 如果路径已经见过（seen[path] == true），则跳过，实现去重
	}

	return result
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
