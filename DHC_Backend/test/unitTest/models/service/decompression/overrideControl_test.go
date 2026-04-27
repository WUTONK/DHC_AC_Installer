package decompression_test

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/infoGet"
	getfilesnumber "DHC_Backend/test/testToolsFunction/GetfilesNumber"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

// TestOverrideControl_RuleTargetRemap 验证 rule 的 target 将「多包一层」的源路径映射到游戏 content 下（继承子路径）。
// 与 shmnc129.rar 解压后 shmnc129/content/... 对应：pattern 命中目录节点 shmnc129/content，target 为 content。
func TestOverrideControl_RuleTargetRemap(t *testing.T) {
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	root := t.TempDir()
	inner := filepath.Join(root, "shmnc129", "content", "cars", "c1")
	if err := os.MkdirAll(inner, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(inner, "x.txt"), []byte("ok"), 0o644); err != nil {
		t.Fatal(err)
	}
	dftPath := filepath.Join(root, "dft.json")
	dft := `{
	"modType": "car",
	"defaultAction": {"action": "skip", "backup": false},
	"rules": [
		{"pattern": "shmnc129/content", "action": "overwrite", "backup": false, "target": "content"}
	],
	"overwriteStartingDir": "."
}`
	if err := os.WriteFile(dftPath, []byte(dft), 0o644); err != nil {
		t.Fatal(err)
	}
	dst := filepath.Join(root, "out")
	if err := os.MkdirAll(dst, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := decompression.OverrideControl(root, dst, dftPath); err != nil {
		t.Fatalf("OverrideControl: %v", err)
	}
	outFile := filepath.Join(dst, "content", "cars", "c1", "x.txt")
	if _, err := os.Stat(outFile); err != nil {
		t.Fatalf("期望重映射到 %s: %v", outFile, err)
	}
}

// TestOverrideControl_PatternLeadingSlash 与 TestOverrideControl_RuleTargetRemap 相同语义，但 pattern 带前导 /（与 dft 文档中 /dirname 写法一致）
func TestOverrideControl_PatternLeadingSlash(t *testing.T) {
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	root := t.TempDir()
	inner := filepath.Join(root, "shmnc129", "content", "mark.txt")
	if err := os.MkdirAll(filepath.Dir(inner), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(inner, []byte("1"), 0o644); err != nil {
		t.Fatal(err)
	}
	dftPath := filepath.Join(root, "dft.json")
	dft := `{
	"modType": "car",
	"defaultAction": {"action": "skip", "backup": false},
	"rules": [
		{"pattern": "/shmnc129/content", "action": "overwrite", "backup": false, "target": "content"}
	],
	"overwriteStartingDir": "."
}`
	if err := os.WriteFile(dftPath, []byte(dft), 0o644); err != nil {
		t.Fatal(err)
	}
	dst := filepath.Join(root, "out")
	if err := os.MkdirAll(dst, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := decompression.OverrideControl(root, dst, dftPath); err != nil {
		t.Fatalf("OverrideControl: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, "content", "mark.txt")); err != nil {
		t.Fatalf("expected /shmnc129/content pattern to match: %v", err)
	}
}

func TestOverrideControl(t *testing.T) {
	// 设置开发模式，确保使用模拟环境
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	srcDirPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/resources/cache/Map/ddm_toyota_corolla_levin_ae86_1"
	fmt.Printf("cars文件夹个数%v\n", getfilesnumber.GetFilesNumber(srcDirPath+"/cars"))
	dstDirPath, err := infoGet.GetGamePath(infoGet.SimEnvHasDlc)
	if err != nil {
		t.Fatalf("获取游戏路径时发生错误: %v", err)
	}
	dftPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/models/service/decompression/overrideControlExample/dft/dhcOverrideControlSimple.json"

	fmt.Printf("测试配置:\n")
	fmt.Printf("  源目录: %s\n", srcDirPath)
	fmt.Printf("  目标目录: %s\n", dstDirPath)
	fmt.Printf("  配置文件: %s\n", dftPath)

	err = decompression.OverrideControl(srcDirPath, dstDirPath, dftPath)
	if err != nil {
		t.Errorf("OverrideControl 执行失败: %v", err)
	}
}

func TestCreateBackupDirectory(t *testing.T) {
	// 添加日志输出，防止测试结果被缓存
	t.Logf("Running TestCreateBackupDirectory at %v", t.Name())
	needBackupPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/resources/cache/Map/szTest_zip"
	o := decompression.OverrideStruct{}
	// err := decompression.CreateBackupDirectory("Mod", needBackupPath)
	err := o.Backup("Mod", needBackupPath)
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

func TestRename(t *testing.T) {
	srcFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/unitTest/models/service/decompression/testFiles/rename/ohhh.txt"
	dstFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/unitTest/models/service/decompression/testFiles/rename/file1/1.txt"
	o := decompression.OverrideStruct{}
	err := o.Rename(srcFilePath, dstFilePath)
	if err != nil {
		t.Errorf("Rename failed: %v", err)
	}
}

func TestOverwrite(t *testing.T) {
	srcFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/unitTest/models/service/decompression/testFiles/rename/1.txt"
	dstFilePath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/unitTest/models/service/decompression/testFiles/rename/file1/ohhh.txt"

	t.Logf("开始测试覆盖功能")
	t.Logf("源文件: %s", srcFilePath)
	t.Logf("目标文件: %s", dstFilePath)

	o := decompression.OverrideStruct{}
	err := o.Overwrite(srcFilePath, dstFilePath)
	if err != nil {
		t.Errorf("Overwrite failed: %v", err)
	} else {
		t.Logf("覆盖操作成功完成")
	}
}
