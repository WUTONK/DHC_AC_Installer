import { requestBackend } from './client'

export interface PrecheckResourcesResponse {
  imported: boolean
  complete: boolean
}

export interface PrecheckDlcResponse {
  hasAllDLC: boolean
}

export interface PrecheckCmResponse {
  cmInstalled: boolean
}

export async function precheckResources(): Promise<PrecheckResourcesResponse> {
  return requestBackend<PrecheckResourcesResponse>('GET', '/api/demo/precheck/resources')
}

export async function precheckDlcCarpack(): Promise<PrecheckDlcResponse> {
  return requestBackend<PrecheckDlcResponse>('GET', '/api/demo/precheck/dlc-carpack')
}

export async function precheckCm(): Promise<PrecheckCmResponse> {
  return requestBackend<PrecheckCmResponse>('GET', '/api/demo/precheck/cm')
}
