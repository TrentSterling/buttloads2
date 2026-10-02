import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE,originalNet=g.net;
export let crewEquipmentChecks=0;
const test=(name,fn)=>{fn();crewEquipmentChecks++;console.log('PASS crew equipment: '+name);};
const members=(count,tool='cutter')=>Array.from({length:count},(_,i)=>({id:'equipment-'+i,name:'Miner '+i,color:i%8,tool,playing:true,fire:true,sling:{charge:i*.2},player:{x:(i%4-(Math.min(count,4)-1)/2)*1.25,y:.06,z:7-Math.floor(i/4)*2,grounded:true,yaw:Math.PI,pitch:.22,vx:1.5,vz:.2}}));
const show=(list,dt=0)=>{g.net={role:'fixture',members:list,count:list.length+1};g.player.teleport(0,.06,11.5);g.player.yaw=0;g.player.pitch=-.12;g.setScreen(null);v.render(g,dt,4);};
const shown=n=>{for(;n;n=n.parent)if(!n.visible)return false;return true;};
const triangles=n=>(n.geometry.index?.count||n.geometry.attributes.position.count)/3;
function weaponTriangles(frustum,shadow,reference){
 let total=0;
 for(const m of v.miners.values())for(const item of m.weaponMeshes){
  const n=item.source;if(!m.root.visible||!(reference?item.visible: n.visible)||(shadow&&!n.castShadow))continue;
  let parentsVisible=true;for(let p=n.parent;p&&p!==m.root;p=p.parent)if(!p.visible){parentsVisible=false;break;}
  if(!parentsVisible||!n.layers.test(shadow?v.sun.shadow.camera.layers:v.camera.layers)||n.frustumCulled&&!frustum.intersectsObject(n))continue;
  total+=triangles(n);
 }
 if(!reference)for(const group of v.crewWeaponBatches.values())if(group.mesh?.visible&&(!shadow||group.mesh.castShadow))total+=group.mesh.count*triangles(group.mesh);
 return total;
}
function matricesMatch(){
 let instances=0;
 for(const group of v.crewWeaponBatches.values())if(group.mesh?.visible){
  assert.ok(group.active.length>=2);
  for(let i=0;i<group.mesh.count;i++){
   const n=group.active[i].source,matrix=new T.Matrix4();group.mesh.getMatrixAt(i,matrix);
   for(let k=0;k<16;k++)assert.ok(Math.abs(matrix.elements[k]-n.matrixWorld.elements[k])<1e-6);
   assert.equal(group.mesh.geometry,n.geometry);assert.equal(n.visible,false);
   for(const key of ['type','roughness','metalness','emissiveIntensity','side','transparent','opacity','vertexColors','map','bumpMap'])assert.equal(group.mesh.material[key],n.material[key]);
   assert.deepEqual(group.mesh.material.color.toArray(),n.material.color.toArray());
   assert.deepEqual(group.mesh.material.emissive.toArray(),n.material.emissive.toArray());instances++;
  }
 }
 assert.equal(instances,v.crewWeaponBatchStats.instances);
}
try{
 test('all seven equipped models share actual posed pieces without changing geometry or material state',()=>{
  for(const key of Object.keys(B2.TOOLS)){
   v.clearMiners();const list=members(2,key);show(list,.02);assert.ok(v.crewWeaponBatchStats?.groups>0,key+' has no equipment batches');
   const initial=[...v.miners.values()].map(m=>m.weaponMeshes.map(({source})=>source.geometry));
   for(const [pitch,dt]of [[-1.2,.017],[0,.025],[1.2,.043]]){
    list.forEach(p=>p.player.pitch=pitch);show(list,dt);matricesMatch();
    for(const [i,m]of [...v.miners.values()].entries())assert.deepEqual(m.weaponMeshes.map(({source})=>source.geometry),initial[i]);
   }
  }
 });
 test('mixed mechanical heads share only their common actual geometry and retain separate attachments',()=>{
  v.clearMiners();const list=members(4);list.forEach((m,i)=>m.tool=['cutter','scoop','lance','resonance'][i]);show(list,.035);
  assert.ok([...v.crewWeaponBatches.values()].some(group=>group.mesh?.visible&&new Set(group.active.map(item=>item.m.tool)).size===4));
  for(const m of v.miners.values())for(const [key,head]of Object.entries(m.attachments))assert.equal(head.visible,key===m.tool);
  matricesMatch();
 });
 test('native camera and finite shadow culling submit exactly the unbatched weapon triangles',()=>{
  for(const count of [1,2,4,8])for(const key of Object.keys(B2.TOOLS)){
   show(members(count,key),.01);assert.equal(weaponTriangles(v.crewBatchFrustum,false,false),weaponTriangles(v.crewBatchFrustum,false,true));
   v.sun.shadow.updateMatrices(v.sun);const shadow=v.sun.shadow.getFrustum();assert.equal(weaponTriangles(shadow,true,false),weaponTriangles(shadow,true,true));
  }
 });
 test('independent sling charge keeps cores, emissive materials and translucent fields out of shared draws',()=>{
  show(members(4,'sling'),.03);const rigs=[...v.miners.values()];
  assert.deepEqual(rigs.map(m=>m.core.material.emissiveIntensity),[.5,.9,1.3,1.7000000000000002]);
  assert.equal(new Set(rigs.map(m=>m.core.material)).size,4);
  for(const [i,m]of rigs.entries()){
   assert.equal(m.core.visible,true);assert.ok(shown(m.core));assert.equal(m.forks[0].rotation.z,-i*.2*.18);assert.equal(m.forks[1].rotation.z,i*.2*.18);
   assert.equal(m.field.visible,true);assert.equal(m.field.children[0].material.opacity,.35+i*.2*.4);
   for(const group of v.crewWeaponBatches.values())assert.ok(group.sources.every(item=>item.source!==m.core&&!m.field.children.includes(item.source)));
  }
  assert.equal(v.slingToolCore.material.emissiveIntensity,.6);matricesMatch();
 });
 test('singleton, off-camera, hidden roots and clipped shadows preserve original rendering paths',()=>{
  v.clearMiners();show(members(1));assert.equal(v.crewWeaponBatchStats.groups,0);assert.equal(v.crewWeaponBatchStats.instanceBytes,0);
  show(members(4));g.player.yaw=Math.PI;v.render(g,0,4);assert.equal(v.crewWeaponBatchStats.groups,0);
  for(const m of v.miners.values())for(const item of m.weaponMeshes)assert.equal(item.source.visible,item.visible);
  g.player.yaw=0;v.render(g,0,4);assert.ok(v.crewWeaponBatchStats.groups>0);
  for(const m of v.miners.values())m.root.visible=false;v.renderCrewBatches();assert.equal(v.crewWeaponBatchStats.groups,0);
  const camera=v.sun.shadow.camera,prior=[camera.left,camera.right,camera.top,camera.bottom];camera.left=200;camera.right=201;camera.top=201;camera.bottom=200;camera.updateProjectionMatrix();v.render(g,0,4);
  assert.equal(v.crewWeaponBatchStats.groups,0);for(const m of v.miners.values())for(const item of m.weaponMeshes)assert.equal(item.source.visible,item.visible);
  [camera.left,camera.right,camera.top,camera.bottom]=prior;camera.updateProjectionMatrix();
 });
 test('equip changes and departure release borrowed instances before disposing owned clone materials',()=>{
  const list=members(4);show(list,.02);const changed=v.miners.get('equipment-0'),survivor=v.miners.get('equipment-1'),geometry=survivor.weaponMeshes[0].source.geometry;
  let geometryDisposals=0,earlyMaterialDisposals=0;const geometryListener=()=>geometryDisposals++;geometry.addEventListener('dispose',geometryListener);
  for(const material of changed.weaponMaterials)material.addEventListener('dispose',()=>{if(v.scene.children.some(n=>n.name==='crew-weapon-batch'))earlyMaterialDisposals++;});
  list[0].tool='axe';show(list,.02);assert.equal(earlyMaterialDisposals,0);assert.equal(geometryDisposals,0);assert.equal(changed.tool,'axe');matricesMatch();
  v.removeMiner('equipment-0');assert.equal(v.crewWeaponBatches,null);assert.equal(geometryDisposals,0);
  for(const item of survivor.weaponMeshes)assert.equal(item.source.visible,item.visible);
  show(list.slice(1));matricesMatch();geometry.removeEventListener('dispose',geometryListener);
 });
 test('reduced motion leaves equipped meshes present and does not advance cutter rotation',()=>{
  const list=members(2);show(list,.035);const rotations=[...v.miners.values()].map(m=>m.attachments.cutter.rotation.z);g.settings.motion=false;
  show(list,.1);assert.deepEqual([...v.miners.values()].map(m=>m.attachments.cutter.rotation.z),rotations);matricesMatch();
  for(const m of v.miners.values())assert.equal(m.attachments.cutter.visible,true);g.settings.motion=true;
 });
 show(members(2));const rig=v.miners.get('equipment-0'),geometry=rig.weaponMeshes[0].source.geometry;
 await g.install(B2.Saves.validate(B2.Saves.snapshot(g)));show(members(2));
 test('portable world installation, empty crews and offline transition retain or release valid equipment ownership',()=>{
  assert.equal(v.miners.get('equipment-0'),rig);assert.equal(rig.weaponMeshes[0].source.geometry,geometry);matricesMatch();
  show([]);assert.equal(v.crewWeaponBatchStats.groups,0);assert.equal(v.scene.children.filter(n=>n.name==='crew-weapon-batch').length,0);
  show(members(2));g.net.role='offline';v.render(g,0,4);assert.equal(v.miners.size,0);assert.equal(v.scene.children.filter(n=>n.name==='crew-weapon-batch').length,0);
 });
}finally{v.clearMiners();g.net=originalNet;clearInterval(originalNet.timer);h.close();}
console.log(`COMPLETE ${crewEquipmentChecks} crew equipment checks passed (native geometry/culling; no FPS or input claim)`);
