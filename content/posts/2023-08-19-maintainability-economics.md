---
title: 从「能跑」到「能改」：可维护性的经济学
subtitle: The Economics of Maintainability
date: 2023-08-19
year: 2023
tags: [engineering-practice, architecture-systems]
thread: tools-and-humans
featured: false
summary: 可维护性不是代码质量指标，而是一份关于未来的成本预测。它真正要回答的是：六个月后改这里，要付多少代价。
---

我逐渐发现，团队里关于“要不要重构”的争论几乎从不真正讨论代码本身，而是在用不同的时间尺度算账：一个人算的是本周的交付，另一个人算的是半年后的交付。这篇想把这类争论翻译成可比较的语言。

## 这篇文章要处理的问题

- “技术债”这个比喻在哪里有用，在哪里会误导决策？
- 如何给可维护性定一个能被非技术人员理解的粗略刻度？
- 什么时候应该主动重构，什么时候应该接受“就这样吧”？
