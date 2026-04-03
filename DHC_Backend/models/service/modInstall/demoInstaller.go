package modinstall

import (
	"DHC_Backend/models/service/infoGet"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ==============================
// DEMO Installer（开发者调试用）
// ==============================
//
// 目标：
// 1) 在开发模式（DHC_DEV=true）下执行“实际写入文件”的 DEMO 安装流程
// 2) 通过 TaskTracker 把进度与阶段信息输出给前端
// 3) 对于当前仓库中“尚不存在/未集成”的资源，用 .txt 模拟文件落盘
//
// 安全策略：
// - 只有在开发模式下才允许写入 game 目录
// - 进一步校验 gamePath 必须位于 test/simEnv 内，避免误写到真实用户目录

// ------------------------------
// 工具函数
// ------------------------------

// readEnvBool 读取环境变量 bool。
// - value 为空：返回 defaultVal
// - value 为 "true"（忽略大小写）：返回 true
// - 其他值：返回 false
func readEnvBool(key string, defaultVal bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return defaultVal
	}
	return strings.EqualFold(v, "true")
}

// assertDevGamePathSafe 断言：当前运行环境允许写入 simEnv。
func assertDevGamePathSafe() (string, error) {
	if !infoGet.IsDevModeGet() {
		return "", fmt.Errorf("DEMO 安装仅允许在开发模式下运行：请设置 DHC_DEV=true")
	}

	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		return "", fmt.Errorf("获取游戏路径失败: %w", err)
	}

	// 双重保险：要求 gamePath 一定在 test/simEnv 下。
	// infoGet 在开发模式下会返回对应目录，但这里再校验一遍更安全。
	if !strings.Contains(filepath.ToSlash(gamePath), "test/simEnv/") {
		return "", fmt.Errorf("拒绝写入非测试 simEnv 目录：%s", gamePath)
	}
	return gamePath, nil
}

// writeDemoTxt 在 content 下写入一个 txt 模拟文件。
func writeDemoTxt(gamePath string, relUnderContent string, content string) error {
	// relUnderContent 约定：永远是 content 内的相对路径，比如：
	// "weather/DHC_demo_weather.txt"
	// "cars/DHC_demo_cars.txt"
	target := filepath.Join(gamePath, "content", filepath.FromSlash(relUnderContent))

	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}
	// 始终覆盖：DEMO 安装允许重复运行，用最新内容刷新标记即可。
	if err := os.WriteFile(target, []byte(content), 0o644); err != nil {
		return fmt.Errorf("写入模拟文件失败: %w", err)
	}
	return nil
}

// ------------------------------
// 资源校验（参考 resourceDetection.go）
// ------------------------------

// DetectDemoResourcesIntegrity 检测 DEMO 所需的资源完整性（开发模式下用 test/simEnv/resources）。
//
// 说明：
// - 仓库当前 pkgInfo.json 里只注册了 cars / tracks / shaders 等资源（dashboard 可能缺失）
// - 所以 DEMO 这里只检查这三类，避免因为 dashboard 缺失导致 complete 永远为 false
func DetectDemoResourcesIntegrity() (imported bool, complete bool, err error) {
	required := []ResourceType{Cars, Tracks, Shaders}

	anyImported := false
	allPass := true

	for _, rt := range required {
		rm, detErr := ImportResourceDetection(rt, Local)
		if detErr != nil {
			return false, false, detErr
		}

		// rm[rt] 理论上应该存在，但仍做防御性校验。
		var state ResourceState = NotImported
		if rm != nil && rm[rt] != nil {
			state = rm[rt].State
		}

		if state != NotImported {
			anyImported = true
		}
		if state != Pass {
			allPass = false
		}
	}

	return anyImported, allPass, nil
}

