'use strict';
(() => {
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 document.body.classList.add('motion-enhanced');
 const seen=new WeakSet();
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){entry.target.classList.remove('motion-pending');entry.target.classList.add('motion-in');observer.unobserve(entry.target)}
 },{rootMargin:'0px 0px 45px 0px',threshold:.08}):null;
 function watch(root=document){
  const targets=[...root.querySelectorAll('.product-card,.shop-intro,.about-note,.ways article')];
  targets.forEach((el,i)=>{if(seen.has(el))return;seen.add(el);el.style.setProperty('--motion-order',i%12);if(!observer)return;el.classList.add('motion-pending');observer.observe(el)});
 }
 watch();
 for(const grid of document.querySelectorAll('#product-grid,#favorites-grid'))new MutationObserver(()=>watch(grid)).observe(grid,{childList:true});
})();
