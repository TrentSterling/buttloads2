// Probe native front-face geometry; no browser, input or timing benchmark.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),v=h.game.view,T=THREE;
if(process.argv[2]){vm.runInThisContext(fs.readFileSync(process.argv[2],'utf8'));v.makeCommon();}
export let reservoirChecks=0;let failures=0;
const test=(name,fn)=>{try{fn();reservoirChecks++;console.log('PASS reservoir: '+name);}catch(error){failures++;console.error('FAIL reservoir: '+name+' / '+error.message);}};
try{
 v.commonScene.updateMatrixWorld(true);
 const {x,y,z}=v.waterTower,m=v.reservoirMaterials,ray=new T.Raycaster();
 const probe=(material,origin,direction)=>{ray.set(new T.Vector3(...origin),new T.Vector3(...direction));ray.far=8;return ray.intersectObjects(v.commonScene.children.filter(o=>o.material===material))[0];};
 test('roof is opaque from above and beneath every panel',()=>{
  for(let j=0;j<24;j++){
   const a=(j+.5)/24*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
   const top=probe(m.roof,[x+c*1.6,y+14,z+s*1.6],[0,-1,0]);
   assert.ok(top&&top.point.y>y+11&&top.face.normal.y>0,'exterior roof panel missing at '+j);
   const underside=probe(m.roof,[x+c*2.1,y+10.85,z+s*2.1],[0,1,0]);
   assert.ok(underside&&underside.point.y<y+11.2&&underside.face.normal.y<0,'sky visible through roof underside at '+j);
  }
 });
 test('tank staves face approaching players around the entire reservoir',()=>{
  for(let j=0;j<32;j++){
   const a=(j+.5)/32*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
   const hit=probe(m.timber,[x+c*4,y+9.8,z+s*4],[-c,0,-s]);
   assert.ok(hit&&Math.hypot(hit.point.x-x,hit.point.z-z)>1.97,'front stave missing at '+j);
   assert.ok(hit.face.normal.x*c+hit.face.normal.z*s>.9,'tank surface faces inward at '+j);
  }
 });
 test('tank hoops have front-facing top and bottom surfaces',()=>{
  for(let j=0;j<16;j++){
   const a=(j+.37)/16*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
   for(const [height,direction,sign]of [[9.8,-1,1],[8.9,1,-1]]){
    const hit=probe(m.metal,[x+c*2.052,y+height,z+s*2.052],[0,direction,0]);
    assert.ok(hit&&Math.abs(hit.point.y-y-9.3)<.07,'hoop surface missing at '+j);
    assert.ok(hit.face.normal.y*sign>.9,'hoop surface faces inward at '+j);
   }
  }
 });
}finally{clearInterval(h.game.net.timer);h.close();}
if(failures)throw Error('INCOMPLETE '+failures+' reservoir contracts failed');
console.log(`COMPLETE ${reservoirChecks} reservoir checks passed`);
