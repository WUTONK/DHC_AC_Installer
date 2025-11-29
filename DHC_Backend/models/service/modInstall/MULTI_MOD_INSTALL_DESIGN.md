# 多模组安装接口设计分析

## 问题背景

在设计 `MultiModInstall` 接口时，需要在两种方案中选择：
1. **方案A**：传入路径列表 `[]string`（如 `["cars", "cars/shmc", "tracks"]`）
2. **方案B**：传入完整的 `ResourceMap` 结构

## 方案对比

### 方案A：路径列表 `[]string`

#### 前端实现
```typescript
// 前端状态管理：简单的字符串数组
const [selectedPaths, setSelectedPaths] = useState<string[]>([])

// 用户点击选择时，直接添加路径
function handleSelect(resourceType: string, pkg?: string, mod?: string) {
  let path = resourceType
  if (pkg) path += `/${pkg}`
  if (mod) path += `/${mod}`
  
  setSelectedPaths(prev => [...prev, path])
}

// 提交安装：直接发送字符串数组
async function startInstall() {
  await api.post('/install', { paths: selectedPaths })
  // ["cars", "cars/shmc", "tracks"]
}
```

**优点：**
- ✅ **前端实现极简**：只需要维护一个字符串数组
- ✅ **数据量小**：只传输选中的路径，不包含状态信息
- ✅ **逻辑清晰**：前端负责展示，后端负责展开和处理
- ✅ **扩展性好**：支持任意层级的路径选择
- ✅ **易于调试**：请求参数一目了然

**缺点：**
- ❌ 后端需要做路径展开和查找工作（已有 `expandPaths` 实现）

#### 后端处理
```go
// 后端接收简单路径列表
func MultiModInstall(paths []string) error {
    // 1. 获取本地资源库的完整 ResourceMap（用于查找和验证）
    rm, _ := ImportResourceDetection(All, Local)
    
    // 2. 展开路径（用户选择的路径 -> 实际需要安装的所有 mod）
    expandedPaths := expandPaths(rm, paths)
    
    // 3. 遍历安装
    for _, path := range expandedPaths {
        SingleModInstall(path, ...)
    }
}
```

---

### 方案B：传入 ResourceMap

#### 前端实现
```typescript
// 前端需要构建完整的 ResourceMap 结构
interface ResourceStateInfo {
  state: 'pass' | 'notImported' | 'incomplete'
  items?: Record<string, ResourceStateInfo>
}

// 用户选择后，需要构建选中的 ResourceMap
function buildSelectedResourceMap(selectedItems: SelectedItem[]): ResourceMap {
  const resourceMap: ResourceMap = {}
  
  // 需要递归构建嵌套结构
  selectedItems.forEach(item => {
    if (!resourceMap[item.type]) {
      resourceMap[item.type] = { state: 'notImported', items: {} }
    }
    // ... 复杂的嵌套构建逻辑
  })
  
  return resourceMap
}

// 提交安装：需要构建完整 ResourceMap
async function startInstall() {
  const selectedMap = buildSelectedResourceMap(selectedItems)
  await api.post('/install', { resourceMap: selectedMap })
  // 庞大的嵌套 JSON 对象
}
```

**优点：**
- ✅ 数据完整，包含所有状态信息

**缺点：**
- ❌ **前端复杂度高**：需要递归构建嵌套的 ResourceMap 结构
- ❌ **数据冗余**：传输未选中资源的状态信息
- ❌ **逻辑混乱**：前端既要展示（需要完整 ResourceMap），又要构建（只选中部分）
- ❌ **易出错**：构建嵌套结构容易出错
- ❌ **调试困难**：请求体庞大，难以查看

#### 后端处理
```go
// 后端需要从 ResourceMap 中提取选中的路径
func MultiModInstall(rm ResourceMap) error {
    // 需要遍历 ResourceMap，找出哪些是被选中的
    // 逻辑复杂且不直观
    selectedPaths := extractSelectedPaths(rm)
    
    // 然后还需要展开路径
    expandedPaths := expandPaths(rm, selectedPaths)
    // ...
}
```

---

## 数据流分析

### 方案A：清晰的职责分离

```
前端：
  ├─ 展示数据：ResourceMap（从后端获取，用于显示状态）
  ├─ 用户选择：字符串数组（简单维护）
  └─ 提交安装：路径列表 ["cars", "cars/shmc"]

后端：
  ├─ 接收：路径列表
  ├─ 展开：使用本地 ResourceMap 展开路径
  └─ 安装：遍历展开后的路径进行安装
```

