package decompression

import (
	decompression "DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/types"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func TestVolumeDetection(t *testing.T) {
	// 创建临时测试目录
	tempDir, err := os.MkdirTemp("", "volume_test")
	if err != nil {
		t.Fatalf("创建临时目录失败: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// 创建测试文件
	testFiles := []string{
		"test.zip",       // 普通zip
		"test.z01",       // zip分卷
		"test.7z",        // 普通7z
		"test.7z.001",    // 7z分卷
		"test.rar",       // 普通rar
		"test.part1.rar", // rar分卷
		"test.txt",       // 非压缩文件
		"test.unknown",   // 未知格式
	}

	for _, filename := range testFiles {
		filePath := filepath.Join(tempDir, filename)
		file, err := os.Create(filePath)
		if err != nil {
			t.Errorf("创建测试文件失败 %s: %v", filename, err)
			continue
		}
		file.WriteString("test content")
		file.Close()

		// 创建 dft.json 文件；dft 是 dhcFileTag 的缩写。
		tagPath := filepath.Join(tempDir, "dft.json")
		if err := os.WriteFile(tagPath, []byte(`{"modType":"Map"}`), 0644); err != nil {
			t.Errorf("创建dft.json失败: %v", err)
			continue
		}

		// 测试Decompression函数
		unDecompressionPath, errorTiming, err := decompression.Decompression(filePath, "", true, "", types.DftPathFromDir)

		fmt.Printf("测试文件: %s\n", filename)
		fmt.Printf("解压目录: %s\n", unDecompressionPath)
		fmt.Printf("错误时机: %s\n", errorTiming)
		if err != nil {
			fmt.Printf("错误信息: %v\n", err)
		} else {
			fmt.Printf("处理成功\n")
		}
		fmt.Println("---")
	}
}
