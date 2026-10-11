# 🐻‍❄️🦘🐎 · 四年 · 技术与哲学

一个零依赖的静态博客：内容用 Markdown 写，构建脚本生成纯静态 HTML，直接部署到 GitHub Pages。

## 本地使用

```bash
npm run build     # 生成站点到 dist/
npm run serve     # 本地预览 http://localhost:4321
npm run dev       # 构建 + 预览
```

不需要安装任何依赖，本机有 Node.js 18 以上即可。

## 目录结构

```
content/posts/*.md     文章源文件（Markdown + front matter）
site/assets/           样式与脚本（构建时复制到 dist/）
scripts/build.mjs      构建脚本
scripts/serve.mjs      本地预览服务器
scripts/lib/markdown.mjs  Markdown 渲染器
site.config.mjs        站点信息、导航、标签与脉络定义
dist/                  构建产物（已 gitignore）
```

## 写一篇新文章

在 `content/posts/` 下新建 `YYYY-MM-DD-slug.md`：

```markdown
---
title: 文章标题
subtitle: English Subtitle（可省略）
date: 2026-11-01
year: 2026
tags: [engineering-practice, tools-craft]
thread: craft-and-practice
featured: true
summary: 一句话摘要，会显示在列表页和搜索结果里。
---

正文从这里开始，支持标题、列表、引用、表格、代码块、链接、图片。
```

| 字段 | 说明 |
| --- | --- |
| `tags` | 取自 `site.config.mjs` 里的 `TAGS`，用 slug |
| `thread` | 六条思想脉络之一，用 slug；留空则不显示 |
| `featured` | `true` 为完稿正文，`false` 会在页面上标为"待写" |
| `summary` | 必填，列表页与 RSS 都用它 |

写完执行 `npm run build`，归档、标签、脉络、RSS、搜索索引都会自动更新。

## 部署到 GitHub Pages

1. 新建仓库。如果站点要落在 `https://<用户名>.github.io`，仓库名必须是 `<用户名>.github.io`；否则站点地址是 `https://<用户名>.github.io/<仓库名>/`。
2. 把本项目推到仓库的 `main` 分支。
3. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
4. 推送后自动构建部署。
5. 把 `site.config.mjs` 里的 `SITE.url` 改成你的实际网址（影响 RSS 与 sitemap）。

构建产物全部使用相对路径，部署在子路径下也能直接工作。

## 设计说明

- 首页展示四幕演化弧和六条思想脉络；
- 归档页按年份分组，并显示每年的完成度；
- 每篇文章可归属于一条脉络，文末给出"顺着这条线读下去"的入口；
- 搜索为纯前端全文检索，索引在构建时生成。
