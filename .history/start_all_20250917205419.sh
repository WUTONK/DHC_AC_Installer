#!/bin/bash

# DHC AC Installer - 完整启动脚本
# 同时启动前端和后端服务

echo "🚀 启动 DHC AC Installer 完整服务..."

# 获取脚本所在目录
SCRIPT_DIR="$(dirname "$0")"

# 检查必要的工具
echo "🔍 检查环境..."

# 检查 Go
if ! command -v go &> /dev/null; then
    echo "❌ 错误: Go 未安装，请先安装 Go"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: pnpm 未安装，请先安装 pnpm"
    echo "💡 提示: 运行 'npm install -g pnpm' 安装 pnpm"
    exit 1
fi

echo "✅ 环境检查完成"

# 创建日志目录
mkdir -p "$SCRIPT_DIR/logs"

# 启动后端服务
echo "🌟 启动后端服务..."
cd "$SCRIPT_DIR/DHC_Backend"
go mod tidy > "$SCRIPT_DIR/logs/backend_setup.log" 2>&1
go run exec/main.go > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ 后端服务启动失败，请检查日志: $SCRIPT_DIR/logs/backend.log"
    exit 1
fi

echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"

# 启动前端服务
echo "🌟 启动前端应用..."
cd "$SCRIPT_DIR/DHC_Frontend"
pnpm install > "$SCRIPT_DIR/logs/frontend_setup.log" 2>&1
pnpm dev > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端应用启动..."
sleep 5

# 检查前端是否启动成功
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ 前端应用启动失败，请检查日志: $SCRIPT_DIR/logs/frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ 前端应用已启动 (PID: $FRONTEND_PID)"

# 保存进程ID到文件
echo $BACKEND_PID > "$SCRIPT_DIR/.backend.pid"
echo $FRONTEND_PID > "$SCRIPT_DIR/.frontend.pid"

echo ""
echo "🎉 DHC AC Installer 服务启动完成!"
echo "📊 服务信息:"
echo "   - 后端服务: http://127.0.0.1:19810 (PID: $BACKEND_PID)"
echo "   - 前端应用: 正在启动 Electron 窗口"
echo "   - 日志文件: $SCRIPT_DIR/logs/"
echo ""
echo "💡 提示:"
echo "   - 使用 './stop_all.sh' 停止所有服务"
echo "   - 使用 'tail -f logs/backend.log' 查看后端日志"
echo "   - 使用 'tail -f logs/frontend.log' 查看前端日志"
echo ""

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f "$SCRIPT_DIR/.backend.pid" "$SCRIPT_DIR/.frontend.pid"; echo "✅ 服务已停止"; exit 0' INT

echo "按 Ctrl+C 停止所有服务"
wait
