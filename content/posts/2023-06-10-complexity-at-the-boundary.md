---
title: 把复杂留在边界：分层与防腐层笔记
subtitle: Keep Complexity at the Boundary
date: 2023-06-10
year: 2023
tags: [architecture-systems, engineering-practice]
thread: complexity-and-uncertainty
featured: false
summary: 好的分层不是“整齐”，而是让外部世界的混乱只污染一小块地方。防腐层的价值在于它承认外部系统不会为你改变。
---

第一次接手需要对接三个外部系统时，我把它们当成普通的依赖来用，半年后整个业务层都是针对不同第三方 SDK 的特殊分支。这篇记录我如何学会主动画出边界，以及区分“该被隔离的复杂”和“不该被隐藏的复杂”。

## 这篇文章要处理的问题

- 什么样的情况值得引入防腐层，什么样的情况引入它只是多写一层无用代码？
- 边界之内允许“丑”，边界之外必须“稳”，这条规则如何在评审中被检验？
- 外部依赖升级时，边界如何把改动控制在可预测的范围内？
