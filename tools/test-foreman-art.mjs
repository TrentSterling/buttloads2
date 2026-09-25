// Production machinery and warning geometry. No browser or operating-system input.
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,T=THREE,B=B2;
export let foremanArtChecks=0;
const test=async(name,fn)=>{await fn();foremanArtChecks++;console.log('PASS furnace art: '+name);};
const models=()=>g.view.foremanModels;
const render=()=>g.view.renderForeman(g,10);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
try{
 Object.assign(g.expedition.state,{recovered:[0,1],runes:[0,1,2],awakened:true});g.deep.state.open=g.world.deepOpen=true;g.economy.state.deepest=280;
 for(const n of g.expedition.bodies)n.collected=true;g.expedition.physics.loose.clear();g.expedition.physics.awake.clear();
 const f=g.foreman;for(const n of f.nodes.slice(1))g.world.carve(n,2.8);
 for(let i=0;i<240;i++)f.physics.update(1/120);g.player.teleport(4,f.core.y-2,6);f.wake();
 await test('all moving machinery fits its saved physical body at every tested aiming elevation',()=>{
  const saved=f.state.aim;
  for(const elevation of [-1,-.75,-.5,0,.5,.75,1])for(let i=0;i<8;i++){
   const a=i*Math.PI/4,radial=Math.sqrt(1-elevation*elevation);f.state.aim={x:f.core.x+Math.cos(a)*radial*5,y:f.core.y+.8+elevation*5,z:f.core.z+Math.sin(a)*radial*5};render();
   for(const m of models()){
    const box=new T.Box3().setFromObject(m.root),n=m.node;
    for(const [j,axis] of ['x','y','z'].entries()){assert.ok(box.min[axis]>=n[axis]-n.size[j]/2-1e-6,`${n.id} min ${axis}`);assert.ok(box.max[axis]<=n[axis]+n.size[j]/2+1e-6,`${n.id} max ${axis}`);}
    m.root.traverse(o=>{for(const a of Object.values(o.geometry?.attributes||{}))assert.ok(a.array.every(Number.isFinite));});
   }
  }
  f.state.aim=saved;
 });
 await test('real lock damage drains gauges and retracts armor only while the core can take damage',()=>{
  g.settings.motion=false;render();assert.ok(models()[0].shutters.every(n=>n.position.y===0));
  const lock=f.nodes[1],m=models()[1];assert.ok(f.hit(lock,40,'axe'));render();close(m.shutters[0].scale.y,.5);close(m.needle.rotation.z,0);assert.ok(m.split.visible);
  assert.ok(f.hit(lock,40,'axe'));render();assert.ok(models()[0].shutters.every(n=>n.position.y<-.5));close(models()[0].indicators[0].rotation.z,2.2);assert.equal(g.view.pressureLinks[0].visible,false);
  assert.ok(f.hit(f.core,200,'cutter'));assert.equal(f.core.hp,280);render();assert.ok(models()[0].shutters.every(n=>n.position.y===0));assert.equal(f.hit(f.core,10,'axe'),false);
  const other=models()[2].hot.emissiveIntensity;render();close(models()[2].hot.emissiveIntensity,other);assert.ok(models()[0].hot.emissiveIntensity>other,'blocked hit flashes its armor, not every lock');
 });
 await test('the cutting head and impact marker follow the committed terrain-limited shot',()=>{
  const n=f.core;f.state.phase='aim';f.state.timer=.8;f.state.aim={x:n.x+7,y:n.y+.2,z:n.z+2};render();
  const head=models()[0].head,direction=new T.Vector3(0,0,1).applyQuaternion(head.quaternion),beam=f.beam();close(direction.dot(new T.Vector3(...Object.values(beam.direction))),1);
  const q=head.quaternion.clone();g.player.x-=3;g.player.z+=2;render();assert.ok(q.angleTo(head.quaternion)<1e-6,'sidestepping cannot turn a committed shot');
  const origin=head.getWorldPosition(new T.Vector3());assert.ok(origin.distanceTo(new T.Vector3(beam.from.x,beam.from.y,beam.from.z))<1e-6);
  assert.ok(beam.hit);assert.ok(g.view.furnaceImpact.visible);assert.ok(g.view.furnaceImpact.position.distanceTo(new T.Vector3(beam.hit.x,beam.hit.y,beam.hit.z))<.031);
  f.state.phase='rest';render();assert.equal(g.view.furnaceImpact.visible,false);assert.equal(g.view.furnaceJet.visible,false);
 });
 await test('shock warnings leave gaps at cover, unsupported holes and out-of-height ledges',()=>{
  const world=g.world,original=world.density,n=f.core,ground=f.quakeGround();let holes=false;
  try{
   world.density=(x,y,z)=>{
    const px=x-n.x,pz=z-n.z;
    if(holes&&px<-1&&pz>1)return y-(ground-4);
    if(holes&&px<-1&&pz<-1)return y-(ground+1.5);
    if(holes&&px>2&&px<3&&Math.abs(pz)<3)return y-(ground+4);
    return y-ground;
   };
   f.state.phase='quake';f.state.timer=2.4-4.5/5.5;render();const complete=g.view.furnaceRing.geometry.drawRange.count;assert.equal(complete,96*6);
   holes=true;render();const geo=g.view.furnaceRing.geometry,count=geo.drawRange.count;assert.ok(count>0&&count<complete/2);
   for(let i=0;i<count;i++){
    const p=new T.Vector3().fromBufferAttribute(geo.attributes.position,i),r=Math.hypot(p.x-n.x,p.z-n.z);assert.ok(Math.abs(r-f.quakeRadius())<.55);p.y-=.055;assert.ok(f.quakeReaches(p));assert.ok(Math.abs(world.density(p.x,p.y,p.z))<.004);
   }
   assert.equal(f.quakeReaches({x:n.x+4.5,y:ground,z:n.z}),false);
   // Removing all support removes the entire warning in the next render.
   world.density=()=>2;render();assert.equal(g.view.furnaceRing.visible,false);assert.equal(geo.drawRange.count,0);
  }finally{world.density=original;f.state.phase='rest';f.state.timer=1;}
 });
 await test('portable reload reconstructs damaged pressure gauges and the armor gate from gameplay state',async()=>{
  f.state.aim=null;f.state.timer=1;const save=B.Saves.snapshot(g),field=new Float32Array(g.world.field),cash=g.economy.state.cash;
  await g.install(B.Saves.validate(save));render();assert.equal(g.foreman.nodes[1].hp,0);close(models()[1].shutters[0].scale.y,.015);assert.ok(models()[0].shutters.every(n=>n.position.y===0));
  assert.deepEqual(g.world.field,field);assert.equal(g.economy.state.cash,cash);assert.equal(g.foreman.core.hp,280);
 });
 await test('rendering attacks, travel and damage states does not mutate progression or controls',()=>{
  const f=g.foreman;g.player.teleport(4,f.core.y-2,6);f.state.phase='quake';f.state.timer=1.5;f.save();
  const state=JSON.stringify(g.economy.state),field=new Float32Array(g.world.field),controls=[g.player.x,g.player.y,g.player.z,g.player.yaw,g.player.pitch],revision=f.revision;
  for(let i=0;i<4;i++)render();assert.equal(JSON.stringify(g.economy.state),state);assert.deepEqual(g.world.field,field);assert.deepEqual([g.player.x,g.player.y,g.player.z,g.player.yaw,g.player.pitch],controls);assert.equal(f.revision,revision);
  g.player.teleport(5,.06,44);render();assert.equal(g.view.furnaceRing.visible,false);assert.equal(g.view.furnaceLight.intensity,0);assert.ok(g.view.pressureLinks.every(n=>!n.visible));
 });
 console.log(`COMPLETE ${foremanArtChecks} furnace art checks passed (no browser or OS input)`);
}finally{h.close();}
