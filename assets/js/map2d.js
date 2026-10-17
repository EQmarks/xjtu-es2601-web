/* ============================================================
   红色足迹 · 立体中国地图（Canvas 2D，纯净版）
   立体感 = 逐省逐环向下叠 DEPTH 层渐变暗色（侧面）+ 亮色顶面
   投影   = 等距圆柱 + 纬度余弦校正
   ============================================================ */
(function () {
  'use strict';

  var cv = document.getElementById('cnmap');
  if (!cv) return;
  var ctx = cv.getContext('2d');

  /* ---------- 视觉参数 ---------- */
  var DEPTH = 18;
  var SIDE_TOP = [190, 56, 76];    /* 侧面顶部（贴近顶面，最亮） */
  var SIDE_BOT = [58, 8, 16];      /* 侧面底部（最暗） */
  var TOP = '#B8273F';             /* 顶面 */
  var TOP_HOVER = '#DC3C58';
  var TOP_SEL = '#D61634';
  var BORDER = 'rgba(255,214,186,.7)';
  var BORDER_HOVER = 'rgba(255,244,200,1)';
  var BG = '#180509';

  /* ---------- 站点 ---------- */
  var SITES = [
    { id: 'xian', name: '西安', sub: '西迁博物馆 · 钱学森展 · 思源碑',
      lng: 108.98, lat: 34.26, ch: '聚能', when: '2026-10-11',
      desc: '西迁博物馆、钱学森科学精神与教育思想展、饮水思源碑合影——走一遍「打起背包就出发」的物理现场。' },
    { id: 'xian-incident', name: '西安事变纪念馆', sub: '红色研学实践',
      lng: 108.98, lat: 34.14, ch: '聚能', when: '2026-10-06',
      desc: '参加英仔爱心社组织的研学，重温西安事变历史，缅怀革命先烈。' },
    { id: 'fuping', name: '富平', sub: '习仲勋故里 · 党课（意向）',
      lng: 109.18, lat: 34.75, ch: '聚能', when: '2026-10-17（意向）',
      desc: '前往习仲勋故里富平，上一堂行走的党课。' }
  ];
  var ORIGIN = { name: '上海', lng: 121.47, lat: 31.23 };
  var ROUTES = [
    { a: [108.98, 34.26], b: [109.18, 34.75] },
    { a: [121.47, 31.23], b: [108.98, 34.26] }
  ];
  var HOMES = [
    [113.62,34.75],[114.51,38.04],[117.00,36.65],[120.38,36.07],[108.71,34.33],
    [107.14,34.36],[109.73,38.29],[109.49,36.59],[112.55,37.87],[111.00,35.02],
    [104.07,30.57],[104.68,31.47],[114.31,30.52],[111.29,30.69],[112.94,28.23],
    [118.80,32.06],[117.18,34.26],[120.15,30.28],[117.23,31.82],[119.30,26.08],
    [115.86,28.68],[118.35,35.10],[118.18,39.63],[112.45,34.62],[123.43,41.80],
    [125.32,43.82],[126.53,45.80],[103.83,36.06],[87.62,43.82],[111.75,40.84],
    [116.41,39.90]
  ];

  /* ---------- 状态 ---------- */
  var geo = null, provinces = [];
  var W = 0, H = 0, DPR = 1;
  var view = { scale: 1, tx: 0, ty: 0 };
  var B = { minLng: 73.5, maxLng: 135.1, minLat: 17.5, maxLat: 53.6 };
  var COSLAT = Math.cos(28 * Math.PI / 180);
  var S = 1, OX = 0, OY = 0;
  var hoverName = null, activeId = null;
  var flow = 0, timer = null;
  var card = document.getElementById('siteCard');
  var tip = document.getElementById('mapTip');

  /* ---------- 尺寸 ---------- */
  /* 关键：位图尺寸必须严格等于 CSS 显示尺寸，否则浏览器会重采样导致发糊 */
  function resize() {
    var rect = cv.getBoundingClientRect();
    var cssW = Math.max(320, Math.round(rect.width));
    var cssH = Math.max(240, Math.round(rect.height));
    W = cssW;
    H = cssH;
    DPR = 1;                       /* 1:1 像素映射，绝不缩放 */
    cv.width = cssW;               /* 位图 = 显示尺寸 */
    cv.height = cssH;
    cv.style.width = cssW + 'px';
    cv.style.height = cssH + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    computeTransform();
    buildProvinces();
  }

  function computeTransform() {
    var padX = Math.max(18, W * 0.04);
    var padY = Math.max(18, H * 0.05);
    var aw = W - padX * 2, ah = H - padY * 2;
    var wGeo = (B.maxLng - B.minLng) * COSLAT;
    var hGeo = B.maxLat - B.minLat;
    S = Math.min(aw / wGeo, ah / hGeo);
    OX = padX + (aw - wGeo * S) / 2;
    OY = padY + (ah - hGeo * S) / 2;
  }

  function proj(lng, lat) {
    var x = OX + (lng - B.minLng) * COSLAT * S;
    var y = OY + (B.maxLat - lat) * S;
    return [
      (x - W / 2) * view.scale + W / 2 + view.tx,
      (y - H / 2) * view.scale + H / 2 + view.ty
    ];
  }

  /* ---------- 数据 ---------- */
  function collectBounds() {
    var minLng = 1e9, maxLng = -1e9, minLat = 1e9, maxLat = -1e9;
    geo.features.forEach(function (f) {
      walk(f.geometry.coordinates);
    });
    function walk(c) {
      if (typeof c[0] === 'number') {
        if (c[0] < minLng) minLng = c[0];
        if (c[0] > maxLng) maxLng = c[0];
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
      } else { for (var i = 0; i < c.length; i++) walk(c[i]); }
    }
    B = {
      minLng: minLng,
      maxLng: maxLng,
      minLat: Math.max(minLat, 17.5),   /* 收窄南海诸岛，避免主体压扁 */
      maxLat: maxLat
    };
  }

  function buildProvinces() {
    provinces = [];
    if (!geo) return;
    for (var i = 0; i < geo.features.length; i++) {
      var f = geo.features[i];
      var g = f.geometry;
      if (!g) continue;
      var polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      var rings = [];
      for (var p = 0; p < polys.length; p++) {
        for (var r = 0; r < polys[p].length; r++) {
          var ring = polys[p][r];
          if (!ring || ring.length < 3) continue;
          var pts = new Array(ring.length);
          for (var k = 0; k < ring.length; k++) pts[k] = proj(ring[k][0], ring[k][1]);
          rings.push(pts);
        }
      }
      if (rings.length) provinces.push({ name: f.properties.name || '', rings: rings });
    }
  }

  /* ---------- 绘制 ---------- */
  function fillRing(rg, dy, color) {
    if (rg.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(rg[0][0], rg[0][1] + dy);
    for (var i = 1; i < rg.length; i++) ctx.lineTo(rg[i][0], rg[i][1] + dy);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function strokeRing(rg, dy, color, lw) {
    if (rg.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(rg[0][0], rg[0][1] + dy);
    for (var i = 1; i < rg.length; i++) ctx.lineTo(rg[i][0], rg[i][1] + dy);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  function draw() {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineJoin = 'round';

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    drawGraticule();
    if (!provinces.length) return;

    var d = DEPTH * Math.max(0.8, Math.min(view.scale, 2));

    /* 侧面 */
    for (var k = DEPTH; k >= 1; k--) {
      var t = k / DEPTH;
      var r = Math.round(SIDE_BOT[0] + (SIDE_TOP[0] - SIDE_BOT[0]) * (1 - t));
      var g2 = Math.round(SIDE_BOT[1] + (SIDE_TOP[1] - SIDE_BOT[1]) * (1 - t));
      var b2 = Math.round(SIDE_BOT[2] + (SIDE_TOP[2] - SIDE_BOT[2]) * (1 - t));
      var col = 'rgb(' + r + ',' + g2 + ',' + b2 + ')';
      for (var i = 0; i < provinces.length; i++) {
        var rs = provinces[i].rings;
        for (var q = 0; q < rs.length; q++) fillRing(rs[q], d * t, col);
      }
    }

    /* 顶面 */
    for (var j = 0; j < provinces.length; j++) {
      var p = provinces[j];
      var isH = p.name === hoverName;
      var isSel = activeId === 'xian' && p.name === '陕西省';
      var fill = isH ? TOP_HOVER : (isSel ? TOP_SEL : TOP);
      var bc = isH ? BORDER_HOVER : BORDER;
      var bw = isH ? 1.8 : 1;
      for (var q2 = 0; q2 < p.rings.length; q2++) {
        fillRing(p.rings[q2], 0, fill);
        strokeRing(p.rings[q2], 0, bc, bw);
      }
    }

    /* 能量流 */
    for (var ri = 0; ri < ROUTES.length; ri++) {
      var rt = ROUTES[ri];
      var p1 = proj(rt.a[0], rt.a[1]);
      var p2 = proj(rt.b[0], rt.b[1]);
      var mx = (p1[0] + p2[0]) / 2;
      var my = (p1[1] + p2[1]) / 2 - Math.max(30, Math.abs(p2[0] - p1[0]) * 0.28);
      var sc = Math.max(0.8, Math.min(view.scale, 2));
      ctx.save();
      /* 外光 */
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.quadraticCurveTo(mx, my, p2[0], p2[1]);
      ctx.strokeStyle = 'rgba(245,215,110,.16)';
      ctx.lineWidth = 8 * sc;
      ctx.stroke();
      /* 主线 */
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.quadraticCurveTo(mx, my, p2[0], p2[1]);
      ctx.strokeStyle = 'rgba(250,226,140,.85)';
      ctx.lineWidth = 1.6 * sc;
      ctx.setLineDash([7, 7]);
      ctx.lineDashOffset = -flow;
      ctx.stroke();
      ctx.restore();
      /* 光点 */
      for (var s2 = 0; s2 < 3; s2++) {
        var tt = ((flow / 96) + s2 / 3) % 1;
        var m = 1 - tt;
        var px = m * m * p1[0] + 2 * m * tt * mx + tt * tt * p2[0];
        var py = m * m * p1[1] + 2 * m * tt * my + tt * tt * p2[1];
        ctx.beginPath();
        ctx.arc(px, py, 2.8 * sc, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF6D0';
        ctx.shadowColor = '#F5D76E';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    /* 家乡点 */
    var hr = 2.4 * Math.max(0.75, Math.min(view.scale, 2));
    for (var hi = 0; hi < HOMES.length; hi++) {
      var hp = proj(HOMES[hi][0], HOMES[hi][1]);
      if (hp[0] < -20 || hp[0] > W + 20 || hp[1] < -20 || hp[1] > H + 20) continue;
      ctx.beginPath();
      ctx.arc(hp[0], hp[1], hr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(126,200,227,.9)';
      ctx.fill();
    }

    /* 站点立柱 */
    var sc2 = Math.max(0.8, Math.min(view.scale, 2));
    for (var si = 0; si < SITES.length; si++) {
      var st = SITES[si];
      var sp = proj(st.lng, st.lat);
      if (sp[0] < -60 || sp[0] > W + 60 || sp[1] < -60 || sp[1] > H + 60) continue;
      var on = activeId === st.id;
      var rad = (on ? 6 : 4.6) * sc2;
      var lift = 18 * sc2;

      /* 光晕 */
      var glow = ctx.createRadialGradient(sp[0], sp[1] - lift, 0, sp[0], sp[1] - lift, rad * 6);
      glow.addColorStop(0, 'rgba(245,215,110,.5)');
      glow.addColorStop(0.5, 'rgba(200,16,46,.22)');
      glow.addColorStop(1, 'rgba(200,16,46,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sp[0], sp[1] - lift, rad * 6, 0, Math.PI * 2);
      ctx.fill();

      /* 立柱 */
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245,215,110,.8)';
      ctx.lineWidth = 1.5 * sc2;
      ctx.moveTo(sp[0], sp[1]);
      ctx.lineTo(sp[0], sp[1] - lift);
      ctx.stroke();

      /* 顶部点 */
      ctx.beginPath();
      ctx.arc(sp[0], sp[1] - lift, rad, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#FFF8DC' : '#F5D76E';
      ctx.shadowColor = '#D4AF37';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#8B0A1E';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      /* 标签 */
      ctx.font = '600 ' + Math.round(13 * sc2) + 'px "Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(24,5,9,.9)';
      ctx.strokeText(st.name, sp[0], sp[1] - lift - 9);
      ctx.fillStyle = on ? '#FFF8DC' : '#FFE9B8';
      ctx.fillText(st.name, sp[0], sp[1] - lift - 9);
    }

    /* 源起 */
    var op = proj(ORIGIN.lng, ORIGIN.lat);
    if (op[0] > -60 && op[0] < W + 60 && op[1] > -60 && op[1] < H + 60) {
      ctx.beginPath();
      var spikes = 4, outer = 7.5 * sc2, inner = 3.2 * sc2;
      for (var zi = 0; zi < spikes * 2; zi++) {
        var rr = zi % 2 === 0 ? outer : inner;
        var ang = (Math.PI / spikes) * zi - Math.PI / 2;
        var zx = op[0] + Math.cos(ang) * rr, zy = op[1] + Math.sin(ang) * rr;
        if (zi === 0) ctx.moveTo(zx, zy); else ctx.lineTo(zx, zy);
      }
      ctx.closePath();
      ctx.fillStyle = '#D4AF37';
      ctx.shadowColor = '#D4AF37';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '600 ' + Math.round(12.5 * sc2) + 'px "Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(24,5,9,.9)';
      ctx.strokeText('上海 · 1896', op[0], op[1] - 13 * sc2);
      ctx.fillStyle = '#FFE9B8';
      ctx.fillText('上海 · 1896', op[0], op[1] - 13 * sc2);
    }
  }

  function drawGraticule() {
    ctx.save();
    ctx.strokeStyle = 'rgba(212,175,55,.055)';
    ctx.lineWidth = 1;
    for (var lng = 80; lng <= 130; lng += 10) {
      var a = proj(lng, B.minLat), b = proj(lng, B.maxLat);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    for (var lat = 20; lat <= 50; lat += 10) {
      var c = proj(B.minLng, lat), e = proj(B.maxLng, lat);
      ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- 命中测试 ---------- */
  function inRing(px, py, rg) {
    var inside = false;
    for (var i = 0, j = rg.length - 1; i < rg.length; j = i++) {
      var xi = rg[i][0], yi = rg[i][1], xj = rg[j][0], yj = rg[j][1];
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  function hitProvince(mx, my) {
    for (var i = provinces.length - 1; i >= 0; i--) {
      var rs = provinces[i].rings;
      for (var a = 0; a < rs.length; a++) {
        if (inRing(mx, my, rs[a])) return provinces[i].name;
      }
    }
    return null;
  }

  function hitSite(mx, my) {
    var sc = Math.max(0.8, Math.min(view.scale, 2));
    for (var i = 0; i < SITES.length; i++) {
      var s = SITES[i], p = proj(s.lng, s.lat);
      var cx = p[0], cy = p[1] - 18 * sc;
      var dx = mx - cx, dy = my - cy;
      if (dx * dx + dy * dy < 24 * sc * 24 * sc) return s;
    }
    return null;
  }

  /* ---------- 交互 ---------- */
  function showCard(s) {
    if (!s) { card.classList.remove('on'); activeId = null; return; }
    activeId = s.id;
    card.innerHTML =
      '<button class="sc-close" type="button" aria-label="关闭">×</button>' +
      '<span class="sc-ch">' + s.ch + '</span>' +
      '<h4>' + s.name + '</h4>' +
      '<div class="sc-sub">' + s.sub + '</div>' +
      '<div class="sc-meta">' + s.when + '</div>' +
      '<p>' + s.desc + '</p>';
    card.classList.add('on');
    card.querySelector('.sc-close').onclick = function () { showCard(null); };
  }

  function showTip(ev, text) {
    if (!text) { tip.classList.remove('on'); return; }
    var r = cv.getBoundingClientRect();
    tip.innerHTML = text;
    tip.style.left = (ev.clientX - r.left) + 'px';
    tip.style.top = (ev.clientY - r.top) + 'px';
    tip.classList.add('on');
  }

  var drag = false, lx = 0, ly = 0;

  cv.addEventListener('mousedown', function (e) {
    drag = true; lx = e.clientX; ly = e.clientY;
    cv.classList.add('dragging');
  });
  window.addEventListener('mouseup', function () {
    drag = false; cv.classList.remove('dragging');
  });
  window.addEventListener('mousemove', function (e) {
    if (!geo) return;
    var r = cv.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    if (drag) {
      view.tx += e.clientX - lx;
      view.ty += e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      hoverName = null; tip.classList.remove('on');
      return;
    }
    if (mx < 0 || mx > W || my < 0 || my > H) { tip.classList.remove('on'); return; }
    var s = hitSite(mx, my);
    if (s) {
      showTip(e, '<b>' + s.name + '</b> ｜ ' + s.sub);
      cv.style.cursor = 'pointer';
      hoverName = null;
    } else {
      hoverName = hitProvince(mx, my);
      showTip(e, hoverName);
      cv.style.cursor = hoverName ? 'pointer' : 'grab';
    }
  });
  cv.addEventListener('mouseleave', function () {
    tip.classList.remove('on'); hoverName = null;
  });
  cv.addEventListener('click', function (e) {
    var r = cv.getBoundingClientRect();
    var s = hitSite(e.clientX - r.left, e.clientY - r.top);
    if (s) showCard(s);
  });
  cv.addEventListener('dblclick', function () {
    view = { scale: 1, tx: 0, ty: 0 };
  });
  cv.addEventListener('wheel', function (e) {
    e.preventDefault();
    var r = cv.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    var old = view.scale;
    var ns = Math.max(0.85, Math.min(7, old * (e.deltaY < 0 ? 1.18 : 1 / 1.18)));
    if (ns === old) return;
    var k = ns / old;
    view.tx = mx - W / 2 - (mx - W / 2 - view.tx) * k;
    view.ty = my - H / 2 - (my - H / 2 - view.ty) * k;
    view.scale = ns;
  }, { passive: false });

  /* 触屏 */
  var touch = null;
  cv.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      touch = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY, tx: view.tx, ty: view.ty };
    } else if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      touch = { mode: 'pinch', d: Math.sqrt(dx * dx + dy * dy), s: view.scale };
    }
  }, { passive: true });
  cv.addEventListener('touchmove', function (e) {
    if (!touch) return;
    if (touch.mode === 'pinch' && e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var d = Math.sqrt(dx * dx + dy * dy);
      view.scale = Math.max(0.85, Math.min(7, touch.s * d / touch.d));
      e.preventDefault();
    } else if (e.touches.length === 1) {
      view.tx = touch.tx + (e.touches[0].clientX - touch.x);
      view.ty = touch.ty + (e.touches[0].clientY - touch.y);
      e.preventDefault();
    }
  }, { passive: false });
  cv.addEventListener('touchend', function () { touch = null; }, { passive: true });

  /* ---------- 控件 ---------- */
  function zoomBy(f) {
    var ns = Math.max(0.85, Math.min(7, view.scale * f));
    var k = ns / view.scale;
    view.tx *= k; view.ty *= k;
    view.scale = ns;
  }
  document.getElementById('btn-in').onclick = function () { zoomBy(1.3); };
  document.getElementById('btn-out').onclick = function () { zoomBy(1 / 1.3); };
  document.getElementById('btn-reset').onclick = function () {
    view = { scale: 1, tx: 0, ty: 0 };
    showCard(null);
  };

  var tour = null;
  document.getElementById('btn-tour').onclick = function () {
    var btn = this;
    if (tour) {
      clearInterval(tour); tour = null;
      btn.classList.remove('on'); btn.textContent = '自动巡游';
      showCard(null);
      return;
    }
    btn.classList.add('on'); btn.textContent = '停止巡游';
    var i = 0;
    showCard(SITES[0]);
    tour = setInterval(function () {
      i++;
      if (i >= SITES.length) {
        clearInterval(tour); tour = null;
        btn.classList.remove('on'); btn.textContent = '自动巡游';
        showCard(null);
        return;
      }
      showCard(SITES[i]);
    }, 3400);
  };

  var linesOn = true;
  document.getElementById('btn-line').onclick = function () {
    linesOn = !linesOn;
    this.classList.toggle('on', linesOn);
  };

  /* ---------- 启动 ---------- */
  resize();

  fetch('assets/data/china.geo.json', { cache: 'force-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      geo = d;
      collectBounds();
      computeTransform();
      buildProvinces();

      document.getElementById('st-sites').textContent = SITES.length;
      document.getElementById('st-routes').textContent = ROUTES.length;
      document.getElementById('st-home').textContent = HOMES.length;
      document.getElementById('st-prov').textContent = geo.features.length;

      /* 首帧 */
      draw();

      /* 动画（能量流） */
      timer = setInterval(function () {
        flow = (flow + 1) % 96;
        draw();
      }, 50);

      window.addEventListener('resize', function () {
        resize();
        draw();
      });
    })
    .catch(function (e) {
      console.error('[map2d] 加载失败', e);
      ctx.fillStyle = '#FFB0BC';
      ctx.font = '15px "Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('地图数据加载失败：' + e.message, W / 2, H / 2);
    });
})();
