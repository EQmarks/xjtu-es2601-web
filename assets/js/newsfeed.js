/* ============================================================
   宣传成果 · 政务官网信息流渲染
   数据源：assets/data/articles.json
   用法：<div class="newsfeed" data-feed="head|all|stat"></div>

   版式（政务官网风格）：
     data-feed="head" → 头条卡 + 平台统计条 + 折叠列表
     data-feed="all"  → 平台统计条 + 折叠列表
     data-feed="stat" → 只出平台统计条

   折叠：默认只显示前 FOLD 条，点「展开全部」再看其余，避免一次堆满。
   ============================================================ */
(function () {
  'use strict';

  var esc = Site.escapeHTML;
  var href = Site.safeHref;
  var FOLD = 6;   /* 默认展示条数 */

  /* ---------- 平台统计条 ---------- */
  function platformBarHTML(meta, arts) {
    var plats = (meta && meta.platforms) || [];
    if (!plats.length) {
      var by = {};
      arts.forEach(function (a) { by[a.source] = (by[a.source] || 0) + 1; });
      plats = Object.keys(by).map(function (k) { return { name: k, count: by[k] }; });
    }
    var chips = plats.filter(function (p) { return p.count > 0; }).map(function (p) {
      return '<span class="nf-plat" title="' + esc(p.level || '') + '">' +
        '<b>' + esc(p.name) + '</b><i>' + p.count + '</i></span>';
    }).join('');
    return '<div class="nf-plats">' +
      '<span class="nf-plats-hd">发布平台</span>' + chips +
      '<span class="nf-plats-total">共 <b>' + arts.length + '</b> 篇</span>' +
    '</div>';
  }

  /* ---------- 条目 ---------- */
  function listHTML(items, fold) {
    if (!items.length) return '';
    var lis = items.map(function (a) {
      return '<li>' +
        '<span class="nf-ch" data-ch="' + esc(a.chapter) + '">' + esc(a.chapter) + '</span>' +
        '<a class="nf-title" href="' + href(a.url) + '" target="_blank" rel="noopener" ' +
          'title="' + esc(a.title) + '">' + esc(a.title) + '</a>' +
        '<span class="nf-src">' + esc(a.source) + '</span>' +
        (a.date ? '<time>' + esc(a.date) + '</time>' : '<time class="is-empty">—</time>') +
      '</li>';
    }).join('');
    var cls = 'nf-list' + (fold && items.length > FOLD ? ' is-folded' : '');
    var more = (fold && items.length > FOLD)
      ? '<button class="nf-more" type="button" data-more="' + items.length + '">' +
        '展开全部 ' + items.length + ' 篇 ↓</button>'
      : '';
    return '<ul class="' + cls + '">' + lis + '</ul>' + more;
  }

  /* ---------- 头条卡 ---------- */
  function heroHTML(a) {
    if (!a) return '';
    return '<div class="nf-hero">' +
      '<a href="' + href(a.url) + '" target="_blank" rel="noopener">' +
        '<span class="nf-hero-ch">' + esc(a.chapter) + ' · ' + esc(a.source) + '</span>' +
        '<h4>' + esc(a.title) + '</h4>' +
        '<div class="nf-hero-meta">' +
          (a.platform ? esc(a.platform) + ' ｜ ' : '') + esc(a.source) +
          (a.date ? ' ｜ ' + esc(a.date) : '') +
        '</div>' +
      '</a>' +
    '</div>';
  }

  /* ---------- 统计（保留兼容） ---------- */
  function statHTML(arts) {
    var by = {};
    arts.forEach(function (a) { by[a.source] = (by[a.source] || 0) + 1; });
    var keys = Object.keys(by).sort(function (x, y) { return by[y] - by[x]; });
    var rows = keys.map(function (k) {
      return '<div class="nf-stat-row"><span title="' + esc(k) + '">' + esc(k) +
             '</span><b>' + by[k] + ' 篇</b></div>';
    }).join('');
    return '<div class="nf-stat">' +
      '<div class="nf-stat-hd">已发布推文统计</div>' + rows +
      '<div class="nf-stat-row total"><span>合计</span><b>' + arts.length + ' 篇</b></div>' +
    '</div>';
  }

  /* ---------- 折叠展开 ---------- */
  function bindMore(scope) {
    var btns = scope.querySelectorAll('[data-more]');
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var ul = btn.previousElementSibling;
        if (!ul) return;
        var folded = ul.classList.toggle('is-folded');
        btn.textContent = folded
          ? '展开全部 ' + btn.getAttribute('data-more') + ' 篇 ↓'
          : '收起 ↑';
      });
    });
  }

  function init() {
    var boxes = document.querySelectorAll('.newsfeed');
    if (!boxes.length) return;

    Site.loadJSON('assets/data/articles.json')
      .then(function (d) {
        var meta = d.meta || {};
        var arts = (d.articles || []).slice();
        var drafts = (d.drafts || []).slice();

        /* 头条：featured 优先，其次最近一条 */
        var head = arts.filter(function (a) { return a.featured; })[0] || arts[0];

        document.querySelectorAll('[data-count-articles]').forEach(function (el) {
          el.textContent = arts.length;
        });
        document.querySelectorAll('[data-article-status]').forEach(function (el) {
          var plats = (meta.platforms || []).filter(function (p) { return p.count > 0; }).length;
          el.textContent = plats + ' 个平台 · ' + arts.length + ' 篇报道';
        });

        var metaEl = document.querySelector('[data-article-meta]');
        if (metaEl) {
          var plats = (meta.platforms || []).filter(function (p) { return p.count > 0; });
          metaEl.textContent = '共 ' + arts.length + ' 篇 · ' + plats.length + ' 个平台';
        }

        boxes.forEach(function (box) {
          var mode = box.getAttribute('data-feed') || 'all';
          var bar = platformBarHTML(meta, arts);
          if (mode === 'stat') {
            box.innerHTML = bar;
          } else if (mode === 'head') {
            box.innerHTML = heroHTML(head) + bar + listHTML(arts, true) + statHTML(arts);
          } else {
            box.innerHTML = bar + listHTML(arts, true) + statHTML(arts);
          }
          bindMore(box);
        });
      })
      .catch(function (e) {
        console.warn('[newsfeed] 加载失败：', e);
        boxes.forEach(function (b) {
          b.innerHTML = '<p class="nf-err">' + esc(Site.loadError('推文数据')) + '</p>';
        });
      });
  }

  Site.ready(init);
})();
