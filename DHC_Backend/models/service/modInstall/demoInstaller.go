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
	target := filepath.Join(gamePath, "content", filepath.FromSlash(relUnderContent))

	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}
	if err := os.WriteFile(target, []byte(content), 0o644); err != nil {
		return fmt.Errorf("写入模拟文件失败: %w", err)
	}
	return nil
}

// writeDemoTxtAtRoot 在游戏根目录下写入一个 txt 模拟文件（用于 extension/ 等不在 content/ 下的路径）。
func writeDemoTxtAtRoot(gamePath string, relPath string, content string) error {
	target := filepath.Join(gamePath, filepath.FromSlash(relPath))

	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}
	if err := os.WriteFile(target, []byte(content), 0o644); err != nil {
		return fmt.Errorf("写入模拟文件失败: %w", err)
	}
	return nil
}

// ------------------------------
// 资源校验（参考 resourceDetection.go）
// ------------------------------

// DetectDemoResourcesIntegrity 检测 DEMO 所需的资源完整性（开发模式下用 test/simEnv/resources/testPkg）。
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
	// 6) 基础环境写入（.txt 模拟文件 → 真实 AC 目录）
	// -----------------------------
	tracker.StartPhase("base_env_install")
	gamePath, err := assertDevGamePathSafe()
	if err != nil {
		tracker.FailPhase("base_env_install")
		return err
	}

	type cspFile struct {
		rel    string
		text   string
		isRoot bool // true = 写到 gamePath 下；false = 写到 gamePath/content 下
	}
	cspFiles := []cspFile{
		{rel: "texture/csp/csp_demo_ready.txt", text: "CSP 基础环境纹理配置（DEMO）就绪。\n"},
		{rel: "extension/csp/csp_extension_demo.txt", text: "CSP 扩展模块（DEMO）就绪。\n", isRoot: true},
		{rel: "cfg/csp_launcher_config_demo.txt", text: "CSP 启动器配置（DEMO）就绪。\n", isRoot: true},
	}

	for i, f := range cspFiles {
		stepPct := float64(i+1) * 100 / float64(len(cspFiles))
		tracker.SetSubProgress("base_env_install", stepPct-1)

		if f.isRoot {
			if err := writeDemoTxtAtRoot(gamePath, f.rel, f.text); err != nil {
				tracker.FailPhase("base_env_install")
				return err
			}
		} else {
			if err := writeDemoTxt(gamePath, f.rel, f.text); err != nil {
				tracker.FailPhase("base_env_install")
				return err
			}
		}
		tracker.SetSubProgress("base_env_install", stepPct)
	}

	tracker.CompletePhase("base_env_install")
	return nil
}

