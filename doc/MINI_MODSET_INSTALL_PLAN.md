# 真实模组集安装 Mini 版 —— 实施计划与架构设计

> **文档版本**: v1.1  
> **创建日期**: 2026-04-23  
> **目标**: 实现**完整的用户链路** —— 从"用户导入资源包"到"解压缩并安装车包+地图包+HUD"的全流程（Mini 版模组集）  
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

### 1.2 核心架构（已实现）

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
| 内部函数 `RunMinimalModsetInstall` | cars + tracks + shaders（测试用迷你包） | 真实安装，但**未注册到注册表**且只用于测试小包 |

### 1.4 ⚠️ 资源库的真实目录结构（重要！）

当前 `testPkg` 模拟的就是**一个资源包解压后的根目录**。真实资源库结构为：

```
资源库根/                        ← 开发: test/simEnv/resources/testPkg/
│                                  生产: resources/
├── pkgInfo.json                 ← 声明所有资源的 type/pkg/mod + 预期体积
│
├── cars/                        ← ResourceType 一级目录
│   ├── SHMC/                    ← pkg（车包名）
│   │   ├── r34/                 ← mod（具体车辆）
│   │   ├── r32/
│   │   └── rx7/
│   ├── DREAM/
│   │   └── AE86/
│   └── minDemo/
│       └── carMini/
│           ├── dft.json         ← 覆盖规则配置
│           └── (模组文件或压缩包)
│
├── tracks/
│   └── demoPkg/
│       └── SRP_093/
│           ├── dft.json
│           ├── SRP_093.7z       ← 压缩包（可选，也可以是已解压目录）
│           └── content/         ← 已解压的模组文件
│
├── shaders/
│   └── minDemo/
│       └── shadowMini/
│
└── hud/                         ← pkgInfo.json 中有定义，但磁盘上尚不存在
    └── demoPkg/
        └── hudMini/
```

**关键理解**: 路径格式始终是 `{type}/{pkg}/{mod}`，其中 `pkg` 的含义是**模组子集/车包名**（如"SHMC车包"、"漂移车包"），不是资源大包名。`testPkg` 是**整个资源库的根名**，不参与三级路径。

### 1.5 用户完整链路（当前缺失环节标记）

```
用户拿到资源压缩包（如"DHC完整安装包.7z"）
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

### 1.6 关键文件清单（AI 必读）

| 文件 | 作用 | 重要度 |
|------|------|--------|
| `DHC_Backend/handler/installations.go` | 安装集注册表 + HTTP 路由 | ⭐⭐⭐ |
| `DHC_Backend/handler/InstallExecutorBridge.go` | TaskTracker ↔ 任务状态桥接 | ⭐⭐⭐ |
| `DHC_Backend/handler/init.go` | 全局路由注册入口 | ⭐⭐ |
| `DHC_Backend/models/service/modInstall/modInstall.go` | 核心安装逻辑（Import/Single/Multi/WithTracker） | ⭐⭐⭐ |
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
| `DHC_Frontend/src/renderer/src/CarPackInstaller.tsx` | 车包安装页（当前纯 Mock） | ⭐ |

---

## 二、目标：Mini 版模组集 —— 完整用户链路

### 2.1 Mini 版定义

一次完整的用户操作链路：**导入资源包 → 校验 → 安装（车包 + 地图 + HUD）**

| 步骤 | 用户视角 | 技术实现 |
|------|---------|---------|
| 1. 导入 | 用户选择资源压缩包文件 | `DhcResoucePkgImport` → 解压 → 合并到资源库 |
| 2. 校验 | 自动检测资源完整性 | `ImportResourceDetection` 扫描磁盘 vs `pkgInfo.json` |
| 3. 安装 | 三个类别顺序安装 | 三个独立执行器，各自调用 `MultiModInstallWithTracker` |

三个安装类别（独立执行器）：

| 类别 | 安装内容示例 | 安装目标（AC 目录） |
|------|------------|-------------------|
| **车包 (cars)** | SHMC/r34 | `content/cars/{车辆名}/` |
| **地图包 (tracks)** | demoPkg/SRP_093 | 由 dft.json 决定（如 `.` 表示游戏根） |
| **HUD (hud)** | demoPkg/hudMini | 由 dft.json 的 `overwriteStartingDir` 决定 |

### 2.2 资源包结构（用户拿到的压缩包解压后的样子）

用户拿到的大资源包（如"DHC_Mini安装包.7z"）解压后，内部结构与资源库目录一致：

```
DHC_Mini安装包.7z 解压后:
├── pkgInfo.json
├── cars/
│   └── SHMC/
│       └── r34/
│           ├── dft.json
│           └── (车辆模组文件)
├── tracks/
│   └── demoPkg/
│       └── SRP_093/
│           ├── dft.json
│           ├── content/tracks/shuto_revival_project_beta/...
│           └── (或 SRP_093.7z)
└── hud/
    └── demoPkg/
        └── hudMini/
            ├── dft.json
            └── (HUD 模组文件)
