package decompression_test

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/infoGet"
	"fmt"
	"testing"
)

func TestAutoSetResouceDirLocal(t *testing.T) {
	// 设置开发模式，确保使用模拟环境
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	t.Logf("开始测试 AutoSetResouceDirLocal")
	t.Logf("开发模式: %v", infoGet.IsDevModeGet())
	t.Logf("测试环境类型: %v", infoGet.GetTestEnvType())

	// 执行函数
	resourceDrive, cacheDrive, recommendChange, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Errorf("AutoSetResouceDirLocal 执行失败: %v", err)
		return
	}

	// 输出结果
	t.Logf("测试结果:")
	t.Logf("  推荐资源库文件夹盘符: %s", resourceDrive)
	t.Logf("  推荐缓存文件夹盘符: %s", cacheDrive)
	t.Logf("  是否推荐更换游戏目录: %v", recommendChange)

	// 基本验证
	if resourceDrive == "" {
		t.Error("资源库文件夹盘符不应为空")
	}
	if cacheDrive == "" {
		t.Error("缓存文件夹盘符不应为空")
	}

	// 验证盘符格式（应该是 "X:" 格式）
	if len(resourceDrive) < 2 || resourceDrive[1] != ':' {
		t.Errorf("资源库文件夹盘符格式不正确: %s", resourceDrive)
	}
	if len(cacheDrive) < 2 || cacheDrive[1] != ':' {
		t.Errorf("缓存文件夹盘符格式不正确: %s", cacheDrive)
	}

	fmt.Printf("\n=== AutoSetResouceDirLocal 测试结果 ===\n")
	fmt.Printf("资源库文件夹盘符: %s\n", resourceDrive)
	fmt.Printf("缓存文件夹盘符: %s\n", cacheDrive)
	fmt.Printf("是否推荐更换游戏目录: %v\n", recommendChange)
	fmt.Printf("========================================\n\n")
}

func TestAutoSetResouceDirLocal_ErrorHandling(t *testing.T) {
	// 测试错误处理：临时设置一个无效的游戏路径
	// 注意：这个测试可能会失败，因为 GetGamePathAuto 可能不会返回错误
	// 这里主要是展示如何测试错误情况

	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, _, err := decompression.AutoSetResouceDirLocal()

	// 即使有错误，也应该有合理的返回值或错误信息
	if err != nil {
		t.Logf("检测到错误（这可能是预期的）: %v", err)
		// 如果有错误，返回值应该都是空的
		if resourceDrive != "" || cacheDrive != "" {
			t.Error("有错误时，返回值应该为空")
		}
	} else {
		t.Logf("函数执行成功，返回盘符: %s, %s", resourceDrive, cacheDrive)
	}
}

func TestAutoSetResouceDirLocal_RecommendChangeGameDir(t *testing.T) {
	// 测试是否推荐更换游戏目录的逻辑
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, recommendChange, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	t.Logf("是否推荐更换游戏目录: %v", recommendChange)
	t.Logf("资源库文件夹盘符: %s", resourceDrive)
	t.Logf("缓存文件夹盘符: %s", cacheDrive)

	// recommendChange 应该是一个布尔值（这里只是验证它被正确返回）
	if recommendChange {
		t.Logf("系统建议更换游戏目录（游戏盘符空间不足）")
	} else {
		t.Logf("游戏目录空间充足，无需更换")
	}
}

