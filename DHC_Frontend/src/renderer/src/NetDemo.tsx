import React from 'react'
import { useState } from 'react'
import { Card, Layout, Button } from '@douyinfe/semi-ui'
import { Api } from '../../shared'


// const markdown = '# Hi, *Pluto*!'
// <Markdown>{markdown}</Markdown>
function NetDemo(): React.JSX.Element {
  const [tts, setTts] = useState<string>("")
  const [clients, setclients] = useState<number>(0)
  const [maxClients, setMaxclients] = useState<number>(0)
  return(
    <Layout>
       <Card
            title='服务器信息获取测试'
            style={{ maxWidth: 500, maxHeight:500 }}
            headerExtraContent={
              <div>
                <Button onClick={async ()=>{
                   const [tts, clients, maxClients] = await GetServerInfo("5.161.43.117:8081")
                   setTts(tts)
                   setclients(clients)
                   setMaxclients(maxClients)
                 }}>获取SRP EU2服务器人数信息</Button>
              </div>
            }
        >
          <p>tts:{tts}</p>
          <p>当前人数:{clients}</p>
          <p>最大人数:{maxClients}</p>
        </Card>
    </Layout>
  )
}

async function GetServerInfo(server:string): Promise<[string, number, number]> {
  return Api.apiGetServerInfoGet(
      {
       apiGetServerInfoGetRequest:{
        serverHost: server
       }
      }
  ).then((res): [string, number, number] => {
    return ["", res.clients, res.maxClients]
  }).catch((err): [string, number, number] => {
    console.log(err)
    return ["获取信息失败", 0, 0]
  })
}

export default NetDemo
