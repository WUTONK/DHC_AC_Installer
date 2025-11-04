package decompression

import (
	decompression "DHC_Backend/models/service/decompression"
	"fmt"
	"testing"
)

func TestDecompression(t *testing.T) {
	srcFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/testModFile/car/ddm_toyota_corolla_levin_ae86_1.1/ddm_toyota_corolla_levin_ae86_1.1.rar"
	// dstFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/models/service/decompression/example/decompressionPath/dstFile"
	// unDecompressionPath, errorTiming, err := decompression.Decompression(srcFilePath, "", types.DftPathFromDir)
	unDecompressionPath, errorTiming, err := decompression.Decompression(srcFilePath, "", "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/models/tools/7z/szFunctionTestFile/dhcFileTag.json")
	fmt.Printf("解压目录: %v\n", unDecompressionPath)
	fmt.Printf("错误时机: %v\n", errorTiming)
	fmt.Printf("错误信息: %v\n", err)
}

func TestGet7zPath(t *testing.T) {
	decompression.Get7zPath(true)
}

func TestSzTest(t *testing.T) {
	decompression.SzTest()
}

func TestDhcFileTagIdentify(t *testing.T) {
	DhcFileTagPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/unitTest/models/service/decompression"
	result, err := decompression.DhcFileTagIdentify(DhcFileTagPath)
	if err != nil {
		t.Errorf("DhcFileTagIdentify failed: %v", err)
		return
	}
	fmt.Printf("%+v\n", result)
}
