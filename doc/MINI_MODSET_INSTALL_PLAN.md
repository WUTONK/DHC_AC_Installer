# 真实模组集安装 Mini 版 —— 实施计划与架构设计

> **文档版本**: v1.2  
> **创建日期**: 2026-04-23 | **最后更新**: 2026-04-25  
> **目标**: 实现**完整用户链路** —— 从"用户导入资源包"到"解压缩并安装车包+地图包+HUD"的全流程（Mini 版模组集）  
> **面向读者**: 接管本项目的 AI（在 new session 中）、开发者

---

## 一、项目现状总结（AI 快速对齐用）

### 1.1 技术栈

| 层 | 技术 | 入口 |
|----|------|------|
| 前端 | Electron + React + TypeScript + Semi Design | `DHC_Frontend/` |
| 后端 | Go + Gin (HTTP `127.0.0.1:19810`) | `DHC_Backend/` |
| 通信 | OpenAPI 契约 + Electron IPC 代理 | `DHC_AC_Installer.openapi.json` |
| 构建 | electron-vite + pnpm | `DHC_Frontend/package.json` |

### 1.2 核心架构

```
┌──────────────┐      IPC       ┌──────────────┐    HTTP/JSON    ┌──────────────┐
│  React 渲染进程 │  ──────────▶  │ Electron 主进程 │  ──────────▶  │  Go Gin 后端  │
│  (Semi Design) │  ◀──────────  │  (IPC 桥接)    │  ◀──────────  │  (19810 端口) │
└──────────────┘              └──────────────┘               └──────────────┘
                                                                    │
                                                    ┌───────────────┤
                                                    ▼               ▼
                                            安装集注册表     modInstall 引擎
                                         (installSetRegistry)   (核心安装逻辑)
```

### 1.3 已实现的安装能力

| 安装集 ID | 类别 | 状态 |
|-----------|------|------|
| `demo-install-v1` | core + weather + map + cars | DEMO（写 .txt 模拟文件） |
| `demo-resource-verify-v1` | resource | 真实资源校验 |
| `real-install-v1` | map (SRP 0.9.3) | **真实安装** ✅ |
| 内部函数 `RunMinimalModsetInstall` | cars + tracks + shaders（测试迷你包） | 真实安装，但**未注册到注册表** |

### 1.4 ⚠️ 资源库的真实目录结构（重要！以磁盘为准）

`testPkg` 是整个资源库根，模拟的是**一个资源包解压后的完整内容**。

**当前 testPkg 磁盘上的真实状态**（2026-04-25 实测）：

```
test/simEnv/resources/testPkg/           ← 资源库根
├── pkgInfo.json                          ← 资源 catalog
│
├── cars/                                 ← ResourceType
│   └── SHMC/                             ← pkg（车包名）
│       └── WMMT HUD v1.0.7z             ← ⚠️ 注意：这里放的是HUD的7z，目录名却叫SHMC
│
├── tracks/                               ← ResourceType
│   └── minDemo/                          ← pkg
│       ├── SRP_093.7z                    ← 真实地图压缩包（~1.2GB）
│       └── dft.json                      ← 覆盖规则（overwriteStartingDir: "."）
│
├── dashboard/                            ← ResourceType（注意不是 "hud"）
│   └── miniDemo/                         ← pkg
│       └── WMMT HUD v1.0.7z             ← HUD 压缩包
│
└── (其他旧测试目录: shaders/, map/, resouces/ — 可能是历史残留)
```

**关键发现**：
- `pkgInfo.json` 中用的类型名是 `"hud"`，但磁盘上的目录名是 `"dashboard"`
- `types.go` 中有 `Dashboard ResourceType = "dashboard"` 枚举
- `ImportResourceDetection` 扫描时使用的是 ResourceType 值（即 `"dashboard"`）作为目录名
- 所以**磁盘上 `dashboard/` 目录是正确的**，与代码一致

### 1.5 三级路径系统（核心寻址方式）

整个系统固定使用 **`{type}/{pkg}/{mod}`** 三级路径。

**pkgInfo.json 当前内容** vs **磁盘对应关系**：

```
pkgInfo.json                    磁盘路径（资源库根/）
─────────────────────────────── ─────────────────────────
categorys.cars.SHMC.r34 = 8     cars/SHMC/r34/          ← 磁盘上不存在
categorys.tracks.minDemo.mapMini = 1   tracks/minDemo/mapMini/  ← 磁盘上不存在
                                       tracks/minDemo/SRP_093.7z ← 存在但 catalog 中无对应条目
categorys.hud.demoPkg.hudMini = 1      dashboard/miniDemo/ 或 hud/demoPkg/ ← 需要统一
```

