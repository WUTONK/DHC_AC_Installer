# 第四阶段重构报告：优化

> 执行日期：2026-04-11  
> 依据：architecture-full-analysis.md 重构路线图第四阶段

---

## 一、概述

第四阶段包含两个核心任务：
1. **安装任务持久化** — 将内存 `installTasks` map 持久化到磁盘，支持进程重启后恢复历史任务
2. **OpenAPI 规范补全** — 将严重滞后的 OpenAPI 规范与后端实际 API 完全对齐，并重新生成前端 TypeScript 客户端

---

## 二、任务一：安装任务持久化

### 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 存储方式 | JSON 文件 (`Database/InstallTasks.json`) | 与现有 `appState.json` 一致，零额外依赖 |
| 写入策略 | 检查点写入（3 个触发点） | 避免 tracker 高频回调导致的 I/O 压力 |
| 内存 map | 保留 | 运行期快速读写，持久化层仅做备份 |
| 启动恢复 | 自动标记中断任务 | installing/preparing → interrupted |
| 历史上限 | 50 条 | 按 StartTime 降序淘汰 |

### 新增文件

| 文件 | 说明 |
|------|------|
| `models/service/infoGet/InstallTaskStore.go` | 持久化存储层：InstallTaskRecord 结构体、LoadInstallTasks、SaveInstallTasks、RecoverInterruptedTasks |

### 修改文件

| 文件 | 改动 |
|------|------|
| `handler/InstallTaskRegistry.go` | 新增 taskToRecord/recordToTask 转换函数、persistCheckpoint 检查点写盘、initTasksFromDisk 启动加载 |
| `handler/installations.go` | createInstallation 写入注册表后调用 persistCheckpoint |
| `handler/InstallExecutorBridge.go` | runInstallExecutor 分类完成后调用 persistCheckpoint；finalizeInstallTask 收尾后调用 |
| `handler/init.go` | InitGin 开头调用 initTasksFromDisk 加载历史任务 |
| `test/unitTest/handler/installations_test.go` | 新增 TestInstallTaskPersistence（端到端持久化验证）和 TestRecoverInterruptedTasks（中断恢复逻辑） |

### 写盘时机

仅在以下 3 个关键状态变更点写盘（持有 installTasksMu 写锁时），不在 tracker 高频回调中写盘：

1. **任务创建后** — `createInstallation` 中 `installTasks[id] = task` 后
2. **分类步骤完成/失败后** — `runInstallExecutor` 中 `executorFn` 返回后标记类别状态
3. **任务最终收尾时** — `finalizeInstallTask` 写入 EndTime 和最终状态后

### 不持久化的字段

- `demoPaceState`：纯运行时节流，恢复后不需要

### 测试结果

```
=== RUN   TestInstallationFlowMinimal     --- PASS (2.81s)
=== RUN   TestInstallTaskPersistence      --- PASS (2.81s)  
=== RUN   TestRecoverInterruptedTasks     --- PASS (0.00s)
PASS  ok  DHC_Backend/test/unitTest/handler  6.113s
```

---

## 三、任务二：OpenAPI 规范补全

### 变更统计

| 项目 | 旧规范 | 新规范 |
|------|--------|--------|
| 路径数 | 14 条（11 条已废弃） | 18 条（全部与后端一一对应） |
| Schema 数 | 19 个（大量未使用） | 16 个（全部有引用） |
| 版本 | 1.0.0 | 2.0.0 |
| 标签 | 4 个 | 5 个 |

### 删除的旧路径（11 条）

```
/api/GetInstallVersions    /api/CheckCMStatus     /api/InstallCM
/api/GetCMInstallProgress  /api/StartInstall      /api/GetInstallProgress
/api/GetCarPackProgress    /api/GetShaderProgress  /api/GetMapProgress
/api/GetCarProgress        /api/GetInstallLogs
```

### 新增的路径（15 条）

| Tag | 路径 |
|-----|------|
| Installation | POST /api/installations、GET /api/installations/{installId}/progress |
| Precheck | GET /api/demo/precheck/resources、dlc-carpack、cm |
| AppState | GET /api/AppState、PUT /api/AppState/ServerDisclaimer |
| Dev | GET /api/TestPlaygroundHealth、POST TestPlaygroundEcho、POST TestPlaygroundJob/start、GET TestPlaygroundJob/progress |
| Dev | GET /api/lab/ping、POST /api/lab/echo、POST /api/lab/task/start、GET /api/lab/task/status |

### 保留的路径（3 条）

- `GET /api/GetGamePath` — 保持不变
- `GET /api/GetDiskInfo` — 保持不变
- `GET /api/GetServerInfo` — 修正响应 schema，保持向后兼容

### 前端客户端重新生成

新增 TypeScript 模型文件 11 个：

```
models/CreateInstallationReq.ts    models/CreateInstallationResp.ts
models/InstallCategoryProgress.ts  models/InstallationProgressResp.ts
models/PrecheckResourcesResp.ts    models/PrecheckDlcResp.ts
models/PrecheckCmResp.ts           models/AppStateResp.ts
models/ServerDisclaimerState.ts     models/UpsertServerDisclaimerReq.ts
models/GetDiskInfoResp.ts
```

`DefaultApi.ts` 从 2 个方法扩展到 12 个方法，覆盖：
- System：GetGamePath、GetDiskInfo、GetServerInfo
- Installation：CreateInstallation、GetInstallationProgress
- Precheck：PrecheckResources、PrecheckDlcCarpack、PrecheckCm
- AppState：GetAppState、UpsertServerDisclaimer

### OpenAPI 副本同步

三份 `DHC_AC_Installer.openapi.json` 已验证完全一致：
- `/DHC_AC_Installer.openapi.json`（根目录）
- `/DHC_Frontend/DHC_AC_Installer.openapi.json`
- `/DHC_Backend/DHC_AC_Installer.openapi.json`

---

## 四、用户规则遵守情况

| 规则 | 状态 | 说明 |
|------|------|------|
| 1. 通用函数放 infoGet 包 | ✅ | InstallTaskStore.go 放在 infoGet 包 |
| 4. systemInfoHandler.go 不删除 | ✅ | 未触动 |
| 5. ShaderInstaller.v1.tsx 不删除 | ✅ | 未触动 |
| 7. 新文件使用大驼峰命名 | ✅ | InstallTaskStore.go |
| 8. 前端直接操作后端文件不解决 | ✅ | 未触动 appStateFileStore.ts |

---

## 五、编译与测试验证

- **Go 后端**：`go build ./...` 编译通过（exit_code: 0）
- **Handler 测试**：3/3 PASS，含原有回归测试和新增持久化测试
- **前端 TypeScript**：无 linter 错误
