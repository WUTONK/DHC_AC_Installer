package main

import (
	"fmt"
	"log"
	"path/filepath"

	sevenZipBootStrapSimple "DHC_Backend/pkg/sevenzipbootstrap_simple"
)

func main() {
	// 示例：使用 sevenzipbootstrap_simple 包下载 7-Zip 25.01 版本

	// 设置安装目录
	installDir := filepath.Join(".", "7zip_install")

	// 可选：提供 SHA256 校验值（如果不确定可以传空字符串）
	sha256 := "" // 可以填入实际的 SHA256 值进行校验

	fmt.Printf("开始下载 7-Zip %s 版本到目录: %s\n",
		sevenZipBootStrapSimple.TestApi{}.GetTargetVersion(), installDir)

	// 调用简化版函数
	sevenZipPath, err := sevenZipBootStrapSimple.EnsureSevenZipSimple(installDir, sha256)
	if err != nil {
		log.Fatalf("下载/安装 7-Zip 失败: %v", err)
	}

	fmt.Printf("7-Zip 安装成功！路径: %s\n", sevenZipPath)

	// 验证安装
	fmt.Printf("版本代码: %s\n", sevenZipBootStrapSimple.TestApi{}.GetVersionCode())
}
