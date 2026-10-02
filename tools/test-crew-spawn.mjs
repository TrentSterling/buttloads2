import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,n=g.net;
export let crewSpawnChecks=0;
const test=(name,fn)=>{fn();crewSpawnChecks++;console.log('PASS crew spawn: '+name);};
const peer=id=>{const p={id,hello:true,synced:false,profile:{name:id,color:0}};n.peers.set(id,p);n.makeRemote(p);return p;};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clear=()=>{const bodies=[g.player,...[...n.peers.values()].map(p=>p.player)];for(let i=0;i<bodies.length;i++){assert.ok(!bodies[i].blocked(bodies[i].x,bodies[i].y,bodies[i].z));for(let j=i+1;j<bodies.length;j++)assert.ok(distance(bodies[i],bodies[j])>=bodies[i].radius+bodies[j].radius+.08,'spawn overlaps another miner');}};
try{
 n.role='host';
 test('late joining after a departure never reuses an occupied spawn',()=>{
  g.player.teleport(0,.1,12);const first=peer('first'),second=peer('second');
  n.peers.delete(first.id);const late=peer('late');
  assert.ok(distance(second.player,late.player)>=.68,'late join reuses the survivor position');clear();
 });
 test('a full 64-miner crew has clear distinct arrival positions',()=>{
  n.peers.clear();g.player.teleport(0,.1,12);for(let i=0;i<63;i++)peer('arrival-'+i);clear();
 });
 test('new arrivals avoid occupied machinery and do not change terrain',()=>{
  n.peers.clear();g.player.teleport(0,.1,12);const before=g.world.field.slice(),old=g.player.obstacles;
  g.player.obstacles=[...old,[-1.5,-.2,11.3,1.5,3,12.7]];
  try{const p=peer('obstructed');assert.ok(!p.player.blocked(p.player.x,p.player.y,p.player.z));assert.deepEqual(g.world.field,before);}finally{g.player.obstacles=old;}
 });
 test('a clear existing pose survives world reconstruction with its aim',()=>{
  n.peers.clear();const p={id:'saved-pose',pose:{x:5,y:.1,z:10,yaw:.4,pitch:-.2}};n.peers.set(p.id,p);n.makeRemote(p);
  assert.deepEqual(p.player.position,{x:5,y:.1,z:10});assert.equal(p.player.yaw,.4);assert.equal(p.player.pitch,-.2);
  const body=p.player;body.vx=1;n.makeRemote(p);assert.equal(p.player,body);assert.equal(p.player.vx,1);
 });
 test('an overlapping supplied pose is replaced with a clear arrival',()=>{
  n.peers.clear();g.player.teleport(0,.1,12);const p={id:'overlap-pose',pose:{x:0,y:.1,z:12,yaw:0,pitch:0}};n.peers.set(p.id,p);n.makeRemote(p);clear();
 });
 test('arrival beside an excavated entrance stays on supported ground',()=>{
  n.peers.clear();g.player.teleport(0,.1,12);g.world.carve({x:0,y:-.12,z:12},2.8);const p=peer('excavated-entrance');
  for(let i=0;i<90;i++)p.player.step(1/120,new Set(),6);
  assert.ok(p.player.grounded&&p.player.y>-.3,'new miner falls into the existing entrance excavation');
 });
}finally{n.peers.clear();n.role='offline';clearInterval(n.timer);h.close();}
console.log('COMPLETE '+crewSpawnChecks+' crew spawn checks passed');
