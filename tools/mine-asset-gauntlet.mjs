// Native studio and exposed-room fixtures. No input, simulation or frame timing.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2],build=path.resolve(root,process.argv[3]||'dist/index.html');
assert.ok(label);const out=path.join(root,'tools/out/mine-asset-'+label);fs.mkdirSync(out,{recursive:true});
const before=label==='before'?null:JSON.parse(fs.readFileSync(path.join(root,'tools/out/mine-asset-before/report.json')));
const p=await launch({port:9517,width:1440,height:1000,gpu:true}),report={label,date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],scope:'Fixed native studio and exposed-room fixtures. Direct terrain carving exposes buried props; simulation is stopped. No gameplay, pointer lock, physical input or frame-time claim.'};
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923&mineAssetArt');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.setScreen(null);g.running=false;g.settings.motion=false;g._assetRender=v.render;v.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();v.renderer.info.autoReset=false;window._assetSource=name=>name==='rootway'?v.rootway:name==='heart'?v.heartModel:name.startsWith('vault')?v.vaultModels[+name.slice(-1)]:v.salvageModels[+name.slice(-1)];window._assetInventory=root=>{let meshes=0,triangles=0,vertices=0;root.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;vertices+=m.geometry.attributes.position.count;}});return{meshes,triangles,vertices};};return true;})()`);
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 report.inventory=await p.eval(`Object.fromEntries(['rootway','salvage0','salvage1','vault0','vault1','vault2','heart'].map(k=>[k,_assetInventory(_assetSource(k))]))`);
 const poses=[['salvage0',[-2.6,1.35,-3.4],[2.8,1.35,.3],[0,-.08,0]],['salvage1',[-3,1.7,-4.2],[3,1.5,1.6],[0,0,0]],['rootway',[-2,2.5,-3],[2,.5,3.2],[0,0,0]],...['vault0','vault1','vault2'].map(k=>[k,[-1.8,1.05,-2.7],[2.4,.7,2],[0,0,0]]),['heart',[-2.5,1.1,-3.5],[3.1,.65,1.6],[0,.05,0]]];
 for(const [asset,front,side,aim]of poses)for(const [sideName,position]of [['front',front],['side',side]]){
  const name=asset+'-'+sideName,preset=before?.shots.find(s=>s.name===name)?.camera||{position,aim};
  const data=await p.eval(`(()=>{const v=__buttloads.view,T=THREE,model=_assetSource(${JSON.stringify(asset)}).clone(true);model.visible=true;model.position.set(0,0,0);model.quaternion.identity();const preset=${JSON.stringify(preset)},camera=new T.PerspectiveCamera(33,1.44,.01,30);camera.position.fromArray(preset.position);camera.lookAt(new T.Vector3(...preset.aim));const scene=new T.Scene();scene.background=new T.Color('#293334');scene.add(model,new T.HemisphereLight('#d7e8e6','#41443a',.7));const key=new T.DirectionalLight('#ffe8cb',2.2);key.position.set(-3,5,-4);key.castShadow=true;key.shadow.autoUpdate=false;key.shadow.needsUpdate=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:20});key.shadow.normalBias=.01;scene.add(key);const rim=new T.DirectionalLight('#b8c9e2',.8);rim.position.set(3,1,2);scene.add(rim);v.renderer.autoClear=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();v.renderer.render(scene,camera);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();v.renderer.render(scene,camera);return{camera:preset,model:_assetInventory(model),refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles},bounds:new T.Box3().setFromObject(model).getSize(new T.Vector3()).toArray()};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,kind:'model',...data});
 }
 const fixtures=before?before.shots.filter(s=>s.kind==='game').map(s=>({name:s.name,camera:s.camera,carve:s.carve})):await p.eval(`(()=>{const at=[B2.SALVAGE[0],B2.SALVAGE[1],B2.VAULTS[2],{x:2,y:-68,z:2}];return at.map((a,i)=>{const offset=i===3?[-1.9,1,3]:[-2.1,1.1,-3.2],head=new THREE.Vector3(a.x+offset[0],a.y+offset[1],a.z+offset[2]),aim=new THREE.Vector3(a.x,a.y+(i===3?.2:0),a.z),d=aim.sub(head).normalize();return{name:['room-flywheel','room-engine','room-geode','room-heart'][i],camera:{x:head.x,y:head.y-__buttloads.player.eye,z:head.z,yaw:Math.atan2(-d.x,-d.z),pitch:Math.asin(d.y)},carve:{x:a.x,y:a.y,z:a.z,radius:i===3?3.8:3.1}};});})()`);
 for(const f of fixtures){
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,f=${JSON.stringify(f)},c=f.carve,p=f.camera;g.world.carve(c,c.radius);g.player.teleport(p.x,p.y,p.z);g.player.yaw=p.yaw;g.player.pitch=p.pitch;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._assetRender.call(v,g,0,10);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();g._assetRender.call(v,g,0,10);return{camera:p,carve:c,refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  await p.shot(path.join(out,f.name+'.png'));report.shots.push({name:f.name,kind:'game',...data});
 }
 report.terrainHash=await p.eval('Array.from(new Uint8Array(__buttloads.world.field.buffer)).reduce((h,b)=>Math.imul(h^b,16777619)>>>0,2166136261)');
 if(before){assert.equal(report.terrainHash,before.terrainHash);for(const s of report.shots)assert.deepEqual(s.camera,before.shots.find(t=>t.name===s.name).camera);}
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');assert.deepEqual(report.errors,[]);assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
 console.log(JSON.stringify({label,version:report.version,inventory:report.inventory,shots:report.shots.map(s=>({name:s.name,...s.cached}))}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
