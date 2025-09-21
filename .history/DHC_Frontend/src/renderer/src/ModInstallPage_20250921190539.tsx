import { Notification,Progress,Layout,Button, Card, Toast, Banner} from '@douyinfe/semi-ui'
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
      {/* 测试Banner组件 */}
      <Banner
        type="info"
        title="测试Banner"
        description="如果你能看到这个Banner，说明Semi UI组件正常工作"
        style={{margin: '10px'}}
      />

      <Layout style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Card style={{background: 'white', margin:'0 20px', display:'flex', justifyContent:'center', alignItems:'center'}}>
          <Button type='primary' onClick={
            ()=>{
              console.log('按钮被点击了') // 调试日志
              console.log('Toast对象:', Toast) // 检查Toast对象是否存在
              console.log('Notification对象:', Notification) // 检查Notification对象是否存在

              // 先测试简单的alert
              alert('这是一个简单的alert测试')

              toggleProgress()

              // 测试Toast - 尝试不同的方法
              try {
                // 方法1：直接调用
                Toast.info('Toast测试：这是一个Toast消息')
                console.log('Toast.info调用成功')
                
                // 方法2：使用success
                setTimeout(() => {
                  Toast.success('Toast success测试')
                }, 1000)
                
                // 方法3：使用warning
                setTimeout(() => {
                  Toast.warning('Toast warning测试')
                }, 2000)
                
              } catch (error) {
                console.error('Toast.info调用失败:', error)
              }

              // 测试Notification
              try {
                Notification.open({
                  title: '测试通知',
                  content: '这是一个测试通知，看看是否能正常显示',
                  duration: 5,
                  position: 'topRight'
                })
                console.log('Notification.open调用成功')
              } catch (error) {
                console.error('Notification.open调用失败:', error)
              }
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

