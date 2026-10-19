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

  var isDone = Site.isDone;
  var esc = Site.escapeHTML;
  var href = Site.safeHref;

  var PILL_CLASS = function (t) {
    if (t.indexOf('选做') === 0) return 'pill gold';
    if (t.indexOf('待定') === 0) return 'pill grey';
    return 'pill';
  };

  function cardHTML(a, color) {
    var planned = !isDone(a);
    var pills = (a.tags || []).map(function (t) {
      return '<span class="' + PILL_CLASS(t) + '">' + esc(Site.tagLabel(t)) + '</span>';
    }).join('');
    /* 卡片摘要：优先用导语（lead），兼容旧的 desc；过长截断 */
    var brief = a.lead || a.desc || '';
    if (brief.length > 110) brief = brief.slice(0, 110) + '…';
    var inner =
      '<div class="bar"></div>' +
      (planned ? '<span class="act-badge">计划中</span>' : '') +
      '<h3>' + esc(a.title) + '</h3>' +
      '<div class="when">' + esc(a.when || '') + '</div>' +
      '<p>' + esc(brief) + '</p>' +
      '<div class="foot">' + pills +
        (a.photos ? '<span class="pill photo">📷 ' + a.photos + ' 张</span>' : '') +
      '</div>';

    /* 有详情页的做成整卡可点击 */
    if (a.href) {
      return '<a class="act act-link' + (planned ? ' act-planned' : '') +
             '" href="' + href(a.href) + '" style="--c:' + esc(color) + '">' + inner + '</a>';
    }
    return '<div class="act' + (planned ? ' act-planned' : '') +
           '" style="--c:' + esc(color) + '">' + inner + '</div>';
  }

  function setAll(sel, val) {
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = val; });
  }

  function init() {
    var boxes = document.querySelectorAll('.acts[data-chapter]');
    /* 注意：没有 .acts 容器的页面（如首页）仍需要填计数，所以这里不能提前 return */
    var hasCounters = document.querySelector(
      '[data-count-total],[data-count-total-done],[data-count-ch],[data-count-ch-done],[data-count-tag]'
    );
    if (!boxes.length && !hasCounters) return;

    Site.loadJSON('assets/data/activities.json')
      .then(function (d) {
        var all = d.activities || [];
        var chs = (d.meta && d.meta.chapters) || {};
        var doneAll = all.filter(isDone);

        /* 篇章说明与分类规则共用同一份数据，避免介绍和实际归类脱节。 */
        ['rule', 'scope', 'lead'].forEach(function (field) {
          document.querySelectorAll('[data-chapter-' + field + ']').forEach(function (el) {
            var chapter = chs[el.getAttribute('data-chapter-' + field)];
            if (chapter && chapter[field]) el.textContent = chapter[field];
          });
        });

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

          /* 兼容旧标记 */
          var head = box.closest('.sec, section');
          var cnt = head && head.querySelector('[data-count]');
          if (cnt) cnt.textContent = list.length;
        });

        /* 从实际数据计算计数，不依赖活动卡片是否存在。 */
        document.querySelectorAll('[data-count-ch], [data-count-ch-done]').forEach(function (el) {
          var doneOnly = el.hasAttribute('data-count-ch-done');
          var ch = el.getAttribute(doneOnly ? 'data-count-ch-done' : 'data-count-ch');
          el.textContent = all.filter(function (a) {
            return a.ch === ch && (!doneOnly || isDone(a));
          }).length;
        });

        /* 活动分布条：[data-bar-ch] 的宽度按该篇章占总数的比例自动计算 */
        var maxCh = Math.max.apply(null, ["聚能", "蓄势", "传热", "释能"].map(function (ch) {
          return all.filter(function (a) { return a.ch === ch; }).length;
        }).concat([1]));
        document.querySelectorAll('[data-bar-ch]').forEach(function (el) {
          var ch = el.getAttribute('data-bar-ch');
          var n = all.filter(function (a) { return a.ch === ch; }).length;
          el.style.width = Math.round(n / maxCh * 100) + '%';
        });

        /* 支部要闻：[data-latest-acts="N"] 自动填最近 N 项已办活动 */
        document.querySelectorAll('[data-latest-acts]').forEach(function (ul) {
          var n = parseInt(ul.getAttribute('data-latest-acts'), 10) || 6;
          var latest = doneAll.slice().sort(function (a, b) {
            return String(b.dateKey || '').localeCompare(String(a.dateKey || ''));
          }).slice(0, n);
          ul.innerHTML = latest.map(function (a) {
            var gold = (a.ch === '蓄势' || a.ch === '释能') ? ' gold' : '';
            return '<li><span class="tag' + gold + '">' + esc(a.ch) + '</span>' +
                   '<a href="' + href(a.href) + '">' + esc(a.title) + '</a>' +
                   '<time>' + esc(Site.activityDate(a)) + '</time></li>';
          }).join('');
        });

        setAll('[data-count-total]', all.length);
        setAll('[data-count-total-done]', doneAll.length);
        document.querySelectorAll('[data-count-ch-albums]').forEach(function (el) {
          var ch = el.getAttribute('data-count-ch-albums');
          el.textContent = all.filter(function (a) { return a.ch === ch && a.gallery; }).length;
        });
        document.querySelectorAll('[data-count-ch-insights]').forEach(function (el) {
          var ch = el.getAttribute('data-count-ch-insights');
          el.textContent = all.filter(function (a) { return a.ch === ch; }).reduce(function (n, a) {
            return n + (a.insight || []).length;
          }, 0);
        });
        ['必做', '选做'].forEach(function (kind) {
          var types = Object.create(null);
          doneAll.forEach(function (a) {
            (a.tags || []).forEach(function (tag) {
              var match = new RegExp('^' + kind + '(\\d+)').exec(tag);
              if (match) types[match[1]] = true;
            });
          });
          setAll('[data-count-type="' + kind + '"]', Object.keys(types).length);
        });
        var albums = Object.create(null);
        all.forEach(function (a) { if (a.gallery) albums[a.gallery] = a.photos || 0; });
        setAll('[data-count-albums]', Object.keys(albums).length);
        var photoCount = Object.keys(albums).reduce(function (sum, key) {
          return sum + albums[key];
        }, 0);
        setAll('[data-count-photos]', photoCount);
        setAll('[data-photo-status]', photoCount + ' 张现场照片');
        document.querySelectorAll('[data-count-tag]').forEach(function (el) {
          var tag = el.getAttribute('data-count-tag');
          el.textContent = all.filter(function (a) {
            return (a.tags || []).some(function (t) { return t.indexOf(tag) >= 0; });
          }).length;
        });
      })
      .catch(function (e) {
        console.warn('[activities] 加载失败：', e);
        document.querySelectorAll('.acts[data-chapter], [data-latest-acts]').forEach(function (el) {
          var tag = el.tagName === 'UL' ? 'li' : 'div';
          el.innerHTML = '<' + tag + ' class="notice">' + esc(Site.loadError('活动列表')) + '</' + tag + '>';
        });
      });
  }

  Site.ready(init);
})();
