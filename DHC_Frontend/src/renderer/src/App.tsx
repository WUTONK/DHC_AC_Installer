import React from 'react'
import { Layout, Nav, Button, Switch } from '@douyinfe/semi-ui'
import { useState, useEffect, useMemo } from 'react'
import { IconList, IconChevronUp } from '@douyinfe/semi-icons'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useDevMode } from './contexts/DevModeContext'
import { NavigationProvider } from './contexts/NavigationContext'
import { NAV_ITEMS, ROUTES, ROUTE_TO_PAGE_NAME } from './routes'

import ComponentTest from './ComponentTest'
import ShutokoWiki from './ShutokoWiki'
import NetDemo from './NetDemo'
import CarPackInstaller from './CarPackInstaller'
import ShaderInstaller from './ShaderInstaller'
import ShaderInstallerV1 from './ShaderInstaller.v1'
import OneClickInstaller from './OneClickInstaller'
import ResourceImportManager from './ResourceImportManager'
import SettingsPage from './SettingsPage'
import JoinServerInstructionsModal from './components/joinServerInstructionsModal'
import CustomInstallWizard from './CustomInstallWizard'
import WelcomePage from './WelcomePage'
import ServerListPage from './ServerListPage'
import DevModePanel from './components/DevModePanel'
import TestPlayground from './TestPlayground'
import CommunicationLab from './CommunicationLab'

function App(): React.JSX.Element {
  const { Header, Sider, Content } = Layout

  const [region, setRegion] = useState<'zhCN' | 'enUS'>('zhCN')

  useEffect(() => {
    const body = document.body
    if (!body.hasAttribute('theme-mode')) {
      body.setAttribute('theme-mode', 'dark')
    }
  }, [])

  useEffect(() => {
    const navWithUserLang = navigator as Navigator & { userLanguage?: string }
    const systemLang = navWithUserLang.language || navWithUserLang.userLanguage || 'en-US'
    if (systemLang.toLowerCase().includes('zh') || systemLang.toLowerCase().includes('cn')) {
      setRegion('zhCN')
    } else {
      setRegion('enUS')
    }
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      const isModifierPressed = e.ctrlKey || e.metaKey
      if (isModifierPressed && e.key.toLowerCase() === 'h') {
        const target = e.target as HTMLElement
        const isInputElement =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        if (!isInputElement) {
          e.preventDefault()
          setHeaderVisible((prev) => !prev)
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  const [semiModalVisible, setSemiModalVisible] = useState<boolean>(false)
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true)
  const [headerVisible, setHeaderVisible] = useState<boolean>(true)
  const { isDevMode, toggleDevMode } = useDevMode()

  const location = useLocation()
  const routerNavigate = useNavigate()

  const selectedNavKey = useMemo(() => {
    const pageName = ROUTE_TO_PAGE_NAME[location.pathname]
    return pageName ? [pageName] : []
  }, [location.pathname])

  const navItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => !item.devOnly || isDevMode).map((item) => ({
      itemKey: ROUTE_TO_PAGE_NAME[item.path] || item.path,
      text: item.label,
      icon: item.icon,
      _routePath: item.path
    }))
  }, [isDevMode])

  const switchMode = (): void => {
    const body = document.body
    if (body.hasAttribute('theme-mode')) {
      body.removeAttribute('theme-mode')
    } else {
      body.setAttribute('theme-mode', 'dark')
    }
  }

  const closeSemiModal = (): void => {
    setSemiModalVisible(false)
  }

  const semiHandleOk = (): void => {
    closeSemiModal()
  }

  return (
    <NavigationProvider>
      <Layout className="h-screen flex flex-col overflow-hidden">
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
                  backgroundColor: sidebarVisible
                    ? 'var(--semi-color-fill-1)'
                    : 'transparent'
                }}
                onClick={() => setSidebarVisible(!sidebarVisible)}
                title={sidebarVisible ? '关闭侧边栏' : '打开侧边栏'}
              />
              <img src={''} alt="Logo" className="h-8" />
              <span className="font-semibold">----</span>
            </div>
            <div className="flex items-center flex-nowrap gap-3 shrink-0">
              <Button size="small" onClick={switchMode} className="whitespace-nowrap">
                切换色彩模式
              </Button>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Switch checked={isDevMode} onChange={toggleDevMode} size="small" />
                <span
                  className={`text-xs ${isDevMode ? 'text-accent-green' : 'text-text-muted'}`}
                >
                  开发者模式
                </span>
              </div>
              <DevModePanel />
            </div>
          </Header>
        )}

        <Layout className="flex-1 flex overflow-hidden min-h-0 h-0">
          {sidebarVisible && (
            <Sider className="shrink-0">
              <Nav
                className="max-w-[200px] h-full dark-nav"
                selectedKeys={selectedNavKey}
                items={navItems}
                onSelect={(data) => {
                  const selected = navItems.find(
                    (item) => item.itemKey === String(data.itemKey)
                  )
                  if (selected) {
                    routerNavigate((selected as typeof navItems[number] & { _routePath: string })._routePath)
                  }
                }}
                footer={{ collapseButton: true }}
              />
            </Sider>
          )}

          <Content
            className="flex-1 min-h-0 h-full"
            style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Routes>
                <Route path={ROUTES.HOME} element={<WelcomePage region={region} />} />
                <Route path={ROUTES.SERVERS} element={<ServerListPage />} />
                <Route path={ROUTES.INSTALL} element={<OneClickInstaller />} />
                <Route path={ROUTES.RESOURCE} element={<ResourceImportManager />} />
                <Route
                  path={ROUTES.SETTINGS}
                  element={<SettingsPage />}
                />
                <Route path={ROUTES.WIKI} element={<ShutokoWiki region={region} />} />
                <Route path={ROUTES.SHADER} element={<ShaderInstaller />} />
                <Route path={ROUTES.SHADER_V1} element={<ShaderInstallerV1 />} />
                <Route path={ROUTES.CAR_PACK} element={<CarPackInstaller />} />
                <Route path={ROUTES.CUSTOM_INSTALL} element={<CustomInstallWizard />} />
                {isDevMode && (
                  <>
                    <Route path={ROUTES.DEV_NET_DEMO} element={<NetDemo />} />
                    <Route path={ROUTES.DEV_COMPONENT_TEST} element={<ComponentTest />} />
                    <Route path={ROUTES.DEV_TEST_PLAYGROUND} element={<TestPlayground />} />
                    <Route path={ROUTES.DEV_COMMUNICATION_LAB} element={<CommunicationLab />} />
                  </>
                )}
                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
              </Routes>
            </div>
          </Content>
        </Layout>

        <JoinServerInstructionsModal
          visible={semiModalVisible}
          onCancel={closeSemiModal}
          onOk={semiHandleOk}
        />

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
