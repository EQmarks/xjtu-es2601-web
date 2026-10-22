/* 全站公共工具。先于页面脚本加载；地图保留独立离线实现。 */
(function () {
  'use strict';
  var requests = Object.create(null);

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeHref(value) {
    if (!value) return '#';
    try {
      var url = new URL(value, location.href);
      var allowed = /^https?:$/.test(url.protocol) ||
        (location.protocol === 'file:' && url.protocol === 'file:');
      return allowed ? escapeHTML(url.href) : '#';
    } catch (e) { return '#'; }
  }

  function loadJSON(path) {
    if (!requests[path]) {
      requests[path] = fetch(path, { cache: 'no-store' })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        }).catch(function (error) {
          delete requests[path]; // 失败后允许重试
          throw error;
        });
    }
    return requests[path];
  }

  function ready(init) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  function activityDate(activity) {
    var text = String(activity.when || '日期待确认').split(' · ')[0];
    // 括号里是补充说明（如「具体日期以书院赛程为准」「兴庆校区食堂」），列表标题只用日期
    text = text.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    var range = /^(\d{4})-(\d{2})-(\d{2})\s*至\s*(\d{2})-(\d{2})/.exec(text);
    if (range) return range[1] + '.' + range[2] + '.' + range[3] + '—' + range[4] + '.' + range[5];
    var months = /^(\d{4})-(\d{2})\s*至\s*(\d{2})$/.exec(text);
    if (months) return months[1] + ' 年 ' + Number(months[2]) + '—' + Number(months[3]) + ' 月';
    var exact = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (exact && text.indexOf('至') < 0) return exact[1] + '.' + exact[2] + '.' + exact[3];
    var month = /^(\d{4})-(\d{2})$/.exec(text);
    if (month) return month[1] + ' 年 ' + Number(month[2]) + ' 月';
    return text.replace(/^(\d{4}) 国庆/, '$1 年国庆');
  }

  function tagLabel(tag) {
    return String(tag).replace(/^(必做|选做)\d+\s*/, '').replace(/^附件\s*4.*$/, '学习记录');
  }

  function loadError(label) {
    return label + '暂时无法加载，请刷新重试。' +
      (location.protocol === 'file:' ? '本地预览请先启动 tools/serve.py，再通过本地网址打开。' : '');
  }

  window.Site = {
    escapeHTML: escapeHTML,
    safeHref: safeHref,
    loadJSON: loadJSON,
    ready: ready,
    activityDate: activityDate,
    tagLabel: tagLabel,
    loadError: loadError,
    isDone: function (activity) { return activity.status === 'done'; }
  };
})();
