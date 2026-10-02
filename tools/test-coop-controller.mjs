// Co-op controller integration. Inert renderer; no browser, sockets or OS input.
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,n=g.net;
const initial=B.Saves.snapshot(g,true);
export let coopControllerChecks=0;
const test=async(name,fn)=>{await fn();coopControllerChecks++;console.log('PASS co-op controller: '+name);};
try{
 await test('guest collision follows replicated machinery and removes collected-body blockers',()=>{
  g.play();n.role='guest';n.ready=true;n.serverPose=null;const body=g.expedition.bodies[1];
  Object.assign(body,{x:6,y:.9,z:6,collected:false});g.player.teleport(6,.06,9.5);g.player.yaw=0;g.input.keys.add('KeyW');n.updateGuest(0);
  assert.ok(g.player.blocked(6,.06,6),'guest misses current machinery');
  for(let i=0;i<90;i++)n.updateGuest(1/120);assert.ok(g.player.z>7.22&&g.player.z<7.3,'guest walked through the body');
  body.x=10;n.updateGuest(0);assert.equal(g.player.blocked(6,.06,6),false,'ghost collision at old position');assert.ok(g.player.blocked(10,.06,6));for(let i=0;i<120;i++)n.updateGuest(1/120);assert.ok(g.player.z<5,'guest stuck at the old position');
  body.collected=true;n.updateGuest(0);assert.equal(g.player.blocked(10,.06,6),false,'collected body still blocks');
  g.clearInput();
 });
 await test('guest prediction applies hauling, awakened hauling and restored deep-lift speeds',()=>{
  const original=g.player.step,calls=[];g.player.step=function(dt,keys,lift){calls.push(lift);};
  try{
   g.player.teleport(6,.06,6);g.expedition.tether=0;g.expedition.state.awakened=false;n.updateGuest(1/60);assert.ok(calls.every(v=>v===3.5));
   calls.length=0;g.economy.state.gear.lift=2;g.expedition.state.awakened=true;n.updateGuest(1/60);assert.ok(calls.length&&calls.every(v=>v===7));
   calls.length=0;g.expedition.tether=null;g.economy.state.gear.lift=0;g.deep.state.repaired=[1];g.player.teleport(6,-100,6);n.updateGuest(1/60);assert.ok(calls.length&&calls.every(v=>v===16));
  }finally{g.player.step=original;}
 });
 await test('host remote simulation uses each miners own tether and depth',()=>{
  n.role='host';n.time=0;const peer={id:'controller-guest',hello:true,synced:true,last:0,profile:{name:'Test',color:1}};n.peers.set(peer.id,peer);n.makeRemote(peer);peer.synced=true;peer.input={playing:true,fire:false};
  const original=peer.player.step,calls=[];peer.player.step=function(dt,keys,lift){calls.push(lift);};
  try{
   g.player.teleport(6,.06,6);g.expedition.tether=null;g.expedition.state.awakened=false;g.economy.state.gear.lift=0;peer.player.teleport(6,.06,6);peer.transient.tether=0;n.stepRemotes(1/60);assert.ok(calls.length&&calls.every(v=>v===3.5));
   calls.length=0;peer.transient.tether=null;peer.player.teleport(6,-100,6);g.deep.state.repaired=[1];n.stepRemotes(1/60);assert.ok(calls.length&&calls.every(v=>v===16));
   calls.length=0;peer.player.teleport(6,.06,6);g.expedition.tether=0;n.stepRemotes(1/60);assert.ok(calls.length&&calls.every(v=>v===6),'lead tether restricts another miner');
  }finally{peer.player.step=original;n.peers.delete(peer.id);}
 });
 await test('ordinary command replies preserve a moving guests prediction and velocity',()=>{
  n.role='host';const peer={id:'command-guest',profile:{name:'Test',color:1}};n.makeRemote(peer);peer.player.teleport(6,.06,6);
  const send=n.send,messages=[];n.send=m=>{messages.push(m);return Promise.resolve(true);};
  try{
   n.execute(peer,'scan',[]);const reply=messages.find(m=>m.type==='result');assert.ok(reply);assert.equal(reply.position,undefined,'scan reply teleports the guest');
   n.role='guest';n.hostId='test-lead';n.peers.set('test-lead',{id:'test-lead',hello:true});g.player.teleport(6,.06,9);g.player.vz=-3.8;g.player.previous.z=9.03;
   const position=g.player.position,previous={...g.player.previous};n.receive({v:B.CREW_PROTOCOL,...reply},'test-lead');assert.deepEqual(g.player.position,position);assert.deepEqual(g.player.previous,previous);assert.equal(g.player.vz,-3.8);
  }finally{n.send=send;n.peers.delete('test-lead');}
 });
 await test('a real host recall reply still teleports the guest and clears stale reconciliation',()=>{
  n.role='host';const peer={id:'recall-guest',profile:{name:'Test',color:1}};n.makeRemote(peer);peer.player.teleport(6,-28,6);
  const send=n.send,messages=[];n.send=m=>{messages.push(m);return Promise.resolve(true);};
  try{
   n.execute(peer,'recall',[]);const reply=messages.find(m=>m.type==='result');assert.deepEqual(reply.position&&{x:reply.position.x,y:reply.position.y,z:reply.position.z},{x:0,y:.08,z:13});
   n.role='guest';n.hostId='test-lead';n.peers.set('test-lead',{id:'test-lead',hello:true});g.player.teleport(6,-28,6);n.serverPose={x:6,y:-28,z:6,received:n.time};
   n.receive({v:B.CREW_PROTOCOL,...reply},'test-lead');assert.equal(n.serverPose,null);assert.deepEqual(g.player.position,{x:0,y:.08,z:13});assert.equal(g.player.vz,0);
  }finally{n.send=send;n.peers.delete('test-lead');}
 });
 await test('a host recall discards stale reconciliation instead of teleporting the guest back down',()=>{
  n.role='guest';n.hostId='test-lead';n.peers.set('test-lead',{id:'test-lead',hello:true});n.serverPose={x:6,y:-28,z:6,received:n.time};
  n.receive({v:B.CREW_PROTOCOL,type:'result',position:{x:6,y:.06,z:11.5}},'test-lead');n.updateGuest(1/60);assert.ok(g.player.y>-.1);assert.equal(n.serverPose,null);n.peers.delete('test-lead');
 });
 await test('snapshot installation preserves location while recovering a shallow machinery overlap',async()=>{
  const saved=structuredClone(initial);Object.assign(saved.player,{x:6,y:2,z:6});Object.assign(saved.state.expedition.bodies.find(b=>b.id===1),{x:6,y:1.12,z:6,vx:0,vy:0,vz:0});
  await g.install(B.Saves.validate(saved));assert.equal(g.player.x,6);assert.equal(g.player.z,6);assert.ok(g.player.y>2&&g.player.y<2.04);assert.ok(!g.player.blocked(g.player.x,g.player.y,g.player.z));assert.deepEqual(g.player.previous,g.player.position);
 });
 await test('a fresh network snapshot clears the previous epoch pose before prediction resumes',async()=>{
  n.role='guest';n.hostId='test-lead';n.lastPoseAt=900;n.serverPose={x:6,y:-100,z:6,received:n.time};n.pendingFrame=null;n.pendingPatches=[];n.sendControl=async()=>{};
  const saved=structuredClone(initial),encoded=await B.crewCompress(saved);await n.receiveSnapshot(encoded.bytes,'test-lead',{epoch:'new-epoch',seq:0,gzip:encoded.gzip});
  assert.equal(n.ready,true,n.errors.join('\n'));assert.equal(n.serverPose,null);assert.equal(n.lastPoseAt,undefined);n.updateGuest(1/60);assert.ok(g.player.y>-.1);assert.equal(n.epoch,'new-epoch');
 });
}finally{n.role='offline';n.room=null;clearInterval(n.timer);h.close();}
console.log(`COMPLETE ${coopControllerChecks} co-op controller checks passed`);
