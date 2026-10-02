import fs from 'node:fs';import assert from 'node:assert/strict';import {nodeGame} from './node-game.mjs';
import {playerFrom,source,flat} from './movement-fixtures.mjs';import {seamCases,seamReplay} from './corner-slide-fixtures.mjs';
const before=process.argv.includes('--before'),text=before?fs.readFileSync(new URL('fixtures/player-corners-2.43.2.js',import.meta.url),'utf8'):source();
export let cornerSlideChecks=0;let failures=0;
async function test(name,fn){try{await fn();cornerSlideChecks++;console.log('PASS rounded contact: '+name);}catch(e){if(!before)throw e;failures++;console.log('BASELINE FAIL '+name+': '+e.message.split('\n')[0]);}}
await test('a round footprint clears the false square corner while real faces, corners and roofs remain solid',()=>{
 const p=playerFrom(text),b=[0,0,0,1,3,1];p.obstacles=[b];
 assert.equal(p.blocked(-.25,0,-.25),false);assert.equal(p.blocked(-.2,0,-.2),true);assert.equal(p.blocked(-.29,0,.5),true);assert.equal(p.blocked(-.31,0,.5),false);assert.equal(p.blocked(.5,3,.5),false);assert.equal(p.blocked(.5,2.99,.5),true);
 b.roof={x:.5,reach:.5,ridge:3,eave:2,rise:1};assert.equal(p.blocked(-.25,0,-.25),false);assert.equal(p.blocked(.5,2.99,.5),true);
});
await test('twelve adjoining-wall replays never stall on millimetre offsets or penetrate the solids',()=>{
 for(const fixture of seamCases){const r=seamReplay(text,fixture);assert.equal(r.stoppedFrames,0,fixture.name);assert.ok(r.minTangential>2.61,fixture.name+' speed '+r.minTangential);assert.ok(r.distance>5.35,fixture.name+' distance '+r.distance);assert.ok(r.trace.every(s=>!s.blocked));}
});
await test('rounded slides present continuously across eight render cadences',()=>{
 const fixture={width:1,inset:.001},reference=seamReplay(text,fixture,240);
 for(const hz of [30,60,75,90,120,144,165,240]){const r=seamReplay(text,fixture,hz);assert.equal(r.stoppedFrames,0,hz+' Hz');assert.ok(r.minTangential>2.61);const a=r.trace.at(-1).camera,b=reference.trace.at(-1).camera;for(const key of ['x','y','z'])assert.ok(Math.abs(a[key]-b[key])<1e-8,hz+' Hz '+key);}
});
await test('the earliest face/corner normal is independent of obstacle order',()=>{
 const p=playerFrom(text),early=[1,0,-4,4,3,4],late=[-4,0,2,4,3,4];
 for(const boxes of [[late,early],[early,late]]){p.obstacles=boxes;assert.deepEqual({...p.contact({x:0,y:0,z:0},{x:3,y:0,z:3})},{x:-1,z:0});}
 p.obstacles=[[0,0,0,1,3,1]];const n=p.contact({x:-.4,y:0,z:-.4},{x:-.2,y:0,z:-.2});assert.ok(Math.abs(n.x+Math.SQRT1_2)<1e-9);assert.ok(Math.abs(n.z+Math.SQRT1_2)<1e-9);
});
await test('shallow corner overlap recovers radially with the nearest valid displacement',()=>{
 const p=playerFrom(text);p.obstacles=[[0,0,0,1,3,1]];p.teleport(-.2,0,-.2);assert.ok(p.blocked(p.x,p.y,p.z));p.recoverOverlap();
 assert.equal(p.y,0);assert.ok(!p.blocked(p.x,p.y,p.z));assert.ok(Math.abs(p.x-p.z)<1e-9);assert.ok(Math.hypot(p.x+.2,p.z+.2)<.019);
});
await test('closed corners, ceilings, thin walls and moving/replaced contacts stay solid',()=>{
 for(const dt of [1/240,1/120,1/60,.05]){
  const p=playerFrom(text);p.obstacles=[[1,0,-4,1.02,3,4],[-4,0,1,4,3,1.02]];p.grounded=true;
  for(let i=0;i<2/dt;i++){p.step(dt,new Set(['KeyD','KeyS','ShiftLeft']),6);assert.ok(!p.blocked(p.x,p.y,p.z));assert.ok(p.x<=.70001&&p.z<=.70001);}
  p.obstacles=[[.28,0,-1,2,3,1]];p.teleport(0,.06,0);p.step(dt,new Set(['KeyA']),6);assert.ok(p.x<-.02);assert.ok(!p.blocked(p.x,p.y,p.z));
  p.obstacles=[[1,0,-2,3,.18,2],[-2,1.85,-2,4,3,2]];p.teleport(0,.06,0);for(let i=0;i<2/dt;i++)p.step(dt,new Set(['KeyD']),6);assert.ok(p.x<.701&&p.y<.05);
 }
});
await test('native depot post/workshop corner clear while ordinary yard and straight routes retain exact travel',async()=>{
 const h=await nodeGame(),g=h.game,boxes=g.refreshPlayerObstacles(),legacy=fs.readFileSync(new URL('fixtures/player-corners-2.43.2.js',import.meta.url),'utf8');
 try{
  const run=(code,at,keys,yaw)=>{const p=playerFrom(code,g.world);p.teleport(...at);p.obstacles=boxes;p.yaw=yaw;const trace=[];for(let i=0;i<240;i++){p.step(1/120,new Set(keys),6);assert.ok(!p.blocked(p.x,p.y,p.z));trace.push([p.x,p.y,p.z,p.vx,p.vy,p.vz]);}return trace;};
  for(const at of [[3,.06,15.4],[-1.9,.06,15.4]]){const trace=run(text,at,['KeyW'],Math.PI);assert.ok(trace.at(-1)[2]>19.69);}
  for(const [at,keys,yaw]of [[[2.8,.06,15.4],['KeyW'],Math.PI],[[0,.06,11.5],['KeyD'],0]])assert.deepEqual(run(text,at,keys,yaw),run(legacy,at,keys,yaw));
 }finally{h.close();clearInterval(g.net.timer);}
});
if(before){console.log('BASELINE '+failures+' contracts fail; '+cornerSlideChecks+' unchanged contracts pass');if(failures)process.exitCode=1;}
else console.log('COMPLETE '+cornerSlideChecks+' rounded obstacle checks passed (no browser or OS input)');
