import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {nodeGame} from './node-game.mjs';
import {unchangedWorkerMeshes,posedWorkerMesh} from './miner-joint-test-helper.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE,current=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('fixtures/miner-art-2.57.0.js',import.meta.url),'utf8'));const released=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url),'utf8'));
const old=released(v,2),rig=current(v,2),pieces=[];rig.root.traverse(n=>{if(n.userData.workerJoint)pieces.push(n);});
export let minerJointChecks=0;
const test=(name,fn)=>{fn();minerJointChecks++;console.log('PASS miner joint: '+name);};
try{
 test('all 33 untouched body pieces retain exact released attributes, transforms and material boundaries; face and collar reconstruction are checked separately',()=>{
  const a=unchangedWorkerMeshes(rig),b=unchangedWorkerMeshes(old);assert.equal(a.length,33);assert.equal(b.length,33);
  for(let i=0;i<a.length;i++){
   assert.deepEqual(a[i].geometry.index?.array,b[i].geometry.index?.array);assert.deepEqual(Object.keys(a[i].geometry.attributes),Object.keys(b[i].geometry.attributes));
   for(const name of Object.keys(a[i].geometry.attributes))assert.deepEqual(a[i].geometry.attributes[name].array,b[i].geometry.attributes[name].array);
   for(const name of ['position','quaternion','scale'])assert.deepEqual(a[i][name].toArray(),b[i][name].toArray());
   assert.equal(rig.materials.indexOf(a[i].material),old.materials.indexOf(b[i].material));
  }
 });
 test('each garment remains a closed outward connected solid through anatomical bends',()=>{
  const garments=pieces.filter(n=>n.material.map===rig.textures[0]);assert.equal(garments.length,4);
  for(const mesh of garments)for(const angle of [0,.5,1,1.65,2.1]){
   mesh.userData.workerJoint.joint.quaternion.setFromAxisAngle(new T.Vector3(1,0,0),mesh.name==='continuous-trouser'?-angle:angle);rig.root.updateMatrixWorld(true);
   const posed=posedWorkerMesh(mesh),p=posed.geometry.attributes.position,indices=posed.geometry.index,edges=new Map();let volume=0;
   const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e7)).join(',');
   for(let i=0;i<indices.count;i+=3){const ids=[0,1,2].map(k=>indices.getX(i+k)),[a,b,c]=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j));assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-10);volume+=a.dot(b.clone().cross(c))/6;
    for(let j=0;j<3;j++){const x=key(ids[j]),y=key(ids[(j+1)%3]),id=[x,y].sort().join('|');const e=edges.get(id)||{count:0,direction:0};e.count++;e.direction+=x<y?1:-1;edges.set(id,e);}
   }
   assert.ok(volume>0);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),'Open, non-manifold or inconsistent garment winding.');posed.geometry.dispose();
  }
 });
 test('joint sweeps retain exact fixed upper ends and fully rotated cuff ends inside native culling bounds',()=>{
  assert.equal(pieces.length,10);
  for(const mesh of pieces){const {joint,pivot,span}=mesh.userData.workerJoint,p=mesh.geometry.attributes.position,point=new T.Vector3(),posed=new T.Vector3();
   for(const angle of [0,.5,1,1.65,2.1])for(const axis of [new T.Vector3(1,0,0),new T.Vector3(.7,.2,.5).normalize()]){
    joint.quaternion.setFromAxisAngle(axis,angle);
    for(let i=0;i<p.count;i++){
     point.fromBufferAttribute(p,i);B2.WorkerJoint.point(point,joint.quaternion,pivot,span,posed);assert.ok(posed.toArray().every(Number.isFinite));assert.ok(mesh.geometry.boundingSphere.containsPoint(posed));
     if(point.y>=pivot+span)assert.ok(posed.distanceTo(point)<1e-7);
     if(point.y<=pivot-span){const expected=point.clone();expected.y-=pivot;expected.applyQuaternion(joint.quaternion);expected.y+=pivot;assert.ok(expected.distanceTo(posed)<1e-7);}
    }
   }
  }
 });
 test('all ten visible bend batches retain independently posed instance data and matching depth/distance materials',()=>{
  g.net={role:'fixture',members:[0,1,2,3].map(i=>({id:'bend-'+i,name:'Miner '+i,color:2,tool:'cutter',playing:true,player:{x:(i-1.5)*.8,y:.06,z:7,grounded:true,yaw:Math.PI,pitch:[-.7,-.2,.3,.8][i],vx:i,vz:.2}})),count:5};g.player.teleport(0,.06,11.5);g.player.yaw=0;g.player.pitch=-.12;g.setScreen(null);v.render(g,.025,3);
  const groups=[...v.crewBodyBatches.values()].filter(group=>group.mesh?.visible&&group.mesh.userData.ownedCrewJointGeometry);assert.equal(groups.length,10);
  for(const group of groups){const a=group.mesh.geometry.attributes.workerInstanceJoint;assert.ok(a.isInstancedBufferAttribute);assert.notEqual(group.mesh.geometry,group.active[0].source.geometry);
   for(let i=0;i<group.mesh.count;i++){const q=group.active[i].source.userData.workerJoint.joint.quaternion.toArray();for(let k=0;k<4;k++)assert.ok(Math.abs(a.array[i*4+k]-q[k])<1e-7);}
   for(const key of ['customDepthMaterial','customDistanceMaterial'])assert.equal(group.mesh[key],group.active[0].source[key]);
  }
  const sleeve=groups.find(group=>group.active[0].source.name==='continuous-sleeve').mesh.geometry.attributes.workerInstanceJoint.array;assert.notDeepEqual(sleeve.slice(0,4),sleeve.slice(4,8));
 });
 test('batch clearing releases owned deformation geometry without disposing surviving native geometry',()=>{
  const group=[...v.crewBodyBatches.values()].find(group=>group.mesh?.userData.ownedCrewJointGeometry);let nativeDisposals=0,batchDisposals=0;
  group.active[0].source.geometry.addEventListener('dispose',()=>nativeDisposals++);group.mesh.geometry.addEventListener('dispose',()=>batchDisposals++);v.clearCrewBatches();assert.equal(nativeDisposals,0);assert.equal(batchDisposals,1);
 });
 test('all surface and shadow shader variants reference the live joint while original material and texture ownership survives',()=>{
  for(const mesh of pieces)for(const [material,kind]of [[mesh.material,'standard'],[mesh.customDepthMaterial,'depth'],[mesh.customDistanceMaterial,'distanceRGBA']]){
   const shader={vertexShader:T.ShaderLib[kind].vertexShader,fragmentShader:T.ShaderLib[kind].fragmentShader,uniforms:{}};material.onBeforeCompile(shader);assert.equal(shader.uniforms.workerJointQuaternion.value,mesh.userData.workerJoint.joint.quaternion);
   assert.ok(shader.vertexShader.includes('transformed=workerJointPoint(transformed)'));assert.ok(shader.vertexShader.includes('attribute vec4 workerInstanceJoint'));
  }
  assert.equal(rig.materials.length,45);assert.equal(new Set(rig.materials).size,45);assert.equal(rig.textures.length,1);assert.notEqual(rig.textures[0],old.textures[0]);
  for(let i=0;i<15;i++)for(const prop of ['color','roughness','metalness','transparent','opacity','side','depthWrite'])assert.deepEqual(rig.materials[i][prop],old.materials[i][prop]);
  for(const mesh of pieces)if(mesh.material.map){assert.equal(mesh.material.map,rig.textures[0]);assert.equal(mesh.material.bumpMap,rig.textures[0]);}
 });
}finally{clearInterval(g.net.timer);h.close();}
console.log(`COMPLETE ${minerJointChecks} continuous miner joint checks passed (construction, independent batch poses, resources and shadow hooks; GPU rendering and visual judgement remain separate)`);
