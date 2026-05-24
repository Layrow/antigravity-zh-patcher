# 维护者说明

这份文档面向后续维护者，记录项目维护时最容易忘的边界。

## 发布前检查

```bash
npm install
npm run validate
ANTIGRAVITY_ZH_GENERATE_ONLY=1 npm run shell:patch
npm run ide:zh
```

确认以下目录没有被暂存：

- `backups/`
- `dist/`
- `extracted/`
- `extracted_app/`
- `scratch/`
- `node_modules/`

## 更新 Antigravity 后

1. 先运行 `npm run probe`，记录新版版本号和关键资源是否存在。
2. 打开官方未补丁应用，确认能正常启动。
3. 运行 `ANTIGRAVITY_ZH_GENERATE_ONLY=1 npm run shell:patch`。
4. 运行 `npm run ide:zh`。
5. 安装补丁后手动验证 Settings 页面、首选项菜单和常用会话界面。

## 翻译表维护

- 主应用 Settings DOM：`translations/settings-dom.zh-CN.json`
- 主应用壳层：`translations/antigravity-shell.zh-CN.json`
- IDE Settings DOM：`translations/antigravity-ide-settings-dom.zh-CN.json`
- IDE NLS override：`translations/antigravity-ide-overrides.zh-CN.json`

优先补全用户可见、高频、风险低的文案。避免为了追求覆盖率而对非常短的英文词做全局替换。

## 恢复策略

恢复脚本目前偏向“最近备份”。如果未来要支持交互式选择备份，优先做非破坏式列表命令，不要默认删除备份。
