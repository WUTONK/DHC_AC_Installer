#!/bin/bash

# DHC AC Installer - 后端启动脚本
# 启动 Go 后端服务

echo "🚀 启动 DHC AC Installer 后端服务..."

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "❌ 错误: Go 未安装，请先安装 Go"
    exit 1
fi

# 进入后端目录
cd "$(dirname "$0")/DHC_Backend"

# 检查 go.mod 文件是否存在
if [ ! -f "go.mod" ]; then
    echo "❌ 错误: 未找到 go.mod 文件"
    exit 1
fi

# 下载依赖
echo "📦 下载 Go 依赖..."
go mod tidy

# 启动服务
echo "🌟 启动后端服务 (端口: 19810)..."
go run exec/main.go
