import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      requestApi: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>
    }
  }
}
