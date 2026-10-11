// 纯前端全文检索：加载一次索引，之后全部在本地完成。
(function () {
  'use strict';

  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var status = document.getElementById('search-status');
  if (!input || !results) return;

  var index = [];
  var ready = false;

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      if (t.length < 1) return;
      var safe = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(safe, 'gi'), function (m) {
        return '<mark class="search-hit">' + m + '</mark>';
      });
    });
    return out;
  }

  function score(item, terms) {
    var title = item.title.toLowerCase();
    var summary = item.summary.toLowerCase();
    var bodyText = item.body.toLowerCase();
    var tags = (item.tags.concat(item.thread ? [item.thread] : []).join(' ')).toLowerCase();
    var total = 0;
    var all = true;

    terms.forEach(function (t) {
      var hit = 0;
      if (title.indexOf(t) >= 0) hit += 12;
      if (tags.indexOf(t) >= 0) hit += 7;
      if (summary.indexOf(t) >= 0) hit += 4;
      if (bodyText.indexOf(t) >= 0) hit += 2;
      if (!hit) all = false;
      total += hit;
    });

    return all ? total : 0;
  }

  function render(terms) {
    if (!terms.length) {
      results.innerHTML = '';
      status.textContent = '共 ' + index.length + ' 篇可检索。输入关键词开始。';
      return;
    }

    var hits = index
      .map(function (item) {
        return { item: item, s: score(item, terms) };
      })
      .filter(function (h) {
        return h.s > 0;
      })
      .sort(function (a, b) {
        return b.s - a.s || (a.item.date < b.item.date ? 1 : -1);
      })
      .slice(0, 30);

    status.textContent = hits.length ? '找到 ' + hits.length + ' 篇' : '没有匹配的文章，换个词试试。';

    results.innerHTML = hits
      .map(function (h) {
        var p = h.item;
        return (
          '<li class="post-item' +
          (p.draft ? ' is-draft' : '') +
          '"><a class="post-item-link" href="' +
          p.url +
          '"><time class="post-item-date">' +
          p.date +
          '</time><div class="post-item-main"><h3 class="post-item-title">' +
          highlight(p.title, terms) +
          (p.draft ? ' <span class="badge badge-draft">待写</span>' : '') +
          '</h3>' +
          (p.subtitle ? '<p class="post-item-sub">' + escapeHtml(p.subtitle) + '</p>' : '') +
          '<p class="post-item-summary">' +
          highlight(p.summary, terms) +
          '</p><div class="post-item-foot">' +
          (p.thread ? '<span class="mini-thread">' + escapeHtml(p.thread) + '</span>' : '') +
          p.tags
            .map(function (t) {
              return '<span class="mini-tag">' + escapeHtml(t) + '</span>';
            })
            .join('') +
          '</div></div></a></li>'
        );
      })
      .join('');
  }

  input.addEventListener('input', function () {
    if (!ready) return;
    var q = input.value.trim().toLowerCase();
    if (q && history.replaceState) {
      history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname);
    }
    render(q.split(/\s+/).filter(Boolean));
  });

  var initial = new URLSearchParams(location.search).get('q') || '';
  if (initial) input.value = initial;
  status.textContent = '正在载入索引…';

  fetch('assets/search-index.json')
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      index = data.map(function (item) {
        return Object.assign({}, item, {
          title: item.title || '',
          summary: item.summary || '',
          body: item.body || '',
        });
      });
      ready = true;
      render(input.value.trim().toLowerCase().split(/\s+/).filter(Boolean));
      input.focus();
    })
    .catch(function () {
      status.textContent = '索引载入失败，请刷新页面重试。';
    });
})();
