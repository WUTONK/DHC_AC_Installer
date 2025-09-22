import React from 'react'
import { Notification,Progress,Layout,Button, Typography, Card} from '@douyinfe/semi-ui'
import { Api } from '../../shared'
import { useEffect, useState } from 'react'
import { IconHome, IconCart } from '@douyinfe/semi-icons';
import { title } from 'process';

const { Text } = Typography

// @---模组安装DEMO
// 功能：可以选择安装什么模组，安装进度条，安装日志输出（状态提示），安装完成提醒，目前安装状态显示

function ModInstallPage(): React.ReactNode{

  // 按钮功能
  const ModInstallButtonStyle = {
    height: 50,
    width: 100,
    margin: '0 10px'
  }
  const [buttonLock, setButtonLock] = useState<boolean>(false)

  // 进度条功能
  const [loading, setLoading] = useState<boolean>(false)
  const [loadProgress,setLoadProgress] = useState(0)

  const toggleProgress = (): void => {
    if (!loading){
      setLoading(true)
    } else {
      setLoading(false)
    }

  }

  useEffect(() => {

    setLoadProgress(0)

    const progressInterval = window.setInterval(()=>{
      setLoadProgress(prev => {
        if(prev >= 100){
          window.clearInterval(progressInterval)
          if (currentNotification) {
            Notification.close(currentNotification)
          }
          setButtonLock(false) // 解除按钮锁
          return 100;
        }
        setButtonLock(true)
        return prev + 1;
      })
    },20)

    return () => window.clearInterval(progressInterval);
  }
  ,[loading])

  // @---通知功能

  // 通知模版
  const notificationTemplate = (context:object): string => {
    // 把展开属性放在后面就可以覆盖默认值
    return Notification.open({
      duration:9999,
      ...context,
    })
  }

  const buttonLockNotification = ():void => {
    Notification.open({
      duration:1,
      title:'按钮🔒',
      content:'有安装操作正在进行中...'
    })
  }

  const [currentNotification, setCurrentNotification] = useState<string | null>(null)

  return(
    <Layout style={{height:'100%',width:'100%', display:'flex',flexDirection:'column'}}>
      <Layout style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Card style={{background: 'white', margin:'0 20px', display:'flex', justifyContent:'center', alignItems:'center'}}>
          <Button type='primary' onClick={
            ()=>{
              if(buttonLock){
                buttonLockNotification()
              }
              toggleProgress()
              const notification = notificationTemplate({title:'MapInstall...',content:'InstallContext'})
              setCurrentNotification(notification)
              setButtonLock(true)
            }
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

