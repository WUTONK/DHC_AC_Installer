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

# 环境变量配置说明
# DHC_DEV: 控制是否为开发模式（接受 true/false，脚本默认 true）
#   - true: 开发模式，使用测试环境（脚本默认）
#   - false: 生产模式，使用真实游戏环境
# 
# DHC_TEST_ENV: 开发模式下使用的测试环境类型（仅在 DHC_DEV=true 时生效）
#   - simEnvhasDlc: 测试环境（有DLC），默认
#   - simEnvnoDlc: 测试环境（无DLC）
# 
# 示例:
#   - 开发模式（默认）: ./start_backend.sh
#   - 生产模式: DHC_DEV=false ./start_backend.sh
#   - 开发模式（无DLC）: DHC_TEST_ENV=simEnvnoDlc ./start_backend.sh

# 如果未设置 DHC_DEV，默认设置为 true（开发模式）
if [ -z "$DHC_DEV" ]; then
    export DHC_DEV=true
fi

if [ "$DHC_DEV" = "true" ]; then
    TEST_ENV_TYPE="${DHC_TEST_ENV:-simEnvhasDlc}"
    echo "ℹ️  运行模式: 开发模式 (测试环境类型: $TEST_ENV_TYPE)"
else
    echo "ℹ️  运行模式: 生产模式 (使用真实游戏环境)"
fi

# 启动服务
echo "🌟 启动后端服务 (端口: 19810)..."
go run cmd/main.go
