---
title: CompletableFuture 的异常处理陷阱
subtitle: Exception Handling in CompletableFuture
date: 2024-03-24
year: 2024
area: concurrency
tags: [concurrency]
featured: false
summary: 忘了 get 的 CompletableFuture，异常会像不存在一样消失。异步链路里“错误被吞掉”是默认行为，不是意外。
---

一次批量任务里，三分之一的记录静默丢失，日志干净得像什么都没发生。原因是 `thenApply` 里抛出的异常没有落到任何 `exceptionally` 分支。这篇按“异常去哪了”梳理 API 的行为差异。

## 这篇文章要处理的问题

- `thenApply` / `thenCompose` / `handle` / `whenComplete` 在异常传播上有什么不同？
- 怎样为整条异步链路设置兜底，而不是给每一步都加 try-catch？
- 自定义线程池和默认 `ForkJoinPool.commonPool()` 混用会带来什么问题？
