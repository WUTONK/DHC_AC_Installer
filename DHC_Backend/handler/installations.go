package handler

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"DHC_Backend/models/service/servicelog"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ── 安装集定义注册表 ──

// installStep 描述安装集中的一个执行步骤（类别 + 执行器）。
type installStep struct {
	CategoryID   string
	CategoryName string
	ExecutorFn   func(*modinstall.TaskTracker) error
}

// installSetDefinition 描述一个安装集的完整定义：包含哪些类别、以什么顺序执行。
type installSetDefinition struct {
	Steps []installStep
	// DeferCleanup 为 true 时，安装结束后执行 SimEnvDevInstallCleanup。
	DeferCleanup bool
}

// installSetRegistry 是安装集定义的注册表。
// 新增安装集只需在此注册，无需修改 createInstallation 的分发逻辑。
var installSetRegistry = map[string]installSetDefinition{
	"demo-resource-verify-v1": {
		Steps: []installStep{
			{CategoryID: "resource", CategoryName: "资源包校验", ExecutorFn: modinstall.RunDemoResourceVerify},
		},
	},
	"demo-install-v1": {
		DeferCleanup: true,
		Steps: []installStep{
			{CategoryID: "core", CategoryName: "基础环境 (CSP)", ExecutorFn: modinstall.RunDemoCoreInstall},
			{CategoryID: "weather", CategoryName: "天气系统 (Sol & Pure)", ExecutorFn: modinstall.RunDemoWeatherInstall},
			{CategoryID: "map", CategoryName: "地图包 (首都高)", ExecutorFn: modinstall.RunDemoMapInstall},
			{CategoryID: "cars", CategoryName: "车辆包 (JDM Pack)", ExecutorFn: modinstall.RunDemoCarsInstall},
		},
	},
}

// defaultInstallSet 当 setId 不在注册表中时使用的默认定义。
var defaultInstallSet = installSetDefinition{
	Steps: []installStep{
		{CategoryID: "cm", CategoryName: "Content Manager", ExecutorFn: modinstall.RunDemoCMInstall},
	},
}

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
//  1. 校验请求参数（setId / versionId 必填）
//  2. 生成唯一 installId
//  3. 初始化任务状态并写入注册表
//  4. 异步启动安装流程（HTTP 立即返回，不阻塞前端）
func createInstallation(c *gin.Context) {
	var req struct {
		// SetID 安装集标识（如 "demo-install-v1"）。
		// JSON 字段名保持 versionId 以兼容现有前端，后续前端重构时改为 setId。
		SetID string `json:"versionId" binding:"required"`
		// DemoSlowProgress：为 true 时，对 DEMO 安装/资源校验按全局总进度 pacing。
		DemoSlowProgress bool `json:"demoSlowProgress"`
		// DemoSlowTotalSeconds：整次任务目标总耗时（秒），默认 20，范围 [1,300]。
		DemoSlowTotalSeconds float64 `json:"demoSlowTotalSeconds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	// 从注册表查找安装集定义
	setDef, found := installSetRegistry[req.SetID]
	if !found {
		setDef = defaultInstallSet
		servicelog.Infof("[install] setId %q not in registry, using default (cm demo)", req.SetID)
	}

	installID := fmt.Sprintf("install_%d", time.Now().UnixNano())
	now := time.Now().Unix()
	task := &installTask{
		ID:        installID,
		SetID:     req.SetID,
		Status:    installStatusPreparing,
		StartTime: now,
	}

	if req.DemoSlowProgress && (req.SetID == "demo-install-v1" || req.SetID == "demo-resource-verify-v1") {
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

	// 根据安装集定义初始化分类列表
	task.Categories = make(map[string]*categoryProgress, len(setDef.Steps))
	for _, step := range setDef.Steps {
		task.Categories[step.CategoryID] = &categoryProgress{
			CategoryID:   step.CategoryID,
			CategoryName: step.CategoryName,
			Status:       "waiting",
			Progress:     0,
		}
	}

	// 先写入注册表，确保前端拿到 installId 后马上轮询不会 404。
	installTasksMu.Lock()
	installTasks[installID] = task
	installTasksMu.Unlock()

	servicelog.Infof("[install] created task installId=%s setId=%s registryHit=%v demoSlowProgress=%v steps=%d",
		installID, req.SetID, found, task.demoPace != nil, len(setDef.Steps))

	// 异步启动安装流程：按步骤顺序执行，最后一步负责 finalize。
	go func() {
		defer servicelog.Infof("[install] pipeline goroutine exit installId=%s setId=%s", installID, task.SetID)
		if setDef.DeferCleanup {
			defer func() {
				servicelog.Infof("[install] deferred SimEnvDevInstallCleanup for installId=%s", installID)
				_ = modinstall.SimEnvDevInstallCleanup(false)
			}()
		}

		servicelog.Infof("[install] pipeline start installId=%s setId=%s", installID, task.SetID)
		steps := setDef.Steps
		for i, step := range steps {
			isLast := (i == len(steps)-1)
			if err := runInstallExecutor(installID, step.CategoryID, step.ExecutorFn, isLast); err != nil {
				if !isLast {
					finalizeInstallTask(installID, err)
				}
				return
			}
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"id":        installID,
		"versionId": req.SetID,
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
