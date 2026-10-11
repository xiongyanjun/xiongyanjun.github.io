---
title: 堆外内存：为什么 OOM 的时候堆看起来很健康
subtitle: Off-Heap Memory
date: 2023-04-23
year: 2023
area: jvm
tags: [jvm, troubleshooting]
featured: false
summary: 容器被 OOM Killer 杀掉，堆内存曲线却一路平稳。堆外内存、元空间、线程栈、DirectByteBuffer 都在堆的账本之外。
---

那次事故里，堆监控一切正常，但容器每两天被杀一次。最后定位到是 Netty 的直接内存没有上限，加上一个忘记 `release` 的 path。这篇梳理 JVM 进程内存的完整构成和排查顺序。

## 这篇文章要处理的问题

- 一个 Java 进程的内存都由哪些部分组成，分别怎么观测？
- `-XX:MaxDirectMemorySize` 不设置时默认是多少，为什么容器里容易出事？
- Native Memory Tracking 怎么用，采样和全量的代价差多少？
