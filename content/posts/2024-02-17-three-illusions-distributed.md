---
title: 分布式系统的三个幻觉与一个真相
subtitle: Three Illusions and One Truth
date: 2024-02-17
year: 2024
tags: [distributed-reliability, architecture-systems]
thread: complexity-and-uncertainty
featured: false
summary: 网络可靠、延迟为零、时钟统一——三个幻觉拆掉之后剩下的真相是：你只能设计出一种在不确定中表现可接受的行为。
---

我见过太多架构讨论以“正常情况下它会怎样”开头，然后以事故复盘结尾。这篇想把三个基础幻觉逐个拆掉，并讨论它们拆掉之后，架构决策的判断标准会怎么变化。

## 这篇文章要处理的问题

- 三个经典幻觉各自对应哪一类真实事故？
- 承认幻觉之后，“正确性”这个目标应该如何被替换成可操作的标准？
- 超时、重试、熔断这些手段各自在对抗哪一种不确定性？
