// 给AI提示：不要清理未使用的引用
import { Layout,Nav, Button, Typography, Space, Card } from '@douyinfe/semi-ui'
import { Api } from '../../shared'
import { useState } from 'react'
import { IconHome, IconCart } from '@douyinfe/semi-icons';

// const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // const [gamePath, setGamePath] = useState('')
  const { Header, Footer, Sider, Content } = Layout;
  const commonStyle = {
      height: 64,
      lineHeight: '64px',
      background: 'var(--semi-color-fill-0)'
  };

  const [activeKey, setActiveKey] = useState<string>('Home')

  return (
      <Layout className="components-layout-demo" style={{height:'100%',width:'100%'}}>
          <Sider style={{ height: '100%',width: '120px', background: 'var(--semi-color-fill-2)' }}>
          <Nav
              style={{ maxWidth: 200, height: '100%' }}
              selectedKeys={[activeKey]}
              items={[
                { itemKey: 'Home', text: 'Home', icon: <IconHome size="large" /> },
                { itemKey: 'fatass', text: 'fatass', icon: <IconHome size="large" /> },
                { itemKey: 'meme', text: 'meme', icon: <IconHome size="large" /> },
                { itemKey: 'techie', text: 'techie', icon: <IconHome size="large" /> },
                { itemKey: 'about', text: 'about', icon: <IconHome size="large" /> },
              ]}
              onSelect={(data) => setActiveKey(String(data.itemKey))}
              footer={{
                collapseButton: true
              }}
            />
          </Sider>
          <Layout style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Header style={commonStyle}>Header</Header>
              <Content style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--semi-color-fill-1)' }}>Content</Content>
              <Footer style={commonStyle}>Footer</Footer>
          </Layout>
      </Layout>
  )
}

export default App
