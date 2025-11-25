package modinstall

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"DHC_Backend/models/service/types"
	"encoding/json"
	"fmt"
	"testing"
)

func TestSingleModInstall(t *testing.T) {
	srcPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/testModFile/car/ddm_toyota_corolla_levin_ae86_1.1/ddm_toyota_corolla_levin_ae86_1.1.rar"
	filePassword := ""
	modinstall.SingleModInstall(srcPath, filePassword, types.DftPathFromDir)
}

func TestInstallCm(t *testing.T) {
	installPath, err := modinstall.InstallCm()
	if err != nil {
		fmt.Println(err)
	}
	fmt.Printf("CM已成功安装到%v\n", installPath)
}

func TestImportResourceDetection(t *testing.T) {
	var res modinstall.ResourceType = modinstall.Cars

	// 调用 ImportResourceDetection 获取完整的资源检测结果
	rm := modinstall.ImportResourceDetection(res)

	// 使用JSON序列化输出完整结构
	jsonData, err := json.MarshalIndent(rm, "", "  ")
	if err != nil {
		fmt.Printf("序列化错误: %v\n", err)
	} else {
		fmt.Println(string(jsonData))
	}
	// map[cars:map[DDM:map[SUPRA:1024] SHMC:map[R32:2048 R34:1024]] tracks:map[main:map[SRP_093:200000] sub:map[NEW_LOOP:30000 SRP_C1:20000]]]
	// {map[cars:map[DDM:map[SUPRA:1024] SHMC:map[R32:2048 R34:1024]] tracks:map[main:map[SRP_093:200000] sub:map[NEW_LOOP:30000 SRP_C1:20000]]]}
}

func TestBuildCompleteResourceStructure(t *testing.T) {
	modinstall.BuildCompleteResourceCatalog()
}

// 测试转化
func TestConversion(t *testing.T) {
	cs := modinstall.BuildCompleteResourceCatalog()
	result := modinstall.BuildCompleteInitResourceMap("cars", cs)
	// 使用JSON序列化输出
	jsonData, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Printf("序列化错误: %v\n", err)
	} else {
		fmt.Println(string(jsonData))
	}
}

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
