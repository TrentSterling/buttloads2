import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadCrew,latencyReplay} from './latency-fixture.mjs';
import {fixture} from './guest-motion-fixture.mjs';
import {nodeGame} from './node-game.mjs';
const baseline=process.argv.includes('--baseline'),B=baseline?loadCrew(fs.readFileSync(new URL('out/latency-before/multiplayer.js',import.meta.url),'utf8')):loadCrew();
export let latencyChecks=0;
const test=async(name,fn)=>{await fn();latencyChecks++;console.log('PASS latency: '+name);};
const clean=c=>{assert.equal(c.teleports,0);assert.equal(c.aimError,0);assert.equal(c.blockedFrames,0);};
await test('250 ms turning corrects historical error instead of pulling against current movement',()=>{
 const c=latencyReplay(B);clean(c);assert.ok(c.correctionDistance<.25,`Accumulated correction ${c.correctionDistance} m`);assert.ok(c.aligned>60);assert.ok(c.sustainedCorrectionDistance<.1);
});
await test('delays, render rates, stops and shared wall contact keep aim and capsules valid',()=>{
 for(const hz of [60,144,240])for(const rtt of [0,100,250,500])for(const options of [{},{turn:false,wall:true},{turn:false,stop:true}]){
  const c=latencyReplay(B,{hz,rtt,...options});clean(c);assert.ok(c.correctionDistance<1.2,`${hz} Hz / ${rtt} ms: ${c.correctionDistance}`);assert.ok(c.historySamples<=361);assert.ok(c.rememberedInputs<=64);
 }
});
await test('host clock offset, packet jitter and a pose gap do not reset local movement',()=>{
 const plain=latencyReplay(B),offset=latencyReplay(B,{clockOffset:37});assert.ok(Math.abs(plain.correctionDistance-offset.correctionDistance)<1e-10);assert.deepEqual(plain.end,offset.end);
 for(const options of [{jitter:35},{gap:[.5,3]}]){const c=latencyReplay(B,options);clean(c);assert.ok(c.correctionDistance<.3);}
});
await test('fresh joins avoid startup drag at 250 and 500 ms while genuine host errors are corrected',()=>{
 for(const rtt of [250,500]){const c=latencyReplay(B,{rtt,fresh:true});clean(c);assert.equal(c.correctionDistance,0);}
 const c=latencyReplay(B,{warp:.8});clean(c);assert.ok(c.correctionDistance>.7);assert.ok(c.correctionDistance<1.2);
});
function recorded(){
 const h=fixture(B),{g,n}=h;g.input.keys.clear();g.player.vx=0;
 for(const [at,x]of [[0,0],[.1,.4],[.2,.8]]){n.time=at;g.player.x=x;n.rememberPrediction();if(at===0)n.rememberInput(1);}
 n.time=.3;g.player.x=1.2;return h;
}
const member=(n,x,ack)=>[{id:n.id,health:100,player:{x,y:.06,z:0,yaw:0,pitch:0},ack}];
await test('acknowledgements interpolate history and consume modest correction once without changing aim',()=>{
 const {g,n}=recorded();g.player.yaw=.7;g.player.pitch=.2;g.player.vx=3.8;g.input.keys.add('KeyD');
 n.applyPoses(member(n,1.1,{seq:1,age:.15}),1);assert.ok(Math.abs(n.serverPose.error.x-.5)<1e-10);
 const error=n.serverPose.error.x;n.updateGuest(.01);const consumed=error-n.serverPose.error.x;assert.ok(consumed>0);assert.ok(Math.abs(n.predictionSamples[0].x-consumed)<1e-10);
 assert.equal(g.player.yaw,.7);assert.equal(g.player.pitch,.2);assert.ok(g.player.vx>3);
 n.applyPoses(member(n,1.1,{seq:1,age:.15}),2);assert.ok(Math.abs(n.serverPose.error.x-(error-consumed))<1e-10);
});
await test('unknown, malformed or aged-out acknowledgements use the compatible fallback',()=>{
 const {g,n}=recorded();
 for(const ack of [undefined,{seq:999,age:.1},{seq:1,age:-1},{seq:1,age:NaN},{seq:1,age:3},{seq:1.5,age:.1},{seq:1,age:.5}]){n.applyPoses(member(n,2,ack));assert.equal(n.serverPose.error,null);}
 n.updateGuest(.01);assert.ok(g.player.x>1.2);assert.ok(g.player.x<1.3);
});
await test('blocked corrections are rejected and fresh large authority errors still relocate',()=>{
 const {g,n}=recorded();g.player.teleport(0,.06,0);g.player.obstacles=[[.4,0,-1,2,3,1]];n.serverPose={x:1,y:.06,z:0,error:{x:1,y:0,z:0},received:n.time};n.updateGuest(.1);assert.equal(g.player.x,0);assert.equal(n.serverPose.error.x,1);
 g.player.obstacles=[];n.serverPose={x:20,y:.06,z:0,error:{x:4,y:0,z:0},received:n.time};n.updateGuest(0);assert.equal(g.player.x,4);assert.equal(n.serverPose,null);assert.equal(n.predictionInputs.size,0);assert.equal(n.predictionSamples.length,0);
});
await test('startup grace expires, and result teleports and pause clear prediction',()=>{
 const {g,n}=recorded();n.applyPoses(member(n,2,{seq:0,age:0}));assert.equal(n.serverPose.waiting,true);n.updateGuest(.01);assert.equal(g.player.x,1.2);
 n.time=1.1;n.applyPoses(member(n,2,{seq:0,age:0}));assert.equal(n.serverPose.waiting,false);n.updateGuest(.01);assert.ok(g.player.x>1.2);
 n.receive({v:B.CREW_PROTOCOL,type:'result',position:{x:3,y:.06,z:0}},n.hostId);assert.equal(g.player.x,3);assert.equal(n.predictionInputs.size,0);assert.equal(n.predictionSamples.length,0);
 n.rememberInput(2);n.rememberPrediction();g.running=false;n.updateGuest(.1);assert.equal(n.predictionSamples.length,0);assert.equal(n.predictionInputs.size,0);
});
const originalPerformance=globalThis.performance;let now=0,h;globalThis.performance={now:()=>now};
try{
 h=await nodeGame();const g=h.game,n=g.net;g.play();n.id=n.hostId='lead';n.room={};n.sendControl=async()=>{};n.sendPatch=async()=>{};
 await test('host promotion clears prediction on the actual Game',()=>{n.rememberInput(1);n.rememberPrediction();n.becomeHost(false);assert.equal(n.predictionInputs.size,0);assert.equal(n.predictionSamples.length,0);assert.equal(n.serverPose,null);});
 const p={id:'guest',hello:true,synced:true,last:0,profile:{name:'Check',color:1}};n.peers.set(p.id,p);n.makeRemote(p);p.synced=true;p.player.teleport(3,.06,11.5);
 const packet={v:B2.CREW_PROTOCOL,type:'input',seq:1,keys:['KeyD'],yaw:0,pitch:0,playing:true,tool:'cutter'};
 await test('full Game acknowledges actual simulated input duration even after a long scheduling stall',()=>{
  n.receive(packet,p.id);now=100;g.advanceSimulation(now);const m=()=>n.members.find(m=>m.id===p.id);assert.equal(m().ack.seq,1);assert.ok(Math.abs(m().ack.age-.1)<1e-8);
  now=30100;g.advanceSimulation(now);assert.ok(Math.abs(m().ack.age-.35)<1e-8);assert.ok(Math.abs(n.time-30.1)<1e-8);
  n.receive({...packet,seq:2},p.id);assert.equal(m().ack.age,0);
 });
 await test('actual guest Game simulation records history and accepts its matching host pose',()=>{
  n.role='guest';n.id='guest';n.hostId='lead';n.ready=true;n.world=g.world;n.patchAt=n.frameAt=Infinity;n.time=n.inputAt=n.poseAt=0;g.accumulator=0;n.clearPrediction();g.player.teleport(0,.06,11.5);g.input.keys.add('KeyD');
  for(let i=1;i<=120;i++){now=30100+i*1000/120;g.advanceSimulation(now);}
  assert.ok(g.player.x>3);assert.ok(n.predictionSamples.length>100);assert.ok(n.predictionInputs.size>15);
  const seq=n.inputSeq,at=n.predictionInputs.get(seq),sample=n.predictionSamples.find(s=>Math.abs(s.at-at)<1e-8);assert.ok(sample);
  n.applyPoses([{id:n.id,health:100,player:{x:sample.x,y:sample.y,z:sample.z,yaw:0,pitch:0},ack:{seq,age:0}}],1);assert.ok(Math.hypot(...Object.values(n.serverPose.error))<1e-8);
 });
}finally{if(h){h.game.net.room=null;h.game.net.role='offline';h.close();}globalThis.performance=originalPerformance;}
console.log(`COMPLETE ${latencyChecks} latency checks passed`);
