# DHC AC Installer

一个使用 Electron + React + TypeScript 构建的桌面应用程序，后端为 Go（Gin）。

## 从哪里读文档

建议按下列顺序查阅

1. **本 README**：运行方式、环境与仓库结构。
2. **[AI_GUIDE.md](./AI_GUIDE.md)**：给 AI 的架构鸟瞰与深度链接索引。
3. **API 契约**（唯一权威）：根目录 **`DHC_AC_Installer.openapi.json`**。
4. **领域文档**（按需跳转）：解压与覆盖参见 `DHC_Backend/models/service/decompression/OVERRIDE_CONTROL.md`
模组安装资源与路径参见 `DHC_Backend/models/service/modInstall/README.md`
Electron 前后端打通参见 `doc/Electron前后端通信入门.md`。`dft.json`
覆盖规则的字段语义以 **[doc/Backend/dft配置文件说明.md](./doc/Backend/dft配置文件说明.md)** 为准；示例骨架见 **`doc/Backend/ConfigurationFileTemplate/dhcFileTag_template.json`**（安装时文件名一般为包内 `dft.json`）。
5. **脚本细节**：[启动说明.md](./启动说明.md)。

后端未完成技术债：[DHC_Backend/需维护问题列表.md](./DHC_Backend/需维护问题列表.md)。

## 技术栈
  
- **前端**: Electron + React + TypeScript
- **后端**: GO + Gin
- **构建工具**: Vite + electron-vite
- **包管理**: pnpm

## 项目结构

```
DHC_AC_Installer/
├── DHC_Frontend/           # Electron + React 前端
├── DHC_Backend/           # Go 后端（安装、解压、进度等）
├── doc/                     # 补充说明与设计文档（非契约）
├── DHC_AC_Installer.openapi.json
├── AI_GUIDE.md
├── start_all.sh / start_backend.sh / start_frontend.sh
└── README.md
```

## 快速开始

### 前置要求

- Node.js (推荐 v18+)
- pnpm (推荐)

### 安装依赖

```bash
cd DHC_Frontend
pnpm install
```

### 运行应用

### 快速启动脚本
进入根目录，然后运行：
```bash
./start_all.sh
```

#### 开发调试建议
在进行安装逻辑开发或调试前，请运行以下脚本重置虚拟 AC 环境：
```bash
./reset_sim_env.sh
```
该脚本会将AC虚拟环境还原到备份状态，确保测试结果的一致性。

#### 开发/生产模式切换

将环境变量 `DHC_DEV` 设置为 `"true"` 进入开发模式，设置为 `"false"` 或不设置则进入生产模式（注意区分大小写）。

#### 生产模式

1. 构建前端：
```bash
cd DHC_Frontend
pnpm build
```

2. 打包应用：
```bash
pnpm build:mac    # macOS
pnpm build:win    # Windows
pnpm build:linux  # Linux
```

## 功能特性

- ✅ Electron 桌面应用
- ✅ React + TypeScript 前端
- ✅ 热重载开发环境
- ✅ 跨平台打包支持

## 开发说明


## 许可证

MIT License
