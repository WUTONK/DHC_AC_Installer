
import { Button, Typography, Space, Card } from '@douyinfe/semi-ui'
import { Api } from '../../shared'


const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  

  return (
    <div className="app-container">
      <Space vertical spacing="loose" className="app-space">
        <Card>
          <Space vertical spacing="loose">
            <Title heading={1}>api测试</Title>
            <Space>
              <Button type="primary" size="large"
              onClick={async () => {
                const result = await Api.apiGetGamePathGet()
                console.log('游戏路径:', result)
              }}
              >
                获取游戏路径
              </Button>
            </Space>
          </Space>
        </Card>

      </Space>
    </div>
  )
}

export default App
