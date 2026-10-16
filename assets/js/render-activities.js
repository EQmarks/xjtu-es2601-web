/* ============================================================
   活动卡片 · 数据驱动渲染
   读取 assets/data/activities.json
   容器：<div class="acts" data-chapter="聚能"></div>

   状态区分：
     status="done"     → 正常卡片（已举办）
     status="planned"  → 灰色卡片 + 「计划中」角标

   计数标记（在 HTML 里写占位，渲染后自动填数）：
     [data-count-ch="聚能"]        该篇章总数
     [data-count-ch-done="聚能"]   该篇章已完成数
     [data-count-total]            全支部总数
     [data-count-total-done]       全支部已完成数
     [data-count-tag="校际联动"]   含该标签的活动数
   ============================================================ */
(function () {
  'use strict';

  var isDone = function (a) { return a.status !== 'planned'; };

  var PILL_CLASS = function (t) {
    if (t.indexOf('选做') === 0) return 'pill gold';
    if (t.indexOf('待定') === 0) return 'pill grey';
    return 'pill';
  };

  function cardHTML(a, color) {
    var planned = !isDone(a);
    var pills = (a.tags || []).map(function (t) {
      return '<span class="' + PILL_CLASS(t) + '">' + t + '</span>';
    }).join('');
    return '' +
      '<div class="act' + (planned ? ' act-planned' : '') + '" style="--c:' + color + '">' +
        '<div class="bar"></div>' +
        (planned ? '<span class="act-badge">计划中</span>' : '') +
        '<h3>' + a.title + '</h3>' +
        '<div class="when">' + (a.when || '') + (a.n ? ' · ' + a.n + ' 人' : '') + '</div>' +
        '<p>' + a.desc + '</p>' +
        '<div class="foot">' + pills + '</div>' +
      '</div>';
  }

  function setAll(sel, val) {
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = val; });
  }

  function init() {
    var boxes = document.querySelectorAll('.acts[data-chapter]');
    if (!boxes.length) return;

    fetch('assets/data/activities.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var all = d.activities || [];
        var chs = (d.meta && d.meta.chapters) || {};
        var doneAll = all.filter(isDone);

        boxes.forEach(function (box) {
          var ch = box.getAttribute('data-chapter');
          var color = (chs[ch] && chs[ch].color) || 'var(--brand)';
          var list = all.filter(function (a) { return a.ch === ch; });
          if (!list.length) return;

          var dn = list.filter(isDone);
          var pl = list.filter(function (a) { return !isDone(a); });

          var html = dn.map(function (a) { return cardHTML(a, color); }).join('');
          if (pl.length) {
            html += '<div class="acts-sep"><span>以下 ' + pl.length +
                    ' 项为计划中 / 未举办</span></div>' +
                    pl.map(function (a) { return cardHTML(a, color); }).join('');
          }
          box.innerHTML = html;

          setAll('[data-count-ch="' + ch + '"]', list.length);
          setAll('[data-count-ch-done="' + ch + '"]', dn.length);

          /* 兼容旧标记 */
          var head = box.closest('.sec, section');
          var cnt = head && head.querySelector('[data-count]');
          if (cnt) cnt.textContent = list.length;
        });

        setAll('[data-count-total]', all.length);
        setAll('[data-count-total-done]', doneAll.length);
        document.querySelectorAll('[data-count-tag]').forEach(function (el) {
          var tag = el.getAttribute('data-count-tag');
          el.textContent = all.filter(function (a) {
            return (a.tags || []).some(function (t) { return t.indexOf(tag) >= 0; });
          }).length;
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
