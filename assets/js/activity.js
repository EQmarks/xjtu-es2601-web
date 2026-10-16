/* 活动详情页 · 按 ?id= 渲染 */
(function () {
  'use strict';
  function q(k) {
    var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  var id = q('id');
  fetch('assets/data/activities.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var all = d.activities || [];
      var a = all.filter(function (x) { return x.id === id; })[0];
      var root = document.getElementById('act-root');
      if (!a) {
        root.innerHTML = '<div class="notice">未找到该活动。' +
          '<a href="index.html">返回首页</a></div>';
        return;
      }
      document.title = a.title + '｜储能2601 团支部';
      var chs = (d.meta && d.meta.chapters) || {};
      var color = (chs[a.ch] && chs[a.ch].color) || 'var(--brand)';
      var planned = a.status === 'planned';
      var pills = (a.tags || []).map(function (t) {
        return '<span class="pill">' + esc(t) + '</span>';
      }).join('');
      var h = '';
      h += '<div class="crumb"><div class="wrap"><a href="index.html">首页</a> &nbsp;›&nbsp; ' +
           '<a href="' + ({'聚能':'jn','蓄势':'xs','传热':'cr','释能':'sn'}[a.ch] || 'index') + '.html">' +
           esc(a.ch) + '</a> &nbsp;›&nbsp; <b>' + esc(a.title) + '</b></div></div>';
      h += '<header class="act-hero" style="--c:' + color + '"><div class="wrap">' +
           '<span class="act-hero-ch">' + esc(a.ch) + ' · ' + esc(a.main) + '</span>' +
           (planned ? '<span class="act-hero-badge">计划中 / 未举办</span>' : '') +
           '<h1>' + esc(a.title) + '</h1>' +
           '<div class="act-hero-meta">' + esc(a.when || '') + '</div>' +
           '<div class="act-hero-tags">' + pills + '</div></div></header>';
      h += '<section class="sec"><div class="wrap">';
      h += '<div class="act-body"><h2>活动介绍</h2><p>' + esc(a.desc) + '</p></div>';

      /* 策划案正文（后续填入） */
      h += '<div class="act-body"><h2>策划案</h2>';
      if (a.plan && a.plan.length) {
        h += a.plan.map(function (s) {
          return '<h4>' + esc(s.h) + '</h4><p>' + esc(s.p) + '</p>';
        }).join('');
      } else {
        h += '<div class="notice">策划案正文待补充。' +
             '支部各活动策划案（.docx / .pdf）整理完成后将在此呈现。</div>';
      }
      h += '</div>';

      /* 照片 */
      h += '<div class="act-body"><h2>现场照片';
      if (a.photos) h += '<span class="act-cnt">' + a.photos + ' 张</span>';
      h += '</h2>';
      if (a.gallery) {
        h += '<div class="gal" data-gallery="' + a.gallery + '"></div>';
      } else {
        h += '<div class="notice">该活动暂无照片素材。</div>';
      }
      h += '</div></div></section>';
      root.innerHTML = h;

      if (a.gallery && !document.querySelector('script[src="assets/js/gallery.js"]')) {
        var s = document.createElement('script');
        s.src = 'assets/js/gallery.js';
        document.body.appendChild(s);
      }
    })
    .catch(function (e) {
      document.getElementById('act-root').innerHTML =
        '<div class="notice">数据加载失败：' + esc(e.message) + '</div>';
    });
})();
