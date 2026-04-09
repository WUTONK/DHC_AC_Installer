package handler

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"DHC_Backend/models/service/servicelog"
	"time"
)

// ── 通用执行桥接 ──

// runInstallExecutor 是安装任务的通用执行框架（在后台 goroutine 中运行）。
//
// 它把"handler 的任务注册表"和"执行器的 TaskTracker"桥接起来：
//  1. 创建 TaskTracker，回调里把进度写入任务注册表
//  2. 调用 executorFn 执行具体安装流程
//  3. 根据返回值标记任务最终状态（completed / failed）
//
// handler 不关心执行器内部做了什么（是 demo 模拟还是真实下载），
// 执行器也不知道进度数据最终去了哪里（注册表、日志、前端）。
//
// 未来扩展 shader / map / carPack 时，只需要：
//
//	go runInstallExecutor(installID, "shader", modinstall.RunShaderInstall)
func runInstallExecutor(
	installID string,
	categoryID string,
	executorFn func(*modinstall.TaskTracker) error,
	finalizeTask bool,
) error {
	// 创建 tracker：每次进度变化时，通过回调更新任务注册表。
	// 前端轮询时会读取注册表，于是就能看到实时进度。
	tracker := modinstall.NewTaskTracker(func(snapshot modinstall.ProgressSnapshot) {
		var pace *demoPaceState
		var global float64

		installTasksMu.Lock()
		task, ok := installTasks[installID]
		if !ok {
			installTasksMu.Unlock()
			return
		}

		task.Status = installStatusInstalling

		cp := task.Categories[categoryID]
		if cp == nil {
			installTasksMu.Unlock()
			return
		}
		cp.Progress = snapshot.TotalProgress
		cp.CurrentItem = snapshot.PhaseName
		cp.SubProgress = snapshot.SubProgress
		if snapshot.PhaseStatus == "active" {
			cp.Status = "active"
		} else if snapshot.PhaseStatus == "failed" {
			cp.Status = "failed"
		}

		pace = task.demoPace
		global = calcTotalProgressFromTask(task)
		installTasksMu.Unlock()

		// 在锁外休眠，避免阻塞其他 goroutine 轮询进度。
		if pace != nil {
			pace.sleepUntilGlobalPercent(global)
		}
	})

	servicelog.Infof("[install] executor start installId=%s category=%s finalizeTask=%v", installID, categoryID, finalizeTask)

	// 调用执行器：具体安装逻辑全在这里面
	err := executorFn(tracker)
	if err != nil {
		servicelog.Errorf("[install] executor failed installId=%s category=%s: %v", installID, categoryID, err)
	} else {
		servicelog.Infof("[install] executor ok installId=%s category=%s finalizeTask=%v", installID, categoryID, finalizeTask)
	}

	// 根据执行结果标记类别状态。
	// finalizeTask=true：同时写入任务 EndTime，并把全局状态收敛到 completed/failed。
	installTasksMu.Lock()
	task, ok := installTasks[installID]
	if ok {
		if cp := task.Categories[categoryID]; cp != nil {
			if err != nil {
				cp.Status = "failed"
			} else {
				cp.Status = "completed"
				cp.Progress = 100
			}
		}

		if finalizeTask {
			now := time.Now().Unix()
			task.EndTime = &now
			if err != nil {
				task.Status = installStatusFailed
				task.Error = err.Error()
			} else {
				task.Status = installStatusCompleted
			}
		} else if err != nil {
			task.Status = installStatusFailed
			task.Error = err.Error()
		}
	}
	installTasksMu.Unlock()

	return err
}

// finalizeInstallTask 用于 demo-install-v1 的分段执行收尾。
// 它会写入 EndTime，并把全局状态收敛到 completed/failed。
func finalizeInstallTask(installID string, err error) {
	installTasksMu.Lock()
	defer installTasksMu.Unlock()

	task, ok := installTasks[installID]
	if !ok {
		return
	}

	now := time.Now().Unix()
	task.EndTime = &now
	if err != nil {
		task.Status = installStatusFailed
		task.Error = err.Error()
		servicelog.Errorf("[install] finalize early installId=%s status=failed err=%v", installID, err)
	} else {
		task.Status = installStatusCompleted
	}
}
