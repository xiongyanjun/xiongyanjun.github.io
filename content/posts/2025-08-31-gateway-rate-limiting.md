---
title: 网关限流：Sentinel 之外的选择
subtitle: Rate Limiting Beyond Sentinel
date: 2025-08-31
year: 2025
area: architecture
tags: [microservices]
featured: false
summary: 限流器本身不难写，难的是决定限在哪个维度、阈值是多少、被限的请求返回什么。工具选择只占这件事的一小部分。
---

我们上过三套限流方案：单机令牌桶、Redis 计数、网关层规则。每一次真正花时间的都不是实现，而是回答“这个接口应该允许多少 QPS”——以及被拒绝的用户该看到什么。这篇讲选型和落地顺序。

## 这篇文章要处理的问题

- 单机限流、集群限流、网关限流分别拦截的是什么风险？
- 阈值应该从容量推出来，还是从历史流量推出来？
- 被限流时返回 429、排队、还是降级返回旧数据，怎么选？
