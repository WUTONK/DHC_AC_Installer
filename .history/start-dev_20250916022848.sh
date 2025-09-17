#!/bin/bash

# DHC AC Installer 开发环境启动脚本

echo "🚀 启动 DHC AC Installer 开发环境..."

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "❌ 错误: 未找到 Go，请先安装 Go"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: 未找到 pnpm，请先安装 pnpm"
    echo "安装命令: npm install -g pnpm"
    exit 1
fi

echo "✅ 环境检查通过"

# 进入前端目录
cd DHC_Frontend

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    pnpm install
fi

# 检查后端依赖
cd ../backend
if [ ! -f "go.sum" ]; then
    echo "📦 安装后端依赖..."
    go mod tidy
fi

# 返回前端目录并启动开发服务器
cd ../DHC_Frontend

echo "🎯 启动开发服务器..."
echo "📝 提示: Electron 会自动启动 Go 后端服务"
echo "🌐 前端地址: http://localhost:5173"
echo "🔧 后端地址: http://localhost:8080"
echo ""
echo "按 Ctrl+C 停止服务"

pnpm dev
