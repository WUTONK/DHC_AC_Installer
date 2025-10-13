package infoGet

import (
	"os"
	"path/filepath"
)

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
