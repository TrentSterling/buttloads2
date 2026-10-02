// Trent authorized before/after review. Headless only; no OS input or pointer lock.
import {launch, sleep, until} from './cdp.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const label=process.argv[2]||'after',out=path.join(root,'tools/out','polish-'+label);
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const p=await launch({port:9478,width:1280,height:800,gpu:process.argv.includes('--gpu')});
const report={label,visualVerdict:'UNREVIEWED',viewport:[1280,800],scenes:[],logs:[]};
try{
 await p.goto(`http://127.0.0.1:${server.address().port}/${process.argv.includes('--standalone')?'dist/index.html':''}?offline&seed=260923`);
 await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000,label:'boot'});
 await sleep(500);
 report.renderer=await p.eval('(()=>{const gl=__buttloads.view.renderer.getContext(),debug=gl.getExtension("WEBGL_debug_renderer_info");return debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);})()');
 await p.eval('const g=__buttloads,render=g.view.render;g.view.renderer.info.autoReset=false;g.view.render=function(...args){this.renderer.info.reset();render.apply(this,args);g.__frameInfo={...this.renderer.info.render};};true');
 for(const [name,source] of [
  ['title','__buttloads.setScreen("title")'],
  ['yard','__buttloads.setScreen(null);__buttloads.player.teleport(0,.1,11.5);__buttloads.player.yaw=0;__buttloads.player.pitch=-.35'],
  ['town','__buttloads.player.teleport(5,.1,28);__buttloads.player.yaw=2.7;__buttloads.player.pitch=-.06'],
  ['mine','for(let y=0;y>-13;y-=.8)__buttloads.world.carve({x:0,y,z:6},2);__buttloads.player.teleport(0,-10,6);__buttloads.player.yaw=.6;__buttloads.player.pitch=-.1'],
  ['cutting','__buttloads.input.fire=true;__buttloads.player.pitch=-.7']
 ]){
  await p.eval(source+';true');await sleep(700);
  await p.shot(path.join(out,name+'.png'));
  report.scenes.push({name,...await p.eval('({fullFrame:__buttloads.__frameInfo,frameMs:__buttloads.audit.frameMs.slice(-20),pointerLocked:!!document.pointerLockElement})')});
 }
 await p.eval('__buttloads.input.fire=false;__buttloads.player.teleport(0,.1,11.5);__buttloads.player.yaw=0;__buttloads.player.pitch=-.35;true');
 await p.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await until(()=>p.eval('innerWidth===390'),{timeout:10000,label:'phone viewport'});await p.eval('__buttloads.view.resize();__buttloads.view.gameUI.draw();true');await sleep(400);report.phone=await p.eval('({viewport:[innerWidth,innerHeight],ui:[__buttloads.view.gameUI.w,__buttloads.view.gameUI.h]})');await p.shot(path.join(out,'phone-yard.png'));
 await p.eval('__buttloads.setScreen("crew");true');await sleep(200);await p.shot(path.join(out,'phone-crew.png'));
 await p.call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await p.eval('(()=>{__buttloads.setScreen(null);const g=__buttloads;g.economy.state.deepest=297;g.expedition.state.recovered=[0,1];g.expedition.state.awakened=true;g.kinetics.state.unlocked=true;return true;})()');await sleep(200);
 report.touch=await p.eval('({coarse:matchMedia("(pointer:coarse)").matches,controls:__buttloads.view.gameUI.hits.filter(h=>h.id.startsWith("touch-")||h.id.startsWith("tool-")).map(h=>({id:h.id,x:h.x,y:h.y,w:h.w,h:h.h}))})');
 if(!report.touch.coarse)throw Error('Touch emulation did not activate coarse input');
 for(const control of report.touch.controls){if(control.x<0||control.y<0||control.x+control.w>390||control.y+control.h>844)throw Error('Touch control outside viewport: '+control.id);}
 const tools=report.touch.controls.filter(c=>c.id.startsWith('tool-')),buttons=report.touch.controls.filter(c=>c.id.startsWith('touch-'));
 if(tools.some(a=>buttons.some(b=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)))throw Error('Tool rail overlaps touch actions');
 await p.shot(path.join(out,'phone-touch.png'));
 report.movement=await p.eval(`(()=>{const p=new B2.Player({density:()=>1,floor:-297});p.grounded=true;const values=[];for(let i=0;i<60;i++){p.step(1/120,new Set(['KeyW']),6);if([5,11,23,59].includes(i))values.push({ms:(i+1)/120*1000,speed:Math.hypot(p.vx,p.vz)});}return values;})()`);
 report.logs=p.logs.filter(x=>/EXCEPTION|error/i.test(x));
 if(report.scenes.some(x=>x.pointerLocked))throw Error('Pointer-lock guard failed');
 if(report.logs.length)throw Error(report.logs.join('\n'));
 console.log('PASS functional capture '+label+': five desktop scenes, two narrow screens and coarse-input controls; no runtime errors; no pointer lock. Visual verdict: UNREVIEWED.');
 console.log(JSON.stringify({movement:report.movement,scenes:report.scenes.map(({name,fullFrame})=>({name,fullFrame}))}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();server.close();}
