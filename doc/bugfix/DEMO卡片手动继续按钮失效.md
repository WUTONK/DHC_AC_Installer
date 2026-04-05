# BUG: DEMO 卡片「手动继续」按钮不生效

> 修复日期：2026-04-05  
> 影响范围：`InstallProgressPage.tsx`、`OneClickInstaller.tsx`  
> 严重程度：中（仅影响开发者模式 DEMO 安装流程）

---

## 现象

开发者模式下开启「安装完成：停留在分类进度页」开关后：

- **普通卡片（本地模拟）**：安装完成后正确显示进度列表 + 「继续」按钮，等待用户点击。
- **DEMO 卡片（后端轮询）**：安装跑到约 55% 时直接跳转到完成页面，「继续」按钮从未出现。

## 根因分析

### 1. 后端返回 `failed` 而非 `completed`

DEMO 安装的后端执行器 `RunDemoCoreInstall`（`demoInstaller.go`）在资源校验阶段会调用 `ImportResourceDetection` 检测本地资源完整性。当 `test/simEnv` 下的资源文件不满足 `Pass` 状态时，汇总判定直接返回错误：

```go
// demoInstaller.go:273-276
if !anyImported || !allPass {
    tracker.FailPhase("resource_finalize")
    return fmt.Errorf("资源包校验不通过：imported=%v complete=%v", anyImported, allPass)
}
```

此时 `RunDemoCoreInstall` 返回 error → `runInstallExecutor` 将任务状态标记为 `failed` → 前端轮询拿到 `status: "failed"`。

进度停在 ~55% 是因为权重分布：资源校验（车辆 10 + 地图 10 + 光影 10 + 汇总 5 = 35）+ DLC 检测 20 = 55，在汇总判定阶段失败。

### 2. 前端 `handleAllDone` 在失败时跳过了 `manualContinue` 检查

旧代码：

```typescript
const handleAllDone = (success: boolean, errorMsg?: string) => {
    if (!success) {
        setFinishState('done');          // ← 直接跳到完成，忽略 manualContinue
        addLog(`安装失败: ${errorMsg}`);
        return;                          // ← 提前返回
    }
    // ... 成功路径才检查 manualContinueRef.current
};
```

`success = false` 时无条件 `setFinishState('done')`，组件立即渲染完成卡片并触发 `onComplete` 回调，页面跳转。`manualContinueAfterComplete` 完全被忽略。

### 为什么普通卡片没问题？

普通卡片走本地模拟路径（`installId` 为 `undefined`），四个分类依次用 `setInterval` 递增进度，永远不会失败——100% 到达后调用 `handleAllDone(true)`，走成功分支，`manualContinue` 正常检查。

## 修复方案

将 `handleAllDone` 中的 `manualContinue` 检查提升为**成功/失败共用逻辑**：

```typescript
const handleAllDone = useCallback((success: boolean, errorMsg?: string) => {
    setInstallSuccess(success);
    if (success) {
        setTotalProgress(100);
        addLog('所有安装任务已完成。环境配置更新完毕。');
    } else {
        addLog(`安装失败: ${errorMsg || '未知错误'}`);
    }

    // 不论成功还是失败，统一检查 manualContinue
    if (manualContinueRef.current) {
        setFinishState('awaiting_continue');
    } else {
        setFinishState('done');
        if (success && onCompleteRef.current) {
            setTimeout(() => onCompleteRef.current?.(), 1000);
        }
    }
}, [addLog]);
```

同时引入 `installSuccess` 状态，在 `awaiting_continue` 阶段区分 UI 展示：

| 状态 | 标题 | 进度条颜色 | 按钮颜色 |
|------|------|-----------|---------|
| 成功 | 安装完成 | `#6bc786`（绿） | 绿色 |
| 失败 | 安装失败 | `#e74c3c`（红） | 红色 |

## 附加重构

在本次修复过程中，还对 `InstallProgressPage.tsx` 做了以下清理：

1. **状态合并**：将 `isFinished` + `awaitingContinue` 两个 boolean 合并为 `finishState: 'running' | 'awaiting_continue' | 'done'` 枚举，消除状态矛盾的可能。
2. **统一出口**：提取 `handleAllDone` 函数，本地模拟和后端轮询两条路径共用同一个完成入口。
3. **Ref 稳定化**：`onComplete` 和 `manualContinueAfterComplete` 通过 `useRef` 访问，避免作为 `useEffect` 依赖导致轮询 effect 反复重挂载。

## 验证步骤

1. 开启开发者模式 → 打开「安装完成：停留在分类进度页」开关
2. 选择 DEMO 安装卡片 → 点击安装
3. 预期：安装结束后（无论成功/失败）页面停留在进度列表，底部显示「继续」按钮
4. 点击「继续」→ 正常跳转到完成页
