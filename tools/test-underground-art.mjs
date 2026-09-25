import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,T=THREE;
export let undergroundArtChecks=0;
const test=async(name,fn)=>{await fn();undergroundArtChecks++;console.log('PASS underground art: '+name);};
const additions=()=>g.view.caveGrowth.filter(n=>['lantern-shelves','chalk-drapery','amethyst-fan'].includes(n.root.userData.formation));
function boundsInRoot(root){root.updateMatrixWorld(true);const out=new T.Box3(),p=new T.Vector3(),inverse=root.matrixWorld.clone().invert();root.traverse(n=>{if(!n.isMesh)return;const a=n.geometry.attributes.position,m=inverse.clone().multiply(n.matrixWorld);for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(m);assert.ok(p.toArray().every(Number.isFinite));out.expandByPoint(p);}});return out;}
try{
 await test('rebuilt cabinets and three distinct machines fit their existing physical bodies',()=>{
  const names=new Set(g.view.deepModels.map(m=>m.root.userData.machine));assert.deepEqual(names,new Set(['pump','exchange','receiver']));
  for(const [models,size] of [[g.view.refugeModels,B.REFUGE_SIZE],[g.view.deepModels,[2.2,2.1,1.8]]])for(const model of models){
   const box=boundsInRoot(model.root);for(let i=0;i<3;i++){assert.ok(box.min.getComponent(i)>=-size[i]/2-.003,`low ${model.node.id} axis ${i}: ${box.min.toArray()}`);assert.ok(box.max.getComponent(i)<=size[i]/2+.003,`high ${model.node.id} axis ${i}: ${box.max.toArray()}`);}
   assert.ok(model.lens.parent);assert.ok(model.lens.material.emissive);if(model.wheel)assert.equal(model.wheel.parent,model.root);
  }
 });
 await test('each cave has its own attached formations while the central walking space remains clear',()=>{
  const forms=additions();assert.ok(forms.length>=24);assert.equal(new Set(forms.map(n=>n.root.userData.formation)).size,3);
  for(const n of forms){assert.ok(g.world.base(n.anchor.x,n.anchor.y,n.anchor.z)<0,'anchor is in original rock');const box=boundsInRoot(n.root);assert.ok(box.getSize(new T.Vector3()).length()<5,'ornament exceeds wall allowance');
   n.root.updateMatrixWorld(true);n.root.traverse(m=>{if(!m.isMesh)return;assert.ok(m.castShadow);const a=m.geometry.attributes.position;for(let i=0;i<a.count;i+=3){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld);for(const c of g.world.caverns.networks.map(v=>v.chamber))if(Math.abs(p.y-c.y)<.9)assert.ok(Math.hypot(p.x-c.x,p.z-c.z)>.75,'formation crosses the center route');}});
  }
 });
 await test('headlamp follows actual aim, preserves player controls and uses shadow-casting terrain',()=>{
  g.setScreen(null);g.settings.motion=false;g.settings.quality=1.5;g.player.teleport(7,-15.58,3);g.player.yaw=.63;g.player.pitch=-.22;
  const pose=[g.player.x,g.player.y,g.player.z,g.player.yaw,g.player.pitch],field=g.world.field.slice();g.view.render(g,.016,12);
  const l=g.view.headlamp,d=new T.Vector3().subVectors(l.target.position,l.position).normalize(),expected=g.player.direction;
  assert.ok(d.distanceTo(new T.Vector3(expected.x,expected.y,expected.z))<1e-8);assert.ok(l.position.distanceTo(g.view.camera.position)<1e-8);assert.ok(l.intensity>2&&l.castShadow);assert.ok(g.view.lamp.intensity<.51);assert.equal(g.view.renderer.shadowMap.autoUpdate,true);assert.equal(g.view.sun.shadow.autoUpdate,false);
  assert.ok(g.view.terrain.children.every(m=>m.castShadow),'underground rock must cast headlamp shadows');assert.deepEqual([g.player.x,g.player.y,g.player.z,g.player.yaw,g.player.pitch],pose);assert.deepEqual(g.world.field,field);
  l.shadow.updateMatrices(l);assert.ok(l.shadow.camera.projectionMatrix.elements.every(Number.isFinite));
  g.settings.quality=.75;g.view.render(g,0,12);assert.equal(l.castShadow,false);assert.ok(l.intensity>2);g.settings.quality=1.5;
  g.player.teleport(7,.06,3);g.view.render(g,0,12);assert.equal(l.intensity,0);assert.equal(l.castShadow,false);g.setScreen('title');g.view.render(g,0,12);assert.equal(l.intensity,0);assert.equal(g.view.lamp.intensity,0);
 });
 await test('dim cave accents require exposed supported geometry and clear rock sight lines',()=>{
  const c=g.world.caverns.networks[0].chamber;g.player.teleport(c.x,c.y-g.player.eye,c.z);g.setScreen(null);g.view.render(g,0,0);
  assert.ok(g.view.caveAccents.some(l=>l.intensity>0));assert.ok(g.view.caveAccents.every(l=>l.intensity<=.34&&l.distance===4.2));
  const p=g.view.caveAccentSites[0].point,old=g.world.clearLine;g.world.clearLine=()=>false;g.view.renderCaveAccents(g);assert.ok(g.view.caveAccents.every(l=>l.intensity===0));g.world.clearLine=old;
  g.player.teleport(0,.06,12);g.view.render(g,0,0);assert.ok(g.view.caveAccents.every(l=>l.intensity===0));
 });
 await test('excavating a formation support removes its whole visual and light, including after reload',async()=>{
  const forms=additions(),removed=forms.filter((n,i)=>i%3===0);for(const n of removed)g.world.carve(n.anchor,1.0);
  g.view.renderCaverns(g);assert.ok(removed.every(n=>!n.root.visible));
  const anchors=removed.map(n=>[n.anchor.x,n.anchor.y,n.anchor.z]),save=B.Saves.snapshot(g),field=g.world.field.slice();await g.install(B.Saves.validate(save));g.view.renderCaverns(g);
  for(const a of anchors){const n=additions().find(n=>[n.anchor.x,n.anchor.y,n.anchor.z].every((v,i)=>Math.abs(v-a[i])<1e-9));assert.ok(n&&!n.root.visible,'removed support regrew decoration');}assert.deepEqual(g.world.field,field);
 });
 await test('machine repair lenses and moving bodies remain tied to the production nodes',()=>{
  for(const [models,state,render] of [[g.view.refugeModels,g.refuges.state,()=>g.view.renderCaverns(g)],[g.view.deepModels,g.deep.state,()=>g.view.renderDeep(g,8)]]){
   const ids=state.lit||state.repaired,prior=[...ids];ids.splice(0,ids.length,...models.map(m=>m.node.id));render();assert.ok(models.every(m=>m.lens.material.emissiveIntensity>1));
   for(const m of models){const y=m.node.y;m.node.y-=.7;render();assert.equal(m.root.position.y,m.node.y);m.node.y=y;}
   ids.splice(0,ids.length,...prior);render();
  }
 });
 await test('lighting, formations and station rendering do not change terrain, ore, money or progress',()=>{
  const field=g.world.field.slice(),state=structuredClone(g.economy.state),ore=g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected]);
  for(const n of [...g.world.caverns.networks.map(v=>v.chamber),...g.deep.nodes]){g.player.teleport(n.x,n.y-g.player.eye,n.z-1);g.view.render(g,.016,37);}
  assert.deepEqual(g.world.field,field);assert.deepEqual(g.economy.state,state);assert.deepEqual(g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected]),ore);
 });
}finally{h.close();}
console.log(`COMPLETE ${undergroundArtChecks} underground art checks passed (inert renderer; no browser or OS input)`);
