# antigravity-zh-patcher

面向 macOS 的 Antigravity 2.0 中文本地化补丁工具。

这个项目通过脚本和翻译表辅助汉化：

- `/Applications/Antigravity.app`
- `/Applications/Antigravity IDE.app`

> 本项目不是 Google 或 Antigravity 官方项目。它只发布补丁脚本和翻译表，不发布修改后的应用程序。

## 功能

- 探测本机 Antigravity / Antigravity IDE 安装路径和关键资源。
- 为 `Antigravity.app` 生成中文 `app.asar` 补丁。
- 为主应用 Settings 页面注入 DOM 文案翻译。
- 为 `Antigravity IDE.app` 配置 VS Code 中文语言包机制。
- 为 Antigravity IDE Settings 窗口和首选项菜单补充中文补丁。
- 自动备份原始资源，支持恢复。
- 提供一键安装脚本，安装前会退出相关进程。

## 支持状态

当前验证环境：

- macOS
- Antigravity `2.0.6`
- Antigravity IDE `2.0.3`
- Node.js `>=20`

其他版本可能可以使用，但更新后资源结构可能变化。建议每次 Antigravity 更新后先运行探测和验证。

## 快速开始

```bash
git clone https://github.com/Layrow/antigravity-zh-patcher.git
cd antigravity-zh-patcher
npm install
npm run validate
```

查看安装状态：

```bash
npm run preflight
```

安装主应用汉化：

```bash
npm run app:install
```

安装 IDE 汉化：

```bash
npm run ide:zh
npm run ide:install-settings
```

脚本写入 `/Applications` 时可能要求输入 macOS 管理员密码。

## 命令说明

| 命令 | 说明 |
| --- | --- |
| `npm run validate` | 检查 JS、Shell 和 JSON，适合 CI 和贡献者本地开发 |
| `npm run preflight` | 先运行源码校验，再探测本机 Antigravity 安装资源 |
| `npm run probe` | 输出 Antigravity 安装路径、版本和关键资源状态 |
| `npm run shell:patch` | 生成主应用 `app.asar` 汉化补丁 |
| `npm run app:install` | 退出主应用、生成补丁并用管理员权限安装 |
| `npm run ide:zh` | 配置 IDE 中文语言包、NLS 缓存和 Settings 补丁 |
| `npm run ide:patch-settings` | 只生成 IDE Settings 补丁 |
| `npm run ide:install-settings` | 退出 IDE 并安装 IDE Settings 补丁 |
| `npm run restore` | 从 `backups/` 恢复最近备份 |

## 工作方式

### Antigravity.app

主应用处理两类内容：

- Electron 壳层文案，例如菜单、托盘、加载提示和部分错误提示。
- Settings 页面 DOM 文案，例如权限、模型、浏览器、外观、应用等设置项。

脚本会生成：

```bash
dist/antigravity-app.zh-CN.asar
```

如果系统拦截自动安装，可以在完全退出 Antigravity 后手动安装：

```bash
sudo cp "dist/antigravity-app.zh-CN.asar" "/Applications/Antigravity.app/Contents/Resources/app.asar"
```

### Antigravity IDE.app

IDE 处理三层内容：

- 安装并启用 `MS-CEINTL.vscode-language-pack-zh-hans`。
- 生成 `~/.antigravity-ide/languagepacks.json` 和 NLS 缓存。
- 对 Antigravity 自定义 Settings 窗口注入 DOM 翻译。
- 同步更新 `product.json` 中被修改文件的 checksum，避免 IDE 完整性检查误报安装损坏。

如果 Settings 补丁无法直接写入 `/Applications`，脚本会生成：

```bash
dist/ide-settings/
```

之后运行：

```bash
npm run ide:install-settings
```

如果已经手动复制过 `jetskiAgent/main.js`，但启动时看到 `Your Antigravity IDE installation appears to be corrupt. Please reinstall.`，通常是 `product.json` 的 checksum 还没有同步。重新运行：

```bash
npm run ide:patch-settings
sudo cp "dist/ide-settings/product.json" "/Applications/Antigravity IDE.app/Contents/Resources/app/product.json"
```

## 更新后怎么办

Antigravity 官方更新很可能覆盖应用内资源。推荐流程：

1. 更新 Antigravity。
2. 打开官方新版，确认未打补丁时能正常启动。
3. 完全退出 Antigravity 和 Antigravity IDE。
4. 在项目目录运行：

```bash
npm run app:install
npm run ide:zh
npm run ide:install-settings
```

5. 重新打开应用，重点检查 Settings 页面和首选项菜单。

## 恢复

脚本会把原始资源备份到：

```bash
backups/
```

自动恢复：

```bash
npm run restore
```

如果恢复脚本被 macOS 权限拦截，可以从 `backups/` 中选择对应备份文件手动复制回原路径。

## 风险

- 修改 `.app` 内部资源会破坏原始代码签名。
- IDE 会根据 `product.json` 中的 checksum 检查部分资源；手动安装 IDE Settings 补丁时必须同时安装生成的 `product.json`。
- 不要在应用运行时覆盖 `app.asar` 或 IDE bundle，否则可能出现白屏或资源状态不一致。
- 官方更新后旧补丁可能失效，需要重新生成。
- DOM 文案替换方式比硬改二进制更容易恢复，但可能漏掉动态文案。
- `language_server` 是二进制文件，本项目当前不直接修改它。

## 项目结构

```text
.
├── scripts/          # 探测、补丁、安装、恢复和校验脚本
├── translations/     # 中文翻译表
├── docs/             # 维护文档
├── backups/          # 本地备份，已忽略
├── dist/             # 生成补丁，已忽略
└── README.md
```

## 贡献

欢迎提交翻译补充、版本适配和恢复流程改进。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 安全

如果发现安全风险或可能导致数据损坏的问题，请阅读 [SECURITY.md](SECURITY.md)。

## 许可证

本项目使用 [MIT License](LICENSE)。
