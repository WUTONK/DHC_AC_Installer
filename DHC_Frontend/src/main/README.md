# 主进程代码理解指南

## 这个文件是做什么的？

这是 Electron 应用的**主进程**（Main Process），相当于应用的"大脑"。

## Electron 架构简单理解

Electron 应用有两个进程：
1. **主进程（Main Process）**：这个文件，负责创建窗口、管理应用生命周期
2. **渲染进程（Renderer Process）**：React 代码运行的地方，负责显示 UI

## 代码流程解析

### 1. 应用启动流程

```
app.whenReady()
  ↓
设置应用名称和图标
  ↓
创建菜单栏
  ↓
启动后端服务（startBackend）
  ↓
注册 IPC 处理器（ipcMain.handle）
  ↓
创建窗口（createWindow）
```

### 2. 关键函数说明

#### `startBackend()` - 启动后端服务
- **作用**：启动一个独立的进程（DHC_Backend）
- **为什么需要**：后端服务提供 API，前端通过 HTTP 请求调用
- **工作原理**：
  1. 根据平台选择可执行文件（Windows: main.exe, macOS/Linux: main）
  2. 使用 `spawn` 启动进程
  3. 监听进程退出事件

#### `stopBackend()` - 停止后端服务
- **作用**：应用退出时，优雅地关闭后端进程
- **为什么需要**：避免僵尸进程

#### `createWindow()` - 创建应用窗口
- **作用**：创建一个浏览器窗口来显示你的 React 应用
- **关键配置**：
  - `preload`: 预加载脚本路径（preload/index.js）
  - `webPreferences`: 安全设置（这里关闭了一些安全特性，方便开发）

#### `createMenu()` - 创建菜单栏
- **作用**：创建应用顶部菜单（File, Edit, View 等）
- **为什么需要**：提供标准的桌面应用体验

### 3. IPC 通信（进程间通信）

IPC 是 Electron 中主进程和渲染进程通信的方式。

**主进程这边（这个文件）**：
```typescript
ipcMain.handle('api-request', async (_, url) => {
  // 当渲染进程调用 window.api.requestApi(url) 时
  // 这个函数会被执行
  // 它发送 HTTP 请求到后端，然后返回结果
})
```

**渲染进程那边（React 代码）**：
```typescript
window.api.requestApi('http://127.0.0.1:19810/api/xxx')
// 这会触发上面的 ipcMain.handle
```

### 4. 窗口生命周期

```
createWindow()
  ↓
窗口创建但还没显示（show: false）
  ↓
ready-to-show 事件触发
  ↓
显示窗口（mainWindow.show()）
  ↓
did-finish-load 事件触发（页面加载完成）
  ↓
设置缩放比例（macOS 特殊处理）
```

## 为什么这样设计？

1. **分离关注点**：主进程管窗口，渲染进程管 UI
2. **安全性**：渲染进程不能直接访问 Node.js API
3. **性能**：多进程架构，一个进程崩溃不影响其他进程

## 学习建议

1. **先理解整体流程**：应用如何启动 → 窗口如何创建 → 前后端如何通信
2. **逐个函数理解**：每个函数做什么，为什么需要它
3. **动手实验**：修改代码，看效果，加深理解
4. **阅读 Electron 官方文档**：了解 BrowserWindow、ipcMain 等 API

## 常见问题

**Q: 为什么需要 preload 脚本？**
A: 因为安全原因，渲染进程不能直接访问 Node.js。preload 脚本在安全边界内运行，可以暴露安全的 API 给渲染进程。

**Q: 为什么后端要单独启动？**
A: 后端可能是用 Go/Rust 等语言写的，需要独立运行。主进程负责启动和管理它。

**Q: IPC 通信为什么这么复杂？**
A: 这是 Electron 的安全机制。渲染进程（网页）不能直接调用主进程的功能，必须通过 IPC。

