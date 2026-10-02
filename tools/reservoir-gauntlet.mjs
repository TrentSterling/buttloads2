// Matched native reservoir observations. No input, foregrounding or pointer lock.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2]||'current',build=process.argv[3]||'dist/index.html',out=path.join(root,'tools/out','reservoir-'+label);
fs.mkdirSync(out,{recursive:true});
const p=await launch({port:9505,width:1440,height:1000,gpu:true});
const report={label,build,buildSha256:createHash('sha256').update(fs.readFileSync(path.resolve(root,build))).digest('hex'),date:new Date().toISOString(),viewport:[1440,1000],timingContext:'Competing GPU workload reported. Structural inventory only; no quiet-machine timing or physical input-feel claim.',shots:[]};
try{
 await p.goto(pathToFileURL(path.resolve(root,build)).href+'?offline&seed=260923&reservoir-inspection');
 await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval('(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._reservoirRender=g.view.render;g.view.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();return true;})()');
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 const shots=[['approach',40,39,42,51,7.8,null],['west-road',31,49,42,51,7.5,null],['structure',43.7,46.7,42,51,4,null],['ladder',40.8,47.2,42,48.82,4.4,null],['tank-study',40,45.4,42,51,9.35,10.2],['town-distance',3,25,42,51,7.1,null]];
 for(const [name,x,z,tx,tz,focusHeight,eyeHeight]of shots){
  const draw=await p.eval(`(()=>{const g=__buttloads,v=g.view,base=v.waterTower.y,y=${eyeHeight===null?`B2.COMMON.height(${x},${z})+.06`:`base+${eyeHeight}-g.player.eye`};g.player.teleport(${x},y,${z});g.player.yaw=Math.atan2(${x-tx},${z-tz});g.player.pitch=Math.atan2(base+${focusHeight}-g.player.head.y,Math.hypot(${tx-x},${tz-z}));v.renderer.shadowMap.needsUpdate=true;v.renderer.info.autoReset=false;v.renderer.info.reset();g._reservoirRender.call(v,g,0,10);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();g._reservoirRender.call(v,g,0,10);return {camera:{x:${x},y,z:${z},yaw:g.player.yaw,pitch:g.player.pitch},capsuleBlocked:g.player.blocked(g.player.x,g.player.y,g.player.z),refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,viewKind:eyeHeight===null?'walking-height observation':'elevated model study',...draw});
 }
 report.inventory=await p.eval(`(()=>{const g=__buttloads,v=g.view,invalid=[];let triangles=0,meshes=0,lights=0;const maps=new Set();v.commonScene.traverse(o=>{if(o.isMesh){meshes++;const a=o.geometry.attributes;triangles+=(o.geometry.index?.count||a.position.count)/3;for(const key of ['normal',...(o.material.map?['uv']:[]),...(o.material.vertexColors?['color']:[])])if(a[key]?.count!==a.position.count)invalid.push({key,positions:a.position.count,count:a[key]?.count});for(const [key,value]of Object.entries(a))if(!value.array.every(Number.isFinite))invalid.push({key,nonfinite:true});if(o.material.map)maps.add(o.material.map.uuid);}if(o.isLight)lights++;});let terrainHash=2166136261;for(const b of new Uint8Array(g.world.field.buffer,g.world.field.byteOffset,g.world.field.byteLength))terrainHash=Math.imul(terrainHash^b,16777619)>>>0;return {meshes,triangles,lights,commonTextureReferences:maps.size,obstacles:v.obstacles,terrainHash,trees:v.commonTrees,meadow:v.commonMeadow,tower:v.waterTower,invalid};})()`);
 report.errors=p.logs.filter(line=>/EXCEPTION|error:/i.test(line));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');
 if(report.errors.length||report.input.pointerLock||report.input.keys||report.input.fire||report.inventory.invalid.length)throw Error('Failed guarded native reservoir capture');
 console.log(JSON.stringify({label,version:report.version,shots:report.shots.length,meshes:report.inventory.meshes,triangles:report.inventory.triangles,lights:report.inventory.lights,commonTextureReferences:report.inventory.commonTextureReferences,errors:report.errors,input:report.input}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
