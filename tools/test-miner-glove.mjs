import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),T=THREE,current=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('fixtures/miner-art-2.50.0.js',import.meta.url),'utf8'));
const released=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url),'utf8'));
const old=released(h.game.view,1),rig=current(h.game.view,1);
export let minerGloveChecks=0;
const test=(name,fn)=>{fn();minerGloveChecks++;console.log('PASS miner glove: '+name);};
const meshes=root=>{const a=[];root.traverse(n=>{if(n.isMesh)a.push(n);});return a;};
const isGlove=(art,m)=>art.elbows.includes(m.parent)&&[art.materials[3],art.materials[5]].includes(m.material);
const solids=g=>[g.palm,...g.fingers,g.thumb,g.back,g.cuff,...g.pads];
const inside=(geometry,point)=>{
 const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({side:T.DoubleSide}));mesh.updateMatrixWorld(true);
 const ray=new T.Raycaster(point,new T.Vector3(.913,.271,.304).normalize()),hits=ray.intersectObject(mesh).map(h=>h.distance),unique=hits.filter((d,i)=>!i||Math.abs(d-hits[i-1])>1e-7);
 mesh.material.dispose();return unique.length%2===1;
};
const attached=(a,b)=>{const p=a.attributes.position;for(let i=0;i<p.count;i++)if(inside(b,new T.Vector3().fromBufferAttribute(p,i)))return true;return false;};
try{
 test('both gloves contain closed, outward solids with finite surface normals',()=>{
  for(const side of [-1,1])for(const geo of solids(B2.WorkshopShapes.workerGlove(side))){
   const p=geo.attributes.position,normals=geo.attributes.normal,edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');let volume=0;
   for(let i=0;i<geo.index.count;i+=3){const ids=[0,1,2].map(k=>geo.index.getX(i+k)),[a,b,c]=ids.map(n=>new T.Vector3().fromBufferAttribute(p,n));assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-10,'collapsed glove triangle');volume+=a.dot(b.clone().cross(c))/6;for(const [x,y]of [[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]]){const edge=[key(x),key(y)].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}}
   assert.ok(volume>1e-8&&volume<.002,'inverted or implausible glove solid');assert.ok([...edges.values()].every(n=>n===2),'open or non-manifold glove');
   for(let i=0;i<normals.count;i++)assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(normals,i).length()-1)<1e-5,'invalid normal');geo.dispose();
  }
 });
 test('digits, back reinforcement and knuckle pads physically intersect the glove they belong to',()=>{
  for(const side of [-1,1]){const g=B2.WorkshopShapes.workerGlove(side);for(const digit of [...g.fingers,g.thumb])assert.ok(attached(digit,g.palm),'detached digit');assert.ok(attached(g.back,g.palm),'floating back pad');for(let i=0;i<4;i++)assert.ok(attached(g.pads[i],g.fingers[i]),'floating knuckle pad');assert.ok(attached(g.palm,g.cuff)||attached(g.cuff,g.palm),'detached wrist cuff');solids(g).forEach(g=>g.dispose());}
 });
 test('curled fingers leave a handle cavity, while each fingertip returns toward the palm',()=>{
  for(const side of [-1,1]){const g=B2.WorkshopShapes.workerGlove(side),material=new T.MeshBasicMaterial({side:T.DoubleSide}),digits=g.fingers.map(geo=>new T.Mesh(geo,material));digits.forEach(m=>m.updateMatrixWorld(true));
   const ray=new T.Raycaster(new T.Vector3(-.12,-.302,-.015),new T.Vector3(1,0,0));assert.equal(ray.intersectObjects(digits).length,0,'solid fingers fill the handle cavity');
   ray.set(new T.Vector3(-.12,-.322,-.017),new T.Vector3(1,0,0));assert.ok(ray.intersectObjects(digits).length>=4,'curl has no lower finger surface');
   for(const geo of g.fingers){geo.computeBoundingBox();assert.ok(geo.boundingBox.max.z-geo.boundingBox.min.z>.05,'straight oval finger');}
   material.dispose();solids(g).forEach(g=>g.dispose());
  }
 });
 test('glove reconstruction retains other body shapes, non-cloth UVs, rig transforms, materials and asset counts; cloth mapping is checked separately',()=>{
  const a=meshes(rig.root),b=meshes(old.root);assert.equal(a.length,b.length);assert.equal(a.length,52);assert.equal(new Set(a.map(m=>m.material)).size,15);assert.equal(rig.textures.length,old.textures.length);
  const other=art=>meshes(art.root).filter(m=>!isGlove(art,m)),aa=other(rig),bb=other(old);assert.equal(aa.length,48);assert.equal(aa.length,bb.length);
  for(let j=0;j<aa.length;j++){const x=aa[j],y=bb[j];assert.deepEqual(x.geometry.index?.array,y.geometry.index?.array);assert.deepEqual(Object.keys(x.geometry.attributes),Object.keys(y.geometry.attributes));for(const n of Object.keys(x.geometry.attributes)){if(n==='uv'&&rig.materials.indexOf(x.material)<3)continue;assert.deepEqual(x.geometry.attributes[n].array,y.geometry.attributes[n].array);}assert.deepEqual(x.position.toArray(),y.position.toArray());assert.deepEqual(x.rotation.toArray(),y.rotation.toArray());assert.equal(rig.materials.indexOf(x.material),old.materials.indexOf(y.material));for(const p of ['castShadow','receiveShadow','frustumCulled','renderOrder'])assert.equal(x[p],y[p]);}
  for(const prop of ['legs','knees','feet','arms','elbows'])for(let i=0;i<2;i++){assert.deepEqual(rig[prop][i].position.toArray(),old[prop][i].position.toArray());assert.deepEqual(rig[prop][i].rotation.toArray(),old[prop][i].rotation.toArray());}
  for(let i=0;i<rig.materials.length;i++)for(const prop of ['color','roughness','metalness','transparent','opacity','side','depthWrite'])assert.deepEqual(rig.materials[i][prop],old.materials[i][prop]);
  const triangleCount=art=>meshes(art.root).reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);assert.ok(triangleCount(rig)<triangleCount(old),'glove reconstruction exceeds the released triangle budget');
 });
}finally{clearInterval(h.game.net.timer);h.close();}
console.log(`COMPLETE ${minerGloveChecks} miner glove checks passed (solid geometry, physical attachments, handle cavity and body conservation; visual verdict separate)`);
