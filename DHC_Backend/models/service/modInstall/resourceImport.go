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
	pass        ResourceState = "pass"
	notImported ResourceState = "notImported"
	incomplete  ResourceState = "incomplete"
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
		rm[resourceType] = NewResourceStateInfo(notImported)
	}

	// 确保 pkg 层级存在
	if rm[resourceType].Items[pkg] == nil {
		rm[resourceType].Items[pkg] = NewResourceStateInfo(notImported)
	}

	// 设置 car 的状态
	rm[resourceType].Items[pkg].Items[car] = NewResourceStateInfo(state)
}

// 辅助函数：获取资源状态
func (rm ResourceMap) GetState(resourceType ResourceType, pkg string, car string) (ResourceState, bool) {
	if rm[resourceType] == nil {
		return notImported, false
	}
	if rm[resourceType].Items[pkg] == nil {
		return notImported, false
	}
	if rm[resourceType].Items[pkg].Items[car] == nil {
		return notImported, false
	}
	return rm[resourceType].Items[pkg].Items[car].State, true
}

var carsResourceMap = ResourceMap{
	Cars: NewResourceStateInfo(notImported),
}

func init() {
	// 确保常量被使用
	_ = Tracks
	_ = Cars
	_ = Shaders
	_ = Dashboard
	_ = pass

	// 包信息

	// 初始化示例数据
	carsResourceMap.SetState(Cars, "SHMC", "R34", pass)
	carsResourceMap.SetState(Cars, "SHMC", "R35", pass)
	carsResourceMap.SetState(Cars, "DDM", "Supra", incomplete)
}

// 以下数据类型是从json解析数据用
type ResourceJson struct {
	Catalog ResourceCatalog `json:"categorys"`
}

type ModEntries map[string]int
type ResourceSubCategories map[string]ModEntries
type ResourceCatalog map[string]ResourceSubCategories

// 构建完整资源结构 Build a complete resource structure
// 从 json 构建一个包含了所有资源项目的 ResourceMap 用来和实际存在资源进行比对
func (rm ResourceMap) BuildCompleteResourceStructure() ResourceCatalog {
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

	// cs
	// map[
	//   categorys: map[
	//     car: map[
	//       DDM: map[
	//         SUPRA: 1024
	//       ]
	//       SHMC: map[
	//         R32: 2048
	//         R34: 1024
	//       ]
	//     ]
	//     tracks: map[
	//       main: map[
	//         SRP_093: 200000
	//       ]
	//       sub: map[
	//         NEW_LOOP: 30000
	//         SRP_C1: 20000
	//       ]
	//     ]
	//   ]
	// ]

	for _, resType := range resourceTypes {
		if rm[resType] == nil {
			rm[resType] = NewResourceStateInfo(notImported)
		}

		subCs := catalog[string(resType)]
		for pkg := range subCs {
			if rm[resType].Items[pkg] == nil {
				rm[resType].Items[pkg] = NewResourceStateInfo(notImported)
			}
			for mod := range subCs[pkg] {
				rm[resType].Items[pkg].Items[mod] = NewResourceStateInfo(notImported)
			}
		}
	}

	return rm
}

// 导入资源检测：返回**某一个类型**的已导入资源情况列表 map[string]map[string]bool
// ImportResourceDetection 返回指定资源类型的导入情况
func ImportResourceDetection(resource ResourceType) ResourceMap {
	completeRm := carsResourceMap.BuildCompleteResourceStructure()[string(resource)] // 从json获取目前resource的完整资源信息
	rm := ResourceMap{resource: NewResourceStateInfo(notImported)}

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
		_ = completeRm

		fileMap := make(map[string]int)
		var paths []string
		var pathPrefix string // 文件前缀

		err := filepath.Walk(resourceDir, func(path string, info os.FileInfo, err error) error {
			// 去除资源文件夹路径前缀 如 a/b/cars/shmc/r34 需要去除 'a/b/'
			path = filepath.ToSlash(path)
			size := info.Size()

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
			// 还需要剔除 mod 层级下的路径 例如 cars/shmc/rx7/1.kn5 仅保留 cars/shmc/rx7
			pathSplit := strings.Split(path, "/")
			if len(pathSplit) < 4 {
				fileMap[path] = int(size)
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
