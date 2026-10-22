/* ============================================================
   顶部图片轮播（参照高校官网 banner）
   用法：
     <section class="pcar" data-carousel>
       <div class="pcar-view">
         <div class="pcar-track">
           <figure class="pcar-slide"><img src="..." alt=""><figcaption>…</figcaption></figure>
           …
         </div>
         <button class="pcar-arrow pcar-prev" data-prev>‹</button>
         <button class="pcar-arrow pcar-next" data-next>›</button>
         <div class="pcar-dots" data-dots></div>
       </div>
     </section>

   行为：自动轮换（5 秒）· 悬停/聚焦暂停 · 左右箭头 · 圆点跳转 ·
        键盘 ←→ · 触摸滑动 · 页面不可见时停止
   ============================================================ */
(function () {
  'use strict';

  var INTERVAL = 5000;

  function init(root) {
    var track = root.querySelector('.pcar-track');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.pcar-slide'));
    if (!track || slides.length < 2) {
      if (slides.length === 1) slides[0].classList.add('is-on');
      return;
    }

    var dotsBox = root.querySelector('[data-dots]');
    var index = 0;
    var timer = null;
    var paused = false;

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pcar-dot';
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 张');
      b.addEventListener('click', function () { go(i, true); });
      if (dotsBox) dotsBox.appendChild(b);
      return b;
    });

    function render() {
      slides.forEach(function (s, i) {
        s.classList.toggle('is-on', i === index);
        s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-on', i === index);
        d.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      root.setAttribute('data-index', String(index));
    }

    function go(i, byUser) {
      index = (i + slides.length) % slides.length;
      render();
      if (byUser) restart();
    }

    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    function start() {
      stop();
      if (paused || document.hidden) return;
      timer = setInterval(next, INTERVAL);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    var prevBtn = root.querySelector('[data-prev]');
    var nextBtn = root.querySelector('[data-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });

    root.addEventListener('mouseenter', function () { paused = true; stop(); });
    root.addEventListener('mouseleave', function () { paused = false; start(); });
    root.addEventListener('focusin', function () { paused = true; stop(); });
    root.addEventListener('focusout', function () { paused = false; start(); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); restart(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); restart(); }
    });

    /* 触摸滑动 */
    var sx = null;
    root.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { dx > 0 ? prev() : next(); restart(); }
      sx = null;
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    render();
    start();
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
