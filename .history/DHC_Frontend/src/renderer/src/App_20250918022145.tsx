
import { Button, Typography, Space, Card } from '@douyinfe/semi-ui'
import {Api} from '../../shared'
import { useState } from 'react'

const { Title, Text } = Typography

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const [gamePath, setGamePath] = useState('')

  return (
    <div className="app-container">
      <Space vertical spacing="loose" className="app-space">
        <Card>
          <Space vertical spacing="loose">
            <Title heading={1}>api测试</Title>
            <Space>
              <Button type="primary" size="large"
              onClick={()=>{
                  console.log('按钮被点击，开始发送请求...')
                  Api.apiGetGamePathGet(
                    //
                  ).then((res) =>{
                    console.log('请求成功，收到响应:', res)
                    setGamePath(String(res.gamePath))
                  }).catch((error) => {
                    console.error('请求失败:', error)
                    setGamePath('请求失败: ' + error.message)
                  })
                }
              }
              >
                获取游戏路径
              </Button>
              <Text>{gamePath}</Text>
            </Space>
          </Space>
        </Card>

      </Space>
    </div>
  )
}

export default App
