import React from 'react'
import { Notification,Progress,Layout,Button, Card} from '@douyinfe/semi-ui'
import { useEffect, useRef, useState } from 'react'
// 移除未使用的导入

// @---模组安装DEMO
// 功能：可以选择安装什么模组，安装进度条，安装日志输出（状态提示），安装完成提醒，目前安装状态显示

type AsyncLock = { locked: boolean; run: <T>(fn: () => Promise<T>) => Promise<T | undefined> }

function useAsyncLock(): AsyncLock{
  const [locked, setLocked] = useState<boolean>(false)

  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (locked) return undefined
    setLocked(true)
    try {
      return await fn()
    } finally {
      setLocked(false)
    }
  }

  return { locked, run }
}

const ModInstallPage = (): React.JSX.Element => {

  // 按钮功能
  const ModInstallButtonStyle = {
    height: 50,
    width: 100,
    margin: '0 10px'
  }
  const { locked, run } = useAsyncLock()

  // 进度条功能
  const [loading, setLoading] = useState<boolean>(false)
  const [loadProgress,setLoadProgress] = useState(0)

  const progressResolveRef = useRef<(() => void) | null>(null)

  const toggleProgress = (): void => {
    if (!loading){
      setLoading(true)
    } else {
      setLoading(false)
    }
  }

  // @---通知功能
  const [currentNotification, setCurrentNotification] = useState<string | null>(null)

  useEffect(() => {

    setLoadProgress(0)

    const progressInterval = window.setInterval(()=>{
      setLoadProgress(prev => {
        if(prev >= 100){
          window.clearInterval(progressInterval)
          if (currentNotification) {
            Notification.close(currentNotification)
          }
          if (progressResolveRef.current){
            progressResolveRef.current()
            progressResolveRef.current = null
          }
          return 100;
        }
        return prev + 1;
      })
    },20)

    return () => window.clearInterval(progressInterval);
  }
  ,[loading, currentNotification])

  // 通知模版
  const notificationTemplate = (context:object): string => {
    // 把展开属性放在后面就可以覆盖默认值
    return Notification.open({
      duration:9999,
      ...context,
    })
  }

  // 保留占位：若需要在锁定时提示，可在 useAsyncLock 内处理或使用 tooltip


  return(
    <Layout style={{height:'100%',width:'100%', display:'flex',flexDirection:'column'}}>
      <Layout style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Card style={{background: 'white', margin:'0 20px', display:'flex', justifyContent:'center', alignItems:'center'}}>
          <Button type='primary' disabled={locked} aria-busy={locked} onClick={
            () => run(async () => {
              if (!loading) setLoading(true)
              const notification = notificationTemplate({title:'MapInstall...',content:'InstallContext'})
              setCurrentNotification(notification)
              await new Promise<void>((resolve) => {
                progressResolveRef.current = resolve
              })
              setLoading(false)
            })
          } style={ModInstallButtonStyle}>Map</Button>
          <Button type='secondary' onClick={toggleProgress} style={ModInstallButtonStyle}>CSP</Button>
          <Button type='tertiary' onClick={toggleProgress} style={ModInstallButtonStyle}>SOL</Button>
        </Card>
      </Layout>
      {/* 通知和日志 */}
      <Layout style={{backgroundColor:'rgba(101, 110, 212, 0.13)', height:'100',width:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
        <Layout style={{backgroundColor:'rgba(213, 26, 26, 0.38)', width:'80%', display:'flex', justifyContent:'center', alignItems:'center', margin:'20px 0'}} >
          <Progress style={{backgroundColor:'rgba(13, 182, 244, 0.91)',height:30,width:300}} percent={loadProgress} showInfo={true} format={()=> loadProgress + '%'} />
        </Layout>
      </Layout>
    </Layout>
  )
}

export default ModInstallPage

