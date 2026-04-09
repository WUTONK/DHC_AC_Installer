package handler

import (
	"sync"
	"time"
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

// installTask 代表一个安装任务的完整状态。
// 通过 installId 唯一标识，存储在内存注册表中。
type installTask struct {
	ID         string
	SetID string
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
