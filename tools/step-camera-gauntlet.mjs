import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {playerFrom,source} from './movement-fixtures.mjs';
import {rates,stairReplay} from './step-camera-fixtures.mjs';
const out=new URL('out/',import.meta.url),sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before=fs.readFileSync(new URL('step-camera-before/player.js',out),'utf8'),after=source();
const baselineLog=fs.readFileSync(new URL('step-camera-before-contracts.log',out),'utf8');
assert.ok(baselineLog.includes('INCOMPLETE 3 step camera contracts failed'));
const report={date:new Date().toISOString(),version:'2.35.2',beforeVersion:'2.35.1',beforeBuildSha256:sha(new URL('step-camera-before/build.html',out)),afterBuildSha256:sha(new URL('../dist/index.html',import.meta.url)),method:'Production Player source replay. Eight 30-240 Hz presentation schedules plus common 0.1-second read times over two seconds. Extra read checkpoints shorten some frame intervals. Separately retained uniform-rate traces have no extra checkpoints. 120 Hz physics, eight 16 cm treads, 3.8 m/s initial horizontal speed. No browser, input events or physical mouse.',cadences:[],repeatedRead:{},physicalMouseTest:'pending',frameRateGainMeasured:false};
for(const hz of rates)report.cadences.push({hz,before:stairReplay(before,hz),after:stairReplay(after,hz),uniformBefore:stairReplay(before,hz,{matched:false}),uniformAfter:stairReplay(after,hz,{matched:false})});
const reference=report.cadences.at(-1);
for(const r of report.cadences){
 for(const side of ['before','after'])r[side].maxMatchedHeightDifferenceM=Math.max(...r[side].samples.map((f,i)=>Math.abs(f.camera.y-reference[side].samples[i].camera.y)));
 assert.deepEqual(r.after.finalBody,r.before.finalBody);
 assert.ok(r.after.maxMatchedHeightDifferenceM<1e-7);
 for(let i=0;i<r.before.trace.length;i++)for(const key of ['x','y','z','speed','grounded'])assert.equal(r.before.trace[i][key],r.after.trace[i][key],r.hz+' Hz changed '+key);
}
for(const [side,text]of [['before',before],['after',after]]){
 const p=playerFrom(text);p.previousStepOffset=p.stepOffset=-.18;
 const first=p.cameraPose(.5,1/60),second=p.cameraPose(.5,1/60);
 report.repeatedRead[side]={first,second,shiftM:second.y-first.y};
}
assert.equal(report.repeatedRead.after.shiftM,0);
fs.writeFileSync(new URL('step-camera-report.json',out),JSON.stringify(report,null,2));
console.log(JSON.stringify({beforeMaxCm:Math.max(...report.cadences.map(r=>r.before.maxMatchedHeightDifferenceM))*100,afterMaxCm:Math.max(...report.cadences.map(r=>r.after.maxMatchedHeightDifferenceM))*100,repeatReadBeforeCm:report.repeatedRead.before.shiftM*100,repeatReadAfterCm:report.repeatedRead.after.shiftM*100,allBodyTracesExact:true},null,2));
