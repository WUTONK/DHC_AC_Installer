package sevenZipBootStrap

// 这个文件只在测试时编译，暴露私有函数供测试使用

// TestApi 测试 API 结构体
type TestApi struct{}

// BuildTestURL 暴露 buildTestURL 函数供测试使用
func (t TestApi) BuildTestURL(version string) string {
	return buildTestURL(version)
}

func (t TestApi) ExtractVersion(s string) string {
	return extractVersion(s)
}

func (t TestApi) CompareVersion(v1, v2 string) int {
	return compareVersion(v1, v2)
}
