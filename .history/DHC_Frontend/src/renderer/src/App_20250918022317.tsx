
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
              onClick={async ()=>{
                  console.log('按钮被点击，开始发送请求...')

                  // 先测试直接fetch
                  try {
                    console.log('测试直接fetch请求...')
                    const response = await fetch('http://127.0.0.1:19810/api/GetGamePath')
                    console.log('Fetch响应状态:', response.status)
                    const data = await response.json()
                    console.log('Fetch响应数据:', data)
                    setGamePath('直接fetch成功: ' + data.GamePath)
                  } catch (fetchError) {
                    console.error('直接fetch失败:', fetchError)

                    // 如果直接fetch失败，尝试使用API
                    try {
                      console.log('尝试使用API...')
                      const res = await Api.apiGetGamePathGet()
                      console.log('API请求成功，收到响应:', res)
                      setGamePath('API成功: ' + res.gamePath)
                    } catch (apiError) {
                      console.error('API请求失败:', apiError)
                      setGamePath('所有请求都失败: ' + apiError.message)
                    }
                  }
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
