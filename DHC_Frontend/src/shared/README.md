# Shared 模块理解指南

## 这个文件是做什么的？

这个文件创建了一个**自定义的 API 客户端**，让 React 代码可以方便地调用后端 API。

## 为什么需要它？

通常，API 客户端会直接使用 `fetch` 发送 HTTP 请求。但在 Electron 中：
- 渲染进程不能直接发送 HTTP 请求（安全限制）
- 需要通过 IPC 通信，让主进程代为发送

所以我们需要：
1. **自定义 fetch 函数**：用 IPC 通信替代直接 HTTP 请求
2. **配置 API 客户端**：使用这个自定义 fetch

## 代码解析

### 1. 自定义 fetch 函数

```typescript
const ipcFetch = async (url: string): Promise<Response> => {
  // 调用 preload 暴露的 API
  const result = await window.api.requestApi(url)
  
  // 把结果包装成标准的 Response 对象
  const response = new Response(JSON.stringify(result.data), {
    status: result.status,
    statusText: result.statusText,
    headers: result.headers || { 'content-type': 'application/json' }
  })
  
  // 如果失败，抛出错误
  if (!result.success) {
    throw new Error(result.error || `HTTP ${result.status}: ${result.statusText}`)
  }
  
  return response
}
```

**作用**：
- 接收一个 URL（比如 `http://127.0.0.1:19810/api/getServerInfo`）
- 通过 IPC 发送到主进程
- 主进程发送 HTTP 请求
- 返回标准的 `Response` 对象（这样 API 客户端就能正常使用）

**为什么返回 Response？**
- API 客户端（DefaultApi）期望标准的 `fetch` API
- `fetch` 返回 `Response` 对象
- 所以我们也要返回 `Response`，保持接口一致

### 2. 创建 API 客户端

```typescript
export const Api = new DefaultApi(new Configuration({
    basePath: "http://127.0.0.1:19810",
    fetchApi: ipcFetch  // 使用我们的自定义 fetch
}))
```

**作用**：
- 创建一个 API 客户端实例
- 设置基础 URL（后端服务地址）
- 使用自定义的 `ipcFetch` 替代默认的 `fetch`

## 使用示例

在 React 组件中：

```typescript
import { Api } from '@/shared'

// 调用后端 API
const serverInfo = await Api.getServerInfo()
```

**实际执行流程**：
1. `Api.getServerInfo()` 内部调用 `ipcFetch('http://127.0.0.1:19810/api/getServerInfo')`
2. `ipcFetch` 调用 `window.api.requestApi(url)`
3. Preload 脚本通过 IPC 发送到主进程
4. 主进程发送 HTTP 请求到后端
5. 后端返回数据
6. 数据通过 IPC 返回给渲染进程
7. `ipcFetch` 包装成 `Response` 对象
8. API 客户端解析 `Response`，返回数据

## 设计模式：适配器模式

这个文件使用了**适配器模式**：
- **目标接口**：标准的 `fetch` API
- **实际实现**：IPC 通信
- **适配器**：`ipcFetch` 函数，把 IPC 调用适配成 `fetch` 接口

## 学习建议

1. **理解适配器模式**：为什么需要包装一层
2. **跟踪完整调用链**：从 React 组件到后端响应的每一步
3. **理解为什么这样设计**：安全性和便利性的平衡

## 常见问题

**Q: 为什么不直接用 window.api.requestApi？**
A: 可以，但 API 客户端（DefaultApi）期望标准的 fetch API。用适配器可以让代码更统一，不需要在每个地方都写 IPC 调用。

**Q: 为什么 basePath 是 http://127.0.0.1:19810？**
A: 这是后端服务的地址。后端运行在本地，监听 19810 端口。

**Q: 这个文件可以删除吗？**
A: 可以，但你需要：
1. 在每个组件中直接使用 `window.api.requestApi`
2. 手动处理 URL 拼接
3. 手动解析响应数据

使用这个适配器可以让代码更简洁。

