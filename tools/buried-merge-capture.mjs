// Fixed native cameras and assembly views; no input, pointer lock or timings.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2],build=path.resolve(root,process.argv[3]||'dist/index.html'),out=path.join(root,'tools/out','buried-merge-'+label),reference=JSON.parse(fs.readFileSync(path.join(root,'tools/out/ground-cover-release/report.json')));
if(!label)throw Error('Capture label required');fs.mkdirSync(out,{recursive:true});
const p=await launch({port:9514,width:1440,height:1000,gpu:true}),report={label,date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],scope:'Static native geometry and submission observations, fixed seed/camera/light/time. No quiet-machine timing, physical input or public gameplay claims.'};
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923&buriedMerge');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._buriedRender=g.view.render;g.view.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();g.view.renderer.info.autoReset=false;window._buriedInventory=root=>{let meshes=0,triangles=0,vertices=0;root.traverse(m=>{if(!m.isMesh)return;meshes++;vertices+=m.geometry.attributes.position.count;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;});return{meshes,triangles,vertices};};return true;})()`);
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 report.inventory=await p.eval(`(()=>{const g=__buttloads,v=g.view;return{groups:Object.fromEntries(['cavernScene','deepScene','discovery'].map(k=>[k,_buriedInventory(v[k])])),terrainHash:Array.from(new Uint8Array(g.world.field.buffer)).reduce((h,b)=>Math.imul(h^b,16777619)>>>0,2166136261),contacts:v.obstacles,caveAnchors:v.caveGrowth.map(n=>n.anchor),deepAnchors:v.deepGrowth.map(n=>n.anchor),expeditionAnchors:v.growth.map(n=>[n.x,n.y,n.z]),supportBatches:['caveSupportBatches','deepSupportBatches','expeditionSupportBatches'].map(k=>({name:k,count:v[k]?.batches.length||0}))};})()`);
 const baselineCameras=label==='before'?null:JSON.parse(fs.readFileSync(path.join(root,'tools/out/buried-merge-before/report.json')));
 const fixtures=[];for(const name of ['leaf-detail','scree-detail','mine-wide'])fixtures.push([name,reference.shots.find(s=>s.name===name).camera]);
 const rooms=await p.eval(`__buttloads.world.caverns.networks.map(n=>n.chamber).concat([__buttloads.world.deepTerrain.rooms[0]])`);
 for(const [i,c]of rooms.entries())fixtures.push([i===3?'deep-room':'cave-'+i,{x:c.x,y:c.y-1.6,z:c.z,yaw:.65+i*.42,pitch:-.16}]);
 for(const [name,pose]of fixtures){
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,p=${JSON.stringify(pose)};g.player.teleport(p.x,p.y,p.z);g.player.yaw=p.yaw;g.player.pitch=p.pitch;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._buriedRender.call(v,g,0,10);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();g._buriedRender.call(v,g,0,10);return{camera:p,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles},refresh};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,...data});
 }
 for(const name of ['pump','exchange','receiver','rootway','salvage','vault','heart']){
  const preset=baselineCameras?.shots.find(s=>s.name===name)?.camera;
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE,name=${JSON.stringify(name)},source=['pump','exchange','receiver'].includes(name)?v.deepModels.find(m=>m.root.userData.machine===name).root:name==='rootway'?v.rootway:name==='salvage'?v.salvageModels[0]:name==='vault'?v.vaultModels[0]:v.heartModel,model=source.clone(true);model.visible=true;model.position.set(0,0,0);model.rotation.set(0,0,0);model.updateWorldMatrix(true,true);
   const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),radius=bounds.getSize(new T.Vector3()).length()*.5,camera=new T.PerspectiveCamera(33,1.44,.01,60),distance=radius/Math.sin(33*Math.PI/360)*1.15;camera.position.copy(center).add(new T.Vector3(-.55,.30,-.8).normalize().multiplyScalar(distance));camera.lookAt(center);const preset=${JSON.stringify(preset||null)};if(preset){camera.position.fromArray(preset.position);camera.lookAt(new T.Vector3(...preset.aim));}
   const scene=new T.Scene();scene.background=new T.Color('#333f41');scene.add(model,new T.HemisphereLight('#e4f0f4','#52513f',.75));const key=new T.DirectionalLight('#ffe6c4',2.5);key.position.set(-3,5,-4);key.castShadow=true;key.shadow.autoUpdate=false;key.shadow.needsUpdate=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:25});key.shadow.normalBias=.012;key.shadow.bias=-.0001;scene.add(key);const rim=new T.DirectionalLight('#b2d0da',1.1);rim.position.set(3,2,2);scene.add(rim);
   v.renderer.autoClear=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();v.renderer.render(scene,camera);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();v.renderer.render(scene,camera);return{camera:{position:camera.position.toArray(),aim:preset?.aim||center.toArray()},model:_buriedInventory(model),refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  if(preset)assert.deepEqual(data.camera,preset,'Frozen studio camera must match before accepting a frame');
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,...data});
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');if(report.errors.length||report.input.pointerLock||report.input.keys||report.input.fire)throw Error('Guarded native capture failed');
 console.log(JSON.stringify({label,version:report.version,inventory:report.inventory.groups,shots:report.shots.map(s=>({name:s.name,cached:s.cached,refresh:s.refresh}))}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
