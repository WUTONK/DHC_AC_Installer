
import { Button, Typography, Space, Card } from '@douyinfe/semi-ui'
import {DefaultApi} from '../../api'

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
              onClick={
                Api.getGamePathGet()
              }
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
