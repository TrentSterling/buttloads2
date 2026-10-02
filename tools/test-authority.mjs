import assert from 'node:assert/strict';
import fs from 'node:fs';
import {authorityReplay} from './authority-fixture.mjs';
import {nodeGame} from './node-game.mjs';
export let authorityChecks=0;
const test=async(name,fn)=>{await fn();authorityChecks++;console.log('PASS authority: '+name);};
const baseline=process.argv.includes('--baseline')?{gameSource:fs.readFileSync(new URL('out/authority-before/game.js',import.meta.url),'utf8'),multiplayerSource:fs.readFileSync(new URL('out/authority-before/multiplayer.js',import.meta.url),'utf8')}:{};
await test('admitted inputs advance full authority and send poses without any render callbacks',async()=>{
 const c=await authorityReplay({...baseline,hz:0});assert.ok(c.distance>7.4&&c.distance<7.5);assert.ok(Math.abs(c.simulationTime-2)<1e-8);assert.equal(c.renderCount,0);assert.equal(c.poses,40);assert.equal(c.frames,10);assert.ok(c.maxUpdateDt<=.05);assert.equal(c.blocked,false);assert.deepEqual(c.errors,[]);
});
await test('render callbacks and input arrivals share elapsed time instead of simulating it twice',async()=>{
 const c=await authorityReplay({...baseline,hz:144});assert.ok(Math.abs(c.simulationTime-2)<1e-8);assert.ok(c.distance>7.4&&c.distance<7.5);assert.equal(c.poses,40);assert.equal(c.updates,288);assert.equal(c.blocked,false);
});
await test('a slow render loop preserves complete movement and fixed physics slices',async()=>{
 const c=await authorityReplay({...baseline,hz:10});assert.ok(c.distance>7.4&&c.distance<7.5);assert.ok(Math.abs(c.simulationTime-2)<1e-8);assert.ok(c.maxUpdateDt<=.05);
});
await test('malformed input cannot wake the simulation',async()=>{
 const c=await authorityReplay({...baseline,hz:0,invalid:true});assert.equal(c.distance,0);assert.equal(c.simulationTime,0);assert.equal(c.networkTime,0);assert.equal(c.poses,0);
});
await test('fresh ping traffic cannot keep an expired movement command walking',async()=>{
 const c=await authorityReplay({...baseline,hz:0,duration:4,stopAt:0,heartbeat:true,controlTraffic:true});assert.ok(Math.abs(c.networkTime-4)<1e-8);const at=t=>c.trace.find(f=>Math.abs(f.time-t)<1e-8);assert.ok(at(4).x-at(3).x<.05);assert.ok(c.distance<2);assert.ok(c.maxUpdateDt<=.05);
});
await test('movement expires during foreground rendering even while ping traffic stays fresh',async()=>{
 const c=await authorityReplay({...baseline,hz:60,duration:4,stopAt:0,heartbeat:true,controlTraffic:true});const at=t=>c.trace.find(f=>Math.abs(f.time-t)<1e-8);assert.ok(c.distance>7&&c.distance<8);assert.ok(at(4).x-at(3).x<.01);assert.equal(c.blocked,false);
});
const originalPerformance=globalThis.performance;let now=0;globalThis.performance={now:()=>now};let h;
try{
 h=await nodeGame();const g=h.game,n=g.net;g.view.render=()=>{};n.room={};n.sendControl=async()=>{};n.sendPatch=async()=>{};n.id=n.hostId='lead';n.becomeHost(false);
 const p={id:'guest',hello:true,synced:true,last:0,profile:{name:'Check',color:1}};n.peers.set(p.id,p);n.makeRemote(p);p.synced=true;p.player.teleport(3,.06,11.5);
 const input=(seq,playing=true)=>({v:B2.CREW_PROTOCOL,type:'input',seq,keys:['KeyD'],yaw:0,pitch:0,playing,tool:'cutter'});
 await test('input changes apply after the elapsed interval and accepted commands execute without rendering',()=>{
  n.receive(input(1),p.id);now=100;n.receive({v:B2.CREW_PROTOCOL,type:'command',seq:1,action:'scan',args:[]},p.id);assert.ok(p.player.x>3.1);assert.equal(n.pendingCommands.length,1);
  now=150;n.receive(input(2,false),p.id);assert.ok(p.player.x>3.3);assert.equal(p.keys.size,0);assert.equal(n.stats.commands,1);assert.equal(n.pendingCommands.length,0);
  const x=p.player.x,clock=g.clock;now=200;n.receive(input(2),p.id);n.receive({...input(3),v:B2.CREW_PROTOCOL-1},p.id);n.receive({v:B2.CREW_PROTOCOL,type:'command',seq:1,action:'scan',args:[]},p.id);assert.equal(g.clock,clock);assert.equal(p.player.x,x);
 });
 await test('duplicate or older timestamps, pauses and installation cannot accumulate hidden movement',()=>{
  const clock=g.clock,time=n.time;g.advanceSimulation(150);g.advanceSimulation(140);g.advanceSimulation(Infinity);assert.equal(g.clock,clock);assert.equal(n.time,time);
  g.advanceSimulation(200);assert.equal(g.clock,clock);assert.ok(Math.abs(n.time-.2)<1e-8);
  g.ready=false;g.advanceSimulation(20000);g.ready=true;g.advanceSimulation(20001);assert.equal(g.clock,clock);assert.ok(Math.abs(n.time-.201)<1e-8);
 });
 await test('long stalls advance network expiry while bounding simulation catch-up',()=>{
  g.play();const clock=g.clock,time=n.time,original=g.update.bind(g),steps=[];g.update=dt=>{steps.push(dt);original(dt);};g.advanceSimulation(50001);
  assert.ok(Math.abs(g.clock-clock-.25)<1e-8);assert.ok(Math.abs(n.time-time-30)<1e-8);assert.equal(steps.length,5);assert.ok(steps.every(dt=>dt<=.05));
 });
}finally{if(h){h.game.net.room=null;h.game.net.role='offline';h.close();}globalThis.performance=originalPerformance;}
console.log(`COMPLETE ${authorityChecks} authority checks passed`);
