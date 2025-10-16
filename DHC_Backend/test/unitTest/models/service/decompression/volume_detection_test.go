package decompression

import (
	decompression "DHC_Backend/models/service/decompression"
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

		// 创建dhcFileTag.json文件
		tagPath := filepath.Join(tempDir, "dhcFileTag.json")
		if err := os.WriteFile(tagPath, []byte(`{"ModType":"Map"}`), 0644); err != nil {
			t.Errorf("创建dhcFileTag.json失败: %v", err)
			continue
		}

		// 测试Decompression函数
		dstPath := filepath.Join(tempDir, "output_"+filename)
		errorTiming, err := decompression.Decompression(filePath, dstPath)

		fmt.Printf("测试文件: %s\n", filename)
		fmt.Printf("错误时机: %s\n", errorTiming)
		if err != nil {
			fmt.Printf("错误信息: %v\n", err)
		} else {
			fmt.Printf("处理成功\n")
		}
		fmt.Println("---")
	}
}