```

`DhcResoucePkgImport` 的工作就是把这个包解压到 `importResourceCache/`，检测得到 `ResourceMap`，然后 `copyDir` 合并到资源库根目录。

### 2.3 开发模拟环境中的对应关系

| 真实环境 | 开发环境 (simEnv) |
|---------|-----------------|
| 用户压缩包解压后 | `test/simEnv/resources/testPkg/` 目录本身 |
| 资源库根 `resources/` | `test/simEnv/resources/testPkg/` |
| 游戏目录 | `test/simEnv/acRoot/AC_SKELETON_HASDLC/Assetto Corsa/` |

开发时 `testPkg/` **就是资源库**，已经跳过了"导入"步骤。但 Mini 版需要也测试导入链路，所以：
- 可以准备一个**模拟资源压缩包**放在 `test/simEnv/resources/` 下（如 `miniPkg.zip`）
- 调用 `DhcResoucePkgImport("路径/miniPkg.zip")` 来走完整导入流程

---

## 三、差距分析：需要做什么

### 3.1 后端

#### ✅ 已有（可直接复用）
- [x] `DhcResoucePkgImport` — 资源包导入（解压 → 检测 → 合并到资源库）
- [x] `MultiModInstallWithTracker` — 带 tracker 的批量安装
- [x] `SingleModInstall` / `SingleModInstallFromDir` — 单模组安装
- [x] `OverrideControl` — 文件覆盖策略引擎
- [x] `ImportResourceDetection` — 资源完整性校验
- [x] `installSetRegistry` — 安装集注册表
- [x] `runInstallExecutor` — 通用执行桥接
- [x] `TaskTracker` — 进度追踪系统
- [x] `RunRealMapInstall` — 真实地图安装执行器（参考模板）

#### 🆕 需要新增

**1. 资源导入 HTTP API（handler 层）**

当前 `DhcResoucePkgImport` 没有暴露为 HTTP 接口。需要新增：

```
POST /api/resource-import
Body: { "pkgPath": "C:\\Users\\xxx\\Desktop\\DHC_Mini安装包.7z" }
Response: { "resourceMap": {...}, "status": "success" }
```

或者，将导入也做成**异步任务 + 进度轮询**模式（更好，因为大包解压耗时很长）：
- 在 `installSetRegistry` 注册一个 `"resource-import-v1"` 安装集
- 前端发 `POST /api/installations { versionId: "resource-import-v1", pkgPath: "..." }`
- 执行器内调用 `DhcResoucePkgImport` 并通过 tracker 报告进度

**2. ResourceType 枚举扩展 (`types.go`)**

新增 `Hud ResourceType = "hud"`，解决与 `pkgInfo.json` 的命名不一致。

**3. `ImportResourceDetection` 的 All 检测列表更新 (`resourceDetection.go`)**

在 `allResourceTypes` 切片中加入 `Hud`。

**4. 三个独立执行器**（每个 5-10 行）

```go
// RunRealCarsInstall 真实车包安装执行器
func RunRealCarsInstall(tracker *TaskTracker) error {
    paths := []string{
        "cars/SHMC/r34",     // 可后续改为从配置/参数读取
    }
    return MultiModInstallWithTracker(paths, string(types.DftPathFromDir), tracker)
}

