---
title: HashMap 扩容为什么必须是 2 的幂
subtitle: Why HashMap Capacity Is a Power of Two
date: 2023-02-26
year: 2023
area: jvm
tags: [jvm, performance]
featured: false
summary: 不是说“位运算更快”就完了。2 的幂真正决定的是桶下标的计算方式和扩容时的元素迁移成本。
---

面试里很多人能答出“因为用 `(n-1) & hash` 比取模快”，但问到扩容为什么可以把一条链拆成两条、以及为什么初始容量要给 2 的幂而不是质数，就答不上来了。这篇把这两件事一起讲清楚。

## 这篇文章要处理的问题

- `(n - 1) & hash` 为什么只有在 n 是 2 的幂时才等价于取模？
- 扩容时元素“要么在原位置，要么在原位置 + 旧容量”，这个结论从哪来？
- 手写 `new HashMap<>(17)` 会发生什么，为什么推荐用 Guava 的 `Maps.newHashMapWithExpectedSize`？
