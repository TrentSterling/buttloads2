import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE,originalNet=g.net;
export let crewBatchingChecks=0;
const test=(name,fn)=>{fn();crewBatchingChecks++;console.log('PASS crew batching: '+name);};
const members=count=>Array.from({length:count},(_,i)=>({id:'batch-'+i,name:'Miner '+i,color:i%8,tool:Object.keys(B2.TOOLS)[i%7],playing:true,player:{x:(i%4-(Math.min(4,count)-1)/2)*1.25,y:.06,z:7-Math.floor(i/4)*2,grounded:true,yaw:Math.PI,pitch:.2,vx:1.5,vz:.2}}));
const show=(list,dt=0)=>{g.net={role:'fixture',members:list,count:list.length+1};g.player.teleport(0,.06,11.5);g.player.yaw=0;g.player.pitch=-.12;g.setScreen(null);v.render(g,dt,3);};
const vertices=geo=>Object.fromEntries(Object.entries(geo.attributes).map(([name,a])=>[name,{size:a.itemSize,values:Array.from(a.array)}]));
const shadowFrame=()=>{v.sun.shadow.updateMatrices(v.sun);return v.sun.shadow.getFrustum();};
const visibleAncestor=m=>{for(let p=m;p;p=p.parent)if(!p.visible)return false;return true;};
function bodyTriangles(frustum,shadow,reference){
 let n=0;
 for(const m of v.miners.values())for(const source of m.bodyMeshes){
  if(!m.root.visible||(!reference&&!visibleAncestor(source))||(shadow&&!source.castShadow))continue;
  if(!source.layers.test(shadow?v.sun.shadow.camera.layers:v.camera.layers)||!frustum.intersectsObject(source))continue;
  n+=(source.geometry.index?.count||source.geometry.attributes.position.count)/3;
 }
 if(!reference)for(const group of v.crewBodyBatches.values()){const mesh=group.mesh;if(mesh?.visible&&(!shadow||mesh.castShadow))n+=mesh.count*(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;}
 return n;
}
try{
 test('all eight colours retain identical slot geometry and native material properties',()=>{
  show(members(8));const rigs=[...v.miners.values()],base=rigs[0];assert.equal(base.bodyMeshes.length,44);
  for(const m of rigs.slice(1))for(let slot=0;slot<base.bodyMeshes.length;slot++){
   const a=base.bodyMeshes[slot],b=m.bodyMeshes[slot];
   assert.deepEqual(vertices(b.geometry),vertices(a.geometry));assert.deepEqual(Array.from(b.geometry.index?.array||[]),Array.from(a.geometry.index?.array||[]));
   for(const key of ['roughness','metalness','emissiveIntensity','side','transparent','opacity','vertexColors'])assert.equal(a.material[key],b.material[key]);
   assert.deepEqual(a.material.emissive.toArray(),b.material.emissive.toArray());
   for(const key of ['map','bumpMap']){const ma=a.material[key],mb=b.material[key];assert.equal(!!ma,!!mb);if(ma){assert.deepEqual(ma.repeat.toArray(),mb.repeat.toArray());assert.equal(ma.encoding,mb.encoding);assert.equal(ma.wrapS,mb.wrapS);assert.equal(ma.wrapT,mb.wrapT);}}
  }
 });
 test('instance transforms and colours match all actual posed source parts and seven weapons stay separate',()=>{
  for(const list of [members(2),members(4),members(8)]){
   show(list,.025);assert.ok(v.crewBatchStats.groups>0);let instances=0;
   for(const group of v.crewBodyBatches.values())if(group.mesh?.visible){
    for(let i=0;i<group.mesh.count;i++){const item=group.active[i],matrix=new T.Matrix4();group.mesh.getMatrixAt(i,matrix);for(let k=0;k<16;k++)assert.ok(Math.abs(matrix.elements[k]-item.source.matrixWorld.elements[k])<1e-6);assert.deepEqual(group.mesh.material.color.toArray(),item.source.material.color.toArray());assert.equal(item.source.visible,false);instances++;}
   }
   assert.equal(instances,v.crewBatchStats.instances);
   for(const m of v.miners.values()){assert.equal(m.weapon.parent,m.root);assert.equal(m.weapon.children.length,1);assert.equal(m.tool,list.find(p=>p.id===([...v.miners].find(([,r])=>r===m)[0])).tool);assert.ok(m.badge.material.depthTest);}
  }
 });
 test('camera and refreshed-shadow body triangles match unbatched native culling',()=>{
  for(const list of [members(1),members(2),members(4),members(8),members(4).map((m,i)=>({...m,player:{...m.player,z:i>1?17:7}}))]){
   show(list);assert.equal(bodyTriangles(v.crewBatchFrustum,false,false),bodyTriangles(v.crewBatchFrustum,false,true));
   const shadow=shadowFrame();assert.equal(bodyTriangles(shadow,true,false),bodyTriangles(shadow,true,true));
  }
 });
 test('one miner uses original meshes and camera turns update eligibility in the same frame',()=>{
  v.clearMiners();show(members(1));assert.equal(v.crewBatchStats.groups,0);assert.equal(v.crewBatchStats.instanceBytes,0);assert.ok([...v.miners.values()][0].bodyMeshes.every(n=>n.visible));
  show(members(4));assert.ok(v.crewBatchStats.groups>0);g.player.yaw=Math.PI;v.render(g,0,3);assert.equal(v.crewBatchStats.groups,0);
  assert.ok([...v.miners.values()].every(m=>m.bodyMeshes.every(n=>n.visible)));
  g.player.yaw=0;v.render(g,0,3);assert.ok(v.crewBatchStats.groups>0);
 });
 test('off-camera and clipped-shadow casters keep their original visibility paths',()=>{
  const list=members(4).map((m,i)=>({...m,player:{...m.player,z:i>1?17:7}}));show(list);
  for(const m of [...v.miners.values()].slice(2))assert.ok(m.bodyMeshes.every(n=>n.visible));
  const camera=v.sun.shadow.camera,prior=[camera.left,camera.right,camera.top,camera.bottom];camera.left=200;camera.right=201;camera.top=201;camera.bottom=200;camera.updateProjectionMatrix();v.render(g,0,3);
  assert.equal(v.crewBatchStats.groups,0);assert.ok([...v.miners.values()].every(m=>m.bodyMeshes.every(n=>n.visible)));
  [camera.left,camera.right,camera.top,camera.bottom]=prior;camera.updateProjectionMatrix();
 });
 test('owner departure, recolour, empty crews and offline transition release batches without disposing surviving geometry',()=>{
  show(members(4));const survivor=v.miners.get('batch-1');let disposed=0;for(const source of survivor.bodyMeshes)source.geometry.addEventListener('dispose',()=>disposed++);
  v.removeMiner('batch-0');assert.equal(disposed,0);assert.equal(v.crewBodyBatches,null);assert.ok(survivor.bodyMeshes.every(n=>n.visible));
  show(members(4).slice(1));assert.ok(v.crewBatchStats.groups>0);assert.equal(disposed,0);
  const recoloured=members(4).slice(1).map((m,i)=>({...m,color:(i+4)%8}));show(recoloured);assert.deepEqual([...v.miners.values()].map(m=>m.color),[4,5,6]);
  show([]);assert.equal(v.miners.size,0);assert.equal(v.crewBatchStats.groups,0);assert.equal(v.scene.children.filter(n=>n.name==='crew-body-batch').length,0);
  show(members(2));g.net.role='offline';v.render(g,0,3);assert.equal(v.miners.size,0);assert.equal(v.scene.children.filter(n=>n.name==='crew-body-batch').length,0);
 });
 show(members(2));const oldWorld=g.world,rig=v.miners.get('batch-0'),bodyGeometry=rig.bodyMeshes[0].geometry;
 await g.install(B2.Saves.validate(B2.Saves.snapshot(g)));show(members(2));
 test('portable mine installation refreshes grounding and retains valid live rigs and instances',()=>{
  assert.notEqual(g.world,oldWorld);assert.equal(v.miners.get('batch-0'),rig);assert.equal(rig.bodyMeshes[0].geometry,bodyGeometry);assert.equal(rig.floorCache.world,g.world);
  assert.ok(v.crewBatchStats.groups>0);assert.equal(bodyTriangles(v.crewBatchFrustum,false,false),bodyTriangles(v.crewBatchFrustum,false,true));
  assert.equal(bodyTriangles(shadowFrame(),true,false),bodyTriangles(shadowFrame(),true,true));
  for(const group of v.crewBodyBatches.values())if(group.mesh?.visible)assert.ok([...group.mesh.instanceMatrix.array].every(Number.isFinite));
 });
 test('departing miners release owned mesh geometry without disposing the shared sprite geometry',()=>{
  show(members(2));const departed=v.miners.get('batch-0'),survivor=v.miners.get('batch-1');
  assert.equal(departed.badge.geometry,survivor.badge.geometry);
  let badgeDisposals=0,bodyDisposals=0;const badgeListener=()=>badgeDisposals++;
  departed.badge.geometry.addEventListener('dispose',badgeListener);
  for(const source of departed.bodyMeshes)source.geometry.addEventListener('dispose',()=>bodyDisposals++);
  v.removeMiner('batch-0');departed.badge.geometry.removeEventListener('dispose',badgeListener);
  assert.equal(bodyDisposals,44);assert.equal(badgeDisposals,0);
  show(members(2));assert.equal(v.miners.get('batch-0').badge.geometry,survivor.badge.geometry);
 });
}finally{v.clearMiners();g.net=originalNet;clearInterval(originalNet.timer);h.close();}
console.log(`COMPLETE ${crewBatchingChecks} crew batching checks passed (native geometry/culling; no FPS or input claim)`);
