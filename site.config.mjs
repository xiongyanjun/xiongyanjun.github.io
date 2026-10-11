// 站点级配置：metadata、导航、方向（技术地图）、标签。
// 内容只写在 content/posts/*.md 里，这里只放“框架”类的东西。

export const SITE = {
  name: '🐻‍❄️🦘🐎',
  author: '🐻‍❄️🦘🐎',
  email: 'xiongyanjun97@qq.com',
  // 部署后改成你自己的地址（影响 RSS / sitemap / 绝对链接）
  url: 'https://example.github.io',
  tagline: '把 Java 写清楚。',
  description:
    '一个 Java 后端工程师的技术笔记：JVM 与并发、Spring 生态、数据与中间件、分布式架构、工程效能与排查复盘。',
  locale: 'zh-CN',
  nav: [
    { href: '/index.html', label: '首页' },
    { href: '/archive.html', label: '文章' },
    { href: '/areas.html', label: '方向' },
    { href: '/about.html', label: '关于' },
    { href: '/search.html', label: '搜索' },
  ],
};

// 技术地图：六个方向，也是站内文章的第一层分类
export const AREAS = [
  {
    slug: 'jvm',
    name: 'JVM 与性能',
    english: 'JVM & Performance',
    desc: '内存结构、GC、JIT、压测与调优。大部分“莫名其妙”的问题，答案最后都落在这里。',
  },
  {
    slug: 'concurrency',
    name: '并发与多线程',
    english: 'Concurrency',
    desc: '线程池、锁、内存模型、虚拟线程，以及那些只在压测流量下才会露头的问题。',
  },
  {
    slug: 'spring',
    name: 'Spring 与生态',
    english: 'Spring',
    desc: 'IoC、AOP、自动配置、事务传播，以及跨版本升级要付的账。',
  },
  {
    slug: 'data',
    name: '数据与中间件',
    english: 'Data & Middleware',
    desc: 'MySQL、Redis、消息队列。它们决定了应用层能怎么写、不能怎么写。',
  },
  {
    slug: 'architecture',
    name: '分布式与架构',
    english: 'Distributed Systems',
    desc: '拆分与合并、一致性、限流熔断、故障隔离——把不确定性放在看得见的地方。',
  },
  {
    slug: 'craft',
    name: '工程与判断',
    english: 'Engineering Craft',
    desc: '测试、构建、可观测性、代码评审，以及一个工程师如何形成自己的判断。',
  },
];

// 细粒度标签：刻意收敛，避免每个词都变成一个孤儿页面
export const TAGS = [
  { slug: 'jvm', name: 'JVM', area: 'jvm', desc: '内存结构、类加载、字节码与运行时。' },
  { slug: 'gc', name: '垃圾回收', area: 'jvm', desc: '收集器选择、GC 日志、停顿与吞吐。' },
  { slug: 'performance', name: '性能调优', area: 'jvm', desc: '压测、火焰图、瓶颈定位。' },
  { slug: 'concurrency', name: '并发', area: 'concurrency', desc: '线程池、锁、AQS、内存模型。' },
  { slug: 'virtual-threads', name: '虚拟线程', area: 'concurrency', desc: 'Loom、结构化并发与阻塞模型。' },
  { slug: 'spring', name: 'Spring', area: 'spring', desc: 'IoC、AOP、自动配置与升级迁移。' },
  { slug: 'transaction', name: '事务', area: 'spring', desc: '传播行为、失效场景与分布式事务。' },
  { slug: 'mysql', name: 'MySQL', area: 'data', desc: '索引、执行计划、隔离级别与 MVCC。' },
  { slug: 'redis', name: 'Redis', area: 'data', desc: '缓存、过期策略与一致性。' },
  { slug: 'mq', name: '消息队列', area: 'data', desc: '投递语义、幂等与积压处理。' },
  { slug: 'microservices', name: '微服务', area: 'architecture', desc: '拆分、治理、限流熔断与网关。' },
  { slug: 'troubleshooting', name: '排查复盘', area: 'architecture', desc: '线上问题的定位过程与事后复盘。' },
  { slug: 'testing', name: '测试', area: 'craft', desc: '单元测试、Mock 与边界用例。' },
  { slug: 'toolchain', name: '构建与工具链', area: 'craft', desc: 'Maven、Gradle、CI 与本地开发效率。' },
  { slug: 'career', name: '职业与判断', area: 'craft', desc: '技术选择、协作方式与长期成长。' },
];

export const tagBySlug = (slug) => TAGS.find((t) => t.slug === slug);
export const areaBySlug = (slug) => AREAS.find((a) => a.slug === slug);
export const tagsOfArea = (slug) => TAGS.filter((t) => t.area === slug);
