import fs from 'node:fs';import assert from 'node:assert/strict';
import {flat,ramp,diagonal,playerFrom,source} from './movement-fixtures.mjs';
import {contactReplay} from './contact-scan-fixtures.mjs';
const after=source();
// Isolate broad-phase conservation against the same current narrow phase.
// Historical 2.42.1 receipts retain their frozen old/new controller evidence.
const before=after.slice(0,after.indexOf('    step(dt, keys, liftSpeed) {'))+'    step(dt, keys, liftSpeed) { this.advanceStep(dt,keys,liftSpeed); }\n'+after.slice(after.indexOf('    advanceStep(dt, keys, liftSpeed) {'));
export let contactScanChecks=0;
const test=(name,fn)=>{fn();contactScanChecks++;console.log('PASS contact scan: '+name);};
const far=Array.from({length:240},(_,i)=>{const x=20+i%20,z=20+Math.floor(i/20);return[x,0,z,x+.3,3,z+.3];});
const compare=(world,boxes,route)=>{const b=contactReplay(before,world,boxes,route),a=contactReplay(after,world,boxes,route);assert.equal(a.traceSha256,b.traceSha256,route.name);assert.equal(a.counts.density,b.counts.density);assert.equal(a.counts.queries,b.counts.queries);return{a,b};};

test('distant obstacles leave exact travel while contact scans read substantially fewer box values',()=>{
 const {a,b}=compare(flat,far,{name:'open ground',at:[0,.06,0],keys:['KeyD'],seconds:2});
 assert.ok(a.counts.obstacleReads<b.counts.obstacleReads*.4);assert.equal(a.counts.maxQueryBoxes,0);
});
test('ramps, treads, ceilings and tangential wall slides conserve all interpolation and capsule state',()=>{
 for(const[world,boxes,keys,name]of[
  [ramp,[],['KeyD'],'ramp'],[diagonal,[],['KeyD'],'diagonal'],
  [flat,[[1,0,-2,4,.18,2]],['KeyD'],'tread'],
  [flat,[[1,0,-2,4,.18,2],[-2,1.85,-2,4,3,2]],['KeyD'],'ceiling'],
  [flat,[[1,0,-5,2,3,5]],['KeyD','KeyS'],'wall slide'],
 ])compare(world,[...boxes,...far],{name,at:[0,.06,0],keys,seconds:2});
});
test('the window includes full high-speed travel, overlap recovery and projected movement',()=>{
 for(const dt of [1/240,1/120,1/60,.05,.1])for(const yaw of [0,.45,1.2,2.3,Math.PI]){
  compare(flat,[[.28,0,-1,2,3,1],[-3,0,-3,-2.9,3,3],[-4,0,2,4,.18,3],...far],{name:'recover and sweep '+dt+' '+yaw,at:[0,.06,0],keys:['KeyA','KeyW','ShiftLeft'],seconds:.5,dt,yaw,mutate(p,i){if(i===0){p.vx=-18;p.vz=11;}}});
 }
});
test('moving boxes and replacement lists are sampled freshly; external queries retain all obstacles',()=>{
 compare(flat,far,{name:'moving body and new list',at:[0,.06,0],keys:['KeyD'],seconds:2,mutate(p,i){const x=1.5+Math.sin(i*.04)*.8;p.obstacles=[...far,[x,0,-3,x+.5,3,3]];}});
 const p=playerFrom(after);p.obstacles=far;p.step(1/120,new Set(),6);
 assert.equal(p.collisionObstacles,null);assert.ok(p.blocked(20.1,0,20.1));
 assert.deepEqual({...p.contact({x:19.5,y:0,z:20.1},{x:19.8,y:0,z:20.1})},{x:-1,z:0});
 p.obstacles=[[0,0,-1,1,2,1]];assert.ok(p.blocked(.1,0,0));p.recoverOverlap();assert.ok(!p.blocked(p.x,p.y,p.z));
});
test('the near-box array is reused and a failed density query cannot leave a stale contact window',()=>{
 const p=playerFrom(after);p.obstacles=[[10,0,-1,11,3,1]];const pool=p.nearObstacles;
 for(let i=0;i<10;i++)p.step(1/120,new Set(['KeyD']),6);assert.equal(p.nearObstacles,pool);assert.equal(p.collisionObstacles,null);
 p.world={floor:-297,density(){throw new Error('fixture density failure');}};
 assert.throws(()=>p.step(1/120,new Set(),6),/fixture density failure/);assert.equal(p.collisionObstacles,null);
 p.world=flat;assert.ok(p.blocked(10.2,0,0));
});
console.log('COMPLETE '+contactScanChecks+' contact scan checks passed (no browser or OS input)');
