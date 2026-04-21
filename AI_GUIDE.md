# DHC AC Installer - AI 导览与导航

本文档为 AI 助手提供项目设计思想和核心功能的深度概览，旨在显著减少每次对话时的 Token 消耗。

## 🎯 核心目标
这是一个专门为 **DHC 社区** 定制的 **Assetto Corsa (AC)** 一键模组安装器。它自动化了 Content Manager (CM)、地图、赛车和天气模组的复杂安装流程，为玩家提供“即装即玩”的体验。

## 🏗️ 架构哲学
1.  **后端驱动逻辑 (Go):** 所有重负载操作（文件 I/O、7-zip 解压、路径探测、模组完整性校验）均由 Go 后端处理，以确保性能和安全性。
2.  **精致前端 (Electron + React):** UI 使用 **Semi Design**，专注于引导式的任务流（预检 -> 安装 -> 完成）。
3.  **共享契约 (OpenAPI):** 前后端通信严格定义在 `DHC_AC_Installer.openapi.json` 中。
4.  **异步任务引擎:** 安装过程是长耗时的 Go 协程。前端发起任务并轮询进度 API。
5.  **仿真环境 (`simEnv`):** 强大的开发模式，使用虚拟游戏目录结构 (`test/simEnv`) 进行全流程测试，无需真实的 AC 游戏环境。

## 📂 项目关键地标

### 后端 (`DHC_Backend/`)
-   `handler/installations.go`: **调度中心**。管理任务注册表、进度计算和安装生命周期。
-   `modInstall/`: **核心引擎**。
    -   `demoInstaller.go`: 包含具体模组类别（核心、天气、地图、车辆）的安装逻辑。
    -   `modInstall.go`: 底层模组提取与放置逻辑。
    -   `resourceDetection.go`: 识别文件包含的模组类型。
-   `decompression/`: 处理 7-zip 解压及文件夹覆盖（Override）规则。
-   `Database/`: 本地 JSON 存储，用于持久化 `appState`（用户设置）和 `InstallTasks`。

### 前端 (`DHC_Frontend/`)
-   `src/renderer/src/pages/OneClickInstaller/`: **主业务逻辑**。处理安装向导的流程。
-   `src/renderer/src/App.tsx`: **伪路由中心**。使用 `activeKey` 切换页面（计划迁移至 React Router）。
-   `src/shared/index.ts`: **IPC 桥接**。将 API 请求通过 Electron 主进程代理至 Go 后端。

## 🔑 AI 核心概念
-   **安装任务 (Install Task):** 具有唯一 ID 的后端对象，追踪安装全生命周期。包含多个 `categories`（如 "core", "map"），每个类别有独立的进度。
-   **任务追踪器 (TaskTracker):** 后端广泛使用的结构体，用于实时向任务注册表回传进度。
-   **资源缓存:** 模组通常先解压到 `resources/importResourceCache` 进行识别，然后再移动到游戏最终目录。
-   **开发模式:** 通过环境变量 `DHC_DEV="true"` 触发。后端会切换到 `simEnv` 路径而非真实的 Steam 路径。

## ⚠️ 开发约定
-   **命名规范:** 后端几乎所有包、文件和函数均使用 **大驼峰命名法 (BigCamelCase)**。
-   **错误处理:** 后端错误应通过 `servicelog` 记录，并透传至任务进度 API 供前端展示。
-   **通信机制:** 前端**严禁**直接通过 HTTP 调用后端；必须使用 `window.api.requestApi` 走 Electron IPC 通道。

## 🛠️ 开发重点
1.  **实装真实模组安装 (当前核心):** 完成从 Demo 模拟逻辑到真实模组安装逻辑的切换，确保模组文件能够准确解压、识别并覆盖到正确的 AC 游戏目录。
2.  **后端架构分层:** 持续推进从“万能 Handler”向 `Handler -> Service -> Executor` 模式的演进。
3.  **模组集合定义优化:** 将 `VersionID` 更名为 `EditionID` 或 `SetID`，消除其作为“软件版本”的歧义。
4.  **前端导航:** 计划使用 React Router 替换 `App.tsx` 中的手动 switch-case。
