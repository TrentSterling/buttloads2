import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,T=THREE;
export let residentChecks=0;
const test=async(name,fn)=>{await fn();residentChecks++;console.log('PASS residents: '+name);};
const aim=n=>{const p=g.player;g.player.yaw=Math.atan2(p.x-n.x,p.z-n.z);g.player.pitch=Math.atan2(1.55-p.head.y,Math.hypot(p.x-n.x,p.z-n.z));};
const poses=()=>g.view.townRigs.map(r=>[r.body.rotation.toArray(),r.head.rotation.toArray(),...r.arms.map(a=>a.rotation.toArray()),...r.eyes.map(e=>e.scale.toArray())]);
try{
 await test('resident geometry is finite and remains within the existing human height and station',()=>{
  for(const rig of g.view.townRigs){
   rig.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(rig.root),size=bounds.getSize(new T.Vector3());
   assert.ok(bounds.min.y>=-.005&&bounds.max.y<1.96,rig.person.id+' height');assert.ok(size.x<.85&&size.z<.8,rig.person.id+' width / reach');
   assert.ok(Math.abs(bounds.getCenter(new T.Vector3()).x-rig.person.x)<.1);
   rig.root.traverse(n=>{assert.ok(n.matrixWorld.elements.every(Number.isFinite));if(n.geometry)for(const a of Object.values(n.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
   assert.equal(rig.hands.length,2);assert.ok(rig.hands.every(hand=>hand.parent.parent.parent===rig.body));
  }
  const bell=new T.Box3().setFromObject(g.view.bellPerson.root).getSize(new T.Vector3());assert.ok(bell.y<1.7&&bell.x<1.2&&bell.z<1.2,'rescued model still fits the bell');
 });
 await test('visible residents still follow rescue and fossil progression gates',()=>{
  g.view.render(g,0,0);assert.deepEqual(g.view.townRigs.filter(r=>r.root.visible).map(r=>r.person.id),['mara','otis']);
  const phase=g.rescue.state.phase;g.rescue.state.phase='rescued';g.fossil.state.recovered=true;g.view.render(g,0,0);
  assert.equal(g.view.townRigs.filter(r=>r.root.visible).length,4);assert.equal(g.view.bellPerson.root.visible,false);assert.equal(g.view.lanternCart.visible,true);
  g.rescue.state.phase=phase;g.fossil.state.recovered=false;g.view.render(g,0,0);assert.equal(g.view.bellPerson.root.visible,true);assert.equal(g.view.lanternCart.visible,false);
 });
 await test('idle and conversation motion cannot mutate the mine, inventory, progression or aim',()=>{
  const state=structuredClone(g.economy.state),field=g.world.field.slice(),nodes=g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected]);
  const n=B.TOWN.people[1];g.player.teleport(n.x+.3,.06,n.z-2);aim(n);const look=[g.player.yaw,g.player.pitch];g.setScreen('town');g.settings.motion=true;
  g.view.render(g,1/60,2);const before=poses();g.view.render(g,1/60,3);assert.notDeepEqual(poses(),before);
  assert.deepEqual(g.economy.state,state);assert.deepEqual(g.world.field,field);assert.deepEqual(g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected]),nodes);assert.deepEqual([g.player.yaw,g.player.pitch],look);
 });
 await test('motion preference fixes all limb poses and blinking without accumulating transformations',()=>{
  g.settings.motion=false;g.view.render(g,1/60,2);const before=poses();
  for(const time of [5.2,12,150])g.view.render(g,.05,time);
  assert.deepEqual(poses(),before);for(const r of g.view.townRigs)assert.ok(r.eyes.every(e=>e.scale.y===1));
  g.settings.motion=true;g.setScreen('pause');g.view.render(g,.016,2);const paused=poses();g.view.render(g,.016,8);assert.deepEqual(poses(),paused);
 });
 await test('back cabinets block passage while customer approaches and conversations remain clear',()=>{
  assert.equal(g.view.shopInteriors.length,3);
  for(const b of B.TOWN.buildings){
   const n=B.TOWN.people.find(p=>p.id===b.person),back=b.z+b.d/2-.3;
   assert.ok(g.player.blocked(b.x,.06,back-.45),'cabinet is physical');
   for(let z=b.z-b.d/2-.5;z<n.z-1.6;z+=.1)assert.equal(g.player.blocked(b.x,.06,z),false,b.person+' counter approach');
   g.player.teleport(n.x,.06,n.z-2.2);aim(n);
   if(!n.unlock)assert.equal(g.town.target(g.player,g.world,g.view.obstacles)?.id,n.id);
  }
 });
 await test('counter fill follows a nearby visible merchant and switches off outside, underground and before unlocks',()=>{
  const n=B.TOWN.people[1];g.player.teleport(n.x,.06,n.z-2);g.view.render(g,0,0);assert.ok(g.view.shopKey.intensity>0);assert.ok(Math.abs(g.view.shopKey.position.x-n.x)<1);
  for(const [x,y,z] of [[n.x+7,.06,n.z],[n.x,-10,n.z],[n.x,.06,n.z+5],[-24,.06,52]]){g.player.teleport(x,y,z);g.view.render(g,0,0);assert.equal(g.view.shopKey.intensity,0);}
 });
 await test('an old save inside a newly solid cabinet recovers safely without losing its mine or purchases',async()=>{
  const save=B.Saves.snapshot(g);save.player.x=19;save.player.y=.06;save.player.z=40.25;
  const field=save.field.slice(),state=structuredClone(save.state);await g.install(B.Saves.validate(save));
  assert.equal(g.player.blocked(g.player.x,g.player.y,g.player.z),false);assert.equal(g.player.z,12);assert.deepEqual(g.world.field,field);assert.deepEqual(g.economy.state,state);
  g.view.render(g,0,0);assert.equal(g.view.shopInteriors.length,3);assert.equal(g.view.townRigs.length,4);
 });
}finally{h.close();}
console.log(`COMPLETE ${residentChecks} resident checks passed (inert renderer; no browser or OS input)`);