**结论**：pkgInfo.json 需要更新以匹配实际资源。

### 1.6 用户完整链路（当前缺失环节标记）

```
用户拿到资源压缩包（如"DHC_Mini安装包.7z"）
    │
    ▼
① 导入资源包（DhcResoucePkgImport）
    │  解压 → importResourceCache/
    │  检测 → ResourceMap
    │  合并 → 资源库根/
    │  清理缓存
    │
    │  ⚠️ 此函数已实现，但【未暴露为 HTTP API】
    │  ⚠️ 前端 ResourceImportManager.tsx 是【纯 Mock】
    │
    ▼
② 资源完整性校验（ImportResourceDetection）
    │  扫描磁盘 vs pkgInfo.json 预期体积
    │  ✅ 已实现，demo-resource-verify-v1 已接入
    │
    ▼
③ 安装到游戏目录（MultiModInstallWithTracker）
    │  读取 dft.json → SingleModInstall / SingleModInstallFromDir → OverrideControl
    │  ✅ 核心引擎已实现
    │  ✅ real-install-v1 验证了地图真实安装
    │  ⚠️ 车包、HUD 的真实安装执行器【未注册到注册表】
    │
    ▼
④ 前端展示安装进度
    ✅ InstallProgressPage 支持多 category 进度条
```

### 1.7 关键文件清单（AI 必读）

| 文件 | 作用 | 重要度 |
|------|------|--------|
| `DHC_Backend/handler/installations.go` | 安装集注册表 + HTTP 路由 | ⭐⭐⭐ |
| `DHC_Backend/handler/InstallExecutorBridge.go` | TaskTracker ↔ 任务状态桥接 | ⭐⭐⭐ |
| `DHC_Backend/handler/init.go` | 全局路由注册入口 | ⭐⭐ |
| `DHC_Backend/models/service/modInstall/modInstall.go` | 核心安装逻辑 | ⭐⭐⭐ |
| `DHC_Backend/models/service/modInstall/demoInstaller.go` | Demo/Real 执行器 | ⭐⭐⭐ |
| `DHC_Backend/models/service/modInstall/taskTracker.go` | 进度追踪器 | ⭐⭐ |
| `DHC_Backend/models/service/modInstall/types.go` | ResourceType 枚举 | ⭐⭐ |
| `DHC_Backend/models/service/modInstall/resourceDetection.go` | ResourceMap + 资源校验 | ⭐⭐ |
| `DHC_Backend/models/service/decompression/overrideControl.go` | 文件覆盖引擎 | ⭐⭐ |
| `DHC_Backend/models/service/decompression/dft.go` | dft.json 解析 | ⭐⭐ |
| `DHC_Backend/test/simEnv/resources/testPkg/pkgInfo.json` | 资源 catalog | ⭐⭐ |
| `DHC_Frontend/src/renderer/src/hooks/useInstallation.ts` | 前端安装 Hook | ⭐⭐ |
| `DHC_Frontend/src/renderer/src/components/OneClickInstaller/types.ts` | 前端类型定义 | ⭐⭐ |
| `DHC_Frontend/src/renderer/src/InstallProgressPage.tsx` | 安装进度页 | ⭐⭐ |

---

## 二、四级路径灵活性分析

### 2.1 问题

> 如果 `{type}/{pkg}/{这里再套一层}/{mod}` 也可以吗？

### 2.2 结论：当前不支持，需要五处改动

整个系统在**五个位置**硬编码了"三级路径"约束：

| # | 位置 | 约束 | 代码 |
|---|------|------|------|
| 1 | `pkgInfo.json` 结构 | 固定三层嵌套 `{type}.{pkg}.{mod} = 体积` | JSON 结构 |
| 2 | `ImportResourceDetection` | 取前三段做 key | `modPath := strings.Join(pathSplit[:3], "/")` (L374) |
| 3 | `PathCorresponModIntegrityCheck` | 严格拒绝非三级 | `if pathLength != 3 { return error }` (L501) |
| 4 | `expandPaths` | `switch len(parts)` 只处理 1/2/3 | `default: continue` (L571) |
| 5 | `ResourceMap` 数据结构 | 三层嵌套，三参数 | `GetState(type, pkg, mod)` / `SetState(...)` |

