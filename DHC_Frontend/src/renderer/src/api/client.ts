const BACKEND_BASE = 'http://127.0.0.1:19810'

export async function requestBackend<T = unknown>(
  method: string,
  pathAndQuery: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${BACKEND_BASE}${pathAndQuery}`
  const hasBody = body !== undefined
  const result = await window.api.requestApi(
    url,
    hasBody
      ? {
          method,
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' }
        }
      : { method }
  )
  if (!result.success) {
    throw new Error(result.error || 'request failed')
  }
  if (!result.ok) {
    throw new Error(`HTTP ${result.status}`)
  }
  return result.data as T
}
