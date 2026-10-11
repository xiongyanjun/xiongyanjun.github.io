---
title: 事务隔离级别与 MVCC：可重复读到底读到了什么
subtitle: Isolation Levels and MVCC
date: 2024-07-21
year: 2024
area: data
tags: [mysql, transaction]
featured: false
summary: 快照是什么时候建立的、当前读和快照读的区别，决定了你在同一个事务里会不会看到“两副面孔”的数据。
---

同一段事务代码，在两次 `SELECT` 之间插入了一条更新，结果两次查出来的数据不一样——但埋点日志显示这两次查询确实在同一个事务里。问题出在快照建立时机和当前读的混用上。这篇把规则理清楚。

## 这篇文章要处理的问题

- Read View 是在事务开始时建立，还是在第一条查询时建立？
- `SELECT ... FOR UPDATE` 和普通 `SELECT` 在读取上的区别是什么？
- 间隙锁在什么条件下出现，为什么它会带来意外的死锁？