### 2.3 如果要支持四级（未来扩展方向）

两种方案：

**方案 A（低成本绕行）**: 把中间层编码进 pkg 名中，例如 `cars/SHMC__drift/r34`，用分隔符拍平。无需改代码结构，但丧失了语义。

**方案 B（完整重构）**: 把 ResourceMap 从固定三层改为递归树结构，pkgInfo.json 也改为递归。工作量较大（预计 1-2 天），但扩展性好。

**建议**: Mini 版先保持三级路径，后续如有需求再重构。

---

## 三、Mini 版目标

### 3.1 定义

一次完整的用户操作链路：**导入资源包 → 校验 → 安装（车包 + 地图 + HUD）**

三个安装类别（独立执行器）：

| 类别 | 说明 | ResourceType | 示例路径 |
|------|------|-------------|---------|
| **车包** | 车辆模组 | `cars` | `cars/miniPkg/miniCar` |
| **地图包** | 地图模组 | `tracks` | `tracks/miniPkg/miniMap` |
| **HUD 仪表盘** | 仪表盘模组 | `dashboard` | `dashboard/miniPkg/miniHud` |

> 注意：使用 `dashboard` 而不是 `hud`，因为 `types.go` 中 `Dashboard ResourceType = "dashboard"`，`ImportResourceDetection` 用 ResourceType 值作为磁盘目录名。

### 3.2 simEnv 测试资源规划

需要在 `testPkg/` 下构建三类真实（或迷你测试用）资源：

```
test/simEnv/resources/testPkg/           ← 资源库根
├── pkgInfo.json                          ← 更新：声明三类 mini 资源
│
├── cars/
│   └── miniPkg/                          ← pkg
│       └── miniCar/                      ← mod
│           ├── dft.json                  ← { overwriteStartingDir: "content/cars" }
│           └── (车辆文件，或 .zip/.7z)
│
├── tracks/
│   └── miniPkg/                          ← pkg
│       └── miniMap/                      ← mod
│           ├── dft.json                  ← { overwriteStartingDir: "." 或 "content/tracks" }
│           └── (地图文件，或 .zip/.7z)
│
└── dashboard/                            ← 注意目录名是 dashboard（与 ResourceType 一致）
    └── miniPkg/                          ← pkg
        └── miniHud/                      ← mod
            ├── dft.json                  ← { overwriteStartingDir: "content" 或具体路径 }
            └── (HUD 文件，或 .zip/.7z)
```

---

## 四、差距分析：需要做什么

### 4.1 后端

#### ✅ 已有（可直接复用）
- [x] `DhcResoucePkgImport` — 资源包导入
- [x] `MultiModInstallWithTracker` — 带 tracker 的批量安装
- [x] `SingleModInstall` / `SingleModInstallFromDir` — 单模组安装
- [x] `OverrideControl` — 文件覆盖策略引擎
- [x] `ImportResourceDetection` — 资源完整性校验
- [x] `installSetRegistry` — 安装集注册表
- [x] `runInstallExecutor` — 通用执行桥接
- [x] `TaskTracker` — 进度追踪系统

#### 🆕 需要新增

1. **三个独立执行器**（`demoInstaller.go` 或新建 `realInstaller.go`）:

```go
func RunRealCarsInstallMini(tracker *TaskTracker) error {
    servicelog.Infof("[real] RunRealCarsInstallMini begin")
    paths := []string{"cars/miniPkg/miniCar"}
    return MultiModInstallWithTracker(paths, string(types.DftPathFromDir), tracker)
}

func RunRealMapInstallMini(tracker *TaskTracker) error {
    servicelog.Infof("[real] RunRealMapInstallMini begin")
    paths := []string{"tracks/miniPkg/miniMap"}
    return MultiModInstallWithTracker(paths, string(types.DftPathFromDir), tracker)
}

func RunRealHudInstallMini(tracker *TaskTracker) error {
    servicelog.Infof("[real] RunRealHudInstallMini begin")
    paths := []string{"dashboard/miniPkg/miniHud"}
    return MultiModInstallWithTracker(paths, string(types.DftPathFromDir), tracker)
}
```

2. **注册到安装集注册表** (`installations.go`):

