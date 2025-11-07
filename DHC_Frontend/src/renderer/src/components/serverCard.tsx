import React from 'react'
import { Descriptions, Button } from '@douyinfe/semi-ui'

interface ServerCardProps {
  // 可以在这里添加 props 类型定义
}

interface DescriptionItem {
  key: string | React.ReactNode
  value: string | React.ReactNode
}

const ServerCard: React.FC<ServerCardProps> = () => {

  return (
    <div className="flex flex-col items-start border-solid border-[var(--color-card-border,#ffffff14)] border-[1px] w-[360px] h-[445px] bg-[var(--color-card-bg-default,#16161a)] rounded-[6px] overflow-hidden text-[14px] leading-[20px] tracking-[0px]">
    <div className="self-stretch shrink-0 flex justify-between items-start border-solid border-[var(--color-card-border,#ffffff14)] border-b-[1px] p-[20px] bg-[#00000000] text-[var(--color-typography\_link-text-default,#439afd)] font-['Arial'] font-[700]">
      <div className="flex-1 flex items-center pr-[20px]">
        <div className="shrink-0 flex justify-center items-center pr-[12px] w-[52px] h-[40px] overflow-hidden">
          <img
            src="https://p6-semi-sign.byteimg.com/tos-cn-i-acvclvrq33/27a9c029fba4435eb545588c9cef7115.png?rk3s=521bdb00&x-expires=1762549278&x-signature=aG6NaOQJwNC3u%2FbmGap54n6TdTg%3D"
            className="self-stretch flex-1 flex flex-col justify-center items-center"
            alt=''
          />
        </div>
        <div className="shrink-0 inline-flex flex-col items-start bg-[#00000000]">
          <p className="font-['Inter'] text-[16px] leading-[22px] font-[600] text-[var(--color-card\_title-text,#f9f9f9)] self-stretch shrink-0 min-w-[192px]">
            上海湾岸午夜俱乐部服务器
          </p>
          <p className="text-[var(--color-card\_description-text,#f9f9f999)] self-stretch shrink-0 min-w-[192px]">
            详细信息
          </p>
        </div>
      </div>
      <p className="shrink-0 min-w-[34px]">More</p>
    </div>
    <div className="self-stretch shrink-0 flex flex-col items-start">
      <img
        src="https://p26-semi-sign.byteimg.com/tos-cn-i-acvclvrq33/dd2ea54f2ea543c89e544b93016436e0.png?rk3s=521bdb00&x-expires=1762549278&x-signature=%2F4MfQpQ%2BaODI7COHkRQE30cg7HE%3D"
        className="shrink-0 flex flex-col items-start w-[360px] h-[160px]"
        alt=''
      />
    </div>
    <p className="font-['Inter'] text-[var(--color-card\_body-text,#f9f9f9cc)] p-[20px] shrink-0 w-[358px]">
      上海湾岸午夜俱乐部服务器
    </p>
    <Descriptions
      data={[
        { key: "服务器位置", value: "20" },
        { key: "在线玩家", value: "10" },
        { key: "延迟(TTS)", value: "100ms" },
      ]}
      row={true}
      className="w-[358px]"
    />
    <div className="shrink-0 flex items-center border-solid border-[var(--color-card-border,#ffffff14)] border-t-[1px] pl-[244px] pr-[20px] py-[20px] h-[73px] bg-[#00000000]">
      <Button theme="solid" className="h-[32px]">
        加入服务器
      </Button>
    </div>
  </div>
  )
}

export default ServerCard
