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
                   const [tts, clients, maxClients] = await GetServerInfo("SHMC")
                   setTts(tts)
                   setclients(clients)
                   setMaxclients(maxClients)
                 }}>获取SHMC服务器人数信息</Button>
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

// 服务器列表和解析函数
export const ServerList = {
  SPR_EU2: "5.161.43.117:8081",
  SHMC: "42.51.34.184:8081", // 上海湾岸俱乐部服务器
} as const;

export type ServerName = keyof typeof ServerList;

export function resolveServerHost(input: ServerName | string): string {
  // 既支持传入名字（如 "SPR_EU2"），也支持直接传 "ip:port"
  if (Object.prototype.hasOwnProperty.call(ServerList, input)) {
    return ServerList[input as ServerName];
  }
  return input;
}

async function GetServerInfo(server:string): Promise<[string, number, number]> {
  const serverHost = resolveServerHost(server)
  return Api.apiGetServerInfoGet(
      {
        serverHost: serverHost
      }
  ).then((res): [string, number, number] => {
    return [res.rtt, res.clients, res.maxClients]
  }).catch((err): [string, number, number] => {
    console.log(err)
    return ["获取信息失败", 0, 0]
  })
}

export default NetDemo
