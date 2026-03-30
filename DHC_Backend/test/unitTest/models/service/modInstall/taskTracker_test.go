package modinstall

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"fmt"
	"testing"
)

// TestTaskTrackerSubProgressMapping 验证"子进度区间映射"核心计算逻辑。
//
// 场景：模拟 CM 安装的三个阶段（下载25%、解压50%、移动25%），
// 每一步都验证子进度到总进度的换算是否正确。
//
// 换算公式：
//
//	总进度 = 已完成阶段权重之和 + 当前阶段权重 × (子进度 / 100)
func TestTaskTrackerSubProgressMapping(t *testing.T) {
	// lastSnapshot 用来捕获最近一次回调传出的快照
	var lastSnapshot modinstall.ProgressSnapshot

	tracker := modinstall.NewTaskTracker(func(s modinstall.ProgressSnapshot) {
		lastSnapshot = s
		// 把每次进度变化打印出来，方便肉眼确认
		fmt.Printf("  [回调] 总进度=%.1f%% | 阶段=%s | 子进度=%.0f%% | 状态=%s\n",
			s.TotalProgress, s.PhaseName, s.SubProgress, s.PhaseStatus)
	})

	// ── 注册三个阶段（权重之和 = 100） ──
	tracker.AddPhase("download", "下载CM安装包", 25) // 占 0% ~ 25%
	tracker.AddPhase("extract", "解压CM文件", 50)    // 占 25% ~ 75%
	tracker.AddPhase("move", "移动到桌面", 25)       // 占 75% ~ 100%

	// ── 阶段 1: 下载 ──
	fmt.Println("=== 阶段1: 下载（权重25%） ===")

	tracker.StartPhase("download")
	assertProgress(t, "下载开始", lastSnapshot.TotalProgress, 0)

	// 下载 50% → 总进度应为 25 × 0.5 = 12.5%
	tracker.SetSubProgress("download", 50)
	assertProgress(t, "下载50%", lastSnapshot.TotalProgress, 12.5)

	// 下载 100% (CompletePhase) → 总进度应为 25%
	tracker.CompletePhase("download")
	assertProgress(t, "下载完成", lastSnapshot.TotalProgress, 25)

	// ── 阶段 2: 解压 ──
	fmt.Println("=== 阶段2: 解压（权重50%） ===")

	tracker.StartPhase("extract")
	assertProgress(t, "解压开始", lastSnapshot.TotalProgress, 25)

	// 解压 60% → 总进度应为 25 + 50 × 0.6 = 55%
	tracker.SetSubProgress("extract", 60)
	assertProgress(t, "解压60%", lastSnapshot.TotalProgress, 55)

	tracker.CompletePhase("extract")
	assertProgress(t, "解压完成", lastSnapshot.TotalProgress, 75)

	// ── 阶段 3: 移动 ──
	fmt.Println("=== 阶段3: 移动（权重25%） ===")

	tracker.StartPhase("move")
	assertProgress(t, "移动开始", lastSnapshot.TotalProgress, 75)

	tracker.CompletePhase("move")
	assertProgress(t, "移动完成", lastSnapshot.TotalProgress, 100)

	// ── 快照字段验证 ──
	fmt.Println("=== 快照字段验证 ===")

	snapshot := tracker.GetSnapshot()
	if snapshot.PhaseStatus != "completed" {
		t.Fatalf("期望最终状态 completed，实际 %s", snapshot.PhaseStatus)
	}
	fmt.Printf("  最终快照: TotalProgress=%.0f%% PhaseStatus=%s\n",
		snapshot.TotalProgress, snapshot.PhaseStatus)
}

// TestTaskTrackerFailPhase 验证阶段失败时，总进度停在当前值不再前进。
func TestTaskTrackerFailPhase(t *testing.T) {
	var lastSnapshot modinstall.ProgressSnapshot

	tracker := modinstall.NewTaskTracker(func(s modinstall.ProgressSnapshot) {
		lastSnapshot = s
	})

	tracker.AddPhase("download", "下载", 50)
	tracker.AddPhase("extract", "解压", 50)

	// 下载到一半失败
	tracker.StartPhase("download")
	tracker.SetSubProgress("download", 60)
	assertProgress(t, "下载60%", lastSnapshot.TotalProgress, 30) // 50 × 0.6 = 30

	tracker.FailPhase("download")
	// 失败后总进度应该停在 30（active 变成 failed，不再贡献新权重）
	assertProgress(t, "下载失败", lastSnapshot.TotalProgress, 30)

	if lastSnapshot.PhaseStatus != "failed" {
		t.Fatalf("期望状态 failed，实际 %s", lastSnapshot.PhaseStatus)
	}

	fmt.Printf("  失败场景验证通过: TotalProgress=%.0f%% PhaseStatus=%s\n",
		lastSnapshot.TotalProgress, lastSnapshot.PhaseStatus)
}

// TestTaskTrackerNilOnChange 验证 onChange 传 nil 时不会 panic。
func TestTaskTrackerNilOnChange(t *testing.T) {
	tracker := modinstall.NewTaskTracker(nil)

	tracker.AddPhase("step1", "步骤1", 100)
	tracker.StartPhase("step1")
	tracker.SetSubProgress("step1", 50)
	tracker.CompletePhase("step1")

	snapshot := tracker.GetSnapshot()
	assertProgress(t, "nil回调+完成", snapshot.TotalProgress, 100)

	fmt.Println("  nil 回调测试通过（无 panic）")
}

// ── 测试辅助函数 ──

// assertProgress 检查实际进度是否等于期望值（允许 0.01 浮点误差）。
func assertProgress(t *testing.T, label string, actual float64, expected float64) {
	t.Helper()
	diff := actual - expected
	if diff < 0 {
		diff = -diff
	}
	if diff > 0.01 {
		t.Fatalf("[%s] 期望总进度 %.2f%%，实际 %.2f%%", label, expected, actual)
	}
}
