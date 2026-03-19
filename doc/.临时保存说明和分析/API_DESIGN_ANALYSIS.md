# API 设计分析：细粒度 vs RESTful

## 🔍 当前设计的问题

### 问题1：API 过于细碎
我设计了多个独立的进度查询API：
- `GET /api/GetCarPackProgress`
- `GET /api/GetShaderProgress`
- `GET /api/GetMapProgress`
- `GET /api/GetCarProgress`
- `GET /api/GetCMInstallProgress`
- `GET /api/GetInstallProgress`

**问题**：
- ❌ 不符合 RESTful 设计原则
- ❌ API 数量过多，维护成本高
- ❌ 前后端需要记住多个端点
- ❌ 不符合"资源"的概念

### 问题2：命名不符合 RESTful 规范
- `GetXXX` 这种命名是 RPC 风格，不是 RESTful
- RESTful 应该使用资源名词 + HTTP 动词

## 📚 设计原则对比

### 当前设计（RPC 风格）
```
GET /api/GetCarPackProgress?installId=xxx
GET /api/GetShaderProgress?installId=xxx
GET /api/GetMapProgress?installId=xxx
```
- 每个操作一个端点
- 动词在路径中（GetXXX）

### RESTful 设计（推荐）
```
GET /api/installations/{installId}/progress?category=carPack
GET /api/installations/{installId}/progress?category=shader
GET /api/installations/{installId}/progress?category=map
```
- 资源在路径中（installations/{id}/progress）
- 通过查询参数区分子资源
- 或者使用嵌套资源：
```
GET /api/installations/{installId}/progress/carPack
GET /api/installations/{installId}/progress/shader
```

## ✅ 改进方案

### 方案1：统一进度查询API（推荐）

**优点**：
- ✅ 符合 RESTful 原则
- ✅ API 数量少，易于维护
- ✅ 灵活，易于扩展
- ✅ 前端调用简单

**设计**：
```yaml
GET /api/installations/{installId}/progress
  Query参数:
    - category: carPack | shader | map | car | cm | all (默认all)
    - carName: string (当category=car时指定车辆名)
  
  返回: 统一的进度响应，包含所有类别的进度
```

**示例**：
```bash
# 获取所有进度
GET /api/installations/abc123/progress

# 只获取车包进度
GET /api/installations/abc123/progress?category=carPack

# 获取特定车辆进度
GET /api/installations/abc123/progress?category=car&carName=r34
```

### 方案2：嵌套资源设计

**设计**：
```yaml
GET /api/installations/{installId}/progress
  # 获取总体进度（包含所有类别）

GET /api/installations/{installId}/progress/carPack
  # 获取车包进度

GET /api/installations/{installId}/progress/shader
  # 获取光影进度

GET /api/installations/{installId}/progress/map
  # 获取地图进度

GET /api/installations/{installId}/progress/cars/{carName}
  # 获取特定车辆进度
```

**优点**：
- ✅ 更符合 RESTful 资源层次
- ✅ URL 语义清晰
- ✅ 支持更细粒度的资源访问

**缺点**：
- ⚠️ API 数量仍然较多（但比当前设计好）

### 方案3：混合设计（平衡）

**设计**：
```yaml
# 主要API：统一进度查询
GET /api/installations/{installId}/progress?category=all|carPack|shader|map|car|cm

# 特殊场景：单个车辆（因为需要额外参数）
GET /api/installations/{installId}/progress/cars/{carName}

# CM 安装是独立流程，可以保持独立
GET /api/cm/status
POST /api/cm/install
GET /api/cm/install/progress
```

## 🎯 推荐方案：方案1（统一查询API）

### 理由

1. **符合 RESTful 原则**
   - 资源：`installations/{id}/progress`
   - 通过查询参数过滤，而不是创建新端点

2. **减少 API 数量**
   - 从 6 个进度 API 减少到 1 个
   - 降低维护成本

3. **灵活性高**
   - 前端可以一次获取所有进度
   - 也可以只获取特定类别
   - 易于扩展新类别

4. **符合常见实践**
   - GitHub API: `/repos/{owner}/{repo}/issues?state=open`
   - Stripe API: `/customers?limit=10&starting_after=xxx`
   - 都是通过查询参数过滤，而不是创建新端点

## 📝 改进后的 API 设计

### 安装相关
```yaml
# 开始安装
POST /api/installations
  Body: { versionId, gamePath, cleanInstall }

# 获取安装任务列表
GET /api/installations

# 获取特定安装任务
GET /api/installations/{installId}

# 获取安装进度（统一API）
GET /api/installations/{installId}/progress?category=all|carPack|shader|map|car|cm

# 获取安装日志
GET /api/installations/{installId}/logs?since=xxx&limit=100&level=all

# 取消安装
DELETE /api/installations/{installId}
```

### CM 相关（独立资源）
```yaml
# 检查CM状态
GET /api/cm/status

# 安装CM
POST /api/cm/install

# 获取CM安装进度
GET /api/cm/install/progress
```

### 系统信息
```yaml
# 磁盘信息
GET /api/system/disk?drive=D:

# 游戏路径
GET /api/system/game-path

# 安装版本列表
GET /api/system/install-versions
```

## 🔄 迁移建议

如果采用改进方案，需要：

1. **后端重构**
   - 合并多个进度查询 handler 为一个
   - 使用统一的进度数据结构
   - 通过 category 参数路由到不同的进度计算逻辑

2. **前端更新**
   - 更新 API 调用代码
   - 使用统一的进度查询函数
   - 根据 category 参数过滤显示

3. **向后兼容**
   - 可以保留旧的 API 端点（标记为 deprecated）
   - 逐步迁移到新 API

## 📊 对比总结

| 维度 | 当前设计（细碎） | 改进设计（RESTful） |
|------|----------------|-------------------|
| API 数量 | 6 个进度 API | 1 个统一进度 API |
| RESTful 符合度 | ❌ 低 | ✅ 高 |
| 维护成本 | ❌ 高 | ✅ 低 |
| 扩展性 | ⚠️ 中等 | ✅ 高 |
| 前端调用复杂度 | ❌ 高 | ✅ 低 |
| 语义清晰度 | ✅ 高 | ✅ 高 |

## 🎓 设计原则总结

1. **资源优先**：将进度视为安装任务的子资源
2. **查询参数过滤**：使用 `?category=xxx` 而不是创建新端点
3. **统一接口**：相似的资源使用统一的 API 模式
4. **RESTful 命名**：使用名词（installations）而不是动词（GetXXX）

---

**结论**：当前设计确实过于细碎，建议采用统一的进度查询 API，通过查询参数区分不同类别。这样更符合 RESTful 设计原则和常见实践。