func TestAutoSetResouceDirLocal_MultipleRuns(t *testing.T) {
	// 测试多次运行的一致性
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	results := make([]struct {
		resourceDrive   string
		cacheDrive      string
		recommendChange bool
	}, 3)

	for i := 0; i < 3; i++ {
		resourceDrive, cacheDrive, recommendChange, err := decompression.AutoSetResouceDirLocal()
		if err != nil {
			t.Fatalf("第 %d 次运行失败: %v", i+1, err)
		}

		results[i] = struct {
			resourceDrive   string
			cacheDrive      string
			recommendChange bool
		}{
			resourceDrive:   resourceDrive,
			cacheDrive:      cacheDrive,
			recommendChange: recommendChange,
		}

		t.Logf("第 %d 次运行: 资源=%s, 缓存=%s, 推荐更换=%v",
			i+1, resourceDrive, cacheDrive, recommendChange)
	}

	// 验证多次运行的结果应该一致（在相同环境下）
	firstResult := results[0]
	for i := 1; i < 3; i++ {
		if results[i].resourceDrive != firstResult.resourceDrive {
			t.Logf("警告: 第 %d 次运行的资源盘符与第一次不同: %s vs %s",
				i+1, results[i].resourceDrive, firstResult.resourceDrive)
		}
		if results[i].cacheDrive != firstResult.cacheDrive {
			t.Logf("警告: 第 %d 次运行的缓存盘符与第一次不同: %s vs %s",
				i+1, results[i].cacheDrive, firstResult.cacheDrive)
		}
		if results[i].recommendChange != firstResult.recommendChange {
			t.Logf("警告: 第 %d 次运行的推荐更换标志与第一次不同: %v vs %v",
				i+1, results[i].recommendChange, firstResult.recommendChange)
		}
	}
}

func TestAutoSetResouceDirLocal_DifferentEnvs(t *testing.T) {
	// 测试不同环境类型下的行为
	infoGet.SetDev(true)

	// 测试不同的环境类型
	testCases := []struct {
		name    string
		envType func() // 设置环境类型的函数
	}{
		{
			name: "SimEnvHasDlc",
			envType: func() {
				infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)
			},
		},
		{
			name: "SimEnvnoDlc",
			envType: func() {
				infoGet.SetTestEnvType(infoGet.SimEnvnoDlc)
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.envType()

			resourceDrive, cacheDrive, recommendChange, err := decompression.AutoSetResouceDirLocal()

			if err != nil {
				t.Errorf("环境类型 %s 下执行失败: %v", tc.name, err)
				return
			}

			t.Logf("环境类型: %s", tc.name)
			t.Logf("  资源库文件夹盘符: %s", resourceDrive)
			t.Logf("  缓存文件夹盘符: %s", cacheDrive)
			t.Logf("  是否推荐更换游戏目录: %v", recommendChange)

			// 基本验证
			if resourceDrive == "" || cacheDrive == "" {
				t.Errorf("环境类型 %s 下，盘符不应为空", tc.name)
			}
		})
	}
}

func TestDiskInfoDetection(t *testing.T) {
	// 测试磁盘信息检测功能（SSD/HDD 和可拔插设备）
	infoGet.SetDev(true)

	// 测试模拟盘符（在开发模式下）
	testDrives := []string{"C:", "D:", "E:"}

	for _, drive := range testDrives {
		t.Run(fmt.Sprintf("Drive_%s", drive), func(t *testing.T) {
			isSSD, isRemovable, err := infoGet.GetDiskInfo(drive)

			// 在非Windows系统或开发模式下，可能会返回错误，这是正常的
			if err != nil {
				t.Logf("盘符 %s 检测失败（可能是非Windows系统或开发模式）: %v", drive, err)
				return
			}

			t.Logf("盘符: %s", drive)
			t.Logf("  是否为SSD: %v", isSSD)
			t.Logf("  是否为可拔插设备: %v", isRemovable)

			// 验证返回值是有效的布尔值（这里只是记录，不做强制验证）
			_ = isSSD
			_ = isRemovable
		})
	}
}

