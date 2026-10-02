// Static review layout observation; no input events or pointer lock.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launch,until} from './cdp.mjs';
const label=process.argv[2]||'foliage-batching',sections=Number(process.argv[3]||25),out=new URL('out/',import.meta.url),p=await launch({port:9508,width:1440,height:1000,gpu:false});
try{
 await p.goto(new URL('current-review.html',out).href);
 await until(()=>p.eval('!!document.querySelector("select")'));
 let frameId;await until(async()=>{frameId=(await p.call('Page.getFrameTree')).frameTree.childFrames?.[0]?.frame.id;return !!frameId;});
 // file:// frames have separate origins. Observe the child's own DOM through
 // CDP without disabling browser security or requesting parent DOM access.
 const {executionContextId}=await p.call('Page.createIsolatedWorld',{frameId,worldName:'static-receipt-observation'});
 const child=async expression=>{const r=await p.call('Runtime.evaluate',{expression,contextId:executionContextId,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 await until(()=>child('!!document.querySelector(".stage,table")&&[...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
 const report=await p.eval(`({version:document.title,sections:document.querySelector('select').options.length,frameHeight:document.querySelector('iframe').clientHeight,parentOverflow:document.documentElement.scrollWidth>innerWidth,parentPointerLock:!!document.pointerLockElement})`);
 Object.assign(report,await child(`({contentWidth:document.querySelector('.stage,table').clientWidth,contentKind:document.querySelector('.stage,table').tagName,frameFooterBottom:document.querySelector('footer').getBoundingClientRect().bottom,frameViewport:innerHeight,childOverflow:document.documentElement.scrollWidth>innerWidth,childPointerLock:!!document.pointerLockElement})`));
 report.horizontalOverflow=report.parentOverflow||report.childOverflow;report.pointerLock=report.parentPointerLock||report.childPointerLock;
 assert.equal(report.sections,sections);assert.ok(report.contentWidth>=650);assert.ok(report.frameFooterBottom<=report.frameViewport+.5);assert.equal(report.horizontalOverflow,false);assert.equal(report.pointerLock,false);
 await p.shot(new URL('current-review.png',out).pathname.replace(/^\//,''));
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);
 fs.writeFileSync(new URL(label+'-hub-report.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{p.kill();}
