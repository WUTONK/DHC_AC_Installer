package modinstall

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"DHC_Backend/models/service/types"
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
	rm := modinstall.ResourceMap{modinstall.Cars: modinstall.NewResourceStateInfo("notImported")}
	var res modinstall.ResourceType = modinstall.Cars
	rm.SetState("Cars", "SHMC", "R34", "pass")
	fmt.Println(res)

	// modinstall.ImportResourceDetection(res)
}
