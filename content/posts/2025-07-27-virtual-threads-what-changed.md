---
title: 虚拟线程：Loom 改变了什么，没改变什么
subtitle: What Virtual Threads Change
date: 2025-07-27
year: 2025
area: concurrency
tags: [virtual-threads, concurrency]
featured: true
summary: 虚拟线程把「一个请求一个线程」的成本打下来了一个数量级。但它改变不了下游的容量、连接池的大小，也改变不了线程安全这件事。
---

那个服务做的事很简单：收到请求，并行调三个下游，聚合结果返回。每个请求的耗时里，95% 是等下游。

平台线程方案下，我们用了一个 200 线程的池子，压测到四千 QPS 就上不去了——线程全部阻塞在等待响应上，新请求开始排队。

## 换法本身很简单

JDK 21 的改法几乎没有成本：

```java
// 改造前：固定线程池，200 是猜出来的容量上限
ExecutorService pool = Executors.newFixedThreadPool(200);

// 改造后：一个任务一个虚拟线程，随用随建
ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

// 临时挂起用法，适合少量任务
Thread.ofVirtual().name("agg-", 0).start(() -> callDownstream());
```

改动就是一行。压测结果是这样：

| 指标 | 平台线程 200 | 虚拟线程 |
| --- | --- | --- |
| 线程数 | 200（固定） | 峰值约 3 万 |
| 平台线程占用 | 200 | 8 |
| 吞吐 | 4,000 QPS | 4,600 QPS |
| p99 | 4.2s（排队后） | 3.6s |
| 单请求内存开销 | 约 1MB 栈 | 数 KB 起，按需增长 |

吞吐只涨了 15%，这个数字比社区里“提升十倍”的说法保守得多，但它才是这个场景的真实情况：**因为瓶颈不在应用层的线程上。**

## 没改变的第一件事：下游容量

我们的三个下游里有两个是数据库，连接池各 20 个。虚拟线程只能让“等待”这件事变便宜，它没法让数据库多接连接。

一旦应用层不再排队，请求会更快地涌向下游，结果是压力从“线程池排队”转移到了“连接池排队”——甚至可能更糟，因为你不再有应用层作为缓冲。

所以我把这套改动和另外两件事绑在一起做：

1. 给下游调用加**显式超时**，而不是依赖线程池排队来限制并发；
2. 用**信号量或限流器**在应用层限制对每个下游的并发数。

```java
// 虚拟线程不等于无限并发：下游并发仍然要受限
private final Semaphore dbGuard = new Semaphore(20);

String query(String sql) throws Exception {
    dbGuard.acquire();
    try {
        return jdbcTemplate.queryForObject(sql, String.class);
    } finally {
        dbGuard.release();
    }
}
```

## 没改变的第二件事：线程安全

虚拟线程依然是线程，共享可变状态依然要同步。这两件事不会因为线程变便宜而变简单——反而更危险，因为现在有两万个线程在跑同一段代码，以前被低并发掩盖的竞态会突然暴露出来。

迁移时最容易踩的是 `ThreadLocal`：

```java
// 平台线程时代：100 个线程 × 1KB = 100KB，可以忽略
// 虚拟线程时代：3 万个线程 × 1KB = 30MB，而且每个都是从同一个思路来的
private static final ThreadLocal<SimpleDateFormat> FMT =
        ThreadLocal.withInitial(SimpleDateFormat::new);
```

虚拟线程是“用完即弃”的，这意味着 `ThreadLocal` 里的数据几乎没有机会被复用命中——它带来的只有成本，没有收益。这类代码应该直接换成 `DateTimeFormatter`（线程安全、不可变）。

## 没改变的第三件事：CPU 密集没有收益

虚拟线程的价值在于“阻塞时让出载体线程”。如果任务根本不阻塞，只是纯计算，那它和平台线程没有区别，还会额外引入调度开销。**CPU 密集的任务继续用平台线程池。**

还有一个 JDK 21 的限制值得知道：在 `synchronized` 块里做阻塞操作时，虚拟线程会占住载体线程（社区里叫 pinning），此时它就退化成一个平台线程。判断方式很直接——如果阻塞式 IO 外面套着 `synchronized`，换成 `ReentrantLock` 通常就能解决。后续 JDK 版本在这方面持续改进，迁移前值得确认一下目标版本的状态。

## 排查方式也要换

虚拟线程不会出现在 `jstack` 的常规输出里，需要换个命令：

```bash
jcmd <pid> Thread.dump_to_file -format=json /tmp/threads.json
```

这一点在迁移初期特别容易被忽略：出了线上问题，习惯性地执行 `jstack`，看到线程数一切正常，然后开始怀疑人生。

## 我现在怎么判断要不要迁移

满足这三条时，收益明显：

- 任务以阻塞等待为主（下游调用、文件 IO、外部 API）；
- 并发上限现在是被线程池卡住的，而不是被下游卡住的；
- 代码里没有大范围依赖 `ThreadLocal` 或 `synchronized` 包阻塞调用。

反过来，如果服务已经在 CPU 上打满，或者瓶颈明确在数据库上，那迁移过去只是把相同的压力换个地方排队。

虚拟线程是一次实实在在的成本降低。但成本降低之后，问题会更诚实地暴露出来——它们本来就在那儿。
