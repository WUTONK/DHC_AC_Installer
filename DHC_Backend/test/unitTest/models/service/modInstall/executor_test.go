package modinstall

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"fmt"
	"testing"
)

// TestRunDemoCMInstall 验证 Demo 执行器能跑完全部阶段并达到 100% 进度。
//
// 这个测试确保执行器独立于 handler 也能正常工作：
// - 阶段注册正确（download → extract → move）
// - 进度推进到 100%
// - 最终状态是 completed
// - 返回 nil error
func TestRunDemoCMInstall(t *testing.T) {
	var lastSnapshot modinstall.ProgressSnapshot
	callCount := 0

	tracker := modinstall.NewTaskTracker(func(s modinstall.ProgressSnapshot) {
		lastSnapshot = s
		callCount++
	})

	err := modinstall.RunDemoCMInstall(tracker)

	if err != nil {
		t.Fatalf("RunDemoCMInstall 返回错误: %v", err)
	}

	if lastSnapshot.TotalProgress < 99.99 {
		t.Fatalf("期望总进度 100%%，实际 %.2f%%", lastSnapshot.TotalProgress)
	}

	if lastSnapshot.PhaseStatus != "completed" {
		t.Fatalf("期望最终状态 completed，实际 %s", lastSnapshot.PhaseStatus)
	}

	if callCount == 0 {
		t.Fatal("进度回调从未被触发")
	}

	fmt.Printf("  Demo 执行器测试通过: TotalProgress=%.0f%% PhaseStatus=%s callCount=%d\n",
		lastSnapshot.TotalProgress, lastSnapshot.PhaseStatus, callCount)
}

// TestDemoCMInstallProgressMonotonicity 验证 Demo 执行器的进度是单调递增的。
// 确保进度不会倒退（这会让前端进度条"跳回去"，体验很差）。
func TestDemoCMInstallProgressMonotonicity(t *testing.T) {
	var prevProgress float64

	tracker := modinstall.NewTaskTracker(func(s modinstall.ProgressSnapshot) {
		if s.TotalProgress < prevProgress {
			t.Fatalf("进度倒退: %.2f%% → %.2f%%", prevProgress, s.TotalProgress)
		}
		prevProgress = s.TotalProgress
	})

	err := modinstall.RunDemoCMInstall(tracker)
	if err != nil {
		t.Fatalf("RunDemoCMInstall 返回错误: %v", err)
	}

	fmt.Printf("  单调递增验证通过: 最终进度=%.0f%%\n", prevProgress)
}
