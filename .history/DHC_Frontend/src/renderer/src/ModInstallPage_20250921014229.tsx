import { Layout,Nav, Button, Typography, Space, Card,Avatar, Progress} from '@douyinfe/semi-ui'
import { Api } from '../../shared'
import { useState } from 'react'
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
  const [loadImgNum,setLoadImgNum] = useState(0)
  const [progress, setProgress] = useState<number>(0)
  const [installStatus, setInstallStatus] = useState<string>('准备安装')

  return(
    <Layout style={{height:'100%',width:"100%", display:'flex',flexDirection:'column'}}>
      <Layout style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Card style={{background: 'white', margin:'0 20px', display:'flex', justifyContent:'center', alignItems:'center'}}>
          <Button type='primary' style={ModInstallButtonStyle}>Map</Button>
          <Button type='secondary' style={ModInstallButtonStyle}>CSP</Button>
          <Button type='tertiary' style={ModInstallButtonStyle}>SOL</Button>
        </Card>
      </Layout>
      <Layout style={{backgroundColor:'rgb(101, 111, 212)', padding: '20px', flex: 1 }}>
        <Layout style={{alignItems:'center', justifyContent: 'center', height: '100%'}}>
          <Card style={{background: 'white', padding: '30px', width: '80%', maxWidth: '600px'}}>
            <Space vertical style={{width: '100%'}}>
              <Text size="large" style={{textAlign: 'center', marginBottom: '20px'}}>
                安装进度
              </Text>
              <Progress 
                percent={progress} 
                stroke="#4CAF50"
                strokeWidth={8}
                showInfo={true}
                format={(percent) => `${percent}%`}
              />
              <Text style={{textAlign: 'center', marginTop: '10px', color: '#666'}}>
                {installStatus}
              </Text>
              {loading && (
                <Text style={{textAlign: 'center', marginTop: '10px', color: '#1890ff'}}>
                  正在安装中...
                </Text>
              )}
            </Space>
          </Card>
        </Layout>
      </Layout>
    </Layout>

  )
}

export default ModInstallPage

