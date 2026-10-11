---
title: 幂等、重试与人类的侥幸心理
subtitle: Idempotence and Wishful Thinking
date: 2024-04-27
year: 2024
tags: [distributed-reliability, engineering-practice]
thread: complexity-and-uncertainty
featured: false
summary: 重试是一种乐观主义：它假设再来一次不会更糟。而工程上真正要做的，是把这个假设变成可以被验证的性质。
---

我们给一个写接口加了自动重试，因为“失败一次就放弃太可惜”。那次上线后的第二天，数据库里出现了成对的重复订单。这篇记录重试为什么会诱人，以及幂等这件事为什么总是被留到最后才做。

## 这篇文章要处理的问题

- 哪些操作天然适合重试，哪些操作在重试前必须先改造自身？
- 幂等键、去重窗口这类方案各自能覆盖到什么边界？
- 为什么“重试 + 幂等”通常应该一次性设计，而不是分两次上线？
