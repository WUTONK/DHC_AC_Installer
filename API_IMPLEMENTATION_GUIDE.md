# 一键式安装 API 实现指南

本文档说明如何使用 OpenAPI 规范实现一键式安装所需的前后端 API。

## 📋 功能清单

根据需求，以下功能已包含在 OpenAPI 规范中：

### ✅ 已定义的功能

1. **目前磁盘&磁盘空间** ✅
   - API: `GET /api/GetDiskInfo`
   - 返回：磁盘盘符、总空间、已用空间、可用空间、是否为SSD等

2. **安装CM & 进度** ✅
   - API: `POST /api/InstallCM` - 开始安装CM
   - API: `GET /api/GetCMInstallProgress` - 获取CM安装进度
   - API: `GET /api/CheckCMStatus` - 检查CM是否已安装

3. **安装版本（三个版本）** ✅
   - API: `GET /api/GetInstallVersions`
   - 返回：基础极速版(minimal)、标准推荐版(standard)、豪华全享版(full)的详细信息

4. **车包安装进度** ✅
   - API: `GET /api/GetCarPackProgress`
   - 返回：车包整体进度及各车辆的详细进度

5. **光影安装进度** ✅
   - API: `GET /api/GetShaderProgress`
   - 返回：光影模组的安装进度和当前组件

6. **地图安装进度** ✅
   - API: `GET /api/GetMapProgress`
   - 返回：地图包的安装进度和各地图组件的状态

7. **车辆安装进度** ✅
   - API: `GET /api/GetCarProgress`
   - 返回：单个车辆的安装进度

8. **安装日志** ✅
   - API: `GET /api/GetInstallLogs`
   - 支持：时间过滤、级别过滤、分页查询

### 🔄 辅助API

- `POST /api/StartInstall` - 开始一键式安装
- `GET /api/GetInstallProgress` - 获取总体安装进度（包含所有类别）

## 🏗️ 架构设计建议

### 1. 安装任务管理

建议在后端实现一个**安装任务管理器**（InstallationTaskManager），用于：

- 管理多个并发的安装任务
- 为每个安装任务生成唯一的 `installId`
- 存储任务状态和进度信息
- 提供任务查询接口

```go
// 伪代码示例
type InstallationTask struct {
    ID          string
    VersionID   string
    Status      string  // idle, installing, completed, failed
    StartTime   int64
    Progress    map[string]float64  // 各类别的进度
    Logs        []InstallLog
    Error       error
}
```

### 2. 进度更新机制

#### 方案A：轮询（推荐用于当前实现）

前端定期调用进度查询API（如每500ms-1s）：
- 实现简单
- 适合HTTP RESTful架构
- 资源消耗可接受

```typescript
// 前端示例
useEffect(() => {
  const interval = setInterval(async () => {
    const progress = await api.getInstallProgress({ installId });
    setProgress(progress);
  }, 1000);
  return () => clearInterval(interval);
}, [installId]);
```

#### 方案B：WebSocket（可选，适合实时性要求高的场景）

如果需要更实时的进度更新，可以考虑添加WebSocket支持：
- 后端推送进度更新
- 减少HTTP请求次数
- 但需要额外的WebSocket实现

### 3. 安装日志存储

建议使用以下方式之一存储日志：

1. **内存存储**（适合单用户场景）
   - 使用 map[string][]InstallLog 存储
   - 安装完成后可选择持久化到文件

2. **文件存储**（适合多用户或持久化需求）
   - 每个安装任务一个日志文件
   - 使用时间戳命名：`install_{installId}_{timestamp}.log`

3. **数据库存储**（适合复杂场景）
   - 存储到SQLite或PostgreSQL
   - 支持复杂的查询和过滤

## 🔧 后端实现建议

### 1. 磁盘信息API实现

```go
// 在 handler/init.go 中添加
g.GET("/api/GetDiskInfo", getDiskInfo)

func getDiskInfo(c *gin.Context) {
    drive := c.Query("drive")
    if drive == "" {
        // 如果没有指定盘符，从游戏路径自动检测
        gamePath, _ := infoGet.GetGamePathAuto()
        // 提取盘符逻辑...
    }
    
    // 使用现有的 infoGet.GetDiskInfo 或其他方法获取磁盘信息
    // 实现磁盘空间查询（可能需要使用 Windows API 或 PowerShell）
    
    // 返回 JSON
    c.JSON(http.StatusOK, GetDiskInfoResp{
        Drive: drive,
        TotalBytes: total,
        UsedBytes: used,
        FreeBytes: free,
        // ...
    })
}
```

