---
title: GraalVM Native Image 在 Spring Boot 3 上的成本清单
subtitle: The Real Cost of Native Image
date: 2026-01-18
year: 2026
area: jvm
tags: [jvm, performance]
featured: true
summary: 启动从 2.1 秒降到 90 毫秒，内存降到四分之一。代价是构建时间翻五倍、反射要手工登记，以及排查工具基本不能用。
---

我们用 GraalVM Native Image 重做了两个服务：一个内部管理后台，一个对外开放的 API。

选它的理由是启动时间。第一个服务跑在 K8s 上，每次滚动发布都会有一段时间的实例冷启动，扩容也慢。第二个是为将来做 Serverless 部署探路。

## 先说数字

同一份代码，两个构建产物在同等规格的容器里跑：

| 指标 | JVM (JDK 21) | Native Image |
| --- | --- | --- |
| 启动时间 | 2.1s | 92ms |
| 常驻内存 | 420MB | 105MB |
| 镜像体积 | 218MB | 96MB |
| 构建时间 | 48s | 4m12s |
| 峰值 QPS | 3,400 | 3,150 |
| p99 | 42ms | 46ms |

前两行很漂亮，后两行说明它不是免费的：吞吐略低——因为没有 JIT 的分层编译和运行时优化，峰值性能通常不如 HotSpot。**如果你的服务是长期驻留、吃满流量的，Native Image 不是性能优化，是内存和启动优化。**

## 成本一：构建链路要重做

Native Image 构建依赖 GraalVM 的本地工具链，CI 上需要一个专门的构建镜像，构建时长从 48 秒变成四分多钟。这意味着：

- 本地开发基本不会执行 native 构建，只能交给 CI；
- 每次改动都要等 CI 跑完才能验证 native 相关问题；
- 构建机器的内存要求明显提高（我们用 8G 构建，偶尔要调到 12G）。

我们最后把它拆成两条流水线：主分支快速构建 JVM 包做集成测试，每晚跑一次 native 构建并部署到预发。

## 成本二：反射、资源、动态代理都要登记

这是主要工作量所在。GraalVM 是封闭世界假设（closed-world assumption），编译期看不到的东西运行时就找不到。Spring Boot 3 的 AOT 引擎能自动处理绝大部分框架内部的反射，但业务自己的代码要显式登记：

```java
// 最常见的两类：JSON 反序列化的目标类型，以及自己用的反射
@RegisterReflectionForBinding({OrderDTO.class, OrderItemDTO.class})
@Configuration
public class NativeHintsConfig {

    @Bean
    RuntimeHintsRegistrar legacyHints() {
        return (hints, classLoader) -> {
            // 老代码里的反射调用，编译期无法推断
            hints.reflection().registerType(ReportModel.class,
                    MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
                    MemberCategory.INVOKE_DECLARED_METHODS);
            hints.resources().registerPattern("templates/*.ftl");
        };
    }
}
```

漏登记的症状通常是运行时报 `ClassNotFoundException` 或返回字段全是 `null`，而且**只在被你遗漏的那条代码路径上出现**——测试覆盖不到的地方最容易出事。

我们踩得最深的一次是 MyBatis 的映射对象：字段全是 `null`，日志毫无异常。原因是 `OrderDO` 没有登记反射，Jackson 反序列化出了一个空对象。这类问题在 JVM 模式下永远不会出现。

## 成本三：AOP 与动态代理的边界

Spring 的 `@Transactional`、`@Async` 在 native 下依然可用，因为 AOT 引擎在编译期把代理类生成了出来。但两种情况要注意：

- **运行期才知道的 CGLIB 代理**（比如某些动态注册的 bean）不适用；
- **类加载期做增强的库**（部分 APM agent、字节码工具）直接不能用。

我们有一次引入 APM 探针，JVM 版本一切正常，native 版本启动直接失败。结论很明确：**用 native 之前，先确认依赖链里没有做运行时字节码增强的东西。**

## 成本四：排查工具基本回到十年前

这是最容易被低估的成本。native 可执行文件没有 JVM，意味着：

- `jstack`、`jmap`、`jstat`、`jcmd` 都用不了；
- GC 日志格式不同，可读性下降；
- 火焰图要靠 `perf` 或 async-profiler 的 native 模式，采样体验不如 JVM；
- 线上内存问题基本只能靠监控指标，拿不到堆转储。

对一个刚上线、可能出各种问题的服务来说，这是一个很大的代价。我们的做法是：**native 版本先跑在无状态、逻辑简单、可快速回滚的服务上**，把复杂业务留在 JVM 上。

## 成本五：构建期初始化

Native Image 默认在编译期初始化静态状态。如果某个库在静态初始化里读了配置、连了网络、装了随机种子，就会出问题，需要把它推迟到运行期：

```
--initialize-at-run-time=com.example.legacy.ConfigHolder
```

每遇到一个这样的类，就要判断一次“它的静态状态在编译期确定是否安全”。这是纯人工判断，没有捷径。

## 我的判断标准

值得做 native 的情况：

- 服务启动频繁（滚动发布密集、需要秒级扩容、跑 Serverless）；
- 内存成本敏感，实例数量多；
- 逻辑相对单纯，依赖链干净；
- 团队能接受“排查工具变弱”这件事。

不值得做的情况：

- 长驻服务，启动时间根本不重要；
- 依赖里有一堆运行期增强的库；
- 业务逻辑复杂、线上问题多、依赖堆转储定位问题；
- 没有额外的 CI 资源预算。

## 最后

Native Image 给我的最大感受是：**它把成本从运行时搬到了构建时和排查时。** 这不是坏事，只是要清楚自己在交换什么。

那两个服务里，管理后台至今还在跑 native，因为它的特点是“启动频繁、流量极小、逻辑简单”——几乎是量身定做。而对外 API 那个，半年后我们改回了 JVM 版本，因为一次内存问题排查花了三天，而它在 JVM 上只需要一次堆转储。
