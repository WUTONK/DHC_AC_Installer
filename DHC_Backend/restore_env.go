package main

import (
	"DHC_Backend/models/service/infoGet"
	modinstall "DHC_Backend/models/service/modInstall"
	"fmt"
	"os"
)

func main() {
	// 强制开启开发模式以允许操作 simEnv
	os.Setenv("DHC_DEV", "true")
	infoGet.SetDev(true)

	fmt.Println("正在启动 simEnv 环境还原逻辑...")
	err := modinstall.ResetSimEnvModDirectoriesForDevCleanup()
	if err != nil {
		fmt.Printf("还原失败: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("还原成功！simEnv 已恢复至 envBackup 基线状态。")
}
// DHC_Backend/test/simEnv/acRoot/AC_SKELETON_HASDLC/Assetto Corsa/content/tracks/shuto_revival_project_beta

// // DHC_Backend/test/simEnv/acRoot/AC_SKELETON_HASDLC/Assetto Corsa/content/tracks/shuto_revival_project_beta