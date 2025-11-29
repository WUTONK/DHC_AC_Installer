# 前端集成示例代码

## TypeScript 类型定义

```typescript
// 后端 API 请求类型
interface MultiModInstallRequest {
  paths: string[]  // 路径列表，如 ["cars", "cars/shmc", "tracks"]
}

// 后端 API 响应类型
interface MultiModInstallResponse {
  success: boolean
  message?: string
  installedCount?: number
}
```

## React 组件实现示例

```tsx
import React, { useState, useEffect } from 'react'
import { Checkbox, Button, Card } from '@douyinfe/semi-ui'

// 资源项组件（支持三级结构）
interface ResourceItem {
  type: string      // 'cars', 'tracks', 'shaders', etc.
  pkg?: string      // 'shmc', etc.
  mod?: string      // 'r34', etc.
  label: string     // 显示名称
  state: 'pass' | 'notImported' | 'incomplete'
  children?: ResourceItem[]
}

// 主组件
const ModInstallPage: React.FC = () => {
  // 选中的路径列表（核心状态）
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  
  // 资源树数据（从后端获取的完整 ResourceMap）
  const [resourceTree, setResourceTree] = useState<ResourceMap | null>(null)

  // 加载资源状态
  useEffect(() => {
    async function loadResourceMap() {
      const response = await fetch('/api/resource-map')
      const data = await response.json()
      setResourceTree(data)
    }
    loadResourceMap()
  }, [])

  // 切换选择状态
  const toggleSelection = (type: string, pkg?: string, mod?: string) => {
    // 生成路径
    let path = type
    if (pkg) path += `/${pkg}`
    if (mod) path += `/${mod}`

    setSelectedPaths(prev => {
      if (prev.includes(path)) {
        // 取消选择：移除该路径及所有子路径
        return prev.filter(p => !p.startsWith(path + '/') && p !== path)
      } else {
        // 添加选择
        return [...prev, path]
      }
    })
  }

  // 检查是否选中（考虑父子关系）
  const isSelected = (type: string, pkg?: string, mod?: string): boolean => {
    let path = type
    if (pkg) path += `/${pkg}`
    if (mod) path += `/${mod}`

    // 检查精确匹配或父级匹配
    return selectedPaths.some(selectedPath => {
      return selectedPath === path || path.startsWith(selectedPath + '/')
    })
  }

  // 检查是否为部分选中（用于级联复选框）
  const isPartialSelected = (type: string, pkg?: string): boolean => {
    if (!pkg) return false
    
    const basePath = `${type}/${pkg}`
    const children = getChildren(type, pkg)  // 获取所有子 mod
    
    const selectedChildren = children.filter(child => 
      isSelected(type, pkg, child)
    )
    
    return selectedChildren.length > 0 && selectedChildren.length < children.length
  }

  // 获取子项列表（辅助函数）
  const getChildren = (type: string, pkg?: string): string[] => {
    if (!resourceTree || !resourceTree[type]) return []
    
    if (!pkg) {
      // 获取所有 pkg
      return Object.keys(resourceTree[type].items || {})
    }
    
    // 获取该 pkg 下的所有 mod
    const pkgInfo = resourceTree[type].items?.[pkg]
    return pkgInfo ? Object.keys(pkgInfo.items || {}) : []
  }

  // 开始安装
  const handleInstall = async () => {
    if (selectedPaths.length === 0) {
      alert('请至少选择一个模组')
      return
    }

    try {
      const response = await fetch('/api/multi-mod-install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paths: selectedPaths,  // 简单直接！
        }),
      })

      const result: MultiModInstallResponse = await response.json()
      
      if (result.success) {
        alert(`安装成功！已安装 ${result.installedCount} 个模组`)
        setSelectedPaths([])  // 清空选择
        // 重新加载资源状态
      } else {
        alert(`安装失败：${result.message}`)
      }
    } catch (error) {
      console.error('安装失败:', error)
      alert('安装失败，请查看控制台')
    }
  }

  // 渲染资源树（递归组件）
  const renderResourceTree = () => {
    if (!resourceTree) return <div>加载中...</div>

    return Object.entries(resourceTree).map(([type, typeInfo]) => (
      <Card key={type} style={{ marginBottom: 16 }}>
        <h3>
          <Checkbox
            checked={isSelected(type)}
            indeterminate={false}  // 可以计算部分选中状态
            onChange={() => toggleSelection(type)}
          >
            {type} ({typeInfo.state})
          </Checkbox>
        </h3>
        
        {/* 第二层：Pkg */}
        <div style={{ marginLeft: 24 }}>
          {Object.entries(typeInfo.items || {}).map(([pkg, pkgInfo]) => (
            <div key={pkg} style={{ marginBottom: 8 }}>
              <Checkbox
                checked={isSelected(type, pkg)}
                indeterminate={isPartialSelected(type, pkg)}
                onChange={() => toggleSelection(type, pkg)}
              >
                {pkg} ({pkgInfo.state})
              </Checkbox>
              
              {/* 第三层：Mod */}
              <div style={{ marginLeft: 24 }}>
                {Object.entries(pkgInfo.items || {}).map(([mod, modInfo]) => (
                  <div key={mod} style={{ marginBottom: 4 }}>
                    <Checkbox
                      checked={isSelected(type, pkg, mod)}
                      onChange={() => toggleSelection(type, pkg, mod)}
                    >
                      {mod} ({modInfo.state})
                    </Checkbox>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    ))
  }

  return (
    <div>
      <h1>模组安装</h1>
      
      {/* 资源树 */}
      {renderResourceTree()}
      
      {/* 选中的路径（调试用，生产环境可隐藏） */}
      <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5' }}>
        <strong>已选中路径：</strong>
        {selectedPaths.length === 0 ? (
          <span style={{ color: '#999' }}>暂无选择</span>
        ) : (
          <ul>
            {selectedPaths.map(path => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        )}
      </div>
      
      {/* 安装按钮 */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button
          type="primary"
          size="large"
          onClick={handleInstall}
          disabled={selectedPaths.length === 0}
        >
          开始安装 ({selectedPaths.length} 项)
        </Button>
      </div>
    </div>
  )
}

export default ModInstallPage
```