// RunRealMapInstallMini Mini 版地图安装
func RunRealMapInstallMini(tracker *TaskTracker) error {
    paths := []string{
        "tracks/demoPkg/SRP_093",
    }
    return MultiModInstallWithTracker(paths, string(types.DftPathFromDir), tracker)
}

// RunRealHudInstall 真实 HUD 安装
func RunRealHudInstall(tracker *TaskTracker) error {
    paths := []string{
        "hud/demoPkg/hudMini",
    }
    return MultiModInstallWithTracker(paths, string(types.DftPathFromDir), tracker)
}
```

**5. 注册到安装集注册表**

```go
"real-mini-install-v1": {
    DeferCleanup: false,
    Steps: []installStep{
        {CategoryID: "cars", CategoryName: "车辆包", ExecutorFn: modinstall.RunRealCarsInstall},
        {CategoryID: "map",  CategoryName: "地图包", ExecutorFn: modinstall.RunRealMapInstallMini},
        {CategoryID: "hud",  CategoryName: "HUD 仪表盘", ExecutorFn: modinstall.RunRealHudInstall},
    },
},
```

**6. 测试资源准备（simEnv）**

在 `test/simEnv/resources/testPkg/hud/demoPkg/hudMini/` 下创建：
- `dft.json` — HUD 覆盖规则
- 一些测试文件（哪怕是空的 `.txt` 占位，体积 ≥ `pkgInfo.json` 中声明的 `1` 字节）

#### 🔧 需要修改

**7. `DhcResoucePkgImport` 增加 TaskTracker 支持（可选但推荐）**

当前该函数是同步的，大资源包解压会阻塞很久。改为支持 tracker：
```go
func DhcResoucePkgImportWithTracker(pkgPath string, tracker *TaskTracker) (ResourceMap, error)
```

### 3.2 前端

#### 🆕 需要新增
1. **资源导入 UI** — 文件选择对话框 + 调用导入 API + 进度展示
2. **`createRealMiniInstall()`** — `useInstallation.ts` 中新增方法
3. **安装入口** — 在安装向导中加"Mini 真实安装"入口

#### 🔧 需要修改
1. **`CarPackInstaller.tsx`** — 从纯 Mock 改为调用真实 API（或废弃，合并到 OneClickInstaller 流程中）

---

## 四、架构设计

### 4.1 完整链路流程图

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
  └────────────┘         │                                  │
                         │  资源库最终状态:                    │
                         │  resources/                      │
                         │  ├── pkgInfo.json                │
                         │  ├── cars/SHMC/r34/              │
                         │  ├── tracks/demoPkg/SRP_093/     │
                         │  └── hud/demoPkg/hudMini/        │
                         └──────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                    PHASE 2: 资源校验
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ImportResourceDetection(All, Local)                       │
  │                                                          │
  │  对每个 type/pkg/mod:                                     │
  │    扫描磁盘文件总体积 vs pkgInfo.json 预期值               │
  │    ≥ 预期 → Pass | < 预期 → Incomplete | 无文件 → NotImported │
  │                                                          │
  │  结果: ResourceMap                                        │
  │  ├── cars:    SHMC/r34=Pass, SHMC/r32=NotImported...     │
  │  ├── tracks:  demoPkg/SRP_093=Pass...                    │
  │  └── hud:     demoPkg/hudMini=Pass...                    │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                    PHASE 3: 安装（三个独立执行器）
═══════════════════════════════════════════════════════════════

  POST /api/installations { versionId: "real-mini-install-v1" }
       │
       ▼
  ┌─────────────────────────────────────────────────────────┐
  │ installSetRegistry["real-mini-install-v1"]               │
  │                                                         │
  │  go func() {    // 异步 goroutine                        │
  │                                                         │
  │    Step 1/3: ─── RunRealCarsInstall(tracker) ───        │
  │    │  paths: ["cars/SHMC/r34"]                          │
  │    │  → MultiModInstallWithTracker                      │
  │    │    → validate (10%): 资源完整性校验                   │
  │    │    → mod_0 (90%): SingleModInstallFromDir           │
  │    │      → 读 dft.json → OverrideControl               │
  │    │      → 写入 gamePath/content/cars/...              │
  │    │                                                     │
  │    Step 2/3: ─── RunRealMapInstallMini(tracker) ───     │
  │    │  paths: ["tracks/demoPkg/SRP_093"]                 │
  │    │  → MultiModInstallWithTracker                      │
  │    │    → validate → SingleModInstall (解压 .7z)         │
  │    │    → 读 dft.json (overwriteStartingDir: ".")       │
  │    │    → OverrideControl → 写入 gamePath/...           │
  │    │                                                     │
  │    Step 3/3: ─── RunRealHudInstall(tracker) ───         │
  │    │  paths: ["hud/demoPkg/hudMini"]                    │
  │    │  → MultiModInstallWithTracker                      │
  │    │    → validate → SingleModInstallFromDir             │
  │    │    → 读 dft.json → OverrideControl                 │
  │    │    → 写入 gamePath/content/...                     │
  │    │                                                     │
  │  }                                                       │
  └─────────────────────────────────────────────────────────┘
       │
       ▼ 前端轮询
  ┌─────────────────────────────────────────────────────────┐
  │  GET /api/installations/:id/progress                     │
  │                                                         │
  │  {                                                       │
  │    "status": "installing",                               │
  │    "totalProgress": 55.3,                                │
  │    "categories": [                                       │
  │      { "categoryId": "cars", "status": "completed",      │
  │        "progress": 100 },                                │
  │      { "categoryId": "map", "status": "active",          │
  │        "progress": 65, "currentItem": "安装 SRP_093" },  │
  │      { "categoryId": "hud", "status": "waiting",         │
  │        "progress": 0 }                                   │
  │    ]                                                     │
  │  }                                                       │
  └─────────────────────────────────────────────────────────┘
```

