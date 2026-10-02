// Counterbalanced fixed render cost. No input, simulation, focus or pointer lock.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'tools/out/ground-material-cost');fs.mkdirSync(out,{recursive:true});
const legacy=fs.readFileSync(path.join(root,'tools/out/ground-material-before/beauty.js'),'utf8'),build=path.join(root,'dist/index.html');
const report={date:new Date().toISOString(),version:'2.52.0',buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),method:'Same browser, native fixed scenes, original 2.51.1 terrain hooks versus final 2.52.0 hooks in BEFORE/AFTER/AFTER/BEFORE blocks. Cached shadows, fixed camera and wind, no simulation or input. GPU elapsed includes competing scheduling; this is not quiet-machine FPS.',scenes:[]};
const p=await launch({port:9572,width:1920,height:1080,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.advanceSimulation=()=>{};g._materialDraw=v.render;v.render=()=>{};g.setScreen(null);g.clearInput();g.settings.motion=false;g.clock=0;g.fieldKit.dismiss();v.windUniform.value=0;v.skyDome.material.uniforms.windTime.value=0;v.renderer.info.autoReset=false;window._materialHooks=[];v.scene.traverse(o=>{const m=o.material;if(o.isMesh&&m.customProgramCacheKey()==='b2-strata-ground-2'&&!_materialHooks.some(r=>r.m===m))_materialHooks.push({m,hook:m.onBeforeCompile,key:m.customProgramCacheKey});});window._currentLook=B2.TERRAIN_LOOK;window._currentMakeLook=B2.View.prototype.makeLook;return true;})()`);
 await p.eval(legacy+';window._legacyApply=B2.TERRAIN_LOOK.apply;B2.TERRAIN_LOOK=_currentLook;B2.View.prototype.makeLook=_currentMakeLook;true');
 await p.eval(`window._materialBlock=async function(label){
  const g=__buttloads,v=g.view,r=v.renderer,gl=r.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');if(!ext)throw Error('GPU timer unavailable');
  for(const row of _materialHooks){if(label==='after'){row.m.onBeforeCompile=row.hook;row.m.customProgramCacheKey=row.key;}else if(row.m.color.getHex()===new THREE.Color('#a39374').convertSRGBToLinear().getHex()||row.m.color.getHex()===new THREE.Color('#8e7858').convertSRGBToLinear().getHex()){row.m.onBeforeCompile=THREE.Material.prototype.onBeforeCompile;row.m.customProgramCacheKey=THREE.Material.prototype.customProgramCacheKey;}else _legacyApply(row.m);row.m.needsUpdate=true;}
  const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve)),draw=()=>{r.info.reset();g._materialDraw.call(v,g,0,0);};
  r.shadowMap.needsUpdate=true;for(let i=0;i<40;i++){await frame();draw();}
  const pending=[],gpu=[],cpu=[],calls=[],triangles=[];
  for(let i=0;i<90;i++){
   await frame();while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=pending.shift();if(!gl.getParameter(ext.GPU_DISJOINT_EXT))gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
   const q=pending.length<8?gl.createQuery():null;if(q)gl.beginQuery(ext.TIME_ELAPSED_EXT,q);const t=performance.now();draw();cpu.push(performance.now()-t);if(q){gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(q);}calls.push(r.info.render.calls);triangles.push(r.info.render.triangles);
  }
  for(let i=0;pending.length&&i<120;i++){await frame();while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=pending.shift();if(!gl.getParameter(ext.GPU_DISJOINT_EXT))gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}}
  if(pending.length)throw Error('GPU queries did not complete');const stats=a=>{a.sort((x,y)=>x-y);return{count:a.length,mean:a.reduce((s,n)=>s+n,0)/a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]};};
  return{label,cpu:stats(cpu),gpu:stats(gpu),calls:stats(calls),triangles:stats(triangles),pointerLock:!!document.pointerLockElement,keys:g.input.keys.size,fire:g.input.fire};
 };true`);
 for(const [name,x,z,yaw,pitch]of [['yard',0,11.5,0,-.18],['north-slope',4,-29,-1.09,-.03],['outcrop',-42.5,20,2.53,-.12]]){
  await p.eval(`(()=>{const g=__buttloads,v=g.view;g.player.teleport(${x},B2.COMMON.height(${x},${z})+.06,${z});g.player.yaw=${yaw};g.player.pitch=${pitch};Object.assign(v.feel,{phase:0,swayX:0,swayY:0,land:0,vy:0,equip:0,yaw:g.player.yaw,pitch:g.player.pitch});return true;})()`);
  const blocks=[];for(const label of ['before','after','after','before']){const block=await p.eval(`_materialBlock(${JSON.stringify(label)})`);assert.equal(block.pointerLock,false);assert.equal(block.keys,0);assert.equal(block.fire,false);assert.ok(block.gpu.count>=70);blocks.push(block);}
  assert.ok(blocks.every(b=>b.calls.mean===blocks[0].calls.mean&&b.triangles.mean===blocks[0].triangles.mean));report.scenes.push({name,blocks});console.log(JSON.stringify({name,blocks:blocks.map(b=>({label:b.label,cpu:b.cpu.mean,gpu:b.gpu.mean,gpuP50:b.gpu.p50}))}));
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('COMPLETE twelve counterbalanced material-cost blocks; exact draws/triangles, no held input or runtime errors.');
}finally{p.kill();}