```go
"real-mini-install-v1": {
    DeferCleanup: false,
    Steps: []installStep{
        {CategoryID: "cars",      CategoryName: "车辆包",      ExecutorFn: modinstall.RunRealCarsInstallMini},
        {CategoryID: "map",       CategoryName: "地图包",      ExecutorFn: modinstall.RunRealMapInstallMini},
        {CategoryID: "dashboard", CategoryName: "HUD 仪表盘",  ExecutorFn: modinstall.RunRealHudInstallMini},
    },
},
```

3. **资源导入 HTTP API**（新建 `handler/resourceImportHandler.go`）:

```go
// POST /api/resource-import
// Body: { "pkgPath": "/path/to/DHC_Mini安装包.7z" }
func handleResourceImport(c *gin.Context) {
    var req struct {
        PkgPath string `json:"pkgPath" binding:"required"`
    }
    // ... 调用 DhcResoucePkgImport(req.PkgPath) ...
}
```

#### 🔧 需要修改

4. **pkgInfo.json** — 更新为与磁盘一致:

```json
{
    "categorys": {
        "cars": {
            "miniPkg": { "miniCar": 1 }
        },
        "tracks": {
            "miniPkg": { "miniMap": 1 }
        },
        "dashboard": {
            "miniPkg": { "miniHud": 1 }
        }
    }
}
```

> 注意：这里把之前 pkgInfo.json 中的 `"hud"` 改为 `"dashboard"`，与 `types.go` 和磁盘目录统一。或者反过来在 types.go 中改枚举。

5. **测试资源文件** — 在 testPkg 下创建三类资源的 dft.json 和占位文件

### 4.2 前端

1. `useInstallation.ts` — 新增 `createRealMiniInstall()`
2. UI — 添加 Mini 安装入口按钮
3. 资源导入 UI — 文件选择 + 调导入 API（可后续）

---

## 五、架构设计

### 5.1 完整链路流程图

```
═══════════════════════════════════════════════════════════════
                    PHASE 1: 资源导入
═══════════════════════════════════════════════════════════════

  用户选择文件                  后端处理
  ┌────────────┐          ┌──────────────────────────────────┐
  │ 文件选择对话框 │         │ DhcResoucePkgImport(pkgPath)     │
  │            │         │                                  │
  │ 选择:       │  POST   │  1. 解压到 importResourceCache/   │
  │ DHC_Mini   │────────▶│  2. ImportResourceDetection()    │
  │ 安装包.7z   │         │     → 得到 ResourceMap           │
  │            │         │  3. copyDir → 合并到资源库根       │
  │            │         │  4. 清理 importResourceCache/     │
  └────────────┘         └──────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                    PHASE 2: 资源校验
═══════════════════════════════════════════════════════════════

  ImportResourceDetection(All, Local)
    对每个 type/pkg/mod 三级路径:
      磁盘文件总体积 vs pkgInfo.json 预期值
      ≥ 预期 → Pass | < 预期 → Incomplete | 无文件 → NotImported

═══════════════════════════════════════════════════════════════
                    PHASE 3: 安装（三个独立执行器）
═══════════════════════════════════════════════════════════════

  POST /api/installations { versionId: "real-mini-install-v1" }
       │
       ▼
  installSetRegistry["real-mini-install-v1"]
  │
  │  goroutine 异步顺序执行:
  │
  ├── Step 1/3: RunRealCarsInstallMini(tracker)
  │     paths: ["cars/miniPkg/miniCar"]
  │     → MultiModInstallWithTracker
  │       → validate (10%)
  │       → mod_0 (90%): SingleModInstall/FromDir
  │         → dft.json → OverrideControl → gamePath/content/cars/...
  │
  ├── Step 2/3: RunRealMapInstallMini(tracker)
  │     paths: ["tracks/miniPkg/miniMap"]
  │     → MultiModInstallWithTracker
  │       → validate → SingleModInstall (解压 .7z)
  │       → dft.json → OverrideControl → gamePath/...
  │
  └── Step 3/3: RunRealHudInstallMini(tracker)
        paths: ["dashboard/miniPkg/miniHud"]
        → MultiModInstallWithTracker
          → validate → SingleModInstall/FromDir
          → dft.json → OverrideControl → gamePath/content/...

  每个执行器通过 runInstallExecutor 桥接:
  - 自动创建 TaskTracker（回调写入任务注册表）
  - 自动标记 category 状态（completed / failed）
  - 最后一个 step 负责 finalize（写 EndTime、全局状态）
```

### 5.2 数据流时序图

