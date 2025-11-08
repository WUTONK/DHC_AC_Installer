import React from 'react'
import { Card, Descriptions, Button, Typography } from '@douyinfe/semi-ui'

interface ServerCardProps {
  // 可以在这里添加 props 类型定义
}

// Figma 设计中的图片资源
const avatarImg = "http://localhost:3845/assets/eec0647d89630760a2dc24700f350822fc7c491f.png"
const coverImg = "http://localhost:3845/assets/866a4bf0402883950393daf693d3826007ce10de.png"

const ServerCard: React.FC<ServerCardProps> = () => {
  const { Meta } = Card
  const { Text } = Typography

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
            style={{
              height: 32,
              backgroundColor: 'var(--color-button_primary-bg-default, #89c79f)',
              color: 'var(--color-button_primary-text-default, #ffffff)'
            }}
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
