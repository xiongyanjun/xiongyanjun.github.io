// 主题切换 / 阅读进度 / 目录高亮
(function () {
  'use strict';

  /* 支持 ?theme=dark / ?theme=light 强制指定主题（便于分享与排查） */
  var forced = new URLSearchParams(location.search).get('theme');
  if (forced === 'dark' || forced === 'light') {
    document.documentElement.dataset.theme = forced;
    try {
      localStorage.setItem('theme', forced);
    } catch (e) {}
  }

  /* 主题：默认跟随系统，手动切换后写入 localStorage */
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current =
        document.documentElement.dataset.theme ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
    });
  }

  /* 阅读进度：只在文章正文存在时生效 */
  var bar = document.querySelector('.reading-progress');
  var body = document.querySelector('.post-body');
  if (bar && body) {
    var update = function () {
      var rect = body.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var passed = -rect.top;
      var ratio = total > 0 ? Math.min(1, Math.max(0, passed / total)) : 0;
      bar.style.width = (ratio * 100).toFixed(2) + '%';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* 目录高亮：滚动到哪个小节就点亮对应条目 */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = new Map();
    tocLinks.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute('href').slice(1));
      var heading = document.getElementById(id);
      if (heading) map.set(heading, link);
    });

    var setActive = function (heading) {
      tocLinks.forEach(function (l) {
        l.classList.remove('is-active');
      });
      var link = map.get(heading);
      if (link) link.classList.add('is-active');
    };

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (e) {
            return e.isIntersecting;
          })
          .sort(function (a, b) {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });
        if (visible.length) setActive(visible[0].target);
      },
      { rootMargin: '-90px 0px -70% 0px', threshold: 0 }
    );

    map.forEach(function (_link, heading) {
      observer.observe(heading);
    });
  }
})();
