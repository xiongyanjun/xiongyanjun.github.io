---
title: 结构化并发：虚拟线程之后的下一个问题
subtitle: Structured Concurrency
date: 2026-03-29
year: 2026
area: concurrency
tags: [virtual-threads, concurrency]
featured: false
summary: 虚拟线程解决了“怎么创建很多线程”，结构化并发解决的是“怎么保证它们一起结束、一起失败”。后者更容易写错。
---

一次并行调用三个下游的接口，其中一个超时后我们返回了降级结果，但另外两个任务还在跑，最后把连接池占满了。虚拟线程让创建线程变便宜，也让“忘记处理失败的子任务”这件事更常见。

## 这篇文章要处理的问题

- `StructuredTaskScope` 的两种关闭策略分别适合什么场景？
- 一个子任务失败时，其他任务应该被取消还是继续跑完？
- 结构化并发与 `CompletableFuture` 组合在使用上的差异是什么？
