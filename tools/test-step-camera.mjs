import fs from 'node:fs';
import assert from 'node:assert/strict';
import {source,playerFrom} from './movement-fixtures.mjs';
import {rates,stairReplay} from './step-camera-fixtures.mjs';
const text=process.argv.includes('--before')?fs.readFileSync(new URL('out/step-camera-before/player.js',import.meta.url),'utf8'):source();
export let stepCameraChecks=0;
let failures=0;
function test(name,fn){try{fn();stepCameraChecks++;console.log('PASS step camera: '+name);}catch(e){failures++;console.error('FAIL step camera: '+name+'; '+e.message);}}
test('reading a camera pose does not advance easing or mutate either simulation endpoint',()=>{
 const p=playerFrom(text);p.previousStepOffset=p.stepOffset=-.18;p.look(15,-8,1);
 const before=JSON.stringify(p),pose=p.cameraPose(.5,1/60);
 for(let i=0;i<100;i++)assert.deepEqual(p.cameraPose(.5,[0,1/240,1/30,.25][i%4]),pose);
 assert.equal(JSON.stringify(p),before);
});
test('the same stair route has matching camera height at common read times across eight cadences',()=>{
 const all=rates.map(hz=>stairReplay(text,hz)),reference=all.at(-1);
 for(const r of all)for(let i=0;i<r.samples.length;i++){
  const a=r.samples[i],b=reference.samples[i];
  assert.ok(Math.abs(a.camera.y-b.camera.y)<1e-7,r.hz+' Hz camera differs by '+Math.abs(a.camera.y-b.camera.y)+' m');
  for(const axis of ['x','z'])assert.ok(Math.abs(a.camera[axis]-b.camera[axis])<1e-7,r.hz+' Hz interpolated travel differs');
 }
 for(const r of all)assert.deepEqual(r.finalBody,reference.finalBody);
});
test('elevation easing progresses without rendering while repeated reads leave collision and fresh aim intact',()=>{
 const a=playerFrom(text),b=playerFrom(text),keys=new Set(['KeyD']);
 a.previousStepOffset=a.stepOffset=b.previousStepOffset=b.stepOffset=-.18;
 for(let i=0;i<60;i++){
  a.step(1/120,keys,6);b.step(1/120,keys,6);
  for(let n=0;n<4;n++)b.cameraPose(n/4,1/480);
 }
 assert.ok(Math.abs(a.stepOffset)<.001,'offset still '+a.stepOffset+' without rendering');
 assert.ok(!a.blocked(a.x,a.y,a.z));
 assert.deepEqual({...a.cameraPose(.35,.5)},{...b.cameraPose(.35,.5)});
 a.look(20,-10,1);const pose=a.cameraPose(.1,.5);
 assert.equal(pose.yaw,a.yaw);assert.equal(pose.pitch,a.pitch);
});
if(failures){throw new Error('INCOMPLETE '+failures+' step camera contracts failed');}
else console.log('COMPLETE '+stepCameraChecks+' step camera checks passed (no browser or OS input)');
