# Antigravity 2.0 汉化规划

## 目标范围

- `Antigravity.app`：主应用，当前版本 `2.0.6`。
- `Antigravity IDE.app`：编辑器界面，当前版本 `2.0.3`。
- 明确排除：`Antigravity Manager.app`。

## 已确认结构

### Antigravity.app

- 路径：`/Applications/Antigravity.app`
- 包标识：`com.google.antigravity`
- 主资源：`/Applications/Antigravity.app/Contents/Resources/app.asar`
- 主要二进制：
  - `/Applications/Antigravity.app/Contents/Resources/bin/language_server`
  - `/Applications/Antigravity.app/Contents/Resources/bin/webm_encoder`
- 初步判断：
  - `app.asar` 是 Electron 壳，负责启动窗口、托盘、菜单、更新、安装向导、IPC 等。
  - 真正的业务 UI 很可能由 `language_server` 在本地端口提供。
  - `language_server` 是 121MB 的 Mach-O arm64 可执行文件，内部包含大量字符串、协议和前端/服务端逻辑。
  - `Resources/zh_CN.lproj` 存在，但大概率只是 Electron/Chromium 外壳语言资源，不代表业务 UI 已汉化。

### Antigravity IDE.app

- 路径：`/Applications/Antigravity IDE.app`
- 包标识：`com.google.antigravity-ide`
- 版本：`2.0.3`
- 关键资源：
  - `/Applications/Antigravity IDE.app/Contents/Resources/app/out/nls.keys.json`
  - `/Applications/Antigravity IDE.app/Contents/Resources/app/out/nls.messages.json`
  - `/Applications/Antigravity IDE.app/Contents/Resources/app/extensions/*/package.nls.json`
- 初步判断：
  - IDE 基于 VS Code/Electron 体系。
  - `nls.messages.json` 中有 16562 条英文 UI 文案。
  - 这是最适合优先汉化的入口。

## 推荐策略

### 第一阶段：低风险验证

目标：确认哪些内容可以不破坏签名、不影响启动地汉化。

1. 备份原始资源：
   - `Antigravity.app/Contents/Resources/app.asar`
   - `Antigravity IDE.app/Contents/Resources/app/out/nls.messages.json`
   - IDE 内置扩展的 `package.nls.json`

2. 只改少量可见文案：
   - IDE：修改 `nls.messages.json` 前 20 到 50 条常见 UI 文案。
   - 主应用：只修改 Electron 壳层菜单，如 `New Window`、`Open Antigravity`、`Quit`、`Check for Updates`、`Loading Antigravity`。

3. 启动验证：
   - IDE 是否正常启动。
   - 菜单栏是否显示中文。
   - 命令面板、设置页、活动栏、弹窗是否出现中文。
   - 是否触发 macOS 签名/隔离/损坏提示。

### 第二阶段：IDE 汉化主线

目标：先把 Antigravity IDE 做到可用汉化。

1. 建立翻译映射文件：
   - `translations/ide-core.zh-CN.json`
   - `translations/ide-extensions.zh-CN.json`

2. 处理核心 UI：
   - `nls.messages.json`
   - `nls.keys.json` 仅用于定位，不直接翻译。

3. 处理内置扩展：
   - `extensions/*/package.nls.json`
   - 可优先处理：
     - git
     - github
     - terminal
     - search
     - markdown
     - json
     - typescript
     - python
     - configuration-editing

4. 尽量复用 VS Code 中文语言包翻译：
   - 相同英文文案优先使用成熟译法。
   - Antigravity 特有文案单独维护。

### 第三阶段：Antigravity.app 主应用

目标：先汉化 Electron 壳层，再评估 `language_server`。

1. `app.asar` 可汉化内容：
   - `dist/main.js`
   - `dist/menu.js`
   - `dist/tray.js`
   - `dist/loadingOverlay.js`
   - `dist/ideInstall/wizardHtml.js`
   - `dist/ipcHandlers.js`
   - `dist/updater.js`

2. 可见文案示例：
   - `New Window`
   - `Open workspace`
   - `Open Antigravity`
   - `Quit`
   - `Check for Updates`
   - `Loading Antigravity`
   - `Binary not found`

3. `language_server` 评估：
   - 先用 `strings`、本地端口抓包、浏览器 DevTools 定位前端资源。
   - 如果它从二进制内嵌资源提供页面，需要判断是否存在外部可覆盖资源目录。
   - 如果只有二进制内嵌字符串，不建议直接二进制硬改，风险高、版本脆弱、签名和完整性问题多。

### 第四阶段：补丁工具化

目标：不要手工改应用，做成可重复应用和可恢复的补丁。

建议脚本：

- `scripts/probe-antigravity.js`
  - 检查安装路径和版本。
  - 输出可汉化资源清单。

- `scripts/patch-ide.js`
  - 备份 IDE NLS 文件。
  - 应用中文翻译。
  - 支持恢复。

- `scripts/patch-antigravity-shell.js`
  - 解包/重打包 `app.asar` 或直接结构化 patch。
  - 只处理 Electron 壳层文案。

- `scripts/restore.js`
  - 恢复所有备份文件。

建议命令：

```bash
node scripts/probe-antigravity.js
node scripts/patch-ide.js
node scripts/patch-antigravity-shell.js
node scripts/restore.js
```

## 术语表

- Agent：智能体
- Browser：浏览器
- Terminal：终端
- Workspace：工作区
- Project：项目
- Settings：设置
- Command：命令
- Tool：工具
- Permission：权限
- Approval：授权
- Sandbox：沙盒
- Artifact：产物
- Conversation：会话
- Check for Updates：检查更新
- New Window：新建窗口
- Open Workspace：打开工作区

## 风险与注意事项

- 应用更新会覆盖补丁，所以脚本必须检测版本并可重复运行。
- 修改 `.app` 内资源可能影响签名，尤其是二进制和 asar。
- 不建议发布修改后的完整 App，只发布补丁脚本和翻译表。
- `language_server` 是主难点，优先查是否有外部资源覆盖机制。
- 每个阶段都必须保留恢复脚本，避免影响正常使用。

## 建议下一步

1. 已完成 IDE 汉化原型：安装中文语言包并设置 `zh-cn`。
2. 已完成 `Antigravity.app` 壳层补丁脚本：能生成中文 `app.asar`，但 macOS 当前拒绝直接写回 `/Applications`。
3. 下一步研究 `language_server` 提供的主 UI 是否能以资源覆盖方式汉化。
