# Apifox 导入 OpenAPI 规范指南

## 📥 方法一：直接导入文件（推荐）

### 步骤

1. **打开 Apifox**
   - 启动 Apifox 应用

2. **进入项目设置**
   - 点击左侧项目名称
   - 选择 **"导入"** 或 **"Import"**

3. **选择导入方式**
   - 在导入弹窗中，选择 **"OpenAPI"** 或 **"Swagger"**
   - 或者选择 **"文件导入"** → **"OpenAPI 3.0"**

4. **选择文件**
   - 点击 **"选择文件"** 或拖拽文件
   - 选择 `DHC_AC_Installer.openapi.restful.json`
   - 点击 **"导入"**

5. **配置导入选项**
   - ✅ 勾选 **"自动创建目录"**（如果有）
   - ✅ 勾选 **"导入示例"**（如果有）
   - 点击 **"确定"** 完成导入

### 导入后的效果

导入成功后，你会在 Apifox 中看到：
- 📁 **API 分组**（根据 tags 自动创建）：
  - Installations（安装任务管理）
  - CM（Content Manager）
  - System（系统信息）
- 📄 **所有 API 端点**已自动创建
- 📋 **请求参数和响应结构**已自动解析

---

## 📥 方法二：通过 URL 导入（如果文件在服务器上）

如果 OpenAPI 文件托管在服务器上：

1. 在导入界面选择 **"URL 导入"**
2. 输入文件 URL（例如：`http://your-server/api/openapi.json`）
3. 点击 **"导入"**

---

## 📥 方法三：复制粘贴 JSON（临时测试）

1. 打开 `DHC_AC_Installer.openapi.restful.json`
2. 复制全部内容（Cmd/Ctrl + A，然后 Cmd/Ctrl + C）
3. 在 Apifox 导入界面选择 **"粘贴导入"**
4. 粘贴 JSON 内容
5. 点击 **"导入"**

---

## 🔍 导入后如何查看

### 1. 查看 API 列表
- 左侧边栏会显示所有 API
- 按分组（tags）组织
- 点击任意 API 可查看详情

### 2. 查看 API 详情
点击任意 API 后，可以看到：
- **请求方法**（GET/POST/DELETE）
- **请求路径**（如 `/api/installations/{installId}/progress`）
- **路径参数**（如 `installId`）
- **查询参数**（如 `category`, `carName`）
- **请求体**（POST 请求）
- **响应结构**（200, 400, 404 等）

### 3. 测试 API
- 点击 **"发送"** 按钮可以直接测试 API
- 修改参数值后再次发送
- 查看响应结果

---

## ⚠️ 常见问题

### 问题1：导入后看不到 API
**解决方案**：
- 检查文件格式是否正确（JSON 格式）
- 确认 OpenAPI 版本是 3.0.1
- 查看 Apifox 控制台是否有错误提示

### 问题2：路径参数显示不正确
**解决方案**：
- 确认路径参数格式：`{installId}` 而不是 `:installId`
- 检查 OpenAPI 规范中路径参数定义是否正确

### 问题3：响应结构不完整
**解决方案**：
- 检查 `components/schemas` 中的定义是否完整
- 确认 `$ref` 引用是否正确

### 问题4：中文显示乱码
**解决方案**：
- 确保文件是 UTF-8 编码
- 在 Apifox 设置中检查字符编码

---

## 🔄 更新 API 规范

如果修改了 OpenAPI 文件，需要重新导入：

### 方法1：重新导入（会覆盖）
1. 删除旧的 API 分组（可选）
2. 重新执行导入步骤
3. 选择 **"覆盖导入"**（如果有此选项）

### 方法2：增量更新
1. 在 Apifox 中手动修改已导入的 API
2. 或者删除旧的分组后重新导入

---

## 💡 最佳实践

### 1. 使用版本控制
- 将 OpenAPI 文件纳入 Git 版本控制
- 每次修改后提交，方便团队协作

### 2. 定期同步
- 后端修改 API 后，及时更新 OpenAPI 文件
- 重新导入到 Apifox，保持文档同步

### 3. 添加示例数据
- 在 OpenAPI 规范中添加 `example` 字段
- 导入后 Apifox 会自动使用示例数据

### 4. 使用环境变量
- 在 Apifox 中配置环境变量（如 `baseUrl`）
- 方便在不同环境（开发/测试/生产）间切换

---

## 📝 快速检查清单

导入前确认：
- [ ] OpenAPI 文件格式正确（JSON）
- [ ] 版本号是 3.0.1
- [ ] 所有 `$ref` 引用正确
- [ ] 文件编码是 UTF-8

导入后检查：
- [ ] 所有 API 都已导入
- [ ] 分组（tags）正确显示
- [ ] 路径参数和查询参数正确解析
- [ ] 响应结构完整
- [ ] 可以正常发送测试请求

---

## 🎯 示例：导入后的 API 结构

```
📁 DHC AC Installer API
  📁 Installations
    📄 GET /api/installations (获取安装任务列表)
    📄 POST /api/installations (创建新的安装任务)
    📄 GET /api/installations/{installId} (获取安装任务详情)
    📄 DELETE /api/installations/{installId} (取消安装任务)
    📄 GET /api/installations/{installId}/progress (获取安装进度)
    📄 GET /api/installations/{installId}/logs (获取安装日志)
  📁 CM
    📄 GET /api/cm/status (检查CM安装状态)
    📄 POST /api/cm/install (开始安装CM)
    📄 GET /api/cm/install/progress (获取CM安装进度)
  📁 System
    📄 GET /api/system/disk (获取磁盘信息)
    📄 GET /api/system/game-path (获取游戏路径)
    📄 GET /api/system/install-versions (获取安装版本列表)
    📄 GET /api/servers/info (获取服务器信息)
```

---

## 🔗 相关资源

- [Apifox 官方文档](https://apifox-openapi.apifox.cn/)
- [OpenAPI 3.0 规范](https://swagger.io/specification/)
- [Apifox 导入功能说明](https://help.apifox.com/)

---

**提示**：如果遇到问题，可以查看 Apifox 的导入日志或联系 Apifox 技术支持。
