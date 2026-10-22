import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer.js';
import {JSDOM} from '../qa/node_modules/jsdom/lib/api.js';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {preparePhone,scenePose} from '../src/phone-scene.js';
import {drawPhoneScreen,LOCKSCREEN_CROP,SCREEN_W,SCREEN_H} from '../src/phone-screen.js';

const bytes=fs.readFileSync('../research/iphone17promax-decoded.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const {phone,screen}=preparePhone(gltf,null);
assert(screen);assert.equal(phone.children.length,16);
const body=phone.children.find(m=>m.name==='17ProMax_color');
assert.equal(body.material.color.getHex(),0x303c56);
assert(body.material.metalness>.7);
const calls=[],written=[];
const mock=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):key==='drawImage'? (...args)=>calls.push(args):key==='fillText'?(value)=>written.push(value):()=>{},set:()=>true});
const reference={};drawPhoneScreen(mock,{time:0,lockscreen:reference});
assert.deepEqual(calls[0],[reference,LOCKSCREEN_CROP.x,LOCKSCREEN_CROP.y,LOCKSCREEN_CROP.width,LOCKSCREEN_CROP.height,0,0,SCREEN_W,SCREEN_H]);
assert(!written.includes('Заходи в айшмот'));
drawPhoneScreen(mock,{time:6,lockscreen:reference});
assert(written.includes('Заходи в айшмот'));
assert(written.includes('Центр уведомлений'));
assert(!written.some(s=>/Аккумулятор|Устройство|100%/.test(s)));
const bounds=new THREE.Box3().setFromObject(phone),size=bounds.getSize(new THREE.Vector3());
assert(Math.abs(size.y-6.5)<.001);assert(size.z>.4&&size.z<.7);assert(size.x>3&&size.x<3.3);
screen.geometry.computeBoundingBox();
assert(screen.geometry.boundingBox.min.z>0,'Display must face +Z');
const normal=screen.geometry.attributes.normal;
assert([...Array(normal.count).keys()].some(i=>normal.getZ(i)>.9),'Display front normals');
const back=scenePose(0),front=scenePose(5.5),reduced=scenePose(0,true);
assert(back.y>2.5&&back.power===0);assert(Math.abs(front.y)<.15&&front.power===1&&front.notification===1);
assert(reduced.power===1&&reduced.notification===1);
assert(scenePose(2.25).y>-.05,'The turn should still be visible after the old end time');
assert(scenePose(3.05).notification===0,'The notification should wait until the turn ends');
let previous=scenePose(.55).y;
for(let t=.56;t<=2.5;t+=.01){let pose=scenePose(t);assert(pose.y<=previous+.000001);assert(previous-pose.y<.05);previous=pose.y;}
for(const child of phone.children){assert(child.geometry.attributes.position.count>0);assert(!child.material.map);}
console.log('3D checks passed:',phone.children.length,'meshes; dimensions',size.toArray().map(n=>n.toFixed(3)).join(' × '));
fs.writeFileSync('../qa/phone-meshes.json',JSON.stringify(phone.children.map(m=>({name:m.name,position:Array.from(m.geometry.attributes.position.array),normal:Array.from(m.geometry.attributes.normal.array),uv:Array.from(m.geometry.attributes.uv?.array||[]),indices:Array.from(m.geometry.index.array),color:m.material.color.toArray(),metalness:m.material.metalness||0,roughness:m.material.roughness||0}))));

// Offline geometry diagnostic, not a browser screenshot. No browser automation.
globalThis.document=new JSDOM('<!doctype html>').window.document;
const preview=createCanvas(1200,760),ctx=preview.getContext('2d');ctx.fillStyle='#101b16';ctx.fillRect(0,0,1200,760);
const screenPng=fs.readFileSync('../qa/phone-screen.png').toString('base64');
for(const [i,y] of [2.72,1.25,-.07].entries()){
 const scene=new THREE.Scene();scene.add(new THREE.AmbientLight(0xffffff,1.1));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-4,7,9);scene.add(light);
 const model=phone.clone();model.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshLambertMaterial({color:o.material.color,side:THREE.DoubleSide});if(o.name==='17ProMax_glass')o.visible=false;}});
 model.rotation.set(.04,y,-.04);scene.add(model);scene.updateMatrixWorld(true);
 const camera=new THREE.OrthographicCamera(-2.1,2.1,3.99,-3.99,.1,40);camera.position.z=14;camera.updateMatrixWorld(true);
 const renderer=new SVGRenderer();renderer.setSize(400,760);renderer.setPrecision(2);renderer.render(scene,camera);
 let svg=renderer.domElement.outerHTML;
 if(i===2){
  const b=screen.geometry.boundingBox;
  const p=(x,y)=>new THREE.Vector3(x,y,b.max.z+.001).applyMatrix4(model.matrixWorld).project(camera);
  const a=p(b.min.x,b.max.y),r=p(b.max.x,b.max.y),c=p(b.min.x,b.min.y);
  const x=a.x*200,yy=-a.y*380,xx=r.x*200,yr=-r.y*380,xc=c.x*200,yc=-c.y*380;
  const transform=`matrix(${(xx-x)/768} ${(yr-yy)/768} ${(xc-x)/1664} ${(yc-yy)/1664} ${x} ${yy})`;
  svg=svg.replace('</svg>',`<defs><clipPath id="display"><rect width="768" height="1664" rx="85"/></clipPath></defs><image width="768" height="1664" transform="${transform}" clip-path="url(#display)" href="data:image/png;base64,${screenPng}"/></svg>`);
 }
 // SVGRenderer sets a CSS background on its root. Keep the diagnostic transparent.
 svg=svg.replace(/style="[^"]*"(?=>)/,'');
 fs.writeFileSync(`../qa/phone-geometry-${i}.svg`,svg);
 const image=await loadImage(Buffer.from(svg));ctx.drawImage(image,i*400,0);
}
fs.writeFileSync('../qa/phone-geometry.png',preview.toBuffer('image/png'));
console.log('Offline geometry preview saved. Actual WebGL/browser rendering still needs visual QA.');
