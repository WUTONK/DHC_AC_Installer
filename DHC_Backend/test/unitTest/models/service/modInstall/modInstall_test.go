package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	modinstall "DHC_Backend/models/service/modInstall"
	"DHC_Backend/models/service/servicelog"
	"DHC_Backend/models/service/types"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func init() {
	// 本包测试默认仅输出 [warn] 及以上；若已设置 DHC_LOG_LEVEL 则尊重环境变量（勿覆盖）。
	// 需要完整服务日志时：DHC_LOG_LEVEL=debug go test -v ./...（在 DHC_Backend 目录执行）
	if strings.TrimSpace(os.Getenv("DHC_LOG_LEVEL")) != "" {
		return
	}
	servicelog.SetLevel(servicelog.LevelWarn)
}

func TestSingleModInstall(t *testing.T) {
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)
	srcPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/testModFile/car/ddm_toyota_corolla_levin_ae86_1.1/ddm_toyota_corolla_levin_ae86_1.1.rar"
	modinstall.SingleModInstall(srcPath, types.DftPathFromDir)
}

func TestInstallCm(t *testing.T) {
	installPath, err := modinstall.InstallCm()
	if err != nil {
		fmt.Println(err)
	}
	fmt.Printf("CM已成功安装到%v\n", installPath)
}

func TestImportResourceDetection(t *testing.T) {
	// var res modinstall.ResourceType = modinstall.Cars
	var res modinstall.ResourceType = modinstall.All

	var DetectionPath modinstall.DetectionPath = modinstall.Local

	// 调用 ImportResourceDetection 获取完整的资源检测结果
	rm, err := modinstall.ImportResourceDetection(res, DetectionPath)
	if err != nil {
		fmt.Printf("发生错误")
		fmt.Println(err.Error())
	}

	jsondata, err := modinstall.ResourceMapToJson(rm)
	if err != nil {
		fmt.Println(err.Error())
	}
	fmt.Println(jsondata)

}

func TestBuildCompleteResourceStructure(t *testing.T) {
	modinstall.BuildCompleteResourceCatalog()
}

// 测试转化
func TestConversion(t *testing.T) {
	cs := modinstall.BuildCompleteResourceCatalog()
	result := modinstall.BuildCompleteInitResourceMap("cars", cs)
	// 使用JSON序列化输出
	jsonData, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Printf("序列化错误: %v\n", err)
	} else {
		fmt.Println(string(jsonData))
	}
}

func TestDhcResoucePkgImport(t *testing.T) {
	pkgPath := "/Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/simEnv/windows_finder/desktop/DhcRescousePkgs/SHMC_r32车辆包.zip"
	// /Users/wuzitong/Desktop/programming/DHC_AC_Installer/DHC_Backend/test/simEnv/windows_finder/desktop/DhcRescousePkgs/SHMC_r32车辆包.zip
	ResouceMap, err := modinstall.DhcResoucePkgImport(pkgPath)
	if err != nil {
		fmt.Println(err.Error())
	}
	jsonData, err := json.MarshalIndent(ResouceMap, "", "  ")
	if err != nil {
		fmt.Printf("序列化错误: %v\n", err)
	} else {
		fmt.Println(string(jsonData))
	}
}

// TestMultiModInstall 测试多模组安装功能
func TestMultiModInstall(t *testing.T) {
	// 设置开发模式，确保使用模拟环境
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	// 测试路径列表，支持一级、二级、三级路径
	paths := []string{
		"cars/SHMC/r32", // 三级路径：直接指定具体模组
		"cars/SHMC",     // 二级路径：安装整个包下的所有模组
		// "cars",          // 一级路径：安装所有车辆模组（可选，如果资源库中有很多车辆可能会很慢）
	}

	// 使用默认路径获取方式
	dftFilePath := string(types.DftPathFromDir)

	// 执行多模组安装
	err := modinstall.MultiModInstall(paths, dftFilePath)
	if err != nil {
		t.Errorf("MultiModInstall 执行失败: %v", err)
		return
	}

	fmt.Println("MultiModInstall 执行完成")
}

