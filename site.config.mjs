// 站点级配置：metadata、导航、分类体系、四年演化弧。
// 内容只写在 content/posts/*.md 里，这里只放“框架”类的东西。

export const SITE = {
  name: '🐻‍❄️🦘🐎',
  author: '🐻‍❄️🦘🐎',
  // 部署后改成你自己的地址（影响 RSS / sitemap / 绝对链接）
  url: 'https://example.github.io',
  tagline: '写了四年软件，然后开始追问为什么。',
  description:
    '一个工程师的四年笔记：从工程基本功、系统复杂度、AI 时代的重估，到对技术本身为何存在的追问。',
  locale: 'zh-CN',
  // 建站起始年份，用于归档分组
  startYear: 2023,
  // 每年目标篇数，显示在归档页
  postsPerYear: 10,
  nav: [
    { href: '/index.html', label: '首页' },
    { href: '/archive.html', label: '归档' },
    { href: '/tags.html', label: '主题' },
    { href: '/about.html', label: '关于' },
    { href: '/search.html', label: '搜索' },
  ],
};

// 四幕结构：首页与关于页用它画“成长曲线”
export const ACTS = [
  {
    year: 2023,
    act: '第一幕',
    title: '工程基本功',
    line: '我学会了把东西做出来，也学会了删代码。',
    note:
      '刚入行那两年，衡量自己的唯一尺子是“代码写得好不好”。写了大量关于分层、缓存、测试、可观测性的笔记，但它们背后其实是同一个问题：怎么把不确定性关进笼子里。',
  },
  {
    year: 2024,
    act: '第二幕',
    title: '系统与协作',
    line: '复杂度不可消除，只能安放；我学会了说“不”。',
    note:
      '从写代码的人变成被系统包围的人。开始发现技术问题的尽头常常是人：承诺、语言、注意力预算、以及“不加这个功能”的勇气。',
  },
  {
    year: 2025,
    act: '第三幕',
    title: 'AI 时代的重估',
    line: '工具变了，人的价值要重新定位。',
    note:
      '模型开始写代码之后，很多自以为牢固的东西松动了。这一年写下的几乎都是重新称重：什么是可验证的、什么是不可让渡的、我到底在提供什么价值。',
  },
  {
    year: 2026,
    act: '第四幕',
    title: '追问技术为何',
    line: '我学会了做减法，也学会了问“这值得吗”。',
    note:
      '哲学从一个借来的比喻，变成了正面的工作方法。开始读海德格尔、西蒙东、韩炳哲，也回头读庄子与王阳明——技术是手艺，手艺是修行。',
  },
];

// 六大思想脉络：文章按脉络成串，读者可以顺着一条线读下去
export const THREADS = [
  {
    slug: 'tools-and-humans',
    name: '工具与人',
    english: 'Tools & Humans',
    desc: '工具不是中性的，它在使用中重写使用者。编辑器、框架、大模型，都是同一类问题的不同面孔。',
    sources: ['麦克卢汉', '海德格尔', '伊里奇', '西蒙东'],
  },
  {
    slug: 'language-and-meaning',
    name: '语言与意义',
    english: 'Language & Meaning',
    desc: '领域建模、接口设计、提示词，本质上都是“让一个词在特定共同体内获得确定含义”的努力。',
    sources: ['维特根斯坦', '诠释学', 'DDD'],
  },
  {
    slug: 'complexity-and-uncertainty',
    name: '复杂度与不确定性',
    english: 'Complexity & Uncertainty',
    desc: '分布式系统是这门学问的技术化身：我们可以设计边界，但无法取消涌现。',
    sources: ['西蒙', '复杂系统', '涌现论'],
  },
  {
    slug: 'craft-and-practice',
    name: '技艺与练习',
    english: 'Craft & Practice',
    desc: '从看得见的招式到看不见的手感，技艺的核心是那些说不出但骗不了人的东西。',
    sources: ['庄子', '柏拉图 technē', '波兰尼 默会知识'],
  },
  {
    slug: 'attention-and-self',
    name: '注意力与自我',
    english: 'Attention & Self',
    desc: '信息不缺，注意力缺。所有关于效率的讨论，最后都落回“我把生命投在哪里”。',
    sources: ['韩炳哲', '赫伯特·西蒙', '尼尔·波兹曼'],
  },
  {
    slug: 'practice-and-ethics',
    name: '实践伦理',
    english: 'Practice & Ethics',
    desc: '知道不等于做到，做到才叫知道。技术选择的每一个便利，背后都有人替你付账。',
    sources: ['王阳明', '实用主义', '技术伦理'],
  },
];

// 标签体系：刻意收敛到 10 个，避免每个词都变成一个孤儿页面
export const TAGS = [
  { slug: 'engineering-practice', name: '工程实践', group: '技术', desc: '日常编码、测试、可维护性，以及那些反复踩的坑。' },
  { slug: 'architecture-systems', name: '架构与系统', group: '技术', desc: '分层、抽象、边界、领域模型。' },
  { slug: 'distributed-reliability', name: '分布式与可靠性', group: '技术', desc: '一致性、幂等、故障与复盘。' },
  { slug: 'collaboration', name: '协作与团队', group: '技术', desc: '评审、文档、会议与工程文化。' },
  { slug: 'tools-craft', name: '工具与手艺', group: '技术', desc: '工具如何反向塑造使用它的人。' },
  { slug: 'ai-engineering', name: 'AI 工程', group: '技术', desc: 'LLM 落地、上下文工程、评估与 RAG。' },
  { slug: 'ai-and-human', name: 'AI 与人的边界', group: '技术', desc: '能动性、信任、验证成本与职业价值。' },
  { slug: 'tech-and-philosophy', name: '技术与哲学', group: '哲学', desc: '用哲学问题重新描述工程问题。' },
  { slug: 'eastern-philosophy', name: '东方哲学', group: '哲学', desc: '庄子、王阳明，以及“做得好的时候是什么感觉”。' },
  { slug: 'growth-reflections', name: '成长回顾', group: '成长', desc: '每年一次的自我盘点。' },
];

export const tagBySlug = (slug) => TAGS.find((t) => t.slug === slug);
export const threadBySlug = (slug) => THREADS.find((t) => t.slug === slug);
export const actByYear = (year) => ACTS.find((a) => a.year === year);
