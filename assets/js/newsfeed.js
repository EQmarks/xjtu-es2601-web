/* ============================================================
   宣传成果 · 政务官网信息流渲染
   数据源：assets/data/articles.json
   用法：<div class="newsfeed" data-feed="head|all|stat"></div>

   版式（政务官网风格）：
     data-feed="head" → 顶部一条头条卡 + 整宽单列信息流 + 影响力统计
     data-feed="all"  → 整宽单列信息流 + 影响力统计
     data-feed="stat" → 只出影响力统计
   ============================================================ */
(function () {
  'use strict';

  var esc = Site.escapeHTML;
  var href = Site.safeHref;

  function listHTML(items) {
    if (!items.length) return '';
    return '<ul class="nf-list">' + items.map(function (a) {
      return '<li>' +
        '<span class="nf-ch" data-ch="' + esc(a.chapter) + '">' + esc(a.chapter) + '</span>' +
        '<a class="nf-title" href="' + href(a.url) + '" target="_blank" rel="noopener" ' +
          'title="' + esc(a.title) + '">' + esc(a.title) + '</a>' +
        '<span class="nf-src">' + esc(a.source) + '</span>' +
        '<time>' + esc(a.date) + '</time>' +
      '</li>';
    }).join('') + '</ul>';
  }

  /* 头条：横向卡片（宽度不足时自动堆叠，不会压成窄柱） */
  function heroHTML(a) {
    if (!a) return '';
    return '<div class="nf-hero">' +
      '<a href="' + href(a.url) + '" target="_blank" rel="noopener">' +
        '<span class="nf-hero-ch">' + esc(a.chapter) + ' · ' + esc(a.platform) + '</span>' +
        '<h4>' + esc(a.title) + '</h4>' +
        '<div class="nf-hero-meta">' + esc(a.date) + ' ｜ ' + esc(a.source) + '</div>' +
      '</a>' +
    '</div>';
  }

  /* 已成稿、待发布的推文（无链接，显示为纯文本 + 待发标记） */
  function draftListHTML(drafts) {
    if (!drafts || !drafts.length) return '';
    return '<div class="nf-drafts">' +
      '<div class="nf-drafts-hd">已成稿 · 待发布<span>' + drafts.length + ' 篇</span></div>' +
      '<ul class="nf-list">' +
      drafts.map(function (a) {
        return '<li class="is-draft">' +
          '<span class="nf-ch" data-ch="' + esc(a.chapter) + '">' + esc(a.chapter) + '</span>' +
          '<span class="nf-title" title="' + esc(a.title) + '">' + esc(a.title) + '</span>' +
          '<span class="nf-draft-tag">待发布</span>' +
          '<span class="nf-src">已成稿</span>' +
          '<time>' + esc(a.date) + '</time>' +
        '</li>';
      }).join('') +
      '</ul></div>';
  }

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

  function init() {
    var boxes = document.querySelectorAll('.newsfeed');
    if (!boxes.length) return;

    Site.loadJSON('assets/data/articles.json')
      .then(function (d) {
        var arts = (d.articles || []).slice().sort(function (a, b) {
          return String(b.date || '').localeCompare(String(a.date || ''));
        });
        var head = arts.filter(function (a) { return a.featured; })[0] || arts[0];
        var drafts = (d.drafts || []).slice().sort(function (a, b) {
          return String(b.date || '').localeCompare(String(a.date || ''));
        });

        document.querySelectorAll('[data-count-articles]').forEach(function (el) {
          el.textContent = arts.length + drafts.length;
        });
        document.querySelectorAll('[data-article-status]').forEach(function (el) {
          el.textContent = '已发布 ' + arts.length + ' 篇 · 待发布 ' + drafts.length + ' 篇';
        });

        /* 表头统计文案自动填 */
        var metaEl = document.querySelector('[data-article-meta]');
        if (metaEl) {
          var srcCnt = {};
          arts.forEach(function (a) { srcCnt[a.source] = (srcCnt[a.source] || 0) + 1; });
          var srcTxt = Object.keys(srcCnt)
            .sort(function (x, y) { return srcCnt[y] - srcCnt[x]; })
            .map(function (k) { return k + ' ' + srcCnt[k] + ' 篇'; })
            .join(' · ');
          metaEl.textContent = '已发布 ' + arts.length + ' 篇 · 已成稿待发布 ' + drafts.length + ' 篇（' + srcTxt + '）';
        }

        boxes.forEach(function (box) {
          var mode = box.getAttribute('data-feed') || 'all';
          if (mode === 'stat') {
            box.innerHTML = statHTML(arts);
          } else if (mode === 'head') {
            /* 头条 + 其余条目按时间排列 */
            var rest = arts.filter(function (a) { return a !== head; });
            box.innerHTML = heroHTML(head) + listHTML(head ? [head].concat(rest) : []) +
                            draftListHTML(drafts) + statHTML(arts);
          } else {
            box.innerHTML = listHTML(arts) + draftListHTML(drafts) + statHTML(arts);
          }
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
