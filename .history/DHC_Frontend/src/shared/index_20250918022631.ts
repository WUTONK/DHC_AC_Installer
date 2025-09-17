import { DefaultApi,Configuration } from "../api";

// 创建自定义的fetch函数，使用IPC通信
const ipcFetch = async (url: string): Promise<Response> => {
  // @ts-ignore - window.api is injected by preload script
  const result = await window.api.requestApi(url)
  if (result.success) {
    // 创建一个模拟的Response对象
    return {
      ok: true,
      status: 200,
      json: async () => result.data,
      text: async () => JSON.stringify(result.data),
      headers: new Headers({ 'content-type': 'application/json' })
    } as Response
  } else {
    throw new Error(result.error)
  }
}

// 创建自定义配置，使用IPC fetch
export const Api = new DefaultApi(new Configuration({
    basePath: "http://127.0.0.1:19810",
    fetchApi: ipcFetch
}))
