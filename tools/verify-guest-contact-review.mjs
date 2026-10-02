// Read-only layout and image decoding through guarded page evaluation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launch,until} from './cdp.mjs';
const out=new URL('out/',import.meta.url),p=await launch({port:9568,width:1440,height:1000,gpu:false}),report={slides:[],decodedPairs:0};
try{
  await p.goto(new URL('guest-contact-review.html',out).href);
  await until(()=>p.eval('!!window.__guestContactReview'));
  assert.equal(await p.eval('__guestContactReview.slides.length'),5);
  for(let i=0;i<5;i++){
    await p.eval(`__guestContactReview.show(${i});true`);
    const count=await p.eval(`__guestContactReview.slides[${i}].frames?.length||0`);
    for(let n=0;n<count;n++){
      await p.eval(`__guestContactReview.frame(${n});true`);
      await until(()=>p.eval('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
      report.decodedPairs++;
    }
    if(count)await p.eval('__guestContactReview.frame(0);true');
    await until(()=>p.eval('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
    const layout=await p.eval('({title:document.getElementById("title").textContent,footer:document.querySelector("footer").getBoundingClientRect().bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,pointerLock:!!document.pointerLockElement})');
    assert.ok(layout.footer<=layout.height+.5);assert.equal(layout.overflow,false);assert.equal(layout.pointerLock,false);
    report.slides.push(layout);await p.shot(new URL('guest-contact-slide-'+(i+1)+'.png',out).pathname.replace(/^\//,''));
  }
  assert.equal(report.decodedPairs,7);report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);
  fs.writeFileSync(new URL('guest-contact-review-report.json',out),JSON.stringify(report,null,2));
  console.log('COMPLETE five guest-contact slides, seven decoded sample pairs, visible navigation, no overflow, errors or pointer lock.');
}finally{p.kill();}
