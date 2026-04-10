import React from 'react'
import { Card, Layout, Button, Spin } from '@douyinfe/semi-ui'
import { useServerInfo } from './hooks/useServerInfo'

function NetDemo(): React.JSX.Element {
  const { loading, error, serverInfo, fetchServerInfo } = useServerInfo()

  return(
    <Layout>
       <Card
            title='服务器信息获取测试'
            style={{ maxWidth: 500, maxHeight:500 }}
            headerExtraContent={
              <div>
                <Button
                  loading={loading}
                  onClick={() => { void fetchServerInfo("SHMC") }}
                >获取SHMC服务器人数信息</Button>
              </div>
            }
        >
          {error && <p style={{ color: 'var(--semi-color-danger)' }}>错误: {error}</p>}
          {loading && <Spin />}
          {serverInfo && (
            <>
              <p>tts:{serverInfo.rtt}</p>
              <p>当前人数:{serverInfo.clients}</p>
              <p>最大人数:{serverInfo.maxClients}</p>
            </>
          )}
        </Card>

        <Card
            title='模组安装测试'
            style={{ maxWidth: 500, maxHeight:500 }}
            headerExtraContent={
              <div>
                <Button onClick={async ()=>{
                 }}>安装map</Button>
              </div>
            }
        >
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
  // 既支持传入名字（如 "SHMC"），也支持直接传 "ip:port"
  if (Object.hasOwn(ServerList, input)) {
    return ServerList[input as ServerName];
  }
  return input;
}

export default NetDemo
