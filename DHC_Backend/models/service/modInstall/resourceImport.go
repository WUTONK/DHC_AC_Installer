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
	State ResourceState                 `json:"state"` // 当前层级的状态
	Items map[string]*ResourceStateInfo `json:"items"` // 子项映射（pkg -> state info 或 car -> state info）
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

	// 检查路径是否在 catalog 中存在
	resourceType, pkg, mod := pathSplit[0], pathSplit[1], pathSplit[2]

	resourceSubCategories, ok := catalog[resourceType]
	if !ok {
		return 0, fmt.Errorf("资源类型 %s 不存在", resourceType)
	}

	modEntries, ok := resourceSubCategories[pkg]
	if !ok {
		return 0, fmt.Errorf("包 %s 不存在", pkg)
	}

	size, ok := modEntries[mod]
	if !ok {
		return 0, fmt.Errorf("mod %s 不存在", mod)
	}

	return size, nil
}

// 导入资源检测：返回**某一个类型**的已导入资源情况列表 map[string]map[string]bool
// ImportResourceDetection 返回指定资源类型的导入情况
func ImportResourceDetection(resource ResourceType) (ResourceMap, error) {

	// 获取所有资源模式
	if resource == All {
		// 获取所有资源类型（排除 All）
		var allResourceTypes = []ResourceType{
			Tracks,
			Cars,
			Shaders,
			Dashboard,
		}

		polymerizationRm := ResourceMap{}

		for _, v := range allResourceTypes {
			resultRm, err := ImportResourceDetection(v)
			if err != nil {
				return polymerizationRm, err
			}
			polymerizationRm[v] = resultRm[v]
		}

		return polymerizationRm, nil
	}

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
	if !infoGet.IsFileOrDirExists(resourceDir) {
		return rm, fmt.Errorf("资源目录%s不存在", resourceDir)
	}

	// 检查资源包
	// 资源分为 大类和小类和具体包（car/SHMC/R34）
	// 支持所有资源类型，不仅仅是 Cars
	var pathPrefix string             // 文件前缀
	modDirs := make(map[string]int64) // 存储 mod 目录路径和总大小

	// 遍历文件并填充 rm
	err := filepath.Walk(resourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 跳过目录，只处理文件
		if info.IsDir() {
			return nil
		}

		// 去除资源文件夹路径前缀 如 a/b/cars/shmc/r34/1.kn5 需要去除 'a/b/'
		path = filepath.ToSlash(path)

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

		relativePath := strings.TrimPrefix(path, pathPrefix)
		pathSplit := strings.Split(relativePath, "/")

		// 只处理三级路径（resource/pkg/mod），忽略更深层的文件
		// 例如 cars/shmc/rx7/1.kn5 -> cars/shmc/rx7
		if len(pathSplit) >= 3 {
			modPath := strings.Join(pathSplit[:3], "/")
			// 检查路径是否在 catalog 中存在
			_, err := GetModSizeFromPath(resCl, modPath)
			if err != nil {
				// 路径不在 catalog 中，报警
				fmt.Printf("警告: 检测到不在 catalog 中的资源路径: %s\n", modPath)
				// 不添加到 modDirs，跳过该路径
			} else {
				modDirs[modPath] += info.Size()
			}
		}

		return nil
	})

	if err != nil {
		panic(err)
	}

	// 处理所有检测到的 mod 目录，进行完整性检查
	for modPath, totalSize := range modDirs {
		expectedSize, err := GetModSizeFromPath(resCl, modPath)
		if err != nil {
			// 如果无法从 catalog 获取大小，中断
			panic(err)
		}

		if totalSize == 0 {
			// 目录存在但为空
			rm.SetStateWithPath(&rm, modPath, NotImported)
		} else if totalSize < int64(expectedSize) {
			// 文件大小小于预期，标记为不完整
			rm.SetStateWithPath(&rm, modPath, Incomplete)
		} else {
			// 文件大小符合预期，标记为通过
			rm.SetStateWithPath(&rm, modPath, Pass)
		}
	}

	// -- rm 状态处理
	// 通过已经被处理过的 rm 判断上级的状态 (自下而上)
	// 先判断 pkg（二级）的状态，再判断根资源类型（一级）的状态
	// 全部未引入 -> notImported
	// 全部通过 -> pass
	// 有通过但有的未引入 -> Incomplete
	rootItemsAllNotImport := true
	rootItemsAllPass := true

	for pkgName, pkgInfo := range rm[ResourceType(resource)].Items {
		// 如果 pkg 下没有任何 mod，保持 NotImported 状态
		if len(pkgInfo.Items) == 0 {
			continue
		}

		allNotImport := true
		allPass := true

		// 遍历 pkg 下的所有 mod，判断 pkg 的状态
		for _, modInfo := range pkgInfo.Items {
			switch modInfo.State {
			case Pass:
				allNotImport = false
			case Incomplete:
				allNotImport = false
				allPass = false
			case NotImported:
				allPass = false
			}
		}

		// 根据 mod 的状态设置 pkg 的状态
		if allNotImport {
			// 所有 mod 都是 NotImported，pkg 保持 NotImported（初始状态）
			continue
		} else if allPass {
			// 所有 mod 都是 Pass，pkg 设置为 Pass
			rm[ResourceType(resource)].Items[pkgName].State = Pass
			rootItemsAllNotImport = false
		} else {
			// 有 Pass 但有不完整的或未导入的，pkg 设置为 Incomplete
			rm[ResourceType(resource)].Items[pkgName].State = Incomplete
			rootItemsAllNotImport = false
			rootItemsAllPass = false
		}
	}

	// 根据所有 pkg 的状态设置根资源类型的状态
	if rootItemsAllNotImport {
		// 所有 pkg 都是 NotImported，根状态保持 NotImported（初始状态）
		// 不需要更新
	} else if rootItemsAllPass {
		// 所有 pkg 都是 Pass，根状态设置为 Pass
		rm[ResourceType(resource)].State = Pass
	} else {
		// 有 pkg 是 Pass 或 Incomplete，根状态设置为 Incomplete
		rm[ResourceType(resource)].State = Incomplete
	}

	return rm, nil
}

// 用于将资源检测后得到的 resourceMap 转为 json 传给前端
func ResourceMapToJson(rm ResourceMap) (string, error) {
	jsonBytes, err := json.Marshal(rm)
	if err != nil {
		errinfo := fmt.Errorf("转化时发生错误:%v", err)
		return "", errinfo
	}

	return string(jsonBytes), nil
}
