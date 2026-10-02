// Same-scene paired GPU/CPU throughput check, with exact lighting parity images.
import {launch,until} from './cdp.mjs';
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'tools/out/perf-lighting');fs.mkdirSync(out,{recursive:true});
const require=createRequire(import.meta.url),native=require('../vendor/three.min.js').ShaderChunk.lights_fragment_begin;
const p=await launch({port:9496,width:1920,height:1080,gpu:true}),rows=[];
try{
 await p.goto(pathToFileURL(path.join(root,process.argv[2]||'tools/out/perf-lighting/guard-build.html')).href+'?offline');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g.player.teleport(0,.1,11.5);g.player.pitch=-.12;g._draw=g.view.render;g.view.render=()=>{};window._native=${JSON.stringify(native)};window._optimized=THREE.ShaderChunk.lights_fragment_begin;return true;})()`);
 for(const scene of ['yard','crew','mine']){
  if(scene==='crew')await p.eval(`__buttloads.net={role:'profile',count:5,tick(){},members:Array.from({length:4},(_,i)=>({id:'bench-'+i,color:i,name:'Miner '+i,tool:['cutter','axe','sling','resonance'][i],player:{x:(i-1.5)*1.1,y:0,z:4,grounded:true,yaw:Math.PI,pitch:0},sling:{charge:.3}}))};true`);
  if(scene==='mine')await p.eval(`__buttloads.net=null;__buttloads.view.clearMiners();for(let y=0;y>-15;y-=.8)__buttloads.world.carve({x:0,y,z:6},2);__buttloads.player.teleport(0,-10,6);__buttloads.player.yaw=.6;true`);
  for(const variant of ['optimized','native','native','optimized']){
   await p.eval(`(()=>{THREE.ShaderChunk.lights_fragment_begin=window._${variant};__buttloads.view.scene.traverse(n=>{if(n.material&&!n.material.isShaderMaterial&&!n.material.isSpriteMaterial){for(const m of Array.isArray(n.material)?n.material:[n.material]){m.defines={...m.defines,B2_BENCH_VARIANT:${variant==='native'?0:1}};m.needsUpdate=true;}}});const g=__buttloads;for(let i=0;i<5;i++){g._draw.call(g.view,g,1/60,0);g.view.renderer.getContext().finish();}return true;})()`);
   const r=await p.eval(`(()=>{const g=__buttloads,gl=g.view.renderer.getContext(),a=[];for(let i=0;i<90;i++){const t=performance.now();g._draw.call(g.view,g,1/60,0);gl.finish();a.push(performance.now()-t);}a.sort((a,b)=>a-b);return{mean:a.reduce((a,b)=>a+b)/a.length,p50:a[45],p95:a[85]};})()`);rows.push({scene,variant,...r});console.log(JSON.stringify(rows.at(-1)));
   if(rows.filter(r=>r.scene===scene&&r.variant===variant).length===1)await p.shot(path.join(out,scene+'-'+variant+'.png'));
  }
 }
 const errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));if(errors.length)throw Error(errors.join('\n'));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));p.kill();}
