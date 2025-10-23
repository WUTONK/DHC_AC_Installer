package decompression_test

import (
	"DHC_Backend/models/service/decompression"
	"testing"
)

func TestOverrideControl(t *testing.T) {
	// 测试 OverrideControl 函数
	// 这里可以添加具体的测试逻辑
	dftPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/models/service/decompression/overrideControlExample/dft/dhcOverrideControlSimple.json"
	decompression.OverrideControl("", "", dftPath)
}

func TestCreateBackupDirectory(t *testing.T) {
	// 添加日志输出，防止测试结果被缓存
	t.Logf("Running TestCreateBackupDirectory at %v", t.Name())

	needBackupPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/resources/cache/Map/szTest_zip"
	err := decompression.CreateBackupDirectory("Mod", needBackupPath)
	if err != nil {
		t.Errorf("CreateBackupDirectory failed: %v", err)
	}
}

func TestMatchPractise(t *testing.T) {
	decompression.MatchPractise()
}
