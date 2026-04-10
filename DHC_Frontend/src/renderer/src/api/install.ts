import { requestBackend } from './client'
import type {
  InstallationCreateResponse,
  InstallationProgressResponse
} from '../components/OneClickInstaller/types'

export interface CreateInstallationParams {
  versionId: string
  demoSlowProgress?: boolean
  demoSlowTotalSeconds?: number
}

export async function createInstallation(
  params: CreateInstallationParams
): Promise<InstallationCreateResponse> {
  return requestBackend<InstallationCreateResponse>('POST', '/api/installations', params as unknown as Record<string, unknown>)
}

export async function getInstallationProgress(
  installId: string,
  category: string = 'all'
): Promise<InstallationProgressResponse> {
  return requestBackend<InstallationProgressResponse>(
    'GET',
    `/api/installations/${installId}/progress?category=${category}`
  )
}
