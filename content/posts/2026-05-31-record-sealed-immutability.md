---
title: record、sealed 与不可变设计
subtitle: Records, Sealed Types, and Immutability
date: 2026-05-31
year: 2026
area: jvm
tags: [jvm]
featured: false
summary: record 不只是省掉 getter，它把「这个对象不可变」写进了类型里。配合 sealed 使用时，编译器能帮你检查遗漏的分支。
---

我们在一批 DTO 上换成 record，代码量少了大概四成，但更重要的是它顺带暴露了几处“本该不可变却能被改动”的设计问题。这篇讲 record、sealed 与模式匹配配合使用时的实际收益。

## 这篇文章要处理的问题

- record 与 Lombok 的 `@Value` 在语义和兼容性上有什么本质区别？
- sealed 接口配上 switch 模式匹配，能减少多少防御性代码？
- 什么时候不该用 record，可变性的代价真的那么大吗？
