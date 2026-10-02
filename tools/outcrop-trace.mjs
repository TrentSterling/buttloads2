// Static, offline outcrop observation. No input, focus, fire or pointer lock.
import {launch, sleep, until} from './cdp.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const label=process.argv[2]||'current',build=path.resolve(root,process.argv[3]||'dist/index.html');
const sampleMs=Number(process.argv.find(s=>s.startsWith('--sample-ms='))?.split('=')[1]||30000);
const traced=process.argv.includes('--trace');
if(!Number.isInteger(sampleMs)||sampleMs<1000||sampleMs>60000)throw Error('Invalid sample duration');
const out=path.join(root,'tools/out/outcrop-'+label);fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),label,build:path.relative(root,build),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),sampleMs,traced,
 method:'Offline fixed-seed native outcrop, 100 completed warm frames, outer simulation/render wall timings only. No GPU queries, method instrumentation, gameplay or input. Traced captures add frame marks and browser CPU/scheduling/GC trace overhead.',viewport:[1920,1080]};
const p=await launch({port:9496,width:1920,height:1080,gpu:true});
let tracing=false;
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');
 await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000,label:'boot'});
 await p.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.player.teleport(-42.5,B2.COMMON.height(-42.5,20)+.06,20);g.player.yaw=Math.atan2(3.5,-5);g.player.pitch=Math.atan2(B2.COMMON.height(-46,25)+.95-g.player.head.y,Math.hypot(-3.5,5));return true;})()`);
 const warm=await p.eval('__buttloads.audit.frames');
 await until(()=>p.eval(`__buttloads.audit.frames>=${warm+100}`),{timeout:30000,label:'outcrop warmup'});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 report.hardware=await p.eval(`(()=>{const r=__buttloads.view.renderer,gl=r.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),pixelRatio:r.getPixelRatio()};})()`);
 await p.call('Performance.enable');
 report.metricsBefore=(await p.call('Performance.getMetrics')).metrics;
 let traceComplete;
 if(traced){
  traceComplete=new Promise(resolve=>{const off=p.on('Tracing.tracingComplete',params=>{off();resolve(params);});});
  await p.browserCall('Tracing.start',{categories:'toplevel,devtools.timeline,blink.user_timing,v8,disabled-by-default-v8.cpu_profiler,disabled-by-default-v8.gc,disabled-by-default-renderer.scheduler,gpu,cc',transferMode:'ReturnAsStream'});
  tracing=true;
 }
 await p.eval(`(()=>{
  const g=__buttloads,v=g.view;window._outcrop={enabled:true,samples:[],simulation:0,traced:${traced}};
  const simulation=g.advanceSimulation;g.advanceSimulation=function(...args){if(!_outcrop.enabled)return simulation.apply(this,args);const start=performance.now();if(_outcrop.traced)performance.mark('B2.frame.'+_outcrop.samples.length);try{return simulation.apply(this,args);}finally{_outcrop.simulation+=performance.now()-start;}};
  const render=v.render;v.render=function(...args){if(!_outcrop.enabled)return render.apply(this,args);const start=performance.now();try{return render.apply(this,args);}finally{_outcrop.samples.push({index:_outcrop.samples.length,at:start,frameMs:g.audit.frameMs.at(-1),simulation:_outcrop.simulation,render:performance.now()-start});_outcrop.simulation=0;}};
  performance.mark('B2.capture.start');return true;
 })()`);
 await sleep(sampleMs);
 const data=await p.eval(`(()=>{_outcrop.enabled=false;performance.mark('B2.capture.end');const a=_outcrop.samples;return{samples:a,timeOrigin:performance.timeOrigin,input:{keys:__buttloads.input.keys.size,fire:__buttloads.input.fire},pointerLocked:!!document.pointerLockElement,player:{x:__buttloads.player.x,y:__buttloads.player.y,z:__buttloads.player.z,yaw:__buttloads.player.yaw,pitch:__buttloads.player.pitch}};})()`);
 report.metricsAfter=(await p.call('Performance.getMetrics')).metrics;
 if(traced){
  await p.browserCall('Tracing.end');tracing=false;
  const {stream}=await traceComplete;
  const chunks=[];
  for(;;){const chunk=await p.browserCall('IO.read',{handle:stream,size:1048576});chunks.push(chunk.base64Encoded?Buffer.from(chunk.data,'base64'):Buffer.from(chunk.data));if(chunk.eof)break;}
  await p.browserCall('IO.close',{handle:stream});
  fs.writeFileSync(path.join(out,'trace.json'),Buffer.concat(chunks));
 }
 const stats=values=>{const a=[...values].sort((a,b)=>a-b);return{count:a.length,mean:a.reduce((s,v)=>s+v,0)/a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};};
 report.frame=stats(data.samples.map(s=>s.frameMs));report.render=stats(data.samples.map(s=>s.render));report.simulation=stats(data.samples.map(s=>s.simulation));
 report.framesOver25=data.samples.filter(s=>s.frameMs>25).length;
 report.slowFrames=data.samples.filter(s=>s.frameMs>25).map(s=>({current:s,previous:data.samples[s.index-1]||null})).sort((a,b)=>b.current.frameMs-a.current.frameMs);
 Object.assign(report,{pointerLocked:data.pointerLocked,input:data.input,player:data.player,timeOrigin:data.timeOrigin});
 fs.writeFileSync(path.join(out,'samples.json'),JSON.stringify(data.samples));
 await p.shot(path.join(out,'outcrop.png'));
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));
 if(report.errors.length||report.pointerLocked||report.input.keys||report.input.fire)throw Error('Observation isolation failed');
 console.log(JSON.stringify({label,version:report.version,traced,frame:report.frame,render:report.render,simulation:report.simulation,framesOver25:report.framesOver25,slowFrames:report.slowFrames.slice(0,3)}));
 console.log('COMPLETE static outcrop capture '+label);
}finally{
 if(tracing)await p.browserCall('Tracing.end').catch(()=>{});
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();
}
