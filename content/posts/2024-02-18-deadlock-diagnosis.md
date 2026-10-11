---
title: 死锁排查：三种典型形态与定位方法
subtitle: Diagnosing Deadlocks
date: 2024-02-18
year: 2024
area: concurrency
tags: [concurrency, troubleshooting]
featured: false
summary: 应用死锁、数据库死锁、线程池饥饿，三种问题的现象很像，排查入口完全不同。先把它们分开，再谈工具。
---

服务“卡住”的时候，第一反应往往是去 jstack。但有两次用 jstack 什么都没看到：一次是数据库层面的死锁，一次是连接池被占满。这篇按现象和证据整理三条排查路径。

## 这篇文章要处理的问题

- `jstack` 报告里的 `found one Java-level deadlock` 覆盖了哪些情况，漏掉了哪些？
- 数据库死锁和锁等待超时在日志里分别长什么样？
- 线程池饥饿为什么会表现得像死锁，如何从线程栈上区分？
