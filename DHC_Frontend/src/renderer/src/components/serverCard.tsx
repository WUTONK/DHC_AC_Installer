import React from 'react'
import { Card, Descriptions, Button, Typography } from '@douyinfe/semi-ui'
import SHMC_server_banner from '../../../../resources/image/server/banner/R34蓝_夜_湾岸东行.jpg'
import SRP_server_logo_mini from '../../../../resources/icon/serverLogo/SRP_Logo_mini.png'

interface ServerCardProps {
  // 可以在这里添加 props 类型定义
}

// 服务器横幅

// Figma 设计中的图片资源
const avatarImg = SRP_server_logo_mini
const coverImg = SHMC_server_banner

const ServerCard: React.FC<ServerCardProps> = () => {
  const { Meta } = Card
  const { Text } = Typography

  const handleJoinServer = (): void => {
    console.log('========================================')
    console.log('按钮被点击了！')
    console.log('时间:', new Date().toLocaleString())
    console.log('服务器: 上海湾岸午夜俱乐部服务器')
    console.log('========================================')
    // 在新窗口打开网页
    const serverUrl = 'https://example.com' // TODO: 替换为实际的服务器网页地址
    window.open(serverUrl, '_blank')
  }

  return (
    <Card
      style={{ width: 360, height: 445 }}
      cover={
        <img
          src={coverImg}
          alt="服务器封面"
          className="w-full h-[160px] object-cover"
        />
      }
      header={
        <div className="flex justify-between items-center w-full">
          <Meta
            avatar={
              <img
                src={avatarImg}
                alt="服务器头像"
                className="w-[40px] h-[40px] object-cover"
              />
            }
            title="上海湾岸午夜俱乐部服务器"
            description="详细信息"
            className="flex-1 mb-0"
          />
          <Text link>More</Text>
        </div>
      }
      headerStyle={{
        paddingBottom: 21,
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20
      }}
      bodyStyle={{
        padding: '20px'
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            theme="solid"
            type="primary"
            onClick={handleJoinServer}
            className="server-card-button"
          >
            加入服务器
          </Button>
        </div>
      }
      footerLine={true}
      footerStyle={{
        paddingBottom: 20,
        paddingTop: 21,
        paddingLeft: 20,
        paddingRight: 20
      }}
    >
      <div className="mb-5">
        <Text>上海湾岸午夜俱乐部服务器</Text>
      </div>

      <div className="[&_table]:w-full [&_table]:table-fixed [&_tbody]:flex [&_tbody]:flex-nowrap [&_tbody]:w-full [&_tr]:flex-1 [&_tr]:flex [&_tr]:flex-col [&_tr]:min-w-0">
        <Descriptions
          data={[
            { key: "服务器位置", value: "20" },
            { key: "在线玩家", value: "10" },
            { key: "延迟(TTS)", value: "100ms" },
          ]}
          row={true}
          size="medium"
          style={{ width: '100%' }}
        />
      </div>
    </Card>
  )
}

export default ServerCard
