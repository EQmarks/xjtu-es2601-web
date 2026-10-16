/* ============================================================
   宣传成果 · 政务官网信息流渲染
   数据源：assets/data/articles.json
   用法：<div class="newsfeed" data-feed="all"></div>
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtDate(d) {
    if (!d) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    return m ? (m[1] + '-' + m[2] + '-' + m[3]) : d;
  }

  /* 政务官网风格：左侧 ┃ 标题 + 右侧日期，底部虚线分隔 */
  function listHTML(items) {
    return '<ul class="nf-list">' + items.map(function (a) {
      return '<li>' +
        '<span class="nf-ch" data-ch="' + esc(a.chapter) + '">' + esc(a.chapter) + '</span>' +
        '<a class="nf-title" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
          esc(a.title) + '</a>' +
        '<span class="nf-src">' + esc(a.source) + '</span>' +
        '<time>' + fmtDate(a.date) + '</time>' +
      '</li>';
    }).join('') + '</ul>';
  }

  /* 头条区：左侧大图 + 右侧标题列表（政务首页经典版式） */
  function headHTML(featured, rest) {
    if (!featured.length) return listHTML(rest);
    var f = featured[0];
    return '' +
      '<div class="nf-head">' +
        '<div class="nf-hero">' +
          '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' +
            '<span class="nf-hero-ch">' + esc(f.chapter) + ' · ' + esc(f.platform) + '</span>' +
            '<h4>' + esc(f.title) + '</h4>' +
            '<div class="nf-hero-meta">' + fmtDate(f.date) + ' ｜ ' + esc(f.source) + '</div>' +
          '</a>' +
        '</div>' +
        '<div class="nf-side">' +
          listHTML(rest.slice(0, 5)) +
        '</div>' +
      '</div>';
  }

  function statHTML(arts) {
    var by = {};
    arts.forEach(function (a) { by[a.source] = (by[a.source] || 0) + 1; });
    var rows = Object.keys(by).map(function (k) {
      return '<div class="nf-stat-row"><span>' + esc(k) + '</span><b>' + by[k] + ' 篇</b></div>';
    }).join('');
    return '<div class="nf-stat">' +
      '<div class="nf-stat-hd">宣传影响力统计</div>' + rows +
      '<div class="nf-stat-row total"><span>合计</span><b>' + arts.length + ' 篇</b></div>' +
      '</div>';
  }

  function init() {
    var boxes = document.querySelectorAll('.newsfeed');
    if (!boxes.length) return;

    fetch('assets/data/articles.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var arts = (d.articles || []).slice().sort(function (a, b) {
          return (b.date || '').localeCompare(a.date || '');
        });
        var featured = arts.filter(function (a) { return a.featured; });
        var rest = arts.filter(function (a) { return !a.featured; });

        boxes.forEach(function (box) {
          var mode = box.getAttribute('data-feed') || 'all';
          if (mode === 'head') {
            box.innerHTML = headHTML(featured, rest.concat(featured.slice(1)));
          } else if (mode === 'stat') {
            box.innerHTML = statHTML(arts);
          } else {
            box.innerHTML = listHTML(arts) + statHTML(arts);
          }
        });
      })
      .catch(function (e) {
        console.warn('[newsfeed] 加载失败：', e);
        boxes.forEach(function (b) {
          b.innerHTML = '<p class="nf-err">推文数据加载失败：' + esc(e.message) + '</div>';
        });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
