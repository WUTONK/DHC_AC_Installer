import { Progress,Layout,Nav, Button, Typography, Space, Card,Avatar} from '@douyinfe/semi-ui'
import { Api } from '../../shared'
import { useEffect, useState } from 'react'
import { IconHome, IconCart } from '@douyinfe/semi-icons';

const { Text } = Typography

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
          <Button type='primary' onClick={toggleProgress} style={ModInstallButtonStyle}>Map</Button>
          <Button type='secondary' onClick={toggleProgress} style={ModInstallButtonStyle}>CSP</Button>
          <Button type='tertiary' onClick={toggleProgress} style={ModInstallButtonStyle}>SOL</Button>
        </Card>
      </Layout>
      <Layout style={{backgroundColor:'rgb(101, 111, 212)', height:'100',width:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
        <Layout style={{backgroundColor:'rgb(213, 26, 26)', width:'80%', display:'flex', justifyContent:'center', alignItems:'center', margin:'20px 0'}} >
          <Progress style={{backgroundColor:'rgb(13, 183, 244)',height:30,width:300}} percent={loadProgress} showInfo={true} format={()=> loadProgress + '%'} />
        </Layout>
      </Layout>
    </Layout>

  )
}

export default ModInstallPage

