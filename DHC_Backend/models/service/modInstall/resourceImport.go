package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// 资源导入

// 导入资源检测
// 地图 车辆 光影 仪表盘
type ResourceType string

const (
	Maps      ResourceType = "maps"
	Cars      ResourceType = "cars"
	Shaders   ResourceType = "shaders"
	Dashboard ResourceType = "dashboard"
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
	_ = Maps
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

type ResourceJson struct {
	Categorys Categorys `json:"categorys"`
}

type mods map[string]int
type Pkgs map[string]mods
type SubCategorys map[string]Pkgs
type Categorys map[string]SubCategorys

// 构建完整资源结构 Build a complete resource structure
// 从 json 构建一个包含了所有资源项目的ResourceMap 用来和实际存在资源进行比对
func (rm ResourceMap) BuildCompleteResourceStructure() ResourceMap {
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

	var cs Categorys

	resourceJsonFileDecode := json.NewDecoder(resourceJsonFile)
	resourceJsonFileDecode.Decode(&cs)

	fmt.Println(cs)

	rm = ResourceMap{}

	return rm
}

// 导入资源检测：返回一个已导入资源情况列表 map[string]map[string]bool
func ImportResourceDetection(resource ResourceType) {
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

		var files []string

		err := filepath.Walk(resourceDir, func(path string, info os.FileInfo, err error) error {
			filepath.ToSlash(path)
			files = append(files, path)
			return nil
		})
		if err != nil {
			panic(err)
		}

		fmt.Printf("%v\n", files)

		// 检查大类完整性
		if len(files) == 1 {
			categoryComplete = false
		}

		// var rm = ResourceMap{}
		// 将 files 转换为ResourceMap{}

		// 遍历并检查缺失文件夹 得到已存在列表

		// 检查小类完整性
		// 检查具体包

		// 资源不完整
	}

}

// 资源完整性检测
