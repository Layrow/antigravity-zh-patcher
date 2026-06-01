#!/usr/bin/env bash
set -euo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  DIR="$(cd -P "$(dirname "$SOURCE")" >/dev/null 2>&1 && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE"
done

ROOT_DIR="$(cd -P "$(dirname "$SOURCE")" >/dev/null 2>&1 && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Antigravity 中文补丁入口

用法:
  antigravity-zh.sh [命令]

命令:
  install     完整汉化 Antigravity 和 Antigravity IDE，默认命令
  app         只安装 Antigravity 主应用汉化
  ide         只安装 Antigravity IDE 汉化
  preflight   校验项目并探测本机安装状态
  probe       只探测本机安装状态
  validate    只校验项目文件
  restore     从 backups/ 恢复最近备份
  help        显示帮助

写入 /Applications 时可能需要输入 macOS 管理员密码。
EOF
}

run_npm() {
  npm run "$@"
}

command="${1:-install}"

case "$command" in
  install)
    run_npm preflight
    run_npm app:install
    run_npm ide:zh
    run_npm ide:install-settings
    ;;
  app)
    run_npm preflight
    run_npm app:install
    ;;
  ide)
    run_npm preflight
    run_npm ide:zh
    run_npm ide:install-settings
    ;;
  preflight)
    run_npm preflight
    ;;
  probe)
    run_npm probe
    ;;
  validate)
    run_npm validate
    ;;
  restore)
    run_npm restore
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "未知命令: $command" >&2
    echo >&2
    usage >&2
    exit 2
    ;;
esac
