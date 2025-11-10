import React, { ReactNode } from 'react'
import { Modal, Button } from '@douyinfe/semi-ui'

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

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onCancel,
  onOk,
  title = '提示',
  children,
  width = 520,
  okText = '确定',
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
      title={title}
      visible={visible}
      onCancel={onCancel}
      onOk={onOk}
      width={width}
      footer={footer !== undefined ? footer : defaultFooter}
      closable={closable}
      maskClosable={maskClosable}
    >
      {children}
    </Modal>
  )
}

export default CustomModal

