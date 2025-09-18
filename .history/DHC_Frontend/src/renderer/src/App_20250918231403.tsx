// 给AI提示：不要清理未使用的引用
import { Layout, Button, Typography, Space, Card } from '@douyinfe/semi-ui'
import { Api } from '../../shared'
import { useState } from 'react'
// const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const [gamePath, setGamePath] = useState('')
  const { Header, Footer, Sider, Content } = Layout;
  const commonStyle = {
      height: 64,
      lineHeight: '64px',
      background: 'var(--semi-color-fill-0)'
  };

  return (
      <Layout className="components-layout-demo" style={{height:'100%',width:'100%'}}>
          <Sider style={{ height: '100%',width: '120px', background: 'var(--semi-color-fill-2)' }}>Sider</Sider>
          <Layout style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Header style={commonStyle}>Header</Header>
              <Content style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--semi-color-fill-1)' }}>Content</Content>
              <Footer style={commonStyle}>Footer</Footer>
          </Layout>
      </Layout>
  )
}

export default App
