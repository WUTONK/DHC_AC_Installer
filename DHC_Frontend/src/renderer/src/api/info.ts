import { requestBackend } from './client'

export interface ServerInfoResponse {
  rtt: string
  clients: number
  maxClients: number
}

export async function getServerInfo(serverHost: string): Promise<ServerInfoResponse> {
  return requestBackend<ServerInfoResponse>(
    'GET',
    `/api/GetServerInfo?serverHost=${encodeURIComponent(serverHost)}`
  )
}

export interface AppStateResponse {
  firstLaunchCompleted?: boolean
  serverDisclaimer?: {
    shownCount: number
    devForceShowSuppressed: boolean
  }
}

export async function getAppState(): Promise<AppStateResponse> {
  return requestBackend<AppStateResponse>('GET', '/api/AppState')
}

export async function updateServerDisclaimerState(
  state: Record<string, unknown>
): Promise<void> {
  await requestBackend('PUT', '/api/AppState/ServerDisclaimer', state)
}
