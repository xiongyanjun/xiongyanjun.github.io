---
title: 日志、指标、追踪：可观测性的三副眼镜
subtitle: Three Lenses of Observability
date: 2023-03-18
year: 2023
tags: [engineering-practice, distributed-reliability]
thread: complexity-and-uncertainty
featured: false
summary: 三件工具不是三种技术，而是看同一个系统的三种视角：分别回答发生了什么、整体如何、以及这一次为什么。
---

这篇文章要从一次“明明有日志却查不出问题”的事故讲起：日志写了几十个文件，但没人知道那次请求到底经过了哪些服务。我想讨论的是三件工具各自的认知局限——它们不是互相替代的关系，而是三种不同的提问方式。

## 这篇文章要处理的问题

- 日志、指标、追踪分别在回答哪一类问题，为什么用错了会得出错误结论？
- 采样率和基数（cardinality）如何悄悄决定你“能不能看见”某类问题？
- 一个健康的可观测性体系，应该以哪三句话作为设计起点？