// TestMinimalModsetInstallV01 最小模组集（cars/tracks/shaders 各一）安装 Demo
func TestMinimalModsetInstallV01(t *testing.T) {
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	var snapshots []modinstall.ProgressSnapshot
	tracker := modinstall.NewTaskTracker(func(s modinstall.ProgressSnapshot) {
		snapshots = append(snapshots, s)
	})

	err := modinstall.RunMinimalModsetInstall(tracker)
	if err != nil {
		t.Fatalf("RunMinimalModsetInstall: %v", err)
	}

	if len(snapshots) == 0 {
		t.Fatal("期望 tracker 至少收到一次进度回调")
	}

	last := snapshots[len(snapshots)-1]
	if last.TotalProgress < 99.99 {
		t.Fatalf("期望最终进度到达 100%%，实际 %.2f%%", last.TotalProgress)
	}

	if last.PhaseStatus != "completed" {
		t.Fatalf("期望最终阶段状态为 completed，实际 %s", last.PhaseStatus)
	}

	t.Logf("[核心] 最小模组集安装：进度回调 %d 条，最终总进度 %.2f%%，阶段状态 %s",
		len(snapshots), last.TotalProgress, last.PhaseStatus)
}

// TestResetSimEnvModDirectories 测试 simenv 模组目录重置功能（垃圾回收）
func TestResetSimEnvModDirectories(t *testing.T) {
	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		t.Fatalf("获取后端根目录失败: %v", err)
	}

	// 在临时目录中构造一份可被重置的游戏目录，避免污染 git 跟踪的 simenv 骨架目录。
	tempGamePath := filepath.Join(t.TempDir(), "Assetto Corsa")
	dirtyContentPath := filepath.Join(tempGamePath, "content", "cars", "temp_mod")
	if err := os.MkdirAll(dirtyContentPath, 0o755); err != nil {
		t.Fatalf("创建临时 content 目录失败: %v", err)
	}
	dirtyFilePath := filepath.Join(dirtyContentPath, "temp.txt")
	if err := os.WriteFile(dirtyFilePath, []byte("dirty"), 0o644); err != nil {
		t.Fatalf("写入脏文件失败: %v", err)
	}

	err = modinstall.ResetSimEnvModDirectoriesAtPath(tempGamePath)
	if err != nil {
		t.Fatalf("ResetSimEnvModDirectoriesAtPath 执行失败: %v", err)
	}

	// 脏文件应该被清掉，说明 reset 确实删除了旧 content。
	if _, err := os.Stat(dirtyFilePath); !os.IsNotExist(err) {
		t.Fatalf("期望脏文件被清理，但仍存在: %s", dirtyFilePath)
	}

	// 备份中的基线文件应该被恢复到临时目录。
	restoredWeatherFile := filepath.Join(tempGamePath, "content", "weather", "4_mid_clear", "weather.ini")
	if _, err := os.Stat(restoredWeatherFile); err != nil {
		t.Fatalf("期望基线文件已恢复，但未找到: %s err=%v", restoredWeatherFile, err)
	}

	expectedWeatherFile := filepath.Join(
		backendRootPath,
		"test", "simEnv", "acRoot", "envBackup", "AC_SKELETON_HASDLC",
		"content", "weather", "4_mid_clear", "weather.ini",
	)
	if _, err := os.Stat(expectedWeatherFile); err != nil {
		t.Fatalf("备份基线文件不存在，测试前提不成立: %s err=%v", expectedWeatherFile, err)
	}

	fmt.Println("ResetSimEnvModDirectoriesAtPath 执行成功，临时游戏目录已重置")
}

func TestResetSimEnvModDirectoriesRejectsTrackedSkeleton(t *testing.T) {
	t.Setenv("DHC_DEV", "true")
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	err := modinstall.ResetSimEnvModDirectories()
	if err == nil {
		t.Fatal("期望拒绝直接操作 git 跟踪的 simenv 骨架目录，但返回了 nil")
	}
	if !strings.Contains(err.Error(), "拒绝直接操作 git 跟踪的 simenv 骨架目录") {
		t.Fatalf("期望返回安全护栏错误，实际: %v", err)
	}
}
