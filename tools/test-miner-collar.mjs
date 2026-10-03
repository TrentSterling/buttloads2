import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),T=THREE,current=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('fixtures/miner-art-2.60.0.js',import.meta.url),'utf8'));
const released=B2.buildMinerArt;vm.runInThisContext(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url),'utf8'));
const old=released(h.game.view,2),rig=current(h.game.view,2),collar=B2.WorkshopShapes.workerCollar(),shirt=B2.WorkshopShapes.workerShirt();
export let minerCollarChecks=0;const test=(name,fn)=>{fn();minerCollarChecks++;console.log('PASS miner collar: '+name);};
const meshes=art=>{const a=[];art.root.traverse(n=>{if(n.isMesh)a.push(n);});return a;};
const inventory=art=>{const a=meshes(art);return{meshes:a.length,triangles:a.reduce((s,m)=>s+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),bytes:a.reduce((s,m)=>s+Object.values(m.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(m.geometry.index?.array.byteLength||0),0),materials:new Set(a.map(m=>m.material)).size,ownedMaterials:art.materials.length,textures:art.textures.length};};
const changed=(art,m)=>m.parent===art.torso&&[0,2].includes(art.materials.indexOf(m.material))||art.feet.includes(m.parent)||m.userData.workerBoot||m.name==='continuous-trouser';
let solid,attached=0;
try{
 test('folded collar is one closed outward shell with finite attributes and complete directed edges',()=>{
  const p=collar.attributes.position,n=collar.attributes.normal,ix=collar.index,edges=new Map(),adjacency=new Map();let volume=0,minimumArea=Infinity,minimumNormalAgreement=Infinity;
  const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(',');
  for(const a of Object.values(collar.attributes)){assert.equal(a.count,p.count);assert.ok(a.array.every(Number.isFinite));}
  for(let i=0;i<n.count;i++)assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(n,i).length()-1)<1e-5);
  for(let i=0;i<ix.count;i+=3){
   const ids=[0,1,2].map(k=>ix.getX(i+k)),[a,b,c]=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j)),cross=b.clone().sub(a).cross(c.clone().sub(a));
   minimumArea=Math.min(minimumArea,cross.length());assert.ok(cross.length()>1e-10);volume+=a.dot(b.clone().cross(c))/6;
   const mean=ids.reduce((v,j)=>v.add(new T.Vector3().fromBufferAttribute(n,j)),new T.Vector3()).normalize();minimumNormalAgreement=Math.min(minimumNormalAgreement,mean.dot(cross.clone().normalize()));
   for(let j=0;j<3;j++){const x=key(ids[j]),y=key(ids[(j+1)%3]),id=[x,y].sort().join('|'),e=edges.get(id)||{count:0,direction:0};e.count++;e.direction+=x<y?1:-1;edges.set(id,e);if(!adjacency.has(x))adjacency.set(x,new Set());adjacency.get(x).add(y);}
  }
  assert.ok(volume>1e-5&&volume<.001);assert.ok(minimumNormalAgreement>0);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0));
  const visited=new Set(),pending=[adjacency.keys().next().value];while(pending.length){const k=pending.pop();if(visited.has(k))continue;visited.add(k);pending.push(...adjacency.get(k));}assert.equal(visited.size,adjacency.size);
  solid={volume,minimumArea,minimumNormalAgreement,triangles:ix.count/3,connectedComponents:1};
 });
 test('collar has a hollow neck and an open front instead of a solid neck cap or tie',()=>{
  const m=new T.Mesh(collar,new T.MeshBasicMaterial({side:T.DoubleSide}));m.updateMatrixWorld(true);
  assert.equal(new T.Raycaster(new T.Vector3(0,1.6,0),new T.Vector3(0,-1,0)).intersectObject(m).length,0);
  assert.equal(new T.Raycaster(new T.Vector3(0,1.4,-.5),new T.Vector3(0,0,1),0,.5).intersectObject(m).length,0);
  assert.ok(new T.Raycaster(new T.Vector3(0,1.4,.5),new T.Vector3(0,0,-1),0,.5).intersectObject(m).length>0);m.material.dispose();
 });
 test('all 33 neck-band anchors intersect the actual upper shirt used in the merged production mesh',()=>{
  const actual=rig.torso.children.find(m=>m.isMesh&&m.material===rig.materials[2]),p=shirt.attributes.position;
  assert.deepEqual(actual.geometry.attributes.position.array.slice(0,p.array.length),p.array);
  const offset=p.count*3;assert.deepEqual(actual.geometry.attributes.position.array.slice(offset,offset+collar.attributes.position.array.length),collar.attributes.position.array);
  const m=new T.Mesh(shirt,new T.MeshBasicMaterial({side:T.DoubleSide}));m.updateMatrixWorld(true);
  for(let i=0;i<33;i++){const point=new T.Vector3().fromBufferAttribute(collar.attributes.position,i),hits=new T.Raycaster(point,new T.Vector3(.031,.017,1).normalize()).intersectObject(m).map(h=>h.distance),unique=hits.filter((d,j)=>!j||Math.abs(d-hits[j-1])>1e-7);assert.equal(unique.length%2,1,'neck anchor '+i+' outside actual shirt');attached++;}m.material.dispose();
 });
 test('current body declares cumulative resources and preserves released shirt bone anchors',()=>{
  assert.deepEqual(inventory(old),{meshes:48,triangles:28572,bytes:1504088,materials:25,ownedMaterials:45,textures:1});
  assert.deepEqual(inventory(rig),{meshes:44,triangles:30518,bytes:1565348,materials:27,ownedMaterials:51,textures:1});
  for(const prop of ['head','torso','arms','elbows','legs','knees','feet']){const a=Array.isArray(rig[prop])?rig[prop]:[rig[prop]],b=Array.isArray(old[prop])?old[prop]:[old[prop]];for(let i=0;i<a.length;i++)for(const k of ['position','quaternion','scale'])assert.deepEqual(a[i][k].toArray(),b[i][k].toArray());}
 });
 test('all 34 other body meshes preserve exact geometry, including the complete improved face and helmet',()=>{
  const a=meshes(rig).filter(m=>!changed(rig,m)),b=meshes(old).filter(m=>!changed(old,m));assert.equal(a.length,34);assert.equal(b.length,34);
  for(let i=0;i<a.length;i++){assert.deepEqual(a[i].geometry.index?.array,b[i].geometry.index?.array);assert.deepEqual(Object.keys(a[i].geometry.attributes),Object.keys(b[i].geometry.attributes));for(const k of Object.keys(a[i].geometry.attributes))assert.deepEqual(a[i].geometry.attributes[k].array,b[i].geometry.attributes[k].array);assert.equal(rig.materials.indexOf(a[i].material),old.materials.indexOf(b[i].material));for(const k of ['position','quaternion','scale'])assert.deepEqual(a[i][k].toArray(),b[i][k].toArray());for(const k of ['castShadow','receiveShadow','layers','renderOrder','visible','matrixAutoUpdate'])assert.deepEqual(a[i][k],b[i][k]);}
  for(let i=0;i<15;i++)for(const k of ['color','roughness','metalness','transparent','opacity','depthWrite','side','emissive','emissiveIntensity','vertexColors'])assert.deepEqual(rig.materials[i][k],old.materials[i][k]);
 });
 fs.mkdirSync(new URL('out/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('out/miner-collar-math.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks:minerCollarChecks,before:inventory(old),after:inventory(rig),unchangedMeshes:34,solid,neckAnchorsIntersectActualShirt:attached,scope:'Actual topology, hollow opening, merged production geometry, surface intersections, resource inventory and conservation. Visual acceptance separate; no global self-intersection claim.'},null,2));
}finally{collar.dispose();shirt.dispose();h.close();}
console.log('COMPLETE '+minerCollarChecks+' miner collar checks passed.');
