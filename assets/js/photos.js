/* 活动相册时间轴；照片交互由 gallery.js 负责。 */
(function(){
  'use strict';
  var esc = Site.escapeHTML;
  // 仅展示实际记录的日期精度；dateKey 用于排序。
  var dateLabel = Site.activityDate;
  Site.loadJSON('assets/data/activities.json').then(function(d){
    var acts=(d.activities||[]).filter(function(a){return a.gallery && a.photos;});
    /* 按 dateKey 升序排列 */
    acts.sort(function(a,b){
      return String(a.dateKey||'9999').localeCompare(String(b.dateKey||'9999'));
    });
    var total=acts.reduce(function(s,a){return s+a.photos;},0);
    document.getElementById('pgal-sub').textContent =
      acts.length+' 个相册 · '+total+' 张照片 · 点击照片查看大图';

    var select = document.getElementById('pgal-select');
    select.innerHTML = '<option value="">快速定位相册</option>' + acts.map(function(a,i){
      return '<option value="g'+i+'">'+esc(dateLabel(a))+' · '+esc(a.title)+'</option>';
    }).join('');
    select.disabled = false;
    select.addEventListener('change', function () {
      if (!select.value) return;
      var target = document.getElementById(select.value);
      if (target) {
        history.replaceState(null, '', '#' + select.value);
        target.scrollIntoView({ block: 'start' });
        target.querySelector('h2').focus({ preventScroll: true });
      }
    });

    document.getElementById('pgal-body').innerHTML = acts.map(function(a,i){
      return '<div class="pgal-sec" id="g'+i+'">'+
             '<div class="pgal-date"><span class="d">'+esc(dateLabel(a))+'</span></div>'+
             '<h2 tabindex="-1">'+esc(a.title)+'</h2>'+
             '<div class="pgal-meta"><span>'+a.photos+' 张照片</span>'+
             '<span class="ch">'+esc(a.ch)+' · '+esc(a.main||'')+'</span></div>'+
             '<div class="gal" data-gallery="'+esc(a.gallery)+'"></div></div>';
    }).join('');

    SiteGallery.init(document.getElementById('pgal-body'));
    var anchor = document.getElementById(location.hash.slice(1));
    if (anchor && anchor.classList.contains('pgal-sec')) {
      select.value = anchor.id;
      anchor.scrollIntoView({ block: 'start' });
    }
  }).catch(function(e){
    console.warn('[photos]', e);
    document.getElementById('pgal-body').innerHTML='<div class="notice">'+esc(Site.loadError('活动相册'))+'</div>';
  });
})();
