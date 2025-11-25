package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// 资源导入

// 导入资源检测
// 地图 车辆 光影 仪表盘
type ResourceType string

const (
	Tracks    ResourceType = "tracks"
	Cars      ResourceType = "cars"
	Shaders   ResourceType = "shaders"
	Dashboard ResourceType = "dashboard"
	All       ResourceType = "all"
)

type ResourceState string

const (
	Pass        ResourceState = "pass"
	NotImported ResourceState = "notImported"
	Incomplete  ResourceState = "incomplete"
)

// ResourceStateInfo 表示资源的状态信息，包含状态和子项
type ResourceStateInfo struct {
	State ResourceState                 // 当前层级的状态
	Items map[string]*ResourceStateInfo // 子项映射（pkg -> state info 或 car -> state info）
}

// ResourceMap 表示完整的资源状态映射结构
// 结构：ResourceType -> ResourceStateInfo -> pkg -> ResourceStateInfo -> car -> ResourceState
// 使用示例：
//
//	ResourceMap[Cars].State = notImported
//	ResourceMap[Cars].Items["SHMC"].State = notImported
//	ResourceMap[Cars].Items["SHMC"].Items["R34"].State = pass
type ResourceMap map[ResourceType]*ResourceStateInfo

// 辅助函数：创建新的 ResourceStateInfo
func NewResourceStateInfo(state ResourceState) *ResourceStateInfo {
	return &ResourceStateInfo{
		State: state,
		Items: make(map[string]*ResourceStateInfo),
	}
}

// 辅助函数：设置资源状态（三层结构：ResourceType -> pkg -> car）
func (rm ResourceMap) SetState(resourceType ResourceType, pkg string, car string, state ResourceState) {
	// 确保 ResourceType 层级存在
	if rm[resourceType] == nil {
		rm[resourceType] = NewResourceStateInfo(NotImported)
	}

	// 确保 pkg 层级存在
	if rm[resourceType].Items[pkg] == nil {
		rm[resourceType].Items[pkg] = NewResourceStateInfo(NotImported)
	}

	// 设置 car 的状态
	rm[resourceType].Items[pkg].Items[car] = NewResourceStateInfo(state)
}

// 通过路径设置 ResourceMap 状态
func (rm ResourceMap) SetStateWithPath(resMap *ResourceMap, path string, state ResourceState) {
	// 支持一级、二级、三级路径
	// 一级：cars -> 设置整个资源类型的状态
	// 二级：cars/shmc -> 设置某个包的状态
	// 三级：cars/shmc/rx7 -> 设置具体车辆的状态
	parts := strings.Split(path, "/")

	if len(parts) == 0 {
		return // 空路径
	}

	resourceType := ResourceType(parts[0])

	// 确保 ResourceType 层级存在
	if (*resMap)[resourceType] == nil {
		(*resMap)[resourceType] = NewResourceStateInfo(NotImported)
	}

	switch len(parts) {
	case 1:
		// 一级路径：只设置资源类型的状态
		(*resMap)[resourceType].State = state
	case 2:
		// 二级路径：设置包的状态
		pkg := parts[1]
		if (*resMap)[resourceType].Items[pkg] == nil {
			(*resMap)[resourceType].Items[pkg] = NewResourceStateInfo(NotImported)
		}
		(*resMap)[resourceType].Items[pkg].State = state
	case 3:
		// 三级路径：设置具体车辆的状态
		pkg := parts[1]
		mod := parts[2]
		if (*resMap)[resourceType].Items[pkg] == nil {
			(*resMap)[resourceType].Items[pkg] = NewResourceStateInfo(NotImported)
		}
		(*resMap)[resourceType].Items[pkg].Items[mod] = NewResourceStateInfo(state)
	default:
		return // 路径层级过多，不支持
	}
}

// 辅助函数：获取资源状态
func (rm ResourceMap) GetState(resourceType ResourceType, pkg string, car string) (ResourceState, bool) {
	if rm[resourceType] == nil {
		return NotImported, false
	}
	if rm[resourceType].Items[pkg] == nil {
		return NotImported, false
	}
	if rm[resourceType].Items[pkg].Items[car] == nil {
		return NotImported, false
	}
	return rm[resourceType].Items[pkg].Items[car].State, true
}

// 以下数据类型是从json解析数据用
type ResourceJson struct {
	Catalog ResourceCatalog `json:"categorys"`
}

type ModEntries map[string]int
type ResourceSubCategories map[string]ModEntries
type ResourceCatalog map[string]ResourceSubCategories

// 构建完整资源结构 Build a complete resource structure
// 从 json 构建一个包含了所有资源项目的 ResourceStructure 用来和实际存在资源进行比对
func BuildCompleteResourceCatalog() ResourceCatalog {
	backendRootPath, _ := infoGet.GetBackendRootPath()
	isDev := infoGet.IsDevModeGet()

	// 得到对应类型的资源表文件夹
	jsonFileName := "pkgInfo.json"
	var resourceJsonFilePath string
	if isDev {
		resourceJsonFilePath = filepath.Join(backendRootPath, "test", "simEnv", "resources", jsonFileName)
	} else {
		resourceJsonFilePath = filepath.Join(backendRootPath, "resources", jsonFileName)
	}

	resourceJsonFile, _ := os.Open(resourceJsonFilePath)
	defer resourceJsonFile.Close()

	var res ResourceJson
	resourceJsonFileDecode := json.NewDecoder(resourceJsonFile)
	if err := resourceJsonFileDecode.Decode(&res); err != nil {
		fmt.Println("decode pkgInfo.json failed:", err)
		return ResourceCatalog{}
	}

	fmt.Println(res.Catalog)

	// 把最外层 catalog 包装去掉
	return res.Catalog
}

