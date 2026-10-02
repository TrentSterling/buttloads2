// Static-asset regressions; no browser, input delivery or pointer lock.
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,T=THREE;export let worldArtChecks=0;
const test=async(name,fn)=>{await fn();worldArtChecks++;console.log('PASS world art: '+name);};
try{
 await test('merged meadow retains a complete, nonblack vertex colour stream',()=>{
  const mesh=g.view.verge.children.find(m=>m.material===g.view.meadowMaterial);assert.ok(mesh);
  const colors=mesh.geometry.attributes.color;assert.ok(colors,'merger dropped meadow colours');assert.equal(colors.count,mesh.geometry.attributes.position.count);
  assert.ok(colors.array.every(n=>Number.isFinite(n)&&n>.01&&n<=1));assert.ok(Math.max(...colors.array.subarray(0,6000))-Math.min(...colors.array.subarray(0,6000))>.04);
 });
 await test('merging coloured and plain meshes supplies white only for absent colours',()=>{
  const group=new T.Group(),material=new T.MeshStandardMaterial({vertexColors:true});
  for(const [x,paint]of [[0,true],[3,false]]){const geo=new T.BoxGeometry(1,1,1);if(paint){const values=[];for(let i=0;i<geo.attributes.position.count;i++)values.push(.4,.2,.1);geo.setAttribute('color',new T.Float32BufferAttribute(values,3));}const mesh=new T.Mesh(geo,material);mesh.position.x=x;group.add(mesh);}
  g.view.merge(group);assert.equal(group.children.length,1);const a=group.children[0].geometry.attributes;assert.equal(a.color?.count,a.position.count,'mixed batch loses its colour stream');
  for(let i=0;i<a.position.count;i++){const expected=a.position.getX(i)<1?[.4,.2,.1]:[1,1,1];for(let k=0;k<3;k++)assert.ok(Math.abs(a.color.array[i*3+k]-expected[k])<1e-6);}
  group.children[0].geometry.dispose();material.dispose();
 });
 await test('ground finish preserves the actual field join and complete surface geometry',()=>{
  const old=new T.Color('#71854e').convertSRGBToLinear();
  for(const [x,z]of [[-16.25,0],[47.75,0],[0,-16.25],[0,15.75]]){const c=B2.COMMON_FINISH.color(x,z,.2);for(const k of ['r','g','b'])assert.ok(Math.abs(c[k]-old[k])<1e-10);}
  for(const mesh of g.view.surfaceGround){const a=mesh.geometry.attributes;assert.equal(a.color.count,a.position.count);assert.ok(a.color.array.every(n=>Number.isFinite(n)&&n>=0&&n<=1));for(let i=0;i<a.position.count;i+=17)assert.ok(Math.abs(a.position.getY(i)-B2.COMMON.height(a.position.getX(i),a.position.getZ(i)))<2e-5);}
 });
}finally{h.close();}
console.log(`COMPLETE ${worldArtChecks} world art checks passed`);
