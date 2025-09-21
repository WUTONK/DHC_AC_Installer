import { Notification,Progress,Layout,Button, Card, Toast} from '@douyinfe/semi-ui'
import { useEffect, useState } from 'react'

// @---模组安装DEMO
// 功能：可以选择安装什么模组，安装进度条，安装日志输出（状态提示），安装完成提醒，目前安装状态显示

function ModInstallPage(): React.JSX.Element{

  const ModInstallButtonStyle = {
    height: 50,
    width: 100,
    margin: '0 10px'
  }

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
    if (!loading){
      setLoadProgress(0)
      return
    }

    setLoadProgress(0)

    const progressInterval = window.setInterval(()=>{
      setLoadProgress(prev => {
        if(prev >= 100){
          window.clearInterval(progressInterval)
          return 100;
        }
        return prev + 1;
      })
    },20)

    return () => window.clearInterval(progressInterval);
  }
  ,[loading])


  return(
    <Layout style={{height:'100%',width:'100%', display:'flex',flexDirection:'column'}}>
      <Layout style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Card style={{background: 'white', margin:'0 20px', display:'flex', justifyContent:'center', alignItems:'center'}}>
          <Button type='primary' onClick={
            ()=>{
              console.log('按钮被点击了') // 调试日志
              toggleProgress()
              Notification.open({
                title: '测试通知',
                content: '这是一个测试通知，看看是否能正常显示',
                duration: 5,
                position: 'topRight'
            })
            }
            } style={ModInstallButtonStyle}>测试通知</Button>
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

    // 通知
  )
}

export default ModInstallPage

