#!/bin/bash

# Windows 平台打包脚本
# 此脚本用于构建 Windows 安装程序

set -e

echo "=========================================="
echo "DHC AC Installer - Windows 打包脚本"
echo "=========================================="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -d "DHC_Frontend" ] || [ ! -d "DHC_Backend" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo -e "${RED}错误: 未找到 Go 编译器，请先安装 Go${NC}"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}警告: 未找到 pnpm，尝试使用 npm...${NC}"
    PACKAGE_MANAGER="npm"
else
    PACKAGE_MANAGER="pnpm"
fi

echo -e "${GREEN}步骤 1/4: 编译 Go 后端...${NC}"
cd DHC_Backend

# 编译 Windows 版本的后端
echo "正在编译 Windows x64 版本..."
GOOS=windows GOARCH=amd64 go build -o main.exe cmd/main.go
if [ $? -ne 0 ]; then
    echo -e "${RED}后端编译失败！${NC}"
    exit 1
fi

# 同时创建 main 文件（electron-builder 需要）
# 在 Windows 上，electron-builder 会自动处理 .exe 扩展名
cp main.exe main 2>/dev/null || true
echo -e "${GREEN}后端编译完成${NC}"
cd ..

echo ""
echo -e "${GREEN}步骤 2/4: 安装前端依赖...${NC}"
cd DHC_Frontend
$PACKAGE_MANAGER install
if [ $? -ne 0 ]; then
    echo -e "${RED}依赖安装失败！${NC}"
    exit 1
fi
echo -e "${GREEN}依赖安装完成${NC}"

echo ""
echo -e "${GREEN}步骤 3/4: 构建前端应用...${NC}"
$PACKAGE_MANAGER run build
if [ $? -ne 0 ]; then
    echo -e "${RED}前端构建失败！${NC}"
    exit 1
fi
echo -e "${GREEN}前端构建完成${NC}"

echo ""
echo -e "${GREEN}步骤 4/4: 打包 Windows 安装程序...${NC}"
$PACKAGE_MANAGER run build:win
if [ $? -ne 0 ]; then
    echo -e "${RED}打包失败！${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}=========================================="
echo "打包完成！"
echo "=========================================="
echo ""
echo "安装程序位置:"
echo "  DHC_Frontend/dist/"
echo ""
echo -e "${YELLOW}注意: 此脚本在非 Windows 系统上只能编译后端，"
echo "完整的 Windows 安装程序需要在 Windows 系统上使用 electron-builder 构建。"
echo ""
echo "在 Windows 系统上，可以直接运行:"
echo "  cd DHC_Frontend"
echo "  pnpm run build:win"
echo -e "${NC}"