### 方案B：混乱的职责

```
前端：
  ├─ 展示数据：ResourceMap（从后端获取）
  ├─ 用户选择：需要构建选中的 ResourceMap
  └─ 提交安装：选中的 ResourceMap（部分完整结构）

后端：
  ├─ 接收：选中的 ResourceMap
  ├─ 提取：从 ResourceMap 中提取路径（额外工作）
  ├─ 展开：使用本地 ResourceMap 展开路径
  └─ 安装：遍历安装
```

---

## 实际场景举例

### 用户操作场景

用户在页面上看到：
```
📦 车辆 (cars)
  ├─ ☑️ SHMC 车包
  │   ├─ ☑️ R34
  │   └─ ☐ R32
  └─ ☐ 其他车包

📦 地图 (tracks)
  └─ ☑️ 主地图
```

### 方案A：前端收集

```typescript
// 用户点击复选框时
selectedPaths = [
  "cars/shmc",      // 选中了整个 SHMC 包
  "cars/shmc/r34",  // 也单独选中了 R34（实际上会被展开逻辑处理，自动去重）
  "tracks"          // 选中了所有地图
]

// 直接发送，简单明了
POST /install
Body: { "paths": ["cars/shmc", "cars/shmc/r34", "tracks"] }
```

### 方案B：前端需要构建

```typescript
// 需要构建完整的 ResourceMap 结构
selectedResourceMap = {
  "cars": {
    "state": "notImported",
    "items": {
      "shmc": {
        "state": "notImported",
        "items": {
          "r34": { "state": "notImported", "items": {} }
        }
      }
    }
  },
  "tracks": {
    "state": "notImported",
    "items": {
      // ... 需要知道 tracks 下有哪些 pkg，然后构建结构
    }
  }
}

// 发送庞大的嵌套结构
POST /install
Body: { "resourceMap": {...巨大的嵌套对象...} }
```

---

## 性能对比

| 指标 | 方案A（路径列表） | 方案B（ResourceMap） |
|------|-----------------|---------------------|
| 请求体大小 | ~100 bytes（3个路径） | ~10KB+（完整嵌套结构） |
| 前端构建时间 | < 1ms | ~10-50ms（递归构建） |
| 后端解析时间 | < 1ms | ~5-20ms（递归提取） |
| 网络传输 | 极快 | 较慢（JSON 体积大） |

---

## 结论与建议

### ✅ **强烈推荐方案A（路径列表）**

**理由：**
1. **前端实现简单**：只需要维护字符串数组，用户选中什么就添加什么路径
2. **数据传输高效**：只传输选中的路径，数据量小
3. **职责清晰**：前端负责展示和收集选择，后端负责展开和安装
4. **易于维护**：代码逻辑简单，不容易出错
5. **易于调试**：请求参数清晰，容易排查问题

### 实施建议

#### 前端实现要点
```typescript
// 1. 状态管理：简单的字符串数组
const [selectedPaths, setSelectedPaths] = useState<string[]>([])

// 2. 选择逻辑：根据层级生成路径
function toggleSelection(type: string, pkg?: string, mod?: string) {
  let path = type
  if (pkg) path += `/${pkg}`
  if (mod) path += `/${mod}`
  
  setSelectedPaths(prev => 
    prev.includes(path) 
      ? prev.filter(p => p !== path)  // 取消选择
      : [...prev, path]                 // 添加选择
  )
}

// 3. 处理父子关系（可选，后端会自动展开）
// 如果选中了父级，可以自动选中所有子级（前端 UI 优化）
// 但后端 expandPaths 会处理展开，所以这是可选的

// 4. 提交安装
async function handleInstall() {
  const response = await fetch('/api/multi-mod-install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths: selectedPaths })
  })
}
```

#### 后端接口定义
```go
// API 接口示例
type MultiModInstallRequest struct {
    Paths []string `json:"paths"`  // 路径列表：["cars", "cars/shmc", "tracks"]
}

// 处理函数
func HandleMultiModInstall(req MultiModInstallRequest) error {
    return MultiModInstall(req.Paths)
}
```

---

## 最终决策

**采用方案A（路径列表 `[]string`）**

当前代码已经实现了这个方案，包括：
- ✅ `MultiModInstall(paths []string)` 函数
- ✅ `expandPaths()` 路径展开逻辑
- ✅ 支持一级、二级、三级路径

**无需修改，继续使用路径列表方案即可。**

