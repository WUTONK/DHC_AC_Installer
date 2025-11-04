package types

// DftPathGetModOrPath 定义获取模组或路径的默认方式
type DftPathGetModOrPath string

const (
	// DftPathFromDir 自动从文件所在目录获取
	DftPathFromDir DftPathGetModOrPath = "Dir"
	// DftPathFromCompressRoot 解压后在压缩包根目录获取
	DftPathFromCompressRoot DftPathGetModOrPath = "InCompressPkgRootFile"
)

