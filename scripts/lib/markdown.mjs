// 极简 Markdown 渲染器：只覆盖博客正文需要的语法，零依赖。
// 支持：围栏代码块、标题(1-4)、分隔线、引用、有序/无序列表、表格、段落，
// 行内支持：行内代码、粗体、斜体、链接、图片。

const CJK = /[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef\u2018\u2019\u201c\u201d\u2014\u2026]/;

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 中英混排时，中文之间不该出现多余空格
function joinLines(lines) {
  let out = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!out) {
      out = line;
      continue;
    }
    const prev = out.slice(-1);
    const next = line.slice(0, 1);
    if (CJK.test(prev) && CJK.test(next)) out += line;
    else out += ' ' + line;
  }
  return out;
}

function slugify(s) {
  return (
    String(s)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '') || 'section'
  );
}

export function renderInline(raw) {
  let t = escapeHtml(raw);
  const codes = [];
  t = t.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000C${codes.length - 1}\u0000`;
  });
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  t = t.replace(/\[\[([^\]]+)\]\]/g, '<span class="inline-note">$1</span>');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  t = t.replace(/\u0000C(\d+)\u0000/g, (_, n) => `<code>${codes[Number(n)]}</code>`);
  return t;
}

const isFence = (l) => /^```/.test(l);
const isHeading = (l) => /^#{1,4}\s+\S/.test(l);
const isQuote = (l) => /^>\s?/.test(l);
const isUl = (l) => /^\s*[-*+]\s+/.test(l);
const isOl = (l) => /^\s*\d+[.)]\s+/.test(l);
const isHr = (l) => /^(?:\*\s*){3,}$/.test(l.trim()) || /^-{3,}$/.test(l.trim()) || /^_{3,}$/.test(l.trim());
const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);

function isBlockStart(lines, i) {
  const l = lines[i];
  if (!l || !l.trim()) return true;
  if (isFence(l) || isHeading(l) || isQuote(l) || isUl(l) || isOl(l) || isHr(l)) return true;
  if (isTableRow(l) && isTableSep(lines[i + 1] || '')) return true;
  return false;
}

export function renderMarkdown(src) {
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  const headings = [];
  const idCount = new Map();
  let i = 0;

  const uniqueId = (base) => {
    const n = idCount.get(base) || 0;
    idCount.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    // 围栏代码块
    if (isFence(line)) {
      const lang = (line.match(/^```\s*([\w+#.-]*)\s*$/) || [])[1] || '';
      const buf = [];
      i++;
      while (i < lines.length && !isFence(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // 跳过收尾的 ```
      const cls = lang ? ` class="language-${lang}"` : '';
      const label = lang ? `<figcaption>${escapeHtml(lang)}</figcaption>` : '';
      html.push(
        `<figure class="code-block">${label}<pre><code${cls}>${escapeHtml(buf.join('\n'))}</code></pre></figure>`
      );
      continue;
    }

    // 标题
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = uniqueId(slugify(text));
      headings.push({ level, text, id });
      html.push(
        `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${renderInline(text)}</h${level}>`
      );
      i++;
      continue;
    }

    // 分隔线（表格分隔行由表格分支处理，这里只认裸的 --- *** ___）
    if (isHr(line) && !line.includes('|')) {
      html.push('<hr>');
      i++;
      continue;
    }

    // 表格
    if (isTableRow(line) && isTableSep(lines[i + 1] || '')) {
      const cells = (l) =>
        l
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((s) => s.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(cells(lines[i]));
        i++;
      }
      html.push(
        '<div class="table-wrap"><table><thead><tr>' +
          head.map((c) => `<th>${renderInline(c)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows
            .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
            .join('') +
          '</tbody></table></div>'
      );
      continue;
    }

    // 引用块（递归解析内部内容）
    if (isQuote(line)) {
      const buf = [];
      while (i < lines.length && (isQuote(lines[i]) || (buf.length && lines[i].trim() && !isBlockStart(lines, i)))) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const inner = renderMarkdown(buf.join('\n'));
      html.push(`<blockquote>${inner.html}</blockquote>`);
      continue;
    }

    // 无序列表
    if (isUl(line)) {
      const items = [];
      while (i < lines.length && isUl(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      html.push(`<ul>${items.map((t) => `<li>${renderInline(t)}</li>`).join('')}</ul>`);
      continue;
    }

    // 有序列表
    if (isOl(line)) {
      const items = [];
      while (i < lines.length && isOl(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
        i++;
      }
      html.push(`<ol>${items.map((t) => `<li>${renderInline(t)}</li>`).join('')}</ol>`);
      continue;
    }

    // 段落：吃到空行或下一个块的开头
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines, i)) {
      buf.push(lines[i]);
      i++;
    }
    html.push(`<p>${renderInline(joinLines(buf))}</p>`);
  }

  return { html: html.join('\n'), headings };
}

// 解析 front matter（只支持 key: value 与 key: [a, b] 两种）
export function parseFrontMatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text };

  const data = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();
    if (/^\[.*\]$/.test(value)) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^["'“”]|["'“”]$/g, '').trim();
      data[key] = /^(true|false)$/i.test(value) ? value.toLowerCase() === 'true' : value;
    }
  }
  return { data, body: text.slice(m[0].length) };
}

// 中文按字计、英文按词计，取 350 字/分钟 与 200 词/分钟 的较大者
export function estimateMinutes(text) {
  const plain = String(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*`|_-]/g, '');
  const cjk = (plain.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (plain.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
  return Math.max(1, Math.round(cjk / 350 + words / 200));
}

export function stripMarkdown(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
