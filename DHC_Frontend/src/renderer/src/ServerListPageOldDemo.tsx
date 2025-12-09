import React, { useState } from 'react'
import { Layout, Typography } from '@douyinfe/semi-ui'
import ServerCard from './components/serverCard'
import JoinServerInstructionsModal from './components/joinServerInstructionsModal'

const { Header, Content } = Layout
const { Title } = Typography

export default function ServerListPageOldDemo(): React.JSX.Element {
  const [modalVisible, setModalVisible] = useState(false)

  const handleOpenModal = (): void => {
    setModalVisible(true)
  }

  const handleCloseModal = (): void => {
    setModalVisible(false)
  }

  const handleConfirm = (): void => {
    console.log('确认加入服务器')
    setModalVisible(false)
  }

  return (
    <Layout style={{ height: '100vh', background: '#16161a', color: 'white', overflow: 'hidden' }}>
      <Header
        style={{
          padding: '0 40px',
          height: 64,
          background: '#16161a',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Title heading={3} style={{ color: '#fff' }}>
          服务器推荐（旧版DEMO）
        </Title>
      </Header>

      <Content style={{ padding: '24px 40px', overflowY: 'auto' }}>
        <div
          style={{
            margin: 20,
            flexDirection: 'column',
            alignItems: 'center',
            display: 'flex'
          }}
        >
          <div
            style={{
              margin: 20,
              flexDirection: 'row',
              alignItems: 'center',
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <ServerCard />
            <ServerCard />
            <ServerCard />
          </div>
          <div
            style={{
              margin: 20,
              flexDirection: 'row',
              alignItems: 'center',
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <ServerCard />
            <ServerCard />
            <ServerCard />
          </div>
        </div>
      </Content>

      <JoinServerInstructionsModal
        visible={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleConfirm}
      />
    </Layout>
  )
}

