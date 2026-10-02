import assert from 'node:assert/strict';
import {loadCrew,fixture,runGuestMotion} from './guest-motion-fixture.mjs';
import {nodeGame} from './node-game.mjs';
const B=loadCrew();export let guestMotionChecks=0;
const test=async(name,fn)=>{await fn();guestMotionChecks++;console.log('PASS guest motion: '+name);};
await test('a multi-second pose gap preserves walking and does not teleport when updates return',()=>{
 const c=runGuestMotion(B,{rtt:100,gap:[.5,3]});assert.equal(c.teleports,0);assert.ok(c.correctionDistance<.5);assert.ok(c.end.x>15);assert.equal(c.aimError,0);assert.equal(c.blockedFrames,0);
});
await test('expired poses stop correcting while fresh large authority errors still teleport',()=>{
 const {g,n}=fixture(B);n.time=1;n.serverPose={x:20,y:.06,z:0,vx:0,received:.5};n.updateGuest(0);assert.equal(n.serverPose,null);assert.equal(g.player.x,0);
 n.serverPose={x:20,y:.06,z:0,received:n.time};n.updateGuest(0);assert.equal(g.player.x,20);assert.equal(n.serverPose,null);
});
await test('fresh modest corrections keep collision, velocity, interpolation and local aim',()=>{
 const {g,n}=fixture(B);g.player.yaw=.7;g.player.pitch=.2;g.player.previous.x=-.03;n.serverPose={x:1,y:.06,z:0,received:0};n.updateGuest(.01);
 assert.ok(g.player.x>0&&g.player.x<.1);assert.ok(g.player.vx>3);assert.equal(g.player.yaw,.7);assert.equal(g.player.pitch,.2);assert.ok(!g.player.blocked(g.player.x,g.player.y,g.player.z));
 const q=fixture(B);q.g.player.vx=0;q.g.input.keys.clear();q.g.player.obstacles=[[.5,0,-1,2,3,1]];q.n.serverPose={x:1,y:.06,z:0,received:0};q.n.updateGuest(.1);assert.equal(q.g.player.x,0);assert.ok(!q.g.player.blocked(q.g.player.x,q.g.player.y,q.g.player.z));
});
await test('older world-frame poses cannot overwrite newer position, health or remote tools',()=>{
 const {g,n}=fixture(B);n.peers.set('other',{id:'other',hello:true});const member=(x,health,tool)=>[{id:n.id,player:{x,y:.06,z:0,yaw:0,pitch:0},health},{id:'other',player:{x,y:.06,z:2,yaw:0,pitch:0},health,tool}];
 n.applyPoses(member(3,70,'lance'),3);n.applyPoses(member(2,100,'cutter'),2);assert.equal(n.serverPose.x,3);assert.equal(g.combat.state.health,70);assert.equal(n.peers.get('other').tool,'lance');
 n.applyPoses(member(4,60,'scoop'),4);assert.equal(n.serverPose.x,4);assert.equal(g.combat.state.health,60);assert.equal(n.peers.get('other').tool,'scoop');
});
await test('wire poses require a capture timestamp before they can affect the guest',()=>{
 const {n}=fixture(B),packet={v:B.CREW_PROTOCOL,type:'poses',epoch:n.epoch,seq:1,members:[{id:n.id,player:{x:1,y:.06,z:0,yaw:0,pitch:0},health:90}]};
 for(const at of [undefined,NaN,Infinity,-1]){n.receive({...packet,at},n.hostId);assert.equal(n.serverPose,undefined);assert.equal(n.poseSeq,undefined);}
 n.receive({...packet,at:1},n.hostId);assert.equal(n.serverPose.x,1);assert.equal(n.poseSeq,1);
});
await test('turning and wall sliding remain valid with delayed poses at 60 through 240 Hz',()=>{
 for(const hz of [60,144,240])for(const options of [{rtt:100,turn:true},{rtt:250,turn:true},{rtt:100,wall:true}]){const c=runGuestMotion(B,{...options,hz});assert.equal(c.aimError,0);assert.equal(c.blockedFrames,0);assert.equal(c.teleports,0);}
});
await test('actual frame installation preserves newer guest health and pose while still updating the world',async()=>{
 const h=await nodeGame(),g=h.game,n=g.net;try{
  n.role='host';n.id='guest';n.time=2;n.changes=new B2.TerrainChanges(g.world);const frame=n.captureFrame();frame.members=[{id:n.id,player:{x:0,y:.06,z:11.5,yaw:0,pitch:0},health:100}];frame.state.cash=517;
  n.role='guest';n.time=3;n.applyPoses([{id:n.id,player:{x:1,y:.06,z:11.5,yaw:0,pitch:0},health:72,sling:{held:0,charge:.6}}],3);n.applyFrame(frame);
  assert.equal(n.serverPose.x,1);assert.equal(g.combat.state.health,72);assert.equal(g.kinetics.state.held,0);assert.equal(g.kinetics.state.charge,.6);assert.equal(g.economy.state.cash,517);assert.equal(n.lastFrame,frame.seq);
 }finally{n.role='offline';n.room=null;h.close();}
});
console.log(`COMPLETE ${guestMotionChecks} guest motion checks passed`);