func TestAutoSetResouceDirLocal_SSDPriority(t *testing.T) {
	// 测试SSD优先级选择逻辑
	// 注意：这个测试依赖于实际的磁盘检测，在开发模式下可能无法完全测试
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, _, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	t.Logf("选择的资源盘符: %s", resourceDrive)
	t.Logf("选择的缓存盘符: %s", cacheDrive)

	// 检查选择的盘符信息
	if resourceDrive != "" {
		isSSD, isRemovable, err := infoGet.GetDiskInfo(resourceDrive)
		if err == nil {
			t.Logf("资源盘符 %s: SSD=%v, 可拔插=%v", resourceDrive, isSSD, isRemovable)
			// 如果检测到SSD，应该优先选择（这里只是记录，不做强制验证）
			if isSSD {
				t.Logf("✓ 资源盘符选择了SSD（符合优先级）")
			}
			if isRemovable {
				t.Logf("⚠ 资源盘符选择了可拔插设备（可能会输出警告）")
			}
		}
	}

	if cacheDrive != "" {
		isSSD, isRemovable, err := infoGet.GetDiskInfo(cacheDrive)
		if err == nil {
			t.Logf("缓存盘符 %s: SSD=%v, 可拔插=%v", cacheDrive, isSSD, isRemovable)
			if isSSD {
				t.Logf("✓ 缓存盘符选择了SSD（符合优先级）")
			}
			if isRemovable {
				t.Logf("⚠ 缓存盘符选择了可拔插设备（可能会输出警告）")
			}
		}
	}
}

func TestAutoSetResouceDirLocal_RemovableDeviceWarning(t *testing.T) {
	// 测试可拔插设备警告功能
	// 这个测试主要验证当选择可拔插设备时，函数会输出警告信息
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, _, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	// 检查是否选择了可拔插设备
	if resourceDrive != "" {
		isRemovable, err := infoGet.IsRemovable(resourceDrive)
		if err == nil && isRemovable {
			t.Logf("⚠ 资源盘符 %s 是可拔插设备，函数应该已输出警告", resourceDrive)
		}
	}

	if cacheDrive != "" {
		isRemovable, err := infoGet.IsRemovable(cacheDrive)
		if err == nil && isRemovable {
			t.Logf("⚠ 缓存盘符 %s 是可拔插设备，函数应该已输出警告", cacheDrive)
		}
	}
}

func TestAutoSetResouceDirLocal_PriorityOrder(t *testing.T) {
	// 测试优先级排序逻辑
	// 优先级：1. SSD > HDD  2. 固定设备 > 可拔插设备  3. 剩余空间大小
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, _, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	t.Logf("测试优先级排序结果:")
	t.Logf("  资源盘符: %s", resourceDrive)
	t.Logf("  缓存盘符: %s", cacheDrive)

	// 验证选择的盘符符合优先级规则
	// 注意：这个测试依赖于实际的磁盘检测，在开发模式下可能无法完全验证
	// 这里主要是记录选择的盘符信息，供人工验证
	if resourceDrive != "" && cacheDrive != "" {
		resourceSSD, resourceRemovable, _ := infoGet.GetDiskInfo(resourceDrive)
		cacheSSD, cacheRemovable, _ := infoGet.GetDiskInfo(cacheDrive)

		t.Logf("资源盘符信息: SSD=%v, 可拔插=%v", resourceSSD, resourceRemovable)
		t.Logf("缓存盘符信息: SSD=%v, 可拔插=%v", cacheSSD, cacheRemovable)

		// 验证：如果两个盘符都是SSD或都是HDD，应该优先选择固定设备
		// 验证：如果两个盘符都是固定设备或都是可拔插设备，应该优先选择SSD
		// 这些验证依赖于实际的磁盘状态，这里只做记录
	}
}

func TestAutoSetResouceDirLocal_SpaceRequirements(t *testing.T) {
	// 测试空间需求计算
	// 验证函数能够正确处理不同空间大小的盘符
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, _, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	t.Logf("空间需求测试:")
	t.Logf("  资源盘符: %s", resourceDrive)
	t.Logf("  缓存盘符: %s", cacheDrive)

	// 验证盘符不为空（说明找到了满足空间要求的盘符）
	if resourceDrive == "" {
		t.Error("应该找到满足资源文件夹空间要求的盘符")
	}
	if cacheDrive == "" {
		t.Error("应该找到满足缓存文件夹空间要求的盘符")
	}

	// 注意：具体的空间验证需要获取实际的磁盘空间信息
	// 这里只做基本的存在性验证
}