**注意**：需要实现获取磁盘空间的函数。Windows可以使用：
- `GetDiskFreeSpaceEx` (syscall)
- PowerShell: `Get-PSDrive` 或 WMI

### 2. CM安装进度实现

```go
// 需要修改现有的 InstallCm() 函数，支持进度回调
type CMInstallProgress struct {
    Status      string
    Progress    float64
    StatusText  string
    DownloadedBytes int64
    TotalBytes  int64
}

var cmInstallProgress CMInstallProgress
var cmInstallMutex sync.Mutex

func InstallCmWithProgress(callback func(CMInstallProgress)) (string, error) {
    // 更新进度状态
    updateProgress := func(status string, progress float64, text string) {
        cmInstallMutex.Lock()
        defer cmInstallMutex.Unlock()
        cmInstallProgress = CMInstallProgress{
            Status: status,
            Progress: progress,
            StatusText: text,
        }
        if callback != nil {
            callback(cmInstallProgress)
        }
    }
    
    updateProgress("downloading", 0, "正在连接服务器...")
    // ... 下载逻辑，在 ProgressWriter 中更新进度
    
    updateProgress("extracting", 50, "正在解压文件...")
    // ... 解压逻辑
    
    updateProgress("installing", 90, "正在配置CM环境...")
    // ... 安装逻辑
    
    updateProgress("completed", 100, "安装完成")
    return path, nil
}
```

### 3. 安装版本列表实现

```go
func getInstallVersions(c *gin.Context) {
    versions := []InstallVersion{
        {
            Id: "minimal",
            Name: "基础极速版",
            Description: "仅包含 CSP + Sol + 基础联机车包...",
            SizeBytes: 5.2 * 1024 * 1024 * 1024,
            Recommended: false,
            Includes: map[string]bool{
                "CSP": true,
                "Sol": true,
                "Map": false,
                // ...
            },
        },
        // standard 和 full 版本...
    }
    
    c.JSON(http.StatusOK, GetInstallVersionsResp{Versions: versions})
}
```

### 4. 安装进度查询实现

需要维护一个全局的安装任务映射：

```go
var installationTasks = make(map[string]*InstallationTask)
var tasksMutex sync.RWMutex

func getInstallProgress(c *gin.Context) {
    installId := c.Query("installId")
    if installId == "" {
        // 返回最新的任务
        installId = getLatestInstallId()
    }
    
    tasksMutex.RLock()
    task, exists := installationTasks[installId]
    tasksMutex.RUnlock()
    
    if !exists {
        c.JSON(http.StatusNotFound, ErrorResp{Error: "安装任务不存在"})
        return
    }
    
    // 计算总进度
    totalProgress := calculateTotalProgress(task)
    
    c.JSON(http.StatusOK, GetInstallProgressResp{
        InstallId: installId,
        Status: task.Status,
        TotalProgress: totalProgress,
        Categories: convertToCategories(task),
        // ...
    })
}
```

### 5. 安装日志实现

```go
type InstallLogStore struct {
    logs map[string][]InstallLog
    mutex sync.RWMutex
}

var logStore = &InstallLogStore{
    logs: make(map[string][]InstallLog),
}

func (s *InstallLogStore) AddLog(installId string, level string, message string, category string) {
    s.mutex.Lock()
    defer s.mutex.Unlock()
    
    log := InstallLog{
        Timestamp: time.Now().Unix(),
        Level: level,
        Message: message,
        Category: category,
    }
    
    s.logs[installId] = append(s.logs[installId], log)
}

func getInstallLogs(c *gin.Context) {
    installId := c.Query("installId")
    since := c.Query("since")  // Unix timestamp
    limit := c.DefaultQuery("limit", "100")
    level := c.DefaultQuery("level", "all")
    
    logStore.mutex.RLock()
    allLogs := logStore.logs[installId]
    logStore.mutex.RUnlock()
    
    // 过滤逻辑
    filteredLogs := filterLogs(allLogs, since, level, limit)
    
    c.JSON(http.StatusOK, GetInstallLogsResp{
        InstallId: installId,
        Logs: filteredLogs,
        Total: len(allLogs),
    })
}
```

## 📝 前端集成步骤

### 1. 重新生成API客户端

