import React from 'react'
import { IconHome, IconServer, IconDownload, IconUpload, IconSetting, IconBookmark, IconEdit, IconCode } from '@douyinfe/semi-icons'

export interface RouteConfig {
  path: string
  label: string
  icon: React.ReactElement
  devOnly?: boolean
}

export const ROUTES = {
  HOME: '/',
  SERVERS: '/servers',
  INSTALL: '/install',
  RESOURCE: '/resource',
  SETTINGS: '/settings',
  WIKI: '/wiki',
  SHADER: '/shader',
  SHADER_V1: '/shader-v1',
  CAR_PACK: '/car-pack',
  CUSTOM_INSTALL: '/custom-install',
  DEV_NET_DEMO: '/dev/net-demo',
  DEV_COMPONENT_TEST: '/dev/component-test',
  DEV_TEST_PLAYGROUND: '/dev/test-playground',
  DEV_COMMUNICATION_LAB: '/dev/communication-lab',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * 旧页面名 -> 路由路径的映射，用于向后兼容过渡期
 * 部分子组件仍通过字符串页面名导航，此映射让 navigate(pageName) 正常工作
 */
export const PAGE_NAME_TO_ROUTE: Record<string, string> = {
  Home: ROUTES.HOME,
  ServerListPage: ROUTES.SERVERS,
  OneClickInstaller: ROUTES.INSTALL,
  ResourceImportManager: ROUTES.RESOURCE,
  SettingsPage: ROUTES.SETTINGS,
  ShutokoWiki: ROUTES.WIKI,
  ShaderInstaller: ROUTES.SHADER,
  ShaderInstallerV1: ROUTES.SHADER_V1,
  CarPackInstaller: ROUTES.CAR_PACK,
  CustomInstallWizard: ROUTES.CUSTOM_INSTALL,
  NetDemo: ROUTES.DEV_NET_DEMO,
  ComponentTest: ROUTES.DEV_COMPONENT_TEST,
  TestPlayground: ROUTES.DEV_TEST_PLAYGROUND,
  CommunicationLab: ROUTES.DEV_COMMUNICATION_LAB,
}

/**
 * 路由路径 -> 旧页面名的反向映射，用于侧栏高亮
 */
export const ROUTE_TO_PAGE_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_NAME_TO_ROUTE).map(([k, v]) => [v, k])
)

export function resolveRoute(pageNameOrPath: string): string {
  return PAGE_NAME_TO_ROUTE[pageNameOrPath] ?? pageNameOrPath
}

export const NAV_ITEMS: RouteConfig[] = [
  { path: ROUTES.HOME, label: 'Home', icon: React.createElement(IconHome, { size: 'large' }) },
  { path: ROUTES.SERVERS, label: '服务器推荐', icon: React.createElement(IconServer, { size: 'large' }) },
  { path: ROUTES.INSTALL, label: '一键式安装', icon: React.createElement(IconDownload, { size: 'large' }) },
  { path: ROUTES.RESOURCE, label: '资源导入管理', icon: React.createElement(IconUpload, { size: 'large' }) },
  { path: ROUTES.SETTINGS, label: '设置', icon: React.createElement(IconSetting, { size: 'large' }) },
  { path: ROUTES.WIKI, label: 'ShutokoWiki', icon: React.createElement(IconBookmark, { size: 'large' }) },
  { path: ROUTES.SHADER, label: '光影安装(新)', icon: React.createElement(IconEdit, { size: 'large' }) },
  { path: ROUTES.SHADER_V1, label: '光影安装(旧)', icon: React.createElement(IconEdit, { size: 'large' }) },
  { path: ROUTES.CAR_PACK, label: 'CarPackInstaller', icon: React.createElement(IconEdit, { size: 'large' }) },
  { path: ROUTES.CUSTOM_INSTALL, label: '自定义安装向导', icon: React.createElement(IconSetting, { size: 'large' }) },
  { path: ROUTES.DEV_NET_DEMO, label: 'NetDemo', icon: React.createElement(IconEdit, { size: 'large' }), devOnly: true },
  { path: ROUTES.DEV_COMPONENT_TEST, label: 'ComponentTest', icon: React.createElement(IconEdit, { size: 'large' }), devOnly: true },
  { path: ROUTES.DEV_TEST_PLAYGROUND, label: '测试实验室', icon: React.createElement(IconCode, { size: 'large' }), devOnly: true },
  { path: ROUTES.DEV_COMMUNICATION_LAB, label: '通信实验室(新手)', icon: React.createElement(IconCode, { size: 'large' }), devOnly: true },
]
