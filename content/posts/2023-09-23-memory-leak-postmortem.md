---
title: 深夜事故复盘：一次内存泄漏教我的事
subtitle: Postmortem of a Memory Leak
date: 2023-09-23
year: 2023
tags: [distributed-reliability, engineering-practice]
thread: complexity-and-uncertainty
featured: false
summary: 一次凌晨两点的 OOM 让我意识到，事故报告真正要写的不是“根因”，而是“为什么这个故障能活到今晚才被发现”。
---

那天我们把一个跑了 40 天没重启的服务重启了，问题消失。所有人都松了一口气，也所有人都知道它还会回来。这篇记录完整的排查过程，以及复盘时最值得写下来的部分为什么不是技术根因。

## 这篇文章要处理的问题

- 一次缓慢泄漏为什么很难被常规监控抓住，指标的粒度该如何调整？
- 复盘报告里“根因”和“暴露路径”分别指什么，为什么后者更值得花笔墨？
- 面对无法彻底修复的问题，工程上如何设计“体面的降级”？
