// Actual native rendering; frozen fixtures only, no dispatched input or focus.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const out=new URL('out/',import.meta.url),build=new URL('../../dist/index.html',out),p=await launch({port:9644,width:1280,height:900,gpu:true});
const report={date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),method:'Frozen four-player native render fixtures with different arm and knee poses. Instanced and native source draws include refreshed directional shadows. No actual network peers, input dispatch, focus, pointer lock or FPS claim.'};
try{
 await p.goto(build.href+'?offline&seed=260923');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE;g.running=false;g.update=()=>{};g.advanceSimulation=()=>{};g.setScreen(null);g.settings.motion=true;v.windUniform.value=0;v.skyDome.material.uniforms.windTime.value=0;v.renderer.info.autoReset=false;
  g.net={role:'fixture',count:5,tick(){},stepRemotes(){},members:[0,1,2,3].map(i=>({id:'bend-'+i,name:'Miner '+i,color:2,tool:'cutter',playing:true,player:{x:(i-1.5)*1.1,y:.06,z:7,grounded:true,yaw:0,pitch:[-1.54,-.2,.3,1.54][i],vx:0,vz:0}}))};g.player.teleport(0,.06,3);g.player.yaw=Math.PI;g.player.pitch=-.08;v.render(g,0,4);
  v._bendNative=v.render;v.render=function(){};
  for(const [i,m]of [...v.miners.values()].entries()){m.legs[0].rotation.x=[0,.2,.4,.7][i];m.knees[0].rotation.x=[0,-.45,-.95,-1.65][i];m.feet[0].rotation.x=-m.legs[0].rotation.x-m.knees[0].rotation.x;m.root.updateMatrixWorld(true);}
  v.renderCrew=function(){this.renderCrewBatches();};return true;})()`);
 const draw=()=>p.eval(`(()=>{const g=__buttloads,v=g.view;v._bendNative.call(v,g,0,4);v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;v._bendNative.call(v,g,0,4);return{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,batchStats:v.crewBatchStats,jointGroups:[...v.crewBodyBatches?.values()||[]].filter(g=>g.mesh?.visible&&g.mesh.userData.ownedCrewJointGeometry).map(g=>({name:g.active[0].source.name,instances:g.mesh.count,quaternions:Array.from(g.mesh.geometry.attributes.workerInstanceJoint.array),shoulderQuaternions:g.mesh.geometry.attributes.workerInstanceShoulder?Array.from(g.mesh.geometry.attributes.workerInstanceShoulder.array):null,bytes:Object.values(g.mesh.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.mesh.geometry.index?.array.byteLength||0)}))};})()`);
 report.instanced=await draw();assert.equal(report.instanced.jointGroups.length,10);assert.equal(report.instanced.jointGroups.filter(g=>g.shoulderQuaternions).length,2);await p.shot(new URL('miner-collar-four-instanced.png',out).pathname.replace(/^\//,''));
 await p.eval('(()=>{const v=__buttloads.view;v.clearCrewBatches();v.renderCrew=function(){};return true;})()');
 report.native=await draw();await p.shot(new URL('miner-collar-four-native.png',out).pathname.replace(/^\//,''));
 assert.equal(report.native.triangles,report.instanced.triangles);
 report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);
 fs.writeFileSync(new URL('miner-collar-gpu.json',out),JSON.stringify(report,null,2));console.log('COMPLETE native GPU collar capture: independent four-player poses, ten joint groups, matching triangle submission and refreshed shadows, no errors or input. Pixel judgement pending.');
}finally{fs.writeFileSync(new URL('miner-collar-gpu.json',out),JSON.stringify(report,null,2));p.kill();}
