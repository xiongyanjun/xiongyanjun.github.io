---
title: @Transactional 失效的几种场景
subtitle: When @Transactional Silently Fails
date: 2023-08-20
year: 2023
area: spring
tags: [spring, transaction]
featured: false
summary: 事务失效最麻烦的地方是它不报错。方法正常返回、日志正常打印、数据就是没回滚。这篇按触发条件整理常见场景和验证方式。
---

一次数据不一致的排查最后落到一行代码上：同类内部调用了一个带 `@Transactional` 的方法。代理没被走到，事务自然不存在。这篇把失效场景按“为什么代理失效”“为什么异常没被感知”两类整理。

## 这篇文章要处理的问题

- 哪些调用方式会绕过代理，如何快速判断当前调用是否走了代理？
- 异常类型、嵌套传播行为分别如何决定回滚与否？
- 怎么用集成测试证明事务真的生效，而不是靠肉眼检查代码？
