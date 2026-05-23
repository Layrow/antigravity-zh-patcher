# Antigravity 汉化项目接续说明

这个文件用于给后续继续处理本项目时快速接上上下文。

## 当前目标

对已经安装好的 Antigravity 2.0 做中文本地化辅助：

- 处理 `/Applications/Antigravity.app`
- 处理 `/Applications/Antigravity IDE.app`
- 不处理 `Antigravity Manager.app`

重点是主应用 `Antigravity.app` 的 Settings 页面和 Electron 壳层文案。

## 当前状态

- 项目目录：`/Users/fyh/game/tc`
- Git 已初始化。
- 已提交过一次基础版本：`278ba20 feat: 添加 Antigravity 汉化脚本`
- `Antigravity IDE.app` 走 VS Code 中文语言包方案。
- `Antigravity.app` 通过重打包 `app.asar` 注入壳层翻译和 Settings DOM 翻译。

已知探测结果：

- `/Applications/Antigravity.app`：版本 `2.0.6`，bundle id `com.google.antigravity`
- `/Applications/Antigravity IDE.app`：版本 `2.0.3`，bundle id `com.google.antigravity-ide`
- 主业务 UI 很可能由 `/Applications/Antigravity.app/Contents/Resources/bin/language_server` 提供。
- 不建议直接硬改 `language_server` 二进制。

## 常用命令

探测安装状态：

```bash
npm run probe
```

配置 Antigravity IDE 中文：

```bash
npm run ide:zh
```

生成主应用汉化补丁：

```bash
npm run shell:patch
```

推荐安装入口：

```bash
npm run app:install
```

恢复备份：

```bash
npm run restore
```

## 最推荐的操作方式

日常重新安装汉化时，优先运行：

```bash
cd /Users/fyh/game/tc
npm run app:install
```

这个脚本会：

1. 正常退出 `Antigravity.app`。
2. 结束残留的 `Antigravity Helper` / `language_server`。
3. 重新生成当前版本补丁。
4. 用管理员权限覆盖 `/Applications/Antigravity.app/Contents/Resources/app.asar`。
5. 校验生成文件和安装目标的 hash。

不要在 Antigravity 运行时手动覆盖 `app.asar`，否则可能出现白屏。

## 文件结构要点

- `README.md`：给用户看的说明。
- `antigravity-zh-plan.md`：整体汉化规划。
- `scripts/probe-antigravity.js`：探测本机 Antigravity 安装情况。
- `scripts/configure-ide-zh.js`：配置 Antigravity IDE 的中文语言包和 locale。
- `scripts/patch-antigravity-shell.js`：生成主应用 `app.asar` 汉化补丁。
- `scripts/settings-dom-translator.js`：生成注入 Settings 页面的 DOM 文案替换脚本。
- `scripts/install-antigravity-zh.sh`：一键安装脚本，包含退出进程、生成补丁、sudo 覆盖和校验。
- `scripts/restore.js`：从备份恢复。
- `translations/antigravity-shell.zh-CN.json`：Electron 壳层翻译词表。
- `translations/settings-dom.zh-CN.json`：Settings 页面 DOM 翻译词表。

## 重要风险和经验

1. 覆盖 `/Applications/Antigravity.app/Contents/Resources/app.asar` 前必须完全退出 Antigravity。
2. 如果应用仍在运行时覆盖资源，可能导致白屏或资源状态不一致。
3. macOS 可能拒绝普通写入 `/Applications/.../app.asar`，通常需要 `sudo cp`。
4. 修改 `.app` 内部资源会破坏原始代码签名，这是手动汉化 Electron 应用的常见副作用。
5. Antigravity 官方更新通常会覆盖 `app.asar`，更新后需要重新生成补丁，不要直接复用旧 `dist/antigravity-app.zh-CN.asar`。
6. Settings 汉化目前是 DOM 文案替换方式，优点是可恢复、避开二进制硬改；缺点是可能漏掉动态文案。
7. 之前出现过白屏，处理这类问题优先回滚最近可用备份，再缩小补丁范围排查。

## 更新后的处理流程

Antigravity 更新后按这个顺序：

1. 先更新 Antigravity。
2. 打开官方新版，确认未打补丁时可以正常启动。
3. 关闭 Antigravity。
4. 回到项目目录运行：

```bash
npm run app:install
```

5. 重新打开 Antigravity，重点检查 Settings 页面。

如果白屏：

1. 先恢复备份：

```bash
npm run restore
```

2. 如果 `restore` 被系统权限拦截，从 `backups/` 中选择最近可用的 `antigravity-app.asar`，手动执行：

```bash
sudo cp "/path/to/backup/antigravity-app.asar" "/Applications/Antigravity.app/Contents/Resources/app.asar"
```

3. 恢复后确认官方或上一个可用版本能打开，再继续排查补丁。

## 下一步方向

优先级从高到低：

1. 继续补齐 `translations/settings-dom.zh-CN.json` 中 Settings 页面的英文文案。
2. 保持补丁范围尽量小，避免为了翻译更多文案引入白屏风险。
3. 如果要深入主业务 UI，先研究 `language_server` 提供 UI bundle 的方式，优先找资源覆盖、缓存目录或本地端口，不要直接改二进制。
4. 每次扩大注入逻辑后，都先生成补丁、退出应用、安装、启动验证。
5. 验证稳定后再提交。

## 提交建议

提交信息使用中文 conventional commits，例如：

```text
docs: 补充项目接续说明
feat: 扩展 Settings 汉化词表
fix: 修复汉化补丁导致白屏的问题
```

