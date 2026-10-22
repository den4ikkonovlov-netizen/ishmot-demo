'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const {products,services}=window.SHOP_DATA;
const format=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
const normalize=s=>s.toLowerCase().replace(/[р]/g,'p').replace(/[о]/g,'o').replace(/[е]/g,'e').replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Keep imported source text in data.js; presentation removes emoji and UI debris.
function cleanDescription(text){
 return String(text||'').replace(/Показать\s*ещ[её]/gi,'').replace(/[\p{Extended_Pictographic}\uFE0E\uFE0F\u200D]/gu,'').replace(/[\u2190-\u21ff✓✔☑]/g,'').split(/\r?\n/).map(s=>s.replace(/^[\s*•●▪▫►▸\-–—]+/,'').replace(/([а-яё])([A-Za-z])/g,'$1 $2').replace(/[ \t\u00a0]+/g,' ').trim()).filter(Boolean);
}
function formatDescriptionLines(lines){
 let html='',specs=[],list=[];
 const flushSpecs=()=>{if(specs.length){html+='<dl>'+specs.map(([k,v])=>`<div class="spec-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')+'</dl>';specs=[]}};
 const flushList=()=>{if(list.length){html+='<ul>'+list.map(s=>`<li>${esc(s)}</li>`).join('')+'</ul>';list=[]}};
 for(const line of lines){
  if(/^(Характеристики|Преимущества|Виды оплаты|В услугу входит|Комплектация|Описание|Стоимость|Условия)[\s:]*$/i.test(line)){flushSpecs();flushList();html+=`<h3>${esc(line.replace(/:$/,''))}</h3>`;continue}
  const match=line.match(/^([^:—]{2,48})\s*(?:[:]| — )\s*(.+)$/);
  if(match&&!/^https?/i.test(line)&&!/^(Цена|При оплате|Если|Полностью)/i.test(line)){flushList();specs.push([match[1],match[2]]);continue}
  flushSpecs();
  if(line.length<130){list.push(line)}else{flushList();html+=`<p>${esc(line)}</p>`}
 }
 flushSpecs();flushList();return html;
}
function renderDescription(item){
 const main=[],terms=[];
 let inTerms=false;
 for(const line of cleanDescription(item.description)){
  if(/^(Виды оплаты|Цена за товар|При оплате|Товар представленный|Товар, представленный)/i.test(line))inTerms=true;
  if(inTerms||/рассрочк|кредит без|наличный расч[её]т/i.test(line)){terms.push(line);continue}
  main.push(line);
 }
 let result='<h3>'+(item.category==='Сервис'?'Об услуге':'О товаре')+'</h3>'+formatDescriptionLines(main);
 if(['14651329','14651302'].includes(item.id))result+='<p class="source-conflict">В карточке магазина есть расхождения в характеристиках. Перед покупкой уточните точную комплектацию у продавца.</p>';
 if(terms.length)result+='<details><summary>Оплата, получение и условия</summary>'+formatDescriptionLines(terms)+'</details>';
 return result;
}
let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem('ishmot-favorites')||'[]'))}catch{}
let state={category:'Все',query:'',sort:'default',limit:12};
let activeItem=null,photoIndex=0,previousFocus=null,toastTimer;
function notify(message){$('.toast').textContent=message;$('.toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('show'),2200)}
function save(id){if(saved.has(id)){saved.delete(id);notify('Убрали из избранного')}else{saved.add(id);notify('Сохранили. Вернётесь к нему позже.')}try{localStorage.setItem('ishmot-favorites',JSON.stringify([...saved]))}catch{}updateSaved()}
function updateSaved(){$('#saved-count').textContent=saved.size;$$('.nav-saved-count').forEach(b=>{b.textContent=saved.size;b.setAttribute('aria-label',`${saved.size} сохранённых товаров`)});$$('[data-save]').forEach(b=>{const on=saved.has(b.dataset.save);b.classList.toggle('saved',on);b.textContent=on?'♥':'♡';b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'Удалить из избранного':'Добавить в избранное')});if(activeItem){$('#modal-save').textContent=saved.has(activeItem.id)?'♥':'♡';$('#modal-save').setAttribute('aria-pressed',saved.has(activeItem.id))}}
window.addEventListener('storage',e=>{if(e.key==='ishmot-favorites'){try{saved=new Set(JSON.parse(e.newValue||'[]'))}catch{saved=new Set()}updateSaved()}});
const featuredProducts=['14654435','12600835','14247541','12960858','12729455','12483240','11965810','12491282'];
const featuredRank=new Map(featuredProducts.map((id,index)=>[id,index]));
const categoryRank={'iPhone':0,'Аксессуары':1,'Android':2,'Компьютеры':3};
function selectedProducts(){let a=products.filter(p=>(state.category==='Все'||p.category===state.category)&&(!state.query||normalize(p.title+' '+p.description).includes(normalize(state.query))));if(state.sort==='default'&&state.category==='Все')a.sort((a,b)=>(featuredRank.get(a.id)??100+categoryRank[a.category]*100)-(featuredRank.get(b.id)??100+categoryRank[b.category]*100));if(state.sort==='price-asc')a.sort((a,b)=>a.price-b.price);if(state.sort==='price-desc')a.sort((a,b)=>b.price-a.price);if(state.sort==='name')a.sort((a,b)=>a.title.localeCompare(b.title,'ru'));return a}
function productCard(p){return `<article class="product-card" data-card="${esc(p.id)}"><button class="product-image" data-product="${esc(p.id)}" aria-label="Подробнее: ${esc(p.title)}"><img src="${esc(p.images[0]||'assets/photo-unavailable.svg')}" alt="${esc(p.title)}" loading="lazy" width="540" height="540">${p.images[1]?`<img class="hover-image" src="${esc(p.images[1])}" alt="" loading="lazy" width="540" height="540">`:''}${p.oldPrice>p.price?`<span class="product-tag">−${Math.round((1-p.price/p.oldPrice)*100)}%</span>`:''}<span class="view-product" aria-hidden="true">Рассмотреть</span></button><button class="save-button" data-save="${esc(p.id)}" aria-label="Добавить в избранное" aria-pressed="false">♡</button><div class="product-meta"><span>${esc(p.category.toUpperCase())}</span><span>${p.images.length} ФОТО</span></div><button class="product-title" data-product="${esc(p.id)}">${esc(p.title)}</button><div class="product-price"><strong>${format(p.price)}</strong>${p.oldPrice>p.price?`<del>${format(p.oldPrice)}</del>`:''}</div><button class="product-details f7-button" data-product="${esc(p.id)}"><img class="ui-icon" src="assets/icons/images-outline.svg" alt="" aria-hidden="true">Фото и описание</button></article>`}
function renderProducts(){const list=selectedProducts();$('#result-count').textContent=`НАЙДЕНО: ${list.length} / ${products.length} ТОВАРОВ`;$('#page-count').textContent=`${Math.min(state.limit,list.length)} / ${list.length}`;$('#empty-state').hidden=!!list.length;$('#show-more').hidden=state.limit>=list.length;
$('#product-grid').innerHTML=list.slice(0,state.limit).map(productCard).join('');
updateSaved();}
$$('[data-category]').forEach(b=>{const count=products.filter(p=>b.dataset.category==='Все'||p.category===b.dataset.category).length;if(b.dataset.category!=='Все')b.innerHTML=esc(b.dataset.category)+` <sup>${count}</sup>`;b.addEventListener('click',()=>{state.category=b.dataset.category;state.limit=12;$$('[data-category]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});renderProducts()})});
$('#search').addEventListener('input',e=>{state.query=e.target.value;state.limit=12;renderProducts()});
$('#sort').addEventListener('change',e=>{state.sort=e.target.value;renderProducts()});
$('#show-more').addEventListener('click',()=>{state.limit+=12;renderProducts()});
$('#reset-filters').addEventListener('click',()=>{state={category:'Все',query:'',sort:'default',limit:12};$('#search').value='';$('#sort').value='default';$$('[data-category]').forEach(x=>{x.classList.toggle('active',x.dataset.category==='Все');x.setAttribute('aria-pressed',x.dataset.category==='Все')});renderProducts()});
$('#product-grid').addEventListener('click',e=>{const f=e.target.closest('[data-save]');if(f){save(f.dataset.save);return}const b=e.target.closest('[data-product],[data-card]');if(b)openItem(products.find(p=>p.id===(b.dataset.product||b.dataset.card)))});
function displayImages(item){return item.id==='vk-service-1'?['assets/shop-24.jpg']:item.images.length?item.images:['assets/photo-unavailable.svg']}
function updatePhoto(){const imgs=displayImages(activeItem);photoIndex=(photoIndex+imgs.length)%imgs.length;$('#modal-image').src=imgs[photoIndex];$('#modal-image').alt=activeItem.title+' — фото '+(photoIndex+1);$('#photo-count').textContent=`${photoIndex+1} / ${imgs.length}`;$('#photo-prev').hidden=$('#photo-next').hidden=imgs.length<2;$('#modal-thumbs').innerHTML=imgs.map((src,i)=>`<button class="${i===photoIndex?'active':''}" data-photo="${i}" aria-label="Фотография ${i+1}" aria-pressed="${i===photoIndex}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}
function openItem(item){if(!item)return;activeItem=item;photoIndex=0;previousFocus=document.activeElement;$('#modal-title').textContent=item.title;$('#modal-category').textContent=item.category==='Сервис'?(item.source.includes('vk.ru')?'СЕРВИС / ПРАЙС ВК':'СЕРВИС / ПРАЙС САЙТА'):item.category.toUpperCase()+' / АЙШМОТ';$('#modal-price').textContent=item.priceLabel|| (item.price?format(item.price):'Стоимость в описании');$('#modal-old-price').textContent=item.oldPrice>item.price?format(item.oldPrice):'';$('#modal-availability').textContent=item.unavailable?'В источнике отмечено «Нет в наличии». Уточните доступность услуги.':item.category==='Сервис'?'Подробная стоимость по моделям и условия — ниже.':'Наличие и условия оплаты уточняйте у консультанта.';$('#modal-description').innerHTML=renderDescription(item);$('#modal-vk').href=item.source;$('#modal-vk').innerHTML=(item.source.includes('vk.ru')?'Открыть в ВК':'Открыть на сайте')+' ';$('#modal-save').hidden=item.category==='Сервис';updatePhoto();updateSaved();const dialog=$('#product-dialog');if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal()}else{dialog.setAttribute('open','');dialog.classList.add('dialog-fallback')}$('#product-dialog').scrollTop=0;document.body.classList.add('modal-open');$('.modal-close').focus()}
function closeModal(){const dialog=$('#product-dialog');if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');dialog.classList.remove('dialog-fallback');dialog.dispatchEvent(new Event('close'))}}
$('.modal-close').addEventListener('click',closeModal);
$('#product-dialog').addEventListener('close',()=>{document.body.classList.remove('modal-open');previousFocus?.focus({preventScroll:true})});
$('#product-dialog').addEventListener('click',e=>{if(e.target===$('#product-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal()}});
$('#photo-prev').addEventListener('click',()=>{photoIndex--;updatePhoto()});$('#photo-next').addEventListener('click',()=>{photoIndex++;updatePhoto()});
$('#modal-thumbs').addEventListener('click',e=>{const b=e.target.closest('[data-photo]');if(b){photoIndex=+b.dataset.photo;updatePhoto()}});
$('#modal-save').addEventListener('click',()=>save(activeItem.id));
let touchStart=0;$('#modal-image').addEventListener('touchstart',e=>{touchStart=e.changedTouches[0].screenX},{passive:true});$('#modal-image').addEventListener('touchend',e=>{let dx=e.changedTouches[0].screenX-touchStart;if(Math.abs(dx)>50){photoIndex+=dx<0?1:-1;updatePhoto()}},{passive:true});
document.addEventListener('keydown',e=>{if($('#product-dialog').open){if(e.key==='Escape'){e.preventDefault();closeModal()}if(e.key==='ArrowRight'){photoIndex++;updatePhoto()}if(e.key==='ArrowLeft'){photoIndex--;updatePhoto()}}else if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus();$('#catalog').scrollIntoView({behavior:'smooth'})}});
let servicePage=0;
const servicePageSize=6;
function renderServices(){
 const q=normalize($('#service-search').value);
 const list=services.filter(s=>!s.source.includes('vk.ru')&&normalize(s.title+' '+s.description).includes(q));
 const pages=Math.max(1,Math.ceil(list.length/servicePageSize));servicePage=Math.max(0,Math.min(servicePage,pages-1));
 $('#service-list').innerHTML=list.slice(servicePage*servicePageSize,(servicePage+1)*servicePageSize).map((s,i)=>`<button class="service-row" data-service-id="${esc(s.id)}"><span class="service-num">${String(servicePage*servicePageSize+i+1).padStart(2,'0')}</span><span class="service-name">${esc(s.title)}</span><span class="service-price">${esc(s.priceLabel||(s.price?format(s.price):'В описании'))}</span></button>`).join('')||'<p class="service-note service-empty">Такой услуги не нашли. Попробуйте другое название.</p>';
 $('#service-page').textContent=list.length?`${servicePage+1} / ${pages} · ${list.length} услуг`:'Ничего не найдено';
 $('#service-prev').disabled=servicePage===0;$('#service-next').disabled=servicePage>=pages-1;
}
$('#service-search').addEventListener('input',()=>{servicePage=0;renderServices()});
$('#service-prev').addEventListener('click',()=>{servicePage--;renderServices()});
$('#service-next').addEventListener('click',()=>{servicePage++;renderServices()});
document.addEventListener('click',e=>{let b=e.target.closest('[data-service-id]');if(b)openItem(services.find(s=>s.id===b.dataset.serviceId))});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const showcase=$('.hero-showcase'),hero=$('.hero');
function updateClock(){const now=new Date();$('#local-clock').textContent=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(now);const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',hour:'2-digit',hourCycle:'h23'}).format(now));const open=hour>=12&&hour<21;const status=open?'Открыто до 21:00':'Ждём с 12:00';$('#shop-status').textContent=status;$('#shop-status-mobile').textContent=status;$('.clock-widget').classList.toggle('shop-closed',!open);$('.hero').classList.toggle('shop-closed',!open)}
updateClock();setInterval(()=>{if(!document.hidden)updateClock()},30000);
if('IntersectionObserver' in window)new IntersectionObserver(entries=>showcase.classList.toggle('offscreen',!entries[0].isIntersecting),{threshold:0}).observe(hero);
document.addEventListener('visibilitychange',()=>{showcase.classList.toggle('tab-hidden',document.hidden);if(!document.hidden)updateClock()});
$('.menu-toggle').addEventListener('click',()=>{const open=$('.header').classList.toggle('menu-open');$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',open?'Закрыть меню':'Открыть меню')});$$('.header nav a').forEach(a=>a.addEventListener('click',()=>{$('.header').classList.remove('menu-open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').setAttribute('aria-label','Открыть меню')}));
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'&&!e.target.src.endsWith('photo-unavailable.svg'))e.target.src='assets/photo-unavailable.svg'},true);
if('IntersectionObserver'in window&&!reduced){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}},{threshold:.08});$$('.section-heading,.trade-copy,.trade-visual,.trade-steps,.service-intro,.photo-editorial,.ways,.visit-layout').forEach(e=>{e.classList.add('reveal');observer.observe(e)})}
$('.hero').classList.add('intro-playing');
renderProducts();renderServices();
