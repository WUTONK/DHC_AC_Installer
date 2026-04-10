import { useState, useEffect } from 'react'
import { precheckResources, precheckDlcCarpack, precheckCm } from '../api/precheck'

interface UsePrecheckOptions {
  enabled: boolean
  modeId: string
  devResourceImported: boolean
  devResourceComplete: boolean
}

interface UsePrecheckResult {
  checkingEnv: boolean
  checkingResources: boolean
  resourceState: { imported: boolean; complete: boolean }
  setResourceState: React.Dispatch<React.SetStateAction<{ imported: boolean; complete: boolean }>>
  cmInstalled: boolean
  setCmInstalled: React.Dispatch<React.SetStateAction<boolean>>
  hasAllDLC: boolean
}

export function usePrecheck({
  enabled,
  modeId,
  devResourceImported,
  devResourceComplete
}: UsePrecheckOptions): UsePrecheckResult {
  const [checkingEnv, setCheckingEnv] = useState<boolean>(false)
  const [checkingResources, setCheckingResources] = useState<boolean>(false)
  const [resourceState, setResourceState] = useState<{ imported: boolean; complete: boolean }>({
    imported: false,
    complete: false
  })
  const [cmInstalled, setCmInstalled] = useState<boolean>(false)
  const [hasAllDLC, setHasAllDLC] = useState<boolean>(true)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    setCheckingEnv(true)
    setCheckingResources(true)

    const run = async (): Promise<void> => {
      try {
        if (modeId === 'demo') {
          const [res, dlc, cm] = await Promise.all([
            precheckResources(),
            precheckDlcCarpack(),
            precheckCm()
          ])

          if (cancelled) return
          setResourceState({
            imported: Boolean(res?.imported),
            complete: Boolean(res?.complete)
          })
          setHasAllDLC(Boolean(dlc?.hasAllDLC))
          setCmInstalled(Boolean(cm?.cmInstalled))
        } else {
          await new Promise<void>((resolve) => setTimeout(resolve, 600))

          if (cancelled) return
          setCmInstalled(false)
          setHasAllDLC(false)
          setResourceState({
            imported: devResourceImported,
            complete: devResourceComplete
          })
        }
      } catch (err) {
        console.error('PRE_CHECK 检测失败:', err)
        if (cancelled) return
        setCmInstalled(false)
        setHasAllDLC(false)
        setResourceState({ imported: false, complete: false })
      } finally {
        if (!cancelled) {
          setCheckingEnv(false)
          setCheckingResources(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [enabled, modeId, devResourceImported, devResourceComplete])

  return {
    checkingEnv,
    checkingResources,
    resourceState,
    setResourceState,
    cmInstalled,
    setCmInstalled,
    hasAllDLC
  }
}
