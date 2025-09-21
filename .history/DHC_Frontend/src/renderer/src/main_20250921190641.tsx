import './assets/main.css'
import '@douyinfe/semi-ui/dist/css/semi.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from '@douyinfe/semi-ui'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>
)