// 接受从 json 中解析出的数据 然后用其构建一个完整的初始化的ResourceMap
func BuildCompleteInitResourceMap(resource ResourceType, catalog ResourceCatalog) ResourceMap {
	rm := ResourceMap{}
	var resourceTypes []ResourceType

	if resource == All {
		for resName := range catalog {
			resourceTypes = append(resourceTypes, ResourceType(resName))
		}
	} else {
		resourceTypes = append(resourceTypes, resource)
	}

	for _, resType := range resourceTypes {
		if rm[resType] == nil {
			rm[resType] = NewResourceStateInfo(NotImported)
		}

		subCs := catalog[string(resType)]
		for pkg := range subCs {
			if rm[resType].Items[pkg] == nil {
				rm[resType].Items[pkg] = NewResourceStateInfo(NotImported)
			}
			for mod := range subCs[pkg] {
				rm[resType].Items[pkg].Items[mod] = NewResourceStateInfo(NotImported)
			}
		}
	}

	return rm
}

// 获取 mod 体积
func GetModSizeFromPath(catalog ResourceCatalog, path string) (int, error) {
	pathSplit := strings.Split(path, "/")
	if len(pathSplit) != 3 {
		return 0, fmt.Errorf("不支持三级目录以外的路径")
	}
	return catalog[pathSplit[0]][pathSplit[1]][pathSplit[2]], nil
}

// 导入资源检测：返回**某一个类型**的已导入资源情况列表 map[string]map[string]bool
// ImportResourceDetection 返回指定资源类型的导入情况
func ImportResourceDetection(resource ResourceType) ResourceMap {
	// 从json获取目前resource的完整资源信息 并构建一个完整结构的 ResourceMap
	resCl := BuildCompleteResourceCatalog()
	completeRm := BuildCompleteInitResourceMap(resource, resCl)

	rm := completeRm

	backendRootPath, _ := infoGet.GetBackendRootPath()
	isDev := infoGet.IsDevModeGet()

	// 得到对应类型的资源文件夹
	var resourceDir string
	if isDev {
		resourceDir = filepath.Join(backendRootPath, "test", "simEnv", "resources", string(resource))
	} else {
		resourceDir = filepath.Join(backendRootPath, "resources", string(resource))
	}

	// 检查车辆包
	// 资源分为 大类和小类和具体包（car/SHMC/R34）
	if resource == Cars {

		var categoryComplete bool    // 大类完整性
		var subCategoryComplete bool // 小类

		// 消费一下避免报错
		_ = categoryComplete
		_ = subCategoryComplete

		fileSetMap := make(map[string]ResourceState)
		var paths []string
		var pathPrefix string // 文件前缀

		// 遍历文件并填充 rm
		err := filepath.Walk(resourceDir, func(path string, info os.FileInfo, err error) error {
			// 去除资源文件夹路径前缀 如 a/b/cars/shmc/r34 需要去除 'a/b/'
			path = filepath.ToSlash(path)
			size := info.Size()
			_ = size       // TODO: 后续用于完整性检查
			_ = fileSetMap // TODO: 后续用于存储状态

			// 前缀为定义 寻找前缀
			if pathPrefix == "" {
				pathSplit := strings.Split(path, "/")
				for i, v := range pathSplit {
					if v == string(resource) {
						pathPrefix = strings.Join(pathSplit[:i], "/") + "/"
						break
					}
				}
			}

			path = strings.TrimPrefix(path, pathPrefix)

			// 如果是层级小于3级的包 那么判定为不是mods 这种情况下只判断size是否 =0 如果是的话 那么直接判定为不完整

			// 还需要剔除 mod 层级下的路径 例如 cars/shmc/rx7/1.kn5 仅保留 cars/shmc/rx7
			pathSplit := strings.Split(path, "/")
			if len(pathSplit) < 4 {
				// State判断

				// 是 mod ,进行完整性检查
				if len(pathSplit) == 3 {
					getSize, _ := GetModSizeFromPath(resCl, path)
					if size < int64(getSize) {
						completeRm.SetStateWithPath(&rm, path, Incomplete)
					} else if size == 0 {
						completeRm.SetStateWithPath(&rm, path, NotImported)
					}
				}

				// 不是 mod 只检测是不是未引入
				if size == 0 {
					completeRm.SetStateWithPath(&rm, path, NotImported)
				}

				paths = append(paths, path)
			}

			return nil
		})

		if err != nil {
			panic(err)
		}

	}

	return rm
}

// 计算完整 ResourceMap 大/小类的总体积（字节）
// func CalculateResourceMapSize(mode string, resType ResourceType, subCategoryName string) int64 {
// 	var completeRm = ResourceMap{}.BuildCompleteResourceStructure()
// 	var size int64

// 	if mode == "category" {
// 		// 获取指定小类的所有包
// 		pkgs, ok := completeRm[string(resType)][subCategoryName]
// 		if !ok {
// 			return 0
// 		}

// 		// 遍历所有包
// 		for _, mods := range pkgs {
// 			// 遍历每个包下的所有 mod，累加大小
// 			for _, modSize := range mods {
// 				size += int64(modSize)
// 			}
// 		}
// 	}

// 	return size
// }

// 资源完整性检测
