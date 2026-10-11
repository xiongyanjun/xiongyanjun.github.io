# 🐻‍❄️🦘🐎 · Java 后端技术笔记

一个零依赖的静态博客：内容用 Markdown 写，构建脚本生成纯静态 HTML，直接部署到 GitHub Pages。主题围绕 Java 后端：JVM 与并发、Spring 生态、数据与中间件、分布式架构、工程与判断。

## 本地使用

```bash
npm run build     # 生成站点（直接写到仓库根目录）
npm run serve     # 本地预览 http://localhost:4321
npm run dev       # 构建 + 预览
```

不需要安装任何依赖，本机有 Node.js 18 以上即可。

## 目录结构

```
content/posts/*.md       文章源文件（Markdown + front matter）
site/assets/             样式与脚本源码（构建时复制到根目录 assets/）
scripts/build.mjs        构建脚本
scripts/serve.mjs        本地预览服务器
scripts/check-links.mjs  站内链接自检
scripts/lib/markdown.mjs Markdown 渲染器
site.config.mjs          站点信息、导航、方向与标签定义

index.html archive.html areas.html tags.html about.html search.html 404.html
posts/ area/ tag/ assets/ feed.xml sitemap.xml robots.txt .nojekyll
                          ↑ 以上都是构建产物，直接生成在仓库根目录
```

构建产物和源码放在同一个仓库里：根目录就是对外发布的站点，源码留在
`content/`、`scripts/`、`site/` 里。这样推送到 GitHub 就等于发布，不需要额外的
CI 或发布设置。

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
| `tags` | 取自 `site.config.mjs` 里的 `TAGS`，用 slug，可写多个 |
| `area` | 六个方向之一（jvm / concurrency / spring / data / architecture / craft） |
| `featured` | `true` 为完稿正文，`false` 会在页面上标为"待写" |
| `summary` | 必填，列表页与 RSS 都用它 |

写完执行 `npm run build`，归档、方向页、标签页、RSS、搜索索引都会自动更新。

## 部署到 GitHub Pages

1. 本地执行 `node scripts/build.mjs` 生成站点。
2. 推送到仓库的 `main` 分支。
3. 仓库 **Settings → Pages → Build and deployment → Source** 设为 **Deploy from a
   branch**，分支选 `main`、目录选 `/ (root)`。

因为所有链接都是相对路径，站点既可以发布在 `https://<用户名>.github.io` 根目录，
也可以放在 `https://<用户名>.github.io/<仓库名>/` 这样的子路径下，不需要改代码。

如果更希望「推送即构建」，可以改回 GitHub Actions 方式：加一个
`actions/upload-pages-artifact` + `actions/deploy-pages` 的工作流，把 Pages 的
Source 切成 **GitHub Actions**，并把构建输出目录改回单独的 `dist/`。

## 设计说明

- 首页展示最新文章、六个技术方向和联系方式；
- 文章列表按年份分组，方向页与标签页提供横向入口；
- 每篇文章归属于一个方向，文末给出该方向的全部文章入口；
- 搜索为纯前端全文检索，索引在构建时生成。
