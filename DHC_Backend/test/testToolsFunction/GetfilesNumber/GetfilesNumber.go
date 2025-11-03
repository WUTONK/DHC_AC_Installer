package getfilesnumber

import (
	"fmt"
	"io/fs"
	"path/filepath"
)

func GetFilesNumber(srcPath string) int {
	filesNumber := 0
	err := filepath.WalkDir(srcPath, func(path string, d fs.DirEntry, err error) error {
		filesNumber++
		return nil
	})
	if err != nil {
		fmt.Printf("error happen in FetFilesNumber,%s \n", err)
	}
	return filesNumber
}
