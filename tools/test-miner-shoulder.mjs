import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {nodeGame} from './node-game.mjs';
import {shoulderSamples,shoulderJacobian} from './miner-shoulder-test-helper.mjs';
const h=await nodeGame(),v=h.game.view,T=THREE,current=B2.buildMinerArt,m=v.makeMiner('shoulder',2,'Shoulder');
vm.runInThisContext(fs.readFileSync(new URL('fixtures/miner-art-2.58.0.js',import.meta.url),'utf8'));const released=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url),'utf8'));const old=released(v,2),rig=current(v,2);
const sleeves=m.bodyMeshes.filter(n=>n.userData.workerShoulder),samples=sleeves.map(shoulderSamples),poses=[];
export let minerShoulderChecks=0;
const test=(name,fn)=>{fn();minerShoulderChecks++;console.log('PASS miner shoulder: '+name);};
const inventory=art=>{const a=[];art.root.traverse(n=>{if(n.isMesh)a.push(n);});return{meshes:a.length,triangles:a.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),geometryBytes:a.reduce((n,m)=>n+Object.values(m.geometry.attributes).reduce((s,a)=>s+a.array.byteLength,0)+(m.geometry.index?.array.byteLength||0),0),materials:new Set(a.map(n=>n.material)).size,ownedMaterials:art.materials.length,textures:art.textures.length};};
function pose(tool,pitch,lean){
 m.torso.rotation.set(...lean);m.torso.position.set(.01,-.03,.015);m.gait={};
 for(let i=0;i<2;i++){m.arms[i].position.set((i?1:-1)*.251,1.30,.018).applyQuaternion(m.torso.quaternion).add(m.torso.position);m.arms[i].rotation.set(0,0,i?-.10:.10);m.arms[i].quaternion.premultiply(m.torso.quaternion);m.elbows[i].rotation.set(i?.28:.11,0,0);}
 v.equipMiner(m,tool);v.poseMinerWeapon(m,pitch);m.root.updateMatrixWorld(true);
}
try{
 test('current body declares cumulative resources and preserves the two shoulder meshes',()=>{
  assert.deepEqual(inventory(old),{meshes:48,triangles:26224,geometryBytes:1431792,materials:25,ownedMaterials:45,textures:1});
  assert.deepEqual(inventory(rig),{meshes:44,triangles:30518,geometryBytes:1565348,materials:27,ownedMaterials:51,textures:1});assert.equal(sleeves.length,2);
 });
 test('the buried seam follows the torso and distal cuffs retain complete elbow and arm travel',()=>{
  for(const tool of ['cutter','scoop','lance','resonance','gravity','axe','sling'])for(const pitch of [-1.54,0,1.54]){
   pose(tool,pitch,[.12,.05,-.08]);
   for(let side=0;side<2;side++){
    const mesh=sleeves[side],s=mesh.userData.workerShoulder,j=mesh.userData.workerJoint,p=mesh.geometry.attributes.position,point=new T.Vector3(),bent=new T.Vector3(),result=new T.Vector3(),expected=new T.Vector3(),origin=new T.Vector3((side?1:-1)*.251,1.30,.018);let seam=0,cuff=0;
    for(let i=0;i<p.count;i++){
     point.fromBufferAttribute(p,i);B2.WorkerJoint.point(point,j.joint.quaternion,j.pivot,j.span,bent);B2.WorkerShoulder.point(point,bent,s.arm.quaternion,s.torso.quaternion,s,result);
     if(point.y>.0375){result.applyQuaternion(s.arm.quaternion).add(s.arm.position);expected.copy(point).add(origin).applyQuaternion(s.torso.quaternion).add(s.torso.position);assert.ok(result.distanceTo(expected)<1e-7);seam++;}
     if(point.y<-.449){assert.ok(result.distanceTo(bent)<1e-10);cuff++;}
    }
    assert.equal(seam,20);assert.equal(cuff,20);
   }
  }
 });
 test('all seven carries retain positive sampled deformation throughout full pitch and torso lean ranges',()=>{
  for(const lean of [[0,0,0],[.12,.05,-.08],[-.12,-.05,.08]])for(const tool of ['cutter','scoop','lance','resonance','gravity','axe','sling'])for(const pitch of [-1.54,-1.2,-.9,-.45,0,.45,.9,1.2,1.54]){
   pose(tool,pitch,lean);
   sleeves.forEach((mesh,i)=>{const result=shoulderJacobian(mesh,samples[i]);assert.equal(result.negative,0,JSON.stringify({tool,pitch,lean,side:i,...result}));assert.ok(result.minimum>0);poses.push({tool,pitch,lean,side:i,...result});});
  }
 });
 test('shoulder and elbow deformation regions do not overlap and composite sweeps stay inside native bounds',()=>{
  for(const mesh of sleeves){const s=mesh.userData.workerShoulder,j=mesh.userData.workerJoint,p=mesh.geometry.attributes.position,point=new T.Vector3(),bent=new T.Vector3(),result=new T.Vector3();assert.ok(s.radius+s.falloff<-j.pivot-j.span);
   for(const angle of [0,.7,1.4,2.1])for(const axis of [new T.Vector3(1,0,0),new T.Vector3(.7,.2,.5).normalize()]){
    s.arm.quaternion.setFromAxisAngle(axis,angle);s.torso.quaternion.setFromAxisAngle(new T.Vector3(.2,.8,.3).normalize(),-.6);j.joint.quaternion.setFromAxisAngle(axis,-angle);
    for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);B2.WorkerJoint.point(point,j.joint.quaternion,j.pivot,j.span,bent);B2.WorkerShoulder.point(point,bent,s.arm.quaternion,s.torso.quaternion,s,result);assert.ok(result.toArray().every(Number.isFinite));assert.ok(mesh.geometry.boundingSphere.containsPoint(result));}
   }
  }
 });
 test('surface, depth and distance shaders bind live body and arm rotations with the same shoulder transform',()=>{
  for(const mesh of sleeves)for(const [material,kind]of [[mesh.material,'standard'],[mesh.customDepthMaterial,'depth'],[mesh.customDistanceMaterial,'distanceRGBA']]){
   const shader={vertexShader:T.ShaderLib[kind].vertexShader,uniforms:{}};material.onBeforeCompile(shader);assert.equal(shader.uniforms.workerShoulderArm.value,mesh.userData.workerShoulder.arm.quaternion);assert.equal(shader.uniforms.workerShoulderBody.value,mesh.userData.workerShoulder.torso.quaternion);
   assert.deepEqual(shader.uniforms.workerShoulderRadius.value.toArray(),[.101,.009]);assert.ok(shader.vertexShader.includes('transformed=workerShoulderPoint(position,transformed);'));assert.ok(shader.vertexShader.includes('attribute vec4 workerInstanceShoulder'));assert.equal(material.customProgramCacheKey(),'worker-continuous-shoulder-v4');
  }
 });
 test('each visible sleeve batch uploads independent body-relative shoulder rotations and owns its extra buffers',()=>{
  gFixture();const groups=[...v.crewBodyBatches.values()].filter(g=>g.mesh?.visible&&g.mesh.geometry.attributes.workerInstanceShoulder);assert.equal(groups.length,2);assert.equal(v.crewBatchStats.instanceBytes,12160);
  for(const group of groups){const a=group.mesh.geometry.attributes.workerInstanceShoulder,expected=new T.Quaternion();assert.equal(a.itemSize,4);assert.equal(a.usage,T.DynamicDrawUsage);
   for(let i=0;i<group.mesh.count;i++){const s=group.active[i].source.userData.workerShoulder;expected.copy(s.arm.quaternion).invert().multiply(s.torso.quaternion);for(let k=0;k<4;k++)assert.ok(Math.abs(a.array[i*4+k]-expected.toArray()[k])<1e-7);}assert.notDeepEqual(a.array.slice(0,4),a.array.slice(4,8));
   let owned=0,native=0;group.mesh.geometry.addEventListener('dispose',()=>owned++);group.active[0].source.geometry.addEventListener('dispose',()=>native++);group.disposalCheck=()=>{assert.equal(owned,1);assert.equal(native,0);};
  }
  v.clearCrewBatches();for(const group of groups)group.disposalCheck();
 });
 fs.mkdirSync(new URL('out/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('out/miner-shoulder-math.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),method:'Actual production CPU reference sampled by central finite differences at vertices, edge midpoints and triangle centroids. Seven carries, nine pitches over the complete player range, three torso leans, both shoulders. Positive sampled Jacobians do not certify global self-intersection freedom.',minimum:Math.min(...poses.map(p=>p.minimum)),negativeSamples:0,cases:poses.length,samples:poses.reduce((n,p)=>n+p.samples,0),poses},null,2));
}finally{v.clearMiners();h.close();}
function gFixture(){
 const g=h.game;g.net={role:'fixture',count:5,members:[0,1,2,3].map(i=>({id:'shoulder-'+i,name:'Miner '+i,color:2,tool:'cutter',playing:true,player:{x:(i-1.5)*.8,y:.06,z:7,grounded:true,yaw:Math.PI,pitch:[-.7,-.2,.3,.8][i],vx:0,vz:0}}))};g.player.teleport(0,.06,11.5);g.player.yaw=0;g.player.pitch=-.12;g.setScreen(null);v.render(g,.025,3);
 for(const [i,miner]of [...v.miners.values()].entries()){miner.torso.rotation.set(i*.08,i*.025,-i*.03);miner.root.updateMatrixWorld(true);}v.renderCrewBatches();
}
console.log(`COMPLETE ${minerShoulderChecks} miner shoulder checks passed (torso anchors, complete aim range, sampled fold safety, culling, shaders and independent batching; visual verdict separate)`);
