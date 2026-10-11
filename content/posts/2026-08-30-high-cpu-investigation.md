---
title: 一次线上 CPU 飙高的排查过程
subtitle: Chasing a CPU Spike
date: 2026-08-30
year: 2026
area: jvm
tags: [performance, troubleshooting]
featured: false
summary: CPU 从 30% 涨到 90%，QPS 没变——这类“无缘无故变忙”的问题，通常不是用户量引起的。
---

监控告警的时候，四个实例里有两个 CPU 打满，但流量曲线平得像一条直线。这类问题往往指向两个方向：定时任务或后台线程变忙，或者某段代码的执行路径变了。这篇记录定位过程。

## 这篇文章要处理的问题

- 如何区分“业务流量导致的忙”和“后台任务导致的忙”？
- 火焰图怎么读，顶部宽条一定是问题所在吗？
- 常见的后台 CPU 消耗源有哪些，如何快速排查？
