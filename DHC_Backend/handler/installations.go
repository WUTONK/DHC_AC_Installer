package handler

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type installStatus string

const (
	installStatusPreparing installStatus = "preparing"
	installStatusInstalling installStatus = "installing"
	installStatusCompleted  installStatus = "completed"
	installStatusFailed     installStatus = "failed"
)

type categoryProgress struct {
	CategoryID     string  `json:"categoryId"`
	CategoryName   string  `json:"categoryName"`
	Status         string  `json:"status"`
	Progress       float64 `json:"progress"`
	CurrentItem    string  `json:"currentItem,omitempty"`
	TotalItems     int     `json:"totalItems,omitempty"`
	CompletedItems int     `json:"completedItems,omitempty"`
}

type installTask struct {
	ID         string
	VersionID  string
	Status     installStatus
	StartTime  int64
	EndTime    *int64
	Error      string
	Categories map[string]*categoryProgress
}

var (
	// installTasks 是最小实现里的“任务注册表”。
	// Key 是 installId，Value 是任务当前快照（状态、分类进度、错误等）。
	// 这里先用内存 map，后续可以替换为持久化存储（文件/DB）。
	installTasksMu sync.RWMutex
	installTasks   = map[string]*installTask{}
)

// registerInstallationRoutes 注册本次最小可用版本的两个核心接口：
// 1) 创建任务（返回 installId）
// 2) 按 installId 查询进度（支持按 category 过滤）
func registerInstallationRoutes(g gin.IRouter) {
	g.POST("/api/installations", createInstallation)
	g.GET("/api/installations/:installId/progress", getInstallationProgress)
}

// createInstallation 负责接收前端“开始安装”请求：
// - 校验请求参数
// - 生成 installId
// - 初始化任务状态并放入注册表
// - 异步执行安装流程（HTTP 立即返回，不阻塞）
func createInstallation(c *gin.Context) {
	var req struct {
		VersionID string `json:"versionId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	installID := fmt.Sprintf("install_%d", time.Now().UnixNano())
	now := time.Now().Unix()
	task := &installTask{
		ID:        installID,
		VersionID: req.VersionID,
		Status:    installStatusPreparing,
		StartTime: now,
		Categories: map[string]*categoryProgress{
			"cm": {
				CategoryID:   "cm",
				CategoryName: "Content Manager",
				Status:       "waiting",
				Progress:     0,
				TotalItems:   3,
			},
		},
	}

	// 先写入任务注册表，确保前端拿到 installId 后马上轮询不会 404。
	// 这里用写锁保护 map，避免并发写造成数据竞争。
	installTasksMu.Lock()
	installTasks[installID] = task
	installTasksMu.Unlock()

	// 异步启动安装流程，让创建接口快速返回。
	// 真实项目中这里会接入实际 CM 安装逻辑，而非模拟步骤。
	go runSimulatedCMInstall(installID)

	c.JSON(http.StatusOK, gin.H{
		"id":        installID,
		"versionId": req.VersionID,
		"status":    task.Status,
		"startTime": task.StartTime,
	})
}

// getInstallationProgress 返回 installId 对应任务的进度快照。
// category 规则：
// - all：返回全部类别
// - cm/core/...：只返回指定类别
func getInstallationProgress(c *gin.Context) {
	// 读取路径参数和可选过滤条件。
	installID := c.Param("installId")
	category := c.DefaultQuery("category", "all")

	// 读操作使用读锁，允许多个并发查询同时进行。
	installTasksMu.RLock()
	task, exists := installTasks[installID]
	if !exists {
		installTasksMu.RUnlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "install task not found"})
		return
	}

	// 组装类别列表：
	// - all 返回任务下全部 category
	// - 指定 category 只返回一项（不存在则返回空数组）
	categories := make([]categoryProgress, 0)
	if category == "all" {
		for _, cp := range task.Categories {
			categories = append(categories, *cp)
		}
	} else if cp, ok := task.Categories[category]; ok {
		categories = append(categories, *cp)
	}

	// 基于当前类别进度计算总进度（最小版本按平均值）。
	totalProgress := calcTotalProgress(categories)
	resp := gin.H{
		"installId":     task.ID,
		"status":        task.Status,
		"totalProgress": totalProgress,
		"categories":    categories,
		"startTime":     task.StartTime,
		"endTime":       task.EndTime,
		"error":         nilIfEmpty(task.Error),
	}
	installTasksMu.RUnlock()

	c.JSON(http.StatusOK, resp)
}

// runSimulatedCMInstall 是演示用的“后台安装任务”。
// 它会分阶段更新 cm 进度，模拟真实下载/解压/安装过程。
func runSimulatedCMInstall(installID string) {
	steps := []struct {
		progress float64
		item     string
		done     int
	}{
		{15, "下载 CM 安装包", 0},
		{55, "解压 CM 文件", 1},
		{90, "写入配置并收尾", 2},
		{100, "安装完成", 3},
	}

	for i, step := range steps {
		time.Sleep(900 * time.Millisecond)
		installTasksMu.Lock()
		task, ok := installTasks[installID]
		if !ok {
			// 任务不存在时直接退出协程。
			// 这通常意味着任务被清理、取消，或服务做了其他管理动作。
			installTasksMu.Unlock()
			return
		}
		cp := task.Categories["cm"]
		cp.Status = "active"
		cp.Progress = step.progress
		cp.CurrentItem = step.item
		cp.CompletedItems = step.done
		task.Status = installStatusInstalling

		// 最后一个阶段将任务收敛为 completed 并写入结束时间，
		// 这样前端轮询可以据此停止。
		if i == len(steps)-1 {
			cp.Status = "completed"
			task.Status = installStatusCompleted
			now := time.Now().Unix()
			task.EndTime = &now
		}
		installTasksMu.Unlock()
	}
}

// calcTotalProgress 计算总进度。
// 当前策略是“各类别简单平均”，便于最小版本快速跑通。
// 后续如需更准确，可引入类别权重或按子项数量加权。
func calcTotalProgress(categories []categoryProgress) float64 {
	if len(categories) == 0 {
		return 0
	}
	var sum float64
	for _, cp := range categories {
		sum += cp.Progress
	}
	return sum / float64(len(categories))
}

// nilIfEmpty 用于统一 JSON 输出：
// - 空字符串 -> null（前端更容易判空）
// - 非空字符串 -> 原样返回错误信息
func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
