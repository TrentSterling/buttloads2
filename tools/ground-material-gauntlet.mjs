// Fixed native material inspection. No events, held input, focus or pointer lock.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2]||'after';
const build=path.resolve(root,process.argv[3]||'dist/index.html'),out=path.join(root,'tools/out','ground-material-'+label);
fs.mkdirSync(out,{recursive:true});
const report={label,date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),viewport:[1440,1000],shots:[],method:'Fixed native terrain materials and actual scene geometry, inert offline crew, stationary capsule and camera. Mine shafts are explicitly carved inspection fixtures. No held input, events, focus or pointer lock.'};
const p=await launch({port:9570,width:1440,height:1000,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.advanceSimulation=()=>{};g._groundDraw=v.render;v.render=()=>{};g.setScreen(null);g.clearInput();g.settings.motion=false;g.clock=0;g.fieldKit.dismiss();return true;})()`);
 const shots=process.argv.includes('--extra')?[
  ['soil-side',0,6,-2.25,-.12,-8],['field-boundary',-17.4,0,-Math.PI/2,-.65]
 ]:[
  ['yard',0,11.5,0,-.18],['depot',0,12,Math.PI,.08],
  ['north-slope',4,-29,27,-41,1.8],['grove',-34,24,-43,26,1.5],
  ['outcrop',-42.5,20,-46,25,.95],['grass-close',18,-28,.35,-1.05],
  ['path',24,29,-2.9,-.75],['claim-close',0,11.5,0,-1.2],
  ['soil-wall',0,6,.8,-.12,-8],['chalk-wall',0,6,.8,-.12,-32]
 ];
 for(const [name,x,z,a,b,c]of shots){
  const mine=typeof c==='number'&&c<0;
  const setup=mine?`for(let y=0;y>${c}-3;y-=.75)g.world.carve({x:0,y,z:6},2);g.player.teleport(${x},${c},${z});g.player.yaw=${a};g.player.pitch=${b};`:
   c===undefined?`g.player.teleport(${x},B2.COMMON.height(${x},${z})+.06,${z});g.player.yaw=${a};g.player.pitch=${b};`:
   `g.player.teleport(${x},B2.COMMON.height(${x},${z})+.06,${z});g.player.yaw=Math.atan2(${x-a},${z-b});g.player.pitch=Math.atan2(B2.COMMON.height(${a},${b})+${c}-g.player.head.y,Math.hypot(${a-x},${b-z}));`;
  const state=await p.eval(`(()=>{const g=__buttloads,v=g.view;${setup}v.wind={x:0,z:0,time:0};v.windUniform.value=0;v.skyDome.material.uniforms.windTime.value=0;Object.assign(v.feel,{phase:0,swayX:0,swayY:0,land:0,vy:0,equip:0,yaw:g.player.yaw,pitch:g.player.pitch});v.gameUI.age=0;v.gameUI.dirty=true;v.renderer.info.autoReset=false;v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;g._groundDraw.call(v,g,0,0);let hash=2166136261;for(const byte of new Uint8Array(g.world.field.buffer))hash=Math.imul(hash^byte,16777619)>>>0;return{name:${JSON.stringify(name)},fixture:${mine},player:{...g.player.position,yaw:g.player.yaw,pitch:g.player.pitch},camera:v.camera.position.toArray(),rotation:v.camera.rotation.toArray(),fieldHash:hash,calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,input:{pointerLock:!!document.pointerLockElement,keys:g.input.keys.size,fire:g.input.fire}};})()`);
  assert.deepEqual(state.input,{pointerLock:false,keys:0,fire:false});
  await p.shot(path.join(out,name+'.png'));report.shots.push(state);
 }
 report.resources=await p.eval(`(()=>{const v=__buttloads.view;let meshes=0,triangles=0;v.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});const detail=B2.GROUND_DETAIL?.texture();return{meshes,triangles,detailTextures:detail?1:0,detailBytes:detail?.image?.data?.byteLength||0,detailSize:detail?[detail.image.width,detail.image.height]:[],commonTrees:v.commonTrees,obstacles:v.obstacles};})()`);
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);
 if(label==='after'||label==='after-extra'){
  const before=JSON.parse(fs.readFileSync(path.join(root,'tools/out/ground-material-'+(label==='after'?'before':'before-extra')+'/report.json')));
  for(const shot of report.shots){const old=before.shots.find(s=>s.name===shot.name);for(const key of ['player','camera','rotation','fieldHash','calls','triangles','input'])assert.deepEqual(shot[key],old[key],shot.name+' '+key);}
  for(const key of ['meshes','triangles','commonTrees','obstacles'])assert.deepEqual(report.resources[key],before.resources[key],key);
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log('COMPLETE '+report.shots.length+' native ground material views '+label+'; zero held input, errors or pointer lock.');
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
