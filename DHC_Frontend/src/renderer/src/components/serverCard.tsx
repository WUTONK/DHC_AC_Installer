import { useState } from 'react'
import { Card, Typography } from '@douyinfe/semi-ui'

function ServerCard(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <Card title="Runtime Versions">
      <Typography.Text>Electron v{versions.electron}</Typography.Text>
      <br />
      <Typography.Text>Chromium v{versions.chrome}</Typography.Text>
      <br />
      <Typography.Text>Node v{versions.node}</Typography.Text>
    </Card>
  )
}

export default ServerCard
