const BACKEND_BASE = 'http://127.0.0.1:19810'
const APP_STATE_ENDPOINT = `${BACKEND_BASE}/api/AppState`
const SERVER_DISCLAIMER_ENDPOINT = `${BACKEND_BASE}/api/AppState/ServerDisclaimer`

interface IpcApiResult {
  success: boolean
  data?: unknown
  error?: string
  status: number
  statusText: string
  ok: boolean
}

// 与后端 DHC_Backend/models/service/infoGet/getAppInfo.go 的结构保持一致
export interface AppState {
  firstLaunchCompleted?: boolean
  serverDisclaimer?: {
    shownCount?: number
    devForceShowSuppressed?: boolean
  }
}

export interface ServerDisclaimerState {
  shownCount: number
  devForceShowSuppressed: boolean
}

const DEFAULT_SERVER_DISCLAIMER_STATE: ServerDisclaimerState = {
  shownCount: 0,
  devForceShowSuppressed: false
}

async function request(
  method: 'GET' | 'PUT',
  url: string,
  body?: Record<string, unknown>
): Promise<unknown> {
  const options =
    body === undefined
      ? { method }
      : { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
  const result = (await window.api.requestApi(url, options)) as IpcApiResult
  if (!result.success) {
    throw new Error(result.error || 'IPC request failed')
  }
  if (!result.ok) {
    throw new Error(`HTTP ${result.status} ${result.statusText}`)
  }
  return result.data
}

// 读取 serverDisclaimer 的统一入口（后续页面都应复用这里）
export async function getServerDisclaimerState(): Promise<ServerDisclaimerState> {
  const data = (await request('GET', APP_STATE_ENDPOINT)) as AppState | null
  const shownCount = Number(data?.serverDisclaimer?.shownCount)
  return {
    shownCount: Number.isNaN(shownCount) || shownCount < 0 ? 0 : shownCount,
    devForceShowSuppressed: Boolean(data?.serverDisclaimer?.devForceShowSuppressed)
  }
}

// 更新 serverDisclaimer 的统一入口（后续页面都应复用这里）
export async function setServerDisclaimerState(state: ServerDisclaimerState): Promise<void> {
  await request('PUT', SERVER_DISCLAIMER_ENDPOINT, state)
}

// 仅更新开发者强制显示开关
export async function updateServerDisclaimerDevForceShow(enabled: boolean): Promise<ServerDisclaimerState> {
  const current = await getServerDisclaimerState()
  const next = {
    ...current,
    devForceShowSuppressed: enabled
  }
  await setServerDisclaimerState(next)
  return next
}

export { DEFAULT_SERVER_DISCLAIMER_STATE }
