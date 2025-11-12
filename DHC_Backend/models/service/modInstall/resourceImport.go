package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	"fmt"
	"os"
	"path/filepath"
)

// 资源导入

// 导入资源检测
// 地图 车辆 光影 仪表盘
type ResourceType string

const (
	maps      ResourceType = "maps"
	cars      ResourceType = "cars"
	shaders   ResourceType = "shaders"
	dashboard ResourceType = "dashboard"
)

type ResourceState string

const (
	pass        ResourceState = "pass"
	notImported ResourceState = "notImported"
	incomplete  ResourceState = "incomplete"
)

func init() {
	_ = maps
	_ = cars
	_ = shaders
	_ = dashboard
	_ = pass
	_ = carsResourceMap
}

type ResourceMap map[string]map[string]map[string]ResourceState

var carsResourceMap = ResourceMap{
	string(cars): map[string]map[string]ResourceState{
		"SHMC": {
			"R34": pass,
		},
	},
}

// 导入资源检测：返回一个已导入资源情况列表 map[string]map[string]bool
func ImportResourceDetection(resource ResourceType) {
	backendRootPath, _ := infoGet.GetBackendRootPath()
	resourceDir := filepath.Join(backendRootPath, "resources", string(resource)) // 得到对应类型的资源文件夹
	_ = resourceDir

	// 检查车辆包
	// 资源分为 大类和小类和具体包（car/SHMC/R34）
	if resource == cars {

		err := filepath.Walk(resourceDir, func(path string, info os.FileInfo, err error) error {
			files = append(files, path)
			return nil
		})
		if err != nil {
			panic(err)
		}
		for _, file := range files {
			fmt.Println(file)
		}
		// 遍历并检查缺失文件夹 得到已存在列表
		// 检查大类完整性
		// 检查小类完整性
		// 检查具体包

		// 资源不完整
	}

}

// 资源完整性检测