### 4.2 安装执行器架构（独立执行器模式）

```
installSetRegistry
│
├── "real-mini-install-v1"
│   │
│   ├── Step 1: {CategoryID: "cars",  ExecutorFn: RunRealCarsInstall}
│   │              │
│   │              └──▶ MultiModInstallWithTracker(["cars/SHMC/r34"], ...)
│   │                      │
│   │                      ├── validate 阶段 (10%)
│   │                      └── mod_0 阶段 (90%) → SingleModInstallFromDir
│   │
│   ├── Step 2: {CategoryID: "map",   ExecutorFn: RunRealMapInstallMini}
│   │              │
│   │              └──▶ MultiModInstallWithTracker(["tracks/demoPkg/SRP_093"], ...)
│   │                      │
│   │                      ├── validate 阶段 (10%)
│   │                      └── mod_0 阶段 (90%) → SingleModInstall (解压)
│   │
│   └── Step 3: {CategoryID: "hud",   ExecutorFn: RunRealHudInstall}
│                  │
│                  └──▶ MultiModInstallWithTracker(["hud/demoPkg/hudMini"], ...)
│                          │
│                          ├── validate 阶段 (10%)
│                          └── mod_0 阶段 (90%) → SingleModInstallFromDir
│
│  每个执行器通过 runInstallExecutor 桥接:
│  - 自动创建 TaskTracker（回调写入任务注册表）
│  - 自动标记 category 状态（completed / failed）
│  - 最后一个 step 负责 finalize（写 EndTime、全局状态）
```

### 4.3 数据流时序图

