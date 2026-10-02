// Real capsule, furniture meshes and remote grounding. No browser or OS input.
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,T=THREE;export let commonArtChecks=0;
const test=async(name,fn)=>{await fn();commonArtChecks++;console.log('PASS common art: '+name);};
const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);
const hit=(x,z)=>{ray.set(new T.Vector3(x,30,z),down);ray.far=40;return ray.intersectObjects(g.view.furnitureScene.children)[0];};
try{
 g.view.scene.updateMatrixWorld(true);
 await test('well has a recessed opening and solid rim rather than an invisible cap',()=>{
  const w=B.TOWN.well,p=g.player;assert.ok(Math.abs(hit(w.x,w.z).point.y-.19)<1e-6);
  assert.equal(p.blocked(w.x,.06,w.z),false);
  for(let i=0;i<16;i++){const a=(i+.5)*Math.PI/8,x=w.x+Math.cos(a)*1.15,z=w.z+Math.sin(a)*1.15;assert.ok(Math.abs(hit(x,z).point.y-w.top)<1e-6);assert.ok(p.blocked(x,.05,z));assert.ok(!p.blocked(x,w.top+.01,z));}
  for(let course=0;course<3;course++)for(let i=0;i<16;i++){
   const a=(i+.5)*Math.PI/8+course%2*Math.PI/16,dx=Math.cos(a),dz=Math.sin(a);
   if(Math.abs(dx)<.12&&dz<-.9)continue; // The spill lip deliberately covers this face.
   ray.set(new T.Vector3(w.x+dx*3,.175+course*.235,w.z+dz*3),new T.Vector3(-dx,0,-dz));
   const surface=ray.intersectObjects(g.view.furnitureScene.children)[0];assert.ok(surface);assert.ok(Math.abs(Math.hypot(surface.point.x-w.x,surface.point.z-w.z)-(w.outer-.05))<.012,'liner obscures masonry course');
  }
  p.teleport(w.x,.06,w.z);for(let i=0;i<80;i++)p.step(1/120,new Set(['Space']),6);assert.ok(p.y>2,'well opening blocks lift');
 });
 await test('all seats block walking and support standing with identical guest contact',()=>{
  const guest=new B.Player(g.world);guest.obstacles=B.Town.obstacles();
  for(const b of B.TOWN.benches()){
   for(const p of [g.player,guest]){assert.ok(p.blocked(b.x,b.y+.05,b.z));const z=b.z-b.back*(b.depth-.13)/4;p.teleport(b.x,b.y+.58,z);for(let i=0;i<80;i++)p.step(1/120,new Set(),6);assert.ok(p.grounded);assert.ok(Math.abs(p.y-b.y-.55)<.01);assert.ok(!p.blocked(p.x,p.y,p.z));}
  }
 });
 await test('remote boots resolve onto the actual well rim and all three seat meshes',()=>{
  const m=g.view.makeMiner('furniture-grounding',1,'Test'),w=B.TOWN.well,points=[{x:w.x+1.15,y:w.top,z:w.z},...B.TOWN.benches().map(b=>({x:b.x,y:b.y+.55,z:b.z-b.back*(b.depth-.13)/4}))];
  for(const q of points){m.floorCache=null;const floor=hit(q.x,q.z);assert.ok(floor);assert.ok(Math.abs(g.view.minerFloor(m,{...q,grounded:true},g.world)-(floor.point.y-.012))<1e-6);}
  g.view.removeMiner('furniture-grounding');
 });
 await test('root bases conform to ground and soft planting stays outside claims and public paths',()=>{
  assert.equal(g.view.rootContacts.length,g.view.commonTrees.length*16);for(const [x,y,z]of g.view.rootContacts)assert.ok(Math.abs(y-B.COMMON.height(x,z)+.065)<1e-8);
  assert.ok(g.view.commonUnderstory.length>70);for(const p of g.view.commonUnderstory){assert.ok(B.COMMON.planting(p.x,p.z,.30));assert.equal(p.y,B.COMMON.height(p.x,p.z));}
  for(const root of [g.view.furnitureScene,g.view.commonScene])root.traverse(o=>{if(o.geometry){for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));if(o.material.map)assert.equal(o.geometry.attributes.uv.count,o.geometry.attributes.position.count,'mapped geometry lacks UVs');}});
 });
}finally{h.close();}
console.log(`COMPLETE ${commonArtChecks} common art checks passed`);
