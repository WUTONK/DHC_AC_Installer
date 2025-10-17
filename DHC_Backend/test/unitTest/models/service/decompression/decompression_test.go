package decompression

import (
	decompression "DHC_Backend/models/service/decompression"
	"fmt"
	"testing"
)

func TestDecompression(t *testing.T) {
	srcFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/models/service/decompression/example/decompressionPath/sourceFile/szTest_zip.zip"
	dstFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/models/service/decompression/example/decompressionPath/dstFile"
	result, err := decompression.Decompression(srcFilePath, dstFilePath, "")
	fmt.Printf("%v\n", result)
	fmt.Printf("%v\n", err)
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
	// 重新渲染完成 ---10.1145s
	fmt.Printf("%+v\n", result)
}