```bash
# 在项目根目录运行
cd DHC_Frontend
./gen_api.sh

# 或手动运行 OpenAPI Generator
npx @openapitools/openapi-generator-cli generate \
  -i ../DHC_AC_Installer.openapi.json \
  -g typescript-axios \
  -o src/api
```

### 2. 在 OneClickInstaller.tsx 中使用新的API

```typescript
import { DefaultApi, GetDiskInfoResp, GetInstallVersionsResp } from '@/api';

const api = new DefaultApi();

// 获取磁盘信息
const fetchDiskInfo = async () => {
  const resp = await api.apiGetDiskInfoGet({ drive: 'D:' });
  // 使用 resp.data 更新状态
};

// 获取安装版本列表
const fetchInstallVersions = async () => {
  const resp = await api.apiGetInstallVersionsGet();
  // 使用 resp.data.versions 更新 INSTALL_MODES
};

// 开始安装
const startInstall = async (versionId: string) => {
  const resp = await api.apiStartInstallPost({
    startInstallReq: { versionId, cleanInstall: false }
  });
  const installId = resp.data.installId;
  // 开始轮询进度
  pollInstallProgress(installId);
};

// 轮询安装进度
const pollInstallProgress = async (installId: string) => {
  const interval = setInterval(async () => {
    const resp = await api.apiGetInstallProgressGet({ installId });
    const progress = resp.data;
    
    // 更新UI状态
    setTotalProgress(progress.totalProgress);
    setCategories(progress.categories);
    
    if (progress.status === 'completed' || progress.status === 'failed') {
      clearInterval(interval);
    }
  }, 1000);
};
```

## ⚠️ 现有功能完备性分析

### ✅ 已完备的部分

1. **后端基础架构** ✅
   - 已有 `modInstall` 模块处理安装逻辑
   - 已有 `infoGet` 模块获取系统信息
   - 已有 `InstallCm()` 函数安装CM

2. **API路由框架** ✅
   - 已有 Gin 框架和路由注册机制
   - 已有基础的 handler 结构

### 🔨 需要补充的部分

1. **磁盘空间查询** ⚠️
   - `infoGet/getDiskInfo.go` 只检测SSD类型
   - **需要添加**：获取磁盘总空间、已用空间、可用空间的函数
   - 可以使用 Windows API 或 PowerShell 实现

2. **安装任务管理** ⚠️
   - **需要实现**：InstallationTaskManager 管理多个安装任务
   - **需要实现**：为每个安装生成唯一ID
   - **需要实现**：任务状态存储和查询

3. **进度跟踪** ⚠️
   - 现有的 `InstallCm()` 函数已有 `ProgressWriter`，但需要暴露给API
   - **需要实现**：各个安装阶段的进度更新机制
   - **需要实现**：进度查询API的实现

4. **安装日志** ⚠️
   - **需要实现**：日志存储结构（内存/文件/数据库）
   - **需要实现**：日志查询和过滤逻辑
   - **需要添加**：在各个安装函数中记录日志

5. **版本配置** ⚠️
   - **需要实现**：三种安装版本的配置定义
   - **需要实现**：根据版本ID执行不同的安装流程

## 🚀 实施优先级建议

### 阶段1：基础功能（必需）
1. ✅ 磁盘空间查询API实现
2. ✅ 安装版本列表API实现
3. ✅ CM安装状态检查API实现

### 阶段2：安装流程（核心）
1. ✅ 安装任务管理框架
2. ✅ 开始安装API实现
3. ✅ CM安装进度API实现
4. ✅ 总体安装进度API实现

### 阶段3：详细进度（增强）
1. ✅ 车包/光影/地图/车辆进度API实现
2. ✅ 安装日志API实现

## 📚 参考资源

- [OpenAPI 3.0 规范](https://swagger.io/specification/)
- [Gin Web Framework](https://gin-gonic.com/docs/)
- [OpenAPI Generator](https://openapi-generator.tech/)

## 🔍 测试建议

1. **单元测试**：为每个API handler编写单元测试
2. **集成测试**：测试完整的安装流程
3. **前端联调**：确保前后端API契约匹配

---

**注意**：此OpenAPI规范已包含所有必需的功能定义。后端实现时，请确保：
1. 严格按照规范定义的数据结构返回
2. 处理错误情况并返回适当的HTTP状态码
3. 确保线程安全（如果使用并发安装）
4. 考虑资源清理（安装任务完成后）
