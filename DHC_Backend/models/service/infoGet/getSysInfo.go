package infoGet

import (
	"fmt"

	humanize "github.com/dustin/go-humanize"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
)

type sysInfo struct {
	OsType    string //系统类型
	OsVersion string //系统版本
}

// GetSysInfo 用来检测用户的系统和硬件信息、作为是否满足安装要求的参考
// 获取系统的操作系统版本、磁盘信息
func GetSysInfo() sysInfo {
	userSysInfo := sysInfo{}

	// 获取系统信息
	hInfo, err := host.Info()
	if err == nil {
		fmt.Printf("操作系统平台: \"%s\"\n", hInfo.Platform)
		fmt.Printf("操作系统版本: \"%s\"\n", hInfo.PlatformVersion) // 尝试获取版本
		fmt.Printf("内核版本: \"%s\"\n", hInfo.KernelVersion)
		userSysInfo.OsType = hInfo.Platform
		userSysInfo.OsVersion = hInfo.PlatformVersion
	} else {
		fmt.Printf("无法获取系统信息: %v\n", err)
	}

	return userSysInfo
}

// 计算传入路径所属的硬盘分区的剩余空间
func GetDiskUsage(path string) (int, error) {
	di, err := disk.Usage(path)
	if err != nil {
		return 0, err
	}
	percentage := (float64(di.Total-di.Free) / float64(di.Total)) * 100
	fmt.Printf("%s of %s disk space used (%0.2f%%)\n",
		humanize.Bytes(di.Total-di.Free),
		humanize.Bytes(di.Total),
		percentage,
	)

	// 返回MB
	return int(di.Free / (1024 * 1024)), nil
}
