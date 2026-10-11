---
title: 复杂度守恒：没有免费的抽象
subtitle: Conservation of Complexity
date: 2024-01-20
year: 2024
tags: [architecture-systems, tech-and-philosophy]
thread: complexity-and-uncertainty
featured: false
summary: 抽象不能消除复杂度，只能把它挪到别处。判断一次抽象好坏的标准，是它把复杂度挪给谁、以什么形式、代价是否更低。
---

有一次我把三个服务里重复的逻辑抽成一个公共库，两周后它变成了所有服务都不敢升级的强耦合点。那次经历让我开始怀疑“消除重复”本身是不是一个值得追求的目标——至少不是无条件值得。

## 这篇文章要处理的问题

- 抽象把复杂度从“重复”转成了什么形式，这种转换为什么会带来新成本？
- 如何判断一次抽象是净收益，还是只是把问题挪给了别人？
- 什么时候应该容忍重复，容忍到什么程度？
