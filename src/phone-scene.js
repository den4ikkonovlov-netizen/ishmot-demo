import * as THREE from '../tooling/node_modules/three/build/three.module.js';
import {GLTFLoader} from '../tooling/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {drawPhoneScreen,SCREEN_W,SCREEN_H} from './phone-screen.js';

const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10)};
export function scenePose(t,reduced=false){
 if(reduced)return{x:.025,y:-.07,z:-.025,lift:0,scale:1,power:1,notification:1};
 const turn=smooth((t-.55)/1.95),arrival=smooth(t/1.05),idle=smooth((t-3.75)/1.3);
 return{x:.12*(1-turn)+.035*turn+idle*Math.sin(t*.44)*.018,y:2.72*(1-turn)-.075*turn+idle*Math.sin(t*.34)*.045,z:.11*(1-turn)-.035*turn+idle*Math.sin(t*.29)*.009,lift:-.22*(1-arrival)+idle*Math.sin(t*.6)*.035,scale:.94+.06*arrival,power:smooth((t-2.05)/.58),notification:clamp((t-3.05)/.58)};
}
export function preparePhone(gltf,screenTexture){
 const phone=new THREE.Group();phone.name='iPhone 17 Pro Max — Fiq KM';
 const orient=new THREE.Matrix4().set(-1,0,0,0, 0,0,-1,0, 0,-1,0,0, 0,0,0,1);
 gltf.scene.updateMatrixWorld(true);
 let screen;
 const palette={
  '17ProMax_color':[0x303c56,.84,.31], '17ProMax_color3':[0x384660,.76,.3],
  '17ProMax_color2':[0x26324b,.12,.29], '17ProMax_Logo':[0x182238,.62,.25],
  '17ProMax_Black2':[0x030506,.05,.5], '17ProMax_black1':[0x12161c,.75,.22],
  '17ProMax_21':[0xf8f2da,.12,.32], '17ProMax_22':[0xe7dbb5,.2,.25],
  '17ProMax_2222':[0x1e2227,.55,.27], '17ProMax_G':[0x252a30,.7,.24],
  '17ProMax_1111':[0x171b20,.7,.28], '17ProMax_Lens':[0x080e19,.35,.09],
  '17ProMax_Lens2':[0x0a1017,.1,.6], '17ProMax_2112':[0x030609,.05,.5]
 };
 gltf.scene.traverse(source=>{
  if(!source.isMesh)return;
  const geo=source.geometry.clone();
  for(const [key,attribute] of Object.entries(geo.attributes))if(attribute.isInterleavedBufferAttribute){
   const array=new Float32Array(attribute.count*attribute.itemSize);
   for(let i=0;i<attribute.count;i++)for(let j=0;j<attribute.itemSize;j++)array[i*attribute.itemSize+j]=attribute.getComponent(i,j);
   geo.setAttribute(key,new THREE.BufferAttribute(array,attribute.itemSize));
  }
  geo.applyMatrix4(source.matrixWorld).applyMatrix4(orient);
  const name=source.material.name;let material;
  if(name==='17ProMax_Screen'){
   geo.computeBoundingBox();const box=geo.boundingBox,size=box.getSize(new THREE.Vector3()),p=geo.attributes.position,uv=new Float32Array(p.count*2);
   for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)-box.min.x)/size.x;uv[i*2+1]=(p.getY(i)-box.min.y)/size.y;}
   geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
   material=new THREE.MeshBasicMaterial({map:screenTexture,color:0x000000,toneMapped:false});
  }else if(name==='17ProMax_2112'){
   material=new THREE.MeshBasicMaterial({color:0x030506,toneMapped:false});
  }else if(name==='17ProMax_glass'){
   material=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.035,ior:1.52,clearcoat:1,transparent:true,opacity:.025,depthWrite:false});
  }else{
   const [color,metalness,roughness]=palette[name]||[0x9ba3ac,.6,.3];
   const lens=name.includes('Lens'),back=name==='17ProMax_color2';
   material=new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:lens?1:back?.45:.1,clearcoatRoughness:lens?.07:.22,envMapIntensity:lens?1.25:1});
  }
  material.name=name;const mesh=new THREE.Mesh(geo,material);mesh.name=name;phone.add(mesh);if(name==='17ProMax_Screen')screen=mesh;
 });
 const bounds=new THREE.Box3().setFromObject(phone),center=bounds.getCenter(new THREE.Vector3()),scale=6.5/bounds.getSize(new THREE.Vector3()).y;
 for(const mesh of phone.children){mesh.geometry.translate(-center.x,-center.y,-center.z);mesh.geometry.scale(scale,scale,scale);}
 return{phone,screen};
}

async function loadPhoneModel(){
 const loader=new GLTFLoader();
 if(location.protocol!=='file:'){
  const response=await fetch('assets/iphone17promax.glb');
  if(!response.ok)throw new Error(`Phone model: ${response.status}`);
  return loader.parseAsync(await response.arrayBuffer(),'');
 }
 // A classic script keeps the downloadable demo working when index.html is opened directly.
 await new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='assets/phone-model-fallback.js';
  script.onload=resolve;script.onerror=reject;
  document.head.append(script);
 });
 const encoded=window.__ISHMOT_PHONE_MODEL;
 delete window.__ISHMOT_PHONE_MODEL;
 if(!encoded)throw new Error('Phone model missing');
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 return loader.parseAsync(bytes.buffer,'');
}

