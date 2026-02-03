import { DefaultApi,Configuration } from "../api";

// ============================================
// 自定义 fetch 函数：使用 IPC 通信替代直接 HTTP 请求
// ============================================
//
// 为什么需要这个函数？
// - API 客户端（DefaultApi）期望标准的 fetch API
// - 但在 Electron 中，渲染进程不能直接发送 HTTP 请求
// - 所以我们需要"适配器"：把 IPC 调用包装成 fetch 接口
//
// 工作流程：
// 1. API 客户端调用 ipcFetch(url)
// 2. ipcFetch 调用 window.api.requestApi(url)（通过 IPC）
// 3. 主进程发送 HTTP 请求到后端
// 4. 后端返回数据
// 5. ipcFetch 把结果包装成标准的 Response 对象
// 6. API 客户端解析 Response，返回数据给 React 组件
const ipcFetch = async (url: string): Promise<Response> => {
  // 通过 IPC 发送请求到主进程
  const result = await window.api.requestApi(url)

  // 把结果包装成标准的 Response 对象
  // 这样 API 客户端就能正常使用（它期望标准的 fetch API）
  const response = new Response(JSON.stringify(result.data), {
    status: result.status,
    statusText: result.statusText,
    headers: result.headers || { 'content-type': 'application/json' }
  })

  // 如果请求失败，抛出错误（标准 fetch 的行为）
  if (!result.success) {
    throw new Error(result.error || `HTTP ${result.status}: ${result.statusText}`)
  }

  return response
}

// ============================================
// 创建 API 客户端实例
// ============================================
//
// 作用：创建一个配置好的 API 客户端，供 React 组件使用
//
// 配置说明：
// - basePath: 后端服务的地址（运行在本地 19810 端口）
// - fetchApi: 使用我们的自定义 fetch（通过 IPC 通信）
//
// 使用示例（在 React 组件中）：
//   import { Api } from '@/shared'
//   const serverInfo = await Api.getServerInfo()
export const Api = new DefaultApi(new Configuration({
    basePath: "http://127.0.0.1:19810",
    fetchApi: ipcFetch
}))
