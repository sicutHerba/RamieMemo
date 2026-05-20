# 苧麻备忘录 Ramie Memo

![Build Status](https://github.com/sicutHerba/RamieMemo/workflows/Build%20and%20Deploy/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟项目愿景

"苧麻备忘录"试图收集那些应该被我们记住的声音。

这里不是一间完备的档案馆，而是一册轻便、可随身携带的备忘录。

这里永远是不完整的。无论如何努力，没有人能够记下所有的声音。正因欠缺，我们才必须学会包容。

## 🤝如何贡献

本项目完全开源，欢迎各种形式的贡献：报告错误、上传新内容、更新现有备忘录、改进代码。

### 📝 提交新备忘录（推荐流程）

使用 [**「提交新备忘录」Issue 模板**](https://github.com/sicutHerba/RamieMemo/issues/new?template=new-memo.yml) 填写结构化字段后，全程由机器人接力：

1. **解析 & 预览**：机器人解析 Issue，在评论区贴出预览；解析失败会指出问题，编辑 Issue 后会自动重试。
2. **自动开 PR**：解析成功后，机器人自动下载远端图片（SSRF 安全检查）、校验数据、重建 `index.json`，并在 `memo/issue-<编号>` 分支上开一个 PR。
3. **审核**：维护者在 PR 的 *Files changed* 里查看生成结果，必要时直接在 PR 上修改。CI 自动运行 `test` → `validate` → `build` 三项检查。
4. **合并 & 部署**：通过检查后点 Merge；合并到 `main` 会再跑一次完整构建并自动发布到 GitHub Pages。

如果想根据 Issue 最新内容重新生成 PR（会覆盖 PR 上的人工修改），在 Issue 里评论 `/regenerate`（需 write 权限）。

### 其它渠道

- [填写表单](https://forms.gle/w81nXqYXf8Z1hUxV8)
- 发送邮件至 [sicut.herba@hotmail.com](mailto:sicut.herba@hotmail.com)
- 创建普通 [GitHub Issue](https://github.com/sicutHerba/RamieMemo/issues)（无模板）

## ⚠️版权声明

本项目收录的内容来源于公开资料，若有侵权，请通过以下方式联系我们，我们将及时处理：sicut.herba@hotmail.com