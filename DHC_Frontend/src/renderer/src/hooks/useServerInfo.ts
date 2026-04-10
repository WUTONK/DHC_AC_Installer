import { useState, useCallback } from 'react'
import { getServerInfo, type ServerInfoResponse } from '../api/info'
import { resolveServerHost, type ServerName } from '../NetDemo'

interface UseServerInfoResult {
  loading: boolean
  error: string | null
  serverInfo: ServerInfoResponse | null
  fetchServerInfo: (server: ServerName | string) => Promise<void>
}

export function useServerInfo(): UseServerInfoResult {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [serverInfo, setServerInfo] = useState<ServerInfoResponse | null>(null)

  const fetchServerInfo = useCallback(
    async (server: ServerName | string): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const host = resolveServerHost(server)
        const info = await getServerInfo(host)
        setServerInfo(info)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '获取信息失败'
        setError(msg)
        setServerInfo(null)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { loading, error, serverInfo, fetchServerInfo }
}
