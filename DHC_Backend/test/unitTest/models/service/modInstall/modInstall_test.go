package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	modinstall "DHC_Backend/models/service/modInstall"
	"DHC_Backend/models/service/types"
	"encoding/json"
	"fmt"
	"testing"
)

func TestSingleModInstall(t *testing.T) {
	srcPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/testModFile/car/ddm_toyota_corolla_levin_ae86_1.1/ddm_toyota_corolla_levin_ae86_1.1.rar"
	modinstall.SingleModInstall(srcPath, types.DftPathFromDir)
}

func TestInstallCm(t *testing.T) {
	installPath, err := modinstall.InstallCm()
	if err != nil {
		fmt.Println(err)
	}
	fmt.Printf("CM已成功安装到%v\n", installPath)
}

func TestImportResourceDetection(t *testing.T) {
	// var res modinstall.ResourceType = modinstall.Cars
	var res modinstall.ResourceType = modinstall.All

	var DetectionPath modinstall.DetectionPath = modinstall.Local

	// 调用 ImportResourceDetection 获取完整的资源检测结果
	rm, err := modinstall.ImportResourceDetection(res, DetectionPath)
	if err != nil {
		fmt.Printf("发生错误")
		fmt.Println(err.Error())
	}

	jsondata, err := modinstall.ResourceMapToJson(rm)
	if err != nil {
		fmt.Println(err.Error())
	}
	fmt.Println(jsondata)

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

func TestDhcResoucePkgImport(t *testing.T) {
	pkgPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/simEnv/windows_finder/desktop/DhcRescousePkgs/SHMC_r32车辆包.zip"
	// /Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/simEnv/windows_finder/desktop/DhcRescousePkgs/SHMC_r32车辆包.zip
	ResouceMap, err := modinstall.DhcResoucePkgImport(pkgPath)
	if err != nil {
		fmt.Println(err.Error())
	}
	jsonData, err := json.MarshalIndent(ResouceMap, "", "  ")
	if err != nil {
		fmt.Printf("序列化错误: %v\n", err)
	} else {
		fmt.Println(string(jsonData))
	}
}

// TestMultiModInstall 测试多模组安装功能
func TestMultiModInstall(t *testing.T) {
	// 设置开发模式，确保使用模拟环境
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	// 测试路径列表，支持一级、二级、三级路径
	paths := []string{
		"cars/SHMC/r32", // 三级路径：直接指定具体模组
		"cars/SHMC",     // 二级路径：安装整个包下的所有模组
		// "cars",          // 一级路径：安装所有车辆模组（可选，如果资源库中有很多车辆可能会很慢）
	}

	// 使用默认路径获取方式
	dftFilePath := string(types.DftPathFromDir)

	// 执行多模组安装
	err := modinstall.MultiModInstall(paths, dftFilePath)
	if err != nil {
		t.Errorf("MultiModInstall 执行失败: %v", err)
		return
	}

	fmt.Println("MultiModInstall 执行成功")
}

// TestResetSimEnvModDirectories 测试 simenv 模组目录重置功能（垃圾回收）
func TestResetSimEnvModDirectories(t *testing.T) {
	// 设置开发模式，确保使用模拟环境
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	err := modinstall.ResetSimEnvModDirectories()
	if err != nil {
		t.Errorf("ResetSimEnvModDirectories 执行失败: %v", err)
		return
	}
	fmt.Println("ResetSimEnvModDirectories 执行成功，simenv 模组目录已重置")
}
