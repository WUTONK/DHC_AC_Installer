import { Layout,Nav, Button, Typography, Space, Card,Avatar} from '@douyinfe/semi-ui'
import { Api } from '../../shared'
import { useState } from 'react'
import { IconHome, IconCart } from '@douyinfe/semi-icons';

// @---模组安装DEMO
// 功能：可以选择安装什么模组，安装进度条，安装日志输出（状态提示），安装完成提醒，目前安装状态显示

function ModInstallPage(): React.JSX.Element{

  const ModInstallButtonStyle = {
    height: 50,
    width: 100,
    margin: 20
  }
  // <Button theme='light' type='primary' style={{ marginRight: 8 }}>浅色主要</Button>
  // <Button theme='light' type='secondary' style={{ marginRight: 8 }}>浅色次要</Button>
  // <Button theme='light' type='tertiary' style={{ marginRight: 8 }}>浅色第三</Button>

  return(
    <Layout style={{height:'100%',width:"100%", display:'flex',flexDirection:'column'}}>
      <Layout style={{height:200 alignItems:'center'}}>
        <Card style={{background: 'white', alignItems:'center'}}>
          <Button type='primary' style={ModInstallButtonStyle}>1</Button>
          <Button type='secondary' style={ModInstallButtonStyle}>2</Button>
          <Button type='tertiary' style={ModInstallButtonStyle}>3</Button>
        </Card>
      </Layout>
    </Layout>

  )
}

export default ModInstallPage

