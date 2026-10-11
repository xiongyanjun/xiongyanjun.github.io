---
title: 一次 Full GC 排查：从 GC 日志到堆转储
subtitle: A Full GC Investigation
date: 2025-02-23
year: 2025
area: jvm
tags: [gc, troubleshooting]
featured: true
summary: 服务每两天一次 Full GC，每次停顿一秒多。真正有用的线索不是“GC 很频繁”，而是“GC 之后老年代的水位还在涨”。
---

告警是这么来的：接口的 p99 每隔两天出现一次尖刺，持续一两秒。看监控，唯一对得上的信号是 Full GC 次数。

一开始我们的处理是加内存——把堆从 4G 调到 8G。尖刺从两天一次变成四天一次。这说明问题被推迟了，但没有被解决。

## 第一步：把 GC 日志开起来

很多团队出事之后才去开日志，其实它应该是默认配置。JDK 9 之后统一用 `-Xlog`：

```
-Xlog:gc*:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=5,filesize=50M
```

这条参数的意思是：输出全部 GC 相关日志到文件，包含时间、运行时长、级别和标签，保留 5 个文件、每个最大 50M。**`time,uptime` 这两个标签很关键**——排查时你经常需要把 GC 事件和其他日志对齐。

## 第二步：从日志里读出“是分配太快还是回收不掉”

这是整个排查里最关键的一步。看 Full GC **之后**的老年代占用比例：

- 如果 GC 后回落到 20%~30%，然后缓慢上涨到触发阈值 → 分配速率高，或者干脆就是堆太小；
- 如果 GC 后仍然停在 60% 以上并且持续上升 → 有对象被长期持有，优先怀疑泄漏。

我们的日志长这样：

```
[2025-02-20T14:31:07.882+0800][info][gc] GC(1841) Pause Full (Allocation Failure)
  4096M->2748M(4096M) 1.284s
```

`4096M->2748M` 意味着回收后还占着 2748M，也就是 **67%**。下一次 Full GC 的时候这个数字是 2890M，再下一次 3012M。趋势很明确：有东西在持续堆积。

## 第三步：先看对象直方图，再决定要不要 dump

dump 一个 4G 的堆，文件有 4G，用 MAT 打开要十几分钟，而且会触发一次 STW。在它之前，先花十秒钟看直方图：

```bash
# 注意：:live 会触发一次 Full GC，生产环境慎用
jcmd 12345 GC.class_histogram | head -30
```

输出里按实例数和占用字节排序。我们那次看到的结果很直接：

```
 num     #instances         #bytes  class name
----------------------------------------------
   1:       2314887      740762112  [Ljava.lang.Object;
   2:       2288014      549123360  java.util.HashMap$Node
   3:         14022         2837424  [...]
```

HashMap 的节点有两百多万个。业务代码里没有一个地方会一次性持有这么多 Map 节点——除非有什么东西在不停地往某个 Map 里塞，而且从来不清理。

## 第四步：MAT 找引用链

dump 之后用 MAT 打开，先看 Leak Suspects 报告，再看支配树（Dominator Tree）。这里要看的不是“谁占得最多”，而是**“谁在持有它”**。

我们的结果指向一个 ThreadLocal：

```
Thread (tomcat-exec-3)
 └─ threadLocals (ThreadLocalMap)
     └─ entry: TenantContext -> TenantCache
         └─ HashMap (2,288,014 entries)
```

问题清楚了：一个租户维度的本地缓存被塞进了 `ThreadLocal`。因为 Tomcat 的工作线程是长期存活的，`ThreadLocal` 里的引用永远不会被回收——**线程不死，ThreadLocal 就不释放**，这正是它比普通缓存危险的地方。

## 修法

三处改动，缺一不可：

```java
// 1. 缓存必须有序：设上限 + 设过期
Cache<String, Object> tenantCache = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(Duration.ofMinutes(10))
        .build();

// 2. ThreadLocal 用完必须清理，用 try-finally 保证
try {
    TenantContext.set(tenantId);
    // ... 业务逻辑
} finally {
    TenantContext.clear();
}

// 3. 更靠谱的做法：在入口统一清理，不依赖每个调用点自觉
public class TenantFilter implements Filter {
    public void doFilter(...) {
        try { chain.doFilter(req, res); }
        finally { TenantContext.clear(); }   // 线程归还池之前一定清掉
    }
}
```

第二点和第三点的区别值得强调：`try-finally` 依赖每个开发者记得写；在 Filter 里统一清理是**结构性保证**。我后来在所有涉及 ThreadLocal 的项目里都要求有这样一个入口清理点。

## 改完之后的数字

Full GC 从两天一次变成完全没有——因为堆不再稳步上涨，只有分配高峰期触发的 Young GC。p99 的尖刺消失了。

回头看，加内存那一步并不算错，它争取了排查时间。但它也差点把我们带偏：如果尖刺从“四天一次”变成“八天一次”，很可能就没人再管它了。

## 留下一套检查动作

现在遇到 GC 相关的告警，我固定做四件事：

1. 看 GC 日志里 Full GC **之后**的老年代水位，判断是“分配快”还是“收不掉”；
2. 看频率和触发原因（`Allocation Failure` 还是 `Metadata GC Threshold`）；
3. 看对象直方图，找数量级异常的类型；
4. 需要 dump 时优先在测试环境复现，生产环境注意 STW 代价。

顺便说一个后来加的监控项：**老年代在 GC 后的水位趋势图**。它比“GC 次数”更早暴露问题——次数是结果，水位是原因。
