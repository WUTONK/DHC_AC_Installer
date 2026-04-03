# DHC DEMO 一键安装（开发者模式）接口文档

## 适用场景

- 仅用于开发者调试 / 前后端联调
- 必须开启开发者环境变量：`DHC_DEV=true`
- 实际写入文件只会发生在后端的 `test/simEnv/` 测试游戏目录中，避免污染真实用户环境

## 关键环境变量

- `DHC_DEV=true|false`
  - `true`：启用开发模式（允许写入 `test/simEnv`）
  - `false`：DEMO 安装会拒绝执行

- `DHC_DEMO_DLC_PASS=true|false`（可选，默认 `true`）
  - 控制 DEMO 的 “DLC 与车包检测” 阶段返回通过/不通过

- `DHC_DEMO_CARPACK_PASS=true|false`（可选，默认 `true`）
  - 控制 DEMO 的 “车包检测” 返回通过/不通过

## 安装任务接口（复用 /api/installations 的 tracker 轮询）

### 1. 创建任务

`POST /api/installations`

请求体：
```json
{
  "versionId": "demo-install-v1"
}
```

返回：
```json
{
  "id": "install_xxx",
  "versionId": "demo-install-v1",
  "status": "preparing",
  "startTime": 1712345678
}
```

### 2. 轮询进度

`GET /api/installations/{installId}/progress?category=all`

返回包含：
- `totalProgress`
- `categories[]`
  - `categoryId`
  - `categoryName`
  - `status`：waiting/active/completed/failed
  - `progress`：0-100（该类别内部 tracker 换算后的总进度）
  - `currentItem`：tracker 当前阶段的阶段名（用于前端日志）
  - `subProgress`：当前阶段内子进度 0-100（用于更细粒度展示）

## DEMO 前置检测接口（用于环境检查卡片）

### 资源包校验结果

`GET /api/demo/precheck/resources`

返回：
```json
{
  "imported": true,
  "complete": true
}
```

### DLC 与车包齐全性

`GET /api/demo/precheck/dlc-carpack`

返回：
```json
{
  "hasAllDLC": true
}
```

### CM 是否已安装

`GET /api/demo/precheck/cm`

返回：
```json
{
  "cmInstalled": false
}
```

## DEMO 相关 versionId 列表

- `demo-resource-verify-v1`
  - 用于前端资源导入/校验进度条（进度类别为 `resource`）
- `demo-install-v1`
  - 一键安装 DEMO（进度类别为 `core/weather/map/cars`）