func TestGetDiskInfo_IndividualFunctions(t *testing.T) {
	// 测试 GetDiskInfo 的各个独立函数
	infoGet.SetDev(true)

	testDrives := []string{"C:", "D:", "E:"}

	for _, drive := range testDrives {
		t.Run(fmt.Sprintf("IsSSD_%s", drive), func(t *testing.T) {
			isSSD, err := infoGet.IsSSD(drive)
			if err != nil {
				t.Logf("IsSSD 检测失败（可能是非Windows系统）: %v", err)
				return
			}
			t.Logf("盘符 %s 是否为SSD: %v", drive, isSSD)
		})

		t.Run(fmt.Sprintf("IsRemovable_%s", drive), func(t *testing.T) {
			isRemovable, err := infoGet.IsRemovable(drive)
			if err != nil {
				t.Logf("IsRemovable 检测失败（可能是非Windows系统）: %v", err)
				return
			}
			t.Logf("盘符 %s 是否为可拔插设备: %v", drive, isRemovable)
		})

		t.Run(fmt.Sprintf("GetDiskInfo_%s", drive), func(t *testing.T) {
			isSSD, isRemovable, err := infoGet.GetDiskInfo(drive)
			if err != nil {
				t.Logf("GetDiskInfo 检测失败: %v", err)
				return
			}
			t.Logf("盘符 %s: SSD=%v, 可拔插=%v", drive, isSSD, isRemovable)
		})
	}
}

func TestAutoSetResouceDirLocal_DifferentGameDrives(t *testing.T) {
	// 测试不同游戏盘符下的行为
	// 这个测试验证函数能够正确处理游戏在不同盘符的情况
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, recommendChange, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	t.Logf("游戏盘符测试:")
	t.Logf("  资源盘符: %s", resourceDrive)
	t.Logf("  缓存盘符: %s", cacheDrive)
	t.Logf("  推荐更换游戏目录: %v", recommendChange)

	// 验证：如果推荐更换游戏目录，说明游戏盘符空间不足
	if recommendChange {
		t.Logf("✓ 检测到游戏盘符空间不足，建议更换")
	}

	// 验证：资源盘符和缓存盘符应该不同（如果可能的话）
	if resourceDrive != "" && cacheDrive != "" && resourceDrive == cacheDrive {
		t.Logf("注意: 资源盘符和缓存盘符相同: %s（可能是空间限制导致的）", resourceDrive)
	}
}

func TestAutoSetResouceDirLocal_ResourceCacheSeparation(t *testing.T) {
	// 测试资源文件夹和缓存文件夹是否尽可能分离到不同盘符
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, _, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	t.Logf("盘符分离测试:")
	t.Logf("  资源盘符: %s", resourceDrive)
	t.Logf("  缓存盘符: %s", cacheDrive)

	// 验证：如果可能，资源盘符和缓存盘符应该不同
	if resourceDrive != "" && cacheDrive != "" {
		if resourceDrive != cacheDrive {
			t.Logf("✓ 资源盘符和缓存盘符已分离到不同盘符（符合预期）")
		} else {
			t.Logf("注意: 资源盘符和缓存盘符相同: %s（可能是空间限制导致的）", resourceDrive)
		}
	}
}

func TestAutoSetResouceDirLocal_NonGameDrivePriority(t *testing.T) {
	// 测试优先选择非游戏盘符的逻辑
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, _, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	// 在开发模式下，游戏盘符应该是 "C:"
	expectedGameDrive := "C:"

	// 验证游戏路径可访问（可选）
	_, err2 := infoGet.GetGamePathAuto()
	if err2 != nil {
		t.Logf("无法获取游戏路径，跳过游戏盘符验证")
		return
	}
	_ = err2 // 避免未使用变量警告
	t.Logf("游戏盘符: %s", expectedGameDrive)
	t.Logf("资源盘符: %s", resourceDrive)
	t.Logf("缓存盘符: %s", cacheDrive)

	// 验证：如果可能，应该优先选择非游戏盘符
	if resourceDrive != "" && resourceDrive != expectedGameDrive {
		t.Logf("✓ 资源盘符选择了非游戏盘符（符合优先级）")
	} else if resourceDrive == expectedGameDrive {
		t.Logf("注意: 资源盘符与游戏盘符相同（可能是空间限制导致的）")
	}

	if cacheDrive != "" && cacheDrive != expectedGameDrive {
		t.Logf("✓ 缓存盘符选择了非游戏盘符（符合优先级）")
	} else if cacheDrive == expectedGameDrive {
		t.Logf("注意: 缓存盘符与游戏盘符相同（可能是空间限制导致的）")
	}
}

