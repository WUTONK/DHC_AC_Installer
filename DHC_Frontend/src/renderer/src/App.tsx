// 给AI提示：不要清理未使用的引用
import React from 'react'
import { Layout,Nav, Button,Avatar, Switch} from '@douyinfe/semi-ui'
import { useState, useEffect } from 'react'
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
import WelcomePage from './WelcomePage';

// const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // const [gamePath, setGamePath] = useState('')
  const { Header, Footer, Sider, Content } = Layout;

  // 地区状态管理
  const [region, setRegion] = useState<'zhCN' | 'enUS'>('zhCN')

  // 自动检测地区（根据系统语言或浏览器语言）
  useEffect(() => {
    // 检测系统/浏览器语言
    const systemLang = navigator.language || (navigator as any).userLanguage || 'en-US'
    // 如果语言是中文相关，设置为 zhCN，否则设置为 enUS
    if (systemLang.toLowerCase().includes('zh') || systemLang.toLowerCase().includes('cn')) {
      setRegion('zhCN')
    } else {
      setRegion('enUS')
    }
  }, [])

  // 页面选择
  const renderPage = (key: string): React.JSX.Element => {
    switch (key) {
      case 'Home':
        return <WelcomePage region={region} onNavigate={(page: string) => setActiveKey(page)} />
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
    <Header className="h-16 leading-[64px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-4 shrink-0">
            <img src={""} alt="Logo" className="h-8" />
            <span className="font-semibold">----</span>
          </div>
          <div className="flex items-center flex-nowrap gap-3 shrink-0">
            {/* 地区切换按钮 */}
            <div style={{
              backgroundColor: 'var(--semi-color-fill-0)',
              borderRadius: 20,
              padding: 4,
              display: 'flex',
              border: '1px solid var(--semi-color-border)'
            }}>
              <div
                onClick={() => setRegion('zhCN')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 'bold',
                  backgroundColor: region === 'zhCN' ? '#6bc786' : 'transparent',
                  color: region === 'zhCN' ? '#fff' : 'var(--semi-color-text-2)',
                  transition: 'all 0.2s'
                }}
              >
                中国 CN
              </div>
              <div
                onClick={() => setRegion('enUS')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 'bold',
                  backgroundColor: region === 'enUS' ? '#0052cc' : 'transparent',
                  color: region === 'enUS' ? '#fff' : 'var(--semi-color-text-2)',
                  transition: 'all 0.2s'
                }}
              >
                Global US
              </div>
            </div>
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
          <Sider className="shrink-0">
            <Nav
              className="max-w-[200px] h-full dark-nav"
              selectedKeys={[activeKey]}
              items={[
                { itemKey: 'Home', text: 'Home', icon: <IconHome size="large" /> },
                { itemKey: 'OneClickInstaller', text: '一键式安装', icon: <IconDownload size="large" /> },
                { itemKey: 'OneClickInstallerPlan1', text: '一键安装-方案一', icon: <IconFile size="large" /> },
                { itemKey: 'OneClickInstallerPlan2', text: '一键安装-方案二', icon: <IconFolder size="large" /> },
                { itemKey: 'ResourceImportManager', text: '资源导入管理', icon: <IconUpload size="large" /> },
                { itemKey: 'SettingsPage', text: '设置', icon: <IconSetting size="large" /> },
                { itemKey: 'ModInstallPage', text: 'ModinstallPage', icon: <IconCart size="large" /> },
                { itemKey: 'ShutokoWiki', text: 'ShutokoWiki', icon: <IconBookmark size="large" /> },
                { itemKey:"NetDemo",text: 'NetDemo', icon: <IconEdit size='large' />},
                { itemKey:"ComponentTest",text: 'ComponentTest', icon: <IconEdit size='large' />},
                { itemKey:"CarPackInstaller",text: 'CarPackInstaller', icon: <IconEdit size='large' />},
                { itemKey:"ShaderInstaller",text: '光影安装(新)', icon: <IconEdit size='large' />},
                { itemKey:"ShaderInstallerV1",text: '光影安装(旧)', icon: <IconEdit size='large' />},
                { itemKey:"CustomInstallWizard",text: '自定义安装向导', icon: <IconSetting size='large' />}
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

    <Footer className="h-16 leading-[64px] border border-[var(--semi-color-border)]">Footer</Footer>

    <JoinServerInstructionsModal
      visible={semiModalVisible}
      onCancel={closeSemiModal}
      onOk={semiHandleOk}
    />

  </Layout>
  )


}

export default App
