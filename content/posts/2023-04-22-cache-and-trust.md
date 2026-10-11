---
title: 缓存：一个关于信任的工程学问题
subtitle: Cache as a Question of Trust
date: 2023-04-22
year: 2023
tags: [architecture-systems, tech-and-philosophy]
thread: complexity-and-uncertainty
featured: false
summary: 缓存的本质是拿“我认为这份数据还是对的”这个信念换时间。所有缓存事故，都是信念和现实脱钩的那一刻。
---

缓存通常被当成性能手段来讲，但它在结构上更像一份赌注：你赌数据在这段时间内不会变，赌错了就承担后果。这篇想把缓存从“优化技巧”重新描述成“信任管理”，并讨论失效策略为什么总是比算法选择更难。

## 这篇文章要处理的问题

- 缓存一致性问题的通用形态是什么，为什么它和分布式事务是同一个问题的两种尺度？
- “过期时间”和“主动失效”各自把风险推给了谁？
- 当一份错误数据被缓存住，工程上有哪些止损手段，代价分别是什么？
