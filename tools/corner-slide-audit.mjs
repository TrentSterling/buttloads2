// Production controller replays only. No browser or physical input.
import fs from 'node:fs';import assert from 'node:assert/strict';import {nodeGame} from './node-game.mjs';import {playerFrom} from './movement-fixtures.mjs';import {seamCases,seamReplay} from './corner-slide-fixtures.mjs';
const old=fs.readFileSync(new URL('fixtures/player-corners-2.43.2.js',import.meta.url),'utf8'),current=fs.readFileSync(new URL('../src/player.js',import.meta.url),'utf8');
const report={date:new Date().toISOString(),scope:'Deterministic controller replays at 120 Hz. Static native world and collision boxes. No FPS, physical mouse or public network claim.',seams:[],cadences:[],native:[]};
for(const fixture of seamCases){const before=seamReplay(old,fixture),after=seamReplay(current,fixture);assert.equal(after.stoppedFrames,0);assert.ok(after.minTangential>2.61);assert.ok(after.trace.every(s=>!s.blocked));if(fixture.inset===0)assert.equal(before.traceSha256,after.traceSha256);report.seams.push({fixture,before,after});}
for(const hz of [30,60,75,90,120,144,165,240])report.cadences.push({hz,before:seamReplay(old,{width:1,inset:.001},hz),after:seamReplay(current,{width:1,inset:.001},hz)});
const h=await nodeGame(),g=h.game,boxes=g.refreshPlayerObstacles();
try{
 for(const route of [{name:'depot post graze',at:[3,.06,15.4],keys:['KeyW'],yaw:Math.PI},{name:'depot post straight clearance',at:[2.8,.06,15.4],keys:['KeyW'],yaw:Math.PI},{name:'workshop corner',at:[-1.9,.06,15.4],keys:['KeyW'],yaw:Math.PI},{name:'yard strafe',at:[0,.06,11.5],keys:['KeyD'],yaw:0}]){
  const run=text=>{const p=playerFrom(text,g.world);p.teleport(...route.at);p.yaw=route.yaw;p.pitch=-.05;p.obstacles=boxes;const keys=new Set(route.keys),trace=[];assert.ok(!p.blocked(p.x,p.y,p.z),route.name+' start');for(let i=0;i<240;i++){p.step(1/120,keys,6);trace.push({time:(i+1)/120,state:[p.x,p.y,p.z,p.vx,p.vy,p.vz,p.grounded],camera:{...p.cameraPose(.35)},blocked:p.blocked(p.x,p.y,p.z)});}return {trace,final:trace.at(-1).state,capture:trace[71]};};
  const before=run(old),after=run(current);assert.ok(after.trace.every(s=>!s.blocked));report.native.push({route,before,after});
 }
 console.log(JSON.stringify({seams:report.seams.map(r=>({name:r.fixture.name,beforeStopped:r.before.stoppedFrames,afterStopped:r.after.stoppedFrames,afterMin:r.after.minTangential})),native:report.native.map(r=>({name:r.route.name,before:r.before.final,after:r.after.final}))}));
}finally{h.close();clearInterval(g.net.timer);fs.writeFileSync(new URL('out/corner-slide-report.json',import.meta.url),JSON.stringify(report,null,2));}
