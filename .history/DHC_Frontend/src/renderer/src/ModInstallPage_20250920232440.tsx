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
    padding: 20
  }

  return(
    <Layout style={{height:'100%',width:"100%"}}>
      <Layout style={{height:200, width:400}}>
        <Card>
          <Button style={ModInstallButtonStyle}>1</Button>
          <Button style={ModInstallButtonStyle}>2</Button>
          <Button style={ModInstallButtonStyle}>3</Button>
        </Card>
      </Layout>
    </Layout>

  )
}

export default ModInstallPage

