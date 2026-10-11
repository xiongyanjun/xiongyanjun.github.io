---
title: 让 AI 干活的代价：验证成本与信任边界
subtitle: The Cost of Delegating
date: 2025-06-28
year: 2025
tags: [ai-and-human, engineering-practice]
thread: practice-and-ethics
featured: false
summary: 委托不是免费的：你省下的执行时间，会以验证成本的形式回来。能否划清信任边界，决定了委托是净收益还是净负债。
---

我们统计过一轮：用模型生成的部分，代码评审时间平均上升了 40%。这个数字解释了为什么“提速”的体感总是比报告里的数字小。这篇讨论委托的经济学。

## 这篇文章要处理的问题

- 哪些任务适合高信任委托，哪些必须低信任对待？
- 验证成本如何被前置设计降下来（测试、类型、可回滚）？
- 长期高频委托会不会削弱团队自身的判断力，如何对冲？
