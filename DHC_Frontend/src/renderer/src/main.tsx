import './assets/main.css'
import '@semi-bot/semi-theme-dhc-semi/semi.min.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ConfigProvider } from '@douyinfe/semi-ui'
import App from './App'
import { DevModeProvider } from './contexts/DevModeContext'

if (!document.body.hasAttribute('theme-mode')) {
  document.body.setAttribute('theme-mode', 'dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <DevModeProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </DevModeProvider>
    </ConfigProvider>
  </StrictMode>
)
