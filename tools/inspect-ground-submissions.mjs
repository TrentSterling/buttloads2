// Observe actual cached native submissions at fixed poses; no input or timings.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'tools/out'),p=await launch({port:9512,width:1440,height:1000,gpu:true}),results=[];
try{
 for(const [label,folder,buildFolder]of [['before','ground-cover-before-detail','ground-cover-before'],['release','ground-cover-release','ground-cover-release']]){
  const reference=JSON.parse(fs.readFileSync(path.join(out,folder,'report.json')));
  await p.goto(pathToFileURL(path.join(out,buildFolder,'build.html')).href+'?offline&seed=260923&submission-observation');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
  await p.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._observeRender=g.view.render;g.view.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();g.view.renderer.info.autoReset=false;return true;})()`);
  for(const name of ['west-foot','mine-wide','leaf-detail','scree-detail']){
   const shot=reference.shots.find(s=>s.name===name);assert.ok(shot);
   const result=await p.eval(`(()=>{const g=__buttloads,v=g.view,pose=${JSON.stringify(shot.camera)},roots=new Map(),groups={},objects=[];
    for(const [key,value]of Object.entries(v)){if(value?.isObject3D)roots.set(value,key);else if(Array.isArray(value))for(const node of value)if(node?.isObject3D)roots.set(node,key);}
    g.player.teleport(pose.x,pose.y,pose.z);g.player.yaw=pose.yaw;g.player.pitch=pose.pitch;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._observeRender.call(v,g,0,10);
    const original=v.renderer.renderBufferDirect;v.renderer.renderBufferDirect=function(camera,scene,geometry,material,object,group){let node=object,key='unclassified',route=[];while(node){route.push(node.name||node.type);if(roots.has(node)&&node!==v.scene&&node!==v.toolScene){key=roots.get(node);break;}node=node.parent;}if(key==='unclassified')key=scene===v.toolScene?'toolScene':route.reverse().join('/');const start=Math.max(0,geometry.drawRange.start,group?.start||0),end=Math.min(geometry.index?.count??geometry.attributes.position.count,geometry.drawRange.start+geometry.drawRange.count,group?group.start+group.count:Infinity),count=Math.max(0,end-start),instances=object.isInstancedMesh?object.count:geometry.isInstancedBufferGeometry?Math.min(geometry.instanceCount,geometry._maxInstanceCount):1,triangles=count/3*instances;
     if(count&&instances){const row=groups[key]||(groups[key]={calls:0,triangles:0});row.calls++;row.triangles+=triangles;objects.push({group:key,triangles,type:object.type,name:object.name,worldY:object.getWorldPosition(new THREE.Vector3()).y});}return original.apply(this,arguments);};
    v.renderer.info.reset();g._observeRender.call(v,g,0,10);v.renderer.renderBufferDirect=original;
    return{camera:pose,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles},groups,largest:objects.sort((a,b)=>b.triangles-a.triangles).slice(0,18),input:{pointerLock:!!document.pointerLockElement,keys:g.input.keys.size,fire:g.input.fire}};})()`);
   assert.deepEqual(result.cached,shot.cached);assert.deepEqual(result.input,{pointerLock:false,keys:0,fire:false});
   const observed=Object.values(result.groups).reduce((a,b)=>({calls:a.calls+b.calls,triangles:a.triangles+b.triangles}),{calls:0,triangles:0});assert.deepEqual(observed,result.cached);
   results.push({label,name,...result});
  }
 }
 const errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'ground-submissions.json'),JSON.stringify({date:new Date().toISOString(),results,errors,scope:'Actual renderBufferDirect submissions in guarded static headless native frames, with draw ranges and instance counts. Totals must match renderer.info and frozen references. No timing, occlusion conclusion, browser input or physical Firefox claim.'},null,2));
 console.log(JSON.stringify(results.map(({label,name,cached,groups})=>({label,name,cached,groups}))));
}finally{p.kill();}