// RunDemoResourceVerify 是“资源包校验”执行器（供前端导入/校验进度条使用）。
// 返回 nil 表示通过；返回错误表示校验不通过。
func RunDemoResourceVerify(tracker *TaskTracker) error {
	// 资源校验阶段：逐类扫描并把结果合并。
	tracker.AddPhase("cars", "资源包校验：车辆资源", 35)
	tracker.AddPhase("tracks", "资源包校验：地图资源", 35)
	tracker.AddPhase("shaders", "资源包校验：光影资源", 20)
	tracker.AddPhase("finalize", "资源包校验：汇总判定", 10)

	// 1) cars
	tracker.StartPhase("cars")
	rmCars, err := ImportResourceDetection(Cars, Local)
	if err != nil {
		tracker.FailPhase("cars")
		return err
	}
	tracker.SetSubProgress("cars", 100)
	stateCars := NotImported
	if rmCars != nil && rmCars[Cars] != nil {
		stateCars = rmCars[Cars].State
	}
	tracker.CompletePhase("cars")

	// 2) tracks
	tracker.StartPhase("tracks")
	rmTracks, err := ImportResourceDetection(Tracks, Local)
	if err != nil {
		tracker.FailPhase("tracks")
		return err
	}
	tracker.SetSubProgress("tracks", 100)
	stateTracks := NotImported
	if rmTracks != nil && rmTracks[Tracks] != nil {
		stateTracks = rmTracks[Tracks].State
	}
	tracker.CompletePhase("tracks")

	// 3) shaders
	tracker.StartPhase("shaders")
	rmShaders, err := ImportResourceDetection(Shaders, Local)
	if err != nil {
		tracker.FailPhase("shaders")
		return err
	}
	tracker.SetSubProgress("shaders", 100)
	stateShaders := NotImported
	if rmShaders != nil && rmShaders[Shaders] != nil {
		stateShaders = rmShaders[Shaders].State
	}
	tracker.CompletePhase("shaders")

	// 4) 汇总判定
	tracker.StartPhase("finalize")
	// subprogress 用于“让前端感觉还有一步”，即使内部判断很快。
	tracker.SetSubProgress("finalize", 50)

	anyImported := (stateCars != NotImported) || (stateTracks != NotImported) || (stateShaders != NotImported)
	allPass := (stateCars == Pass) && (stateTracks == Pass) && (stateShaders == Pass)

	tracker.SetSubProgress("finalize", 100)
	if !anyImported || !allPass {
		tracker.FailPhase("finalize")
		return fmt.Errorf("资源包校验不通过：anyImported=%v allPass=%v", anyImported, allPass)
	}
	tracker.CompletePhase("finalize")
	return nil
}

// ------------------------------
// DLC 与车包检测（DEMO：硬编码模拟）
// ------------------------------

// DetectDemoDlcAndCarPack 返回 DLC 与车包是否齐全（当前先模拟）。
//
// 默认：通过
// - DHC_DEMO_DLC_PASS=false 时返回不过
// - DHC_DEMO_CARPACK_PASS=false 时返回不过
func DetectDemoDlcAndCarPack() (hasAllDLC bool) {
	dlcPass := readEnvBool("DHC_DEMO_DLC_PASS", true)
	carPackPass := readEnvBool("DHC_DEMO_CARPACK_PASS", true)
	return dlcPass && carPackPass
}

// ------------------------------
// 安装执行器（写入 .txt 模拟文件）
// ------------------------------

