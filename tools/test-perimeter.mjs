import assert from 'node:assert/strict';
import fs from 'node:fs';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(process.argv[2]?{perimeterArtSource:fs.readFileSync(process.argv[2],'utf8')}:{}),g=h.game,T=THREE;export let perimeterChecks=0;
const test=(name,fn)=>{fn();perimeterChecks++;console.log('PASS perimeter: '+name);};
try{
 g.view.scene.updateMatrixWorld(true);const root=g.view.perimeterScene,ray=new T.Raycaster();assert.ok(root);
 test('inside faces and top caps remain visible on every side of the boundary',()=>{
  for(const [x,z,dx,dz]of [[-58.3,12.71,-1,0],[-58.3,46.21,-1,0],[58.3,12.71,1,0],[58.3,46.21,1,0],[-27.13,-50.3,0,-1],[17.31,-50.3,0,-1],[-27.13,68.3,0,1],[17.31,68.3,0,1]]){
   const y=B2.COMMON.height(x,z);ray.set(new T.Vector3(x-dx*2,y+.45,z-dz*2),new T.Vector3(dx,0,dz));ray.far=3;
   const hit=ray.intersectObject(root,true)[0];assert.ok(hit,'missing inward-facing wall at '+x+','+z);assert.ok(hit.face.normal.dot(new T.Vector3(dx,0,dz))<-.5);
  }
  for(const side of [0,1,2,3]){
   const caps=g.view.perimeterStones.filter(s=>s.side===side&&s.row===2);
   for(let i=4;i<caps.length;i+=17){const s=caps[i];ray.set(new T.Vector3(s.x,s.y+2,s.z),new T.Vector3(0,-1,0));ray.far=2;
    const hit=ray.intersectObject(root,true)[0];assert.ok(hit,'open wall cap');assert.ok(hit.face.normal.y>.4);assert.ok(hit.point.y>s.y+.8&&hit.point.y<s.y+1.1);}
  }
 });
 test('foundation meets sloping ground and all boundary vertices stay outside traversable land',()=>{
  const area=B2.SURFACE;root.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(p.getX(i)<area.minX||p.getX(i)>area.maxX||p.getZ(i)<area.minZ||p.getZ(i)>area.maxZ,'decorative stone enters capsule travel');});
  for(const side of [0,1,2,3]){const bases=g.view.perimeterStones.filter(s=>s.side===side&&s.row===0);for(let i=3;i<bases.length;i+=13){const s=bases[i];ray.set(new T.Vector3(s.x,s.y-.45,s.z),new T.Vector3(0,1,0));ray.far=.5;
   const hit=ray.intersectObject(root,true)[0];assert.ok(hit,'foundation absent under slope');assert.ok(hit.point.y<=s.y+.015&&hit.point.y>=s.y-.20,'foundation floats or separates from ground');}}
 });
 test('staggered face joints have stone backing instead of open views through the wall',()=>{
  for(const [x,z,dx,dz]of [[-58.3,15.13,-1,0],[58.3,15.13,1,0],[-22.31,-50.3,0,-1],[-22.31,68.3,0,1]])for(let j=0;j<43;j++)for(const lift of [.45,.61]){
   const px=x+(dz?j*.23:0),pz=z+(dx?j*.23:0),y=B2.COMMON.height(px,pz)+lift;
   ray.set(new T.Vector3(px-dx*2,y,pz-dz*2),new T.Vector3(dx,0,dz));ray.far=2.7;
   assert.ok(ray.intersectObject(root,true)[0],'open through-joint at '+px+','+pz+' / '+lift);
  }
 });
}finally{clearInterval(g.net.timer);h.close();}
console.log(`COMPLETE ${perimeterChecks} perimeter checks passed`);
