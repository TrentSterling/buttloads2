// Complete oriented attribute preservation, including seams and wide indices.
// No DOM, browser, renderer or production game mutation.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),T=require('../vendor/three.min.js');
const context={THREE:T,B2:{COMMON:{},View:class{}},Float32Array,Uint32Array};
vm.runInNewContext(fs.readFileSync(new URL('../src/common-view.js',import.meta.url),'utf8'),context);
const index=context.B2.CANOPY_ART.index;
export let canopyIndexChecks=0;
function test(name,fn){fn();canopyIndexChecks++;console.log('PASS canopy indexing: '+name);}
function exactExpanded(source,result){
 assert.equal(result.index.count,source.attributes.position.count);
 assert.deepEqual(Object.keys(result.attributes),Object.keys(source.attributes));
 for(const [name,a]of Object.entries(source.attributes)){
  const b=result.attributes[name],bitsA=new Uint32Array(a.array.buffer,a.array.byteOffset,a.array.length),bitsB=new Uint32Array(b.array.buffer,b.array.byteOffset,b.array.length);
  assert.equal(a.itemSize,b.itemSize);assert.equal(a.normalized,b.normalized);assert.equal(a.usage,b.usage);
  for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++)assert.equal(bitsA[i*a.itemSize+j],bitsB[result.index.getX(i)*a.itemSize+j],name+' oriented record '+i);
 }
}
test('every oriented record remains bit exact while UV, normal and signed-zero seams stay split',()=>{
 const g=new T.PlaneGeometry(2,3,2,2).toNonIndexed(),weight=new Float32Array(g.attributes.position.count);
 g.setAttribute('windWeight',new T.BufferAttribute(weight,1).setUsage(T.DynamicDrawUsage));
 const plain=index(g);exactExpanded(g,plain);assert.equal(plain.attributes.position.count,9);
 const first=1,duplicate=[];for(let i=2;i<g.attributes.position.count;i++)if(g.attributes.position.getX(i)===g.attributes.position.getX(first)&&g.attributes.position.getY(i)===g.attributes.position.getY(first))duplicate.push(i);
 assert.ok(duplicate.length);const at=duplicate[0];weight[at]=-0;
 const signed=index(g);exactExpanded(g,signed);assert.notEqual(signed.index.getX(first),signed.index.getX(at));
 g.attributes.normal.setXYZ(at,0,0,-1);g.attributes.uv.setXY(at,.3125,.625);
 const seams=index(g);exactExpanded(g,seams);assert.notEqual(seams.index.getX(first),seams.index.getX(at));
 const ray=new T.Raycaster(new T.Vector3(.27,.19,2),new T.Vector3(0,0,-1));assert.deepEqual(ray.intersectObject(new T.Mesh(plain,new T.MeshBasicMaterial()))[0].point.toArray(),[.27,.19,0]);
 for(const geo of [g,plain,signed,seams])geo.dispose();
});
test('more than 65535 distinct records use complete wide indices without wrapping or dropping triangles',()=>{
 const unique=70002,positions=new Float32Array(unique*2*3),uv=new Float32Array(unique*2*2);
 for(let pass=0;pass<2;pass++)for(let i=0;i<unique;i++){const at=pass*unique+i;positions.set([Math.floor(i/3)*.001,i%3===1?1:0,i%3===2?.001:0],at*3);uv.set([i%3/2,i/unique],at*2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));const result=index(g);
 exactExpanded(g,result);assert.equal(result.attributes.position.count,unique);assert.ok(result.index.array instanceof Uint32Array);assert.equal(result.index.getX(unique-1),unique-1);assert.equal(result.index.getX(unique*2-1),unique-1);g.dispose();result.dispose();
});
test('partial, grouped, indexed, interleaved, misaligned and nonfinite inputs fail before mutating their buffers',()=>{
 for(const mode of ['partial','grouped','indexed','interleaved','misaligned','nonfinite']){
  const g=new T.PlaneGeometry().toNonIndexed();
  if(mode==='partial')g.setDrawRange(0,3);if(mode==='grouped')g.addGroup(0,3,0);if(mode==='indexed')g.setIndex([0,1,2]);
  if(mode==='interleaved')g.setAttribute('uv',new T.InterleavedBufferAttribute(new T.InterleavedBuffer(new Float32Array(24),4),2,0));
  if(mode==='misaligned')g.setAttribute('uv',new T.BufferAttribute(new Float32Array(2),2));if(mode==='nonfinite')g.attributes.position.setX(0,NaN);
  const refs=Object.values(g.attributes).map(a=>a.array||a.data.array),oldIndex=g.index;assert.throws(()=>index(g),/Canopy indexing requires/);assert.equal(g.index,oldIndex);assert.deepEqual(Object.values(g.attributes).map(a=>a.array||a.data.array),refs);g.dispose();
 }
});
console.log('COMPLETE '+canopyIndexChecks+' canopy indexing checks passed');
