package decompression_test

import (
	"DHC_Backend/models/service/decompression"
	"fmt"
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

func TestDecodeDhcFileTagConfig(t *testing.T) {
	fmt.Println("\n=== 开始路径匹配测试 ===")

	// 测试用例
	testCases := []struct {
		rulePath   string
		targetPath string
		expected   bool
	}{
		// 测试 /* 模式（匹配 * 所在级别目录下所有文件，不包括子目录）
		{"mod/shutoko/*", "mod/shutoko/a.txt", true},
		{"mod/shutoko/*", "mod/shutoko/1/a.txt", false},
		{"mod/shutoko/*", "mod/shutoko/1/2/a.txt", false},
		{"mod/shutoko/*", "mod/other/a.txt", false},
		{"mod/shutoko/*", "mod/a.txt", false},

		// 测试 /** 模式（递归匹配）
		{"mod/shutoko/**", "mod/shutoko/a.txt", true},
		{"mod/shutoko/**", "mod/shutoko/1/a.txt", true},
		{"mod/shutoko/**", "mod/shutoko", true},
		{"mod/shutoko/**", "mod/other/a.txt", false},

		// 测试精确匹配
		{"mod/shutoko/a.txt", "mod/shutoko/a.txt", true},
		{"mod/shutoko/a.txt", "mod/shutoko/b.txt", false},

		// 测试通配符 * (单层目录)
		{"mod/shutoko/*.txt", "mod/shutoko/a.txt", true},
		{"mod/shutoko/*.txt", "mod/shutoko/b.txt", true},
		{"mod/shutoko/*.txt", "mod/shutoko/a.json", false},
		{"mod/shutoko/*.txt", "mod/shutoko/1/a.txt", false}, // 标准 * 不匹配多层

		// 测试无目录
		{"*.cfg", "mod/shutoko/a.cfg", true},

		// 多匹配优先级：
		// 先执行大的优先级
	}

	passCount := 0
	failCount := 0

	for i, tc := range testCases {
		result := decompression.DirectoryMatching(tc.rulePath, tc.targetPath)
		status := "✓"
		if result != tc.expected {
			status = "✗"
			failCount++
		} else {
			passCount++
		}

		fmt.Printf("%s 测试 %d: 规则='%s' 目标='%s' 期望=%v 实际=%v\n",
			status, i+1, tc.rulePath, tc.targetPath, tc.expected, result)
	}

	fmt.Printf("\n测试完成: 通过 %d/%d, 失败 %d/%d\n", passCount, len(testCases), failCount, len(testCases))
	fmt.Println("=== 路径匹配测试结束 ===")
}

func TestRename2(t *testing.T) {
	srcFilePath := "/123.txt"
	dstFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/unitTest/models/service/decompression/testFiles/rename/file1/lingangu.txt"
	o := decompression.OverrideStruct{}
	err := o.Rename(srcFilePath, dstFilePath)
	if err != nil {
		t.Errorf("Rename failed: %v", err)
	}
}
