import React from 'react'
import { Breadcrumb } from '@douyinfe/semi-ui'
import { IconHome } from '@douyinfe/semi-icons'
import { useNavigation } from '../contexts/NavigationContext'

export interface HomeBreadcrumbItem {
  label: React.ReactNode
  onClick?: () => void
}

interface HomeBreadcrumbProps {
  /** 当前页面（最后一级，不可点击） */
  current: React.ReactNode
  /** 中间层级（可选） */
  trail?: HomeBreadcrumbItem[]
  /** 自定义“首页”点击行为；默认 goHome */
  onHomeClick?: () => void
  /** 自定义“首页”文案；默认“首页” */
  homeLabel?: React.ReactNode
  style?: React.CSSProperties
}

export default function HomeBreadcrumb({
  current,
  trail = [],
  onHomeClick,
  homeLabel = '首页',
  style
}: HomeBreadcrumbProps): React.JSX.Element {
  const { goHome } = useNavigation()
  const handleHomeClick = onHomeClick ?? goHome

  return (
    <Breadcrumb style={style}>
      <Breadcrumb.Item
        icon={<IconHome />}
        onClick={handleHomeClick}
        style={{ cursor: 'pointer' }}
      >
        {homeLabel}
      </Breadcrumb.Item>
      {trail.map((item, idx) => (
        <Breadcrumb.Item
          key={idx}
          onClick={item.onClick}
          style={item.onClick ? { cursor: 'pointer' } : undefined}
        >
          {item.label}
        </Breadcrumb.Item>
      ))}
      <Breadcrumb.Item>{current}</Breadcrumb.Item>
    </Breadcrumb>
  )
}


