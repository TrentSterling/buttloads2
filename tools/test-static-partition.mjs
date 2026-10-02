import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),T=THREE,partition=B2.WorkshopShapes.partitionRigid;
export let staticPartitionChecks=0;
const test=(name,fn)=>{fn();staticPartitionChecks++;console.log('PASS static partition: '+name);};
const triangles=mesh=>{const g=mesh.geometry,n=g.index?.count||g.attributes.position.count,names=Object.keys(g.attributes).filter(k=>g.attributes[k].count===g.attributes.position.count).sort(),result=[];for(let i=0;i<n;i+=3){const values=[];for(let j=0;j<3;j++){const id=g.index?g.index.getX(i+j):i+j;for(const key of names){const a=g.attributes[key];values.push(...a.array.subarray(id*a.itemSize,(id+1)*a.itemSize));}}result.push(values.join(','));}return result.sort();};
try{
 test('partitioning preserves every oriented triangle and its UV, normal and color attributes',()=>{
  const root=new T.Group(),material=new T.MeshStandardMaterial({vertexColors:true});
  for(const x of [-20,20]){const geometry=new T.BoxGeometry(2,3,4),colors=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<colors.length;i++)colors[i]=(i%11)/11;geometry.setAttribute('color',new T.BufferAttribute(colors,3));const mesh=new T.Mesh(geometry,material);mesh.position.x=x;root.add(mesh);}
  B2.WorkshopShapes.mergeRigid(root);const mesh=root.children[0],expected=triangles(mesh);const parts=partition(mesh,8);assert.ok(parts.length>1);assert.deepEqual(parts.flatMap(triangles).sort(),expected);
  for(const part of parts){assert.ok(part.geometry.boundingBox&&part.geometry.boundingSphere);for(const a of Object.values(part.geometry.attributes))assert.equal(a.count,part.geometry.attributes.position.count);part.geometry.dispose();}material.dispose();
 });
 test('partition bounds allow behind-camera geometry to be rejected without removing front faces',()=>{
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-1,-1,-8,1,-1,-8,0,1,-8,-1,-1,8,0,1,8,1,-1,8],3));geo.computeVertexNormals();
  const material=new T.MeshStandardMaterial(),mesh=new T.Mesh(geo,material),root=new T.Group();root.add(mesh);geo.computeBoundingSphere();root.updateMatrixWorld(true);
  const camera=new T.PerspectiveCamera(60,1,.1,40);camera.updateMatrixWorld(true);const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));assert.equal(frustum.intersectsObject(mesh),true);
  const parts=partition(mesh,4);root.updateMatrixWorld(true);const visible=parts.filter(m=>frustum.intersectsObject(m));assert.equal(visible.length,1);assert.equal(visible[0].geometry.index.count,3);
  const hit=new T.Raycaster(new T.Vector3(0,0,0),new T.Vector3(0,0,-1)).intersectObjects(parts)[0];assert.ok(hit);assert.equal(hit.point.z,-8);for(const p of parts)p.geometry.dispose();material.dispose();
 });
 test('rigid transforms, material identity and shadow/layer state survive partitioning',()=>{
  const root=new T.Group(),geo=new T.BoxGeometry(20,2,20);geo.clearGroups();const material=new T.MeshStandardMaterial(),mesh=new T.Mesh(geo,material);mesh.position.set(3,2,-7);mesh.rotation.set(.2,.5,.1);mesh.scale.set(1.2,.7,1.3);mesh.castShadow=true;mesh.receiveShadow=false;mesh.renderOrder=3;mesh.layers.set(2);mesh.updateMatrix();mesh.matrixAutoUpdate=false;root.add(mesh);root.updateMatrixWorld(true);const expected=mesh.matrixWorld.toArray(),bounds=new T.Box3().setFromObject(root);
  const parts=partition(mesh,4);root.updateMatrixWorld(true);for(const p of parts){assert.deepEqual(p.matrixWorld.toArray(),expected);assert.equal(p.material,material);assert.equal(p.castShadow,true);assert.equal(p.receiveShadow,false);assert.equal(p.renderOrder,3);assert.equal(p.layers.mask,4);assert.equal(p.matrixAutoUpdate,false);}
  const after=new T.Box3().setFromObject(root);assert.ok(after.min.distanceTo(bounds.min)<1e-8&&after.max.distanceTo(bounds.max)<1e-8);for(const p of parts)p.geometry.dispose();material.dispose();
 });
 test('partial, transparent and articulated meshes are rejected before mutation',()=>{
  for(const mode of ['partial','transparent','child']){const root=new T.Group(),material=new T.MeshStandardMaterial({transparent:mode==='transparent'}),mesh=new T.Mesh(new T.BoxGeometry(),material);root.add(mesh);if(mode==='partial')mesh.geometry.setDrawRange(0,6);if(mode==='child')mesh.add(new T.Group());assert.throws(()=>partition(mesh,2));assert.equal(root.children[0],mesh);assert.equal(root.children.length,1);mesh.geometry.dispose();material.dispose();}
 });
}finally{clearInterval(h.game.net.timer);h.close();}
console.log(`COMPLETE ${staticPartitionChecks} static partition checks passed`);
