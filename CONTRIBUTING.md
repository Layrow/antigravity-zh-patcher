# 贡献指南

感谢你愿意改进 `antigravity-zh-patcher`。

## 开发准备

```bash
npm install
npm run validate
```

提交前请至少运行：

```bash
npm run validate
```

如果你本机安装了 Antigravity，也可以运行：

```bash
npm run preflight
```

如果改动涉及主应用补丁，也建议额外运行：

```bash
ANTIGRAVITY_ZH_GENERATE_ONLY=1 npm run shell:patch
```

## 翻译规范

- `Agent` 统一译为“智能体”。
- `Workspace` 统一译为“工作区”。
- `Project` 统一译为“项目”。
- `Settings` 统一译为“设置”。
- `Permission` 统一译为“权限”。
- `Review` 在权限场景下优先译为“审核”。
- 产品名、模型名、协议名保留英文，例如 `Antigravity`、`MCP`、`Google Drive`。

新增翻译时尽量使用精确英文原文作为 key，避免过宽泛的短词替换。

## 补丁原则

- 优先使用可恢复、可重复执行的脚本。
- 不提交 `backups/`、`dist/`、`extracted/` 等生成目录。
- 不提交修改后的完整 `.app`、`app.asar` 或二进制文件。
- 不直接硬改 `language_server`。
- 任何会写入 `/Applications` 的流程都必须先备份，并清楚提示风险。

## 提交信息

使用中文 conventional commits，例如：

```text
feat: 补充 Settings 权限页翻译
fix: 修复 IDE Settings 注入失败
docs: 完善更新后恢复说明
chore: 调整校验脚本
```

## Pull Request 建议

PR 描述请包含：

- 改动目的。
- 影响的应用：`Antigravity.app`、`Antigravity IDE.app` 或两者。
- 已验证命令。
- 是否需要手动 sudo 安装。
- 截图或可见文案示例。
