import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,T=THREE;export let landscapeChecks=0;
const test=async(name,fn)=>{await fn();landscapeChecks++;console.log('PASS landscape: '+name);};
try{
 g.view.scene.updateMatrixWorld(true);
 await test('new outcrop exteriors face outward and their central peaks reach established support',()=>{
  const meshes=g.view.commonScene.children.filter(m=>g.view.commonRockMaterials.includes(m.material)),ray=new T.Raycaster();
  for(const r of g.view.commonRocks){
   ray.set(new T.Vector3(r.x,r.bounds[4]+5,r.z),new T.Vector3(0,-1,0));ray.far=10;
   const hit=ray.intersectObjects(meshes)[0];assert.ok(hit,'outcrop top is culled');assert.ok(Math.abs(hit.point.y-r.bounds[4])<1e-5,'outcrop peak does not match established support');assert.ok(hit.face.normal.y>.1);
   // Probe the exposed peak flank. A fixed height above the centre's ground
   // can run beneath the rising ground at the eastern edge of an outcrop.
   ray.set(new T.Vector3(r.bounds[3]+4,r.bounds[4]-.2,r.z),new T.Vector3(-1,0,0));ray.far=10;
   const side=ray.intersectObjects(meshes)[0];assert.ok(side,'exposed outcrop flank is culled');assert.ok(side.point.x>r.x,'front rock face is culled');assert.ok(side.face.normal.x>0);
  }
 });
 await test('powered well presents actual front crystal facets and still uses the existing victory gate',()=>{
  const v=g.view,m=v.beaconMaterials,meshes=v.commonBeacon.children.filter(o=>o.material===m.jade||o.material===m.facet),ray=new T.Raycaster();
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3,cx=5+Math.cos(a)*.46,cz=46+Math.sin(a)*.46,cy=.6+.56+(i===1?.12:0);
   ray.set(new T.Vector3(cx+2,cy,cz),new T.Vector3(-1,0,0));ray.far=3;const hit=ray.intersectObjects(meshes)[0];assert.ok(hit);assert.ok(hit.point.x>cx,'front crystal facet is culled');assert.ok(hit.face.normal.x>0);
  }
  g.foreman.state.defeated=false;v.renderForeman(g,0);assert.equal(v.commonBeacon.visible,false);g.foreman.state.defeated=true;v.renderForeman(g,0);assert.equal(v.commonBeacon.visible,true);assert.ok(v.commonLight.intensity>0);
 });
 await test('meadow patches retain protected claims and paths and use shared ground height',()=>{
  assert.ok(g.view.commonMeadow.length>1000);
  for(const p of g.view.commonMeadow){assert.ok(B.COMMON.planting(p.x,p.z,.55));assert.equal(p.y,B.COMMON.height(p.x,p.z));assert.ok(p.x>-58&&p.x<58&&p.z>-50&&p.z<68);}
  for(const t of g.view.commonTrees)assert.equal(t.y,B.COMMON.height(t.x,t.z));
 });
 await test('merged mapped facades retain complete UVs and finite transformed attributes',()=>{
  for(const mesh of g.view.townScene.children.filter(m=>m.isMesh&&m.material.map)){
   assert.equal(mesh.geometry.attributes.uv.count,mesh.geometry.attributes.position.count,'merged facade lost UVs');for(const attr of Object.values(mesh.geometry.attributes))assert.ok(attr.array.every(Number.isFinite));
  }
 });
}finally{h.close();}
console.log(`COMPLETE ${landscapeChecks} landscape checks passed`);
