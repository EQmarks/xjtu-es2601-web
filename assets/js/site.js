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

  function loadError(label) {
    return label + '暂时无法加载，请刷新重试。' +
      (location.protocol === 'file:' ? '本地预览请先启动 tools/serve.py，再通过本地网址打开。' : '');
  }

  window.Site = {
    escapeHTML: escapeHTML,
    safeHref: safeHref,
    loadJSON: loadJSON,
    ready: ready,
    loadError: loadError,
    isDone: function (activity) { return activity.status === 'done'; }
  };
})();
