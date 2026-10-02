// Native foliage observation only. No browser input, foregrounding or pointer lock.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until,sleep} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2]||'current',build=process.argv[3]||'dist/index.html',out=path.join(root,'tools/out','foliage-'+label);
fs.mkdirSync(out,{recursive:true});
const p=await launch({port:9502,width:1440,height:1000,gpu:true}),report={label,build,buildSha256:createHash('sha256').update(fs.readFileSync(path.resolve(root,build))).digest('hex'),date:new Date().toISOString(),viewport:[1440,1000],timingContext:'Qwen audio workload reported; no performance timing or physical input-feel claim.',shots:[]};
try{
 await p.goto(pathToFileURL(path.resolve(root,build)).href+'?offline&seed=260923&foliage-inspection');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval('(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._foliageRender=g.view.render;g.view.render=()=>{};g.update=()=>{};g.fieldKit.dismiss();return true;})()');
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 const trees=await p.eval('(()=>{const a=__buttloads.view.commonTrees;return {pine:a.filter(t=>t.conifer).sort((a,b)=>Math.hypot(a.x+43,a.z-20)-Math.hypot(b.x+43,b.z-20))[0],oak:a.find(t=>t.x===-1&&t.z===36)};})()'),{pine,oak}=trees;
 const shots=[['pine',pine.x+5,pine.z+5,pine.x,pine.z,pine.y+pine.height*.55],['pine-close',pine.x+2.8,pine.z+2.8,pine.x,pine.z,pine.y+pine.height*.47],['grove',-34,24,-43,26,null],['broadleaf',oak.x+5,oak.z-6,oak.x,oak.z,oak.y+oak.height*.68],['leaf-close',oak.x+2.5,oak.z-2.4,oak.x-.5,oak.z,oak.y+oak.height*.58],['north-rise',4,-29,27,-41,null]];
 for(const [name,x,z,tx,tz,targetY]of shots){
  const draw=await p.eval(`(()=>{const g=__buttloads,v=g.view,y=B2.COMMON.height(${x},${z})+.06,focus=${targetY===null?`B2.COMMON.height(${tx},${tz})+1.8`:targetY};g.player.teleport(${x},y,${z});g.player.yaw=Math.atan2(${x-tx},${z-tz});g.player.pitch=Math.atan2(focus-g.player.head.y,Math.hypot(${tx-x},${tz-z}));v.renderer.shadowMap.needsUpdate=true;v.renderer.info.autoReset=false;v.renderer.info.reset();g._foliageRender.call(v,g,0,10);return{camera:{x:${x},y,z:${z},yaw:g.player.yaw,pitch:g.player.pitch},calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};})()`);
  await sleep(40);await p.shot(path.join(out,name+'.png'));report.shots.push({name,...draw});
 }
 report.inventory=await p.eval(`(()=>{const g=__buttloads,v=g.view,invalidAttributes=[];let triangles=0,meshes=0,lights=0;v.commonScene.traverse(o=>{if(o.isMesh){meshes++;const a=o.geometry.attributes;triangles+=(o.geometry.index?.count||a.position.count)/3;for(const key of ['normal',...(o.material.map?['uv']:[]),...(o.material.vertexColors?['color']:[])])if(a[key]?.count!==a.position.count)invalidAttributes.push({material:o.material.uuid,key,positions:a.position.count,count:a[key]?.count});for(const [key,value]of Object.entries(a))if(!value.array.every(Number.isFinite))invalidAttributes.push({material:o.material.uuid,key,nonfinite:true});}if(o.isLight)lights++;});let terrainHash=2166136261;for(const b of new Uint8Array(g.world.field.buffer,g.world.field.byteOffset,g.world.field.byteLength))terrainHash=Math.imul(terrainHash^b,16777619)>>>0;return{meshes,triangles,lights,trees:v.commonTrees,obstacles:v.obstacles,terrainHash,invalidAttributes};})()`);
 report.errors=p.logs.filter(line=>/EXCEPTION|error:/i.test(line));report.pointerLock=await p.eval('!!document.pointerLockElement');if(report.errors.length||report.pointerLock||report.inventory.invalidAttributes.length)throw Error('Failed guarded native foliage capture or incomplete attributes');
 console.log(JSON.stringify({label,version:report.version,shots:report.shots.length,meshes:report.inventory.meshes,triangles:report.inventory.triangles,errors:report.errors,pointerLock:report.pointerLock}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
