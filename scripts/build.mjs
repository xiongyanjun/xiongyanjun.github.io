// 静态站点生成器：读 content/posts/*.md，输出 dist/ 下的完整站点。
// 零依赖，直接用 node scripts/build.mjs 运行。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderMarkdown,
  parseFrontMatter,
  escapeHtml,
  stripMarkdown,
} from './lib/markdown.mjs';
import { SITE, AREAS, TAGS, tagBySlug, areaBySlug, tagsOfArea } from '../site.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const SITE_DIR = path.join(ROOT, 'site');

// 构建产物直接放在仓库根目录：<用户名>.github.io 这类仓库默认就是从根目录发布，
// 这样推送即上线，不需要在 Pages 设置里切换发布方式。
const DIST = ROOT;

// 每次构建前只清理自己产出的东西，绝不碰源码目录
const GENERATED = [
  'index.html',
  'archive.html',
  'areas.html',
  'tags.html',
  'about.html',
  'search.html',
  '404.html',
  'feed.xml',
  'sitemap.xml',
  'robots.txt',
  '.nojekyll',
  'posts',
  'area',
  'tag',
  'assets',
];

/* ------------------------------------------------------------------ */
/* 载入内容                                                            */
/* ------------------------------------------------------------------ */

function loadPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    const date = String(data.date || file.slice(0, 10));
    const year = Number(data.year || date.slice(0, 4));
    const featured = data.featured === true;
    const rendered = renderMarkdown(body);
    return {
      slug,
      file,
      title: String(data.title || slug),
      subtitle: String(data.subtitle || ''),
      date,
      year,
      area: areaBySlug(data.area) ? data.area : '',
      tags: Array.isArray(data.tags) ? data.tags.filter((t) => tagBySlug(t)) : [],
      summary: String(data.summary || ''),
      featured,
      html: rendered.html,
      headings: featured ? rendered.headings.filter((h) => h.level === 2 || h.level === 3) : [],
      text: stripMarkdown(body),
    };
  });
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

