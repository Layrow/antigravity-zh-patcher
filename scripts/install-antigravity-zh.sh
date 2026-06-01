#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ASAR="/Applications/Antigravity.app/Contents/Resources/app.asar"
PATCHED_ASAR="$ROOT/dist/antigravity-app.zh-CN.asar"

cd "$ROOT"

find_remaining_processes() {
  ps -axo pid,ppid,comm,args \
    | grep -Ei 'Antigravity|antigravity|language_server' \
    | grep -Ev 'grep -Ei|install-antigravity-zh|patch-antigravity-shell|antigravity-zh(\.sh)?|/Users/fyh/game/antigravity-zh-patcher|Visual Studio Code' \
    || true
}

echo "==> 退出 Antigravity"
osascript -e 'tell application "Antigravity" to quit' >/dev/null 2>&1 || true
sleep 2

pkill -TERM -f '/Applications/Antigravity.app' >/dev/null 2>&1 || true
pkill -TERM -f 'language_server --standalone' >/dev/null 2>&1 || true
sleep 2

remaining="$(find_remaining_processes)"

if [[ -n "$remaining" ]]; then
  echo "==> 仍有残留进程，尝试强制结束"
  pkill -KILL -f '/Applications/Antigravity.app' >/dev/null 2>&1 || true
  pkill -KILL -f 'language_server --standalone' >/dev/null 2>&1 || true
  sleep 1
fi

remaining="$(find_remaining_processes)"

if [[ -n "$remaining" ]]; then
  echo "仍检测到相关进程，先不覆盖 app.asar："
  echo "$remaining"
  exit 1
fi

echo "==> 生成汉化补丁"
ANTIGRAVITY_ZH_GENERATE_ONLY=1 npm run shell:patch

if [[ ! -f "$PATCHED_ASAR" ]]; then
  echo "未找到生成的补丁文件：$PATCHED_ASAR"
  exit 1
fi

echo "==> 安装补丁"
if [[ "${EUID}" -eq 0 ]]; then
  cp "$PATCHED_ASAR" "$APP_ASAR"
else
  sudo cp "$PATCHED_ASAR" "$APP_ASAR"
fi

echo "==> 校验"
shasum -a 256 "$PATCHED_ASAR" "$APP_ASAR"

echo "完成。现在可以重新打开 Antigravity。"
