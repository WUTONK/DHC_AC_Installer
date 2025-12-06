package decompression

import (
	"DHC_Backend/models/service/infoGet"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sort"
)

// TODO:实现以下逻辑 检测用户哪个盘剩余空间最多 并且在游戏所在盘符剩余空间较少时 自动选择盘符作为资源库文件夹和缓存文件夹
// 资源文件夹推荐所需空间（最大包体积+1GB计算）
// 缓存文件夹推荐所需空间（最大包解压体积+1GB计算）
// 资源文件夹最小所需空间（最小包体积+1GB计算）
// 缓存文件夹最小所需空间（最小包解压体积+1GB计算）

// 包体积常量（单位：MB）
// TODO: 这些值应该从配置文件中读取
const (
	// 最大包体积（MB）
	maxPackageSizeMB = 5000 // 5GB
	// 最大包解压体积（MB）
	maxPackageDecompressedSizeMB = 10000 // 10GB
	// 最小包体积（MB）
	minPackageSizeMB = 1000 // 1GB
	// 最小包解压体积（MB）
	minPackageDecompressedSizeMB = 2000 // 2GB
	// 1GB = 1024MB
	oneGBInMB = 1024
	// 推荐更换游戏目录的阈值：最大包解压体积 + 5GB
	recommendChangeGameDirThresholdMB = maxPackageDecompressedSizeMB + 5*oneGBInMB
)

// getPackageSizeRequirements 获取包体积需求
// 返回：资源文件夹推荐空间、缓存文件夹推荐空间、资源文件夹最小空间、缓存文件夹最小空间（单位：MB）
func getPackageSizeRequirements() (int, int, int, int) {
	resourceDirRecommendedMB := maxPackageSizeMB + oneGBInMB
	cacheDirRecommendedMB := maxPackageDecompressedSizeMB + oneGBInMB
	resourceDirMinMB := minPackageSizeMB + oneGBInMB
	cacheDirMinMB := minPackageDecompressedSizeMB + oneGBInMB
	return resourceDirRecommendedMB, cacheDirRecommendedMB, resourceDirMinMB, cacheDirMinMB
}

