---
title: MyBatis 一对多映射为什么返回重复行
subtitle: Duplicated Rows in MyBatis Mappings
date: 2023-09-24
year: 2023
area: data
tags: [mysql]
featured: false
summary: join 之后一对多会变成笛卡尔积，MyBatis 靠 `<id>` 标签做去重。漏写 id 映射时，你会得到一堆“看起来一样但对象不同”的记录。
---

那次分页接口返回的数量是对的，列表里的对象却重复出现。原因是 `<collection>` 里的 resultMap 少写了 id 映射，MyBatis 无法判断两行属于同一个主对象。这篇讲清嵌套映射的去重机制。

## 这篇文章要处理的问题

- `resultMap` 的 id 元素在去重中扮演什么角色，为什么 `<result>` 不行？
- 一对多分页为什么会失真，`select` 嵌套查询和 join 各有什么代价？
- 大结果集的嵌套映射如何避免 N+1 与内存膨胀？
