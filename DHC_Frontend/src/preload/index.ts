import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ============================================
// 自定义 API：暴露给渲染进程使用
// ============================================
//
// 作用：创建一个 API 对象，让渲染进程可以调用主进程的功能
//
// requestApi 方法：
// - 接收一个 URL（比如 'http://127.0.0.1:19810/api/getServerInfo'）
// - 通过 IPC 发送到主进程（ipcRenderer.invoke）
// - 主进程的 ipcMain.handle('api-request', ...) 会接收这个请求
// - 可选第二个参数：{ method, body, headers }，用于 POST JSON 等
// - 返回一个 Promise，包含后端响应的数据
const api = {
  requestApi: (
    url: string,
    options?: { method?: string; body?: string; headers?: Record<string, string> }
  ) => ipcRenderer.invoke('api-request', url, options)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