async function start(){
 const host=document.querySelector('.phone-stage');if(!host)return;
 const hero=document.querySelector('.hero'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 const loadImage=url=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=url;});
 // Load the unchanged assets together while the renderer prepares its lighting.
 const media=Promise.all([loadImage('assets/tim-meme.png'),loadImage('assets/lockscreen-blank.png'),loadPhoneModel().catch(()=>null)]);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch{host.classList.remove('scene-pending');return;}
 renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio||1,1.5),2));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.domElement.className='phone-webgl';renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,50);camera.position.set(0,0,14.2);
 // Dark studio with broad softboxes and narrow edge reflections. Neutral light
 // preserves Deep Blue instead of tinting the aluminum green with the page.
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x161b24);
 const panel=(w,h,x,y,z,intensity,color)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);studio.add(m);};
 panel(4,8,-5,3,5,4,0xf4f7ff);panel(1.2,8,5,1,-3,5,0xe2edff);panel(7,3,0,7,0,3,0xffffff);panel(6,5,2,-1,6,.6,0xffffff);
 const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.025);scene.environment=env.texture;scene.environmentIntensity=.9;
 studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});pmrem.dispose();
 const key=new THREE.DirectionalLight(0xf4f7ff,1.5);key.position.set(-5,5,7);scene.add(key);
 const edge=new THREE.DirectionalLight(0xdce9ff,1.7);edge.position.set(4,2,-4);scene.add(edge);
 const fill=new THREE.DirectionalLight(0xffffff,.3);fill.position.set(-4,-2,2);scene.add(fill);
 const screenScale=1.5;
 const canvas=document.createElement('canvas');canvas.width=SCREEN_W*screenScale;canvas.height=SCREEN_H*screenScale;const ctx=canvas.getContext('2d');if(!ctx){renderer.dispose();env.dispose();host.classList.remove('scene-pending');return;}
 ctx.scale(screenScale,screenScale);ctx.imageSmoothingQuality='high';
 const [avatar,lockscreen,gltf]=await media;let screenDirty=true;
 if(!gltf||!lockscreen){renderer.dispose();env.dispose();host.classList.remove('scene-pending');return;}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
 texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
 const {phone,screen}=preparePhone(gltf,texture);if(!screen){renderer.dispose();host.classList.remove('scene-pending');return;}scene.add(phone);
 gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
 host.append(renderer.domElement);
 let elapsed=0,last=0,frame=0,visible=true,lastScreen=-1,lastMinute=-1,px=0,py=0,rx=0,ry=0,hover=0,hoverTarget=0;
 function resize(){const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.position.z=Math.max(14.2,7.1/camera.aspect);camera.updateProjectionMatrix();request();}
 function draw(stamp){
  frame=0;if(document.hidden||!visible){last=0;return;}
  if(last)elapsed+=Math.min((stamp-last)/1000,.05);last=stamp;
  const t=motion.matches?5.5:elapsed,pose=scenePose(t,motion.matches);
  rx+=(px-rx)*.055;ry+=(py-ry)*.055;hover+=(hoverTarget-hover)*.075;
  const idle=smooth((t-3.75)/1.3),pointer=motion.matches?0:idle;
  phone.rotation.set(pose.x+ry*(.035+hover*.13)*pointer,pose.y+rx*(.07+hover*.23)*pointer,pose.z);phone.position.y=pose.lift+hover*ry*.11*pointer;phone.position.z=hover*.26*pointer;phone.scale.setScalar(pose.scale*(1+hover*.045*pointer));
  screen.material.color.setScalar(pose.power);
  const minute=Math.floor(Date.now()/60000),notify=Math.round(pose.notification*60);
  if(screenDirty||notify!==lastScreen||minute!==lastMinute){drawPhoneScreen(ctx,{time:t,avatar,lockscreen});texture.needsUpdate=true;lastScreen=notify;lastMinute=minute;screenDirty=false;}
  renderer.render(scene,camera);host.classList.add('scene-ready');host.classList.remove('scene-pending');
  host.dataset.phase=t<.55?'back':t<2.5?'turning':t<3.05?'screen':'message';
  if(!motion.matches)request();
 }
 function request(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
 resize();if('ResizeObserver'in window)new ResizeObserver(resize).observe(host);else window.addEventListener('resize',resize,{passive:true});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;request();}else{cancelAnimationFrame(frame);frame=0;last=0;}},{threshold:0}).observe(host);
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();});
 motion.addEventListener?.('change',()=>{screenDirty=true;last=0;request();});
 setInterval(()=>{if(motion.matches&&visible&&!document.hidden){screenDirty=true;request();}},60000);
 hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=hero.getBoundingClientRect(),h=host.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;const cx=h.left+h.width*.5,cy=h.top+h.height*.49;hoverTarget=clamp(1-Math.hypot((e.clientX-cx)/(h.width*.58),(e.clientY-cy)/(h.height*.58)));},{passive:true});
 hero.addEventListener('pointerleave',()=>{px=py=0;hoverTarget=0;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;visible=false;host.classList.remove('scene-ready');});
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;last=0;});
 window.addEventListener('pageshow',()=>{last=0;request();});
 request();
}
if(typeof document!=='undefined')start().catch(()=>document.querySelector('.phone-stage')?.classList.remove('scene-pending'));
