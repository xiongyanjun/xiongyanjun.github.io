---
title: JDK 21 的几个新特性，我在生产里用了哪些
subtitle: JDK 21 Features I Actually Use
date: 2025-10-12
year: 2025
area: jvm
tags: [jvm]
featured: false
summary: 虚拟线程、record pattern、模式匹配 switch、顺序集合、ScopedValue。有些立刻用上了，有些还在观察，有些暂时不适合。
---

升级到 JDK 21 之后，我把这些特性按“敢不敢用在生产代码里”分了三类。结论比想象中保守：真正改变写法的只有一两个，其余更多是让代码变短一点。

## 这篇文章要处理的问题

- 哪些新特性可以直接用，哪些需要等生态跟上？
- record pattern 在处理复杂嵌套结构时能省掉多少样板代码？
- 顺序集合（SequencedCollection）对现有集合 API 的实际影响有多大？
