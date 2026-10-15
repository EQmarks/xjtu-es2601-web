/* ============================================================
   活动卡片 · 数据驱动渲染
   读取 assets/data/activities.json，按 data-chapter 过滤渲染
   容器：<div class="acts" data-chapter="聚能"></div>
   ============================================================ */
(function () {
  'use strict';

  var PILL_CLASS = function (t) {
    if (t.indexOf('选做') === 0) return 'pill gold';
    if (t.indexOf('待定') === 0) return 'pill grey';
    return 'pill';
  };

  function cardHTML(a, color) {
    var pills = (a.tags || []).map(function (t) {
      return '<span class="' + PILL_CLASS(t) + '">' + t + '</span>';
    }).join('');
    return '' +
      '<div class="act" style="--c:' + color + '">' +
        '<div class="bar"></div>' +
        '<h3>' + a.title + '</h3>' +
        '<div class="when">' + (a.when || '') + (a.n ? ' · ' + a.n + ' 人' : '') + '</div>' +
        '<p>' + a.desc + '</p>' +
        '<div class="foot">' + pills + '</div>' +
      '</div>';
  }

  function init() {
    var boxes = document.querySelectorAll('.acts[data-chapter]');
    if (!boxes.length) return;

    fetch('assets/data/activities.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var chs = (d.meta && d.meta.chapters) || {};
        boxes.forEach(function (box) {
          var ch = box.getAttribute('data-chapter');
          var color = (chs[ch] && chs[ch].color) || 'var(--brand)';
          var list = (d.activities || []).filter(function (a) { return a.ch === ch; });
          if (!list.length) return;
          box.innerHTML = list.map(function (a) { return cardHTML(a, color); }).join('');
          // 更新该页"活动数"提示（若存在 .sec-head .more 内的计数）
          var head = box.closest('.sec, section');
          var cnt = head && head.querySelector('[data-count]');
          if (cnt) cnt.textContent = list.length;
        });
      })
      .catch(function (e) {
        console.warn('[activities] 加载失败：', e);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
