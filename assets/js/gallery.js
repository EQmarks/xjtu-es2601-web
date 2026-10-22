/* ============================================================
   照片墙 · 网格 + 灯箱
   用法：<div class="gal" data-gallery="g-redclass"></div>
   缩略图懒加载，点开才加载大图
   ============================================================ */
(function () {
  'use strict';
  var BASE = 'assets/img/gallery/';
  var IMG_V = '?v=20261022n';   /* 图片内容更新后改这里，强制客户端重新拉取 */
  var lb = null;
  var esc = Site.escapeHTML;

  function box(container, slug, info) {
    var html = '';
    info.photos.forEach(function (filename, i) {
      var t = BASE + slug + '/t/' + filename + IMG_V;
      var f = BASE + slug + '/f/' + filename + IMG_V;
      html += '<a class="gal-i" href="' + Site.safeHref(f) + '" data-full="' + Site.safeHref(f) + '">' +
              '<img src="' + Site.safeHref(t) + '" alt="' + esc(info.activity || '活动现场') + ' · 照片 ' + (i + 1) + '" loading="lazy" decoding="async"></a>';
    });
    container.innerHTML = html;
  }

  function lightbox() {
    var lb = document.createElement('div');
    lb.className = 'gal-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '现场照片预览');
    lb.innerHTML = '<button class="gal-x" aria-label="关闭">×</button>' +
                   '<button class="gal-p" aria-label="上一张">‹</button>' +
                   '<img alt=""><button class="gal-n" aria-label="下一张">›</button>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), list = [], idx = 0, trigger = null;
    function show(i) {
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      img.src = list[idx].getAttribute('data-full');
      img.alt = list[idx].querySelector('img').alt;
    }
    function close() {
      lb.classList.remove('on');
      if (trigger) trigger.focus({ preventScroll: true });
    }
    lb.querySelector('.gal-x').onclick = close;
    lb.querySelector('.gal-p').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    lb.querySelector('.gal-n').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    lb.onclick = function (e) { if (e.target === lb) close(); };
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (['Escape', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) >= 0) e.preventDefault();
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'Tab') {
        var buttons = Array.prototype.slice.call(lb.querySelectorAll('button'));
        var current = buttons.indexOf(document.activeElement);
        e.preventDefault();
        buttons[(current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }
    });
    return {
      open: function (links, i) {
        list = links;
        trigger = links[i];
        show(i);
        lb.classList.add('on');
        lb.querySelector('.gal-x').focus({ preventScroll: true });
      }
    };
  }

  function init(root) {
    var boxes = (root || document).querySelectorAll('.gal[data-gallery]:not([data-gallery-ready])');
    if (!boxes.length) return;
    boxes.forEach(function (b) { b.setAttribute('data-gallery-ready', 'loading'); });

    return Site.loadJSON('assets/img/gallery/manifest.json')
      .then(function (m) {
        boxes.forEach(function (b) {
          var slug = b.getAttribute('data-gallery');
          var info = m[slug];
          if (!info) { b.innerHTML = '<p class="gal-empty">暂无照片</p>'; return; }
          box(b, slug, info);
          b.setAttribute('data-gallery-ready', 'true');
          b.addEventListener('click', function (e) {
            var a = e.target.closest('.gal-i');
            if (!a) return;
            e.preventDefault();
            if (!lb) lb = lightbox();
            var links = Array.prototype.slice.call(b.querySelectorAll('.gal-i'));
            lb.open(links, links.indexOf(a));
          });
        });
      })
      .catch(function (e) {
        console.warn('[gallery]', e);
        boxes.forEach(function (b) {
          b.removeAttribute('data-gallery-ready');
          b.innerHTML = '<p class="gal-empty">' + esc(Site.loadError('照片')) + '</p>';
        });
      });
  }

  window.SiteGallery = { init: init };
  Site.ready(function () { init(); });
})();
