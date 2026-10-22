/* ============================================================
   活动详情页 · 推文形式
   数据源：assets/data/activities.json

   字段约定：
     title      标题
     when       时间（一行，简洁）
     lead       导语（推文开头，1—2 句）
     story      正文分节 [{h: 小标题, p: 段落}]
     summary    总结（一段或两段）
     insight    观后感（可选，字符串数组或 {text,by}）
     articleUrl 已发布推文链接（可选，置于正文之前）
     gallery    相册 key
   旧字段（desc / plan / count）保留兼容，但不再展示人数
   ============================================================ */
(function () {
  'use strict';

  var CH_PAGE = { '回望': 'jn', '自驱': 'xs', '携手': 'cr', '开物': 'sn' };
  var CH_LABEL = { '回望': '根', '自驱': '知', '携手': '行', '开物': '创' };

  var esc = Site.escapeHTML;
  var href = Site.safeHref;
  /* 段落里允许 **加粗** 与换行 */
  function fmt(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
  function paragraphs(s) {
    return String(s || '').split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return '<p>' + fmt(p.trim()) + '</p>'; }).join('');
  }

  var id = new URLSearchParams(location.search).get('id') || '';
  var root = document.getElementById('act-root');
  if (!root) return;

  Site.loadJSON('assets/data/activities.json')
    .then(function (d) {
      var all = d.activities || [];
      var a = all.filter(function (x) { return x.id === id; })[0];
      if (!a) {
        root.innerHTML = '<div class="notice">未找到该活动。<a href="index.html">返回首页</a></div>';
        return;
      }
      document.title = (a.headline ? a.headline + '：' : '') + a.title + '｜储能2601 团支部';

      var chs = (d.meta && d.meta.chapters) || {};
      var color = (chs[a.ch] && chs[a.ch].color) || 'var(--brand)';
      var planned = a.status === 'planned';
      var pills = (a.tags || []).map(function (t) {
        return '<span class="pill">' + esc(Site.tagLabel(t)) + '</span>';
      }).join('');

      /* ---- 兼容新旧字段 ---- */
      var lead = a.lead || a.desc || '';
      var story = a.story || a.plan || [];
      var summary = a.summary || '';
      var insight = a.insight || [];

      var h = '';

      /* 面包屑 */
      h += '<div class="crumb"><div class="wrap"><a href="index.html">首页</a> &nbsp;›&nbsp; ' +
           '<a href="' + (CH_PAGE[a.ch] || 'index') + '.html">' + esc(a.ch) + '</a>' +
           ' &nbsp;›&nbsp; <b>' + esc(a.title) + '</b></div></div>';

      /* 头图区 */
      h += '<header class="act-hero" style="--c:' + esc(color) + '"><div class="wrap">' +
           '<span class="act-hero-ch">' + esc(a.ch) + ' · ' + esc(a.main || CH_LABEL[a.ch] || '') + '</span>' +
           (planned ? '<span class="act-hero-badge">计划中</span>' : '') +
           '<h1>' + esc(a.headline || a.title) + '</h1>' +
           (a.headline ? '<div class="act-hero-sub">' + esc(a.title) + '</div>' : '') +
           '<div class="act-hero-meta">' + esc(Site.stripNote(a.when || '')) + '</div>' +
           '<div class="act-hero-tags">' + pills + '</div>' +
           '</div></header>';

      h += '<section class="sec"><div class="wrap">';

      /* ⭐ 推文链接（正文之前） */
      if (a.articleUrl) {
        h += '<div class="act-article">' +
             '<a class="act-article-btn" href="' + href(a.articleUrl) + '" target="_blank" rel="noopener">' +
             '<span class="act-article-ico">文</span>' +
             '<span class="act-article-txt"><b>阅读已发布推文</b>' +
             '<em>微信公众号原文</em></span>' +
             '<span class="act-article-arrow">→</span></a></div>';
      }

      /* 导语 */
      if (lead) {
        h += '<div class="act-lead">' + fmt(lead) + '</div>';
      }

      /* 正文分节 */
      h += '<div class="act-story">';
      if (story.length) {
        story.forEach(function (s) {
          if (s.h) h += '<h2>' + esc(s.h) + '</h2>';
          if (s.p) h += paragraphs(s.p);
        });
      } else {
        h += '<p>' + esc(a.desc || '内容待补充。') + '</p>';
      }
      h += '</div>';

      /* 总结 */
      if (summary) {
        h += '<div class="act-summary"><h2>总结</h2>' + paragraphs(summary) + '</div>';
      }

      /* 观后感 */
      if (insight && insight.length) {
        h += '<div class="act-insight"><h2>同学感言</h2>';
        insight.forEach(function (x) {
          if (typeof x === 'string') {
            h += '<blockquote>' + fmt(x) + '</blockquote>';
          } else {
            h += '<blockquote>' + fmt(x.text) +
                 (x.by ? '<cite>—— ' + esc(x.by) + '</cite>' : '') + '</blockquote>';
          }
        });
        h += '</div>';
      }

      /* 现场照片 */
      h += '<div class="act-photos"><h2>现场照片';
      if (a.photos) h += '<span class="act-cnt">' + a.photos + ' 张</span>';
      h += '</h2>';
      if (a.gallery) {
        h += '<div class="gal" data-gallery="' + esc(a.gallery) + '"></div>';
      } else {
        h += '<div class="notice">' + (planned ? '活动举办后补充现场照片。' : '暂无可公开的现场照片。') + '</div>';
      }
      h += '</div>';

      /* 上下篇导航 */
      var idx = all.indexOf(a);
      var prev = all[idx - 1], next = all[idx + 1];
      h += '<div class="act-nav">' +
           (prev ? '<a href="' + href(prev.href) + '"><em>上一篇</em><b>' + esc(prev.title) + '</b></a>' : '<span></span>') +
           (next ? '<a href="' + href(next.href) + '" style="text-align:right"><em>下一篇</em><b>' + esc(next.title) + '</b></a>' : '<span></span>') +
           '</div>';

      h += '</div></section>';
      root.innerHTML = h;

      if (a.gallery) SiteGallery.init(root);
    })
    .catch(function (e) {
      console.warn('[activity]', e);
      root.innerHTML = '<div class="notice">' + esc(Site.loadError('活动内容')) + '</div>';
    });
})();
