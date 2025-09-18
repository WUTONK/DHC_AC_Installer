
import { Layout } from '@douyinfe/semi-ui'

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const { Header, Footer, Sider, Content } = Layout;
  const commonStyle = {
      height: 64,
      lineHeight: '64px',
      background: 'var(--semi-color-fill-0)'
  };

  return (
    <div className="app-container">
      <Layout className="components-layout-demo" style={{ height: '100vh' }}>
          <Sider style={{ width: '120px', background: 'var(--semi-color-fill-2)' }}>Sider</Sider>
          <Layout>
              <Header style={commonStyle}>Header</Header>
              <Content style={{ flex: 1, padding: '20px' }}>Content</Content>
              <Footer style={commonStyle}>Footer</Footer>
          </Layout>
      </Layout>
    </div>
  )
}

export default App
