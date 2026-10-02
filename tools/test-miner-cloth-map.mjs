// Construction and batching regression coverage. Visual acceptance is separate.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
import {unchangedWorkerMeshes} from './miner-joint-test-helper.mjs';
const canvasFactory=(width,height)=>{
 const canvas={width,height},ctx=new Proxy({measureText(s){return{width:String(s).length*8};},createLinearGradient(){return{addColorStop(){}};},createImageData(w,h){return{width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},putImageData(image){canvas.pixels=image.data;}},{get:(t,k)=>k in t?t[k]:()=>{}});canvas.getContext=()=>ctx;return canvas;
};
const h=await nodeGame({canvasFactory}),current=B2.buildMinerArt,T=THREE;
vm.runInThisContext(fs.readFileSync(new URL('fixtures/miner-art-2.56.0.js',import.meta.url),'utf8'));
const baseline=B2.buildMinerArt;
vm.runInThisContext(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url),'utf8'));
const old=baseline(h.game.view,2),rigs=Array.from({length:8},(_,color)=>current(h.game.view,color)),rig=rigs[2];
const meshes=art=>{const list=[];art.root.traverse(n=>{if(n.isMesh)list.push(n);});return list;};
const before=meshes(old),after=meshes(rig),all=rigs.map(meshes),fabric=new Set(rig.materials.slice(0,3));
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
export let minerClothMapChecks=0;
const test=(name,fn)=>{fn();minerClothMapChecks++;console.log('PASS miner cloth map: '+name);};
try{
 test('untouched body positions, normals, triangle indices and transforms retain the released construction; continuous joints are checked separately',()=>{
  const aa=unchangedWorkerMeshes(rig),bb=unchangedWorkerMeshes(old);assert.equal(aa.length,38);assert.equal(aa.length,bb.length);
  for(let i=0;i<aa.length;i++){
   const a=aa[i],b=bb[i];assert.deepEqual(a.geometry.index?.array,b.geometry.index?.array);
   assert.deepEqual(a.geometry.attributes.position.array,b.geometry.attributes.position.array);assert.deepEqual(a.geometry.attributes.normal.array,b.geometry.attributes.normal.array);
   for(const key of ['position','quaternion','scale'])assert.deepEqual(a[key].toArray(),b[key].toArray());
   for(const key of ['castShadow','receiveShadow','layers','renderOrder','visible','matrixAutoUpdate'])assert.deepEqual(a[key],b[key]);
   if(!fabric.has(a.material))assert.deepEqual(a.geometry.attributes.uv.array,b.geometry.attributes.uv.array);
  }
  for(const key of ['legs','knees','feet','arms','elbows'])for(let i=0;i<2;i++)assert.deepEqual(rig[key][i].position.toArray(),old[key][i].position.toArray());
 });
 test('cloth remapping changes actual fabric coordinates while retaining finite complete attributes',()=>{
  let changed=0;
  const aa=unchangedWorkerMeshes(rig),bb=unchangedWorkerMeshes(old);
  for(let i=0;i<aa.length;i++){
   const a=aa[i].geometry;assert.deepEqual(Object.keys(a.attributes),Object.keys(bb[i].geometry.attributes));
   for(const attribute of Object.values(a.attributes))assert.ok(attribute.array.every(Number.isFinite));
   if(fabric.has(aa[i].material)){
    const uv=a.attributes.uv;assert.ok(uv.array.every(v=>v>=0&&v<=1));assert.equal(uv.count,a.attributes.position.count);
    if(!equal(uv.array,bb[i].geometry.attributes.uv.array))changed++;
   }
  }
  assert.equal(changed,aa.filter(n=>fabric.has(n.material)).length);
 });
 test('continuous body asset budget and owned cloth texture allocation retain their declared limits',()=>{
  const inventory=nodes=>({meshes:nodes.length,triangles:nodes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),bytes:nodes.reduce((n,m)=>n+Object.values(m.geometry.attributes).reduce((s,a)=>s+a.array.byteLength,0)+(m.geometry.index?.array.byteLength||0),0),materials:new Set(nodes.map(n=>n.material)).size});
  assert.deepEqual(inventory(after),{meshes:48,triangles:26224,bytes:1431792,materials:25});assert.deepEqual(inventory(before),{meshes:52,triangles:27168,bytes:1457744,materials:15});assert.equal(rig.textures.length,1);
  assert.equal(rig.textures[0].image.width,old.textures[0].image.width);assert.equal(rig.textures[0].image.height,old.textures[0].image.height);
  assert.equal(new Set(rigs.map(r=>r.textures[0])).size,8,'each rig must retain its independently disposable texture');
  assert.equal(new Set(rigs.map(r=>r.textures[0].image)).size,1,'atlas pixels are built once for the shared deterministic artwork');
 });
 test('all same-material slots across eight crew colours retain identical batch geometry and texture pixels',()=>{
  let pairs=0;
  for(let slot=0;slot<after.length;slot++)for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
   const a=all[i][slot],b=all[j][slot];if(!a.material.color.equals(b.material.color))continue;pairs++;
   assert.ok(equal(a.geometry.index?.array||[],b.geometry.index?.array||[]));
   for(const key of Object.keys(a.geometry.attributes))assert.ok(equal(a.geometry.attributes[key].array,b.geometry.attributes[key].array),'shared batch differs at slot '+slot+', colours '+i+'/'+j+', '+key);
   if(a.material.map)assert.deepEqual(a.material.map.image.pixels,b.material.map.image.pixels);
  }
  assert.equal(pairs,1260);
 });
 test('the actual generated atlas covers every texel and preserves opaque cloth material boundaries',()=>{
  const pixels=rig.textures[0].image.pixels;assert.equal(pixels.length,256*256*4);
  for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],255);
  assert.ok(pixels.some((v,i)=>i%4!==3&&v<150));assert.ok(pixels.some((v,i)=>i%4!==3&&v>195));
  for(let i=0;i<15;i++)for(const key of ['color','roughness','metalness','transparent','opacity','depthWrite','side','emissive','emissiveIntensity'])assert.deepEqual(rig.materials[i][key],old.materials[i][key]);
 });
}finally{
 for(const art of [old,...rigs]){for(const mesh of meshes(art))mesh.geometry.dispose();for(const material of art.materials)material.dispose();for(const texture of art.textures)texture.dispose();}
 clearInterval(h.game.net.timer);h.close();
}
console.log(`COMPLETE ${minerClothMapChecks} miner cloth map checks passed (asset conservation and batch compatibility; visual verdict separate)`);
