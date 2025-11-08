import React from 'react'
import { Descriptions, Button } from '@douyinfe/semi-ui'

interface ServerCardProps {
  // 可以在这里添加 props 类型定义
}

// Figma 设计中的图片资源
const avatarImg = "http://localhost:3845/assets/eec0647d89630760a2dc24700f350822fc7c491f.png"
const coverImg = "http://localhost:3845/assets/866a4bf0402883950393daf693d3826007ce10de.png"

const ServerCard: React.FC<ServerCardProps> = () => {

  return (
    <div className="flex flex-col items-start border-solid border-[var(--color-card-border,rgba(35,40,37,0.08))] border-[1px] w-[360px] h-[445px] bg-[var(--color-card-bg-default,#ffffff)] rounded-[6px] overflow-hidden">
      {/* Card Header */}
      <div className="self-stretch shrink-0 flex justify-between items-start border-solid border-[var(--color-card-border,rgba(35,40,37,0.08))] border-b-[1px] pb-[21px] pt-[20px] px-[20px] bg-[rgba(0,0,0,0)]">
        <div className="flex-1 flex items-center pr-[20px]">
          {/* Avatar - 40px as per Figma design */}
          <div className="shrink-0 flex justify-center items-center pr-[12px] w-[40px] h-[40px] overflow-hidden">
            <img
              src={avatarImg}
              className="w-full h-full object-cover"
              alt=''
            />
          </div>
          <div className="shrink-0 inline-flex flex-col items-start bg-[rgba(0,0,0,0)]">
            <p className="font-['Inter'] text-[16px] leading-[22px] font-[600] text-[var(--color-card_title-text,#232825)] whitespace-nowrap">
              上海湾岸午夜俱乐部服务器
            </p>
            <p className="font-['Arial'] text-[14px] leading-[20px] text-[var(--color-card_description-text,rgba(35,40,37,0.6))] whitespace-nowrap">
              详细信息
            </p>
          </div>
        </div>
        <p className="shrink-0 font-['Arial'] text-[14px] leading-[20px] font-[700] text-[var(--color-typography_link-text-default,#147dfd)] whitespace-nowrap">More</p>
      </div>

      {/* Cover Image */}
      <div className="self-stretch shrink-0 flex flex-col items-start">
        <img
          src={coverImg}
          className="w-[360px] h-[160px] object-cover"
          alt=''
        />
      </div>

      {/* Card Body */}
      <p className="font-['Inter'] text-[14px] leading-[20px] text-[var(--color-card_body-text,rgba(35,40,37,0.8))] p-[20px] shrink-0 w-full">
        上海湾岸午夜俱乐部服务器
      </p>

      {/* Descriptions */}
      <div className="w-full pb-[20px] pl-[20px] pr-[20px] pt-0 [&_table]:w-full [&_table]:table-fixed [&_tbody]:flex [&_tbody]:flex-nowrap [&_tbody]:w-full [&_tr]:flex-1 [&_tr]:flex [&_tr]:flex-col [&_tr]:min-w-0">
        <Descriptions
          data={[
            { key: "服务器位置", value: "20" },
            { key: "在线玩家", value: "10" },
            { key: "延迟(TTS)", value: "100ms" },
          ]}
          row={true}
          size="medium"
          className="w-full"
        />
      </div>

      {/* Footer with Button */}
      <div className="shrink-0 flex items-center justify-end border-solid border-[var(--color-card-border,rgba(35,40,37,0.08))] border-t-[1px] pb-[20px] pt-[21px] px-[20px] w-full bg-[rgba(0,0,0,0)]">
        <div className="flex gap-[8px] items-center">
          <Button theme="solid" type="primary" className="h-[32px] bg-[var(--color-button_primary-bg-default,#89c79f)] text-[var(--color-button_primary-text-default,#ffffff)]">
            加入服务器
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ServerCard
