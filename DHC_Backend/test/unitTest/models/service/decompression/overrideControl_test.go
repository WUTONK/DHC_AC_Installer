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