// RunDemoCoreInstall 完成“资源校验 + DLC/车包检测 + 基础环境写入”。
// 它会作为前端进度条里的 `core` 类别执行器。
func RunDemoCoreInstall(tracker *TaskTracker) error {
	// tracker 阶段划分（权重合计 = 100）
	// - 资源校验：车辆 10 + 地图 10 + 光影 10 + 汇总判定 5
	// - DLC/车包检测：20
	// - 基础环境写入：45
	tracker.AddPhase("resource_cars", "资源包校验：车辆资源", 10)
	tracker.AddPhase("resource_tracks", "资源包校验：地图资源", 10)
	tracker.AddPhase("resource_shaders", "资源包校验：光影资源", 10)
	tracker.AddPhase("resource_finalize", "资源包校验：汇总判定", 5)
	tracker.AddPhase("dlc_carpack_detect", "DLC 与车包检测", 20)
	tracker.AddPhase("base_env_install", "基础环境安装", 45)

	// -----------------------------
	// 1) 资源校验：cars
	// -----------------------------
	tracker.StartPhase("resource_cars")
	rmCars, err := ImportResourceDetection(Cars, Local)
	if err != nil {
		tracker.FailPhase("resource_cars")
		return err
	}
	stateCars := NotImported
	if rmCars != nil && rmCars[Cars] != nil {
		stateCars = rmCars[Cars].State
	}
	tracker.SetSubProgress("resource_cars", 100)
	tracker.CompletePhase("resource_cars")

	// -----------------------------
	// 2) 资源校验：tracks
	// -----------------------------
	tracker.StartPhase("resource_tracks")
	rmTracks, err := ImportResourceDetection(Tracks, Local)
	if err != nil {
		tracker.FailPhase("resource_tracks")
		return err
	}
	stateTracks := NotImported
	if rmTracks != nil && rmTracks[Tracks] != nil {
		stateTracks = rmTracks[Tracks].State
	}
	tracker.SetSubProgress("resource_tracks", 100)
	tracker.CompletePhase("resource_tracks")

	// -----------------------------
	// 3) 资源校验：shaders
	// -----------------------------
	tracker.StartPhase("resource_shaders")
	rmShaders, err := ImportResourceDetection(Shaders, Local)
	if err != nil {
		tracker.FailPhase("resource_shaders")
		return err
	}
	stateShaders := NotImported
	if rmShaders != nil && rmShaders[Shaders] != nil {
		stateShaders = rmShaders[Shaders].State
	}
	tracker.SetSubProgress("resource_shaders", 100)
	tracker.CompletePhase("resource_shaders")

	// -----------------------------
	// 4) 汇总判定
	// -----------------------------
	tracker.StartPhase("resource_finalize")
	anyImported := (stateCars != NotImported) || (stateTracks != NotImported) || (stateShaders != NotImported)
	allPass := (stateCars == Pass) && (stateTracks == Pass) && (stateShaders == Pass)

	tracker.SetSubProgress("resource_finalize", 60)
	tracker.SetSubProgress("resource_finalize", 100)

	if !anyImported || !allPass {
		tracker.FailPhase("resource_finalize")
		return fmt.Errorf("资源包校验不通过：imported=%v complete=%v", anyImported, allPass)
	}
	tracker.CompletePhase("resource_finalize")

	// -----------------------------
	// 5) DLC 与车包检测（DEMO：硬编码模拟）
	// -----------------------------
	tracker.StartPhase("dlc_carpack_detect")
	tracker.SetSubProgress("dlc_carpack_detect", 40)
	hasAll := DetectDemoDlcAndCarPack()
	tracker.SetSubProgress("dlc_carpack_detect", 100)

	if !hasAll {
		tracker.FailPhase("dlc_carpack_detect")
		return fmt.Errorf("DLC 与车包检测不通过")
	}
	tracker.CompletePhase("dlc_carpack_detect")

	// -----------------------------
	// 6) 基础环境写入（.txt 模拟文件）
	// -----------------------------
	tracker.StartPhase("base_env_install")
	gamePath, err := assertDevGamePathSafe()
	if err != nil {
		tracker.FailPhase("base_env_install")
		return err
	}

	steps := []struct {
		rel  string
		text string
	}{
		{rel: "DHC_demo/base_env/CSP_demo_ready.txt", text: "CSP 基础环境（DEMO）就绪。\n"},
		{rel: "DHC_demo/base_env/Extension_demo_ready.txt", text: "扩展模块（DEMO）就绪。\n"},
		{rel: "DHC_demo/base_env/Launcher_demo_ready.txt", text: "启动器/配置（DEMO）就绪。\n"},
	}

	for i := 0; i < len(steps); i++ {
		stepPct := float64(i+1) * 100 / float64(len(steps))
		// 写入前先让进度前移一点点，保证前端看到变化
		tracker.SetSubProgress("base_env_install", stepPct-1)

		if err := writeDemoTxt(gamePath, steps[i].rel, steps[i].text); err != nil {
			tracker.FailPhase("base_env_install")
			return err
		}
		tracker.SetSubProgress("base_env_install", stepPct)
	}

	tracker.CompletePhase("base_env_install")
	return nil
}

// RunDemoWeatherInstall 作为前端进度条里的 `weather` 类别执行器。
func RunDemoWeatherInstall(tracker *TaskTracker) error {
	tracker.AddPhase("install_weather", "天气系统安装", 100)
	tracker.StartPhase("install_weather")

	gamePath, err := assertDevGamePathSafe()
	if err != nil {
		tracker.FailPhase("install_weather")
		return err
	}

	steps := []string{
		"DHC_demo/weather/Sol_Core_demo.txt",
		"DHC_demo/weather/Sol_Config_demo.txt",
		"DHC_demo/weather/Pure_Base_demo.txt",
		"DHC_demo/weather/Pure_Textures_demo.txt",
	}
	for i := 0; i < len(steps); i++ {
		pct := float64(i+1) * 100 / float64(len(steps))
		if err := writeDemoTxt(gamePath, steps[i], "天气系统（DEMO）已写入模拟文件。\n"); err != nil {
			tracker.FailPhase("install_weather")
			return err
		}
		tracker.SetSubProgress("install_weather", pct)
	}

	tracker.CompletePhase("install_weather")
	return nil
}

