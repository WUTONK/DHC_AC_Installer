import React from 'react'
import { Button } from '@douyinfe/semi-ui'
import { IconHome } from '@douyinfe/semi-icons'
import { useNavigation } from '../contexts/NavigationContext'

interface BackToHomeButtonProps {
  style?: React.CSSProperties
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'minimal' // minimal 版本更小更简洁
}

export default function BackToHomeButton({
  style,
  size = 'small',
  variant = 'default'
}: BackToHomeButtonProps): React.JSX.Element {
  const { goHome } = useNavigation()

  if (variant === 'minimal') {
    return (
      <Button
        icon={<IconHome />}
        theme="borderless"
        type="tertiary"
        size={size}
        onClick={goHome}
        style={{
          color: '#888',
          ...style
        }}
      >
        首页
      </Button>
    )
  }

  return (
    <Button
      icon={<IconHome />}
      theme="borderless"
      type="tertiary"
      size={size}
      onClick={goHome}
      style={{
        color: '#888',
        ...style
      }}
    >
      返回主页
    </Button>
  )
}