```
用户                前端                     Electron主进程          Go后端
 │                   │                          │                    │
 │  选择资源包文件    │                          │                    │
 │──────────────────▶│                          │                    │
 │                   │  POST /resource-import    │                    │
 │                   │─────────────────────────▶│  fetch             │
 │                   │                          │───────────────────▶│ DhcResoucePkgImport
 │                   │                          │                    │ ├── 解压到 cache
 │                   │                          │                    │ ├── 检测 ResourceMap
 │                   │                          │  { resourceMap }   │ ├── 合并到资源库
 │                   │  { imported: true }       │◀───────────────────│ └── 清理
 │  导入成功          │◀─────────────────────────│                    │
 │◀──────────────────│                          │                    │
 │                   │                          │                    │
 │  点击 "开始安装"   │                          │                    │
 │──────────────────▶│  POST /installations      │                    │
 │                   │  {versionId:              │  fetch             │
 │                   │   "real-mini-install-v1"} │───────────────────▶│ 创建 task
 │                   │─────────────────────────▶│                    │ go { 3个执行器 }
 │                   │  { id: "install_xxx" }    │◀───────────────────│
 │                   │◀─────────────────────────│                    │
 │                   │                          │                    │
 │                   │  poll GET .../progress    │                    │ goroutine:
 │                   │─────────────────────────▶│───────────────────▶│ Step1: cars
 │  进度条:           │  { categories: [         │◀───────────────────│ Step2: map
 │  🚗 100% ✅       │    cars:100%,             │                    │ Step3: dashboard
 │  🗺️  65% ▶       │    map:65%,               │                    │
 │  📊   0% ⏳       │    dashboard:0%] }        │                    │
 │◀──────────────────│◀─────────────────────────│                    │
 │                   │                          │                    │
 │  安装完成 🎉       │  { status: "completed" }  │                    │
 │◀──────────────────│◀─────────────────────────│◀───────────────────│
```

---

## 六、实施步骤

### Phase 1: 资源准备 + 执行器 + 注册

**预计工作量**: 1-2 小时

| # | 任务 | 文件 | 详情 |
|---|------|------|------|
| 1.1 | 统一 HUD 类型命名 | 决策 | `dashboard` vs `hud` — 选一个统一到 types.go、pkgInfo.json、磁盘目录 |
| 1.2 | 创建测试资源目录 | `testPkg/cars/miniPkg/miniCar/` | 放 dft.json + 占位文件（≥1字节） |
| 1.3 | 创建测试资源目录 | `testPkg/tracks/miniPkg/miniMap/` | 放 dft.json + 占位文件 |
| 1.4 | 创建测试资源目录 | `testPkg/dashboard/miniPkg/miniHud/` | 放 dft.json + 占位文件 |
| 1.5 | 更新 pkgInfo.json | `testPkg/pkgInfo.json` | 添加三条 miniPkg 条目 |
| 1.6 | 写三个独立执行器 | `demoInstaller.go` 或新建文件 | `RunRealCarsInstallMini` / `RunRealMapInstallMini` / `RunRealHudInstallMini` |
| 1.7 | 注册安装集 | `installations.go` | `"real-mini-install-v1"` → 三个 step |

### Phase 2: 资源导入 API

**预计工作量**: 1-2 小时

| # | 任务 | 文件 | 详情 |
|---|------|------|------|
| 2.1 | 新建导入 Handler | `handler/resourceImportHandler.go` | `POST /api/resource-import` |
| 2.2 | 路由注册 | `handler/init.go` | `registerResourceImportRoutes(g)` |
| 2.3 | (可选) 打包模拟资源包 | `test/simEnv/resources/miniPkg.zip` | 把 testPkg 子集打成 zip 用于测试导入 |

### Phase 3: 前端对接

**预计工作量**: 1-2 小时

| # | 任务 | 文件 | 详情 |
|---|------|------|------|
| 3.1 | 新增安装函数 | `useInstallation.ts` | `createRealMiniInstall()` |
| 3.2 | 安装入口 UI | OneClickInstaller 相关 | 加 Mini 安装按钮 |
| 3.3 | 资源导入 UI | ResourceImportManager 改造 | 文件选择 → 调导入 API |

### Phase 4: 测试验证

| # | 任务 | 详情 |
|---|------|------|
| 4.1 | 重置 simEnv | `./reset_sim_env.sh` |
| 4.2 | 后端单测 | 测试三个执行器 |
| 4.3 | 前后端联调 | `./start_all.sh` → UI 全链路 |
| 4.4 | 验证文件落盘 | 检查 `content/{cars,tracks}/` |

---

