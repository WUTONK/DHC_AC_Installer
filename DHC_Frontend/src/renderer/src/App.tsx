// 给AI提示：不要清理未使用的引用
import React from 'react'
import { Layout,Nav, Button,Avatar, Switch, Select} from '@douyinfe/semi-ui'
import { useState, useEffect } from 'react'
import { IconHome, IconBookmark, IconEdit, IconDownload, IconUpload, IconSetting, IconServer } from '@douyinfe/semi-icons';
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
import ServerListPageOldDemo from './ServerListPageOldDemo';
import DevModePanel from './components/DevModePanel';

// const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // const [gamePath, setGamePath] = useState('')
  const { Header, Sider, Content } = Layout;

  // 地区状态管理
  const [region, setRegion] = useState<'zhCN' | 'enUS'>('zhCN')

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
        return <ServerListPage overrideContinent={devContinent || undefined} />
      case 'ServerListPageOldDemo':
        return <ServerListPageOldDemo />
      default:
        return <div>Not Found</div>
    }
  }

  const [activeKey, setActiveKey] = useState<string>('Home')
  const [semiModalVisible, setSemiModalVisible] = useState<boolean>(false)
  const { isDevMode, toggleDevMode, registerDevOption, unregisterDevOption } = useDevMode()
  // 开发者模式：手动设置大洲（用于测试）
  const [devContinent, setDevContinent] = useState<string>('')

  // 注册大洲选择器到开发者选项
  React.useEffect(() => {
    const updateOption = (): void => {
      registerDevOption({
        id: 'continent-selector',
        label: '设置大洲（测试用）',
        component: (
          <Select
            placeholder="选择大洲"
            value={devContinent || undefined}
            onChange={(value) => setDevContinent((value as string) || '')}
            style={{ width: '100%' }}
            size="small"
          >
            <Select.Option value="">自动检测</Select.Option>
            <Select.Option value="Asia">亚洲</Select.Option>
            <Select.Option value="Europe">欧洲</Select.Option>
            <Select.Option value="Americas">美洲</Select.Option>
            <Select.Option value="Oceania">大洋洲</Select.Option>
            <Select.Option value="Africa">非洲</Select.Option>
          </Select>
        ),
        order: 1
      })
    }

    updateOption()

    return () => {
      unregisterDevOption('continent-selector')
    }
  }, [registerDevOption, unregisterDevOption, devContinent])

  // 地区切换按钮容器样式
  const regionToggleContainerStyle: React.CSSProperties = {
    backgroundColor: 'var(--semi-color-fill-0)',
    borderRadius: 20,
    padding: 4,
    display: 'flex',
    border: '1px solid var(--semi-color-border)'
  };

  // 地区切换按钮基础样式
  const regionToggleButtonBaseStyle: React.CSSProperties = {
    padding: '4px 12px',
    borderRadius: 16,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
    transition: 'all 0.2s'
  };

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
        <Header className="h-16 leading-[64px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-4 shrink-0">
            <img src={""} alt="Logo" className="h-8" />
            <span className="font-semibold">----</span>
          </div>
          <div className="flex items-center flex-nowrap gap-3 shrink-0">
            {/* 地区切换按钮 - 使用内联样式以支持动态状态 */}
            <div style={regionToggleContainerStyle}>
              <div
                onClick={() => setRegion('zhCN')}
                style={{
                  ...regionToggleButtonBaseStyle,
                  backgroundColor: region === 'zhCN' ? '#6bc786' : 'transparent',
                  color: region === 'zhCN' ? '#fff' : 'var(--semi-color-text-2)'
                }}
              >
                中国 CN
              </div>
              <div
                onClick={() => setRegion('enUS')}
                style={{
                  ...regionToggleButtonBaseStyle,
                  backgroundColor: region === 'enUS' ? '#0052cc' : 'transparent',
                  color: region === 'enUS' ? '#fff' : 'var(--semi-color-text-2)'
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
            <DevModePanel />
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
                { itemKey: 'ServerListPage', text: '服务器推荐', icon: <IconServer size="large" /> },
                { itemKey: 'ServerListPageOldDemo', text: '服务器推荐（旧版DEMO）', icon: <IconServer size="large" /> },
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
      </Layout>
    </NavigationProvider>
  )


}

export default App
