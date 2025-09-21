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
    <div style={{height:'100%', width:'100%', display:'flex', flexDirection:'column', padding: '20px'}}>
      {/* 按钮区域 */}
      <div style={{height: 200, display:'flex', alignItems:'center', justifyContent:'center', marginBottom: '20px'}}>
        <Card style={{background: 'white', padding:'20px', display:'flex', justifyContent:'center', alignItems:'center', gap: '10px'}}>
          <Button type='primary' onClick={toggleProgress} style={ModInstallButtonStyle}>Map</Button>
          <Button type='secondary' onClick={toggleProgress} style={ModInstallButtonStyle}>CSP</Button>
          <Button type='tertiary' onClick={toggleProgress} style={ModInstallButtonStyle}>SOL</Button>
        </Card>
      </div>
      
      {/* 进度条区域 */}
      <div style={{flex: 1, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f5f5f5', borderRadius: '8px', padding: '40px'}}>
        <div style={{width: '100%', maxWidth: '500px'}}>
          <Progress
            percent={loadProgress}
            showInfo={true}
            format={()=> `${loadProgress}%`}
            stroke="#1890ff"
            strokeWidth={8}
            size="large"
          />
          {loading && (
            <div style={{textAlign: 'center', marginTop: '10px', color: '#666'}}>
              正在安装模组...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModInstallPage

