package sevenZipBootStrapSimple

// 这个文件只在测试时编译，暴露私有函数供测试使用

// TestApi 测试 API 结构体
type TestApi struct{}

// BuildDownloadSpec 暴露 buildDownloadSpec 函数供测试使用
func (t TestApi) BuildDownloadSpec(sha256 string) (downloadSpec, error) {
	return buildDownloadSpec(sha256)
}

// CandidateName 暴露 candidateName 函数供测试使用
func (t TestApi) CandidateName() string {
	return candidateName()
}

// FindPrivate7z 暴露 findPrivate7z 函数供测试使用
func (t TestApi) FindPrivate7z(dir string) string {
	return findPrivate7z(dir)
}

// VerifySHA256 暴露 verifySHA256 函数供测试使用
func (t TestApi) VerifySHA256(path, want string) error {
	return verifySHA256(path, want)
}

// GetTargetVersion 获取固定目标版本
func (t TestApi) GetTargetVersion() string {
	return TARGET_VERSION
}

// GetVersionCode 获取版本代码
func (t TestApi) GetVersionCode() string {
	return VERSION_CODE
}
