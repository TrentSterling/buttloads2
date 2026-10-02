import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),T=THREE,merge=B2.WorkshopShapes.mergeRigid;
export let rigidMergeChecks=0;
const test=(name,fn)=>{fn();rigidMergeChecks++;console.log('PASS rigid merge: '+name);};
try{
 test('nested transformed triangles, normals, UVs and colors survive indexed merging',()=>{
  const root=new T.Group();root.position.set(4,2,-7);root.rotation.set(.1,.6,-.2);root.scale.set(1.2,.8,.9);
  const mat=new T.MeshStandardMaterial({vertexColors:true}),original=[];
  for(let j=0;j<3;j++){
   const child=new T.Group();child.position.set(j*.4,j*.2,-j*.1);child.rotation.set(.2*j,-.3*j,.1);root.add(child);
   const geo=new T.BoxGeometry(.2,.4,.3),colors=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<colors.length;i++)colors[i]=((i+j)%7)/7;geo.setAttribute('color',new T.BufferAttribute(colors,3));
   const m=new T.Mesh(geo,mat);m.rotation.set(-.2,.1,.25);m.scale.set(.9,1.1,1);m.position.set(.1,.3,.2);child.add(m);original.push(m);
  }
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),expected=original.map(m=>m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld)));
  merge(root,new Set(),true);const meshes=[];root.traverse(m=>{if(m.isMesh)meshes.push(m);});assert.equal(meshes.length,1);const geo=meshes[0].geometry;
  assert.ok(geo.index);assert.equal(geo.index.count,expected.reduce((n,g)=>n+g.index.count,0));assert.equal(geo.attributes.position.count,expected.reduce((n,g)=>n+g.attributes.position.count,0));
  for(const key of ['position','normal','uv','color']){let at=0;for(const g of expected)for(const value of g.attributes[key].array)assert.ok(Math.abs(geo.attributes[key].array[at++]-value)<1e-6,key);assert.equal(at,geo.attributes[key].array.length);}
  let indexAt=0,offset=0;for(const g of expected){for(const i of g.index.array)assert.equal(geo.index.array[indexAt++],offset+i);offset+=g.attributes.position.count;g.dispose();}
  assert.ok(geo.boundingBox&&geo.boundingSphere);assert.ok(geo.boundingSphere.radius>0);
 });
 test('excluded animated meshes and groups keep identity, transforms and visibility',()=>{
  const root=new T.Group(),mat=new T.MeshStandardMaterial(),dynamic=new T.Mesh(new T.BoxGeometry(),mat),branch=new T.Group();root.add(dynamic,branch);const lamp=new T.Mesh(new T.BoxGeometry(),mat);branch.add(lamp);
  for(let i=0;i<2;i++){const m=new T.Mesh(new T.BoxGeometry(),mat);m.position.x=i*2;root.add(m);}
  merge(root,new Set([dynamic,branch]),true);assert.equal(dynamic.parent,root);assert.equal(lamp.parent,branch);assert.equal(dynamic.matrixAutoUpdate,true);
  dynamic.rotation.z=.6;branch.visible=false;root.updateWorldMatrix(true,true);assert.ok(Math.abs(dynamic.matrix.elements[1]-Math.sin(.6))<1e-6);assert.equal(branch.visible,false);
  const v=h.game.view;for(const node of [...v.fossilPlates,v.fossilEmber,...v.keeperLanterns])assert.ok(node.parent);
  for(const m of v.workshopCoils){assert.equal(m.core.parent,m.coil);assert.equal(m.core.matrixAutoUpdate,true);}
  assert.equal(v.parcelCap.parent,v.parcelScene);
 });
 test('shadow, layer, transparency and draw-range boundaries retain separate meshes',()=>{
  const root=new T.Group(),mat=new T.MeshStandardMaterial(),a=new T.Mesh(new T.BoxGeometry(),mat),b=a.clone(),c=a.clone(),partial=a.clone(),transparent=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({transparent:true,opacity:.5}));
  a.castShadow=true;b.castShadow=false;c.layers.set(2);partial.geometry=partial.geometry.clone();partial.geometry.setDrawRange(0,6);root.add(a,b,c,partial,transparent);
  merge(root);assert.equal(root.children.length,5);assert.equal(a.castShadow,true);assert.equal(b.castShadow,false);assert.equal(c.layers.mask,4);assert.equal(partial.geometry.drawRange.count,6);assert.equal(transparent.parent,root);
 });
}finally{clearInterval(h.game.net.timer);h.close();}
console.log(`COMPLETE ${rigidMergeChecks} rigid merge checks passed`);
