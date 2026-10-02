// Static controller fixture rendering only; no browser/OS input or pointer lock.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
import {checkpointSchedule} from './step-camera-fixtures.mjs';
const side=process.argv[2];assert.ok(['before','after'].includes(side));
const out=new URL('out/',import.meta.url),folder=new URL('step-camera-'+side+'/',out);
fs.mkdirSync(folder,{recursive:true});
const build=new URL(side==='before'?'step-camera-before/build.html':'../dist/index.html',side==='before'?out:import.meta.url);
const replay=JSON.parse(fs.readFileSync(new URL('step-camera-report.json',out)));
const page=await launch({port:9499,width:1280,height:900,gpu:true});
try{
 await page.goto(pathToFileURL(build.pathname.replace(/^\//,'')).href+'?offline&seed=260923&step-camera');
 await until(()=>page.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await page.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.settings.motion=false;g.advanceSimulation=()=>{};g._fixtureRender=g.view.render;g.view.render=()=>{};
 const T=THREE,root=new T.Group();for(let i=0;i<8;i++){const m=new T.Mesh(new T.BoxGeometry(.8,.16*(i+1),4),new T.MeshStandardMaterial({color:i%2?0x837a66:0x9a8e72,roughness:.92}));m.position.set(1.4+i*.8,.08*(i+1),11.5);m.castShadow=m.receiveShadow=true;root.add(m);}g.view.scene.add(root);g.view.renderer.shadowMap.needsUpdate=true;return true;})()`);
 const shots=[];
 for(const hz of [30,240]){
  const times=checkpointSchedule(hz);let elapsed=0;
  const selected=[];for(const dt of times){elapsed+=dt;if(elapsed>.2+1e-8)break;selected.push(dt);}
  const result=await page.eval(`(()=>{const g=__buttloads,p=new B2.Player({density:(x,y,z)=>y,normal:()=>[0,1,0],floor:-297});p.teleport(0,.06,0);p.vx=3.8;p.grounded=true;p.obstacles=Array.from({length:8},(_,i)=>[1+i*.8,0,-2,1.8+i*.8,.16*(i+1),2]);let accumulator=0,pose;
  for(const dt of ${JSON.stringify(selected)}){accumulator+=dt;while(accumulator>=1/120){p.step(1/120,new Set(['KeyD']),6);accumulator-=1/120;}pose=p.cameraPose(accumulator*120,dt);}
  // The replay above already presented its last frame. Capture that exact pose,
  // avoiding an additional read that would change the baseline's easing.
  const original=p.cameraPose;p.cameraPose=()=>pose;p.yaw=pose.yaw=Math.PI;p.pitch=pose.pitch=-.05;p.z+=11.5;p.previous.z+=11.5;pose.z+=11.5;g.player=p;g.accumulator=accumulator;g._fixtureRender.call(g.view,g,0,0);p.cameraPose=original;
  const gl=g.view.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');return {hz:${hz},version:document.querySelector('meta[name=application-version]').content,body:{x:p.x,y:p.y,z:p.z},camera:{x:g.view.camera.position.x,y:g.view.camera.position.y,z:g.view.camera.position.z},pose,eye:p.eye,pointerLock:!!document.pointerLockElement,keys:g.input.keys.size,fire:g.input.fire,hardware:gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)};})()`);
  const expected=replay.cadences.find(r=>r.hz===hz)[side].samples[1].camera;
  for(const axis of ['x','y','z'])assert.ok(Math.abs(result.pose[axis]-(expected[axis]+(axis==='z'?11.5:0)))<1e-8);
  assert.ok(Math.abs(result.camera.y-(expected.y+result.eye))<1e-8);
  assert.equal(result.pointerLock,false);assert.equal(result.keys,0);assert.equal(result.fire,false);
  await page.shot(new URL(hz+'hz.png',folder).pathname.replace(/^\//,''));shots.push(result);
 }
 const errors=page.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(errors,[]);
 const report={side,version:shots[0].version,buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),method:'Native portable rendering of production Player replay pose at 0.2 seconds. Added synthetic 16 cm stair fixture in the native yard. Direct page evaluation only; heading changed to face depot after replay. No gameplay, mouse, keyboard, focus or pointer lock.',shots,errors};
 fs.writeFileSync(new URL('capture.json',folder),JSON.stringify(report,null,2));
 console.log('COMPLETE '+side+': 30/240 Hz native controller fixture cameras match replay; zero errors, no input or pointer lock.');
}finally{page.kill();}
