import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {nodeGame} from './node-game.mjs';
import {posedWorkerMesh} from './miner-joint-test-helper.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE,current=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('fixtures/miner-art-2.61.0.js',import.meta.url),'utf8'));
const released=B2.buildMinerArt,oldPoint=B2.WorkerJoint.point;
vm.runInThisContext(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url),'utf8'));
const old=released(v,2),rig=current(v,2),shell=B2.WorkshopShapes.workerBoot();
const meshes=art=>{const a=[];art.root.traverse(n=>{if(n.isMesh)a.push(n);});return a;};
const inventory=art=>{const a=meshes(art);return{meshes:a.length,triangles:a.reduce((s,m)=>s+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),bytes:a.reduce((s,m)=>s+Object.values(m.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(m.geometry.index?.array.byteLength||0),0),materials:new Set(a.map(m=>m.material)).size,ownedMaterials:art.materials.length,textures:art.textures.length};};
const changed=(art,m)=>art.feet.includes(m.parent)||m.userData.workerBoot||m.name==='continuous-trouser';
const boots=meshes(rig).filter(m=>m.userData.workerBoot);
export let minerBootChecks=0;const test=(name,fn)=>{fn();minerBootChecks++;console.log('PASS miner boots: '+name);};
let solid,frames=0,minimumDeterminant=Infinity,hemIntersections=0;
try{
 test('upper and lining form one closed outward shell with complete finite attributes and a hollow shaft',()=>{
  const p=shell.attributes.position,n=shell.attributes.normal,ix=shell.index,edges=new Map(),adjacency=new Map();let volume=0,minimumArea=Infinity;
  for(const a of Object.values(shell.attributes)){assert.equal(a.count,p.count);assert.ok(a.array.every(Number.isFinite));}
  for(let i=0;i<n.count;i++)assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(n,i).length()-1)<1e-5);
  const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(',');
  for(let i=0;i<ix.count;i+=3){const ids=[0,1,2].map(k=>ix.getX(i+k)),[a,b,c]=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j)),cross=b.clone().sub(a).cross(c.clone().sub(a));minimumArea=Math.min(minimumArea,cross.length());assert.ok(cross.length()>1e-10);volume+=a.dot(b.clone().cross(c))/6;
   for(let j=0;j<3;j++){const x=key(ids[j]),y=key(ids[(j+1)%3]),id=[x,y].sort().join('|'),e=edges.get(id)||{count:0,direction:0};e.count++;e.direction+=x<y?1:-1;edges.set(id,e);if(!adjacency.has(x))adjacency.set(x,new Set());adjacency.get(x).add(y);}
  }
  assert.ok(volume>0&&volume<.01);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0));
  const visited=new Set(),pending=[adjacency.keys().next().value];while(pending.length){const k=pending.pop();if(visited.has(k))continue;visited.add(k);pending.push(...adjacency.get(k));}assert.equal(visited.size,adjacency.size);
  const m=new T.Mesh(shell,new T.MeshBasicMaterial({side:T.DoubleSide}));m.updateMatrixWorld(true);
  const hits=new T.Raycaster(new T.Vector3(0,.4,0),new T.Vector3(0,-1,0)).intersectObject(m);assert.ok(hits.length>0&&hits[0].point.y<.09,'The rim must not close the opening with a flat cap');m.material.dispose();solid={volume,minimumArea,triangles:ix.count/3,connectedComponents:1};
 });
 test('actual production upper includes the exact shell, and toe and rim retain their distinct native anchors',()=>{
  assert.equal(boots.length,2);
  for(const m of boots){const meta=m.geometry.userData.workerBootShell,p=m.geometry.attributes.position,s=shell.attributes.position;assert.deepEqual(meta,{vertices:s.count,indices:shell.index.count});assert.deepEqual(m.geometry.index.array.slice(0,meta.indices),shell.index.array);
   for(let i=0;i<s.count;i++){assert.equal(p.getX(i),s.getX(i));assert.ok(Math.abs(p.getY(i)-(s.getY(i)-.5))<1e-7);assert.equal(p.getZ(i),s.getZ(i));}
   const {joint,pivot,span,weightPivot}=m.userData.workerJoint;
   for(const angle of [-.7,0,.7,1.1]){joint.rotation.set(angle,.2,0);for(let i=0;i<s.count;i++){const point=new T.Vector3().fromBufferAttribute(p,i),posed=B2.WorkerJoint.point(point,joint.quaternion,pivot,span,new T.Vector3(),weightPivot);assert.ok(m.geometry.boundingSphere.containsPoint(posed));
     if(point.y>=weightPivot+span)assert.ok(posed.distanceTo(point)<1e-7);
     if(point.y<=weightPivot-span){const expected=point.clone();expected.y-=pivot;expected.applyQuaternion(joint.quaternion);expected.y+=pivot;assert.ok(posed.distanceTo(expected)<1e-7);}
   }}
  }
 });
 test('trouser hems remain inside the posed hollow shaft through ankle turns and bent knees',()=>{
  for(const angle of [0,.5,.9,1.1])for(const yaw of [-.35,0,.35])for(let k=0;k<2;k++){
   rig.legs[k].rotation.x=angle*.4;rig.knees[k].rotation.x=-angle;rig.feet[k].rotation.set(angle*.6,yaw,0);rig.root.updateMatrixWorld(true);
   const trouser=rig.legs[k].children.find(m=>m.name==='continuous-trouser'),upper=boots.find(m=>m.parent===rig.knees[k]),p=trouser.geometry.attributes.position,posed=posedWorkerMesh(upper),material=new T.MeshBasicMaterial({side:T.DoubleSide});posed.material=material;
   try{for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)+.602)<1e-5){const local=new T.Vector3().fromBufferAttribute(p,i),point=B2.WorkerJoint.point(local,rig.knees[k].quaternion,-.38,.19).applyMatrix4(trouser.matrixWorld),radial=new T.Vector3(local.x,0,local.z);if(radial.length()<.001)radial.set(0,0,1);radial.normalize().applyQuaternion(rig.knees[k].getWorldQuaternion(new T.Quaternion()));const hit=new T.Raycaster(point,radial).intersectObject(posed)[0];assert.ok(hit&&hit.distance<.105,JSON.stringify({angle,yaw,k,i,distance:hit?.distance}));hemIntersections++;}}finally{posed.geometry.dispose();material.dispose();}
  }
 });
 test('2400 actual walking and sprinting frames preserve every released motion anchor and positive boot deformation',()=>{
  B2.buildMinerArt=released;const a=v.makeMiner('released-boots',2,'Before');B2.buildMinerArt=current;const b=v.makeMiner('current-boots',2,'After');const bBoots=b.bodyMeshes.filter(m=>m.userData.workerBoot),floor=v.minerFloor;v.minerFloor=()=>0;
  try{for(const speed of [.5,1.5,3,6])for(const [dx,dz]of [[0,-1],[0,1],[1,0],[-1,0]]){a.gait=b.gait=null;a.root.position.set(0,.012,12);b.root.position.copy(a.root.position);const target={x:0,y:.012,z:12,grounded:true,pitch:0,yaw:0};
   for(let k=0;k<150;k++){target.x+=dx*speed/60;target.z+=dz*speed/60;for(const m of [a,b]){m.root.position.set(target.x,target.y,target.z);v.poseMinerTravel(m,target,g.world,1/60,true);m.root.updateMatrixWorld(true);}
    for(const prop of ['root','torso','head','legs','knees','feet','arms','elbows']){const aa=Array.isArray(a[prop])?a[prop]:[a[prop]],bb=Array.isArray(b[prop])?b[prop]:[b[prop]];for(let j=0;j<aa.length;j++)for(const key of ['position','quaternion','scale'])assert.deepEqual(aa[j][key].toArray(),bb[j][key].toArray());}
    for(const mesh of bBoots){const {joint,pivot,span,weightPivot}=mesh.userData.workerJoint,q=joint.quaternion,p=mesh.geometry.attributes.position,sign=q.w<0?-1:1;
     for(let j=0;j<p.count;j++){const t=B2.clamp((p.getY(j)-weightPivot+span)/(2*span),0,1),w=1-t*t*(3-2*t),dw=-3*t*(1-t)/span,rx=q.x*sign*w,ry=q.y*sign*w,rz=q.z*sign*w,rw=1+w*(q.w*sign-1),den=rx*rx+ry*ry+rz*rz+rw*rw,determinant=1+(2*q.z*sign*dw*p.getX(j)-2*q.x*sign*dw*p.getZ(j))/den;minimumDeterminant=Math.min(minimumDeterminant,determinant);assert.ok(determinant>.02,'Boot deformation locally inverted');const point=new T.Vector3().fromBufferAttribute(p,j),posed=B2.WorkerJoint.point(point,q,pivot,span,new T.Vector3(),weightPivot);assert.ok(mesh.geometry.boundingSphere.containsPoint(posed));}
    }frames++;
   }
  }}finally{v.minerFloor=floor;B2.buildMinerArt=current;}
 });
 test('surface and both shadow passes use the live ankle with an independent weight section; previous joints remain numerically exact',()=>{
  for(const mesh of boots)for(const [material,kind]of [[mesh.material,'standard'],[mesh.customDepthMaterial,'depth'],[mesh.customDistanceMaterial,'distanceRGBA']]){const shader={vertexShader:T.ShaderLib[kind].vertexShader,fragmentShader:T.ShaderLib[kind].fragmentShader,uniforms:{}};material.onBeforeCompile(shader);assert.equal(shader.uniforms.workerJointQuaternion.value,mesh.userData.workerJoint.joint.quaternion);assert.deepEqual(shader.uniforms.workerJointSection.value.toArray(),[-.5,.106,-.316]);assert.ok(shader.vertexShader.includes('p.y-workerJointSection.z'));assert.ok(shader.vertexShader.includes('attribute vec4 workerInstanceJoint'));}
  for(const pivot of [-.38,-.245])for(const angle of [0,.5,1,2.1])for(let i=0;i<40;i++){const point=new T.Vector3(Math.sin(i)*.1,pivot+(i-20)*.018,Math.cos(i)*.1),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(.8,.2,.5).normalize(),angle);assert.deepEqual(B2.WorkerJoint.point(point,q,pivot,.19).toArray(),oldPoint(point,q,pivot,.19).toArray());}
 });
 test('36 other body pieces and all original materials remain exact; six meshes removed with declared shader and geometry costs',()=>{
  assert.deepEqual(inventory(old),{meshes:48,triangles:28934,bytes:1495764,materials:25,ownedMaterials:45,textures:1});
  assert.deepEqual(inventory(rig),{meshes:42,triangles:30502,bytes:1565988,materials:27,ownedMaterials:51,textures:1});
  const a=meshes(rig).filter(m=>!changed(rig,m)),b=meshes(old).filter(m=>!changed(old,m));assert.equal(a.length,36);assert.equal(b.length,36);
  for(let i=0;i<a.length;i++){assert.deepEqual(a[i].geometry.index?.array,b[i].geometry.index?.array);assert.deepEqual(Object.keys(a[i].geometry.attributes),Object.keys(b[i].geometry.attributes));for(const k of Object.keys(a[i].geometry.attributes))assert.deepEqual(a[i].geometry.attributes[k].array,b[i].geometry.attributes[k].array);assert.equal(rig.materials.indexOf(a[i].material),old.materials.indexOf(b[i].material));assert.deepEqual(a[i].scale.toArray(),b[i].scale.toArray());}
  for(let i=0;i<45;i++)for(const k of ['color','roughness','metalness','transparent','opacity','depthWrite','side','emissive','emissiveIntensity','vertexColors'])assert.deepEqual(rig.materials[i][k],old.materials[i][k]);
 });
 fs.mkdirSync(new URL('out/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('out/miner-boots-math.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks:minerBootChecks,before:inventory(old),after:inventory(rig),unchangedMeshes:36,solid,frames,minimumDeformationDeterminant:minimumDeterminant,hemIntersections,scope:'Actual closed shell, open shaft, production geometry, fixed and rotated anchors, actual gait, all-vertex local deformation, shader variants and preserved full head/collar. Global self-intersection and frame-rate claims are not made.'},null,2));
}finally{shell.dispose();B2.buildMinerArt=current;h.close();}
console.log('COMPLETE '+minerBootChecks+' miner boot checks passed.');
