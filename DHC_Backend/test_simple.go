package main

import (
	decompression "DHC_Backend/models/service/decompression"
	"fmt"
)

func main() {
	srcFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/models/tools/7z/szFunctionTestFile/szTest_zip.zip"
	dstFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/models/service/decompression/example/decompressionPath/dstFile"

	fmt.Println("开始解压测试...")
	errorTiming, err := decompression.Decompression(srcFilePath, dstFilePath, "")
	if err != nil {
		fmt.Printf("解压失败: %v (错误时机: %s)\n", err, errorTiming)
	} else {
		fmt.Printf("解压成功 (错误时机: %s)\n", errorTiming)
	}
}
