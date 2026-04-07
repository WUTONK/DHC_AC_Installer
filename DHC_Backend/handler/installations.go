package handler

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// ── 安装任务状态枚举 ──

type installStatus string

const (
	installStatusPreparing  installStatus = "preparing"
	installStatusInstalling installStatus = "installing"
	installStatusCompleted  installStatus = "completed"
	installStatusFailed     installStatus = "failed"
)

// ── 数据结构 ──

// categoryProgress 是某个安装类别（如 cm、core、shader）的进度快照。
// 前端通过 GET /api/installations/{installId}/progress 拿到的 categories 数组里，
// 每一项就是一个 categoryProgress。
type categoryProgress struct {
	CategoryID     string  `json:"categoryId"`
	CategoryName   string  `json:"categoryName"`
	Status         string  `json:"status"`
	Progress       float64 `json:"progress"`
	CurrentItem    string  `json:"currentItem,omitempty"`
	TotalItems     int     `json:"totalItems,omitempty"`
	CompletedItems int     `json:"completedItems,omitempty"`

	// SubProgress 是当前阶段内的子进度（0-100），
	// 例如下载阶段里"已下载 60%"。前端可选展示为二级进度条。
	SubProgress float64 `json:"subProgress"`
}

// installTask 代表一个安装任务的完整状态。
// 通过 installId 唯一标识，存储在内存注册表中。
// demoPaceState 在 DEMO 慢速模式下按「全局总进度」节流，使整次任务约占用固定总时长（便于观察 UI）。
type demoPaceState struct {
	total time.Duration
	once  sync.Once
	t0    time.Time
}

func (p *demoPaceState) sleepUntilGlobalPercent(globalPercent float64) {
	if p == nil || p.total <= 0 {
		return
	}
	p.once.Do(func() {
		p.t0 = time.Now()
	})
	if globalPercent < 0 {
		globalPercent = 0
	}
	if globalPercent > 100 {
		globalPercent = 100
	}
	target := time.Duration(float64(p.total) * globalPercent / 100.0)
	elapsed := time.Since(p.t0)
	if elapsed < target {
		time.Sleep(target - elapsed)
	}
}

type installTask struct {
	ID         string
	VersionID  string
	Status     installStatus
	StartTime  int64
	EndTime    *int64
	Error      string
	Categories map[string]*categoryProgress
	// demoPace 非 nil 时，每次进度快照后按全局总进度与 total 对齐时间轴（仅 DEMO 安装/校验）。
	demoPace *demoPaceState
}

// ── 任务注册表 ──

var (
	// installTasks 是"任务注册表"：installId → 任务当前快照。
	// 前端调创建接口拿到 installId，后续用它轮询进度。
	// 目前是内存 map，后续可替换为持久化存储。
	installTasksMu sync.RWMutex
	installTasks   = map[string]*installTask{}
)

// ── 路由注册 ──

// registerInstallationRoutes 注册安装任务的两个核心接口：
//  1. POST /api/installations — 创建任务（返回 installId）
//  2. GET  /api/installations/:installId/progress — 查询进度（支持 category 过滤）
func registerInstallationRoutes(g gin.IRouter) {
	g.POST("/api/installations", createInstallation)
	g.GET("/api/installations/:installId/progress", getInstallationProgress)
}

// ── Handler: 创建安装任务 ──