// RunDemoWeatherInstall 作为前端进度条里的 `weather` 类别执行器。
// 阶段划分：Sol Core → Sol Config → Pure Base → Pure Textures
func RunDemoWeatherInstall(tracker *TaskTracker) error {
	gamePath, err := assertDevGamePathSafe()
	if err != nil {
		return err
	}

	type weatherStep struct {
		phaseID   string
		phaseName string
		weight    float64
		files     []struct {
			rel  string
			text string
		}
	}

	steps := []weatherStep{
		{
			phaseID: "sol_core", phaseName: "安装 Sol 2.2.9 Core", weight: 30,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "weather/sol_demo/sol_core.txt", text: "Sol 2.2.9 Core 天气引擎（DEMO）就绪。\n"},
				{rel: "weather/sol_demo/sol_pp_filter.txt", text: "Sol PP Filter 后处理配置（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "sol_config", phaseName: "安装 Sol Config", weight: 15,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "weather/sol_demo/sol_config.txt", text: "Sol Weather Config 天气预设（DEMO）就绪。\n"},
				{rel: "weather/sol_demo/sol_weather_plan.txt", text: "Sol 天气方案数据（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "pure_base", phaseName: "安装 Pure 0.238 Base", weight: 30,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "texture/pure_demo/pure_base.txt", text: "Pure 0.238 Base 光影后处理基础（DEMO）就绪。\n"},
				{rel: "texture/pure_demo/pure_config.txt", text: "Pure Config 光影配置（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "pure_textures", phaseName: "安装 Pure Textures HighRes", weight: 25,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "texture/pure_demo/pure_textures_sky.txt", text: "Pure 高清天空纹理（DEMO）就绪。\n"},
				{rel: "texture/pure_demo/pure_textures_clouds.txt", text: "Pure 高清云层纹理（DEMO）就绪。\n"},
				{rel: "texture/pure_demo/pure_textures_rain.txt", text: "Pure 雨天特效纹理（DEMO）就绪。\n"},
			},
		},
	}

	for _, s := range steps {
		tracker.AddPhase(s.phaseID, s.phaseName, s.weight)
	}

	for _, s := range steps {
		tracker.StartPhase(s.phaseID)
		for i, f := range s.files {
			pct := float64(i+1) * 100 / float64(len(s.files))
			if err := writeDemoTxt(gamePath, f.rel, f.text); err != nil {
				tracker.FailPhase(s.phaseID)
				return err
			}
			tracker.SetSubProgress(s.phaseID, pct)
		}
		tracker.CompletePhase(s.phaseID)
	}

	return nil
}

// RunDemoMapInstall 作为前端进度条里的 `map` 类别执行器。
// 阶段划分：SRP 主赛道 → SRP 附加内容 → PA 辰巳 → PA 芝浦
func RunDemoMapInstall(tracker *TaskTracker) error {
	gamePath, err := assertDevGamePathSafe()
	if err != nil {
		return err
	}

	type mapStep struct {
		phaseID   string
		phaseName string
		weight    float64
		files     []struct {
			rel  string
			text string
		}
	}

	steps := []mapStep{
		{
			phaseID: "srp_main", phaseName: "安装 SRP Main Track", weight: 40,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "tracks/shuto_revival_project_beta/srp_main_layout.txt", text: "SRP 首都高主赛道布局数据（DEMO）就绪。\n"},
				{rel: "tracks/shuto_revival_project_beta/srp_main_surfaces.txt", text: "SRP 主赛道路面材质（DEMO）就绪。\n"},
				{rel: "tracks/shuto_revival_project_beta/srp_main_objects.txt", text: "SRP 主赛道场景物件（DEMO）就绪。\n"},
				{rel: "tracks/shuto_revival_project_beta/ai/srp_main_ai.txt", text: "SRP 主赛道 AI 路线（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "srp_extras", phaseName: "安装 SRP Extras", weight: 20,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "tracks/shuto_revival_project_beta/srp_extras_signs.txt", text: "SRP 额外路标与指示牌（DEMO）就绪。\n"},
				{rel: "tracks/shuto_revival_project_beta/srp_extras_lighting.txt", text: "SRP 额外夜间灯光（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "pa_tatsumi", phaseName: "安装辰巳 PA 场景", weight: 20,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "tracks/shuto_revival_project_beta/tatsumi_pa/tatsumi_pa_objects.txt", text: "辰巳 PA 停车场景物件（DEMO）就绪。\n"},
				{rel: "tracks/shuto_revival_project_beta/tatsumi_pa/tatsumi_pa_textures.txt", text: "辰巳 PA 纹理贴图（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "pa_shibaura", phaseName: "安装芝浦 PA 场景", weight: 20,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "tracks/shuto_revival_project_beta/shibaura_pa/shibaura_pa_objects.txt", text: "芝浦 PA 停车场景物件（DEMO）就绪。\n"},
				{rel: "tracks/shuto_revival_project_beta/shibaura_pa/shibaura_pa_textures.txt", text: "芝浦 PA 纹理贴图（DEMO）就绪。\n"},
			},
		},
	}

	for _, s := range steps {
		tracker.AddPhase(s.phaseID, s.phaseName, s.weight)
	}

	for _, s := range steps {
		tracker.StartPhase(s.phaseID)
		for i, f := range s.files {
			pct := float64(i+1) * 100 / float64(len(s.files))
			if err := writeDemoTxt(gamePath, f.rel, f.text); err != nil {
				tracker.FailPhase(s.phaseID)
				return err
			}
			tracker.SetSubProgress(s.phaseID, pct)
		}
		tracker.CompletePhase(s.phaseID)
	}

	return nil
}

// RunDemoCarsInstall 作为前端进度条里的 `cars` 类别执行器。
// 阶段划分：按每辆车独立阶段，每辆车写入模型+皮肤+数据三个文件
func RunDemoCarsInstall(tracker *TaskTracker) error {
	gamePath, err := assertDevGamePathSafe()
	if err != nil {
		return err
	}

	type carStep struct {
		phaseID   string
		phaseName string
		weight    float64
		files     []struct {
			rel  string
			text string
		}
	}

	steps := []carStep{
		{
			phaseID: "car_r34", phaseName: "安装 Nissan Skyline R34", weight: 20,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "cars/dhc_nissan_r34/dhc_r34_model.txt", text: "Nissan Skyline R34 车辆模型（DEMO）就绪。\n"},
				{rel: "cars/dhc_nissan_r34/skins/default/dhc_r34_skin.txt", text: "R34 默认涂装（DEMO）就绪。\n"},
				{rel: "cars/dhc_nissan_r34/data/dhc_r34_data.txt", text: "R34 物理数据与调校（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "car_supra", phaseName: "安装 Toyota Supra MK4", weight: 20,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "cars/dhc_toyota_supra_mk4/dhc_supra_model.txt", text: "Toyota Supra MK4 车辆模型（DEMO）就绪。\n"},
				{rel: "cars/dhc_toyota_supra_mk4/skins/default/dhc_supra_skin.txt", text: "Supra MK4 默认涂装（DEMO）就绪。\n"},
				{rel: "cars/dhc_toyota_supra_mk4/data/dhc_supra_data.txt", text: "Supra MK4 物理数据与调校（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "car_rx7", phaseName: "安装 Mazda RX-7 FD3S", weight: 20,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "cars/dhc_mazda_rx7_fd3s/dhc_rx7_model.txt", text: "Mazda RX-7 FD3S 车辆模型（DEMO）就绪。\n"},
				{rel: "cars/dhc_mazda_rx7_fd3s/skins/default/dhc_rx7_skin.txt", text: "RX-7 FD3S 默认涂装（DEMO）就绪。\n"},
				{rel: "cars/dhc_mazda_rx7_fd3s/data/dhc_rx7_data.txt", text: "RX-7 FD3S 物理数据与调校（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "car_nsx", phaseName: "安装 Honda NSX-R", weight: 20,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "cars/dhc_honda_nsx_r/dhc_nsx_model.txt", text: "Honda NSX-R 车辆模型（DEMO）就绪。\n"},
				{rel: "cars/dhc_honda_nsx_r/skins/default/dhc_nsx_skin.txt", text: "NSX-R 默认涂装（DEMO）就绪。\n"},
				{rel: "cars/dhc_honda_nsx_r/data/dhc_nsx_data.txt", text: "NSX-R 物理数据与调校（DEMO）就绪。\n"},
			},
		},
		{
			phaseID: "car_evo9", phaseName: "安装 Mitsubishi Lancer Evo 9", weight: 20,
			files: []struct {
				rel  string
				text string
			}{
				{rel: "cars/dhc_mitsubishi_evo9/dhc_evo9_model.txt", text: "Mitsubishi Lancer Evo 9 车辆模型（DEMO）就绪。\n"},
				{rel: "cars/dhc_mitsubishi_evo9/skins/default/dhc_evo9_skin.txt", text: "Evo 9 默认涂装（DEMO）就绪。\n"},
				{rel: "cars/dhc_mitsubishi_evo9/data/dhc_evo9_data.txt", text: "Evo 9 物理数据与调校（DEMO）就绪。\n"},
			},
		},
	}

	for _, s := range steps {
		tracker.AddPhase(s.phaseID, s.phaseName, s.weight)
	}

	for _, s := range steps {
		tracker.StartPhase(s.phaseID)
		for i, f := range s.files {
			pct := float64(i+1) * 100 / float64(len(s.files))
			if err := writeDemoTxt(gamePath, f.rel, f.text); err != nil {
				tracker.FailPhase(s.phaseID)
				return err
			}
			tracker.SetSubProgress(s.phaseID, pct)
		}
		tracker.CompletePhase(s.phaseID)
	}

	return nil
}

// ------------------------------
// 实验环境收尾（测试 / git 还原）
// ------------------------------

// SimEnvDevInstallCleanup 在实验安装流程结束后调用：清空后端中间目录，并将 simEnv 下游戏目录恢复为 envBackup 基线。
// 默认无论安装成功与否都应执行（例如在 handler 里 defer），除非显式跳过回收。
//
// 参数 skipRecycle：
//   - true：跳过全部回收，保留 resources/cache、importResourceCache 与 acRoot 写入内容（调试用）。
//
// 环境变量 DHC_SIMENV_SKIP_INSTALL_CLEANUP=true 时与 skipRecycle=true 等效，便于不改调用代码保留现场。
//
// 非开发模式（DHC_DEV≠true）下为安全起见整函数为空操作（返回 nil）。
//
// TODO：真实模组 / 生产场景下，在安装成功后按次删除 resources/cache 中对应解压目录（见 decompression），
// 以及可配置临时盘；本函数仅覆盖当前测试与 simEnv 需求，保持简单。
func SimEnvDevInstallCleanup(skipRecycle bool) error {
	if skipRecycle || readEnvBool("DHC_SIMENV_SKIP_INSTALL_CLEANUP", false) {
		return nil
	}
	if !infoGet.IsDevModeGet() {
		return nil
	}
	if err := ClearBackendModInstallIntermediateDirs(); err != nil {
		return err
	}
	return ResetSimEnvModDirectoriesForDevCleanup()
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
