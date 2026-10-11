---
title: 连接池参数怎么配：一次连接泄漏的排查
subtitle: Connection Pool Tuning and a Real Leak
date: 2023-11-06
year: 2023
area: data
tags: [mysql, troubleshooting]
featured: false
summary: 连接池的两个数字要分开看：池子大小决定吞吐上限，泄漏检测决定你什么时候知道出事。
---

服务跑三天就会卡住，重启就好。最后定位到一处手动获取连接的代码没有归还。这篇记录完整排查路径，以及我后来固定使用的一组参数和监控项。

## 这篇文章要处理的问题

- 池大小该按什么估算，为什么不是越大越好？
- `leakDetectionThreshold` 这类检测机制的原理和性能代价是什么？
- 怎样在不改代码的情况下定位“连接被谁借走了”？
