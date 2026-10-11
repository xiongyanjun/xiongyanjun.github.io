---
title: 从 JDK 8 升到 JDK 17：一次真实升级里踩到的坑
subtitle: Upgrading from JDK 8 to 17
date: 2023-01-15
year: 2023
area: jvm
tags: [jvm, troubleshooting]
featured: true
summary: 一个跑了六年的服务，从 JDK 8 升到 17 花了三周。真正的成本不在语言特性上，而在那些依赖了内部 API、GC 参数和旧字节码工具的地方。
---

那个服务从 2016 年上线，一直在 JDK 8 上跑。它不大，两万多行代码，五个模块，但依赖很杂：老版本的 cglib、一个没人知道为什么存在的字节码增强库、还有几个直接反射 JDK 内部类的工具方法。

升级的总工作量是三周。其中真正和“新语言特性”相关的部分，大概只有两个小时。

## 顺序很重要：先升框架，再升 JDK

我见过不少人把这两件事合成一步，结果排查问题时完全不知道是哪边引起的。稳妥的顺序是：

1. 先在 JDK 8 上把 Spring Boot 升到 2.7，把编译告警清干净；
2. 再升 JDK 到 17，让应用在旧框架上跑起来；
3. 最后升到 Spring Boot 3 并处理 `javax` → `jakarta`。

第一步看起来最没用，实际上收益最大：它把“框架不兼容”和“JDK 不兼容”这两类问题拆开了。我们当时清掉的编译告警里，有三处直接指向了后来会在 JDK 17 上炸掉的反射调用。

## 坑一：反射内部 API 被模块系统拦住

升级后第一个报错是 `InaccessibleObjectException`，来自一个工具类里的这段代码：

```java
// JDK 8 上能跑，JDK 9+ 直接抛异常
Field field = Unsafe.class.getDeclaredField("theUnsafe");
field.setAccessible(true);
```

JDK 9 引入模块系统之后，JDK 内部包默认不再对外开放。有几个选择：

- 短期：在启动参数里加 `--add-opens java.base/jdk.internal.misc=ALL-UNNAMED`；
- 长期：换掉实现。绝大多数用 `Unsafe` 的地方，其实用 `VarHandle` 或标准 API 就能做。

我们的做法是先加参数保证能上线，把这个类记进待办，两个月后换成了 `VarHandle`。**加启动参数不是解决方案，只是把问题挪到了看得见的地方。**

## 坑二：GC 日志参数被换了名字

JDK 8 的参数在 17 上大部分会直接导致启动失败：

| JDK 8 写法 | JDK 17 写法 |
| --- | --- |
| `-XX:+PrintGCDetails` | `-Xlog:gc*` |
| `-XX:+PrintGCTimeStamps` | `-Xlog:gc*:time,uptime` |
| `-Xloggc:/var/log/gc.log` | `-Xlog:gc*:file=/var/log/gc.log:time,uptime:filecount=5,filesize=50M` |
| `-XX:+UseConcMarkSweepGC` | 已移除，改用 G1 或 ZGC |
| `-XX:MaxPermSize=256m` | 已移除（元空间自己管理） |

新的 `-Xlog` 语法一开始很难记，但它的表达能力确实强很多。旧格式要写四五个参数，新格式一行就能同时指定时间、文件轮转和级别。

## 坑三：字节码工具版本太低

这一类报错最不友好。表现形式通常是：应用能启动，但某个切面静默失效，或者抛出一个信息量极低的 `VerifyError`。

原因是 cglib、ASM、javassist 这类库直接生成字节码，而每个 JDK 版本的 class 文件格式不一定兼容。**规则是：只要用到了动态代理或字节码增强，就要检查这些库的版本。**

```groovy
// 升级前后对比：版本号往往比想象中重要
// 升级前
implementation 'cglib:cglib:3.2.5'
// 升级后（ASM 版本足够新，才能处理 JDK 17 的类文件）
implementation 'cglib:cglib:3.3.0'
```

如果用了 Powermock 这类通过修改字节码来测试的工具，基本可以直接放弃，改成 Mockito 3+ 的 `mockStatic`。

## 坑四：那些“行为变了但没人告诉你”的地方

有几个变化不属于报错，而是逻辑悄悄不一样了，这类最危险：

- **`Optional` 与 `Stream` 的边界行为**：一些以前容忍空值的地方，新版本会更严格地抛 `NullPointerException`。
- **日期时间**：`SimpleDateFormat` 的行为没变，但很多人的 `DateTimeFormatter` 用法在切换 `Locale` 后表现不同，我们有一处报表月份英文名的大小写变了。
- **`Files` 与 `Path`**：符号链接的处理默认更严格。
- **默认字符集**：JDK 18 起 `file.encoding` 默认 UTF-8。我们没升到 18，但提前把所有显式指定编码的地方检查了一遍。

处理方式只有一条：**为每个变化点写一个断言行为的测试**，而不是靠人工回归。

## 真正花时间的部分

回头看三周的时间分配：改代码大概占 20%，剩下 80% 是理解依赖、处理构建脚本（Maven 插件普遍偏老）、以及在不同环境里反复验证。

所以如果只让我给一条建议：**先做一次“依赖体检”再决定要不要升**。把项目里所有会生成字节码、会反射内部 API、会读 JVM 参数的库列出来，逐个确认版本。这张表的长度基本决定了升级的工作量。

升级完那天，服务启动时间从 11 秒降到 6 秒，内存峰值低了大概四分之一，这些收益是真实的。但更有价值的是过程里清掉的那些东西——它们本来也不会一直安全地待在那里。
