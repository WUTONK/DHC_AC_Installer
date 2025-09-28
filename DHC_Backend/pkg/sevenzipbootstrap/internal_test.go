//go:build test
// +build test

package sevenzipbootstrap

// 这个文件只在测试时编译，暴露私有函数供测试使用

// TestBuildTestURL 暴露 buildTestURL 函数供测试使用
func TestBuildTestURL(version string) string {
	return buildTestURL(version)
}

// TestExtractVersion 暴露 extractVersion 函数供测试使用
func TestExtractVersion(s string) string {
	return extractVersion(s)
}

// TestCompareVersion 暴露 compareVersion 函数供测试使用
func TestCompareVersion(v1, v2 string) int {
	return compareVersion(v1, v2)
}