func TestAutoSetResouceDirLocal_OutputFormat(t *testing.T) {
	// 测试输出格式的正确性
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	resourceDrive, cacheDrive, recommendChange, err := decompression.AutoSetResouceDirLocal()

	if err != nil {
		t.Fatalf("AutoSetResouceDirLocal 执行失败: %v", err)
	}

	// 验证返回值格式
	if resourceDrive != "" {
		// 验证盘符格式：应该是 "X:" 格式
		if len(resourceDrive) < 2 || resourceDrive[1] != ':' {
			t.Errorf("资源盘符格式不正确: %s (应该是 'X:' 格式)", resourceDrive)
		}
		// 验证盘符字母是大写
		if len(resourceDrive) >= 1 && resourceDrive[0] < 'A' || resourceDrive[0] > 'Z' {
			t.Errorf("资源盘符字母不正确: %s (应该是 A-Z)", resourceDrive)
		}
	}

	if cacheDrive != "" {
		// 验证盘符格式：应该是 "X:" 格式
		if len(cacheDrive) < 2 || cacheDrive[1] != ':' {
			t.Errorf("缓存盘符格式不正确: %s (应该是 'X:' 格式)", cacheDrive)
		}
		// 验证盘符字母是大写
		if len(cacheDrive) >= 1 && (cacheDrive[0] < 'A' || cacheDrive[0] > 'Z') {
			t.Errorf("缓存盘符字母不正确: %s (应该是 A-Z)", cacheDrive)
		}
	}

	// 验证 recommendChange 是布尔值
	_ = recommendChange // 这里只是确保它是布尔类型

	t.Logf("输出格式验证通过:")
	t.Logf("  资源盘符: %s", resourceDrive)
	t.Logf("  缓存盘符: %s", cacheDrive)
	t.Logf("  推荐更换: %v", recommendChange)
}

func TestAutoSetResouceDirLocal_EdgeCases(t *testing.T) {
	// 测试边界情况
	infoGet.SetDev(true)
	infoGet.SetTestEnvType(infoGet.SimEnvHasDlc)

	// 测试1: 正常情况
	t.Run("NormalCase", func(t *testing.T) {
		resourceDrive, cacheDrive, recommendChange, err := decompression.AutoSetResouceDirLocal()
		if err != nil {
			t.Fatalf("正常情况测试失败: %v", err)
		}
		if resourceDrive == "" || cacheDrive == "" {
			t.Error("正常情况应该返回有效的盘符")
		}
		t.Logf("正常情况: 资源=%s, 缓存=%s, 推荐更换=%v", resourceDrive, cacheDrive, recommendChange)
	})

	// 测试2: 多次调用的一致性
	t.Run("Consistency", func(t *testing.T) {
		results := make([]struct {
			resource string
			cache    string
		}, 5)

		for i := 0; i < 5; i++ {
			resourceDrive, cacheDrive, _, err := decompression.AutoSetResouceDirLocal()
			if err != nil {
				t.Fatalf("第 %d 次调用失败: %v", i+1, err)
			}
			results[i] = struct {
				resource string
				cache    string
			}{
				resource: resourceDrive,
				cache:    cacheDrive,
			}
		}

		// 验证所有结果一致
		first := results[0]
		for i := 1; i < 5; i++ {
			if results[i].resource != first.resource || results[i].cache != first.cache {
				t.Errorf("第 %d 次调用结果不一致: 资源=%s vs %s, 缓存=%s vs %s",
					i+1, results[i].resource, first.resource, results[i].cache, first.cache)
			}
		}
		t.Logf("一致性测试通过: 所有5次调用结果一致")
	})
}
