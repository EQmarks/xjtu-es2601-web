/* 活动相册时间轴；照片交互由 gallery.js 负责。 */
(function(){
  'use strict';
  var esc = Site.escapeHTML;
  function fmt(d){
    var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||'');
    if(!m) return d||'';
    if(m[1]==='9999') return '时间待定';
    return m[1]+'.'+m[2]+'.'+m[3];
  }
  Site.loadJSON('assets/data/activities.json').then(function(d){
    var acts=(d.activities||[]).filter(function(a){return a.gallery && a.photos;});
    /* 按 dateKey 升序排列 */
    acts.sort(function(a,b){
      return String(a.dateKey||'9999').localeCompare(String(b.dateKey||'9999'));
    });
    var total=acts.reduce(function(s,a){return s+a.photos;},0);
    document.getElementById('pgal-sub').textContent =
      '按时间顺序排列 ｜ 共 '+acts.length+' 项活动 · '+total+' 张现场照片 ｜ 点击看大图，支持左右切换与键盘操作';

    document.getElementById('pgal-nav').innerHTML = acts.map(function(a,i){
      return '<a href="#g'+i+'"><i>'+esc(fmt(a.dateKey))+'</i>'+esc(a.title.slice(0,14))+'<b>'+a.photos+'</b></a>';
    }).join('');

    document.getElementById('pgal-body').innerHTML = acts.map(function(a,i){
      return '<div class="pgal-sec" id="g'+i+'">'+
             '<div class="pgal-date"><span class="d">'+esc(fmt(a.dateKey))+'</span>'+
             '<span class="n">'+esc(a.when||'')+'</span></div>'+
             '<h2>'+esc(a.title)+'</h2>'+
             '<div class="pgal-meta"><span>'+a.photos+' 张照片</span>'+
             '<span class="ch">'+esc(a.ch)+' · '+esc(a.main||'')+'</span></div>'+
             '<div class="gal" data-gallery="'+esc(a.gallery)+'"></div></div>';
    }).join('');

    SiteGallery.init(document.getElementById('pgal-body'));
  }).catch(function(e){
    console.warn('[photos]', e);
    document.getElementById('pgal-body').innerHTML='<div class="notice">'+esc(Site.loadError('活动相册'))+'</div>';
  });
})();