## 七、已知风险与注意事项

### 7.1 HUD/Dashboard 类型命名不一致（必须在 Phase 1.1 解决）

| 位置 | 当前值 |
|------|--------|
| `types.go` 枚举 | `Dashboard ResourceType = "dashboard"` |
| `pkgInfo.json` | `"hud": { ... }` |
| 磁盘目录名 | `dashboard/` |
| `ImportResourceDetection` 的 `allResourceTypes` | 包含 `Dashboard` |

**矛盾**: pkgInfo.json 中用 `"hud"` 但代码/磁盘用 `"dashboard"`。

**推荐方案**: 把 pkgInfo.json 中的 `"hud"` 改为 `"dashboard"`，与代码和磁盘一致。这样零代码改动。

### 7.2 SingleModInstall 的错误静默
- 内部出错只 log 不返回 `error`
- 建议后续让 `SingleModInstall` 返回 `error`

### 7.3 dft.json 的 overwriteStartingDir 差异
- 车包常用: `"content/cars"` — 模组文件直接写入 `gamePath/content/cars/`
- SRP 地图: `"."` — 模组文件写入 `gamePath/`（因为内部已有 `content/tracks/` 结构）
- HUD: 视具体 HUD 类型而定
- **关键**: 每个 dft.json 必须正确反映模组内部结构与安装目标

### 7.4 四级路径不支持
- 当前系统**固定三级路径**（type/pkg/mod）
- 五处硬编码约束（详见第二章）
- Mini 版保持三级，后续有需求再重构

---

## 八、面向接管 AI 的快速上手指南

### 8.1 环境准备

```bash
./reset_sim_env.sh    # 重置模拟环境
./start_all.sh        # 启动全栈（DHC_DEV=true）
```

### 8.2 最小改动路径

1. 决定 HUD 类型名统一为 `dashboard`（改 pkgInfo.json）
2. 在 `testPkg/` 下创建 `cars/miniPkg/miniCar/`、`tracks/miniPkg/miniMap/`、`dashboard/miniPkg/miniHud/`，每个放 `dft.json` + 占位文件
3. 更新 `pkgInfo.json`
4. `demoInstaller.go` 末尾加三个执行器函数（每个 ~5 行）
5. `installations.go` 注册表加一条
6. `useInstallation.ts` 加一个函数
7. UI 加一个按钮

**总代码量: ~50 行 Go + ~20 行 TypeScript**

### 8.3 验证命令

```bash
cd DHC_Backend
DHC_DEV=true go test -v -run TestXxx ./models/service/modInstall/

curl -X POST http://127.0.0.1:19810/api/installations \
  -H "Content-Type: application/json" \
  -d '{"versionId": "real-mini-install-v1"}'

curl http://127.0.0.1:19810/api/installations/{installId}/progress
```

### 8.4 关键理解点

- **三级路径 `{type}/{pkg}/{mod}`** 是核心寻址方式，不支持四级
- **`testPkg`** = 资源库根，不参与路径
- **`pkgInfo.json`** 的 `categorys.{type}.{pkg}.{mod} = 预期字节数`
- **`dft.json`** 在每个 mod 目录下，决定安装覆盖目标
- **注册表模式**: 新增安装集 = 注册 steps + 写执行器，零改动核心调度
- **`Dashboard`** 是 HUD 的 ResourceType 值，磁盘目录名也用 `dashboard/`

---

## 附录 A: 现有安装集注册表

```go
installSetRegistry = {
    "demo-resource-verify-v1":  资源包校验
    "demo-install-v1":          DEMO 安装: core + weather + map + cars
    "real-install-v1":          真实地图安装: map (SRP 0.9.3)
    // 即将新增 ↓
    "real-mini-install-v1":     Mini 真实安装: cars + map + dashboard（三个独立执行器）
}
```

## 附录 B: 相关文档索引

| 文档 | 路径 |
|------|------|
| AI 导览 | `AI_GUIDE.md` |
| 架构全分析 | `doc/架构分析/architecture-full-analysis.md` |
| 多模组安装接口设计 | `DHC_Backend/models/service/modInstall/MULTI_MOD_INSTALL_DESIGN.md` |
| 覆盖控制设计 | `DHC_Backend/models/service/decompression/OVERRIDE_CONTROL.md` |
| Phase 4 报告 | `doc/架构分析/phase4-report.md` |
| 本计划文档 | `doc/MINI_MODSET_INSTALL_PLAN.md` |
