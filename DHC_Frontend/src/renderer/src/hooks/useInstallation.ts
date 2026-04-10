import { useState, useRef, useEffect, useCallback } from 'react'
import { Toast } from '@douyinfe/semi-ui'
import { createInstallation, getInstallationProgress } from '../api/install'
import { precheckResources } from '../api/precheck'
import type { InstallationProgressResponse } from '../components/OneClickInstaller/types'

interface DemoSlowOptions {
  demoSlowProgress: boolean
  demoSlowTotalSeconds: number
}

interface UseInstallationResult {
  cmInstalling: boolean
  cmInstallProgress: number
  cmInstallStatusText: string
  cmInstallCompleted: boolean
  handleInstallCM: () => Promise<void>

  importingProgress: number
  handleResourceVerify: (demoSlowOptions?: DemoSlowOptions) => void
  resourceVerifyState: { imported: boolean; complete: boolean } | null

  createDemoInstall: (
    demoSlowOptions?: DemoSlowOptions
  ) => Promise<string | null>
}

export function useInstallation(): UseInstallationResult {
  const [cmInstalling, setCmInstalling] = useState<boolean>(false)
  const [cmInstallProgress, setCmInstallProgress] = useState<number>(0)
  const [cmInstallStatusText, setCmInstallStatusText] = useState<string>('')
  const [cmInstallCompleted, setCmInstallCompleted] = useState<boolean>(false)

  const [importingProgress, setImportingProgress] = useState<number>(0)
  const [resourceVerifyState, setResourceVerifyState] = useState<{
    imported: boolean
    complete: boolean
  } | null>(null)

  const isPollingRef = useRef<boolean>(false)
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isResourcePollingRef = useRef<boolean>(false)
  const resourcePollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      isPollingRef.current = false
      isResourcePollingRef.current = false
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current)
      if (resourcePollingTimerRef.current) clearTimeout(resourcePollingTimerRef.current)
    }
  }, [])

  const stopCMPolling = useCallback((): void => {
    isPollingRef.current = false
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
  }, [])

  const stopResourcePolling = useCallback((): void => {
    isResourcePollingRef.current = false
    if (resourcePollingTimerRef.current) {
      clearTimeout(resourcePollingTimerRef.current)
      resourcePollingTimerRef.current = null
    }
  }, [])

  const pollCMInstallationProgress = useCallback(
    async (installId: string): Promise<void> => {
      isPollingRef.current = true

      const poll = async (): Promise<void> => {
        if (!isPollingRef.current) return
        try {
          const progress = await getInstallationProgress(installId)

          setCmInstallProgress(progress.totalProgress)

          if (progress.categories && progress.categories.length > 0) {
            const currentCat =
              progress.categories.find((c) => c.status === 'active') ||
              progress.categories[0]
            if (currentCat.currentItem) {
              setCmInstallStatusText(currentCat.currentItem)
            } else if (progress.status === 'installing') {
              setCmInstallStatusText('正在安装...')
            }
          } else {
            if (progress.status === 'preparing')
              setCmInstallStatusText('正在准备...')
            else if (progress.status === 'installing')
              setCmInstallStatusText('正在安装...')
          }

          if (
            progress.status === 'completed' ||
            progress.status === 'failed'
          ) {
            stopCMPolling()

            if (progress.status === 'completed') {
              setCmInstallProgress(100)
              setCmInstallStatusText('安装完成')
              setTimeout(() => {
                setCmInstalling(false)
                setCmInstallCompleted(true)
                Toast.success('Content Manager 安装成功！')
              }, 200)
            } else {
              setCmInstalling(false)
              setCmInstallStatusText('安装失败')
              Toast.error(
                `Content Manager 安装失败: ${progress.error || '未知错误'}`
              )
            }
            return
          }
        } catch (err: unknown) {
          console.error(`获取 CM 安装进度失败: ${err}`)
          stopCMPolling()
          setCmInstalling(false)
          setCmInstallStatusText('获取进度失败')
          Toast.error('获取安装进度失败，请检查后端连接')
          return
        }

        if (isPollingRef.current) {
          pollingTimerRef.current = setTimeout(() => {
            void poll()
          }, 100)
        }
      }

      pollingTimerRef.current = setTimeout(() => {
        void poll()
      }, 100)
    },
    [stopCMPolling]
  )

  const handleInstallCM = useCallback(async (): Promise<void> => {
    setCmInstalling(true)
    setCmInstallStatusText('正在连接服务器...')
    setCmInstallProgress(0)
    stopCMPolling()

    try {
      const response = await createInstallation({ versionId: 'cm-demo-v1' })
      setCmInstallStatusText('已创建安装任务...')
      await pollCMInstallationProgress(response.id)
    } catch (err: unknown) {
      console.error(`创建 CM 安装任务失败: ${err}`)
      setCmInstalling(false)
      setCmInstallStatusText('创建任务失败')
      Toast.error('无法启动安装任务，请检查后端服务')
    }
  }, [stopCMPolling, pollCMInstallationProgress])

  const pollResourceVerifyProgress = useCallback(
    async (installId: string): Promise<void> => {
      isResourcePollingRef.current = true

      const poll = async (): Promise<void> => {
        if (!isResourcePollingRef.current) return
        try {
          const progress: InstallationProgressResponse =
            await getInstallationProgress(installId, 'resource')

          setImportingProgress(Math.floor(progress.totalProgress))

          if (
            progress.status === 'completed' ||
            progress.status === 'failed'
          ) {
            stopResourcePolling()

            if (progress.status === 'completed') {
              const res = await precheckResources()
              setResourceVerifyState({
                imported: Boolean(res.imported),
                complete: Boolean(res.complete)
              })
              setImportingProgress(0)
              Toast.success('资源包校验通过！')
            } else {
              setImportingProgress(0)
              setResourceVerifyState({ imported: false, complete: false })
              Toast.error('资源包校验失败，请检查资源完整性')
            }
            return
          }
        } catch (err: unknown) {
          console.error(`获取资源校验进度失败: ${err}`)
          stopResourcePolling()
          setImportingProgress(0)
          setResourceVerifyState({ imported: false, complete: false })
          Toast.error('获取资源校验进度失败，请检查后端服务')
          return
        }

        if (isResourcePollingRef.current) {
          resourcePollingTimerRef.current = setTimeout(() => {
            void poll()
          }, 100)
        }
      }

      resourcePollingTimerRef.current = setTimeout(() => {
        void poll()
      }, 100)
    },
    [stopResourcePolling]
  )

  const handleResourceVerify = useCallback(
    (demoSlowOptions?: DemoSlowOptions): void => {
      stopResourcePolling()
      setImportingProgress(0)
      setResourceVerifyState(null)

      void (async () => {
        try {
          const response = await createInstallation({
            versionId: 'demo-resource-verify-v1',
            ...(demoSlowOptions?.demoSlowProgress
              ? {
                  demoSlowProgress: true,
                  demoSlowTotalSeconds: demoSlowOptions.demoSlowTotalSeconds
                }
              : {})
          })
          await pollResourceVerifyProgress(response.id)
        } catch (err: unknown) {
          console.error('创建资源校验任务失败:', err)
          setImportingProgress(0)
          setResourceVerifyState({ imported: false, complete: false })
          Toast.error('无法启动资源校验任务，请检查后端服务')
        }
      })()
    },
    [stopResourcePolling, pollResourceVerifyProgress]
  )

  const createDemoInstall = useCallback(
    async (demoSlowOptions?: DemoSlowOptions): Promise<string | null> => {
      try {
        const response = await createInstallation({
          versionId: 'demo-install-v1',
          ...(demoSlowOptions?.demoSlowProgress
            ? {
                demoSlowProgress: true,
                demoSlowTotalSeconds: demoSlowOptions.demoSlowTotalSeconds
              }
            : {})
        })

        if (!response?.id) {
          throw new Error('backend did not return installId')
        }

        console.info('[useInstallation] DEMO 安装任务已创建', response)
        return response.id
      } catch (err: unknown) {
        console.error('创建 DEMO 安装任务失败:', err)
        Toast.error('无法启动 DEMO 安装任务，请检查后端服务')
        return null
      }
    },
    []
  )

  return {
    cmInstalling,
    cmInstallProgress,
    cmInstallStatusText,
    cmInstallCompleted,
    handleInstallCM,
    importingProgress,
    handleResourceVerify,
    resourceVerifyState,
    createDemoInstall
  }
}
