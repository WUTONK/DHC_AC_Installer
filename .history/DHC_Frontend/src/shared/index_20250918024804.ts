import { DefaultApi,Configuration } from "../api";

// 创建自定义的fetch函数，使用IPC通信
const ipcFetch = async (url: string): Promise<Response> => {
  const result = await window.api.requestApi(url)
  
  // 使用真实的HTTP状态码和响应信息
  const response = new Response(JSON.stringify(result.data), {
    status: result.status,
    statusText: result.statusText,
    headers: result.headers || { 'content-type': 'application/json' }
  })
  
  // 如果请求失败，抛出错误
  if (!result.success) {
    throw new Error(result.error || `HTTP ${result.status}: ${result.statusText}`)
  }
  
  return response
}

// 创建自定义配置，使用IPC fetch
export const Api = new DefaultApi(new Configuration({
    basePath: "http://127.0.0.1:19810",
    fetchApi: ipcFetch
}))
