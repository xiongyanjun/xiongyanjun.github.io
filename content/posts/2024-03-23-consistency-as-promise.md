---
title: 一致性不是技术问题，是承诺问题
subtitle: Consistency as a Promise
date: 2024-03-23
year: 2024
tags: [distributed-reliability, tech-and-philosophy]
thread: language-and-meaning
featured: false
summary: “最终一致”这四个字不是技术描述，而是对使用者做出的一句承诺。说不清承诺对象的方案，本质上没解决问题。
---

有一次我们向业务方解释“最终一致”，对方问“最终是多久”。那一瞬间我意识到，我们讨论的不是算法，而是一句对方能否接受的承诺。这篇讨论一致性模型背后的语言问题。

## 这篇文章要处理的问题

- 强一致、最终一致这些术语对使用者意味着什么，为什么它们经常被误读？
- 一个可承诺的一致性方案，需要向对方交代哪几件事？
- 当承诺无法兑现时，产品层面有哪些诚实的退路？
