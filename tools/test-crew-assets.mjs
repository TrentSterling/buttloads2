import assert from 'node:assert/strict';
import fs from 'node:fs';
import {nodeGame} from './node-game.mjs';
const baseline=process.argv.includes('--baseline');
const h=await nodeGame(baseline?{sources:{'crew-view':fs.readFileSync('tools/out/crew-assets-before/crew-view.js','utf8')}}:{}),g=h.game,v=g.view,T=THREE,net=g.net;
export let crewAssetChecks=0;
const test=(name,fn)=>{fn();crewAssetChecks++;console.log('PASS crew assets: '+name);};
const keys=Object.keys(B2.TOOLS),mechanical=['cutter','scoop','lance','resonance'];
const template=key=>mechanical.includes(key)?v.tool:key==='sling'?v.slingTool:key==='axe'?v.axeTool:v.magicTool;
const meshes=root=>{const list=[];root.traverse(n=>{if(n.isMesh)list.push(n);});return list;};
const members=key=>Array.from({length:4},(_,i)=>({id:'assets-'+i,name:'Miner '+i,color:i,tool:key,fire:true,sling:{charge:i*.25},player:{x:(i-1.5)*1.25,y:.06,z:7,grounded:true,yaw:Math.PI,pitch:.22,vx:1.5,vz:.2}}));
const show=list=>{g.net={role:'fixture',members:list,count:list.length+1};g.player.teleport(0,.06,11.5);g.player.yaw=0;g.player.pitch=-.12;g.setScreen(null);v.render(g,.035,4);};
try{
 test('remote rigs retain only the equipped head and never clone local gloves or unused branches',()=>{
  for(const key of keys){
   const source=template(key),heads={cutter:v.rotor,scoop:v.scoopHead,lance:v.lanceHead,resonance:v.resonatorHead};
   const ignored=source.children.filter(n=>n.userData.viewmodelOnly||mechanical.includes(key)&&Object.entries(heads).some(([tool,node])=>tool!==key&&node===n));
   let ignoredClones=0;const methods=ignored.map(n=>n.clone);
   ignored.forEach(n=>n.clone=function(...args){ignoredClones++;return T.Object3D.prototype.clone.apply(this,args);});
   let m;
   try{m=v.makeMiner('branches',1,'Inspector');v.equipMiner(m,key);assert.equal(ignoredClones,0,key+' cloned a hidden glove or unused head');}
   finally{ignored.forEach((n,i)=>n.clone=methods[i]);}
   assert.equal(m.weaponMeshes.length,{cutter:11,scoop:12,lance:13,resonance:13,gravity:4,axe:8,sling:10}[key]);
   assert.ok(meshes(m.weapon).every(n=>!n.userData.viewmodelOnly));
   assert.deepEqual(Object.keys(m.attachments),mechanical.includes(key)?[key]:[]);
   if(mechanical.includes(key))assert.equal(m.attachments[key].visible,true);
   v.removeMiner('branches');
  }
 });
 test('static materials and geometry are borrowed exactly; only the charged sling core owns a clone',()=>{
  for(const key of keys){
   show(members(key));const original=new Set(meshes(template(key)).map(n=>n.material)),geometries=new Set(meshes(template(key)).map(n=>n.geometry));
   for(const m of v.miners.values()){
    assert.equal(m.weaponMaterials.length,key==='sling'?1:0);
    for(const item of m.weaponMeshes){assert.ok(geometries.has(item.source.geometry));if(key==='sling'&&item.source===m.core){assert.ok(!original.has(item.source.material));assert.equal(item.source.material,m.weaponMaterials[0]);}else assert.ok(original.has(item.source.material));}
   }
   for(const group of v.crewWeaponBatches.values())if(group.mesh)assert.ok(original.has(group.mesh.material));
  }
 });
 test('four distinct sling charges never mutate another miner or the local core material',()=>{
  const local=v.slingToolCore.material,prior=local.emissiveIntensity;show(members('sling'));
  const rigs=[...v.miners.values()];assert.equal(new Set(rigs.map(m=>m.core.material)).size,4);
  assert.deepEqual(rigs.map(m=>m.core.material.emissiveIntensity),[.5,1,1.5,2]);assert.equal(local.emissiveIntensity,prior);
  local.emissiveIntensity=3.75;assert.deepEqual(rigs.map(m=>m.core.material.emissiveIntensity),[.5,1,1.5,2]);local.emissiveIntensity=prior;
  const changed=members('sling');changed[1].sling.charge=.1;show(changed);assert.deepEqual(rigs.map(m=>m.core.material.emissiveIntensity),[.5,.7,1.5,2]);
 });
 test('all seven tool switches and departures preserve borrowed assets and dispose each owned core once',()=>{
  v.clearMiners();const materials=new Set(),geometries=new Set();for(const key of keys)for(const mesh of meshes(template(key))){materials.add(mesh.material);geometries.add(mesh.geometry);}
  let borrowedDisposals=0,ownedDisposals=0,earlyDisposals=0;const record=()=>borrowedDisposals++;
  for(const object of [...materials,...geometries])object.addEventListener('dispose',record);
  try{
   const list=members('sling');show(list);
   for(const m of v.miners.values())m.core.material.addEventListener('dispose',()=>{ownedDisposals++;if(v.scene.children.some(n=>n.name==='crew-weapon-batch'))earlyDisposals++;});
   for(const key of keys){list.forEach(m=>m.tool=key);show(list);for(const m of v.miners.values())assert.equal(m.tool,key);}
   // The initial four cores are disposed on the first switch, independently of
   // the four new cores created when the cycle eventually returns to sling.
   assert.equal(ownedDisposals,4);v.clearMiners();assert.equal(ownedDisposals,4);assert.equal(earlyDisposals,0);assert.equal(borrowedDisposals,0);
  }finally{for(const object of [...materials,...geometries])object.removeEventListener('dispose',record);}
 });
 test('same-tool updates allocate no material or model clones and retain exact grip endpoints',()=>{
  for(const key of keys){
   const list=members(key);show(list);const m=v.miners.get('assets-0'),model=m.weapon.children[0],owned=m.weaponMaterials.slice(),materials=m.weaponMeshes.map(item=>item.source.material);
   for(const pitch of [-1.2,0,1.2]){list.forEach(p=>p.player.pitch=pitch);show(list);assert.equal(m.weapon.children[0],model);assert.deepEqual(m.weaponMaterials,owned);assert.deepEqual(m.weaponMeshes.map(item=>item.source.material),materials);
    const grip=key==='gravity'?new T.Vector3(0,-.168,.04):key==='axe'?new T.Vector3(-.01,-.13,.022):key==='sling'?new T.Vector3(0,-.11,.024):new T.Vector3(0,-.22,.096);model.localToWorld(grip);const palm=m.elbows[1].localToWorld(new T.Vector3(0,-.265,-.01));assert.ok(palm.distanceTo(grip)<.025,key+' grip');
   }
  }
 });
 show(members('cutter'));const rig=v.miners.get('assets-0'),model=rig.weapon.children[0],materials=rig.weaponMeshes.map(item=>item.source.material);
 await g.install(B2.Saves.validate(B2.Saves.snapshot(g)));show(members('cutter'));
 test('portable world replacement retains live borrowed ownership; offline cleanup leaves local tools intact',()=>{
  assert.equal(v.miners.get('assets-0'),rig);assert.equal(rig.weapon.children[0],model);assert.deepEqual(rig.weaponMeshes.map(item=>item.source.material),materials);
  g.net.role='offline';v.render(g,0,4);assert.equal(v.miners.size,0);assert.equal(v.scene.children.filter(n=>n.name==='crew-weapon-batch').length,0);
  for(const key of keys)assert.ok(meshes(template(key)).length>0);
 });
}finally{v.clearMiners();g.net=net;clearInterval(net.timer);h.close();}
console.log(`COMPLETE ${crewAssetChecks} crew asset checks passed (actual equipment ownership and poses; no FPS claim)`);
