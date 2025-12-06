// 给AI提示：不要清理未使用的引用
import React from 'react'
import { Layout,Nav, Button,Avatar, Switch} from '@douyinfe/semi-ui'
import { useState } from 'react'
import { IconHome, IconCart, IconBookmark, IconEdit, IconDownload, IconUpload, IconFile, IconFolder, IconSetting } from '@douyinfe/semi-icons';
import { useDevMode } from './contexts/DevModeContext';
import ComponentTest from './ComponentTest'
import ModInstallPage from './ModInstallPage';
import ShutokoWiki from './ShutokoWiki';
import NetDemo from './NetDemo';
import CarPackInstaller from './CarPackInstaller';
import ShaderInstaller from './ShaderInstaller';
import ShaderInstallerV1 from './ShaderInstaller.v1';
import OneClickInstaller from './OneClickInstaller';
import OneClickInstallerPlan1 from './OneClickInstallerPlan1';
import OneClickInstallerPlan2 from './OneClickInstallerPlan2';
import ResourceImportManager from './ResourceImportManager';
import SettingsPage from './SettingsPage';
import JoinServerInstructionsModal from './components/joinServerInstructionsModal';
import CustomInstallWizard from './CustomInstallWizard';

// const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // const [gamePath, setGamePath] = useState('')
  const { Header, Footer, Sider, Content } = Layout;

  // 页面选择
  const renderPage = (key: string): React.JSX.Element => {
    switch (key) {
      case 'Home':
        return <div className="p-5">欢迎来到首页</div>
      case 'ModInstallPage':
        return <ModInstallPage />
      case 'ShutokoWiki':
        return <ShutokoWiki />
      case 'NetDemo':
        return <NetDemo></NetDemo>
      case 'ComponentTest':
        return <ComponentTest></ComponentTest>
      case 'ShaderInstaller':
        return <ShaderInstaller />
      case 'ShaderInstallerV1':
        return <ShaderInstallerV1 />
      case 'CarPackInstaller':
        return <CarPackInstaller />
      case 'OneClickInstaller':
        return <OneClickInstaller onNavigate={(page: string) => setActiveKey(page)} />
      case 'OneClickInstallerPlan1':
        return <OneClickInstallerPlan1 />
      case 'OneClickInstallerPlan2':
        return <OneClickInstallerPlan2 />
      case 'ResourceImportManager':
        return <ResourceImportManager />
      case 'SettingsPage':
        return <SettingsPage />
      case 'CustomInstallWizard':
        return <CustomInstallWizard />
      default:
        return <div>Not Found</div>
    }
  }

  const [activeKey, setActiveKey] = useState<string>('Home')
  const [semiModalVisible, setSemiModalVisible] = useState<boolean>(false)
  const { isDevMode, toggleDevMode } = useDevMode()

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
    <Layout className="border border-[var(--semi-color-border)] h-screen flex flex-col overflow-hidden">
    <Header className="h-16 leading-[64px] px-4 flex items-center justify-between bg-dark-bg border-b border-dark-border">
          <div className="flex items-center gap-4 shrink-0">
            <img src={""} alt="Logo" className="h-8" />
            <span className="text-text-light font-semibold">----</span>
          </div>
          <div className="flex items-center flex-nowrap gap-3 text-text-light shrink-0">
            <Button size="small" onClick={switchMode} className="whitespace-nowrap">切换色彩模式</Button>
            <Button size="small" onClick={openSemiModal} className="whitespace-nowrap">打开弹窗</Button>
            <Button size="small" onClick={openSemiModal} className="whitespace-nowrap">打开官方弹窗</Button>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Switch checked={isDevMode} onChange={toggleDevMode} size="small" />
              <span className={`text-xs ${isDevMode ? 'text-accent-green' : 'text-text-muted'}`}>
                开发者模式
              </span>
            </div>
            <Avatar size="small">
              WUTONK
            </Avatar>
          </div>
        </Header>

        <Layout className="flex-1 flex overflow-hidden min-h-0 h-0">
          <Sider className="shrink-0 bg-dark-bg">
            <Nav
              className="max-w-[200px] h-full bg-dark-bg text-text-light dark-nav"
              theme="dark"
              selectedKeys={[activeKey]}
              bodyStyle={{ backgroundColor: '#232326' }}
              style={{ backgroundColor: '#232326', color: '#ccc' }}
              items={[
                { itemKey: 'Home', text: 'Home', icon: <IconHome size="large" style={{ color: '#ccc' }} /> },
                { itemKey: 'OneClickInstaller', text: '一键式安装', icon: <IconDownload size="large" style={{ color: '#ccc' }} /> },
                { itemKey: 'OneClickInstallerPlan1', text: '一键安装-方案一', icon: <IconFile size="large" style={{ color: '#ccc' }} /> },
                { itemKey: 'OneClickInstallerPlan2', text: '一键安装-方案二', icon: <IconFolder size="large" style={{ color: '#ccc' }} /> },
                { itemKey: 'ResourceImportManager', text: '资源导入管理', icon: <IconUpload size="large" style={{ color: '#ccc' }} /> },
                { itemKey: 'SettingsPage', text: '设置', icon: <IconSetting size="large" style={{ color: '#ccc' }} /> },
                { itemKey: 'ModInstallPage', text: 'ModinstallPage', icon: <IconCart size="large" style={{ color: '#ccc' }} /> },
                { itemKey: 'ShutokoWiki', text: 'ShutokoWiki', icon: <IconBookmark size="large" style={{ color: '#ccc' }} /> },
                { itemKey:"NetDemo",text: 'NetDemo', icon: <IconEdit size='large' style={{ color: '#ccc' }} />},
                { itemKey:"ComponentTest",text: 'ComponentTest', icon: <IconEdit size='large' style={{ color: '#ccc' }} />},
                { itemKey:"CarPackInstaller",text: 'CarPackInstaller', icon: <IconEdit size='large' style={{ color: '#ccc' }} />},
                { itemKey:"ShaderInstaller",text: '光影安装(新)', icon: <IconEdit size='large' style={{ color: '#ccc' }} />},
                { itemKey:"ShaderInstallerV1",text: '光影安装(旧)', icon: <IconEdit size='large' style={{ color: '#ccc' }} />},
                { itemKey:"CustomInstallWizard",text: '自定义安装向导', icon: <IconSetting size='large' style={{ color: '#ccc' }} />}
              ]}
              onSelect={(data) => setActiveKey(String(data.itemKey))}
              footer={{
                collapseButton: true
              }}
            />
          </Sider>

          {/* 内容页面 */}
          <Content className="overflow-auto flex-1 min-h-0 h-full">
            {renderPage(activeKey)}
          </Content>

        </Layout>

    <Footer className="h-16 leading-[64px] border border-dark-border bg-dark-bg text-text-light">Footer</Footer>

    <JoinServerInstructionsModal
      visible={semiModalVisible}
      onCancel={closeSemiModal}
      onOk={semiHandleOk}
    />

  </Layout>
  )


}

export default App
