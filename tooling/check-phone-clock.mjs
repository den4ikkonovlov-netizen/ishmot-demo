import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {drawPhoneScreen,SCREEN_W,SCREEN_H} from '../src/phone-screen.js';

const ctx=createCanvas(SCREEN_W,SCREEN_H).getContext('2d');
const lockscreen=await loadImage('../dist/assets/lockscreen-blank.png');
const labels=[];
const fillText=ctx.fillText.bind(ctx);
ctx.fillText=(value,...args)=>{labels.push(String(value));return fillText(value,...args)};
drawPhoneScreen(ctx,{lockscreen,time:6,now:new Date('2026-10-21T21:07:00Z')});
assert(labels.includes('00:07'));
assert(labels.some(label=>label.includes('22 октября')));
labels.length=0;
drawPhoneScreen(ctx,{lockscreen,time:6,now:new Date('2026-10-22T09:42:00Z')});
assert(labels.includes('12:42'));
assert(labels.some(label=>label.includes('22 октября')));
console.log('Moscow lock-screen clock and date passed');