// RunDemoMapInstall 作为前端进度条里的 `map` 类别执行器。
func RunDemoMapInstall(tracker *TaskTracker) error {
	tracker.AddPhase("install_map", "地图包安装", 100)
	tracker.StartPhase("install_map")

	gamePath, err := assertDevGamePathSafe()
	if err != nil {
		tracker.FailPhase("install_map")
		return err
	}

	steps := []string{
		"DHC_demo/map/SRP_Main_demo.txt",
		"DHC_demo/map/SRP_Extras_demo.txt",
		"DHC_demo/map/PA_Objects_demo.txt",
		"DHC_demo/map/PA_Shibaura_demo.txt",
	}
	for i := 0; i < len(steps); i++ {
		pct := float64(i+1) * 100 / float64(len(steps))
		if err := writeDemoTxt(gamePath, steps[i], "地图包（DEMO）已写入模拟文件。\n"); err != nil {
			tracker.FailPhase("install_map")
			return err
		}
		tracker.SetSubProgress("install_map", pct)
	}

	tracker.CompletePhase("install_map")
	return nil
}

// RunDemoCarsInstall 作为前端进度条里的 `cars` 类别执行器。
func RunDemoCarsInstall(tracker *TaskTracker) error {
	tracker.AddPhase("install_cars", "车辆包安装", 100)
	tracker.StartPhase("install_cars")

	gamePath, err := assertDevGamePathSafe()
	if err != nil {
		tracker.FailPhase("install_cars")
		return err
	}

	steps := []string{
		"DHC_demo/cars/JDM_Shard1_demo.txt",
		"DHC_demo/cars/JDM_Shard2_demo.txt",
		"DHC_demo/cars/JDM_Shard3_demo.txt",
	}
	for i := 0; i < len(steps); i++ {
		pct := float64(i+1) * 100 / float64(len(steps))
		if err := writeDemoTxt(gamePath, steps[i], "车辆包（DEMO）已写入模拟文件。\n"); err != nil {
			tracker.FailPhase("install_cars")
			return err
		}
		tracker.SetSubProgress("install_cars", pct)
	}

	tracker.CompletePhase("install_cars")
	return nil
}

// ------------------------------
// 内部：带 tracker 的检测封装
// ------------------------------

func runDetectDemoResourcesIntegrityWithTracker(tracker *TaskTracker) (imported bool, complete bool, err error) {
	// 这里不新增额外 phase，只是让当前 phase 内的子进度有变化。
	// cars/tracks/shaders 依次检测，按 0/30/60/100 推进。
	tracker.SetSubProgress("resource_verify", 10)

	required := []ResourceType{Cars, Tracks, Shaders}
	anyImported := false
	allPass := true

	for i, rt := range required {
		rm, detErr := ImportResourceDetection(rt, Local)
		if detErr != nil {
			return false, false, detErr
		}

		state := NotImported
		if rm != nil && rm[rt] != nil {
			state = rm[rt].State
		}

		if state != NotImported {
			anyImported = true
		}
		if state != Pass {
			allPass = false
		}

		// 进度按检测轮次推进
		// i=0 => 40；i=1 => 70；i=2 => 100
		sub := float64(i+1) * 30
		tracker.SetSubProgress("resource_verify", 40+sub-30)
	}

	tracker.SetSubProgress("resource_verify", 100)
	return anyImported, allPass, nil
}

func runDetectDemoDlcCarPackWithTracker(tracker *TaskTracker) (hasAll bool) {
	// 这里模拟两步检测，让子进度可见。
	tracker.SetSubProgress("dlc_carpack_detect", 30)
	dlcPass := readEnvBool("DHC_DEMO_DLC_PASS", true)
	tracker.SetSubProgress("dlc_carpack_detect", 60)
	carPackPass := readEnvBool("DHC_DEMO_CARPACK_PASS", true)
	tracker.SetSubProgress("dlc_carpack_detect", 100)

	return dlcPass && carPackPass
}

