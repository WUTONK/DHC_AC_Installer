package modinstall

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"testing"
)

func TestmodInstall(t *testing.T) {
	srcPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/testModFile/car/ddm_toyota_corolla_levin_ae86_1.1/ddm_toyota_corolla_levin_ae86_1.1.rar"
	filePassword := ""
	modinstall.SingleModInstall(srcPath, filePassword)
}

// enum
// ActionDecision
// decided
// enum{rule, inherit, default}