## 关键要点

### 1. 状态管理极简
```typescript
// 只需要一个字符串数组！
const [selectedPaths, setSelectedPaths] = useState<string[]>([])
// 示例：["cars", "cars/shmc", "tracks"]
```

### 2. 选择逻辑清晰
```typescript
// 用户点击 -> 生成路径 -> 添加/移除
function toggleSelection(type, pkg, mod) {
  const path = mod ? `${type}/${pkg}/${mod}` 
           : pkg ? `${type}/${pkg}` 
           : type
  // 添加到数组或从数组移除
}
```

### 3. 提交安装简单
```typescript
// 直接发送路径数组
fetch('/api/multi-mod-install', {
  method: 'POST',
  body: JSON.stringify({ paths: selectedPaths })
})
```

### 4. 后端自动处理
- 后端接收路径列表
- 后端自动展开路径（如 `cars/shmc` -> 所有子 mod）
- 后端自动去重
- 前端无需关心展开逻辑

## 优势总结

✅ **前端代码简单**：只需要字符串数组操作  
✅ **数据量小**：只传输选中的路径  
✅ **易于调试**：`selectedPaths` 一目了然  
✅ **易于测试**：状态管理清晰  
✅ **性能优秀**：无复杂的数据结构操作

## 与 ResourceMap 方案对比

如果使用 ResourceMap 方案，前端需要：
```typescript
// ❌ 复杂：需要构建完整的嵌套结构
const buildSelectedMap = (selectedItems) => {
  const map = {}
  selectedItems.forEach(item => {
    // 复杂的递归构建逻辑
    // 容易出错，代码量大
  })
  return map
}
```

使用路径列表方案：
```typescript
// ✅ 简单：只需要字符串数组
const selectedPaths = ["cars", "cars/shmc", "tracks"]
```

