# Preload 脚本理解指南

## 这个文件是做什么的？

这是 **预加载脚本**（Preload Script），它在渲染进程（React 代码）加载之前运行。

## 为什么需要它？

Electron 的安全模型：
- **渲染进程**（你的 React 代码）运行在沙箱中，不能直接访问 Node.js API
- **主进程**（main/index.ts）可以访问所有 Node.js API
- **Preload 脚本**：在安全边界内运行，可以"桥接"主进程和渲染进程

## 代码解析

### 1. 暴露 API 给渲染进程

```typescript
const api = {
  requestApi: (url: string) => ipcRenderer.invoke('api-request', url)
}
```

**作用**：创建一个 `api` 对象，包含 `requestApi` 方法

**工作原理**：
- `ipcRenderer.invoke('api-request', url)` 发送消息到主进程
- 主进程的 `ipcMain.handle('api-request', ...)` 会接收这个消息
- 主进程处理完后，返回结果给渲染进程

### 2. 两种暴露方式

#### 方式1：contextIsolation 开启时（更安全）
```typescript
contextBridge.exposeInMainWorld('api', api)
```
- 使用 `contextBridge`，更安全
- 渲染进程通过 `window.api` 访问

#### 方式2：contextIsolation 关闭时（当前项目）
```typescript
window.api = api
```
- 直接挂载到 `window` 对象
- 渲染进程通过 `window.api` 访问

## 数据流向

```
渲染进程（React）
  ↓
window.api.requestApi('http://127.0.0.1:19810/api/xxx')
  ↓
ipcRenderer.invoke('api-request', url)
  ↓
主进程（main/index.ts）
  ↓
ipcMain.handle('api-request', ...) 接收
  ↓
fetch(url) 发送 HTTP 请求到后端
  ↓
返回结果
  ↓
ipcRenderer.invoke 返回 Promise
  ↓
渲染进程收到结果
```

## 类比理解

想象你在一个**安全的房间**（渲染进程）里，想调用**外面的服务**（后端 API）：

1. 你不能直接出去（安全限制）
2. 你通过**对讲机**（IPC）告诉**门卫**（主进程）
3. 门卫帮你打电话（HTTP 请求）给服务
4. 门卫把结果通过**对讲机**告诉你

Preload 脚本就是**对讲机**的接口定义。

## 学习建议

1. **理解 IPC 通信**：这是 Electron 的核心概念
2. **理解安全模型**：为什么需要这样设计
3. **跟踪数据流**：从 React 调用到后端响应的完整路径

