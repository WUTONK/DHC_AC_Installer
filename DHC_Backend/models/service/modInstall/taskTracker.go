package modinstall

import "sync"

// ============================================================================
// TaskTracker —— 借鉴 React Hook 思想的"进度追踪器"
//
// 你在注释里提到的"颗粒度细化"，对应的技术术语叫：
//   "子进度区间映射"（Sub-progress Range Mapping）
// 含义是：把一个阶段内部的 0-100% 子进度，自动映射到它在总进度中占据的区间。
//
// ── 核心概念 ──
//
//   Phase（阶段）：任务拆分的若干步骤，例如"下载""解压""移动文件"。
//   Weight（权重）：每个阶段占总进度的百分比，所有阶段权重之和 = 100。
//   SubProgress（子进度）：每个阶段内部自己的 0-100% 进度。
//
// ── 自动换算规则（里程碑自动计算）──
//
//   总进度 = 已完成阶段的权重之和 + 当前阶段的权重 × (子进度 / 100)
//
//   例如："下载"权重=25，子进度=50%
//         → 总进度 = 0（前面没有已完成阶段） + 25 × 0.5 = 12.5%
//
// ── 使用方式（像 useEffect 一样声明式注册）──
//
//   tracker := NewTaskTracker(onProgressChanged)
//   tracker.AddPhase("download", "下载CM安装包", 25)   // 占总进度 25%
//   tracker.AddPhase("extract",  "解压CM文件",  50)   // 占总进度 50%
//   tracker.AddPhase("move",     "移动到桌面",  25)   // 占总进度 25%
//
//   tracker.StartPhase("download")
//   tracker.SetSubProgress("download", 50)   // → 总进度 12.5%
//   tracker.CompletePhase("download")         // → 总进度 25%
//
//   tracker.StartPhase("extract")
//   tracker.SetSubProgress("extract", 60)    // → 总进度 25 + 50×0.6 = 55%
//   tracker.CompletePhase("extract")          // → 总进度 75%
//
//   tracker.StartPhase("move")
//   tracker.CompletePhase("move")             // → 总进度 100%
//
// ============================================================================

// ProgressSnapshot 是每次进度变化时，回调给外层的"快照"。
// 前端轮询拿到的数据，就是从这个快照转换来的。
type ProgressSnapshot struct {
	// TotalProgress 是自动换算后的总进度（0-100）。
	// 换算公式：已完成阶段权重之和 + 当前阶段权重 × (子进度 / 100)
	//   例如："下载"权重=25，子进度=50%
	//         → 总进度 = 0（前面没有已完成阶段） + 25 × 0.5 = 12.5%
	TotalProgress float64

	// CurrentPhase 是当前正在执行的阶段 ID（例如 "download"）。
	// 如果还没有任何阶段开始，则为空字符串。
	CurrentPhase string

	// PhaseName 是当前阶段的显示名（例如 "下载CM安装包"），用于前端展示。
	PhaseName string

	// SubProgress 是当前阶段内的子进度（0-100）。
	// 例如下载阶段里，已下载文件的百分比。
	SubProgress float64

	// PhaseStatus 是当前阶段的状态：waiting / active / completed / failed。
	PhaseStatus string
}

// Phase 表示安装过程中的一个阶段。
// 例如："下载"是一个阶段，"解压"是另一个阶段。
type Phase struct {
	ID          string  // 唯一标识，例如 "download"
	Name        string  // 显示名，例如 "下载CM安装包"
	Weight      float64 // 在总进度中的权重（所有阶段权重之和应为 100）
	SubProgress float64 // 本阶段内的子进度 0-100
	Status      string  // waiting / active / completed / failed
}

// TaskTracker 是进度追踪器的主结构。
// 创建后通过 AddPhase 注册阶段，执行时通过 StartPhase / SetSubProgress / CompletePhase 推进。
type TaskTracker struct {
	mu       sync.Mutex
	phases   []*Phase          // 保持注册时的顺序（遍历时按此顺序计算）
	phaseMap map[string]*Phase // 按 ID 快速查找（避免每次遍历）
	onChange func(ProgressSnapshot)
}

// NewTaskTracker 创建一个新的进度追踪器。
//
// onChange 是"进度变化回调"：
// 每次调用 StartPhase / SetSubProgress / CompletePhase 时都会触发，
// 你可以在回调里把快照写入任务注册表，前端就能通过轮询看到实时进度。
//
// 传 nil 表示不需要回调（静默模式），仍然可以通过 GetSnapshot() 主动读取。
func NewTaskTracker(onChange func(ProgressSnapshot)) *TaskTracker {
	return &TaskTracker{
		phases:   make([]*Phase, 0),
		phaseMap: make(map[string]*Phase),
		onChange: onChange,
	}
}

