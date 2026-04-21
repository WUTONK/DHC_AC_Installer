# DHC AC Installer

一个使用 Electron + React + TypeScript 构建的桌面应用程序。

## 技术栈
  
- **前端**: Electron + React + TypeScript
- **后端**: GO + Gin
- **构建工具**: Vite + electron-vite
- **包管理**: pnpm

## 项目结构

```
DHC_AC_Installer/
├── DHC_Frontend/           # Electron + React 前端
│   ├── src/
│   │   ├── main/           # Electron 主进程
│   │   ├── preload/        # Electron 预加载脚本
│   │   └── renderer/       # React 渲染进程
│   │       ├── src/
│   │       │   ├── components/  # React 组件
│   │       │   └── App.tsx     # 主应用组件
│   │       └── index.html
│   ├── package.json
│   └── electron.vite.config.ts
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

将DHC_DEV设置为"ture"将进入开发模式 "false"将进入开发模式（注意区分大小写）

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
