import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),T=THREE,current=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('fixtures/miner-art-2.59.0.js',import.meta.url),'utf8'));
const released=B2.buildMinerArt;vm.runInThisContext(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url),'utf8'));
const old=released(h.game.view,2),rig=current(h.game.view,2),face=B2.WorkshopShapes.workerFace(),hair=B2.WorkshopShapes.workerMoustache();
export let minerFaceChecks=0;const test=(name,fn)=>{fn();minerFaceChecks++;console.log('PASS miner face: '+name);};
const meshes=art=>{const a=[];art.root.traverse(n=>{if(n.isMesh)a.push(n);});return a;};
const inventory=art=>{const a=meshes(art);return{meshes:a.length,triangles:a.reduce((s,m)=>s+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),bytes:a.reduce((s,m)=>s+Object.values(m.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(m.geometry.index?.array.byteLength||0),0),materials:new Set(a.map(m=>m.material)).size,ownedMaterials:art.materials.length,textures:art.textures.length};};
const changed=(art,m)=>m.parent===art.head&&[6,7,8].includes(art.materials.indexOf(m.material));
const solidReport=[];
try{
 test('face and tapered moustache are closed outward volumes with complete finite attributes',()=>{
  for(const [name,g]of [['face',face],['moustache',hair]]){
   const p=g.attributes.position,n=g.attributes.normal,ix=g.index,edges=new Map();let volume=0,minimumArea=Infinity,minimumNormalAgreement=Infinity;
   const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(',');
   for(const a of Object.values(g.attributes)){assert.equal(a.count,p.count);assert.ok(a.array.every(Number.isFinite));}
   for(let i=0;i<n.count;i++)assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(n,i).length()-1)<1e-5);
   for(let i=0;i<ix.count;i+=3){
    const ids=[0,1,2].map(k=>ix.getX(i+k)),[a,b,c]=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j)),cross=b.clone().sub(a).cross(c.clone().sub(a));
    minimumArea=Math.min(minimumArea,cross.length());assert.ok(cross.length()>1e-10);volume+=a.dot(b.clone().cross(c))/6;
    const mean=ids.reduce((v,j)=>v.add(new T.Vector3().fromBufferAttribute(n,j)),new T.Vector3()).normalize();minimumNormalAgreement=Math.min(minimumNormalAgreement,mean.dot(cross.clone().normalize()));
    for(let j=0;j<3;j++){const x=key(ids[j]),y=key(ids[(j+1)%3]),id=[x,y].sort().join('|'),e=edges.get(id)||{count:0,direction:0};e.count++;e.direction+=x<y?1:-1;edges.set(id,e);}
   }
   assert.ok(volume>1e-8&&volume<(name==='face'?.025:.0001));assert.ok(minimumNormalAgreement>0);
   assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0));solidReport.push({name,volume,minimumArea,minimumNormalAgreement,triangles:ix.count/3});
  }
 });
 test('the nose and mouth belong to the same skin solid, with forward relief and no detached nostril pieces',()=>{
  const m=new T.Mesh(face,new T.MeshBasicMaterial());m.updateMatrixWorld(true);
  const front=(x,y)=>{const hit=new T.Raycaster(new T.Vector3(x,y,-.5),new T.Vector3(0,0,1)).intersectObject(m)[0];assert.ok(hit);return hit.point.z;};
  const nose=front(0,-.037),cheek=front(.075,-.037);assert.ok(cheek-nose>.030&&cheek-nose<.090);
  const lowerLip=front(0,-.097),mouth=front(0,-.090);assert.ok(lowerLip<mouth);
  assert.equal(rig.head.children.filter(n=>n.isMesh&&n.material===rig.materials[7]).reduce((s,n)=>s+n.geometry.index.count/3,0),504,'inner-detail mesh must retain ears only');
  m.material.dispose();
 });
 test('every tapered moustache section intersects the actual rendered skin rather than floating in front of it',()=>{
  const m=new T.Mesh(face,new T.MeshBasicMaterial({side:T.DoubleSide}));m.updateMatrixWorld(true);const p=hair.attributes.position;
  for(let row=0;row<19;row++){
   const point=new T.Vector3().fromBufferAttribute(p,row*11+5),hits=new T.Raycaster(point,new T.Vector3(.031,.017,1).normalize()).intersectObject(m).map(h=>h.distance),unique=hits.filter((d,i)=>!i||Math.abs(d-hits[i-1])>1e-7);
   assert.equal(unique.length%2,1,'moustache section '+row+' is outside actual skin');
  }
  m.material.dispose();
 });
 test('the added face detail retains body mesh, material and texture counts with declared geometry costs',()=>{
  assert.deepEqual(inventory(old),{meshes:48,triangles:26512,bytes:1438384,materials:25,ownedMaterials:45,textures:1});
  assert.deepEqual(inventory(rig),{meshes:48,triangles:28572,bytes:1504088,materials:25,ownedMaterials:45,textures:1});
  assert.equal(rig.materials[6].vertexColors,true);assert.equal(old.materials[6].vertexColors,false);
  for(const p of ['head','torso','arms','elbows','legs','knees','feet']){
   const a=Array.isArray(rig[p])?rig[p]:[rig[p]],b=Array.isArray(old[p])?old[p]:[old[p]];
   for(let i=0;i<a.length;i++)for(const k of ['position','quaternion','scale'])assert.deepEqual(a[i][k].toArray(),b[i][k].toArray());
  }
 });
 test('all 45 other body meshes, including helmet and goggles, retain exact released geometry and material boundaries',()=>{
  const a=meshes(rig).filter(m=>!changed(rig,m)),b=meshes(old).filter(m=>!changed(old,m));assert.equal(a.length,45);assert.equal(b.length,45);
  for(let i=0;i<a.length;i++){
   assert.deepEqual(a[i].geometry.index?.array,b[i].geometry.index?.array);assert.deepEqual(Object.keys(a[i].geometry.attributes),Object.keys(b[i].geometry.attributes));
   for(const k of Object.keys(a[i].geometry.attributes))assert.deepEqual(a[i].geometry.attributes[k].array,b[i].geometry.attributes[k].array);
   assert.equal(rig.materials.indexOf(a[i].material),old.materials.indexOf(b[i].material));
   for(const k of ['position','quaternion','scale'])assert.deepEqual(a[i][k].toArray(),b[i][k].toArray());
   for(const k of ['castShadow','receiveShadow','layers','renderOrder','visible','matrixAutoUpdate'])assert.deepEqual(a[i][k],b[i][k]);
  }
  for(let i=0;i<15;i++)for(const k of ['color','roughness','metalness','transparent','opacity','depthWrite','side','emissive','emissiveIntensity'])assert.deepEqual(rig.materials[i][k],old.materials[i][k]);
 });
 test('integrated hair, stubble and recessed detail have bounded colour attributes while merged ear colours stay white',()=>{
  const c=face.attributes.color;assert.ok(c.array.every(v=>v>=0&&v<=1));assert.ok(c.array.some(v=>v<.2));assert.ok(c.array.some(v=>v>.9));
  const skin=rig.head.children.find(n=>n.material===rig.materials[6]),colors=skin.geometry.attributes.color;assert.ok(colors&&colors.count===skin.geometry.attributes.position.count);
  assert.ok(colors.array.slice(face.attributes.position.count*3).every(v=>v===1),'merged ear volumes must retain the original skin colour');
 });
 fs.mkdirSync(new URL('out/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('out/miner-face-math.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks:minerFaceChecks,before:inventory(old),after:inventory(rig),unchangedMeshes:45,solids:solidReport,moustacheSectionsIntersectSkin:19,scope:'Actual indexed geometry topology, volumes, surface ray intersections, attachments, conservation and declared resources. Visual acceptance remains separate.'},null,2));
}finally{face.dispose();hair.dispose();h.close();}
console.log('COMPLETE '+minerFaceChecks+' miner face checks passed (continuous skin, real attachments, topology and costs; visual verdict separate).');