// AddPhase 注册一个阶段。
// 像 React 的 useEffect 一样，在任务函数开头集中声明所有阶段。
//
// 参数说明：
//   - id:     阶段唯一标识（例如 "download"），后续所有操作都用这个 id
//   - name:   显示名（例如 "下载CM安装包"），会出现在前端进度界面
//   - weight: 该阶段占总进度的百分比（所有阶段的 weight 之和应为 100）
//
// 示例：
//
//	tracker.AddPhase("download", "下载CM安装包", 25)   // 占 25%
//	tracker.AddPhase("extract",  "解压CM文件",  50)   // 占 50%
//	tracker.AddPhase("move",     "移动到桌面",  25)   // 占 25%
func (t *TaskTracker) AddPhase(id string, name string, weight float64) {
	t.mu.Lock()
	defer t.mu.Unlock()

	phase := &Phase{
		ID:     id,
		Name:   name,
		Weight: weight,
		Status: "waiting",
	}
	t.phases = append(t.phases, phase)
	t.phaseMap[id] = phase
}

// StartPhase 将指定阶段标记为 active（正在进行），子进度重置为 0，并触发回调。
// 调用前需要先通过 AddPhase 注册过该 id，否则什么也不做。
func (t *TaskTracker) StartPhase(id string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	phase, ok := t.phaseMap[id]
	if !ok {
		return
	}

	phase.Status = "active"
	phase.SubProgress = 0
	t.notifyLocked()
}

// SetSubProgress 更新指定阶段的子进度（0-100），并触发回调。
// 总进度会通过"子进度区间映射"自动换算。
//
// 换算公式：
//
//	总进度 = 已完成阶段权重之和 + 当前阶段权重 × (子进度 / 100)
//
// 例如："download" 权重=25，子进度=50%
//
//	→ 总进度 = 0 + 25 × 0.5 = 12.5%
func (t *TaskTracker) SetSubProgress(id string, subPercent float64) {
	t.mu.Lock()
	defer t.mu.Unlock()

	phase, ok := t.phaseMap[id]
	if !ok {
		return
	}

	// 限制子进度在合法范围内
	if subPercent < 0 {
		subPercent = 0
	}
	if subPercent > 100 {
		subPercent = 100
	}

	phase.SubProgress = subPercent
	t.notifyLocked()
}

// CompletePhase 将指定阶段标记为 completed，子进度自动设为 100%。
// 完成后该阶段的全部权重会计入总进度。
func (t *TaskTracker) CompletePhase(id string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	phase, ok := t.phaseMap[id]
	if !ok {
		return
	}

	phase.Status = "completed"
	phase.SubProgress = 100
	t.notifyLocked()
}

// FailPhase 将指定阶段标记为 failed。
// 调用后总进度会停在当前值，不再前进。
func (t *TaskTracker) FailPhase(id string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	phase, ok := t.phaseMap[id]
	if !ok {
		return
	}

	phase.Status = "failed"
	t.notifyLocked()
}

// GetSnapshot 返回当前进度快照，但不触发回调。
// 适合"主动读取"场景，例如 HTTP 接口处理函数里直接获取当前进度。
func (t *TaskTracker) GetSnapshot() ProgressSnapshot {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.buildSnapshotLocked()
}

// ── 以下是内部方法，外部不需要关心 ──

// notifyLocked 计算当前快照并触发 onChange 回调。
// 调用时必须已经持有 t.mu 锁。
func (t *TaskTracker) notifyLocked() {
	if t.onChange == nil {
		return
	}
	snapshot := t.buildSnapshotLocked()
	t.onChange(snapshot)
}

// buildSnapshotLocked 遍历所有阶段，计算总进度和当前状态快照。
// 调用时必须已经持有 t.mu 锁。
//
// 计算规则：
//  1. 遍历所有阶段（按 AddPhase 注册的顺序）
//  2. completed 阶段：贡献全部权重（Weight）
//  3. active 阶段：按子进度比例贡献部分权重（Weight × SubProgress / 100）
//  4. waiting / failed 阶段：不贡献新的权重
func (t *TaskTracker) buildSnapshotLocked() ProgressSnapshot {
	var totalProgress float64
	var currentPhase string
	var phaseName string
	var subProgress float64
	phaseStatus := "waiting"

	for _, p := range t.phases {
		switch p.Status {
		case "completed":
			// 已完成阶段，贡献全部权重
			totalProgress += p.Weight
			// 最终快照记录的会是最后一个 completed 的阶段，
			// 这样当所有阶段都完成时，快照的状态是 completed 而不是 waiting
			currentPhase = p.ID
			phaseName = p.Name
			subProgress = p.SubProgress
			phaseStatus = "completed"
		case "active":
			// 进行中阶段，按子进度比例贡献部分权重
			totalProgress += p.Weight * (p.SubProgress / 100)
			currentPhase = p.ID
			phaseName = p.Name
			subProgress = p.SubProgress
			phaseStatus = "active"
		case "failed":
			// 失败阶段保留已完成的部分权重（子进度停在失败时的值）
			totalProgress += p.Weight * (p.SubProgress / 100)
			currentPhase = p.ID
			phaseName = p.Name
			subProgress = p.SubProgress
			phaseStatus = "failed"
		}
	}

	// 防止浮点误差导致超过 100
	if totalProgress > 100 {
		totalProgress = 100
	}

	return ProgressSnapshot{
		TotalProgress: totalProgress,
		CurrentPhase:  currentPhase,
		PhaseName:     phaseName,
		SubProgress:   subProgress,
		PhaseStatus:   phaseStatus,
	}
}
