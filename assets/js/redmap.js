/* ============================================================
   红色足迹 2.5D 地图 · 数据驱动渲染
   依赖：assets/data/sites.json（同目录相对路径）
   特性：等距投影 / 站点立柱 / 能量流 / 点击弹卡片 / 自动巡游
   ============================================================ */
(function () {
  'use strict';

  var TILE_W = 40, TILE_H = 20;      // 等距比 2:1
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var data = null;
  var current = null;

  /* ---------- 等距投影 ---------- */
  function iso(x, y, elev) {
    return { x: x, y: y - (elev || 0) };   // JSON 里已存屏幕坐标，这里只做抬升
  }

  /* ---------- 颜色映射 ---------- */
  var COLORS = {
    gold:   { top: '#F5D76E', face: '#D4AF37', dark: '#8B6F1E', side: '#7A0B1C' },
    orange: { top: '#FF9E7A', face: '#E8734A', dark: '#A3462A', side: '#6B0A18' },
    red:    { top: '#FF6B84', face: '#C8102E', dark: '#8B0A1E', side: '#5C0713' }
  };

  function el(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) {
      if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    }
    return e;
  }

  /* ---------- 画一根立柱 ---------- */
  function pillar(g, site) {
    var c = COLORS[site.color] || COLORS.red;
    var h = site.height, x = site.x, y = site.y;
    var halfW = 11;
    var grp = el('g', { 'class': 'site', 'data-id': site.id, 'tabindex': '0' });

    // 阴影底座
    grp.appendChild(el('path', {
      d: 'M' + x + ' ' + (y - 10) + ' L' + (x + halfW) + ' ' + y +
         ' L' + x + ' ' + (y + 10) + ' L' + (x - halfW) + ' ' + y + ' Z',
      fill: 'rgba(0,0,0,.45)'
    }));
    // 左侧面
    grp.appendChild(el('rect', {
      x: x - halfW, y: y - h, width: halfW, height: h, fill: c.face, opacity: '.95'
    }));
    // 右侧面（暗）
    grp.appendChild(el('rect', {
      x: x, y: y - h, width: halfW, height: h, fill: c.dark, opacity: '.92'
    }));
    // 顶面（菱形）
    grp.appendChild(el('path', {
      d: 'M' + x + ' ' + (y - h - 10) + ' L' + (x + halfW) + ' ' + (y - h) +
         ' L' + x + ' ' + (y - h + 10) + ' L' + (x - halfW) + ' ' + (y - h) + ' Z',
      fill: c.top
    }));
    // 未完成站点用虚线描边
    if (!site.done) {
      grp.appendChild(el('path', {
        d: 'M' + x + ' ' + (y - h - 10) + ' L' + (x + halfW) + ' ' + (y - h) +
           ' L' + x + ' ' + (y - h + 10) + ' L' + (x - halfW) + ' ' + (y - h) + ' Z',
        fill: 'none', stroke: '#D4AF37', 'stroke-width': '1.5', 'stroke-dasharray': '3 3'
      }));
    }
    // 名称
    grp.appendChild(el('text', { 'class': 'lbl', x: x, y: y - h - 20 })).textContent = site.name;
    if (site.sub) {
      var sub = el('text', { 'class': 'lbl-sm', x: x, y: y + 32 });
      sub.textContent = site.sub;
      grp.appendChild(sub);
    }
    g.appendChild(grp);
    return grp;
  }

  /* ---------- 画能量流 ---------- */
  function flow(g, from, to, svg) {
    var p = el('path', { 'class': 'flow', d: 'M' + from.x + ' ' + from.y + ' L' + to.x + ' ' + to.y });
    g.appendChild(p);
    // 沿线光点
    for (var i = 0; i < 3; i++) {
      var dot = el('circle', { 'class': 'spark', r: 3 - i * 0.6 });
      var anim = el('animateMotion', {
        dur: '3.2s', begin: (i * 1.05) + 's', repeatCount: 'indefinite',
        path: 'M' + from.x + ' ' + from.y + ' L' + to.x + ' ' + to.y
      });
      dot.appendChild(anim);
      g.appendChild(dot);
    }
  }

  /* ---------- 主渲染 ---------- */
  function render(svg, d, opts) {
    opts = opts || {};
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var defs = el('defs');
    svg.appendChild(defs);

    var gGrid = el('g', { opacity: '.42' });
    gGrid.appendChild(el('path', {
      d: 'M440 60 L800 240 L440 420 L80 240 Z', fill: 'rgba(122,39,51,.13)'
    }));
    ['M440 100 L720 240 L440 380 L160 240 Z',
     'M440 140 L640 240 L440 340 L240 240 Z',
     'M440 60 L440 420', 'M80 240 L800 240',
     'M260 150 L620 330', 'M620 150 L260 330'].forEach(function (dd) {
      gGrid.appendChild(el('path', { d: dd, stroke: '#7A2733', 'stroke-width': '1', fill: 'none' }));
    });
    svg.appendChild(gGrid);

    // 能量流
    var gFlow = el('g');
    var byId = {};
    d.sites.forEach(function (s) { byId[s.id] = s; });
    d.routes.forEach(function (r) {
      if (byId[r.from] && byId[r.to]) flow(gFlow, byId[r.from], byId[r.to], svg);
    });
    svg.appendChild(gFlow);

    // 返乡分散点
    if (d.homeward) {
      var gh = el('g', { opacity: '.85' });
      d.homeward.points.forEach(function (p) {
        gh.appendChild(el('circle', { cx: p.x, cy: p.y, r: 4.5, fill: '#C8102E' }));
      });
      var t = el('text', { 'class': 'lbl-sm', x: d.homeward.x, y: 290 });
      t.textContent = d.homeward.name + ' · ' + d.homeward.sub;
      gh.appendChild(t);
      svg.appendChild(gh);
    }

    // 立柱
    var gSites = el('g');
    d.sites.forEach(function (s) { pillar(gSites, s); });
    svg.appendChild(gSites);

    // 起点
    if (d.origin) {
      var t2 = el('text', { 'class': 'lbl-sm', x: d.origin.x, y: d.origin.y, opacity: '.75' });
      t2.textContent = d.origin.label;
      svg.appendChild(t2);
    }
  }

  /* ---------- 卡片 ---------- */
  function showCard(root, site) {
    current = site;
    var card = root.querySelector('.map-card');
    if (!card) return;
    card.innerHTML =
      '<div class="mc-head"><span class="mc-ch">' + (site.chapter || '聚能') + '</span>' +
      '<button class="mc-close" type="button" aria-label="关闭">×</button></div>' +
      '<h4>' + site.name + '</h4>' +
      '<div class="mc-sub">' + (site.sub || '') + '</div>' +
      '<div class="mc-meta">' + (site.date || '') +
      (site.participants ? ' · 参与 ' + site.participants + ' 人' : '') + '</div>' +
      '<p>' + (site.desc || '') + '</p>' +
      (site.photos && site.photos.length
        ? '<div class="mc-photos">' + site.photos.map(function (p) {
            return '<img src="' + p + '" alt="">'; }).join('') + '</div>'
        : '<div class="mc-empty">照片待补充</div>');
    card.classList.add('on');
    var btn = card.querySelector('.mc-close');
    if (btn) btn.addEventListener('click', function () { card.classList.remove('on'); });
  }

  /* ---------- 交互绑定 ---------- */
  function bind(root, svg) {
    svg.addEventListener('click', function (ev) {
      var g = ev.target.closest ? ev.target.closest('.site') : null;
      if (!g) return;
      var id = g.getAttribute('data-id');
      var site = null;
      (data.sites || []).forEach(function (s) { if (s.id === id) site = s; });
      if (site) showCard(root, site);
    });
    svg.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var g = ev.target.closest ? ev.target.closest('.site') : null;
      if (!g) return;
      ev.preventDefault();
      g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // 自动巡游
    var btn = root.querySelector('.map-tour');
    if (btn) {
      btn.addEventListener('click', function () {
        var i = 0;
        var list = data.sites || [];
        btn.disabled = true;
        var timer = setInterval(function () {
          if (i >= list.length) { clearInterval(timer); btn.disabled = false; return; }
          showCard(root, list[i++]);
        }, 2200);
      });
    }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    var root = document.getElementById('redmap');
    if (!root) return;
    var svg = root.querySelector('svg.iso');
    if (!svg) return;

    fetch('assets/data/sites.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        data = d;
        render(svg, d);
        bind(root, svg);
        root.classList.add('ready');
      })
      .catch(function (e) {
        // 数据加载失败时保留静态 SVG（降级）
        console.warn('[redmap] 数据加载失败，使用静态图：', e);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