// createInstallation 接收前端"开始安装"请求：
//  1. 校验请求参数（versionId 必填）
//  2. 生成唯一 installId
//  3. 初始化任务状态并写入注册表
//  4. 异步启动安装流程（HTTP 立即返回，不阻塞前端）
func createInstallation(c *gin.Context) {
	var req struct {
		VersionID string `json:"versionId" binding:"required"`
		// DemoSlowProgress：为 true 时，对 DEMO 安装/资源校验按全局总进度 pacing（默认总时长见 DemoSlowTotalSeconds）。
		DemoSlowProgress bool `json:"demoSlowProgress"`
		// DemoSlowTotalSeconds：整次任务目标总耗时（秒），默认 20，范围 [1,300]。
		DemoSlowTotalSeconds float64 `json:"demoSlowTotalSeconds"`
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
	}

	if req.DemoSlowProgress && (req.VersionID == "demo-install-v1" || req.VersionID == "demo-resource-verify-v1") {
		secs := req.DemoSlowTotalSeconds
		if secs <= 0 {
			secs = 20
		}
		if secs < 1 {
			secs = 1
		}
		if secs > 300 {
			secs = 300
		}
		task.demoPace = &demoPaceState{total: time.Duration(secs * float64(time.Second))}
	}

	// 根据 versionId 初始化分类列表。
	// - 默认版本：仅提供 cm 类别（保持旧单元测试行为不变）
	// - DEMO 资源校验：提供 resource 类别
	// - DEMO 安装：提供 core/weather/map/cars 类别
	switch req.VersionID {
	case "demo-resource-verify-v1":
		task.Categories = map[string]*categoryProgress{
			"resource": {
				CategoryID:   "resource",
				CategoryName: "资源包校验",
				Status:       "waiting",
				Progress:     0,
			},
		}
	case "demo-install-v1":
		task.Categories = map[string]*categoryProgress{
			"core": {
				CategoryID:   "core",
				CategoryName: "基础环境 (CSP)",
				Status:       "waiting",
				Progress:     0,
			},
			"weather": {
				CategoryID:   "weather",
				CategoryName: "天气系统 (Sol & Pure)",
				Status:       "waiting",
				Progress:     0,
			},
			"map": {
				CategoryID:   "map",
				CategoryName: "地图包 (首都高)",
				Status:       "waiting",
				Progress:     0,
			},
			"cars": {
				CategoryID:   "cars",
				CategoryName: "车辆包 (JDM Pack)",
				Status:       "waiting",
				Progress:     0,
			},
		}
	default:
		task.Categories = map[string]*categoryProgress{
			"cm": {
				CategoryID:   "cm",
				CategoryName: "Content Manager",
				Status:       "waiting",
				Progress:     0,
			},
		}
	}

	// 先写入注册表，确保前端拿到 installId 后马上轮询不会 404。
	installTasksMu.Lock()
	installTasks[installID] = task
	installTasksMu.Unlock()

	// 异步启动安装流程。
	// 具体安装逻辑由执行器决定，handler 只负责调度。
	switch req.VersionID {
	case "demo-resource-verify-v1":
		go func() {
			_ = runInstallExecutor(installID, "resource", modinstall.RunDemoResourceVerify, true)
		}()
	case "demo-install-v1":
		// DEMO 安装：按类别顺序执行 core -> weather -> map -> cars。
		go func() {
			// 实验流程收尾：清空后端中间目录并还原 simEnv（见 modinstall.SimEnvDevInstallCleanup 注释）。
			defer func() {
				_ = modinstall.SimEnvDevInstallCleanup(false)
			}()
			if err := runInstallExecutor(installID, "core", modinstall.RunDemoCoreInstall, false); err != nil {
				finalizeInstallTask(installID, err)
				return
			}
			if err := runInstallExecutor(installID, "weather", modinstall.RunDemoWeatherInstall, false); err != nil {
				finalizeInstallTask(installID, err)
				return
			}
			if err := runInstallExecutor(installID, "map", modinstall.RunDemoMapInstall, false); err != nil {
				finalizeInstallTask(installID, err)
				return
			}
			if err := runInstallExecutor(installID, "cars", modinstall.RunDemoCarsInstall, true); err != nil {
				finalizeInstallTask(installID, err)
				return
			}
		}()
	default:
		// 兼容旧版本：默认只跑 CM demo。
		go func() {
			_ = runInstallExecutor(installID, "cm", modinstall.RunDemoCMInstall, true)
		}()
		// 生产环境替换为：go runInstallExecutor(installID, "cm", modinstall.RunRealCMInstall, true)
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        installID,
		"versionId": req.VersionID,
		"status":    task.Status,
		"startTime": task.StartTime,
	})
}

// ── Handler: 查询安装进度 ──

// getInstallationProgress 返回 installId 对应任务的进度快照。
//
// category 过滤规则：
//   - all（默认）：返回任务下所有类别的进度
//   - cm / core / shader / ...：只返回指定类别（不存在则返回空数组）
func getInstallationProgress(c *gin.Context) {
	installID := c.Param("installId")
	category := c.DefaultQuery("category", "all")

	// 读操作用读锁，允许多个前端同时轮询不互相阻塞。
	installTasksMu.RLock()
	task, exists := installTasks[installID]
	if !exists {
		installTasksMu.RUnlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "install task not found"})
		return
	}

	// 按 category 过滤类别列表
	categories := make([]categoryProgress, 0)
	if category == "all" {
		for _, cp := range task.Categories {
			categories = append(categories, *cp)
		}
	} else if cp, ok := task.Categories[category]; ok {
		categories = append(categories, *cp)
	}

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

	// 调用执行器：具体安装逻辑全在这里面
	err := executorFn(tracker)

	// 根据执行结果标记类别状态。
	// finalizeTask=true：同时写入任务 EndTime，并把全局状态收敛到 completed/failed。
	installTasksMu.Lock()
	task, ok := installTasks[installID]
	if ok {
		// 类别完成/失败
		if cp := task.Categories[categoryID]; cp != nil {
			if err != nil {
				cp.Status = "failed"
			} else {
				cp.Status = "completed"
				cp.Progress = 100
			}
		}

		// 任务结束逻辑（用于 demo-install-v1 分段执行）
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
			// 分段执行出错：先标记失败状态，但 EndTime 由 finalizeInstallTask 统一写入
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
	} else {
		task.Status = installStatusCompleted
	}
}

// ── 工具函数 ──

// calcTotalProgress 计算总进度。
// 当前策略是"各类别简单平均"，后续可引入权重。
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

func calcTotalProgressFromTask(task *installTask) float64 {
	if task == nil || len(task.Categories) == 0 {
		return 0
	}
	categories := make([]categoryProgress, 0, len(task.Categories))
	for _, cp := range task.Categories {
		categories = append(categories, *cp)
	}
	return calcTotalProgress(categories)
}

// nilIfEmpty 统一 JSON 输出：空字符串 → null，非空 → 原样返回。
// 这样前端判空更方便（直接 if (error) 而不是 if (error !== "")）。
func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
