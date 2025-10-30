import React from 'react'
import { useState } from 'react'
import { Card, Layout, Typography,Button } from '@douyinfe/semi-ui'

const { Text } = Typography


// const markdown = '# Hi, *Pluto*!'
// <Markdown>{markdown}</Markdown>
function NetDemo(): React.JSX.Element {

  return(
    <Layout>
       <Card
            title='服务器人数获取测试'
            style={{ maxWidth: 500, maxHeight:500 }}
            headerExtraContent={
              <Button>获取SRP EU2服务器人数信息</Button>
            }
        >
            <p>当前人数:__</p>/<p>最大人数:__</p>
        </Card>
    </Layout>
  )
}

export default NetDemo
