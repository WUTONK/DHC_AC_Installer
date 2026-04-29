#!/bin/bash
# 重制虚拟 AC 环境脚本
set -e

BACKEND_DIR="DHC_Backend"
TARGET_DIR="$BACKEND_DIR/test/simEnv/acRoot/AC_SKELETON_HASDLC/Assetto Corsa"
BACKUP_DIR="$BACKEND_DIR/test/simEnv/acRoot/envBackup/AC_SKELETON_HASDLC"

# macOS 自带 openrsync 2.x：用 --progress（按文件进度）；若安装了 GNU rsync 3.1+ 可用单行总进度
rsync_with_progress() {
  local name="$1"
  local from="$2"
  local to="$3"
  local size
  size=$(du -sh "$from" 2>/dev/null | cut -f1 || echo "?")
  echo ""
  echo "---- $name（源约 $size）----"
  if rsync --help 2>&1 | grep -qF "info=progress2"; then
    rsync -aH --info=progress2 "$from" "$to"
  else
    rsync -aH --progress "$from" "$to"
  fi
}

echo "正在重置虚拟 AC 环境..."

if [ ! -d "$BACKUP_DIR" ]; then
    echo "错误: 找不到备份目录 $BACKUP_DIR"
    exit 1
fi

# 确保目标目录存在
mkdir -p "$TARGET_DIR"

# 模拟 Go 中的 ResetSimEnvModDirectoriesForDevCleanup 逻辑：
# 1. 清理现有的 content 和 cfg
echo "步骤 1/2：清理旧 data/cfg（大目录时 rm 会静默执行几秒属正常）..."
[ -d "$TARGET_DIR/content" ] && echo "  将删除 content: $(du -sh "$TARGET_DIR/content" 2>/dev/null | cut -f1)"
[ -d "$TARGET_DIR/cfg" ]    && echo "  将删除 cfg:     $(du -sh "$TARGET_DIR/cfg" 2>/dev/null | cut -f1)"
rm -rf "$TARGET_DIR/content" "$TARGET_DIR/cfg"
echo "  清理完成。"

# 2. 从备份还原（用 rsync 可看到实时传输/逐文件进度）
echo "步骤 2/2：从备份还原..."
if [ ! -d "$BACKUP_DIR/content" ] || [ ! -d "$BACKUP_DIR/cfg" ]; then
  echo "错误: 备份不完整（需要 $BACKUP_DIR/content 与 $BACKUP_DIR/cfg）"
  exit 1
fi
rsync_with_progress "content" "$BACKUP_DIR/content/" "$TARGET_DIR/content/"
rsync_with_progress "cfg"       "$BACKUP_DIR/cfg/"      "$TARGET_DIR/cfg/"

echo ""
echo "✅ 虚拟 AC 环境重置成功！"
