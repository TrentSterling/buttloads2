// Isolated, hardware-backed profiling. No desktop input, focus or pointer lock.
import {launch, sleep, until} from './cdp.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2]||'release';
const sampleMs=Number(process.argv.find(s=>s.startsWith('--sample-ms='))?.split('=')[1]||6000),hitchDetail=process.argv.includes('--hitch-detail');
if(!Number.isInteger(sampleMs)||sampleMs<1000||sampleMs>60000)throw Error('Sample duration must be 1000 through 60000 ms');
const out=path.join(root,'tools/out','perf-'+label);fs.mkdirSync(out,{recursive:true});
const build=process.argv[3]||'dist/index.html';
const p=await launch({port:9495,width:1920,height:1080,gpu:true});
const report={label,build,buildSha256:createHash('sha256').update(fs.readFileSync(path.resolve(root,build))).digest('hex'),viewport:[1920,1080],sampleMs,hitchDetail,date:new Date().toISOString(),scenes:[]};
try{
 await p.goto(pathToFileURL(path.resolve(root,build)).href+'?offline&seed=260923');
 await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000,label:'boot'});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 report.hardware=await p.eval(`(()=>{const r=__buttloads.view.renderer,gl=r.getContext(),d=gl.getExtension('WEBGL_debug_renderer_info');return{renderer:gl.getParameter(d.UNMASKED_RENDERER_WEBGL),pixelRatio:r.getPixelRatio(),timer:!!gl.getExtension('EXT_disjoint_timer_query_webgl2')};})()`);
 await p.eval(`(()=>{
  const g=__buttloads,v=g.view;window._perf={samples:[],times:{},frameTimes:{},gpu:[],enabled:false,hitchDetail:${hitchDetail}};
  const record=(name,elapsed)=>{(_perf.times[name]||(_perf.times[name]=[])).push(elapsed);if(_perf.hitchDetail)_perf.frameTimes[name]=(_perf.frameTimes[name]||0)+elapsed;};
  const wrap=(o,k,name)=>{const f=o[k];if(typeof f!=='function')return;o[k]=function(...args){if(!_perf.enabled)return f.apply(this,args);const t=performance.now();try{return f.apply(this,args);}finally{record(name,performance.now()-t);}};};
  wrap(g,'update','simulation');for(const k of Object.getOwnPropertyNames(B2.View.prototype))if(k.startsWith('render')||k==='minerFloor')wrap(v,k,k);
  wrap(g.net,'updateGuest','guestPrediction');
  wrap(v.gameUI,'draw','hudPaint');wrap(g.world,'clearLine','visibility');
  const rr=v.renderer.render.bind(v.renderer);v.renderer.render=function(s,c){const t=performance.now(),name=s===v.scene?'mainDraw':s===v.toolScene?'toolDraw':'hudDraw';rr(s,c);if(_perf.enabled)record(name,performance.now()-t);};
  const gl=v.renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),queries=[];
  v.renderer.info.autoReset=false;const render=v.render;v.render=function(...a){
   if(_perf.moveCrew)for(const [i,m]of g.net.members.entries()){m.player.x=(i-1.5)*1.1+Math.sin(g.clock*1.8+i)*.6;m.player.z=7+Math.cos(g.clock*1.8+i)*.6;}
   while(queries.length&&gl.getQueryParameter(queries[0],gl.QUERY_RESULT_AVAILABLE)){const q=queries.shift(),ns=gl.getQueryParameter(q,gl.QUERY_RESULT);if(_perf.enabled&&!gl.getParameter(ext.GPU_DISJOINT_EXT))_perf.gpu.push(ns/1e6);gl.deleteQuery(q);}
   this.renderer.info.reset();const t=performance.now(),q=_perf.enabled&&ext&&queries.length<8?gl.createQuery():null;if(q)gl.beginQuery(ext.TIME_ELAPSED_EXT,q);
   render.apply(this,a);if(q){gl.endQuery(ext.TIME_ELAPSED_EXT);queries.push(q);}if(_perf.enabled){_perf.samples.push({cpu:performance.now()-t,frameMs:g.audit.frameMs.at(-1),calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,...(_perf.hitchDetail?{at:performance.now(),timings:{..._perf.frameTimes}}:{})});_perf.frameTimes={};}
  };
  g.setScreen(null);g.player.teleport(0,.1,11.5);g.player.yaw=0;g.player.pitch=-.12;return true;
 })()`);
 report.inventory=await p.eval(`(()=>{const v=__buttloads.view,rows=[];for(const root of v.scene.children){let meshes=0,triangles=0,shadowTriangles=0;root.traverse(o=>{if(!o.geometry)return;meshes++;const n=Math.min(o.geometry.drawRange.count,o.geometry.index?.count||o.geometry.attributes.position.count)/3;triangles+=n;if(o.castShadow)shadowTriangles+=n;});if(meshes)rows.push({name:Object.entries(v).find(([k,value])=>value===root)?.[0]||root.name||root.type,meshes,triangles,shadowTriangles});}return rows.sort((a,b)=>b.triangles-a.triangles);})()`);
 const cases=[['yard',''],['crew-four',`window._oldNet=__buttloads.net;__buttloads.net={role:'profile',time:0,count:5,active:false,host:false,tick(){},stepRemotes(){},members:Array.from({length:4},(_,i)=>({id:'profile-'+i,color:i,name:'Miner '+i,tool:['cutter','axe','sling','resonance'][i],fire:true,playing:true,player:{x:(i-1.5)*1.1,y:0,z:7,grounded:true,yaw:Math.PI,pitch:0,vx:1,vz:1},sling:{charge:.3}}))};_perf.moveCrew=true`],['mine',`_perf.moveCrew=false;__buttloads.net=window._oldNet;for(let y=0;y>-15;y-=.8)__buttloads.world.carve({x:0,y,z:6},2);__buttloads.player.teleport(0,-10,6);__buttloads.player.pitch=-.12;__buttloads.player.yaw=.6`],['cutting','__buttloads.player.pitch=-.7;__buttloads.input.fire=true']];
 if(process.argv.includes('--surface-only'))cases.splice(2);
 if(process.argv.includes('--world-art-only'))cases.splice(2,2,
  ['north-slope',`_perf.moveCrew=false;__buttloads.net=window._oldNet;__buttloads.player.teleport(4,B2.COMMON.height(4,-29)+.06,-29);__buttloads.player.yaw=Math.atan2(4-27,-29+41);__buttloads.player.pitch=Math.atan2(B2.COMMON.height(27,-41)+1.8-__buttloads.player.head.y,Math.hypot(23,-12))`],
  ['outcrop',`__buttloads.player.teleport(-42.5,B2.COMMON.height(-42.5,20)+.06,20);__buttloads.player.yaw=Math.atan2(3.5,-5);__buttloads.player.pitch=Math.atan2(B2.COMMON.height(-46,25)+.95-__buttloads.player.head.y,Math.hypot(-3.5,5))`]);
 if(process.argv.includes('--crew-only'))cases.splice(0,cases.length,cases[1]);
 if(process.argv.includes('--guest-only')){
  report.method='Production guest Game/Crew prediction and GPU rendering at rest; simulated 250 ms pose round trip through Crew.receive. Inert transport, no public network, input events or pointer lock.';
  cases.splice(0,cases.length,['guest-prediction',`(()=>{
   const g=__buttloads,n=g.net,pending=[];n.role='guest';n.ready=true;n.hostId='profile-host';n.world=g.world;n.room={};n.peers.set(n.hostId,{id:n.hostId,hello:true,ping:250});
   n.sendControl=async m=>{if(m.type==='input')pending.push({when:n.time+.25,at:n.time,seq:m.seq,player:{x:g.player.x,y:g.player.y,z:g.player.z,yaw:g.player.yaw,pitch:g.player.pitch}});};
   const update=n.updateGuest.bind(n);n.updateGuest=function(dt){for(let i=0;i<pending.length;)if(pending[i].when<=n.time){const p=pending.splice(i,1)[0];n.receive({v:B2.CREW_PROTOCOL,type:'poses',epoch:n.epoch,seq:p.seq,at:p.at,members:[{id:n.id,health:100,playing:true,player:p.player,ack:{seq:p.seq,age:0}}]},n.hostId);}else i++;return update(dt);};return true;
  })()`]);
 }
 if(process.argv.includes('--grounds-only'))cases.splice(0,cases.length,
  ['well-square','__buttloads.player.teleport(7.2,.06,43.9);__buttloads.player.yaw=2.333;__buttloads.player.pitch=-.21'],
  ['grove','__buttloads.player.teleport(-34,B2.COMMON.height(-34,24)+.06,24);__buttloads.player.yaw=1.8;__buttloads.player.pitch=.12']);
 for(const [name,setup]of cases){
  if(setup)await p.eval(setup+';true');
  if(name==='yard'||name==='crew-four'){await p.call('Profiler.enable');await p.call('Profiler.setSamplingInterval',{interval:1000});await p.call('Profiler.start');}
  // Warm actual completed frames, including newly compiled shaders. A wall
  // clock delay alone can expire while a terrain rebuild blocks the page.
  const warm=await p.eval('__buttloads.audit.frames');await until(()=>p.eval(`__buttloads.audit.frames>=${warm+100}`),{timeout:30000,label:name+' warmup'});
  await p.eval('_perf.samples=[];_perf.times={};_perf.frameTimes={};_perf.gpu=[];_perf.enabled=true;__buttloads.audit.frameMs=[];true');
  await sleep(sampleMs);
  if(name==='yard'||name==='crew-four'){const {profile}=await p.call('Profiler.stop');fs.writeFileSync(path.join(out,name+'.cpuprofile'),JSON.stringify(profile));const counts=new Map();for(const id of profile.samples||[])counts.set(id,(counts.get(id)||0)+1);report[name+'Hotspots']=profile.nodes.map(n=>({fn:n.callFrame.functionName,file:n.callFrame.url.split('/').pop(),line:n.callFrame.lineNumber+1,samples:counts.get(n.id)||0})).sort((a,b)=>b.samples-a.samples).slice(0,25);}
  const data=await p.eval(`(()=>{_perf.enabled=false;const stats=a=>{a.sort((a,b)=>a-b);return{count:a.length,mean:a.reduce((s,v)=>s+v,0)/a.length,p50:a[Math.floor(a.length*.50)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};};return{frame:stats(_perf.samples.map(s=>s.frameMs)),gpu:stats(_perf.gpu),cpu:stats(_perf.samples.map(s=>s.cpu)),calls:stats(_perf.samples.map(s=>s.calls)),triangles:stats(_perf.samples.map(s=>s.triangles)),...(_perf.hitchDetail?{slowFrames:_perf.samples.map((s,i)=>({index:i,current:s,previous:_perf.samples[i-1]||null})).filter(s=>s.current.frameMs>25).sort((a,b)=>b.current.frameMs-a.current.frameMs).slice(0,20),framesOver25:_perf.samples.filter(s=>s.frameMs>25).length}:{}),physics:Object.fromEntries(['orePhysics','kinetics','fossil','expedition'].map(k=>[k,(__buttloads[k].awake||__buttloads[k].physics?.awake)?.size||0])),timings:Object.fromEntries(Object.entries(_perf.times).map(([k,a])=>[k,stats(a)])),pointerLocked:!!document.pointerLockElement};})()`);
  if(name==='guest-prediction')data.prediction=await p.eval('({role:__buttloads.net.role,samples:__buttloads.net.predictionSamples?.length||0,inputs:__buttloads.net.predictionInputs?.size||0,aligned:!!__buttloads.net.serverPose?.error})');
  report.scenes.push({name,...data});await p.shot(path.join(out,name+'.png'));
  console.log(JSON.stringify({name,frame:data.frame,cpu:data.cpu,gpu:data.gpu,calls:data.calls,triangles:data.triangles,slowest:Object.entries(data.timings).sort((a,b)=>b[1].mean-a[1].mean).slice(0,5)}));
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));if(report.errors.length)throw Error(report.errors.join('\n'));
 if(report.scenes.some(s=>s.pointerLocked))throw Error('Pointer lock acquired');
 console.log('COMPLETE hardware performance capture '+label);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
