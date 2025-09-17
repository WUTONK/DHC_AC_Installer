import UserManagement from './components/UserManagement'
import { useState, useEffect } from 'react'
import { ApiService } from './services/api'

function App(): React.JSX.Element {
  const [backendStatus, setBackendStatus] = useState<string>('检查中...')
  const [showUserManagement, setShowUserManagement] = useState(false)

  // 检查后端服务状态
  const checkBackendStatus = async () => {
    try {
      const response = await ApiService.healthCheck()
      if (response.success) {
        setBackendStatus('✅ 后端服务运行正常')
      } else {
        setBackendStatus('❌ 后端服务异常')
      }
    } catch (error) {
      setBackendStatus('❌ 无法连接到后端服务')
      console.error('后端连接失败:', error)
    }
  }

  useEffect(() => {
    // 延迟检查后端状态，给后端服务启动时间
    const timer = setTimeout(() => {
      checkBackendStatus()
      // 每3秒检查一次后端状态
      const interval = setInterval(checkBackendStatus, 3000)
      return () => clearInterval(interval)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderBottom: '1px solid #dee2e6',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
          DHC 应用程序
        </h1>
        <p style={{ margin: '0 0 20px 0', color: '#666' }}>
          Electron + React + Go (Gin) 前后端通信示例
        </p>

        <div style={{ marginBottom: '20px' }}>
          <span style={{
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: backendStatus.includes('✅') ? '#d4edda' : '#f8d7da',
            color: backendStatus.includes('✅') ? '#155724' : '#721c24',
            fontSize: '14px'
          }}>
            {backendStatus}
          </span>
        </div>

        <button
          onClick={() => setShowUserManagement(!showUserManagement)}
          style={{
            padding: '12px 24px',
            backgroundColor: showUserManagement ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {showUserManagement ? '隐藏用户管理' : '显示用户管理'}
        </button>
      </div>

      {showUserManagement && (
        <div style={{ padding: '20px 0' }}>
          <UserManagement />
        </div>
      )}

      {!showUserManagement && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>
            欢迎使用 DHC 应用程序
          </h2>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
            这是一个使用 Electron + React + Go (Gin) 构建的桌面应用程序示例。
            点击上方的"显示用户管理"按钮来体验前后端通信功能。
          </p>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>技术栈：</h3>
            <ul style={{ color: '#666', lineHeight: '1.8' }}>
              <li><strong>前端：</strong> Electron + React + TypeScript</li>
              <li><strong>后端：</strong> Go + Gin 框架</li>
              <li><strong>通信方式：</strong> HTTP API (RESTful)</li>
              <li><strong>数据格式：</strong> JSON</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
