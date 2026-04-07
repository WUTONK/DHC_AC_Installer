package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	modinstall "DHC_Backend/models/service/modInstall"
	"os"
	"path/filepath"
	"testing"
)

// TestClearBackendModInstallIntermediateDirs 验证会删除 resources/cache 与 importResourceCache 下的内容。
func TestClearBackendModInstallIntermediateDirs(t *testing.T) {
	backendRoot, err := infoGet.GetBackendRootPath()
	if err != nil {
		t.Fatalf("GetBackendRootPath: %v", err)
	}

	cacheDir := filepath.Join(backendRoot, "resources", "cache")
	importCacheDir := filepath.Join(modinstall.DevLocalResourceLibraryRoot(backendRoot), "importResourceCache")
	markerCache := filepath.Join(cacheDir, "dhc_unit_test_cleanup_marker.txt")
	markerImport := filepath.Join(importCacheDir, "dhc_unit_test_cleanup_marker.txt")

	if err := os.MkdirAll(filepath.Dir(markerCache), 0o755); err != nil {
		t.Fatalf("mkdir cache: %v", err)
	}
	if err := os.MkdirAll(filepath.Dir(markerImport), 0o755); err != nil {
		t.Fatalf("mkdir importCache: %v", err)
	}
	if err := os.WriteFile(markerCache, []byte("x"), 0o644); err != nil {
		t.Fatalf("write marker cache: %v", err)
	}
	if err := os.WriteFile(markerImport, []byte("y"), 0o644); err != nil {
		t.Fatalf("write marker import: %v", err)
	}

	if err := modinstall.ClearBackendModInstallIntermediateDirs(); err != nil {
		t.Fatalf("ClearBackendModInstallIntermediateDirs: %v", err)
	}

	if _, err := os.Stat(markerCache); !os.IsNotExist(err) {
		t.Fatalf("期望 cache 标记文件已删除: %s", markerCache)
	}
	if _, err := os.Stat(markerImport); !os.IsNotExist(err) {
		t.Fatalf("期望 importResourceCache 标记文件已删除: %s", markerImport)
	}
}

// TestSimEnvDevInstallCleanup_SkipRecycle skip 时不应删除中间目录标记。
func TestSimEnvDevInstallCleanup_SkipRecycle(t *testing.T) {
	backendRoot, err := infoGet.GetBackendRootPath()
	if err != nil {
		t.Fatalf("GetBackendRootPath: %v", err)
	}
	t.Setenv("DHC_DEV", "true")
	infoGet.SetDev(true)

	cacheDir := filepath.Join(backendRoot, "resources", "cache")
	marker := filepath.Join(cacheDir, "dhc_skip_recycle_marker.txt")
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(marker, []byte("keep"), 0o644); err != nil {
		t.Fatalf("write: %v", err)
	}

	if err := modinstall.SimEnvDevInstallCleanup(true); err != nil {
		t.Fatalf("SimEnvDevInstallCleanup(true): %v", err)
	}

	if _, err := os.Stat(marker); err != nil {
		t.Fatalf("skip 时期望保留标记文件: %v", err)
	}
	_ = os.RemoveAll(marker)
}

// TestSimEnvDevInstallCleanup_NonDev 非开发模式下为空操作，不清理中间目录。
func TestSimEnvDevInstallCleanup_NonDev(t *testing.T) {
	t.Setenv("DHC_DEV", "false")
	infoGet.SetDev(false)

	backendRoot, err := infoGet.GetBackendRootPath()
	if err != nil {
		t.Fatalf("GetBackendRootPath: %v", err)
	}
	cacheDir := filepath.Join(backendRoot, "resources", "cache")
	marker := filepath.Join(cacheDir, "dhc_nondev_marker.txt")
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(marker, []byte("z"), 0o644); err != nil {
		t.Fatalf("write: %v", err)
	}

	if err := modinstall.SimEnvDevInstallCleanup(false); err != nil {
		t.Fatalf("SimEnvDevInstallCleanup: %v", err)
	}

	if _, err := os.Stat(marker); err != nil {
		t.Fatalf("非 dev 时期望不清理: %v", err)
	}
	_ = os.Remove(marker)

	t.Setenv("DHC_DEV", "true")
	infoGet.SetDev(true)
}

// TestResetSimEnvModDirectoriesForDevCleanup_requiresDevEnv 未设置 DHC_DEV 时应拒绝。
func TestResetSimEnvModDirectoriesForDevCleanup_requiresDevEnv(t *testing.T) {
	t.Setenv("DHC_DEV", "false")
	infoGet.SetDev(false)

	err := modinstall.ResetSimEnvModDirectoriesForDevCleanup()
	if err == nil {
		t.Fatal("期望非开发环境返回错误")
	}

	t.Setenv("DHC_DEV", "true")
	infoGet.SetDev(true)
}

// TestSimEnvDevInstallCleanup_DevClearsIntermediateDirs 开发模式下会清空中间目录并执行 acRoot 还原（依赖仓库内 envBackup）。
func TestSimEnvDevInstallCleanup_DevClearsIntermediateDirs(t *testing.T) {
	t.Setenv("DHC_DEV", "true")
	t.Setenv("DHC_SIMENV_SKIP_INSTALL_CLEANUP", "false")
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	backendRoot, err := infoGet.GetBackendRootPath()
	if err != nil {
		t.Fatalf("GetBackendRootPath: %v", err)
	}
	cacheDir := filepath.Join(backendRoot, "resources", "cache")
	marker := filepath.Join(cacheDir, "dhc_full_cleanup_marker.txt")
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(marker, []byte("gone"), 0o644); err != nil {
		t.Fatalf("write: %v", err)
	}

	if err := modinstall.SimEnvDevInstallCleanup(false); err != nil {
		t.Fatalf("SimEnvDevInstallCleanup(false): %v", err)
	}

	if _, err := os.Stat(marker); !os.IsNotExist(err) {
		t.Fatalf("开发模式收尾应删除 cache 标记: %s", marker)
	}
}
