package infoGet

import (
	"os"
	"path/filepath"
)

// IsExists 判断给定文件/目录是否存在
func IsExists(path string) bool {
	_, err := os.Stat(path) //os.Stat获取文件信息
	return !os.IsNotExist(err)
}

// getDirSize 计算目录下所有文件的总大小
func GetDirSize(dirPath string) (int64, error) {
	var totalSize int64

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			totalSize += info.Size()
		}
		return nil
	})

	return totalSize, err
}
