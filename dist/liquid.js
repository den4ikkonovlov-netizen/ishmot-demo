'use strict';
(() => {
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const controls='button, a.button, a.f7-button, a.hero-service, a.header-phone, a.header-contact, a.service-message';
 function enhance(root){
  const nodes=[...(root.matches?.(controls)?[root]:[]),...root.querySelectorAll(controls)];
  for(const el of nodes)if(!el.closest('.category-tabs,.nav-island'))el.classList.add('glass-control');
 }
 enhance(document);
 for(const root of document.querySelectorAll('#product-grid,#favorites-grid,#service-list,#modal-thumbs')){
  new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)if(node.nodeType===1)enhance(node)}).observe(root,{childList:true,subtree:true});
 }
 let pressed=null,lightFrame=0,lightTarget=null,lightX=0,lightY=0;
 document.addEventListener('pointerdown',e=>{const el=e.target.closest('.glass-control');if(el&&e.button===0){pressed?.classList.remove('glass-pressed');pressed=el;el.classList.add('glass-pressed')}});
 const release=()=>{pressed?.classList.remove('glass-pressed');pressed=null};
 document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);window.addEventListener('blur',release);
 document.addEventListener('pointermove',e=>{
  if(reducedMotion||e.pointerType==='touch')return;
  const el=e.target.closest('.glass-control');if(!el)return;
  lightTarget=el;lightX=e.clientX;lightY=e.clientY;
  if(!lightFrame)lightFrame=requestAnimationFrame(()=>{lightFrame=0;if(!lightTarget?.isConnected)return;const r=lightTarget.getBoundingClientRect();if(!r.width||!r.height)return;lightTarget.style.setProperty('--glass-x',Math.max(0,Math.min(100,(lightX-r.left)/r.width*100))+'%');lightTarget.style.setProperty('--glass-y',Math.max(0,Math.min(100,(lightY-r.top)/r.height*100))+'%')});
 },{passive:true});
 function segmented(root,itemSelector,isCategory){
  const items=[...root.querySelectorAll(itemSelector)];
  const lens=document.createElement('span');lens.className='glass-lens';lens.setAttribute('aria-hidden','true');root.prepend(lens);
  let selected=items.find(b=>b.classList.contains('active'))||items[0],drag=null,suppressUntil=0;
  function place(item,offset=0){if(!item)return;const r=root.getBoundingClientRect(),b=item.getBoundingClientRect();if(!b.width||!b.height)return;root.style.setProperty('--lens-x',(b.left-r.left+root.scrollLeft+offset)+'px');root.style.setProperty('--lens-y',(b.top-r.top+root.scrollTop)+'px');root.style.setProperty('--lens-w',b.width+'px');root.style.setProperty('--lens-h',b.height+'px')}
  function sync(){if(isCategory)selected=items.find(b=>b.getAttribute('aria-pressed')==='true')||selected;else items.forEach(b=>b.dataset.glassSelected=String(b===selected));place(selected)}
  function nearest(x){let best=items[0],distance=Infinity;for(const item of items){const b=item.getBoundingClientRect(),d=Math.abs(x-(b.left+b.width/2));if(d<distance){distance=d;best=item}}return best}
  function cancel(){if(!drag)return;const id=drag.id;drag=null;root.classList.remove('glass-scrubbing');if(root.hasPointerCapture?.(id))root.releasePointerCapture(id);sync()}
  root.addEventListener('pointerdown',e=>{if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||!e.isPrimary&&e.isPrimary!==undefined)return;if(!isCategory&&getComputedStyle(root).flexDirection==='column')return;const target=e.target.closest(itemSelector);if(!target||!root.contains(target))return;const rect=lens.getBoundingClientRect(),fallback=selected.getBoundingClientRect();const r=rect.width?rect:fallback;drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,target,candidate:selected,moved:false,width:r.width,height:r.height,startLeft:r.left,startScroll:root.scrollLeft,top:r.top};try{root.setPointerCapture?.(e.pointerId)}catch{} });
  root.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
   if(!drag.moved&&Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){cancel();return}
   if(!drag.moved&&Math.abs(dx)<7)return;
   drag.moved=true;root.classList.add('glass-scrubbing');if(e.cancelable)e.preventDefault();
   const bounds=root.getBoundingClientRect();
   if(root.scrollWidth>root.clientWidth){if(e.clientX>bounds.right-28)root.scrollLeft+=14;if(e.clientX<bounds.left+28)root.scrollLeft-=14}
   const first=items[0].getBoundingClientRect(),last=items.at(-1).getBoundingClientRect();const minX=first.left-bounds.left+root.scrollLeft;const maxX=last.right-bounds.left+root.scrollLeft-drag.width;const raw=drag.startLeft-bounds.left+drag.startScroll+dx+(root.scrollLeft-drag.startScroll);const left=Math.max(minX,Math.min(maxX,raw));root.style.setProperty('--lens-x',left+'px');root.style.setProperty('--lens-y',(drag.top-bounds.top+root.scrollTop)+'px');root.style.setProperty('--lens-w',drag.width+'px');root.style.setProperty('--lens-h',drag.height+'px');drag.candidate=nearest(bounds.left+left-root.scrollLeft+drag.width/2);
  },{passive:false});
  root.addEventListener('pointerup',e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const finished=drag;drag=null;root.classList.remove('glass-scrubbing');
   if(root.hasPointerCapture?.(e.pointerId))root.releasePointerCapture(e.pointerId);
   selected=finished.moved?finished.candidate:finished.target;selected.click();selected.focus({preventScroll:true});suppressUntil=Date.now()+450;if(e.cancelable)e.preventDefault();
   sync();
  });
  root.addEventListener('pointercancel',cancel);root.addEventListener('lostpointercapture',cancel);
  root.addEventListener('dragstart',e=>e.preventDefault());
  root.addEventListener('click',e=>{if(Date.now()<suppressUntil&&e.detail>0){e.preventDefault();e.stopImmediatePropagation();suppressUntil=0}},true);
  root.addEventListener('click',e=>{const item=e.target.closest(itemSelector);if(item&&items.includes(item)){selected=item;sync()}});
  root.addEventListener('keydown',e=>{
   const item=e.target.closest(itemSelector);if(!item)return;const index=items.indexOf(item);let next;
   if(e.key==='ArrowRight')next=items[(index+1)%items.length];else if(e.key==='ArrowLeft')next=items[(index+items.length-1)%items.length];else if(e.key==='Home')next=items[0];else if(e.key==='End')next=items.at(-1);else return;
   e.preventDefault();selected=next;next.focus({preventScroll:true});next.click();if(isCategory)next.scrollIntoView({block:'nearest',inline:'nearest',behavior:reducedMotion?'auto':'smooth'});sync();
  });
  root.addEventListener('scroll',()=>{if(!drag)place(selected)},{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(()=>{if(!drag)sync()}).observe(root);
  window.addEventListener('resize',sync,{passive:true});document.fonts?.ready.then(sync);
  if(isCategory)new MutationObserver(()=>{if(!drag)sync()}).observe(root,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  sync();requestAnimationFrame(sync);
 }
 const categories=document.querySelector('.category-tabs');
 if(categories)segmented(categories,'button[data-category]',true);
 const navigation=document.querySelector('.nav-island');
 if(navigation)segmented(navigation,'a',false);
})();
