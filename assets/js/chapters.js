/* 四篇章图文展示，共用活动与相册数据。 */
(function () {
  'use strict';
  var root=document.querySelector('[data-chapter-page]');
  if(!root)return;
  var esc=Site.escapeHTML, href=Site.safeHref;
  var imageOptions={};
  function topics(a){return '<div class="topic-tags">'+(a.tags||[]).map(function(t){return '<span>'+esc(Site.tagLabel(t))+'</span>';}).join('')+'</div>';}
  function image(a,manifest){var album=manifest[a.gallery],options=imageOptions[a.id]||{};if(!album||!album.photos||!album.photos.length)return '';var file=album.photos.indexOf(options.file)>=0?options.file:album.photos[0];return 'assets/img/gallery/'+a.gallery+'/f/'+file;}
  function photo(a,manifest){
    var src=image(a,manifest),options=imageOptions[a.id]||{},point=options.position||[50,50];
    var x=Math.max(0,Math.min(100,Number(point[0])||0)),y=Math.max(0,Math.min(100,Number(point[1])||0));
    return src?'<img src="'+href(src)+'" alt="'+esc(a.title)+'" style="--photo-fit:'+(options.fit==='contain'?'contain':'cover')+';--photo-position:'+x+'% '+y+'%" loading="lazy" decoding="async">':'';
  }
  function title(a){return '<h3>'+esc(a.headline||a.title)+'</h3>'+(a.headline?'<div class="activity-name">'+esc(a.title)+'</div>':'');}
  function feature(a,brief,manifest){return '<a class="feature" href="'+href(a.href)+'">'+photo(a,manifest)+'<div class="feature-copy">'+title(a)+'<p class="card-brief">'+esc(brief||a.lead)+'</p>'+topics(a)+'<div class="feature-foot"><time>'+esc(Site.activityDate(a))+'</time><b aria-hidden="true">↗</b></div></div></a>';}
  function row(a,manifest){var src=image(a,manifest);return '<a class="activity-row'+(src?'':' is-text')+'" href="'+href(a.href)+'">'+photo(a,manifest)+'<div><time>'+esc(Site.stripNote(a.when))+'</time>'+title(a)+'<p class="card-brief">'+esc(a.lead)+'</p>'+topics(a)+'</div><span class="row-arrow" aria-hidden="true">↗</span></a>';}
  Promise.all([Site.loadJSON('assets/data/activities.json'),Site.loadJSON('assets/img/gallery/manifest.json'),Site.loadJSON('assets/data/chapters.json')]).then(function(results){
    var chapter=root.getAttribute('data-chapter-page'),all=results[0].activities,manifest=results[1],config=results[2][chapter];
    imageOptions=config.images||{};
    var list=all.filter(function(a){return a.ch===chapter;}),by={};list.forEach(function(a){by[a.id]=a;});
    root.querySelector('[data-chapter-intro]').textContent=config.intro;
    root.querySelector('[data-chapter-featured]').innerHTML=config.featured.filter(function(f){return !!by[f.id];}).map(function(f){return feature(by[f.id],f.brief,manifest);}).join('');
    root.querySelector('[data-chapter-list]').innerHTML=list.map(function(a){return row(a,manifest);}).join('');
    root.querySelector('[data-chapter-list-count]').textContent=list.length;
    root.dataset.ready='true';
  }).catch(function(){root.querySelector('[data-chapter-featured]').innerHTML='<p class="chapter-loading">活动加载失败，请刷新页面重试。</p>';});
})();
