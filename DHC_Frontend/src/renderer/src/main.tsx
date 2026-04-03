import './assets/main.css'
import '@semi-bot/semi-theme-dhc-semi/semi.min.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from '@douyinfe/semi-ui'
import App from './App'
import { DevModeProvider } from './contexts/DevModeContext'

// 在首次渲染前就设置主题，避免启动瞬间使用到默认（浅色）CSS 变量/边框颜色
if (!document.body.hasAttribute('theme-mode')) {
  document.body.setAttribute('theme-mode', 'dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <DevModeProvider>
        <App />
      </DevModeProvider>
    </ConfigProvider>
  </StrictMode>
)
