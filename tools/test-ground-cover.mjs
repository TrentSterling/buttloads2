// Native decorative geometry contracts; no browser input or subjective taste claim.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(process.argv[2]?{groundCoverSource:fs.readFileSync(process.argv[2],'utf8')}:{}),g=h.game,T=THREE;export let groundCoverChecks=0;
const test=(name,fn)=>{fn();groundCoverChecks++;console.log('PASS ground cover: '+name);};
try{
 const root=g.view.groundCoverScene,ray=new T.Raycaster();assert.ok(root);root.updateMatrixWorld(true);
 test('stone fragments have visible top faces and buried closed foundations',()=>{
  const chips=g.view.groundCoverRecords.filter(r=>r.kind==='chip');assert.ok(chips.length>100);
  for(let i=0;i<chips.length;i+=9){const c=chips[i];ray.set(new T.Vector3(c.x,c.y+.2,c.z),new T.Vector3(0,-1,0));ray.far=.3;const top=ray.intersectObject(root,true)[0];assert.ok(top,'missing stone top');assert.ok(top.face.normal.y>0);assert.ok(top.point.y>c.y+.01);
   ray.set(new T.Vector3(c.x,c.y-.10,c.z),new T.Vector3(0,1,0));ray.far=.12;const base=ray.intersectObject(root,true)[0];assert.ok(base,'open stone foundation');assert.ok(base.point.y<c.y+.001&&base.point.y>c.y-.05);}
 });
 test('low broadleaves remain visible from above their shared roots',()=>{
  const leaves=g.view.groundCoverRecords.filter(r=>r.kind==='leaf');assert.ok(leaves.length>300);
  for(let i=0;i<leaves.length;i+=11){const c=leaves[i];let visible=false;
   // The exact root is a shared edge rounded into Float32. Sample nearby leaf
   // interiors rather than making a point-on-edge hit a rendering requirement.
   for(const dx of [-.045,0,.045])for(const dz of [-.045,0,.045]){const y=B2.COMMON.height(c.x+dx,c.z+dz);ray.set(new T.Vector3(c.x+dx,y+.20,c.z+dz),new T.Vector3(0,-1,0));ray.far=.20;visible ||= ray.intersectObject(root,true).some(hit=>hit.point.y>y+.010&&hit.face.normal.y>0);}
   assert.ok(visible,'leaf root invisible from above at '+c.x+','+c.z);}
 });
 test('complete bounded geometry stays shallow and outside protected excavation, paths and buildings',()=>{
  let meshes=0;root.traverse(m=>{if(!m.isMesh)return;meshes++;assert.equal(m.material,g.view.commonGroundMaterial);assert.equal(m.castShadow,true);assert.equal(m.receiveShadow,true);
   const a=m.geometry.attributes;for(const key of ['normal','uv','color'])assert.equal(a[key].count,a.position.count);for(const b of Object.values(a))assert.ok(b.array.every(Number.isFinite));
   assert.ok(m.geometry.boundingBox);for(let i=0;i<a.position.count;i++){const x=a.position.getX(i),y=a.position.getY(i),z=a.position.getZ(i),offset=y-B2.COMMON.height(x,z);assert.ok(B2.COMMON.planting(x,z,.01),'cover enters a protected route');assert.ok(offset>=-.030&&offset<=.10,'cover floats or makes a hidden barrier');assert.ok(!g.view.obstacles.some(b=>x>b[0]&&x<b[3]&&z>b[2]&&z<b[5]),'cover enters building or machinery footprint');}
  });assert.ok(meshes>=1&&meshes<=9);
 });
}finally{clearInterval(g.net.timer);h.close();}
console.log(`COMPLETE ${groundCoverChecks} ground cover checks passed`);
