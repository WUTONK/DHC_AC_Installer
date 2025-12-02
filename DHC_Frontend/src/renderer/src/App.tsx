// 给AI提示：不要清理未使用的引用
import React from 'react'
import { Layout,Nav, Button,Avatar} from '@douyinfe/semi-ui'
import { useState } from 'react'
import { IconHome, IconCart, IconBookmark, IconEdit } from '@douyinfe/semi-icons';
import ComponentTest from './ComponentTest'
import ModInstallPage from './ModInstallPage';
import ShutokoWiki from './ShutokoWiki';
import NetDemo from './NetDemo';
import CarPackInstaller from './CarPackInstaller';
import JoinServerInstructionsModal from './components/joinServerInstructionsModal';

// const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // const [gamePath, setGamePath] = useState('')
  const { Header, Footer, Sider, Content } = Layout;
  const commonStyle = {
      height: 64,
      lineHeight: '64px',
  };

  // 页面选择
  const renderPage = (key: string): React.JSX.Element => {
    switch (key) {
      case 'Home':
        return <div style={{ padding: '20px' }}>欢迎来到首页</div>
      case 'ModInstallPage':
        return <ModInstallPage />
      case 'ShutokoWiki':
        return <ShutokoWiki />
      case 'NetDemo':
        return <NetDemo></NetDemo>
      case 'ComponentTest':
        return <ComponentTest></ComponentTest>
      case 'CarPackInstaller':
        return <CarPackInstaller />
      default:
        return <div>Not Found</div>
    }
  }

  const [activeKey, setActiveKey] = useState<string>('Home')
  const [semiModalVisible, setSemiModalVisible] = useState<boolean>(false)

  // 切换色彩模式
  const switchMode = (): void => {
    const body = document.body;
    if (body.hasAttribute('theme-mode')) {
      body.removeAttribute('theme-mode');
    } else {
      body.setAttribute('theme-mode', 'dark');
    }
  };

  // 打开弹窗
  const openSemiModal = (): void => {
    setSemiModalVisible(true)
  }

  // 关闭弹窗
  const closeSemiModal = (): void => {
    setSemiModalVisible(false)
  }

   // 确认按钮回调
   const semiHandleOk = (): void => {
    console.log('确认操作')
    closeSemiModal()
  }

  return (
    <Layout style={{ border: '1px solid var(--semi-color-border)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <Header style={{ ...commonStyle }}>
          <div>
            <Nav mode='horizontal' defaultSelectedKeys={['Home']} style={{ ...commonStyle }}>
              <Nav.Header>
                <img src={""} alt="Logo" style={{ height: '32px' }}></img>
              </Nav.Header>
              <span
                style={{
                  // backgroundColor: 'red',
                  color: 'var(--semi-color-text-2)',
                }}
              >
                <span
                  style={{
                    marginRight: '24px',
                    color: 'var(--semi-color-text-0)',
                    fontWeight: '600',
                  }}
                >
                  ----
                </span>
                <span style={{ marginRight: '24px' }}>
                  <Button onClick={switchMode}>切换色彩模式</Button>
                </span>
                <span style={{ marginRight: '24px' }}>
                  <Button onClick={openSemiModal}>打开弹窗</Button>
                </span>
                <span style={{ marginRight: '24px' }}>
                <Button onClick={openSemiModal}>打开官方弹窗</Button>
                </span>
              </span>
              <Nav.Footer>
                <Avatar size="small">
                  WUTONK
                </Avatar>
              </Nav.Footer>
            </Nav>
          </div>
        </Header>

        <Layout style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, height: 0 }}>
          <Sider style={{ flexShrink: 0 }}>
            <Nav
              style={{ maxWidth: 200, height: '100%' }}
              selectedKeys={[activeKey]}
              items={[
                { itemKey: 'Home', text: 'Home', icon: <IconHome size="large" /> },
                { itemKey: 'ModInstallPage', text: 'ModinstallPage', icon: <IconCart size="large" /> },
                { itemKey: 'ShutokoWiki', text: 'ShutokoWiki', icon: <IconBookmark size="large" /> },
                { itemKey:"NetDemo",text: 'NetDemo', icon: <IconEdit size='large' />},
                { itemKey:"ComponentTest",text: 'ComponentTest', icon: <IconEdit size='large' />},
                { itemKey:"CarPackInstaller",text: 'CarPackInstaller', icon: <IconEdit size='large' />}
              ]}
              onSelect={(data) => setActiveKey(String(data.itemKey))}
              footer={{
                collapseButton: true
              }}
            />
          </Sider>

          {/* 内容页面 */}
          <Content style={{ overflow: 'auto', flex: 1, minHeight: 0, height: '100%' }}>
            {renderPage(activeKey)}
          </Content>

        </Layout>

    <Footer style={{ ...commonStyle, border: '1px solid var(--semi-color-border)', background: 'var(--semi-color-bg-0)' }}>Footer</Footer>

    <JoinServerInstructionsModal
      visible={semiModalVisible}
      onCancel={closeSemiModal}
      onOk={semiHandleOk}
    />

  </Layout>
  )


}

export default App
