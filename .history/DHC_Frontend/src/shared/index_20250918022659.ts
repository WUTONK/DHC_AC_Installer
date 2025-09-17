import { DefaultApi,Configuration } from "../api";

// 创建自定义的fetch函数，使用IPC通信
const ipcFetch = async (url: string): Promise<Response> => {
  const result = await window.api.requestApi(url)
  if (result.success) {
    // 创建一个完整的模拟Response对象
    const response = new Response(JSON.stringify(result.data), {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json'
      }
    })
    return response
  } else {
    throw new Error(result.error)
  }
}

// 创建自定义配置，使用IPC fetch
export const Api = new DefaultApi(new Configuration({
    basePath: "http://127.0.0.1:19810",
    fetchApi: ipcFetch
}))