const POSTS = loadPosts();
const byYear = (year) => POSTS.filter((p) => p.year === year);
const byArea = (slug) => POSTS.filter((p) => p.area === slug);
const byTag = (slug) => POSTS.filter((p) => p.tags.includes(slug));

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y} 年 ${m} 月 ${d} 日`;
};

const MAIL = `mailto:${SITE.email}`;

/* ------------------------------------------------------------------ */
/* 页面骨架                                                            */
/* ------------------------------------------------------------------ */

const header = (rel, active) => `
<a class="skip-link" href="#main">跳到正文</a>
<header class="site-header">
  <nav class="wrap nav" aria-label="主导航">
    <a class="nav-brand" href="${rel}index.html" aria-label="${escapeHtml(SITE.name)} 首页">${SITE.name}</a>
    <div class="nav-links">
      ${SITE.nav
        .map((n) => {
          const href = rel + n.href.replace(/^\//, '');
          const current = active === n.label ? ' aria-current="page"' : '';
          return `<a href="${href}"${current}>${n.label}</a>`;
        })
        .join('\n      ')}
    </div>
    <button class="theme-toggle" type="button" aria-label="切换深浅色外观" title="切换外观">
      <span class="theme-toggle-icon"></span>
    </button>
  </nav>
  <div class="reading-progress" aria-hidden="true"></div>
</header>`;

const footer = (rel) => `
<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">${SITE.name}</div>
    <div class="footer-cols">
      <div class="footer-col">
        <p class="footer-col-title">浏览</p>
        ${SITE.nav
          .map((n) => `<a href="${rel}${n.href.replace(/^\//, '')}">${n.label}</a>`)
          .join('')}
      </div>
      <div class="footer-col">
        <p class="footer-col-title">方向</p>
        ${AREAS.map((a) => `<a href="${rel}area/${a.slug}.html">${escapeHtml(a.name)}</a>`).join('')}
      </div>
      <div class="footer-col">
        <p class="footer-col-title">联系</p>
        <a href="${MAIL}">${SITE.email}</a>
        <a href="${rel}feed.xml">RSS 订阅</a>
        <a href="${rel}about.html">关于这个站</a>
      </div>
    </div>
    <p class="footer-note">© ${new Date().getFullYear()} ${SITE.author} · 用 Markdown 写作，构建成静态页面</p>
  </div>
</footer>`;

const layout = ({ title, description, content, rel = '', active = '', bodyClass = '' }) => `<!DOCTYPE html>
<html lang="${SITE.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description || SITE.description)}">
<meta name="author" content="${escapeHtml(SITE.author)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description || SITE.description)}">
<meta property="og:type" content="website">
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE.name)}" href="${rel}feed.xml">
<link rel="stylesheet" href="${rel}assets/css/main.css">
<script>
  try {
    var t = localStorage.getItem('theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header(rel, active)}
<main id="main">
${content}
</main>
${footer(rel)}
<script src="${rel}assets/js/main.js" defer></script>
</body>
</html>
`;

/* ------------------------------------------------------------------ */
/* 复用片段                                                            */
/* ------------------------------------------------------------------ */

const draftBadge = (p) => (p.featured ? '' : '<span class="badge">待写</span>');

const card = (p, rel = '') => `
<a class="card post-card${p.featured ? '' : ' is-draft'}" href="${rel}posts/${p.slug}.html">
  <div class="post-card-meta">
    <time datetime="${p.date}">${p.date}</time>
    ${p.area ? `<span class="sep">·</span><span>${escapeHtml(areaBySlug(p.area).name)}</span>` : ''}
  </div>
  <h3 class="post-card-title">${escapeHtml(p.title)}${draftBadge(p)}</h3>
  ${p.subtitle ? `<p class="post-card-sub">${escapeHtml(p.subtitle)}</p>` : ''}
  <p class="post-card-summary">${escapeHtml(p.summary)}</p>
  <span class="post-card-more">阅读 <span aria-hidden="true">›</span></span>
</a>`;

const rowCard = (p, rel = '') => `
<a class="row-item${p.featured ? '' : ' is-draft'}" href="${rel}posts/${p.slug}.html">
  <time datetime="${p.date}">${p.date}</time>
  <span class="row-title">${escapeHtml(p.title)}${draftBadge(p)}</span>
  <span class="row-summary">${escapeHtml(p.summary)}</span>
  <span class="row-area">${p.area ? escapeHtml(areaBySlug(p.area).name) : ''}</span>
</a>`;

const areaCard = (a, rel = '') => `
<a class="card area-card" href="${rel}area/${a.slug}.html">
  <span class="area-card-en">${escapeHtml(a.english)}</span>
  <span class="area-card-name">${escapeHtml(a.name)}</span>
  <span class="area-card-desc">${escapeHtml(a.desc)}</span>
  <span class="area-card-count">${byArea(a.slug).length} 篇 <span aria-hidden="true">›</span></span>
</a>`;

/* ------------------------------------------------------------------ */
/* 首页                                                                */
/* ------------------------------------------------------------------ */

function buildIndex() {
  const latest = POSTS.slice(0, 3);
  const written = POSTS.filter((p) => p.featured).length;

  const content = `
<section class="hero">
  <p class="hero-eyebrow">哲学与计算机工程</p>
  <h1 class="hero-title">${escapeHtml(SITE.tagline)}</h1>
  <p class="hero-sub">技术回答「能不能做到」，哲学回答「值不值得做」——写代码的人，最后都站在这两者之间。</p>
  <div class="hero-actions">
    <a class="btn btn-primary" href="archive.html">浏览全部文章</a>
    <a class="btn btn-link" href="about.html">关于我 <span aria-hidden="true">›</span></a>
  </div>
  <p class="hero-meta">${POSTS.length} 篇文章 · ${AREAS.length} 个方向 · ${written} 篇已完稿 · 持续更新</p>
</section>

<section class="section section-gray">
  <div class="section-head">
    <h2>最新</h2>
    <a class="section-link" href="archive.html">全部文章 <span aria-hidden="true">›</span></a>
  </div>
  <div class="card-grid">${latest.map((p) => card(p, '')).join('')}</div>
</section>

<section class="section">
  <div class="section-head">
    <h2>技术地图</h2>
    <a class="section-link" href="areas.html">看全部方向 <span aria-hidden="true">›</span></a>
  </div>
  <div class="area-grid">${AREAS.map((a) => areaCard(a)).join('')}</div>
</section>

<section class="section section-dark contact">
  <h2 class="contact-title">想聊点什么？</h2>
  <p class="contact-sub">技术问题、源码疑问、工作机会，或者只是想聊聊工程与判断，都欢迎来信。</p>
  <a class="btn btn-primary btn-lg" href="${MAIL}">${SITE.email}</a>
  <p class="contact-meta">一般两三天内回复 · 也可以直接<a href="archive.html">翻翻文章</a></p>
</section>
`;

  return layout({
    title: `${SITE.name} · ${SITE.tagline}`,
    content,
    active: '首页',
    bodyClass: 'page-home',
  });
}

/* ------------------------------------------------------------------ */
/* 归档                                                                */
/* ------------------------------------------------------------------ */

function buildArchive() {
  const years = [...new Set(POSTS.map((p) => p.year))].sort((a, b) => b - a);
  const sections = years
    .map(
      (year) => `
  <section class="year-block" id="y${year}">
    <div class="year-head">
      <h2 class="year-num">${year}</h2>
      <span class="year-count">${byYear(year).length} 篇</span>
    </div>
    <div class="row-list">${byYear(year).map((p) => rowCard(p)).join('')}</div>
  </section>`
    )
    .join('');

  const content = `
<section class="page-head">
  <h1>文章</h1>
  <p>共 ${POSTS.length} 篇，按时间倒序。带“待写”标记的是已经定题、正文还在写作中的篇目。</p>
</section>
<div class="archive-body">${sections}</div>
`;

  return layout({ title: `文章 · ${SITE.name}`, content, active: '文章' });
}

/* ------------------------------------------------------------------ */
/* 方向与标签                                                          */
/* ------------------------------------------------------------------ */

function buildAreas() {
  const content = `
<section class="page-head">
  <h1>方向</h1>
  <p>六个方向，也是站内文章的六个入口。点进去可以看到这个方向下的全部文章和细分标签。</p>
</section>
${AREAS.map(
  (a) => `
<section class="section area-section">
  <div class="area-section-head">
    <h2>${escapeHtml(a.name)}</h2>
    <span class="area-section-en">${escapeHtml(a.english)}</span>
  </div>
  <p class="area-section-desc">${escapeHtml(a.desc)}</p>
  <div class="chip-row">
    ${tagsOfArea(a.slug)
      .map(
        (t) =>
          `<a class="chip" href="tag/${t.slug}.html">${escapeHtml(t.name)}<span class="chip-count">${byTag(t.slug).length}</span></a>`
      )
      .join('')}
    <a class="chip chip-ghost" href="area/${a.slug}.html">全部 ${byArea(a.slug).length} 篇 <span aria-hidden="true">›</span></a>
  </div>
</section>`
).join('')}
`;
  return layout({ title: `方向 · ${SITE.name}`, content, active: '方向' });
}

function buildAreaPage(area) {
  const list = byArea(area.slug);
  const content = `
<section class="page-head">
  <p class="crumb"><a href="../areas.html">方向</a></p>
  <h1>${escapeHtml(area.name)}</h1>
  <p class="page-head-en">${escapeHtml(area.english)}</p>
  <p>${escapeHtml(area.desc)}</p>
  <p class="page-head-meta">共 ${list.length} 篇</p>
</section>
<div class="archive-body">
  <div class="row-list">${list.map((p) => rowCard(p, '../')).join('')}</div>
</div>
`;
  return layout({
    title: `${area.name} · ${SITE.name}`,
    description: area.desc,
    content,
    rel: '../',
    active: '方向',
  });
}

function buildTags() {
  const content = `
<section class="page-head">
  <h1>标签</h1>
  <p>比方向更细的一层：具体到某个技术点。</p>
</section>
${AREAS.map((a) => {
  const tags = tagsOfArea(a.slug);
  if (!tags.length) return '';
  return `
<section class="section">
  <div class="area-section-head"><h2>${escapeHtml(a.name)}</h2></div>
  <div class="chip-row">
    ${tags
      .map(
        (t) =>
          `<a class="chip" href="tag/${t.slug}.html">${escapeHtml(t.name)}<span class="chip-count">${byTag(t.slug).length}</span></a>`
      )
      .join('')}
  </div>
</section>`;
}).join('')}
`;
  return layout({ title: `标签 · ${SITE.name}`, content, active: '方向' });
}

function buildTagPage(tag) {
  const list = byTag(tag.slug);
  const area = areaBySlug(tag.area);
  const content = `
<section class="page-head">
  <p class="crumb"><a href="../tags.html">标签</a> · <a href="../area/${area.slug}.html">${escapeHtml(area.name)}</a></p>
  <h1>${escapeHtml(tag.name)}</h1>
  <p>${escapeHtml(tag.desc)}</p>
  <p class="page-head-meta">共 ${list.length} 篇</p>
</section>
<div class="archive-body">
  <div class="row-list">${list.map((p) => rowCard(p, '../')).join('')}</div>
</div>
`;
  return layout({
    title: `${tag.name} · ${SITE.name}`,
    description: tag.desc,
    content,
    rel: '../',
    active: '方向',
  });
}

/* ------------------------------------------------------------------ */
/* 文章页                                                              */
/* ------------------------------------------------------------------ */

function relatedPosts(post) {
  const sameArea = POSTS.filter((p) => p.slug !== post.slug && post.area && p.area === post.area);
  const sameTag = POSTS.filter(
    (p) => p.slug !== post.slug && !sameArea.includes(p) && p.tags.some((t) => post.tags.includes(t))
  );
  return [...sameArea, ...sameTag].slice(0, 3);
}

function buildPost(post) {
  const idx = POSTS.findIndex((p) => p.slug === post.slug);
  const newer = POSTS[idx - 1];
  const older = POSTS[idx + 1];
  const area = post.area ? areaBySlug(post.area) : null;

  const toc =
    post.headings.length >= 4
      ? `
  <aside class="toc" aria-label="目录">
    <p class="toc-title">目录</p>
    <ul>
      ${post.headings
        .map((h) => `<li class="toc-l${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`)
        .join('')}
    </ul>
  </aside>`
      : '';

  const draftNote = post.featured
    ? ''
    : `<p class="draft-note">这篇还在写作中。下面是它要处理的问题。</p>`;

  const related = relatedPosts(post);

  const content = `
<article class="post">
  <div class="post-inner">
  <header class="post-head">
    <div class="post-kicker">
      ${area ? `<a class="badge badge-area" href="../area/${area.slug}.html">${escapeHtml(area.name)}</a>` : ''}
      ${post.tags
        .map((t) => `<a class="badge" href="../tag/${t}.html">${escapeHtml(tagBySlug(t).name)}</a>`)
        .join('')}
      ${post.featured ? '' : '<span class="badge badge-draft">待写</span>'}
    </div>
    <h1 class="post-title">${escapeHtml(post.title)}</h1>
    ${post.subtitle ? `<p class="post-subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
    <p class="post-meta">
      <time datetime="${post.date}">${fmtDate(post.date)}</time>
    </p>
  </header>

  <div class="post-layout">
    <div class="post-body">
      ${draftNote}
      ${post.html}
    </div>
    ${toc}
  </div>

  ${
    area
      ? `
  <aside class="area-callout">
    <p class="area-callout-label">所属方向</p>
    <p class="area-callout-name">${escapeHtml(area.name)}</p>
    <p class="area-callout-desc">${escapeHtml(area.desc)}</p>
    <a class="btn btn-link" href="../area/${area.slug}.html">看这个方向的全部文章 <span aria-hidden="true">›</span></a>
  </aside>`
      : ''
  }

  <nav class="post-nav" aria-label="文章导航">
    <a class="post-nav-item" href="${newer ? `${newer.slug}.html` : '../archive.html'}">
      <span class="post-nav-label">${newer ? '更新的一篇' : '回到文章列表'}</span>
      <span class="post-nav-title">${escapeHtml(newer ? newer.title : '全部文章')}</span>
    </a>
    <a class="post-nav-item post-nav-next" href="${older ? `${older.slug}.html` : '../archive.html'}">
      <span class="post-nav-label">${older ? '更早的一篇' : '回到文章列表'}</span>
      <span class="post-nav-title">${escapeHtml(older ? older.title : '全部文章')}</span>
    </a>
  </nav>
  </div>
</article>

${
  related.length
    ? `
<section class="section section-gray">
  <div class="section-head"><h2>接着读</h2></div>
  <div class="card-grid">${related.map((p) => card(p, '../')).join('')}</div>
</section>`
    : ''
}
`;

  return layout({
    title: `${post.title} · ${SITE.name}`,
    description: post.summary,
    content,
    rel: '../',
    bodyClass: 'page-post',
  });
}

/* ------------------------------------------------------------------ */
/* 关于                                                                */
/* ------------------------------------------------------------------ */

function buildAbout() {
  const stack = [
    ['语言与运行时', 'Java / JVM、内存与 GC、JIT、并发与虚拟线程'],
    ['框架', 'Spring / Spring Boot / Spring Cloud、MyBatis'],
    ['数据与中间件', 'MySQL、Redis、Kafka / RocketMQ、Elasticsearch'],
    ['架构', '微服务、网关、限流熔断、分布式事务与一致性'],
    ['工程', 'Maven / Gradle、JUnit、CI/CD、可观测性'],
  ];

  const content = `
<section class="page-head">
  <h1>关于</h1>
  <p class="page-head-en">Engineering &amp; Philosophy · 技术笔记</p>
</section>

<section class="section">
  <div class="section-inner">
    <div class="prose">
      <p>这个站点放的是我在计算机工程与哲学这两件事之间的笔记。绝大多数内容来自两类时刻：线上出了问题、排查到深夜才发现是一个早就该想清楚的地方；或者读源码读到某处，突然明白一个以前只是“背下来”的结论到底为什么成立。</p>
      <p>我尽量只写自己真正处理过的部分。所以这里的文章不太像教程，更像排查记录和思考过程的整理：先说清问题是怎么出现的，再说当时有哪些选择，最后才说为什么选了这一个。</p>
      <p>之所以把哲学和工程放在一起：工程里最难的部分往往不是实现，而是判断——判断什么值得做、什么代价可以承受、什么应该放弃。这些问题技术本身回答不了。</p>
      <p>站点按六个方向组织。文章会一直更新，没有固定的节奏——想清楚了就写，写不明白就先放着，页面上会标“待写”。</p>
    </div>
  </div>
</section>

<section class="section section-gray">
  <div class="section-head"><h2>技术栈</h2></div>
  <div class="stack-grid">
    ${stack
      .map(
        ([title, items]) => `
    <div class="card stack-card">
      <p class="stack-title">${escapeHtml(title)}</p>
      <p class="stack-items">${escapeHtml(items)}</p>
    </div>`
      )
      .join('')}
  </div>
</section>

<section class="section">
  <div class="section-head"><h2>怎么读这个站</h2></div>
  <div class="section-inner">
    <div class="prose">
      <ul>
        <li>想按时间看：去<a href="archive.html">文章列表</a>，按年份翻。</li>
        <li>想按方向看：去<a href="areas.html">方向</a>，六个方向下有更细的标签。</li>
        <li>只想找某个词：用<a href="search.html">搜索</a>，全文检索在你的浏览器里完成。</li>
        <li>标了“待写”的是已经定题、正文还在写作中，点进去能看到要处理的问题。</li>
      </ul>
    </div>
  </div>
</section>

<section class="section section-dark contact">
  <h2 class="contact-title">联系我</h2>
  <p class="contact-sub">技术问题、源码疑问、工作机会，或者只是想聊聊工程与判断，都欢迎来信。</p>
  <a class="btn btn-primary btn-lg" href="${MAIL}">${SITE.email}</a>
</section>
`;

  return layout({ title: `关于 · ${SITE.name}`, content, active: '关于' });
}

/* ------------------------------------------------------------------ */
/* 搜索页                                                              */
/* ------------------------------------------------------------------ */

function buildSearch() {
  const content = `
<section class="page-head">
  <h1>搜索</h1>
  <p>全文检索，完全在你的浏览器里完成。标题、摘要、标签和正文都可以搜。</p>
</section>
<section class="section">
  <div class="search-box">
    <input id="search-input" type="search" placeholder="试试搜「线程池」「G1」「循环依赖」「索引失效」…" autocomplete="off" aria-label="搜索文章">
  </div>
  <p class="search-status" id="search-status" aria-live="polite"></p>
  <div class="row-list" id="search-results"></div>
</section>
`;
  const html = layout({ title: `搜索 · ${SITE.name}`, content, active: '搜索' });
  return html.replace(
    '<script src="assets/js/main.js" defer></script>',
    '<script src="assets/js/main.js" defer></script>\n<script src="assets/js/search.js" defer></script>'
  );
}

/* ------------------------------------------------------------------ */
/* RSS / sitemap / 404                                                 */
/* ------------------------------------------------------------------ */

function buildFeed() {
  const items = POSTS.slice(0, 20)
    .map(
      (p) => `
  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${SITE.url}/posts/${p.slug}.html</link>
    <guid isPermaLink="true">${SITE.url}/posts/${p.slug}.html</guid>
    <pubDate>${new Date(`${p.date}T09:00:00+08:00`).toUTCString()}</pubDate>
    <category>${escapeHtml(p.area ? areaBySlug(p.area).name : '')}</category>
    <description>${escapeHtml(p.summary)}</description>
  </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeHtml(SITE.name)}</title>
  <link>${SITE.url}</link>
  <description>${escapeHtml(SITE.description)}</description>
  <language>zh-cn</language>
  <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>
`;
}

function buildSitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${SITE.url}${u.path}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`;
}

function build404() {
  const content = `
<section class="page-head page-head-center">
  <h1>页面不存在</h1>
  <p>这个地址上没有东西。也许是链接写错了，也许是那篇文章还没写出来。</p>
  <div class="hero-actions">
    <a class="btn btn-primary" href="index.html">回到首页</a>
    <a class="btn btn-link" href="archive.html">全部文章 <span aria-hidden="true">›</span></a>
  </div>
</section>`;
  return layout({ title: `页面不存在 · ${SITE.name}`, content });
}

/* ------------------------------------------------------------------ */
/* 输出                                                                */
/* ------------------------------------------------------------------ */

function write(relPath, contents) {
  const target = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf8');
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

for (const target of GENERATED) {
  fs.rmSync(path.join(DIST, target), { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

copyDir(SITE_DIR, DIST);

const urls = [];
const addUrl = (p, lastmod) => urls.push({ path: p, lastmod });

write('index.html', buildIndex());
addUrl('/index.html');
write('archive.html', buildArchive());
addUrl('/archive.html');
write('areas.html', buildAreas());
addUrl('/areas.html');
write('tags.html', buildTags());
addUrl('/tags.html');
write('about.html', buildAbout());
addUrl('/about.html');
write('search.html', buildSearch());
addUrl('/search.html');
write('404.html', build404());

AREAS.forEach((a) => {
  write(`area/${a.slug}.html`, buildAreaPage(a));
  addUrl(`/area/${a.slug}.html`);
});

TAGS.forEach((t) => {
  write(`tag/${t.slug}.html`, buildTagPage(t));
  addUrl(`/tag/${t.slug}.html`);
});

POSTS.forEach((p) => {
  write(`posts/${p.slug}.html`, buildPost(p));
  addUrl(`/posts/${p.slug}.html`, p.date);
});

write('feed.xml', buildFeed());
write('sitemap.xml', buildSitemap([...urls, { path: '/', lastmod: POSTS[0]?.date }]));
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
write('.nojekyll', '');

const searchIndex = POSTS.map((p) => ({
  title: p.title,
  subtitle: p.subtitle,
  url: `posts/${p.slug}.html`,
  date: p.date,
  year: p.year,
  summary: p.summary,
  area: p.area ? areaBySlug(p.area).name : '',
  tags: p.tags.map((t) => tagBySlug(t).name),
  draft: !p.featured,
  body: [p.headings.map((h) => h.text).join(' '), p.text].join(' ').slice(0, 900),
}));
write('assets/search-index.json', JSON.stringify(searchIndex, null, 0));

const drafts = POSTS.filter((p) => !p.featured).length;
console.log(`✓ 构建完成 → ${DIST}`);
console.log(`  文章 ${POSTS.length} 篇（完稿 ${POSTS.length - drafts} / 待写 ${drafts}）`);
console.log(`  页面 ${urls.length + 1} 个 · 方向 ${AREAS.length} · 标签 ${TAGS.length}`);
console.log(`  年份 ${[...new Set(POSTS.map((p) => p.year))].sort().join(' / ')}`);
