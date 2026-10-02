// Native static views, including actual loose ore. No input or timing measurement.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2];assert.ok(['before','after'].includes(label));
const build=path.join(root,label==='before'?'tools/out/ore-batching-before/index.html':'dist/index.html'),out=path.join(root,'tools/out/ore-batching-'+label);fs.mkdirSync(out,{recursive:true});
const reference=label==='after'?JSON.parse(fs.readFileSync(path.join(root,'tools/out/ore-batching-before/report.json'))):null;
const report={date:new Date().toISOString(),label,version:'',buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],scope:'Actual native yard, shaft, cave rooms, carved loose ore and a static thrown position. Direct evaluation only, no input or FPS claim.'};
const p=await launch({port:9540,width:1440,height:1000,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.advanceSimulation=()=>{};g._oreRender=v.render;v.render=()=>{};g.setScreen(null);g.running=false;g.settings.motion=false;g.clock=0;g.fieldKit.dismiss();v.wind={x:0,z:0,time:0};v.renderer.info.autoReset=false;window._oreMeshes=v.oreBatches?[v.oreMesh,...v.oreBatches]:[v.oreMesh];window._oreDraws=[];for(const m of _oreMeshes)m.onBeforeRender=()=>_oreDraws.push({count:m.count});
 window._oreFingerprint=()=>{const words=[],c=new THREE.Color(),matrix=new THREE.Matrix4();for(const n of g.deposits.nodes){const s=v.oreSlots?.get(n.id);if(s)s.mesh.getMatrixAt(s.index,matrix);else v.oreMesh.getMatrixAt(n.id,matrix);words.push(...matrix.elements);if(s)s.mesh.getColorAt(s.index,c);else v.oreMesh.getColorAt(n.id,c);words.push(...c.toArray());}const floats=new Float32Array(words),bits=new Uint32Array(floats.buffer);let hash=2166136261;for(const x of bits)hash=Math.imul(hash^x,16777619);return{words:words.length,hash:hash>>>0};};
 window._orePose=(at,aim)=>{g.player.teleport(at[0],at[1]-1.58,at[2]);g.player.yaw=Math.atan2(at[0]-aim[0],at[2]-aim[2]);g.player.pitch=Math.atan2(aim[1]-at[1],Math.hypot(at[0]-aim[0],at[2]-aim[2]));g.player.resetView();g.accumulator=0;};return true;})()`);
 report.inventory=await p.eval('({nodes:__buttloads.deposits.nodes.length,batches:_oreMeshes.length,geometryVertices:_oreMeshes.reduce((s,m)=>s+m.geometry.attributes.position.count,0),geometryBytes:_oreMeshes.reduce((s,m)=>s+Object.values(m.geometry.attributes).reduce((a,b)=>a+b.array.byteLength,0),0),instanceBytes:_oreMeshes.reduce((s,m)=>s+m.instanceMatrix.array.byteLength+m.instanceColor.array.byteLength,0)})');
 for(const name of ['depot','yard','shaft-mouth','lantern-room','chalk-room','amethyst-room','released-ore','thrown-ore']){
  const shot=await p.eval(`(()=>{const g=__buttloads,v=g.view,name=${JSON.stringify(name)};
   if(name==='depot')_orePose([0,1.64,11.5],[0,1.5,20]);
   if(name==='yard')_orePose([0,1.64,11.5],[0,1.5,0]);
   if(name==='shaft-mouth')_orePose([0,1.64,7],[0,-4,6]);
   if(name.endsWith('-room')){const c=g.world.caverns.networks[['lantern-room','chalk-room','amethyst-room'].indexOf(name)].chamber;_orePose([c.x+.8,c.y+.35,c.z+2],[c.x,c.y+.2,c.z-2]);}
   if(name==='released-ore'){const n=g.deposits.nodes.find(n=>n.y>-5&&!n.collected);window._looseOre=n;g.world.carve({x:n.x,y:n.y,z:n.z},3);for(let i=0;i<90;i++)g.orePhysics.update(1/120);_orePose([n.x,n.y+1.2,n.z+1.6],[n.x,n.y,n.z]);}
   if(name==='thrown-ore'){const n=_looseOre;n.x=2;n.y=1.8;n.z=14;v.updateOre(n);_orePose([2,2.8,11.5],[2,1.8,14]);}
   Object.assign(v.feel,{phase:0,swayX:0,swayY:0,land:0,vy:0,equip:0,yaw:g.player.yaw,pitch:g.player.pitch});g.updateHUD();v.gameUI.dirty=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._oreRender.call(v,g,0,0);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.shadowMap.needsUpdate=false;v.renderer.info.reset();_oreDraws.length=0;g._oreRender.call(v,g,0,0);
   const ore={calls:_oreDraws.length,instances:_oreDraws.reduce((s,m)=>s+m.count,0)};ore.triangles=ore.instances*36;
   return{policy:v.oreCullPolicy||{mode:"original"},camera:{position:v.camera.position.toArray(),rotation:v.camera.rotation.toArray()},cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles},refresh,ore,fingerprint:_oreFingerprint(),loose: name.includes('ore')?{id:_looseOre.id,x:_looseOre.x,y:_looseOre.y,z:_looseOre.z,motion:_looseOre.motion}:null};})()`);
  if(reference){const b=reference.shots.find(s=>s.name===name);assert.deepEqual(shot.camera,b.camera);assert.deepEqual(shot.fingerprint,b.fingerprint);assert.deepEqual(shot.loose,b.loose);for(const key of ['calls','triangles'])assert.equal(shot.cached[key]-shot.ore[key],b.cached[key]-b.ore[key],name+' other submissions');}
  const file=name+'.png';await p.shot(path.join(out,file));report.shots.push({name,file,...shot});console.log(JSON.stringify({label,name,cached:shot.cached,ore:shot.ore}));
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');assert.deepEqual(report.errors,[]);assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
