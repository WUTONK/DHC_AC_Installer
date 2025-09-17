#!/bin/bash

# DHC AC Installer - 停止服务脚本
# 停止所有运行中的前后端服务

echo "🛑 停止 DHC AC Installer 服务..."

# 获取脚本所在目录
SCRIPT_DIR="$(dirname "$0")"

# 停止后端服务
if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔄 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "⚠️  强制停止后端服务..."
            kill -9 $BACKEND_PID
        fi
        echo "✅ 后端服务已停止"
    else
        echo "ℹ️  后端服务未运行"
    fi
    rm -f "$SCRIPT_DIR/.backend.pid"
else
    echo "ℹ️  未找到后端服务 PID 文件"
fi

# 停止前端服务
if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🔄 停止前端应用 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "⚠️  强制停止前端应用..."
            kill -9 $FRONTEND_PID
        fi
        echo "✅ 前端应用已停止"
    else
        echo "ℹ️  前端应用未运行"
    fi
    rm -f "$SCRIPT_DIR/.frontend.pid"
else
    echo "ℹ️  未找到前端应用 PID 文件"
fi

# 清理可能残留的进程
echo "🧹 清理残留进程..."

# 查找并停止可能的 Go 进程
GO_PIDS=$(pgrep -f "go run exec/main.go" 2>/dev/null)
if [ ! -z "$GO_PIDS" ]; then
    echo "🔄 停止残留的 Go 进程..."
    echo $GO_PIDS | xargs kill 2>/dev/null
fi

# 查找并停止可能的 Electron 进程
ELECTRON_PIDS=$(pgrep -f "electron" 2>/dev/null)
if [ ! -z "$ELECTRON_PIDS" ]; then
    echo "🔄 停止残留的 Electron 进程..."
    echo $ELECTRON_PIDS | xargs kill 2>/dev/null
fi

# 查找并停止可能的 Node.js 进程 (与项目相关)
NODE_PIDS=$(pgrep -f "pnpm dev" 2>/dev/null)
if [ ! -z "$NODE_PIDS" ]; then
    echo "🔄 停止残留的 Node.js 进程..."
    echo $NODE_PIDS | xargs kill 2>/dev/null
fi

echo ""
echo "✅ 所有服务已停止"
echo "📁 日志文件保留在: $SCRIPT_DIR/logs/"
