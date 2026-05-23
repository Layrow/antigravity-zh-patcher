#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist/ide-settings"
AGENT_SOURCE="$DIST_DIR/jetskiAgent-main.js"
NLS_SOURCE="$DIST_DIR/nls.messages.json"
AGENT_TARGET="/Applications/Antigravity IDE.app/Contents/Resources/app/out/jetskiAgent/main.js"
NLS_TARGET="/Applications/Antigravity IDE.app/Contents/Resources/app/out/nls.messages.json"

cd "$ROOT_DIR"

echo "正在生成 Antigravity IDE Settings 汉化补丁..."
npm run ide:patch-settings

if [[ ! -f "$AGENT_SOURCE" && ! -f "$NLS_SOURCE" ]]; then
  echo "没有发现需要 sudo 安装的 dist 文件，可能已经直接写入成功。"
  exit 0
fi

echo "正在退出 Antigravity IDE..."
osascript -e 'tell application "Antigravity IDE" to quit' >/dev/null 2>&1 || true
sleep 1
pkill -TERM -f "Antigravity IDE.app" >/dev/null 2>&1 || true
pkill -TERM -f "antigravity-ide" >/dev/null 2>&1 || true
sleep 1

if pgrep -if "Antigravity IDE.app|antigravity-ide" >/dev/null 2>&1; then
  echo "仍检测到 Antigravity IDE 残留进程，尝试强制结束..."
  pkill -KILL -f "Antigravity IDE.app" >/dev/null 2>&1 || true
  pkill -KILL -f "antigravity-ide" >/dev/null 2>&1 || true
  sleep 1
fi

if [[ -f "$AGENT_SOURCE" ]]; then
  echo "安装 IDE Settings bundle..."
  sudo cp "$AGENT_SOURCE" "$AGENT_TARGET"
fi

if [[ -f "$NLS_SOURCE" ]]; then
  echo "安装 IDE NLS messages..."
  sudo cp "$NLS_SOURCE" "$NLS_TARGET"
fi

echo "Antigravity IDE Settings 汉化安装完成。请重新打开 Antigravity IDE。"
