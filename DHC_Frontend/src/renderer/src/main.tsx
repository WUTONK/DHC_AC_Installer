import './assets/main.css'
import '@semi-bot/semi-theme-dhc-semi/semi.min.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from '@douyinfe/semi-ui'
import App from './App'
import { DevModeProvider } from './contexts/DevModeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <DevModeProvider>
        <App />
      </DevModeProvider>
    </ConfigProvider>
  </StrictMode>
)
