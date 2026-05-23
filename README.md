# Antigravity 2.0 汉化辅助脚本

本项目用于辅助汉化：

- `/Applications/Antigravity.app`
- `/Applications/Antigravity IDE.app`

不处理 `Antigravity Manager.app`。

## 已完成内容

### Antigravity IDE

优先使用 VS Code 原生语言包机制，并补充 Antigravity IDE 自定义 NLS：

- 安装 `MS-CEINTL.vscode-language-pack-zh-hans`
- 设置 `~/.antigravity-ide/argv.json` 中的 `"locale": "zh-cn"`
- 生成 `~/.antigravity-ide/languagepacks.json`
- 预生成 `~/.antigravity-ide/clp/.../nls.messages.json`
- 合并 `translations/antigravity-ide-overrides.zh-CN.json` 中的 Antigravity 专属文案

运行：

```bash
npm run ide:zh
```

完全退出并重启 `Antigravity IDE.app` 后生效。

### Antigravity.app 壳层

处理两类内容：

1. Electron 壳层文案，例如：

- 新建窗口
- 打开工作区
- 检查更新
- 加载提示
- 部分错误提示

2. Settings 页面 DOM 文案，例如：

- Permissions / Browser / Models / Appearance / App 等设置页签
- 终端命令自动执行、浏览器工具、沙盒、审核策略等设置项
- 设置项描述、占位符、按钮标题、tooltip/aria 文案

运行：

```bash
npm run shell:patch
```

## 一键安装脚本

推荐日常使用这个入口：

```bash
npm run app:install
```

这个脚本会自动完成：

1. 正常退出 `Antigravity.app`。
2. 结束残留的 `Antigravity Helper` / `language_server` 进程。
3. 重新生成当前版本可用的汉化补丁。
4. 使用管理员权限覆盖 `Antigravity.app` 内部的 `app.asar`。
5. 对比 `dist` 文件和实际安装文件的 hash，确认复制结果一致。

适用场景：

- Antigravity 更新后，需要重新安装汉化。
- 手动复制前，需要先把后台进程退干净。
- 不想分开执行 `npm run shell:patch` 和 `sudo cp`。

注意事项：

- 脚本执行过程中会要求输入 macOS 管理员密码。
- 运行前最好先打开一次官方新版 Antigravity，确认它本身可以正常启动。
- 不要在 Antigravity 运行时手动覆盖 `app.asar`，否则可能出现白屏。
- 如果补丁后白屏，先执行恢复流程，再重新生成补丁。

如果 macOS 拒绝脚本直接写入 `/Applications/Antigravity.app`，脚本仍会生成：

```bash
dist/antigravity-app.zh-CN.asar
```

此时请确认 Antigravity 已完全退出，然后手动安装：

```bash
sudo cp "/Users/fyh/game/tc/dist/antigravity-app.zh-CN.asar" "/Applications/Antigravity.app/Contents/Resources/app.asar"
```

## 探测

```bash
npm run probe
```

## 恢复

```bash
npm run restore
```

备份文件位于 `backups/`，该目录不会提交到 Git。

## 更新后的处理方式

Antigravity 官方更新很可能会覆盖：

```bash
/Applications/Antigravity.app/Contents/Resources/app.asar
```

所以更新后汉化补丁通常会失效。更新后不要直接复制旧的 `dist/antigravity-app.zh-CN.asar`，应重新生成适配当前版本的补丁：

```bash
cd /Users/fyh/game/tc
npm run shell:patch
```

然后完全退出 Antigravity，再安装新生成的补丁：

```bash
sudo cp "/Users/fyh/game/tc/dist/antigravity-app.zh-CN.asar" "/Applications/Antigravity.app/Contents/Resources/app.asar"
```

推荐流程：

1. 先更新 Antigravity。
2. 打开新版，确认官方版本能正常启动。
3. 运行 `npm run app:install`。
4. 重新打开 Antigravity 验证 Settings 页面。

如果不使用一键安装脚本，也可以手动执行：

```bash
npm run shell:patch
sudo cp "/Users/fyh/game/tc/dist/antigravity-app.zh-CN.asar" "/Applications/Antigravity.app/Contents/Resources/app.asar"
```

## 安装补丁前必须退出

覆盖 `app.asar` 前必须确保这些进程都已经退出：

- `Antigravity.app`
- `Antigravity Helper`
- `language_server`
- 其他由 Antigravity 启动的相关子进程

可检查：

```bash
pgrep -af 'Antigravity|antigravity|language_server'
```

如果仍有进程，先正常退出 Antigravity；必要时再终止残留进程。不要在 Antigravity 运行时覆盖 `app.asar`，否则可能出现白屏或资源状态不一致。

`npm run app:install` 已经包含这一步。手动 `sudo cp` 时才需要自己检查。

## 当前风险

- 修改 `.app` 内部资源会破坏原始代码签名，这是手动汉化 Electron 应用的常见副作用。
- 如果 Antigravity 更新了前端结构，旧补丁可能不再适用，需要重新生成并测试。
- Settings 页面汉化使用 DOM 文案替换方式，不修改 `language_server` 二进制，因此比硬改二进制更容易恢复，但也可能漏掉动态文案。
- 一旦出现白屏，优先回滚到最近一次可用备份。

## 下一阶段

主应用真正的大量业务 UI 很可能由：

```bash
/Applications/Antigravity.app/Contents/Resources/bin/language_server
```

提供。它是二进制文件，不建议直接硬改。后续应先定位是否存在本地端口资源、外部覆盖目录或缓存资源，再决定汉化方式。
