// Production surface geometry, controller and save migration. No browser/input.
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,T=THREE,C=B.COMMON;
export let commonChecks=0;
const test=async(name,fn)=>{await fn();commonChecks++;console.log('PASS common: '+name);};
function walk(x,z){
 for(let i=0;i<4200&&Math.hypot(g.player.x-x,g.player.z-z)>.16;i++){
  g.player.yaw=Math.atan2(g.player.x-x,g.player.z-z);g.player.step(1/120,new Set(['KeyW']),6);
 }
 assert.ok(Math.hypot(g.player.x-x,g.player.z-z)<.22,`route stopped at ${g.player.x.toFixed(2)},${g.player.y.toFixed(2)},${g.player.z.toFixed(2)} approaching ${x},${z}`);
 assert.ok(!g.player.blocked(g.player.x,g.player.y,g.player.z),'walking capsule overlaps ground or scenery');
}
try{
 await test('raised common leaves both excavation fields, their joins and all shop approaches unchanged',()=>{
  const old=g.world.field.slice(),oldParcel=new B.ParcelTerrain(g.world.seed).field();
  for(let z=-16;z<=16;z+=.5)for(let x=-16;x<=48;x+=.5)assert.equal(C.height(x,z),0,'mine/parcel rim must stay level');
  for(const b of B.TOWN.buildings)for(const x of [b.x-b.w/2,b.x,b.x+b.w/2])for(const z of [b.z-b.d/2,b.z,b.z+b.d/2])assert.equal(C.height(x,z),0,'building foundations');
  for(const [x,z] of [[-43,23],[45,47],[-37,-39],[27,-41]])assert.ok(C.height(x,z)>2,'actual rise required');
  assert.deepEqual(g.world.field,old);assert.deepEqual(new B.ParcelTerrain(g.world.seed).field(),oldParcel);
 });
 await test('rendered slopes and production collision share the same surface on 450 scattered rays',()=>{
  g.view.scene.updateMatrixWorld(true);const ray=new T.Raycaster(),rng=B.random(532),down=new T.Vector3(0,-1,0);let count=0;
  while(count<450){const x=-57+rng()*114,z=-49+rng()*116;if(!C.outside(x,z))continue;
   ray.set(new T.Vector3(x,40,z),down);const hits=ray.intersectObjects(g.view.surfaceGround,false);assert.ok(hits.length,`missing surface ${x},${z}`);
   const y=C.height(x,z);assert.ok(Math.abs(hits[0].point.y-y)<1e-5,`visual/collision mismatch ${hits[0].point.y-y}`);assert.ok(Math.abs(g.world.density(x,y,z))<1e-8);assert.ok(g.world.density(x,y+.02,z)>0);assert.ok(g.world.density(x,y-.02,z)<0);count++;
  }
  for(const [x,z] of [[0,0],[12,-10],[35,-9]]){ray.set(new T.Vector3(x,40,z),down);assert.equal(ray.intersectObjects(g.view.surfaceGround,false).length,0,'uneditable cap across mine');}
 });
 await test('walk from the mine gate along the winding trail to the reservoir and return without lift',()=>{
  g.player.teleport(19,.06,4);for(const [x,z] of [[35,4],[48,4],[52,13],[48,24],[45,33],[42,42],[42,47.6]])walk(x,z);
  assert.ok(g.player.y>4,'path must reach the ridge');const summit=g.player.y;
  for(const [x,z] of [[42,42],[45,33],[48,24],[52,13],[48,4],[35,4],[19,4]])walk(x,z);
  assert.ok(g.player.y<.3);console.log('  climbed to '+summit.toFixed(2)+' m using the production walking capsule');
 });
 await test('common land remains protected against digging even on raised slopes',()=>{
  const field=g.world.field.slice(),edits=g.world.audit.edits;
  for(const [x,z] of [[45,43],[-43,23],[-37,-39],[27,-41]]){const y=C.height(x,z);assert.equal(g.world.canDig(x,y-.2,z),false);assert.equal(g.world.carve({x,y:y-.4,z},4),0);assert.ok(Math.abs(g.world.density(x,y-.4,z)+.4)<1e-8);}
  assert.equal(g.world.audit.edits,edits);assert.deepEqual(g.world.field,field);
 });
 await test('trees and landmarks stand on the shared surface and their solid bodies stop the capsule',()=>{
  assert.ok(g.view.commonTrees.length>35);assert.ok(g.view.commonGardens.length===4);
  for(const t of g.view.commonTrees){assert.equal(t.y,C.height(t.x,t.z));if(t.x>B.SURFACE.minX+.6&&t.x<B.SURFACE.maxX-.6&&t.z>B.SURFACE.minZ+.6&&t.z<B.SURFACE.maxZ-.6)assert.ok(g.player.blocked(t.x,t.y+.1,t.z),'tree trunk has no collision');}
  const t=g.view.waterTower;assert.equal(t.y,C.height(t.x,t.z));assert.ok(g.player.blocked(t.x,t.y+8,t.z),'reservoir is solid');
  for(const r of g.view.commonRocks)assert.ok(g.player.blocked(r.x,r.y+.2,r.z),'outcrop is solid');
  for(const obj of [g.view.commonScene,...g.view.surfaceGround])obj.traverse(n=>{if(n.isMesh)for(const a of Object.values(n.geometry.attributes))assert.ok(a.array.every(Number.isFinite),'finite scenery geometry');});
 });
 await test('old flat-ground save positions rise safely at the same location with the entire mine and ledger intact',async()=>{
  const saved=B.Saves.snapshot(g);saved.player.x=45;saved.player.z=38;saved.player.y=.06;
  assert.ok(C.height(45,38)>2);const old=saved.field.slice(),state=structuredClone(saved.state);await g.install(B.Saves.validate(saved));
  assert.equal(g.player.x,45);assert.equal(g.player.z,38);assert.ok(g.player.y>C.height(45,38));assert.equal(g.player.blocked(g.player.x,g.player.y,g.player.z),false);assert.deepEqual(g.world.field,old);assert.deepEqual(g.economy.state,state);
  const next=B.Saves.snapshot(g),valid=B.Saves.validate(next);await g.install(valid);assert.equal(g.player.x,45);assert.equal(g.player.z,38);assert.deepEqual(g.world.field,old);
 });
 await test('surface presentation leaves saved terrain, ore and economy unchanged across views and reload',()=>{
  const field=g.world.field.slice(),state=structuredClone(g.economy.state),ore=g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected]);
  for(const [x,z] of [[42,47.5],[-42,21],[10,29],[-9,34]]){g.player.teleport(x,C.height(x,z)+.2,z);g.view.render(g,.016,18);}
  assert.deepEqual(g.world.field,field);assert.deepEqual(g.economy.state,state);assert.deepEqual(g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected]),ore);
 });
}finally{h.close();}
console.log(`COMPLETE ${commonChecks} common checks passed (inert renderer; no browser or OS input)`);
