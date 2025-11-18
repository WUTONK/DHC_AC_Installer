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
	rm := modinstall.ResourceMap{}
	// var res modinstall.ResourceType = modinstall.Cars
	rm.SetState("Cars", "SHMC", "R34", "pass")

	// 使用JSON序列化输出
	jsonData, err := json.MarshalIndent(rm, "", "  ")
	if err != nil {
		fmt.Printf("序列化错误: %v\n", err)
	} else {
		fmt.Println(string(jsonData))
	}

	// modinstall.ImportResourceDetection(res)
}

func TestBuildCompleteResourceStructure(t *testing.T) {
	rm := modinstall.ResourceMap{}
	rm.BuildCompleteResourceStructure()
}
