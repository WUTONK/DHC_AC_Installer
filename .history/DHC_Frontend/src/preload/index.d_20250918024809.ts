import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      requestApi: (url: string) => Promise<{ 
        success: boolean; 
        data?: unknown; 
        error?: string;
        status: number;
        statusText: string;
        ok: boolean;
        headers?: Record<string, string>;
      }>
    }
  }
}
