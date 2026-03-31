package modinstall

import "time"

// ============================================================================
// 安装执行器（Install Executor）
//
// 这一层负责"具体安装流程的编排"，例如 CM 安装分几个阶段、每个阶段做什么。
// 执行器通过 TaskTracker 报告进度，但不关心进度数据最终去了哪里（注册表、日志、前端）。
//
// ── 统一签名 ──
//
//   func XxxExecutor(tracker *TaskTracker) error
//
// 所有执行器都遵循这个签名：接收 tracker，返回 error。
// handler 层通过 runInstallExecutor 统一调用，不需要了解内部细节。
//
// ── 扩展方式 ──
//
// 未来新增 shader / map / carPack 安装，只需在这里加一个函数：
//
//   func RunShaderInstall(tracker *TaskTracker) error { ... }
//   func RunMapInstall(tracker *TaskTracker) error { ... }
//
// 然后在 handler 的 createInstallation 里多加一个 category 和对应的
// runInstallExecutor 调用即可。
// ============================================================================

// RunDemoCMInstall 是演示/测试版 CM 安装执行器。
// 使用 TaskTracker 管理进度，用 time.Sleep 模拟耗时操作。
// 阶段设计和真实版完全一致（download → extract → move），方便对照。
//
// 适用场景：开发调试、前端联调、集成测试（不需要网络）。
func RunDemoCMInstall(tracker *TaskTracker) error {
	tracker.AddPhase("download", "下载CM安装包", 25)
	tracker.AddPhase("extract", "解压CM文件", 50)
	tracker.AddPhase("move", "移动到桌面", 25)

	// 模拟下载阶段：子进度 0→20→40→60→80→100，总进度 0→5→10→15→20→25
	tracker.StartPhase("download")
	for i := 1; i <= 5; i++ {
		time.Sleep(200 * time.Millisecond)
		tracker.SetSubProgress("download", float64(i)*20)
	}
	tracker.CompletePhase("download")

	// 模拟解压阶段：子进度 0→20→40→60→80→100，总进度 25→35→45→55→65→75
	tracker.StartPhase("extract")
	for i := 1; i <= 5; i++ {
		time.Sleep(300 * time.Millisecond)
		tracker.SetSubProgress("extract", float64(i)*20)
	}
	tracker.CompletePhase("extract")

	// 模拟移动阶段：一步到位，总进度 75→100
	tracker.StartPhase("move")
	time.Sleep(300 * time.Millisecond)
	tracker.CompletePhase("move")

	return nil
}

// RunRealCMInstall 是生产版 CM 安装执行器。
// 内部调用 InstallCmWithTracker 执行真实的下载、解压、移动操作。
// 需要网络连接（下载 CM 安装包），适用于生产环境。
func RunRealCMInstall(tracker *TaskTracker) error {
	_, err := InstallCmWithTracker(tracker)
	return err
}

// 最小模组集安装 DEMO
// v0.1 安装一个车包，一个地图，一组光影配置（包含三层文件），全部使用 zip，使用缺省的解压暂存目录
// v0.2 使用真实模组文件，使用用户指定的解压暂存目录
// v0.3 进行文件完整性校验
