import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE;
export let freightMergeChecks=0;
const test=(name,fn)=>{fn();freightMergeChecks++;console.log('PASS freight merge: '+name);};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-6,`${actual} differs from ${expected}`);
try{
 test('both crane spans retain travelling trolley, cage, independent cargo and mutable cables',()=>{
  const original=g.world.parcelVersion;
  for(const parcel of [0,1]){
   g.world.parcelVersion=parcel;v.makeFreight(g);
   Object.assign(g.freight.state,{dock:{x:1,y:-12,z:4},phase:'outbound',travel:7});g.freight.state.load[0]=4;g.freight.state.load[1]=3;
   const trolley=v.craneTrolley,cargo=v.freightCargo,lamp=v.freightLamp,cable=v.freightCable;
   v.renderFreight(g,10);const cage=g.freight.cage;
   assert.equal(trolley.parent,v.craneRail);assert.equal(trolley.matrixAutoUpdate,true);near(trolley.position.x,cage.x);near(v.craneRail.position.z,4);assert.deepEqual(v.freightCage.position.toArray(),[cage.x,cage.y,cage.z]);
   assert.equal(cargo.parent,v.freightCage);assert.equal(cargo.isInstancedMesh,true);assert.equal(cargo.count,7);assert.ok(cargo.instanceColor);assert.equal(lamp.parent,v.freightDock);assert.equal(lamp.matrixAutoUpdate,true);
   const railBounds=new T.Box3().setFromObject(v.craneRail);assert.ok(railBounds.max.x>(parcel?46:14));
   near(cable.geometry.attributes.position.getY(1),cage.y+.44);const version=cable.geometry.attributes.position.version;
   g.freight.state.travel=10;g.freight.state.phase='returning';g.freight.blockedBy='rock';v.renderFreight(g,11);assert.ok(cable.geometry.attributes.position.version>version);assert.equal(lamp.material.emissive.getHexString(),'ef9565');
   g.freight.state.load.fill(0);v.renderFreight(g,12);assert.equal(cargo.count,0);g.freight.state.dock=null;v.renderFreight(g,13);assert.equal(v.freightModel.visible,false);
  }
  g.world.parcelVersion=original;
 });
 test('rescue glazing, resident, lens and hoist retain separate state and transforms',()=>{
  const person=v.bellPerson.root,lens=v.rescueLens,glass=[];v.rescueBell.traverse(n=>{if(n.isMesh&&n.material.transparent)glass.push(n);});assert.equal(glass.length,3);assert.ok(glass.every(n=>n.material.opacity===.12&&n.material.depthWrite===false));
  assert.equal(person.parent,v.rescueBell);assert.equal(lens.parent,v.rescueBell);assert.equal(person.matrixAutoUpdate,true);assert.equal(lens.matrixAutoUpdate,true);
  g.rescue.state.phase='hoisting';g.rescue.blockedBy=null;g.running=true;g.settings.motion=true;v.renderRescue(g,2);
  assert.ok(person.visible);near(v.rescueWheel.rotation.y,4);near(lens.material.emissiveIntensity,1.3);const cable=v.rescueCable,position=g.rescue.position;near(cable.scale.y,4.3-position.y-1.25);
  g.rescue.state.phase='stranded';v.renderRescue(g,3);near(lens.material.emissiveIntensity,.2);near(v.rescueWheel.rotation.y,0);
  g.rescue.state.phase='rescued';v.renderRescue(g,4);assert.equal(person.visible,false);assert.equal(person.parent,v.rescueBell);
 });
 test('crawler armour breaks independently while limbs, corpse compression and eyes still update',()=>{
  const m=v.crawlerModels[0],n=m.node;Object.assign(n,{phase:'windup',hp:80,shell:3,vx:1,vz:0});g.running=true;g.settings.motion=true;v.renderCrawlers(g,.13);
  assert.equal(m.shell.children.length,1);assert.equal(m.shell.visible,true);assert.equal(m.body.parent,m.root);assert.equal(m.body.matrixAutoUpdate,true);assert.equal(m.rear.parent,m.root);assert.ok(m.legs.every(l=>l.parent===m.root&&l.matrixAutoUpdate));assert.ok(m.claws.every(c=>c.parent===m.root&&c.rotation.x===-.65));assert.ok(m.legs.some(l=>Math.abs(l.rotation.x)>.01));near(m.glow.emissiveIntensity,2.1);
  Object.assign(n,{phase:'dead',hp:0,shell:0});v.renderCrawlers(g,.2);assert.equal(m.shell.visible,false);near(m.body.scale.y,.45);near(m.glow.emissiveIntensity,0);assert.ok(m.legs.every(l=>l.rotation.x===0));
 });
 test('moth wings retain individual animation, shared eye tell and burial/death visibility',()=>{
  const m=v.mothModels[0],n=m.node;Object.assign(n,{phase:'windup',hp:3});g.settings.motion=true;v.renderCombat(g,.13);assert.equal(m.root.visible,true);assert.equal(m.tell.visible,true);near(m.eye.emissiveIntensity,2);assert.ok(m.wings.every(w=>w.parent===m.root&&w.matrixAutoUpdate));near(m.wings[0].rotation.z,-m.wings[1].rotation.z);assert.ok(Math.abs(m.wings[0].rotation.z)>.01);
  n.phase='buried';v.renderCombat(g,.2);assert.equal(m.root.visible,false);n.phase='dead';n.hp=0;v.renderCombat(g,.3);assert.equal(m.root.visible,false);assert.equal(m.tell.visible,false);
 });
}finally{clearInterval(g.net.timer);h.close();}
console.log(`COMPLETE ${freightMergeChecks} freight and creature merge checks passed`);
