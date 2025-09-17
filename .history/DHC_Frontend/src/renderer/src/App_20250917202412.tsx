
import { Button, Typography, Space, Card } from '@douyinfe/semi-ui'

const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Space vertical spacing="loose" style={{ width: '100%' }}>
        <Card>
          <Space vertical spacing="loose">
            <Title heading={1}>欢迎使用 DHC AC 安装器</Title>
            <Text type="secondary">
              这是一个使用 Semi Design 主题的 Electron 应用程序
            </Text>
            <Space>
              <Button type="primary" size="large">
                主要按钮
              </Button>
              <Button type="secondary" size="large">
                次要按钮
              </Button>
              <Button type="tertiary" size="large">
                第三按钮
              </Button>
            </Space>
          </Space>
        </Card>
        
        <Card title="功能特性">
          <Space vertical>
            <Text>✅ Semi Design 主题已集成</Text>
            <Text>✅ Antd 已移除</Text>
            <Text>✅ 现代化 UI 组件库</Text>
            <Text>✅ 响应式设计支持</Text>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default App
