import type { IpcRenderer } from 'electron'

type ElectronAPI = Pick<IpcRenderer, 'send' | 'invoke' | 'on' | 'once' | 'removeListener' | 'removeAllListeners'> & {
  process: {
    versions: NodeJS.ProcessVersions
  }
}

// 告诉编译器 window.api里的类型
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      requestApi: (url: string) => Promise<{
        success: boolean
        data?: unknown
        error?: string
        status: number
        statusText: string
        ok: boolean
        headers?: Record<string, string>
      }>
    }
  }
}

export {}
