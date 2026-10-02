// Matched native depot views. Page evaluation only; no input events or foregrounding.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until,sleep} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2]||'current',build=process.argv[3]||'dist/index.html',out=path.join(root,'tools/out','depot-'+label);
fs.mkdirSync(out,{recursive:true});
const p=await launch({port:9500,width:1440,height:1000,gpu:true}),report={label,build,buildSha256:createHash('sha256').update(fs.readFileSync(path.resolve(root,build))).digest('hex'),date:new Date().toISOString(),viewport:[1440,1000],shots:[]};
try{
 await p.goto(pathToFileURL(path.resolve(root,build)).href+'?offline&seed=260923&depot-inspection');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval('(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._depotRender=g.view.render;g.view.render=()=>{};g.update=()=>{};g.fieldKit.dismiss();return true;})()');
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 const shots=[['arrival',0,11.5,0,21.7,1.64],['frontage',-6.8,12.8,-4.5,19.8,2.05],['workbench',1.5,15.85,.37,21.8,1.9],['hopper',-7.8,15.5,-7,18.8,1.2],['recess',2.8,18.1,.37,21.8,1.95],['stock-hatch',-10.25,18.65,-10.2,20.45,1.8]];
 for(const [name,x,z,tx,tz,targetY]of shots){
  const draw=await p.eval(`(()=>{const g=__buttloads,v=g.view,y=B2.COMMON.height(${x},${z})+.06;g.player.teleport(${x},y,${z});g.player.yaw=Math.atan2(${x-tx},${z-tz});g.player.pitch=Math.atan2(${targetY}-g.player.head.y,Math.hypot(${tx-x},${tz-z}));v.renderer.shadowMap.needsUpdate=true;v.renderer.info.autoReset=false;v.renderer.info.reset();g._depotRender.call(v,g,0,10);return{camera:{x:${x},y,z:${z},yaw:g.player.yaw,pitch:g.player.pitch},calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};})()`);
  await sleep(60);await p.shot(path.join(out,name+'.png'));report.shots.push({name,...draw});
 }
 report.inventory=await p.eval(`(()=>{const g=__buttloads,v=g.view;let triangles=0,meshes=0,lights=0,roofPaneDeviation=null;v.yardArt.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;if(o.material===v.yardArtMaterials.glass){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)roofPaneDeviation=Math.max(roofPaneDeviation||0,Math.abs(p.getY(i)-(3.67+(p.getZ(i)-16.13)*.145+.024)));}}if(o.isLight)lights++;});let terrainHash=2166136261;for(const b of new Uint8Array(g.world.field.buffer,g.world.field.byteOffset,g.world.field.byteLength))terrainHash=Math.imul(terrainHash^b,16777619)>>>0;return{meshes,triangles,lights,obstacles:v.obstacles,terrainHash,roofPaneDeviation,glassShadow:v.yardArt.children.filter(o=>o.material===v.yardArtMaterials.glass).map(o=>o.castShadow)};})()`);
 report.errors=p.logs.filter(line=>/EXCEPTION|error:/i.test(line));report.pointerLock=await p.eval('!!document.pointerLockElement');if(report.errors.length||report.pointerLock)throw Error('Unsafe or failed native capture');
 console.log(JSON.stringify({label,version:report.version,shots:report.shots.length,meshes:report.inventory.meshes,triangles:report.inventory.triangles,lights:report.inventory.lights,errors:report.errors,pointerLock:report.pointerLock}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