```
用户                前端                     Electron主进程          Go后端
 │                   │                          │                    │
 │  选择资源包文件    │                          │                    │
 │──────────────────▶│                          │                    │
 │                   │  POST /resource-import    │                    │
 │                   │─────────────────────────▶│  fetch             │
 │                   │                          │───────────────────▶│
 │                   │                          │                    │ DhcResoucePkgImport
 │                   │                          │                    │ ├── 解压到 cache
 │                   │                          │                    │ ├── 检测 ResourceMap
 │                   │                          │                    │ ├── 合并到资源库
 │                   │                          │  { resourceMap }   │ └── 清理
 │                   │  { imported: true }       │◀───────────────────│
 │                   │◀─────────────────────────│                    │
 │  显示导入成功      │                          │                    │
 │◀──────────────────│                          │                    │
 │                   │                          │                    │
 │  点击 "开始安装"   │                          │                    │
 │──────────────────▶│                          │                    │
 │                   │  POST /installations      │                    │
 │                   │  {versionId:              │                    │
 │                   │   "real-mini-install-v1"} │  fetch             │
 │                   │─────────────────────────▶│───────────────────▶│
 │                   │                          │                    │ 创建 task
 │                   │                          │                    │ go pipeline {
 │                   │  { id: "install_xxx" }    │                    │   RunRealCarsInstall
 │                   │◀─────────────────────────│◀───────────────────│   RunRealMapInstallMini
 │                   │                          │                    │   RunRealHudInstall
 │                   │  poll GET .../progress    │                    │ }
 │                   │─────────────────────────▶│───────────────────▶│
 │  进度条更新        │  { totalProgress: 33% }  │                    │
 │◀──────────────────│◀─────────────────────────│◀───────────────────│
 │                   │                          │                    │
 │                   │  poll (100ms间隔)         │                    │
 │                   │  ... 多次轮询 ...          │                    │
 │                   │                          │                    │
 │  安装完成 🎉       │  { status: "completed" }  │                    │
 │◀──────────────────│◀─────────────────────────│◀───────────────────│
```

### 4.4 simEnv 开发环境模拟方案

为了在开发中模拟完整的"导入 → 安装"链路：

```
test/simEnv/resources/
│
├── testPkg/                     ← 当前资源库（已有）
│   ├── pkgInfo.json
│   ├── cars/SHMC/...
│   ├── tracks/demoPkg/SRP_093/...
│   └── ...
│
├── miniPkg.zip (或 .7z)          ← 🆕 模拟用户资源包
│   内容: 打包 testPkg 中需要的子集
│   解压后结构 = testPkg 子集:
│   ├── pkgInfo.json
│   ├── cars/SHMC/r34/
│   ├── tracks/demoPkg/SRP_093/
│   └── hud/demoPkg/hudMini/
│
└── importResourceCache/          ← 导入时的临时目录（自动创建/删除）
```

测试流程：
1. `DhcResoucePkgImport("test/simEnv/resources/miniPkg.zip")` — 模拟用户导入
2. 解压到 `testPkg/importResourceCache/`
3. 检测 → 合并到 `testPkg/`
4. 然后跑安装流程

**或者**，开发时可以跳过导入步骤（资源已经在 `testPkg/` 里了），直接测安装。

---

## 五、实施步骤

### Phase 1: 后端 — HUD 支持 + 三个执行器 + 注册

**预计工作量**: 1-2 小时

| # | 任务 | 文件 | 详情 |
|---|------|------|------|
| 1.1 | 新增 `Hud` ResourceType | `types.go` | `Hud ResourceType = "hud"` |
| 1.2 | 更新 All 检测列表 | `resourceDetection.go` | `allResourceTypes` 加入 `Hud` |
| 1.3 | 新增三个独立执行器 | `demoInstaller.go` 或新建 `realInstaller.go` | `RunRealCarsInstall`、`RunRealMapInstallMini`、`RunRealHudInstall` |
| 1.4 | 注册安装集 | `installations.go` | `"real-mini-install-v1"` → 三个 step |
| 1.5 | 准备 HUD 测试资源 | `test/simEnv/resources/testPkg/hud/demoPkg/hudMini/` | 创建 `dft.json` + 占位文件 |

