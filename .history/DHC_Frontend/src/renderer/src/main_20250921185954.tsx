import './assets/main.css'
import '@douyinfe/semi-ui/dist/css/semi.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, Notification } from '@douyinfe/semi-ui'
import App from './App'

// 配置Notification
Notification.config({
  top: 20,
  duration: 3,
  getContainer: () => document.body,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>
)
