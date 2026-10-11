---
title: Spring Boot 自动配置的加载顺序与覆盖
subtitle: Autoconfiguration Ordering
date: 2025-01-19
year: 2025
area: spring
tags: [spring]
featured: false
summary: 我写的配置类没有生效，原因不是写错了，而是被另一个自动配置用 `@ConditionalOnMissingBean` 抢先了。
---

引入一个 starter 之后，我们自己的 `DataSource` 配置突然失效。花了一下午才明白：自动配置的生效顺序由 `AutoConfiguration.imports` 和条件注解共同决定，光看代码顺序没有意义。这篇把判断逻辑讲清楚。

## 这篇文章要处理的问题

- `@ConditionalOnMissingBean` 的判断发生在什么阶段，为什么它依赖顺序？
- `@AutoConfigureBefore/After` 与 `@Order` 在自动配置里分别管什么？
- 怎么用 `--debug` 或 `ConditionEvaluationReport` 查出某个配置为什么没生效？
