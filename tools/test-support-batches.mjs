import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,T=THREE,batch=B2.WorkshopShapes.batchSupported;
export let supportBatchChecks=0;
const test=async(name,fn)=>{await fn();supportBatchChecks++;console.log('PASS support batches: '+name);};
const selected=batch=>batch.batches.reduce((n,b)=>n+b.mesh.geometry.drawRange.count,0);
const expected=batch=>batch.batches.reduce((n,b)=>n+b.entries.reduce((n,e)=>n+((e.record.root||e.record.mesh).visible&&e.mesh.visible?e.indices.length:0),0),0);
try{
 await test('transformed indexed geometry preserves positions, normals and UVs across independent roots',()=>{
  const parent=new T.Group(),mat=new T.MeshStandardMaterial(),records=[],original=[];
  for(let i=0;i<4;i++){const root=new T.Group();root.position.set(i*.7,-2-i*.13,i*.1);root.rotation.set(.1*i,.2*i,-.05*i);parent.add(root);const mesh=new T.Mesh(new T.ConeGeometry(.17+i*.02,.6+i*.07,5),mat);mesh.position.y=.3;root.add(mesh);records.push({root});original.push(mesh);}
  parent.updateWorldMatrix(true,true);const old=original.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld)),packed=batch(parent,records,16);assert.equal(packed.batches.length,1);const geo=packed.batches[0].mesh.geometry;
  let vertices=0,indices=0;for(const source of old){for(const key of ['position','normal','uv']){const a=source.attributes[key],actual=geo.attributes[key].array.subarray(vertices*a.itemSize,(vertices+a.count)*a.itemSize);assert.deepEqual(actual,a.array);}for(let i=0;i<source.index.count;i++)assert.equal(geo.index.array[indices++],source.index.array[i]+vertices);vertices+=source.attributes.position.count;source.dispose();}
  assert.equal(geo.attributes.position.count,vertices);assert.equal(geo.drawRange.count,indices);assert.ok(geo.boundingBox&&geo.boundingSphere);assert.ok(records.every(r=>r.root.parent===parent&&r.root.children.length===0));
 });
 await test('hiding one support removes only its triangles; unchanged masks do not upload again',()=>{
  const parent=new T.Group(),mat=new T.MeshStandardMaterial(),records=Array.from({length:4},(_,i)=>{const mesh=new T.Mesh(new T.BoxGeometry(),mat);mesh.position.set(i*1.2,0,0);parent.add(mesh);return{mesh};}),packed=batch(parent,records,16),geo=packed.batches[0].mesh.geometry,all=selected(packed),buffer=geo.index.array;
  const version=geo.index.version;assert.equal(packed.sync(),false);assert.equal(geo.index.version,version);records[1].mesh.visible=false;assert.equal(packed.sync(),true);assert.equal(selected(packed),all-36);assert.equal(selected(packed),expected(packed));assert.equal(geo.index.array,buffer);assert.equal(packed.sync(),false);
  for(const r of records)r.mesh.visible=false;packed.sync();assert.equal(geo.drawRange.count,0);assert.equal(packed.batches[0].mesh.visible,false);records[1].mesh.visible=true;packed.sync();assert.equal(geo.drawRange.count,36);assert.equal(packed.batches[0].mesh.visible,true);
 });
 await test('transparent growth and invalid cell sizes reject before any source is detached',()=>{
  const parent=new T.Group(),a=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial()),b=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({transparent:true}));parent.add(a,b);assert.throws(()=>batch(parent,[{mesh:a},{mesh:b}]),/Unsupported/);assert.equal(a.parent,parent);assert.equal(b.parent,parent);assert.equal(parent.children.length,2);assert.throws(()=>batch(parent,[{mesh:a}],0),/cell size/);
 });
 await test('production excavation and reload preserve every independent support mask without render-driven terrain changes',async()=>{
  Object.assign(g.expedition.state,{recovered:[0,1],runes:[0,1,2],awakened:true});for(const body of g.expedition.bodies)body.collected=true;g.expedition.physics.loose.clear();g.expedition.physics.awake.clear();g.deep.state.open=true;g.world.deepOpen=true;
  const field=g.world.field.slice();g.view.renderCaverns(g);g.view.renderDeep(g,5);g.view.renderExpedition(g,0,5);assert.deepEqual(g.world.field,field);
  for(const b of [g.view.caveSupportBatches,g.view.deepSupportBatches,g.view.expeditionSupportBatches])assert.equal(selected(b),expected(b));
  const sites=[g.view.caveGrowth.find(n=>!n.root.userData.formation?.includes('shelves')&&n.root.children.length===0&&n.root.visible),g.view.deepGrowth.find(n=>n.root.visible),g.view.growth.find(n=>n.mesh.visible)];assert.ok(sites.every(Boolean));
  for(const [i,s]of sites.entries()){const p=s.anchor||{x:s.x,y:s.y,z:s.z};assert.ok(g.world.carve(p,.7),'fixture must excavate support '+i);const b=[g.view.caveSupportBatches,g.view.deepSupportBatches,g.view.expeditionSupportBatches][i];g.view.renderCaverns(g);g.view.renderDeep(g,5);g.view.renderExpedition(g,0,5);assert.equal((s.root||s.mesh).visible,false,'excavated support '+i);assert.equal(selected(b),expected(b));}
  const masks=[g.view.caveGrowth.map(n=>n.root.visible),g.view.deepGrowth.map(n=>n.root.visible)],save=B2.Saves.snapshot(g),after=g.world.field.slice();await g.install(B2.Saves.validate(save));g.view.renderCaverns(g);g.view.renderDeep(g,5);g.view.renderExpedition(g,0,5);assert.deepEqual([g.view.caveGrowth.map(n=>n.root.visible),g.view.deepGrowth.map(n=>n.root.visible)],masks);assert.deepEqual(g.world.field,after);
  // Expedition growth already regenerates from edited rays on reload; verify
  // its actual support decisions instead of assuming stable array identities.
  for(const n of g.view.growth)assert.equal(n.mesh.visible,g.world.density(n.x,n.y,n.z)<.04);for(const b of [g.view.caveSupportBatches,g.view.deepSupportBatches,g.view.expeditionSupportBatches])assert.equal(selected(b),expected(b));
 });
 await test('merged wheels retain repair motion, lenses, falling body transforms and rootway state',()=>{
  g.settings.motion=true;g.deep.state.repaired=g.view.deepModels.map(m=>m.node.id);g.view.renderDeep(g,8);
  for(const m of g.view.deepModels){g.view.renderDeep(g,8);assert.equal(m.wheel.parent,m.root);assert.equal(m.wheel.children.length,1);assert.equal(m.wheel.rotation.z,6.4);assert.equal(m.lens.material.emissiveIntensity,1.6);const old=m.node.y;m.node.y-=.7;g.view.renderDeep(g,9);assert.equal(m.root.position.y,m.node.y);assert.equal(m.wheel.rotation.z,7.2);assert.ok(m.lens.parent);m.node.y=old;}
  g.deep.state.open=false;g.view.renderDeep(g,9);assert.equal(g.view.rootway.visible,true);g.deep.state.open=true;g.view.renderDeep(g,9);assert.equal(g.view.rootway.visible,false);
 });
}finally{clearInterval(g.net.timer);h.close();}
console.log('COMPLETE '+supportBatchChecks+' supported batch checks passed');
