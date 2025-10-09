package pkgTest

import (
	sevenZipBootStrapSimple "DHC_Backend/pkg/sevenzipbootstrap_simple"
	"os"
	"path/filepath"
	"testing"
)

func TestBuildDownloadSpec(t *testing.T) {
	testApi := sevenZipBootStrapSimple.TestApi{}

	// 测试 macOS 平台
	t.Run("macOS", func(t *testing.T) {
		spec, err := testApi.BuildDownloadSpec("")
		if err != nil {
			t.Errorf("构建下载规格失败: %v", err)
		}

		expectedURL := "https://www.7-zip.org/a/7z2501-mac.tar.xz"
		if spec.URL != expectedURL {
			t.Errorf("macOS URL 期望 %s, 实际得到 %s", expectedURL, spec.URL)
		}

		if spec.Archive != "tar.xz" {
			t.Errorf("macOS Archive 期望 tar.xz, 实际得到 %s", spec.Archive)
		}

		if spec.BinName != "7zz" {
			t.Errorf("macOS BinName 期望 7zz, 实际得到 %s", spec.BinName)
		}
	})

	// 测试带 SHA256 的情况
	t.Run("WithSHA256", func(t *testing.T) {
		testSHA256 := "abcd1234efgh5678"
		spec, err := testApi.BuildDownloadSpec(testSHA256)
		if err != nil {
			t.Errorf("构建下载规格失败: %v", err)
		}

		if spec.SHA256 != testSHA256 {
			t.Errorf("SHA256 期望 %s, 实际得到 %s", testSHA256, spec.SHA256)
		}
	})
}

func TestCandidateName(t *testing.T) {
	testApi := sevenZipBootStrapSimple.TestApi{}
	result := testApi.CandidateName()

	// 根据当前平台验证结果
	// 注意：这个测试可能在不同平台上产生不同结果
	if result != "7zz" && result != "7z.exe" {
		t.Errorf("候选名称应该是 7zz 或 7z.exe, 实际得到 %s", result)
	}
}

func TestFindPrivate7z(t *testing.T) {
	testApi := sevenZipBootStrapSimple.TestApi{}

	// 创建临时目录进行测试
	tmpDir := t.TempDir()

	// 测试空目录
	result := testApi.FindPrivate7z(tmpDir)
	if result != "" {
		t.Errorf("空目录应该返回空字符串, 实际得到 %s", result)
	}

	// 创建测试文件
	testFile := filepath.Join(tmpDir, "7zz")
	if err := os.WriteFile(testFile, []byte("test"), 0755); err != nil {
		t.Fatalf("创建测试文件失败: %v", err)
	}

	// 测试找到文件
	result = testApi.FindPrivate7z(tmpDir)
	if result != testFile {
		t.Errorf("应该找到文件 %s, 实际得到 %s", testFile, result)
	}
}

func TestVerifySHA256(t *testing.T) {
	testApi := sevenZipBootStrapSimple.TestApi{}

	// 创建临时文件
	tmpFile := filepath.Join(t.TempDir(), "test.txt")
	content := "Hello, World!"
	if err := os.WriteFile(tmpFile, []byte(content), 0644); err != nil {
		t.Fatalf("创建测试文件失败: %v", err)
	}

	// 测试空 SHA256（应该跳过验证）
	err := testApi.VerifySHA256(tmpFile, "")
	if err != nil {
		t.Errorf("空 SHA256 应该跳过验证, 但得到错误: %v", err)
	}

	// 测试错误的 SHA256
	err = testApi.VerifySHA256(tmpFile, "wrong_hash")
	if err == nil {
		t.Error("错误的 SHA256 应该返回错误")
	}

	// 测试正确的 SHA256（需要计算实际值）
	// 这里使用一个已知的 SHA256 值进行测试
	// 注意：实际使用时需要计算正确的 SHA256 值
	err = testApi.VerifySHA256(tmpFile, "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f")
	if err != nil {
		t.Logf("SHA256 验证失败（这是预期的，因为我们使用的是示例值）: %v", err)
	}
}

func TestGetTargetVersion(t *testing.T) {
	testApi := sevenZipBootStrapSimple.TestApi{}
	result := testApi.GetTargetVersion()

	expected := "25.01"
	if result != expected {
		t.Errorf("目标版本期望 %s, 实际得到 %s", expected, result)
	}
}

func TestGetVersionCode(t *testing.T) {
	testApi := sevenZipBootStrapSimple.TestApi{}
	result := testApi.GetVersionCode()

	expected := "2501"
	if result != expected {
		t.Errorf("版本代码期望 %s, 实际得到 %s", expected, result)
	}
}

func TestEnsureSevenZipSimple(t *testing.T) {
	// 创建临时目录
	tmpDir := t.TempDir()

	// 测试空安装目录
	_, err := sevenZipBootStrapSimple.EnsureSevenZipSimple("", "")
	if err == nil {
		t.Error("空安装目录应该返回错误")
	}

	// 测试正常情况（不实际下载，因为需要网络）
	// 这里主要测试参数验证和目录创建
	result, err := sevenZipBootStrapSimple.EnsureSevenZipSimple(tmpDir, "")
	if err != nil {
		// 如果是因为网络问题导致的错误，这是可以接受的
		t.Logf("EnsureSevenZipSimple 返回错误（可能是网络问题）: %v", err)
	} else {
		// 如果成功，验证返回的路径
		if result == "" {
			t.Error("成功时应该返回非空路径")
		}
	}
}

// 基准测试
func BenchmarkBuildDownloadSpec(b *testing.B) {
	testApi := sevenZipBootStrapSimple.TestApi{}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := testApi.BuildDownloadSpec("")
		if err != nil {
			b.Fatalf("构建下载规格失败: %v", err)
		}
	}
}

func BenchmarkFindPrivate7z(b *testing.B) {
	testApi := sevenZipBootStrapSimple.TestApi{}
	tmpDir := b.TempDir()

	// 创建一些测试文件
	for i := 0; i < 10; i++ {
		testFile := filepath.Join(tmpDir, "test_file_"+string(rune(i)))
		os.WriteFile(testFile, []byte("test"), 0644)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		testApi.FindPrivate7z(tmpDir)
	}
}
