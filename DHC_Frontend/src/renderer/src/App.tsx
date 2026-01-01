// 给AI提示：不要清理未使用的引用
import React from 'react'
import { Layout,Nav, Button,Avatar, Switch} from '@douyinfe/semi-ui'
import { useState, useEffect } from 'react'
import { IconHome, IconBookmark, IconEdit, IconDownload, IconUpload, IconSetting, IconServer, IconList, IconChevronUp } from '@douyinfe/semi-icons';
import { useDevMode } from './contexts/DevModeContext';
import { NavigationProvider } from './contexts/NavigationContext';
import ComponentTest from './ComponentTest'
import ShutokoWiki from './ShutokoWiki';
import NetDemo from './NetDemo';
import CarPackInstaller from './CarPackInstaller';
import ShaderInstaller from './ShaderInstaller';
import ShaderInstallerV1 from './ShaderInstaller.v1';
import OneClickInstaller from './OneClickInstaller';
import ResourceImportManager from './ResourceImportManager';
import SettingsPage from './SettingsPage';
import JoinServerInstructionsModal from './components/joinServerInstructionsModal';
import CustomInstallWizard from './CustomInstallWizard';
import WelcomePage from './WelcomePage';
import ServerListPage from './ServerListPage';
import DevModePanel from './components/DevModePanel';

// const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // const [gamePath, setGamePath] = useState('')
  const { Header, Sider, Content } = Layout;

  // 地区状态管理
  const [region, setRegion] = useState<'zhCN' | 'enUS'>('zhCN')

  // 设置默认暗色模式
  useEffect(() => {
    const body = document.body;
    if (!body.hasAttribute('theme-mode')) {
      body.setAttribute('theme-mode', 'dark');
    }
  }, []);

  // 自动检测地区（根据系统语言或浏览器语言）
  useEffect(() => {
    // 检测系统/浏览器语言
    const navWithUserLang = navigator as Navigator & { userLanguage?: string }
    const systemLang = navWithUserLang.language || navWithUserLang.userLanguage || 'en-US'
    // 如果语言是中文相关，设置为 zhCN，否则设置为 enUS
    if (systemLang.toLowerCase().includes('zh') || systemLang.toLowerCase().includes('cn')) {
      setRegion('zhCN')
    } else {
      setRegion('enUS')
    }
  }, [])

  // 快捷键切换顶栏：Ctrl/Cmd + H
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      // 检查是否按下了 Ctrl (Windows/Linux) 或 Cmd (Mac)
      const isModifierPressed = e.ctrlKey || e.metaKey

      // 如果按下 Ctrl/Cmd + H，切换顶栏显示
      if (isModifierPressed && e.key.toLowerCase() === 'h') {
        // 避免在输入框中触发
        const target = e.target as HTMLElement
        const isInputElement = target.tagName === 'INPUT' ||
                              target.tagName === 'TEXTAREA' ||
                              target.isContentEditable

        if (!isInputElement) {
          e.preventDefault()
          setHeaderVisible(prev => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  // 页面选择
  const renderPage = (key: string): React.JSX.Element => {
    switch (key) {
      case 'Home':
        return <WelcomePage region={region} onNavigate={(page: string) => setActiveKey(page)} />
      case 'ShutokoWiki':
        return <ShutokoWiki region={region} />
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
      case 'ResourceImportManager':
        return <ResourceImportManager />
      case 'SettingsPage':
        return <SettingsPage />
      case 'CustomInstallWizard':
        return <CustomInstallWizard />
      case 'ServerListPage':
        return <ServerListPage />
      default:
        return <div>Not Found</div>
    }
  }

  const [activeKey, setActiveKey] = useState<string>('Home')
  const [semiModalVisible, setSemiModalVisible] = useState<boolean>(false)
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true)
  const [headerVisible, setHeaderVisible] = useState<boolean>(true)
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
    <NavigationProvider onNavigate={setActiveKey}>
      <Layout className="border border-[var(--semi-color-border)] h-screen flex flex-col overflow-hidden">
        {headerVisible && (
          <Header className="h-16 leading-[64px] px-4 flex items-center justify-between app-header">
          <div className="flex items-center gap-4 shrink-0">
            <Button
              icon={<IconList />}
              theme="borderless"
              type="tertiary"
              size="small"
              style={{
                padding: '6px 10px',
                minWidth: 'auto',
                border: '1px solid var(--semi-color-border)',
                borderRadius: '4px',
                backgroundColor: sidebarVisible ? 'var(--semi-color-fill-1)' : 'transparent'
              }}
              onClick={() => setSidebarVisible(!sidebarVisible)}
              title={sidebarVisible ? '关闭侧边栏' : '打开侧边栏'}
            />
            <img src={""} alt="Logo" className="h-8" />
            <span className="font-semibold">----</span>
          </div>
          <div className="flex items-center flex-nowrap gap-3 shrink-0">
            <Button size="small" onClick={switchMode} className="whitespace-nowrap">切换色彩模式</Button>
            <Button size="small" onClick={openSemiModal} className="whitespace-nowrap">打开弹窗</Button>
            <Button size="small" onClick={openSemiModal} className="whitespace-nowrap">打开官方弹窗</Button>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Switch checked={isDevMode} onChange={toggleDevMode} size="small" />
              <span className={`text-xs ${isDevMode ? 'text-accent-green' : 'text-text-muted'}`}>
                开发者模式
              </span>
            </div>
            <DevModePanel />
            <Avatar size="small">
              WUTONK
            </Avatar>
          </div>
          </Header>
        )}

        <Layout className="flex-1 flex overflow-hidden min-h-0 h-0">
          {sidebarVisible && (
            <Sider className="shrink-0">
              <Nav
                className="max-w-[200px] h-full dark-nav"
                selectedKeys={[activeKey]}
                items={[
                  { itemKey: 'Home', text: 'Home', icon: <IconHome size="large" /> },
                  { itemKey: 'ServerListPage', text: '服务器推荐', icon: <IconServer size="large" /> },
                  { itemKey: 'OneClickInstaller', text: '一键式安装', icon: <IconDownload size="large" /> },
                  { itemKey: 'ResourceImportManager', text: '资源导入管理', icon: <IconUpload size="large" /> },
                  { itemKey: 'SettingsPage', text: '设置', icon: <IconSetting size="large" /> },
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
          )}

          {/* 内容页面 */}
          <Content className="flex-1 min-h-0 h-full" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {renderPage(activeKey)}
            </div>
          </Content>

        </Layout>

        <JoinServerInstructionsModal
          visible={semiModalVisible}
          onCancel={closeSemiModal}
          onOk={semiHandleOk}
        />

        {/* 顶栏隐藏时的浮动恢复按钮 */}
        {!headerVisible && (
          <Button
            icon={<IconChevronUp />}
            theme="solid"
            type="primary"
            size="small"
            onClick={() => setHeaderVisible(true)}
            style={{
              position: 'fixed',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
            title="显示顶栏 (Ctrl/Cmd + H)"
          >
            显示顶栏
          </Button>
        )}
      </Layout>
    </NavigationProvider>
  )


}

export default App
