// 静态站点生成器：读 content/posts/*.md，输出 dist/ 下的完整站点。
// 零依赖，直接用 node scripts/build.mjs 运行。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderMarkdown,
  parseFrontMatter,
  escapeHtml,
  estimateMinutes,
  stripMarkdown,
} from './lib/markdown.mjs';
import { SITE, ACTS, THREADS, TAGS, tagBySlug, threadBySlug, actByYear } from '../site.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const SITE_DIR = path.join(ROOT, 'site');
const DIST = path.join(ROOT, 'dist');

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
      tags: Array.isArray(data.tags) ? data.tags.filter((t) => tagBySlug(t)) : [],
      thread: threadBySlug(data.thread) ? data.thread : '',
      summary: String(data.summary || ''),
      featured,
      html: rendered.html,
      headings: featured ? rendered.headings.filter((h) => h.level === 2 || h.level === 3) : [],
      text: stripMarkdown(body),
      minutes: estimateMinutes(body),
    };
  });
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

const POSTS = loadPosts();
const byYear = (year) => POSTS.filter((p) => p.year === year);
const byThread = (slug) => POSTS.filter((p) => p.thread === slug);
const byTag = (slug) => POSTS.filter((p) => p.tags.includes(slug));

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y} 年 ${m} 月 ${d} 日`;
};

/* ------------------------------------------------------------------ */
/* 页面骨架                                                            */
/* ------------------------------------------------------------------ */

const header = (rel, active) => `
<a class="skip-link" href="#main">跳到正文</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${rel}index.html">
      <span class="brand-mark">${SITE.name}</span>
      <span class="brand-sub">四年 · 技术与哲学</span>
    </a>
    <nav class="site-nav" aria-label="主导航">
      ${SITE.nav
        .map((n) => {
          const href = rel + n.href.replace(/^\//, '');
          const current = active === n.label ? ' aria-current="page"' : '';
          return `<a href="${href}"${current}>${n.label}</a>`;
        })
        .join('\n      ')}
    </nav>
    <button class="theme-toggle" type="button" aria-label="切换深浅色主题" title="切换主题">
      <span class="theme-toggle-icon"></span>
    </button>
  </div>
  <div class="reading-progress" aria-hidden="true"></div>
</header>`;

const footer = (rel) => `
<footer class="site-footer">
  <div class="wrap footer-inner">
    <p class="footer-brand">${SITE.name}</p>
    <p class="footer-line">${SITE.tagline}</p>
    <p class="footer-meta">
      <span>© ${ACTS[0].year}–${ACTS[ACTS.length - 1].year} ${SITE.author}</span>
      <span class="dot">·</span>
      <a href="${rel}feed.xml">RSS</a>
      <span class="dot">·</span>
      <a href="${rel}archive.html">全部文章</a>
    </p>
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
<main id="main" class="wrap">
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

const draftBadge = (p) => (p.featured ? '' : '<span class="badge badge-draft">待写</span>');

const postCard = (p, rel = '') => `
<li class="post-item${p.featured ? '' : ' is-draft'}">
  <a class="post-item-link" href="${rel}posts/${p.slug}.html">
    <time datetime="${p.date}" class="post-item-date">${p.date}</time>
    <div class="post-item-main">
      <h3 class="post-item-title">${escapeHtml(p.title)} ${draftBadge(p)}</h3>
      ${p.subtitle ? `<p class="post-item-sub">${escapeHtml(p.subtitle)}</p>` : ''}
      <p class="post-item-summary">${escapeHtml(p.summary)}</p>
      <div class="post-item-foot">
        ${
          p.thread
            ? `<span class="mini-thread">${escapeHtml(threadBySlug(p.thread).name)}</span>`
            : ''
        }
        ${p.tags
          .map((t) => `<span class="mini-tag">${escapeHtml(tagBySlug(t).name)}</span>`)
          .join('')}
        ${p.featured ? `<span class="mini-read">约 ${p.minutes} 分钟</span>` : ''}
      </div>
    </div>
  </a>
</li>`;

const threadCard = (t, rel = '') => `
<a class="thread-card" href="${rel}thread/${t.slug}.html">
  <span class="thread-card-en">${escapeHtml(t.english)}</span>
  <span class="thread-card-name">${escapeHtml(t.name)}</span>
  <span class="thread-card-desc">${escapeHtml(t.desc)}</span>
  <span class="thread-card-count">${byThread(t.slug).length} 篇</span>
</a>`;

/* ------------------------------------------------------------------ */
/* 首页                                                                */
/* ------------------------------------------------------------------ */

function buildIndex() {
  const latest = POSTS.slice(0, 3);
  const featuredCount = POSTS.filter((p) => p.featured).length;

  const acts = ACTS.map((a) => {
    const list = byYear(a.year);
    const ratio = Math.min(100, Math.round((list.length / SITE.postsPerYear) * 100));
    const first = list[list.length - 1];
    return `
  <a class="act-card" href="archive.html#y${a.year}">
    <div class="act-card-head">
      <span class="act-card-act">${a.act}</span>
      <span class="act-card-year">${a.year}</span>
    </div>
    <h3 class="act-card-title">${escapeHtml(a.title)}</h3>
    <p class="act-card-line">${escapeHtml(a.line)}</p>
    <div class="act-card-bar"><span style="width:${ratio}%"></span></div>
    <p class="act-card-meta">${list.length} 篇${first ? ` · 起于 ${first.date}` : ''}</p>
  </a>`;
  }).join('');

  const content = `
<section class="hero">
  <p class="hero-eyebrow">一个工程师的四年笔记</p>
  <h1 class="hero-title">${SITE.name}</h1>
  <p class="hero-tagline">${escapeHtml(SITE.tagline)}</p>
  <p class="hero-desc">${escapeHtml(SITE.description)}</p>
  <div class="hero-stats">
    <span><strong>${POSTS.length}</strong> 篇文章</span>
    <span><strong>${ACTS.length}</strong> 个阶段</span>
    <span><strong>${THREADS.length}</strong> 条脉络</span>
    <span><strong>${featuredCount}</strong> 篇已完稿</span>
  </div>
</section>

<section class="section">
  <div class="section-head">
    <h2>四年演化弧</h2>
    <p>从“把代码写好”，到“为什么做这件事”</p>
  </div>
  <div class="act-grid">${acts}</div>
</section>

<section class="section">
  <div class="section-head">
    <h2>最新三篇</h2>
    <a class="section-more" href="archive.html">全部文章 →</a>
  </div>
  <ul class="post-list">${latest.map((p) => postCard(p)).join('')}</ul>
</section>

<section class="section">
  <div class="section-head">
    <h2>六条思想脉络</h2>
    <p>文章按脉络成串，可以顺着一条线往下读</p>
  </div>
  <div class="thread-grid">${THREADS.map((t) => threadCard(t)).join('')}</div>
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
    .map((year) => {
      const act = actByYear(year);
      const list = byYear(year);
      const ratio = Math.min(100, Math.round((list.length / SITE.postsPerYear) * 100));
      return `
  <section class="year-block" id="y${year}">
    <div class="year-head">
      <div class="year-head-left">
        <span class="year-num">${year}</span>
        <span class="year-act">${act ? `${act.act} · ${escapeHtml(act.title)}` : ''}</span>
      </div>
      <div class="year-progress" title="${list.length} / ${SITE.postsPerYear} 篇">
        <span style="width:${ratio}%"></span>
      </div>
    </div>
    ${act ? `<p class="year-line">${escapeHtml(act.line)}</p>` : ''}
    <ul class="post-list">${list.map((p) => postCard(p)).join('')}</ul>
  </section>`;
    })
    .join('');

  const content = `
<section class="page-head">
  <h1>归档</h1>
  <p>${POSTS.length} 篇文章，按年份倒序。带“待写”标记的是已定题、正文还在写作中的篇目。</p>
</section>
${sections}
`;

  return layout({ title: `归档 · ${SITE.name}`, content, active: '归档' });
}

/* ------------------------------------------------------------------ */
/* 主题页                                                              */
/* ------------------------------------------------------------------ */

function buildTags() {
  const groups = ['技术', '哲学', '成长'];
  const groupHtml = groups
    .map((g) => {
      const tags = TAGS.filter((t) => t.group === g);
      if (!tags.length) return '';
      return `
  <section class="section">
    <div class="section-head"><h2>${g}</h2></div>
    <div class="tag-grid">
      ${tags
        .map((t) => {
          const n = byTag(t.slug).length;
          return `
      <a class="tag-card" href="tag/${t.slug}.html">
        <span class="tag-card-name">${escapeHtml(t.name)}</span>
        <span class="tag-card-count">${n}</span>
        <span class="tag-card-desc">${escapeHtml(t.desc)}</span>
      </a>`;
        })
        .join('')}
    </div>
  </section>`;
    })
    .join('');

  const content = `
<section class="page-head">
  <h1>主题</h1>
  <p>一种横向的读法：六大思想脉络串起四年，标签则记录技术在具体处的落点。</p>
</section>
<section class="section">
  <div class="section-head"><h2>六大脉络</h2></div>
  <div class="thread-grid thread-grid-wide">${THREADS.map((t) => threadCard(t)).join('')}</div>
</section>
${groupHtml}
`;

  return layout({ title: `主题 · ${SITE.name}`, content, active: '主题' });
}

function buildTagPage(tag) {
  const list = byTag(tag.slug);
  const content = `
<section class="page-head">
  <p class="crumb"><a href="../tags.html">主题</a> / ${escapeHtml(tag.group)}</p>
  <h1>${escapeHtml(tag.name)}</h1>
  <p>${escapeHtml(tag.desc)}</p>
  <p class="page-head-meta">共 ${list.length} 篇</p>
</section>
<ul class="post-list">${list.map((p) => postCard(p, '../')).join('')}</ul>
`;
  return layout({
    title: `${tag.name} · ${SITE.name}`,
    description: tag.desc,
    content,
    rel: '../',
    active: '主题',
  });
}

function buildThreadPage(thread) {
  const list = byThread(thread.slug);
  const content = `
<section class="page-head">
  <p class="crumb"><a href="../tags.html">主题</a> / 脉络</p>
  <h1>${escapeHtml(thread.name)}</h1>
  <p class="page-head-en">${escapeHtml(thread.english)}</p>
  <p class="thread-lead">${escapeHtml(thread.desc)}</p>
  <p class="thread-sources">相关的思想资源：${thread.sources.map((s) => `<span>${escapeHtml(s)}</span>`).join('')}</p>
  <p class="page-head-meta">共 ${list.length} 篇</p>
</section>
<ul class="post-list">${list.map((p) => postCard(p, '../')).join('')}</ul>
`;
  return layout({
    title: `${thread.name} · ${SITE.name}`,
    description: thread.desc,
    content,
    rel: '../',
    active: '主题',
  });
}

/* ------------------------------------------------------------------ */
/* 文章页                                                              */
/* ------------------------------------------------------------------ */

function relatedPosts(post) {
  const sameThread = POSTS.filter((p) => p.slug !== post.slug && post.thread && p.thread === post.thread);
  const sameYear = POSTS.filter(
    (p) => p.slug !== post.slug && p.year === post.year && !sameThread.includes(p)
  );
  return [...sameThread, ...sameYear].slice(0, 3);
}

function buildPost(post) {
  const idx = POSTS.findIndex((p) => p.slug === post.slug);
  const newer = POSTS[idx - 1]; // 数组按时间倒序
  const older = POSTS[idx + 1];
  const act = actByYear(post.year);
  const thread = post.thread ? threadBySlug(post.thread) : null;

  const toc =
    post.headings.length >= 3
      ? `
  <aside class="toc" aria-label="目录">
    <p class="toc-title">目录</p>
    <ul>
      ${post.headings
        .map(
          (h) =>
            `<li class="toc-l${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`
        )
        .join('')}
    </ul>
  </aside>`
      : '';

  const draftNote = post.featured
    ? ''
    : `<p class="draft-note">这篇还处在“定题 + 摘要”阶段，正文仍在写作中。下面是它要处理的问题。</p>`;

  const related = relatedPosts(post);

  const content = `
<article class="post">
  <div class="post-inner">
  <header class="post-head">
    <div class="post-kicker">
      ${act ? `<span class="badge badge-act">${act.act} · ${escapeHtml(act.title)}</span>` : ''}
      ${
        thread
          ? `<a class="badge badge-thread" href="../thread/${thread.slug}.html">脉络 · ${escapeHtml(thread.name)}</a>`
          : ''
      }
      ${draftNote ? '<span class="badge badge-draft">待写</span>' : ''}
    </div>
    <h1 class="post-title">${escapeHtml(post.title)}</h1>
    ${post.subtitle ? `<p class="post-subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
    <div class="post-meta">
      <time datetime="${post.date}">${fmtDate(post.date)}</time>
      ${post.featured ? `<span class="dot">·</span><span>约 ${post.minutes} 分钟</span>` : ''}
      <span class="dot">·</span>
      <span class="post-meta-tags">
        ${post.tags
          .map((t) => `<a href="../tag/${t}.html">${escapeHtml(tagBySlug(t).name)}</a>`)
          .join('')}
      </span>
    </div>
  </header>

  <div class="post-layout">
    <div class="post-body">
      ${draftNote}
      ${post.html}
    </div>
    ${toc}
  </div>

  ${
    thread
      ? `
  <aside class="thread-callout">
    <p class="thread-callout-label">这条脉络</p>
    <p class="thread-callout-name">${escapeHtml(thread.name)}</p>
    <p class="thread-callout-desc">${escapeHtml(thread.desc)}</p>
    <a class="thread-callout-link" href="../thread/${thread.slug}.html">顺着这条线读下去 →</a>
  </aside>`
      : ''
  }

  <nav class="post-nav" aria-label="文章导航">
    <div class="post-nav-item">
      ${newer ? `<span class="post-nav-label">更新的一篇</span><a href="${newer.slug}.html">${escapeHtml(newer.title)}</a>` : '<span class="post-nav-label">这是最新的一篇</span>'}
    </div>
    <div class="post-nav-item">
      ${older ? `<span class="post-nav-label">更早的一篇</span><a href="${older.slug}.html">${escapeHtml(older.title)}</a>` : '<span class="post-nav-label">这是最早的一篇</span>'}
    </div>
  </nav>
  </div>
</article>

${
  related.length
    ? `
<section class="section related">
  <div class="section-head"><h2>接着读</h2></div>
  <ul class="post-list">${related.map((p) => postCard(p, '../')).join('')}</ul>
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

function growthChart() {
  const w = 680;
  const h = 240;
  const x = (i) => 70 + i * 180;
  const y = (v) => 210 - v * 2;
  const engineering = [85, 78, 62, 55];
  const philosophy = [15, 32, 58, 88];
  const line = (values, cls) =>
    `<polyline class="chart-line ${cls}" points="${values
      .map((v, i) => `${x(i)},${y(v)}`)
      .join(' ')}" />`;
  const dots = (values, cls) =>
    values.map((v, i) => `<circle class="chart-dot ${cls}" cx="${x(i)}" cy="${y(v)}" r="4" />`).join('');

  return `
<figure class="chart">
  <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="四年里工程与哲学两条关注线的变化">
    <g class="chart-grid">
      ${[10, 60, 110, 160, 210].map((gy) => `<line x1="40" y1="${gy}" x2="${w - 20}" y2="${gy}" />`).join('')}
    </g>
    ${ACTS.map(
      (a, i) =>
        `<text class="chart-year" x="${x(i)}" y="232" text-anchor="middle">${a.year}</text>`
    ).join('')}
    ${line(engineering, 'is-eng')}
    ${line(philosophy, 'is-phil')}
    ${dots(engineering, 'is-eng')}
    ${dots(philosophy, 'is-phil')}
  </svg>
  <figcaption>
    <span class="legend legend-eng">写代码的浓度</span>
    <span class="legend legend-phil">追问“为什么”的浓度</span>
  </figcaption>
</figure>`;
}

function buildAbout() {
  const acts = ACTS.map(
    (a) => `
  <li class="timeline-item">
    <span class="timeline-year">${a.year}</span>
    <div class="timeline-body">
      <h3>${a.act} · ${escapeHtml(a.title)}</h3>
      <p class="timeline-line">${escapeHtml(a.line)}</p>
      <p>${escapeHtml(a.note)}</p>
    </div>
  </li>`
  ).join('');

  const content = `
<section class="page-head">
  <h1>关于</h1>
  <p class="page-head-en">${SITE.name} · 四年 · 技术与哲学</p>
</section>

<section class="section prose">
  <p>这个站点是我给自己做的四年盘点：从 ${ACTS[0].year} 年开始，每年十篇左右，写软件工程里那些真正费过脑子的地方，也写它们后来怎么把我推向了哲学。</p>
  <p>我原本以为这是一条技术成长路径——从写脚本到写服务，从写服务到设计系统。写到第三年才发现，真正在变的是问题本身：一开始问“这个怎么实现”，后来问“这个该不该存在”，最后问“我为什么要做技术”。</p>
  <p>所以这里的文章有两种读法。按年份读是一份成长记录；按脉络读，是六条被反复绕回来的问题线。哪条都不是主线——它们互为背景。</p>
</section>

<section class="section">
  <div class="section-head"><h2>成长曲线</h2></div>
  ${growthChart()}
</section>

<section class="section">
  <div class="section-head"><h2>四年时间线</h2></div>
  <ul class="timeline">${acts}</ul>
</section>

<section class="section">
  <div class="section-head"><h2>我在读什么</h2></div>
  <div class="reading-grid">
    ${[
      ['技术的本质', '布莱恩·阿瑟', '把技术当作一个自我繁殖的系统来读，很多工程直觉会突然有出处。'],
      ['技术与时间', '贝尔纳·斯蒂格勒', '关于“技术物”最难但最值得的一本，读到一半会想重写自己所有的架构文档。'],
      ['庄子', '—', '庖丁解牛是我读过最好的关于“熟练”的段落，比任何一篇讲心流的文章都准。'],
      ['倦怠社会', '韩炳哲', '短小锋利，用来解释为什么功能越加越多、人越做越累。'],
      ['传习录', '王阳明', '知行合一不是口号，是对“懂了但没做”这种状态的精确诊断。'],
      ['人月神话', '布鲁克斯', '每年重读一次，每年都被打中一次。'],
    ]
      .map(
        ([t, a, note]) => `
    <div class="reading-item">
      <p class="reading-title">${escapeHtml(t)}</p>
      <p class="reading-author">${escapeHtml(a)}</p>
      <p class="reading-note">${escapeHtml(note)}</p>
    </div>`
      )
      .join('')}
  </div>
</section>

<section class="section">
  <div class="section-head">
    <h2>怎么读这个站</h2>
  </div>
  <div class="prose">
    <ul>
      <li><strong>想快速了解全貌</strong>：从「<a href="archive.html">归档</a>」页按年份扫一遍标题和摘要。</li>
      <li><strong>带着问题来</strong>：去「<a href="tags.html">主题</a>」页选一条脉络，顺着读到底。</li>
      <li><strong>想看完整的思考</strong>：标了“待写”的是只有摘要的规划篇目，其余是已完稿的正文。</li>
    </ul>
  </div>
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
  <p>全文检索，完全在你的浏览器里完成。可以搜标题、摘要、标签，也可以搜正文里的词。</p>
</section>
<section class="section">
  <div class="search-box">
    <input id="search-input" type="search" placeholder="试试搜「复杂度」「注意力」「海德格尔」…" autocomplete="off" aria-label="搜索文章">
  </div>
  <p class="search-status" id="search-status" aria-live="polite"></p>
  <ul class="post-list" id="search-results"></ul>
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
<section class="page-head">
  <h1>404</h1>
  <p>这个地址上没有东西。也许是链接写错了，也许是那篇文章还没被写出来。</p>
  <p class="page-head-meta"><a href="index.html">回到首页</a> · <a href="archive.html">看看归档</a></p>
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

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

copyDir(SITE_DIR, DIST);

const urls = [];
const addUrl = (p, lastmod) => urls.push({ path: p, lastmod });

write('index.html', buildIndex());
addUrl('/index.html');
write('archive.html', buildArchive());
addUrl('/archive.html');
write('tags.html', buildTags());
addUrl('/tags.html');
write('about.html', buildAbout());
addUrl('/about.html');
write('search.html', buildSearch());
addUrl('/search.html');
write('404.html', build404());

TAGS.forEach((t) => {
  write(`tag/${t.slug}.html`, buildTagPage(t));
  addUrl(`/tag/${t.slug}.html`);
});

THREADS.forEach((t) => {
  write(`thread/${t.slug}.html`, buildThreadPage(t));
  addUrl(`/thread/${t.slug}.html`);
});

POSTS.forEach((p) => {
  write(`posts/${p.slug}.html`, buildPost(p));
  addUrl(`/posts/${p.slug}.html`, p.date);
});

write('feed.xml', buildFeed());
write('sitemap.xml', buildSitemap([...urls, { path: '/', lastmod: POSTS[0]?.date }]));
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
write('.nojekyll', '');

// 前端搜索用的索引
const searchIndex = POSTS.map((p) => ({
  title: p.title,
  subtitle: p.subtitle,
  url: `posts/${p.slug}.html`,
  date: p.date,
  year: p.year,
  summary: p.summary,
  tags: p.tags.map((t) => tagBySlug(t).name),
  thread: p.thread ? threadBySlug(p.thread).name : '',
  draft: !p.featured,
  body: [p.headings.map((h) => h.text).join(' '), p.text].join(' ').slice(0, 900),
}));
write('assets/search-index.json', JSON.stringify(searchIndex, null, 0));

const drafts = POSTS.filter((p) => !p.featured).length;
console.log(`✓ 构建完成 → ${DIST}`);
console.log(`  文章 ${POSTS.length} 篇（完稿 ${POSTS.length - drafts} / 待写 ${drafts}）`);
console.log(`  页面 ${urls.length + 1} 个 · 标签 ${TAGS.length} · 脉络 ${THREADS.length}`);
console.log(`  年份 ${[...new Set(POSTS.map((p) => p.year))].sort().join(' / ')}`);