// 自动配置资源文件夹和缓存文件夹
// 返回值 推荐资源库文件夹盘符 推荐缓存文件夹盘符 是否推荐更换游戏目录
func AutoSetResouceDirLocal() (string, string, bool, error) {
	// 在 windows 以外的系统上模拟返回盘符
	isDev := infoGet.IsDevModeGet()

	// 检测游戏本体所在盘符空间
	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		return "", "", false, err
	}
	var gamePathDrive string
	if runtime.GOOS != "windows" || isDev {
		gamePathDrive = "C:"
	} else {
		gamePathDrive = filepath.VolumeName(gamePath)
	}

	// 检测系统有哪些盘符
	var dirList []string
	if runtime.GOOS != "windows" || isDev {
		// 非 Windows 系统或开发模式：返回模拟盘符
		dirList = []string{"C:", "D:", "E:"}
	} else {
		// 遍历 A-Z 盘符，检查是否存在
		for drive := 'A'; drive <= 'Z'; drive++ {
			drivePath := string(drive) + ":\\"
			// 检查盘符是否存在
			if _, err := os.Stat(drivePath); err == nil {
				dirList = append(dirList, string(drive)+":")
			}
		}
	}

	// 获取包体积需求
	resourceDirRecommendedMB, cacheDirRecommendedMB, resourceDirMinMB, cacheDirMinMB := getPackageSizeRequirements()

	// 检测游戏盘符空间
	gameDriveSpaceMB, err := infoGet.GetDiskUsage(gamePathDrive)
	if err != nil {
		return "", "", false, fmt.Errorf("无法获取游戏盘符 %s 的空间: %w", gamePathDrive, err)
	}

	// 是否推荐更换游戏目录检测逻辑
	// 逻辑：如果剩余空间不足 最大包解压体积+5GB 则推荐更换
	recommendChangeGameDir := gameDriveSpaceMB < recommendChangeGameDirThresholdMB

	// 检测其他盘符空间
	var dirListWithoutGameDrive []string
	for _, v := range dirList {
		if v != gamePathDrive {
			dirListWithoutGameDrive = append(dirListWithoutGameDrive, v)
		}
	}

	// 按照mb计算，初始化 map
	dirListWithoutGameDriveSpace := make(map[string]int)
	for _, v := range dirListWithoutGameDrive {
		space, err := infoGet.GetDiskUsage(v)
		if err != nil {
			// 如果无法获取某个盘符的空间，跳过该盘符
			continue
		}
		dirListWithoutGameDriveSpace[v] = space
	}

	// 将游戏盘符也加入空间检测（用于后续计算）
	allDriveSpace := make(map[string]int)
	for k, v := range dirListWithoutGameDriveSpace {
		allDriveSpace[k] = v
	}
	allDriveSpace[gamePathDrive] = gameDriveSpaceMB

	// 检测是否有盘符同时塞得下这两个：最大包体积+最大包解压体积+2GB
	totalRequiredMB := resourceDirRecommendedMB + cacheDirRecommendedMB
	var drivesCanFitBoth []string
	for drive, space := range allDriveSpace {
		if space >= totalRequiredMB {
			drivesCanFitBoth = append(drivesCanFitBoth, drive)
		}
	}

	// 如果没有盘符可以同时容纳，则分别查找可以容纳资源文件夹和缓存文件夹的盘符
	var recommendedResourceDrive string
	var recommendedCacheDrive string

	if len(drivesCanFitBoth) > 0 {
		// 有盘符可以同时容纳，选择剩余空间最大的
		sort.Slice(drivesCanFitBoth, func(i, j int) bool {
			return allDriveSpace[drivesCanFitBoth[i]] > allDriveSpace[drivesCanFitBoth[j]]
		})
		recommendedResourceDrive = drivesCanFitBoth[0]
		recommendedCacheDrive = drivesCanFitBoth[0]
	} else {
		// 没有盘符可以同时容纳，分别查找
		// 资源文件夹优先，缓存文件夹其次，按照A-Z排序

		// 查找可以容纳资源文件夹的盘符
		var drivesCanFitResource []string
		for drive, space := range allDriveSpace {
			if space >= resourceDirRecommendedMB {
				drivesCanFitResource = append(drivesCanFitResource, drive)
			}
		}

		// 查找可以容纳缓存文件夹的盘符
		var drivesCanFitCache []string
		for drive, space := range allDriveSpace {
			if space >= cacheDirRecommendedMB {
				drivesCanFitCache = append(drivesCanFitCache, drive)
			}
		}

		// 对盘符进行排序（A-Z）
		sort.Strings(drivesCanFitResource)
		sort.Strings(drivesCanFitCache)

		// 选择资源文件夹盘符：优先选择非游戏盘符，如果都满足则选择剩余空间最大的
		if len(drivesCanFitResource) > 0 {
			// 优先选择非游戏盘符
			var nonGameDrives []string
			for _, drive := range drivesCanFitResource {
				if drive != gamePathDrive {
					nonGameDrives = append(nonGameDrives, drive)
				}
			}

			if len(nonGameDrives) > 0 {
				// 从非游戏盘符中选择剩余空间最大的
				sort.Slice(nonGameDrives, func(i, j int) bool {
					return allDriveSpace[nonGameDrives[i]] > allDriveSpace[nonGameDrives[j]]
				})
				recommendedResourceDrive = nonGameDrives[0]
			} else {
				// 如果只有游戏盘符满足，直接使用游戏盘符
				recommendedResourceDrive = gamePathDrive
			}
		}

		// 选择缓存文件夹盘符：优先选择与资源文件夹不同的盘符，如果都满足则选择剩余空间最大的
		if len(drivesCanFitCache) > 0 {
			// 优先选择与资源文件夹不同的盘符
			var differentDrives []string
			for _, drive := range drivesCanFitCache {
				if drive != recommendedResourceDrive {
					differentDrives = append(differentDrives, drive)
				}
			}

			if len(differentDrives) > 0 {
				// 从不同盘符中选择剩余空间最大的
				sort.Slice(differentDrives, func(i, j int) bool {
					return allDriveSpace[differentDrives[i]] > allDriveSpace[differentDrives[j]]
				})
				recommendedCacheDrive = differentDrives[0]
			} else {
				// 如果只有资源文件夹所在盘符满足，使用同一个盘符
				recommendedCacheDrive = recommendedResourceDrive
			}
		}
	}

	// 如果仍然没有找到合适的盘符，使用最小空间要求再次尝试
	if recommendedResourceDrive == "" {
		// 使用最小空间要求查找
		for drive, space := range allDriveSpace {
			if space >= resourceDirMinMB {
				if recommendedResourceDrive == "" || allDriveSpace[drive] > allDriveSpace[recommendedResourceDrive] {
					recommendedResourceDrive = drive
				}
			}
		}
	}

	if recommendedCacheDrive == "" {
		// 使用最小空间要求查找
		for drive, space := range allDriveSpace {
			if space >= cacheDirMinMB {
				if recommendedCacheDrive == "" || (drive != recommendedResourceDrive && allDriveSpace[drive] > allDriveSpace[recommendedCacheDrive]) {
					recommendedCacheDrive = drive
				}
			}
		}
		// 如果仍然找不到，使用资源文件夹所在盘符
		if recommendedCacheDrive == "" && recommendedResourceDrive != "" {
			recommendedCacheDrive = recommendedResourceDrive
		}
	}

	// 如果最终还是没有找到合适的盘符，返回错误
	if recommendedResourceDrive == "" || recommendedCacheDrive == "" {
		return "", "", recommendChangeGameDir, fmt.Errorf("没有找到合适的盘符：资源文件夹需要至少 %dMB，缓存文件夹需要至少 %dMB", resourceDirMinMB, cacheDirMinMB)
	}

	return recommendedResourceDrive, recommendedCacheDrive, recommendChangeGameDir, nil
}
