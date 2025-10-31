#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$script_dir"

spec_file="$project_root/DHC_AC_Installer.openapi.json"
backend_dir="$project_root/DHC_Backend"
frontend_dir="$project_root/DHC_Frontend"

backend_spec_target="$backend_dir/DHC_AC_Installer.openapi.json"
frontend_spec_target="$frontend_dir/DHC_AC_Installer.openapi.json"

echo "[INFO] 项目根目录: $project_root"

if [[ ! -f "$spec_file" ]]; then
  echo "[ERROR] 未找到 OpenAPI 文件: $spec_file" >&2
  exit 1
fi

if [[ ! -d "$backend_dir" ]]; then
  echo "[ERROR] 未找到后端目录: $backend_dir" >&2
  exit 1
fi

if [[ ! -d "$frontend_dir" ]]; then
  echo "[ERROR] 未找到前端目录: $frontend_dir" >&2
  exit 1
fi

echo "[INFO] 复制 OpenAPI 到后端: $backend_spec_target"
cp -f "$spec_file" "$backend_spec_target"

echo "[INFO] 复制 OpenAPI 到前端: $frontend_spec_target"
cp -f "$spec_file" "$frontend_spec_target"

if [[ ! -f "$backend_dir/gen_api.sh" ]]; then
  echo "[ERROR] 后端缺少 gen_api.sh: $backend_dir/gen_api.sh" >&2
  exit 1
fi

if [[ ! -f "$frontend_dir/gen_api.sh" ]]; then
  echo "[ERROR] 前端缺少 gen_api.sh: $frontend_dir/gen_api.sh" >&2
  exit 1
fi

echo "[INFO] 在后端目录执行 gen_api.sh"
(
  cd "$backend_dir"
  bash ./gen_api.sh
)

echo "[INFO] 在前端目录执行 gen_api.sh"
(
  cd "$frontend_dir"
  bash ./gen_api.sh
)

echo "[SUCCESS] OpenAPI 复制完成且已在前后端生成客户端/服务端代码。"


