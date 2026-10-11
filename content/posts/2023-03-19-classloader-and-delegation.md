---
title: 类加载与双亲委派：从一次 NoClassDefFoundError 说起
subtitle: ClassLoader and Parent Delegation
date: 2023-03-19
year: 2023
area: jvm
tags: [jvm, troubleshooting]
featured: false
summary: 同一个类被两个加载器加载，就会变成两个不同的类型。所有“类转换异常”和静态变量不共享的怪事，源头都在这里。
---

我们当时遇到的现象很反直觉：代码里明明判断了单例，日志里却打印出两份初始化的记录。查到最后，是热部署插件和业务代码各用了一个加载器加载同一个类。这篇整理类加载的可见性规则和排查方法。

## 这篇文章要处理的问题

- 双亲委派模型在解决什么问题，打破它又会带来什么？
- `ClassNotFoundException` 和 `NoClassDefFoundError` 分别对应哪个阶段的失败？
- 线上如何确认一个类被加载了几次、由谁加载？
