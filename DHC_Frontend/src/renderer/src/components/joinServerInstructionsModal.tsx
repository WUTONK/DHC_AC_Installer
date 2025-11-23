import React, { ReactNode } from 'react'
import { Modal, Button } from '@douyinfe/semi-ui'

// 加入服务器须知弹窗

interface CustomModalProps {
  visible: boolean
  onCancel: () => void
  onOk?: () => void
  title?: string
  children?: ReactNode
  width?: number | string
  okText?: string
  cancelText?: string
  footer?: ReactNode | null
  closable?: boolean
  maskClosable?: boolean
}
// joinServerInstructionsModal
// 加入服务器须知弹窗
const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onCancel,
  onOk,
  title = '加入服务器须知',
  width = 520,
  okText = '同意并加入',
  cancelText = '取消',
  footer,
  closable = true,
  maskClosable = true
}) => {
  const defaultFooter = (
    <>
      <Button onClick={onCancel}>{cancelText}</Button>
      {onOk && <Button theme="solid" type="primary" onClick={onOk}>{okText}</Button>}
    </>
  )

  return (
    <Modal
      className="join-server-modal"
      title={title}
      visible={visible}
      onCancel={onCancel}
      onOk={onOk}
      width={width}
      footer={footer !== undefined ? footer : defaultFooter}
      closable={closable}
      maskClosable={maskClosable}
    >
      <div className="bg-gray-100 p-5 rounded">
        <ul className="bg-white p-4 pl-5 rounded m-0">
          <li>提示文字</li>
          <li>提示文字</li>
          <li>提示文字</li>
        </ul>
      </div>
    </Modal>
  )
}

export default CustomModal

