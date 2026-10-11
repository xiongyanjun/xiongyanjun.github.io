---
title: 用维特根斯坦读 API 设计：语言游戏与接口语义
subtitle: Wittgenstein Reads Your API
date: 2026-05-30
year: 2026
tags: [tech-and-philosophy, architecture-systems]
thread: language-and-meaning
featured: false
summary: 一个接口的含义不在文档里，而在调用者实际怎么用它。维特根斯坦的“语言游戏”解释了我们为什么总在争论字段到底该叫什么。
---

我们为一个字段名争论了两周：“status”还是“state”。最后发现真正的问题不是词不好，而是两个团队在使用它时做的事情根本不同。这篇讨论接口语义如何被使用方式定义。

## 这篇文章要处理的问题

- 为什么“语义清晰”的接口到了真实使用中仍然会被误解？
- 一个字段承载了多种用途时，是应该拆开还是应该写进文档？
- 如何用少量真实调用示例，替代大段字段说明？
