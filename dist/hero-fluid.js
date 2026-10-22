'use strict';
(() => {
 const hero=document.querySelector('.hero');
 const field=hero?.querySelector('.hero-color-field');
 if(!field || matchMedia('(prefers-reduced-motion: reduce)').matches)return;

 const hasMouse=matchMedia('(hover: hover) and (pointer: fine)').matches;
 const mobile=matchMedia('(max-width: 600px)');
 const cursor={x:0,y:0,active:0,impulse:0};
 const target={x:0,y:0,active:0};
 let visible=true,frame=0;
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

 function tick(now){
  frame=0;
  if(!visible||document.hidden)return;
  const time=now*.001;
  cursor.x+=(target.x-cursor.x)*.055;
  cursor.y+=(target.y-cursor.y)*.055;
  cursor.active+=(target.active-cursor.active)*.045;
  cursor.impulse*=.965;

  const driftX=5*Math.sin(time*.48)+3*Math.sin(time*.27+1.5);
  const driftY=mobile.matches?3*Math.sin(time*.42):0;
  const pullX=mobile.matches?0:cursor.x*26*cursor.active;
  const tilt=mobile.matches?.12*Math.sin(time*.4):cursor.y*.48*cursor.active+.15*Math.sin(time*.38);
  const ripple=cursor.impulse*3.5*Math.sin(time*3.4);
  field.style.transform=`translate3d(${(driftX+pullX+ripple).toFixed(2)}px,${driftY.toFixed(2)}px,0) rotate(${tilt.toFixed(3)}deg)`;
  frame=requestAnimationFrame(tick);
 }
 function start(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick)}

 if(hasMouse){
  hero.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch')return;
   const box=hero.getBoundingClientRect();
   target.x=clamp((event.clientX-box.left)/box.width*2-1,-1,1);
   target.y=clamp((event.clientY-box.top)/box.height*2-1,-1,1);
   target.active=1;
   cursor.impulse=clamp(cursor.impulse+.12,0,1);
   start();
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{target.active=0});
 }
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  if(visible)start();
 },{rootMargin:'100px'}).observe(hero);
 document.addEventListener('visibilitychange',start);
 start();
})();
