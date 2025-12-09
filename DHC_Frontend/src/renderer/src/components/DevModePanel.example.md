# 开发者选项使用指南

## 概述

开发者选项系统允许各个页面在顶栏统一注册和显示开发者工具。所有开发者选项都会在顶栏的"开发者选项"面板中统一管理。

## 使用方法

### 1. 在页面组件中注册开发者选项

```tsx
import { useEffect } from 'react'
import { useDevMode } from '../contexts/DevModeContext'
import { Select, Input, Switch } from '@douyinfe/semi-ui'

export default function MyPage() {
  const { registerDevOption, unregisterDevOption } = useDevMode()
  const [myDevValue, setMyDevValue] = useState('')

  useEffect(() => {
    // 注册开发者选项
    registerDevOption({
      id: 'my-page-dev-option', // 唯一ID
      label: '我的开发者选项', // 显示标签
      component: (
        <Input
          value={myDevValue}
          onChange={(value) => setMyDevValue(value)}
          placeholder="输入测试值"
        />
      ),
      order: 2 // 可选：排序顺序，数字越小越靠前
    })

    // 组件卸载时取消注册
    return () => {
      unregisterDevOption('my-page-dev-option')
    }
  }, [registerDevOption, unregisterDevOption, myDevValue])

  return <div>...</div>
}
```

### 2. 动态更新选项

如果选项的值发生变化，需要重新注册以更新显示：

```tsx
useEffect(() => {
  registerDevOption({
    id: 'dynamic-option',
    label: '动态选项',
    component: <Select value={value} onChange={setValue}>...</Select>,
    order: 1
  })

  return () => unregisterDevOption('dynamic-option')
}, [registerDevOption, unregisterDevOption, value]) // 包含依赖项
```

### 3. 多个选项

一个页面可以注册多个开发者选项：

```tsx
useEffect(() => {
  // 选项1
  registerDevOption({
    id: 'option-1',
    label: '选项1',
    component: <Input />,
    order: 1
  })

  // 选项2
  registerDevOption({
    id: 'option-2',
    label: '选项2',
    component: <Switch />,
    order: 2
  })

  return () => {
    unregisterDevOption('option-1')
    unregisterDevOption('option-2')
  }
}, [registerDevOption, unregisterDevOption])
```

## 注意事项

1. **唯一ID**：每个选项必须有唯一的 `id`
2. **清理**：组件卸载时必须调用 `unregisterDevOption` 清理
3. **依赖项**：如果选项组件依赖状态，需要在 `useEffect` 的依赖数组中包含这些状态
4. **排序**：使用 `order` 属性控制选项的显示顺序

## 示例：ServerListPage 中的大洲选择器

参考 `App.tsx` 中的实现，大洲选择器已经注册到开发者选项中。

