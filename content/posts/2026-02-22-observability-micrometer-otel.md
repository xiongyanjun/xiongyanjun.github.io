---
title: 可观测性：从 Micrometer 到 OpenTelemetry
subtitle: From Micrometer to OpenTelemetry
date: 2026-02-22
year: 2026
area: craft
tags: [toolchain, troubleshooting]
featured: false
summary: 指标、日志、链路三件套各自解决不同问题。真正难的不是接入，而是决定什么值得被记录下来。
---

我们花了两周把三个服务接进 OpenTelemetry，事后统计：真正被用到的指标不超过二十个，链路采样率从 100% 调到 5% 之后排查体验几乎没变。这篇讲我们如何删掉一半的埋点。

## 这篇文章要处理的问题

- 指标、日志、链路各自的成本结构是什么，如何避免重复？
- 采样率怎么定，哪类问题必须依赖全量链路？
- 什么样的指标值得长期保留，什么样的只是临时观察？
