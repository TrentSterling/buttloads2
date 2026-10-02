// Guarded static layout observation; no input, focus or pointer lock.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launch,until} from './cdp.mjs';
const out=new URL('out/',import.meta.url),p=await launch({port:9574,width:1440,height:1000,gpu:false}),report={slides:[],decodedPairs:0};
try{
 await p.goto(new URL('branching-review.html',out).href);await until(()=>p.eval('!!window.__branchingReview'));assert.equal(await p.eval('__branchingReview.slides.length'),9);
 for(let i=0;i<9;i++){
  await p.eval(`__branchingReview.show(${i});true`);const count=await p.eval(`__branchingReview.slides[${i}].frames?.length||0`);
  for(let n=0;n<count;n++){
   await p.eval(`__branchingReview.frame(${n});true`);await until(()=>p.eval('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
   assert.equal(await p.eval(`(()=>{const s=__branchingReview.slides[${i}],f=s.frames[${n}],c=document.querySelectorAll('figcaption');return c[0].textContent===(f.beforeLabel||s.beforeLabel)&&c[1].textContent===(f.afterLabel||s.afterLabel);})()`),true);report.decodedPairs++;
  }
  if(count)await p.eval('__branchingReview.frame(0);true');await until(()=>p.eval('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
  const layout=await p.eval('({title:document.getElementById("title").textContent,footer:document.querySelector("footer").getBoundingClientRect().bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,pointerLock:!!document.pointerLockElement})');assert.ok(layout.footer<=layout.height+.5);assert.equal(layout.overflow,false);assert.equal(layout.pointerLock,false);report.slides.push(layout);await p.shot(new URL('branching-slide-'+(i+1)+'.png',out).pathname.replace(/^\//,''));
 }
 assert.equal(report.decodedPairs,18);report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);fs.writeFileSync(new URL('branching-review-report.json',out),JSON.stringify(report,null,2));console.log('COMPLETE nine branching slides, eighteen decoded pairs, visible navigation, no overflow, errors or pointer lock.');
}finally{p.kill();}
