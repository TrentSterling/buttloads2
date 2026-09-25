import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,T=THREE;
export let beautyChecks=0;
const test=async(name,fn)=>{await fn();beautyChecks++;console.log('PASS beauty: '+name);};
try{
 await test('surface and underground presentation never change the saved mine or economy',()=>{
  const state=structuredClone(g.economy.state),field=g.world.field.slice(),ore=g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected]);
  for(const y of [0,-12,-32,-50,-100,-220,-285]){g.player.teleport(0,y,0);g.view.render(g,.016,12);}
  assert.deepEqual(g.economy.state,state);assert.deepEqual(g.world.field,field);assert.deepEqual(g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected]),ore);
 });
 await test('the sky follows the camera, disappears underground and leaves look controls unchanged',()=>{
  g.setScreen(null);g.player.teleport(2,.06,4);g.settings.motion=false;const pose=[g.player.yaw,g.player.pitch];g.view.render(g,.016,1);assert.ok(g.view.skyDome.visible);assert.deepEqual(g.view.skyDome.position.toArray(),g.view.camera.position.toArray());
  const before=g.view.tool.rotation.toArray();g.view.render(g,.016,100);assert.deepEqual(g.view.tool.rotation.toArray(),before);assert.deepEqual([g.player.yaw,g.player.pitch],pose);
  g.player.teleport(2,-70,4);g.view.render(g,0,100);assert.equal(g.view.skyDome.visible,false);assert.ok(g.view.toolKey.intensity>1);
 });
 await test('the sun shadow volume covers all three town buildings',()=>{
  const v=g.view;v.scene.updateMatrixWorld(true);v.sun.shadow.updateMatrices(v.sun);
  for(const b of B.TOWN.buildings)for(const x of [b.x-b.w/2-.4,b.x+b.w/2+.4])for(const y of [0,b.h+1.5])for(const z of [b.z-b.d/2-.6,b.z+b.d/2+.6]){
   const p=new T.Vector3(x,y,z).project(v.sun.shadow.camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&Math.abs(p.z)<1,'town corner lies outside shadow map');
  }
 });
 await test('verge plants stay off both editable claims and the town roads',()=>{
  const v=g.view.verge;assert.ok(v.children.length);v.traverse(n=>{if(!n.isMesh)return;const a=n.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);assert.ok(!(x>-16&&x<48&&z>-16&&z<16));assert.ok(!(z>23&&x>-32&&x<31));assert.ok(!(x>-20&&x<21&&z>16&&z<23));}});
 });
 await test('distinct cave formations disappear when their terrain support is excavated',()=>{
  const types=new Set(g.view.caveGrowth.map(n=>n.root.userData.formation));assert.ok(types.has('lantern-cap'));assert.ok(types.has('chalk-roots'));assert.ok(types.has('mineral-cluster'));
  const samples=[...types].map(type=>g.view.caveGrowth.find(n=>n.root.userData.formation===type));for(const n of samples)g.world.carve(n.anchor,.7);g.view.renderCaverns(g);assert.ok(samples.every(n=>!n.root.visible));
 });
 await test('terrain hooks expand against the bundled Three.js shaders and export complete GPU compile fixtures',()=>{
  const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};g.view.terrainMaterial.onBeforeCompile(shader);
  assert.ok(shader.vertexShader.includes('vGround=(modelMatrix*vec4(transformed,1.)).xyz'));assert.ok(shader.fragmentShader.includes('strataHeight=b2Height(vGround)'));assert.ok(shader.fragmentShader.includes('diffuseColor.rgb=b2Terrain'));
  const expand=s=>s.replace(/^[ \t]*#include +<([\w\d_]+)>/gm,(_,name)=>{assert.ok(T.ShaderChunk[name],name);return expand(T.ShaderChunk[name]);});
  const out=path.join(import.meta.dirname,'out');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'beauty-shaders.json'),JSON.stringify({vertex:expand(shader.vertexShader),fragment:expand(shader.fragmentShader),sky:g.view.skyDome.material.fragmentShader}));
 });
}finally{h.close();}
console.log(`COMPLETE ${beautyChecks} beauty checks passed (inert scene and DOM; no browser or OS input)`);
