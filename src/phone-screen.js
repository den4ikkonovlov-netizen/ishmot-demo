export const SCREEN_W=768,SCREEN_H=1664;
const clamp=n=>Math.max(0,Math.min(1,n));
export function round(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function text(ctx,value,x,y,size,weight=400,color='#fff',align='left'){
 ctx.font=`${weight} ${size}px "Arial", sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,y);
}
function circle(ctx,x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
export const LOCKSCREEN_CROP={x:144,y:90,width:638,height:1380};
export function drawPhoneScreen(ctx,{time=0,avatar=null,lockscreen=null,now=new Date()}={}){
 ctx.clearRect(0,0,SCREEN_W,SCREEN_H);
 ctx.fillStyle='#08090a';ctx.fillRect(0,0,SCREEN_W,SCREEN_H);
 if(lockscreen){
  const c=LOCKSCREEN_CROP;
  ctx.drawImage(lockscreen,c.x,c.y,c.width,c.height,0,0,SCREEN_W,SCREEN_H);
  // The wallpaper is a clean still. All lock-screen text uses Moscow wall time.
  const date=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',weekday:'short',day:'numeric',month:'long'}).format(now);
  const clock=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
  ctx.save();ctx.shadowColor='#c6e8ff88';ctx.shadowBlur=16;
  text(ctx,date.charAt(0).toUpperCase()+date.slice(1),SCREEN_W/2,166,38,500,'#e9f3f9','center');
  ctx.font='200 211px "Arial",sans-serif';ctx.textAlign='center';ctx.fillStyle='#dce9f0c9';ctx.fillText(clock,SCREEN_W/2,384);
  ctx.restore();
  text(ctx,'МТС',68,59,28,500,'#eaf4fa');
 }
 // A single arrival, gently settling into place instead of flashing repeatedly.
 const progress=clamp((time-3.05)/.58),ease=1-Math.pow(1-progress,3);
 if(progress>0){
  ctx.save();ctx.globalAlpha=ease;ctx.translate(0,410-36*(1-ease));
  ctx.shadowColor='#031523e0';ctx.shadowBlur=15;ctx.shadowOffsetY=3;
  text(ctx,'Центр уведомлений',48,592,43,500,'#eef5fa');
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  circle(ctx,699,575,28,'#183a55d9');
  ctx.strokeStyle='#c9e0ef';ctx.lineWidth=2.5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(690,566);ctx.lineTo(708,584);ctx.moveTo(708,566);ctx.lineTo(690,584);ctx.stroke();
  ctx.shadowColor='#06121f55';ctx.shadowBlur=25;ctx.shadowOffsetY=12;
  const g=ctx.createLinearGradient(40,620,728,840);g.addColorStop(0,'#eef0f1df');g.addColorStop(1,'#d3d6d8ef');round(ctx,32,613,704,227,44,g);
  ctx.shadowColor='transparent';ctx.strokeStyle='#ffffffb3';ctx.lineWidth=2;ctx.stroke();
  round(ctx,62,639,34,34,9,'#40be67');round(ctx,69,648,20,14,5,'white');ctx.fillStyle='white';ctx.beginPath();ctx.moveTo(73,660);ctx.lineTo(72,666);ctx.lineTo(81,659);ctx.fill();
  text(ctx,'СООБЩЕНИЯ',111,664,27,700,'#25323e');text(ctx,'сейчас',700,664,22,500,'#48545d','right');
  circle(ctx,111,749,42,'#77939a');
  if(avatar){ctx.save();ctx.beginPath();ctx.arc(111,749,42,0,Math.PI*2);ctx.clip();ctx.drawImage(avatar,585,13,124,145,69,707,84,92);ctx.restore();}
  else text(ctx,'ТК',111,759,27,600,'#fff','center');
  text(ctx,'Тим Кук',177,735,34,700,'#191b1e');text(ctx,'Заходи в айшмот',177,784,39,400,'#242629');
  ctx.restore();
 }
}
