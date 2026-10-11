---
title: AQS 与 ReentrantLock：为什么需要它
subtitle: AQS and ReentrantLock
date: 2024-04-28
year: 2024
area: concurrency
tags: [concurrency]
featured: false
summary: 用 synchronized 能做的事，为什么要再加一套锁？差别在可中断、可超时、可公平——以及它们在有界队列和背压场景里的价值。
---

`ReentrantLock` 常被当成“更高级的 synchronized”，但它真正的价值在于把“等待”变成了一个可以被中断、可以被限时的动作。这篇用一个有界缓冲区的实现说明这种能力在什么时候是必需的。

## 这篇文章要处理的问题

- `tryLock(timeout)` 在什么场景下比阻塞等待更安全？
- AQS 的 state 与等待队列如何协同，条件变量是怎么挂上去的？
- 公平锁为什么吞吐更低，什么情况下值得付出这个代价？
