// Current public-crew compatibility and saved-claim migration in production code.
// Inert transport/renderer only; no sockets, browser or desktop input.
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const first=await nodeGame(),second=await nodeGame(),B=B2,g=first.game,other=second.game;
export let crewCompatChecks=0;
const test=async(name,fn)=>{await fn();crewCompatChecks++;console.log('PASS crew compatibility: '+name);};
const groups=new Map(),joins=[];
function library(id){return {selfId:id,joinRoom(config,name){
 joins.push({id,name,appId:config.appId});let group=groups.get(name);if(!group)groups.set(name,group=new Map());
 const listeners=new Map(),pending=new Map();
 const room={join(){},left(){},makeAction(action){
  return [async(data,target,meta)=>{for(const [peerId,peer]of group)if(peerId!==id&&(!target||target===peerId))peer.deliver(action,structuredClone(data),id,structuredClone(meta));},fn=>{listeners.set(action,fn);for(const args of pending.get(action)||[])fn(...args);pending.delete(action);},()=>{}];
 },deliver(action,...args){const fn=listeners.get(action);if(fn)fn(...args);else{const queue=pending.get(action)||[];queue.push(args);pending.set(action,queue);}},onPeerJoin(fn){room.join=fn;},onPeerLeave(fn){room.left=fn;},getPeers(){return Object.fromEntries([...group].filter(([peerId])=>peerId!==id));},async leave(){group.delete(id);for(const peer of group.values())peer.left(id);}};
 const existing=[...group];group.set(id,room);queueMicrotask(()=>{for(const [peerId,peer]of existing){peer.join(id);room.join(peerId);}});return room;
 }};}
const until=async(fn)=>{const end=Date.now()+15000;while(!fn()){if(Date.now()>end)throw Error('Crew synchronization timed out');await new Promise(r=>setTimeout(r,10));}};
const enabled=B.Crew.enabled;
let lead,guest,legacy;
try{
 await test('older collision generations cannot elect a host or send teleport results',()=>{
  const n=new B.Crew(g);n.id='current';n.hostId=n.id;n.born=2;n.role='host';n.room={};n.send=async()=>true;
  const peer={id:'old',hello:false,synced:false,last:0};n.peers.set(peer.id,peer);
  for(const v of [1,2]){n.receive({v,type:'hello',born:1,ready:true,profile:{name:'Old',color:0}},peer.id);assert.equal(peer.hello,false);assert.equal(n.hostId,n.id);assert.equal(n.role,'host');assert.equal(n.count,1);}
  n.role='guest';n.hostId=peer.id;peer.hello=true;const before=g.player.position;
  for(const v of [1,2]){n.receive({v,type:'result',position:{x:5,y:.06,z:46}},peer.id);assert.deepEqual(g.player.position,before);}
 });
 await test('matching miners automatically join the current public crew and transfer the actual mine',async()=>{
  legacy=library('old').joinRoom({appId:'xyz.tront.buttloads2.crew'},'ridge-common-v2');
  lead=g.net=new B.Crew(g,{library:library('lead')});guest=other.net=new B.Crew(other,{library:library('guest')});lead.born=1;guest.born=2;
  g.economy.state.cash=731;g.world.carve({x:2,y:-3,z:2},1.5,.8);
  await lead.start();await guest.start();
  await until(()=>lead.count===2&&guest.guest&&guest.ready&&lead.peers.get('guest')?.synced);
  assert.equal(guest.hostId,'lead');assert.equal(other.economy.state.cash,731);assert.deepEqual(other.world.field,g.world.field);
  assert.deepEqual(joins.map(j=>j.name),['ridge-common-v2',B.CREW_ROOM,B.CREW_ROOM]);assert.notEqual(B.CREW_ROOM,'ridge-common-v2');
  assert.equal(groups.get('ridge-common-v2').size,1);assert.equal(lead.peers.has('old'),false);assert.equal(guest.peers.has('old'),false);
  assert.deepEqual(lead.errors,[]);assert.deepEqual(guest.errors,[]);
 });
 await test('host and guest use current contact and keep crew writes apart from stale tabs',()=>{
  assert.equal(g.store.key,B.CREW_SAVE_KEY);assert.equal(other.store.key,B.CREW_SAVE_KEY);assert.notEqual(B.CREW_SAVE_KEY,'crew-global-v2');assert.notEqual(B.CREW_SAVE_KEY,'crew-global-v1');
  const p=lead.peers.get('guest').player,q=other.player;
  p.obstacles=g.view.obstacles;q.obstacles=other.view.obstacles;
  for(const player of [p,q]){player.teleport(5,.06,40.8);player.yaw=Math.PI;for(let i=0;i<180;i++)player.step(1/120,new Set(['KeyW']),6);}
  assert.deepEqual(p.position,q.position);assert.ok(q.z<42.1,'current seat did not block walking');
 });
 await test('compatible survivors inherit the excavated mine when the lead leaves',async()=>{
  const field=other.world.field.slice(),cash=other.economy.state.cash;await lead.room.leave();lead.room=null;clearInterval(lead.timer);
  assert.equal(guest.host,true);assert.equal(guest.stats.migrations,1);assert.deepEqual(other.world.field,field);assert.equal(other.economy.state.cash,cash);assert.equal(other.store.key,B.CREW_SAVE_KEY);
  await guest.room.leave();guest.room=null;clearInterval(guest.timer);g.net.role=other.net.role='offline';
 });
 await test('upgrading loads the old crew claim and writes only to the new slot',async()=>{
  const saved=B.Saves.snapshot(g,true);saved.state.cash=987;const slots=new Map([['crew-global-v2',saved]]),reads=[],writes=[];
  B.Crew.enabled=()=>true;g.store.read=async key=>{reads.push(key||'current');return structuredClone(slots.get(key||'current')||null);};g.store.write=async data=>writes.push({key:g.store.key,data:structuredClone(data)});
  g.net=new B.Crew(g,{library:library('migrated')});g.net.born=3;
  await g.boot();await until(()=>g.net.host);clearInterval(g.net.timer);
  assert.deepEqual(reads.slice(0,2),[B.CREW_SAVE_KEY,'crew-global-v2']);assert.equal(g.economy.state.cash,987);assert.deepEqual(g.world.field,B.Saves.validate(saved).field);
  await g.store.write(B.Saves.snapshot(g));assert.equal(writes[0].key,B.CREW_SAVE_KEY);assert.equal(slots.get('crew-global-v2').state.cash,987);
  await g.net.room.leave();g.net.room=null;g.net.role='offline';
  slots.set(B.CREW_SAVE_KEY,{...saved,state:{...saved.state,cash:1234}});reads.length=0;
  g.net.start=async()=>{};await g.boot();assert.deepEqual(reads,[B.CREW_SAVE_KEY]);assert.equal(g.economy.state.cash,1234);
  slots.delete(B.CREW_SAVE_KEY);slots.delete('crew-global-v2');slots.set('crew-global-v1',saved);reads.length=0;await g.boot();assert.deepEqual(reads,[B.CREW_SAVE_KEY,'crew-global-v2','crew-global-v1']);assert.equal(g.economy.state.cash,987);assert.deepEqual(g.world.field,B.Saves.validate(saved).field);
 });
}finally{
 B.Crew.enabled=enabled;
 for(const game of [g,other]){clearInterval(game.net.timer);game.net.room=null;game.net.role='offline';}
 await legacy?.leave();first.close();second.close();
}
console.log(`COMPLETE ${crewCompatChecks} crew compatibility checks passed`);
