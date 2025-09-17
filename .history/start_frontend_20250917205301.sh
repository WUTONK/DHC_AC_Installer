#!/bin/bash

# DHC AC Installer - 前端启动脚本
# 启动 Electron 前端应用

echo "🚀 启动 DHC AC Installer 前端应用..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: pnpm 未安装，请先安装 pnpm"
    echo "💡 提示: 运行 'npm install -g pnpm' 安装 pnpm"
    exit 1
fi

# 进入前端目录
cd "$(dirname "$0")/DHC_Frontend"

# 检查 package.json 文件是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json 文件"
    exit 1
fi

# 安装依赖
echo "📦 安装前端依赖..."
pnpm install

# 启动开发模式
echo "🌟 启动前端应用 (开发模式)..."
pnpm dev
