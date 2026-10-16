/* ============================================================
   照片墙 · 网格 + 灯箱
   用法：<div class="gal" data-gallery="g-redclass"></div>
   缩略图懒加载，点开才加载大图
   ============================================================ */
(function () {
  'use strict';
  var BASE = 'assets/img/gallery/';

  function box(container, slug, count) {
    var html = '';
    for (var i = 1; i <= count; i++) {
      var n = (i < 10 ? '0' + i : '' + i);
      var t = BASE + slug + '/t/' + n + '.jpg';
      var f = BASE + slug + '/f/' + n + '.jpg';
      html += '<a class="gal-i" href="' + f + '" data-full="' + f + '">' +
              '<img src="' + t + '" alt="" loading="lazy" decoding="async"></a>';
    }
    container.innerHTML = html;
  }

  function lightbox() {
    var lb = document.createElement('div');
    lb.className = 'gal-lb';
    lb.innerHTML = '<button class="gal-x" aria-label="关闭">×</button>' +
                   '<button class="gal-p" aria-label="上一张">‹</button>' +
                   '<img alt=""><button class="gal-n" aria-label="下一张">›</button>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), list = [], idx = 0;
    function show(i) {
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      img.src = list[idx];
    }
    lb.querySelector('.gal-x').onclick = function () { lb.classList.remove('on'); };
    lb.querySelector('.gal-p').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    lb.querySelector('.gal-n').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    lb.onclick = function (e) { if (e.target === lb) lb.classList.remove('on'); };
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') lb.classList.remove('on');
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    return {
      open: function (links, i) {
        list = links.map(function (a) { return a.getAttribute('data-full'); });
        show(i);
        lb.classList.add('on');
      }
    };
  }

  function init() {
    var boxes = document.querySelectorAll('.gal[data-gallery]');
    if (!boxes.length) return;
    var lb = null;

    fetch('assets/img/gallery/manifest.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (m) {
        boxes.forEach(function (b) {
          var slug = b.getAttribute('data-gallery');
          var info = m[slug];
          if (!info) { b.innerHTML = '<p class="gal-empty">暂无照片</p>'; return; }
          box(b, slug, info.count);
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
      .catch(function (e) { console.warn('[gallery]', e); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