### Phase 2: 后端 — 资源导入 API

**预计工作量**: 1-2 小时

| # | 任务 | 文件 | 详情 |
|---|------|------|------|
| 2.1 | 新建资源导入 Handler | 新建 `handler/resourceImportHandler.go` | 暴露 `POST /api/resource-import` |
| 2.2 | 路由注册 | `handler/init.go` | 调用 `registerResourceImportRoutes(g)` |
| 2.3 | (可选) 带 tracker 的导入 | `modInstall.go` | 增加 `DhcResoucePkgImportWithTracker` 支持进度 |
| 2.4 | (可选) 注册为安装集 | `installations.go` | `"resource-import-v1"` 可走任务+轮询模式 |
| 2.5 | 准备模拟资源包 | `test/simEnv/resources/miniPkg.zip` | 打包 testPkg 子集用于测试导入 |

### Phase 3: 前端对接

**预计工作量**: 1-2 小时

| # | 任务 | 文件 | 详情 |
|---|------|------|------|
| 3.1 | 资源导入 UI | 新建或改造 `ResourceImportManager.tsx` | 文件选择 → 调导入 API → 显示结果 |
| 3.2 | 新增安装函数 | `useInstallation.ts` | `createRealMiniInstall()` 发 `"real-mini-install-v1"` |
| 3.3 | 安装入口 UI | `OneClickInstaller` 相关组件 | 加"Mini 真实安装"按钮 |
| 3.4 | 进度展示 | 复用 `InstallProgressPage.tsx` | 已支持多 category，无需改动 |

### Phase 4: 测试验证

**预计工作量**: 30 分钟 - 1 小时

| # | 任务 | 详情 |
|---|------|------|
| 4.1 | 重置 simEnv | `./reset_sim_env.sh` |
| 4.2 | 后端单测 | 测试三个执行器 + 导入函数 |
| 4.3 | 前后端联调 | `./start_all.sh` → UI 操作全链路 |
| 4.4 | 验证文件落盘 | 检查游戏目录下 `content/{cars,tracks}/` |
| 4.5 | 验证导入链路 | 用 miniPkg.zip 测试从导入到安装 |

---

## 六、已知风险与注意事项

### 6.1 HUD 类型命名不一致
- `types.go` 有 `Dashboard = "dashboard"`，`pkgInfo.json` 使用 `"hud"`
- **方案**: 新增 `Hud = "hud"`，保留 `Dashboard` 向后兼容
- `ImportResourceDetection` 的 `allResourceTypes` 中使用 `Hud`

### 6.2 SingleModInstall 的错误静默
- 内部出错只 log 不返回 `error`
- `MultiModInstallWithTracker` 中即使安装失败也 `CompletePhase`
- **影响**: 个别模组失败时前端看不到错误
- **建议**: 后续让 `SingleModInstall` 返回 `error`

### 6.3 dft.json 的 overwriteStartingDir 差异
- 车包: `"content/cars"` — 模组文件直接写入 `gamePath/content/cars/`
- SRP 地图: `"."` — 模组文件写入 `gamePath/`（因为模组内部已有 `content/tracks/` 结构）
- HUD: 视具体 HUD 而定，需要正确配置
- **关键**: 每个模组的 `dft.json` 必须正确反映其内部文件结构与安装目标

### 6.4 资源导入 API 缺失
- `DhcResoucePkgImport` 已实现但未暴露为 HTTP API
- 大包解压耗时长（SRP_093 有 ~1.2GB），同步 API 会超时
- **建议**: 做成异步任务+轮询，或至少设置足够长的 HTTP 超时

### 6.5 开发模式与生产模式路径
- 开发: `test/simEnv/resources/testPkg/{type}/{pkg}/{mod}/`
- 生产: `resources/{type}/{pkg}/{mod}/`
- `MultiModInstallWithTracker` 内部已根据 `IsDevModeGet()` 自动切换

