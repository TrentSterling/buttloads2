// Structural regression checks. These do not approve the artwork.
import {nodeGame} from './node-game.mjs';
import assert from 'node:assert/strict';
const h=await nodeGame(),g=h.game,v=g.view,m=v.makeMiner('grip-regression',2,'Inspector');
try{
 let poses=0;
 for(const key of Object.keys(B2.TOOLS))for(const pitch of [-.9,0,.9]){
  v.equipMiner(m,key);v.poseMinerWeapon(m,pitch);m.root.updateMatrixWorld(true);
  const grip=key==='gravity'?new THREE.Vector3(0,-.168,.04):key==='axe'?new THREE.Vector3(-.01,-.13,.022):key==='sling'?new THREE.Vector3(0,-.11,.024):new THREE.Vector3(0,-.22,.096);
  m.weapon.children[0].localToWorld(grip);const palm=m.elbows[1].localToWorld(new THREE.Vector3(0,-.265,-.01)),gap=palm.distanceTo(grip);
  assert.ok(gap<.025,`${key}, pitch ${pitch}: glove misses the handle by ${gap.toFixed(4)} m`);poses++;
 }
 console.log(`PASS art structure: ${poses} weapon/aim poses keep the glove within 25 mm of the grip.`);
 const target={x:3,y:.1,z:9,grounded:true},before=g.world.field.slice();g.view.scene.updateMatrixWorld(true);const floor=v.minerFloor(m,target,g.world);
 m.root.position.set(target.x,floor,target.z);m.root.updateMatrixWorld(true);const bottom=Math.min(...m.feet.map(f=>new THREE.Box3().setFromObject(f).min.y));
 const ray=new THREE.Raycaster(new THREE.Vector3(target.x,1,target.z),new THREE.Vector3(0,-1,0)),hit=ray.intersectObjects(v.terrain.children)[0];assert.ok(hit);assert.ok(Math.abs(bottom-hit.point.y)<.03);assert.equal(target.y,.1);assert.deepEqual(g.world.field,before);
 console.log('PASS art structure: boots follow the actual rendered terrain within 30 mm, without changing physical position or terrain.');
 for(const x of [-8.01,-8,-7.51,-.01,0,7.51,8,8.01])for(const z of [0,7.51,8]){
  const p={x,y:.1,z,grounded:true},reference=new THREE.Raycaster(new THREE.Vector3(x,.4,z),new THREE.Vector3(0,-1,0));reference.far=1;
  const floor=reference.intersectObjects(v.terrain.children).find(h=>h.face?.normal.y>.3),expected=floor?floor.point.y-.012:p.y-.025;
  m.floorCache=null;assert.ok(Math.abs(v.minerFloor(m,p,g.world)-expected)<.00001,`local grounding differs at ${x}, ${z}`);
 }
 console.log('PASS art structure: local grounding matches the full terrain ray at 24 chunk-edge positions.');
 target.grounded=false;target.y=4;assert.equal(v.minerFloor(m,target,g.world),3.975);
 console.log('PASS art structure: airborne miners retain their authoritative vertical position.');
 console.log('COMPLETE art structure: 21 grip poses and 26 grounding checks. Visual verdict remains separate.');
}finally{v.removeMiner('grip-regression');clearInterval(g.net.timer);h.close();}
