import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE,A=B2.MineAssetArt;
export let mineAssetChecks=0;
const test=(name,fn)=>{fn();mineAssetChecks++;console.log('PASS mine assets: '+name);};
function solid(geo,label){
 const p=geo.attributes.position,ids=geo.index?.array||Uint32Array.from({length:p.count},(_,i)=>i),edges=new Map(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let volume=0;
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e6)).join(',');
 for(const attr of Object.values(geo.attributes)){assert.equal(attr.count,p.count,label+' incomplete attributes');assert.ok(Array.from(attr.array).every(Number.isFinite),label+' nonfinite attributes');}
 for(let i=0;i<ids.length;i+=3){const tri=Array.from(ids.slice(i,i+3));a.fromBufferAttribute(p,tri[0]);b.fromBufferAttribute(p,tri[1]);c.fromBufferAttribute(p,tri[2]);assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-18,label+' collapsed face');volume+=a.dot(b.clone().cross(c))/6;
  for(let j=0;j<3;j++){const x=key(tri[j]),y=key(tri[(j+1)%3]),k=[x,y].sort().join('|'),e=edges.get(k)||{count:0,balance:0};e.count++;e.balance+=x<y?1:-1;edges.set(k,e);}
 }
 assert.ok(volume>1e-7,label+' inward volume');for(const e of edges.values()){assert.equal(e.count,2,label+' open/nonmanifold edge');assert.equal(e.balance,0,label+' inconsistent winding');}
}
const roots=()=>[v.rootway,...v.salvageModels,...v.vaultModels,v.heartModel];
try{
 test('mineral plates, heart leaves, hoses and chamfers are closed outward solids',()=>{
  for(const seed of [0,.83,3.7,8.91]){const ico=new T.IcosahedronGeometry(.82,0),p=ico.attributes.position;for(const [name,geo]of [['leaf',A.leaf(seed)],['hose',A.sweep([[0,0,0],[.2,.4,.1],[.4,.6,-.2]],[.025,.012])],['plate',A.rockPlate([0,1,2].map(i=>new T.Vector3().fromBufferAttribute(p,i)),seed)],['chamfer',A.chamfer(.13,.15,.25,.008)]]){solid(geo,name+' '+seed);geo.dispose();}ico.dispose();}
 });
 test('heart veins remain embedded in the actual crease between every surface row',()=>{
  for(let seed=0;seed<7;seed++){const geo=A.leaf(seed),mesh=new T.Mesh(geo,new T.MeshBasicMaterial({side:T.FrontSide})),curve=A.sweepCurve(geo.userData.vein,true);mesh.updateMatrixWorld(true);
   for(let i=1;i<100;i++){const c=curve.getPointAt(i/100),origin=c.clone();origin.x+=.3;const hits=new T.Raycaster(origin,new T.Vector3(-1,0,0),0,1).intersectObject(mesh);assert.ok(hits.length,'crease has a hole');assert.ok(Math.abs(hits[0].point.x-c.x)<.003,'floating vein at '+i);}
   const tube=A.sweep(geo.userData.vein,[.020,.012],24,true),p=tube.attributes.position,centers=[];for(let j=0;j<=24;j++){const c=new T.Vector3();for(let i=0;i<6;i++)c.add(new T.Vector3().fromBufferAttribute(p,j*6+i));centers.push(c.multiplyScalar(1/6));}
   for(let j=0;j<24;j++)for(let k=0;k<10;k++){const c=centers[j].clone().lerp(centers[j+1],k/10),origin=c.clone();origin.x+=.3;const hits=new T.Raycaster(origin,new T.Vector3(-1,0,0),0,1).intersectObject(mesh);assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.x-c.x)<.003,'tube segment bridges the crease');}
   tube.dispose();geo.dispose();mesh.material.dispose();
  }
 });
 test('salvage fits its original collision volumes and retains independent whole-body motion',()=>{
  g.expedition.bodies.forEach((b,i)=>{Object.assign(b,{x:i*2,y:-10-i,z:3-i,collected:false});});v.renderExpedition(g,0,10);
  v.salvageModels.forEach((r,i)=>{const b=g.expedition.bodies[i];assert.deepEqual(r.position.toArray(),[b.x,b.y,b.z]);const bounds=new T.Box3().setFromObject(r);for(let axis=0;axis<3;axis++){const key=['x','y','z'][axis],half=B2.SALVAGE[i].size[axis]/2;assert.ok(bounds.min[key]-r.position[key]>=-half-1e-6,'overflow below collider');assert.ok(bounds.max[key]-r.position[key]<=half+1e-6,'overflow above collider');}b.collected=true;});v.renderExpedition(g,0,11);assert.ok(v.salvageModels.every(r=>!r.visible));
 });
 test('merged art has finite complete attributes, opaque single-sided materials and a bounded cost',()=>{
  let meshes=0,triangles=0;for(const root of roots())root.traverse(m=>{if(!m.isMesh)return;meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;const p=m.geometry.attributes.position;for(const key of ['position','normal','uv','color']){const attr=m.geometry.attributes[key];assert.equal(attr.count,p.count);assert.ok(Array.from(attr.array).every(Number.isFinite));}assert.ok(m.castShadow&&m.receiveShadow);assert.ok(m.material.vertexColors);assert.equal(m.material.side,T.FrontSide);assert.equal(m.material.transparent,false);assert.equal(m.material.map,null);});
  assert.ok(meshes<=28,'more than eight additional material draws');assert.ok(triangles<=22000,'exceeds 13,136 triangle art allowance');assert.equal(v.expeditionSupportBatches.batches.length,10);assert.equal(v.deepSupportBatches.batches.length,19);
 });
 test('vault collection, heart motion and opening the rootway affect only their own roots',()=>{
  Object.assign(g.expedition.state,{awakened:false,vaults:[1]});g.deep.state.open=false;v.renderExpedition(g,0,2);v.renderDeep(g,2);assert.deepEqual(v.vaultModels.map(r=>r.visible),[true,false,true]);assert.equal(v.heartModel.visible,true);assert.equal(v.rootway.visible,true);assert.equal(v.heartModel.rotation.y,.6);assert.ok(Math.abs(v.heartModel.position.y-(B2.HEART.y+Math.sin(2.8)*.12))<1e-9);
  g.expedition.state.awakened=true;g.deep.state.open=true;v.renderExpedition(g,0,3);v.renderDeep(g,3);assert.equal(v.heartModel.visible,false);assert.equal(v.rootway.visible,false);assert.deepEqual(v.vaultModels.map(r=>r.visible),[true,false,true]);
 });
 test('rebuilding expedition and deep art releases old resources and reapplies current visibility',()=>{
  const materials=new Set(),geos=new Set();for(const root of roots())root.traverse(m=>{if(m.isMesh){materials.add(m.material);geos.add(m.geometry);}});let disposedM=0,disposedG=0;for(const m of materials)m.addEventListener('dispose',()=>disposedM++);for(const geo of geos)geo.addEventListener('dispose',()=>disposedG++);
  v.makeExpedition(g.expedition);v.makeDeep(g);v.renderExpedition(g,0,3);v.renderDeep(g,3);assert.equal(disposedM,materials.size);assert.equal(disposedG,geos.size);assert.equal(v.heartModel.visible,false);assert.equal(v.rootway.visible,false);assert.deepEqual(v.vaultModels.map(r=>r.visible),[true,false,true]);for(const root of roots())root.traverse(m=>{if(m.isMesh)assert.ok(!materials.has(m.material));});
 });
}finally{h.close();}
console.log(`COMPLETE ${mineAssetChecks} mine asset checks passed (inert renderer; no input or timing claim)`);
