#!/bin/bash
# 重制虚拟 AC 环境脚本

BACKEND_DIR="DHC_Backend"
TARGET_DIR="$BACKEND_DIR/test/simEnv/acRoot/AC_SKELETON_HASDLC/Assetto Corsa"
BACKUP_DIR="$BACKEND_DIR/test/simEnv/acRoot/envBackup/AC_SKELETON_HASDLC"

echo "正在重置虚拟 AC 环境..."

if [ ! -d "$BACKUP_DIR" ]; then
    echo "错误: 找不到备份目录 $BACKUP_DIR"
    exit 1
fi

# 确保目标目录存在
mkdir -p "$TARGET_DIR"

# 模拟 Go 中的 ResetSimEnvModDirectoriesForDevCleanup 逻辑：
# 1. 清理现有的 content 和 cfg
echo "清理旧数据..."
rm -rf "$TARGET_DIR/content"
rm -rf "$TARGET_DIR/cfg"

# 2. 从备份还原
echo "从备份还原数据..."
cp -R "$BACKUP_DIR/content" "$TARGET_DIR/"
cp -R "$BACKUP_DIR/cfg" "$TARGET_DIR/"

echo "✅ 虚拟 AC 环境重置成功！"
