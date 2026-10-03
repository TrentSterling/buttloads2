// Guarded static receipt observation; no game input, focus or pointer lock.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launch,until} from './cdp.mjs';
const out=new URL('out/',import.meta.url),root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+pathname);
 if(pathname==='/favicon.ico'){res.writeHead(204);return res.end();}
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const bytes=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':'text/plain');res.end(bytes);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const p=await launch({port:9646,width:1440,height:1000,gpu:false}),report={date:new Date().toISOString(),slides:[],decodedPairs:0};
try{
 await p.goto(new URL('miner-collar-review.html',out).href);await until(()=>p.eval('!!window.__minerCollarReview'));assert.equal(await p.eval('__minerCollarReview.slides.length'),10);
 for(let i=0;i<10;i++){
  await p.eval(`__minerCollarReview.show(${i});true`);const count=await p.eval(`__minerCollarReview.slides[${i}].frames?.length||0`);
  for(let n=0;n<count;n++){
   await p.eval(`__minerCollarReview.frame(${n});true`);await until(()=>p.eval('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
   assert.equal(await p.eval(`(()=>{const s=__minerCollarReview.slides[${i}],f=s.frames[${n}],c=document.querySelectorAll('figcaption');return c[0].textContent===(f.beforeLabel||s.beforeLabel)&&c[1].textContent===(f.afterLabel||s.afterLabel);})()`),true);report.decodedPairs++;
  }
  if(count)await p.eval('__minerCollarReview.frame(0);true');await until(()=>p.eval('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
  const layout=await p.eval('({title:document.getElementById("title").textContent,footer:document.querySelector("footer").getBoundingClientRect().bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,pointerLock:!!document.pointerLockElement})');assert.ok(layout.footer<=layout.height+.5);assert.equal(layout.overflow,false);assert.equal(layout.pointerLock,false);report.slides.push(layout);await p.shot(new URL('miner-collar-slide-'+(i+1)+'.png',out).pathname.replace(/^\//,''));
 }
 assert.equal(report.decodedPairs,36);report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);fs.writeFileSync(new URL('miner-collar-review-report.json',out),JSON.stringify(report,null,2));console.log('COMPLETE ten collar slides, 36 decoded pairs, visible navigation, no overflow, errors or pointer lock.');
 await p.goto('http://127.0.0.1:'+server.address().port+'/tools/out/current-review.html');await until(()=>p.eval('!!document.querySelector("iframe")?.contentWindow?.__minerCollarReview'));await until(()=>p.eval('[...document.querySelector("iframe").contentDocument.images].every(i=>i.complete&&i.naturalWidth>0)'));
 const hub=await p.eval(`(()=>{const f=document.querySelector('iframe'),w=f.contentWindow,d=f.contentDocument;return{date:new Date().toISOString(),title:document.title,sections:document.querySelectorAll('option').length,frame:f.getAttribute('src'),parentOverflow:document.documentElement.scrollWidth>innerWidth,childOverflow:d.documentElement.scrollWidth>w.innerWidth,parentPointerLock:!!document.pointerLockElement,childPointerLock:!!d.pointerLockElement,footer:d.querySelector('footer').getBoundingClientRect().bottom,height:w.innerHeight,images:[...d.images].every(i=>i.complete&&i.naturalWidth>0)};})()`);
 assert.equal(hub.sections,63);assert.equal(hub.frame,'miner-collar-review.html');assert.equal(hub.parentOverflow,false);assert.equal(hub.childOverflow,false);assert.equal(hub.parentPointerLock,false);assert.equal(hub.childPointerLock,false);assert.ok(hub.footer<=hub.height+.5);assert.equal(hub.images,true);
 await p.shot(new URL('miner-collar-hub.png',out).pathname.replace(/^\//,''));hub.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(hub.errors,[]);fs.writeFileSync(new URL('miner-collar-hub-report.json',out),JSON.stringify(hub,null,2));console.log('COMPLETE current hub: 63 retained sections, collar default, visible navigation, no overflow or pointer lock.');
}finally{p.kill();server.close();}
