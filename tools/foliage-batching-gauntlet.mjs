// Native rendering receipts for spatial foliage batches. No input or FPS sweep.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2],build=path.resolve(root,process.argv[3]||'dist/index.html'),out=path.join(root,'tools/out','foliage-batching-'+label);
if(!label)throw Error('Capture label required');fs.mkdirSync(out,{recursive:true});
const p=await launch({port:9506,width:1440,height:1000,gpu:true});
const report={label,date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],scope:'Eight static native views. Reported competing GPU work prevents quiet-machine timing claims. No input events, focus, pointer lock or public gameplay.'};
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923&foliage-batching');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.setScreen(null);g.running=false;g.settings.motion=false;g._batchRender=v.render;v.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();window._canopyDraw={calls:0,triangles:0};for(const m of v.commonScene.children.filter(m=>m.isMesh&&m.material.vertexColors&&m.material.side===THREE.DoubleSide))m.onBeforeRender=(renderer,scene,camera)=>{if(camera===v.camera){_canopyDraw.calls++;_canopyDraw.triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}};v.renderer.info.autoReset=false;return true;})()`);
 const shots=[['yard-depot',0,11.5,Math.PI,.035],['mine-gate',0,11.5,0,-.08],['west-grove',-36,20,Math.PI/2,.03],['north-grove',-38,52,Math.PI/2,.04],['east-path',44,28,-Math.PI/2,.035],['parcel',33,7,0,.035],['reservoir',40,39,-2.976443976175166,.5426354354594907],['away-from-grove',-36,20,-Math.PI/2,-.03]];
 for(const [name,nominalX,nominalZ,yaw,pitch]of shots){
  const [x,z]=await p.eval(`(()=>{const p=__buttloads.player,clear=(x,z)=>!p.blocked(x,B2.COMMON.height(x,z)+.06,z);if(clear(${nominalX},${nominalZ}))return[${nominalX},${nominalZ}];for(let r=.25;r<=6;r+=.25)for(let j=0;j<32;j++){const a=j/32*Math.PI*2,x=${nominalX}+Math.cos(a)*r,z=${nominalZ}+Math.sin(a)*r;if(clear(x,z))return[x,z];}throw Error('No clear observation pose');})()`);
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,y=B2.COMMON.height(${x},${z})+.06;g.player.teleport(${x},y,${z});g.player.yaw=${yaw};g.player.pitch=${pitch};v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._batchRender.call(v,g,0,10);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();_canopyDraw.calls=0;_canopyDraw.triangles=0;g._batchRender.call(v,g,0,10);return {camera:{x:${x},y,z:${z},yaw:g.player.yaw,pitch:g.player.pitch},blocked:g.player.blocked(g.player.x,y,g.player.z),refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles},canopy:{..._canopyDraw}};})()`);
  if(data.blocked)throw Error('Observation camera overlaps an obstacle');
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,nominalPosition:[nominalX,nominalZ],...data});
 }
 report.inventory=await p.eval(`(()=>{const v=__buttloads.view,m=v.commonScene.children.filter(m=>m.isMesh),leaf=m.filter(m=>m.material.vertexColors&&m.material.side===THREE.DoubleSide);return {commonMeshes:m.length,commonTriangles:m.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),canopyMeshes:leaf.length,canopyTriangles:leaf.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),obstacles:v.obstacles,trees:v.commonTrees,meadow:v.commonMeadow};})()`);
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');
 if(report.errors.length||report.input.pointerLock||report.input.keys||report.input.fire)throw Error('Guarded foliage capture failed');
 console.log(JSON.stringify({label,version:report.version,inventory:{...report.inventory,obstacles:undefined,trees:undefined,meadow:undefined},shots:report.shots.map(s=>({name:s.name,cached:s.cached,refresh:s.refresh,canopy:s.canopy,blocked:s.blocked}))}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
