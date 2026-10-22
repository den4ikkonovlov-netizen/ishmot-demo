import fs from 'node:fs';
import {build} from 'esbuild';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {drawPhoneScreen,SCREEN_W,SCREEN_H} from '../src/phone-screen.js';
import modelData from '../src/phone-model-data.js';

const model=Buffer.from(modelData,'base64');
fs.writeFileSync('../dist/assets/iphone17promax.glb',model);
fs.writeFileSync('../dist/assets/phone-model-fallback.js',`window.__ISHMOT_PHONE_MODEL=${JSON.stringify(modelData)};`);

const canvas=createCanvas(SCREEN_W,SCREEN_H),ctx=canvas.getContext('2d');
const avatar=await loadImage('../dist/assets/tim-meme.png');
const lockscreen=await loadImage('../dist/assets/lockscreen-blank.png');
drawPhoneScreen(ctx,{time:6,avatar,lockscreen});
const screen=canvas.toBuffer('image/png');fs.writeFileSync('../qa/phone-screen.png',screen);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="620" height="730" viewBox="0 0 620 730"><defs><linearGradient id="metal"><stop stop-color="#64718e"/><stop offset=".35" stop-color="#172139"/><stop offset=".7" stop-color="#4b5977"/><stop offset="1" stop-color="#29364e"/></linearGradient><clipPath id="screen"><rect x="175" y="45" width="270" height="585" rx="37"/></clipPath></defs><g transform="rotate(-3 310 365)"><rect x="169" y="39" width="282" height="597" rx="43" fill="url(#metal)"/><rect x="172" y="42" width="276" height="591" rx="40" fill="#030609"/><image x="175" y="45" width="270" height="585" clip-path="url(#screen)" href="data:image/png;base64,${screen.toString('base64')}"/><rect x="169" y="39" width="282" height="597" rx="43" fill="none" stroke="#657491" stroke-width="1"/></g></svg>`;
fs.writeFileSync('../dist/assets/phone-poster.svg',svg);
await build({entryPoints:['../src/phone-scene.js'],bundle:true,minify:true,format:'iife',target:['es2020'],outfile:'../dist/phone-scene.js',legalComments:'eof'});
console.log('Built model scene:',fs.statSync('../dist/phone-scene.js').size,'bytes; model:',model.length,'bytes');