---

## 七、面向接管 AI 的快速上手指南

### 7.1 环境准备

```bash
# 1. 重置模拟环境
./reset_sim_env.sh

# 2. 启动全栈
./start_all.sh

# 3. 后端日志在 logs/
# 4. 开发模式: DHC_DEV=true
```

### 7.2 最小改动路径（只跑通安装，跳过导入）

如果只想先验证安装链路（资源已在 testPkg 中）：

1. `types.go` 加一行: `Hud ResourceType = "hud"`
2. `resourceDetection.go` 加一项: `allResourceTypes` 中加 `Hud`
3. 在 `demoInstaller.go` 末尾加三个执行器函数（每个 ~8 行）
4. `installations.go` 的 `installSetRegistry` 加一条 `"real-mini-install-v1"`
5. `test/simEnv/resources/testPkg/hud/demoPkg/hudMini/` 下创建 `dft.json` + 占位文件
6. `useInstallation.ts` 加 `createRealMiniInstall()`
7. UI 加一个触发按钮

**总代码量: ~50 行 Go + ~20 行 TypeScript**

### 7.3 验证命令

```bash
# 后端直接测试
cd DHC_Backend
DHC_DEV=true go test -v -run TestMinimalModsetInstall ./models/service/modInstall/

# 通过 curl 调用
curl -X POST http://127.0.0.1:19810/api/installations \
  -H "Content-Type: application/json" \
  -d '{"versionId": "real-mini-install-v1"}'

# 轮询进度
curl http://127.0.0.1:19810/api/installations/{installId}/progress
```

### 7.4 关键理解点

- **三级路径 `{type}/{pkg}/{mod}`** 是整个系统的核心寻址方式
- **`testPkg`** = 模拟的资源库根，不是路径的一部分
- **`pkgInfo.json`** 中 `categorys.{type}.{pkg}.{mod} = 预期字节数`
- **`dft.json`** 在每个 mod 目录下，决定覆盖规则和安装目标
- **注册表模式**: 新增安装集 = 注册 steps + 写执行器函数，零改动核心调度

---

## 八、未来扩展（Mini 版之后）

| 方向 | 说明 |
|------|------|
| **完整版模组集** | 增加 weather、CM、shaders 等类别 |
| **动态模组选择** | 前端展示 ResourceMap 树，用户勾选安装项 |
| **在线下载** | 资源包从 CDN/网盘下载，而非用户本地导入 |
| **增量更新** | 对比已安装版本，只更新差异 |
| **安装回滚** | 利用 dft.json 的 backup 机制 |
| **错误恢复** | SingleModInstall 返回 error，支持跳过/重试 |

---

## 附录 A: 现有安装集注册表

```go
installSetRegistry = {
    "demo-resource-verify-v1":  资源包校验（真实扫描磁盘）
    "demo-install-v1":          DEMO 安装: core + weather + map + cars
    "real-install-v1":          真实地图安装: map (SRP 0.9.3)
    // 即将新增 ↓
    "real-mini-install-v1":     Mini 真实安装: cars + map + hud（三个独立执行器）
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
| 本计划文档 | `doc/MINI_MODSET_INSTALL_PLAN.md` ← 你正在看 |

## 附录 C: pkgInfo.json 当前结构

```json
{
    "categorys": {
        "cars":    { "SHMC": {"r34":8, "r32":4, "rx7":8}, "DDM": {"SUPRA":1024}, ... },
        "tracks":  { "demoPkg": {"SRP_093": 1208110716}, "main": {"SRP_093": 200000}, ... },
        "shaders": { "minDemo": {"shadowMini": 1} },
        "hud":     { "demoPkg": {"hudMini": 1} }
    }
}
```

路径对应关系: `categorys.{type}.{pkg}.{mod}` → 磁盘 `资源库/{type}/{pkg}/{mod}/`
