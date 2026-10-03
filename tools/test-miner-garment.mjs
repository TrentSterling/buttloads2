import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {nodeGame} from './node-game.mjs';
import {posedWorkerMesh} from './miner-joint-test-helper.mjs';
const h=await nodeGame(),T=THREE,current=B2.buildMinerArt;
// Keep the released body factory as the comparison fixture, not the current implementation.
vm.runInThisContext(fs.readFileSync(new URL('fixtures/miner-art-2.48.0.js',import.meta.url),'utf8'));
const released=B2.buildMinerArt;vm.runInThisContext(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url),'utf8'));
const old=released(h.game.view,2),rig=current(h.game.view,2);export let minerGarmentChecks=0;
const test=(name,fn)=>{fn();minerGarmentChecks++;console.log('PASS miner garment: '+name);};
const meshes=root=>{const a=[];root.traverse(n=>{if(n.isMesh)a.push(n);});return a;};
const trisWithoutGloves=art=>meshes(art.root).filter(m=>!art.elbows.includes(m.parent)||![art.materials[3],art.materials[5]].includes(m.material)).reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
try{
 test('fitted bib is closed, has outward winding and covers the front of the chest',()=>{
  const g=B2.WorkshopShapes.bibPanel(),p=g.attributes.position,i=g.index,edges=new Map();let volume=0;const key=n=>[p.getX(n),p.getY(n),p.getZ(n)].map(v=>v.toFixed(6)).join(',');
  for(let n=0;n<i.count;n+=3){const a=i.getX(n),b=i.getX(n+1),c=i.getX(n+2),av=new T.Vector3().fromBufferAttribute(p,a),bv=new T.Vector3().fromBufferAttribute(p,b),cv=new T.Vector3().fromBufferAttribute(p,c);assert.ok(bv.clone().sub(av).cross(cv.clone().sub(av)).length()>1e-8);volume+=av.dot(bv.clone().cross(cv))/6;
   for(const [x,y]of [[a,b],[b,c],[c,a]]){const e=[key(x),key(y)].sort().join('|');edges.set(e,(edges.get(e)||0)+1);}}
  assert.ok(volume>.0005&&volume<.002);assert.ok([...edges.values()].every(n=>n===2));
  const panel=new T.Mesh(g,new T.MeshBasicMaterial()),ray=new T.Raycaster(new T.Vector3(0,1.10,-.4),new T.Vector3(0,0,1));panel.updateMatrixWorld(true);const hit=ray.intersectObject(panel)[0];assert.ok(hit&&hit.face.normal.z<-.9&&hit.point.z<-.15);
 });
 test('knee cloth encloses the pivot below the thigh cut through a full bend',()=>{
  for(let k=0;k<2;k++){
   const leg=rig.legs[k],joint=rig.knees[k],cloth=meshes(leg).find(n=>n.name==='continuous-trouser');assert.ok(cloth);
   for(const bend of [0,.5,1,1.65,2.1]){joint.rotation.x=-bend;rig.root.updateMatrixWorld(true);const center=leg.localToWorld(new T.Vector3(0,-.38,0));
    const posed=posedWorkerMesh(cloth);try{for(const azimuth of [-1.2,-.6,0,.6,1.2]){const direction=new T.Vector3(Math.sin(azimuth)*.7,-.7,Math.cos(azimuth)*.7).normalize().applyQuaternion(leg.getWorldQuaternion(new T.Quaternion())),ray=new T.Raycaster(center.clone().addScaledVector(direction,.9),direction.clone().negate());const hits=ray.intersectObject(posed);assert.ok(hits.length&&hits[0].distance<.9,JSON.stringify({k,bend,azimuth,reason:'knee pivot outside posed garment'}));assert.ok(hits[0].point.distanceTo(center)>.075,JSON.stringify({k,bend,azimuth,radius:hits[0].point.distanceTo(center),reason:'flat thigh cut leaves the lower joint unfilled'}));}}finally{posed.geometry.dispose();}}
  }
 });
 test('knee retention bands are hollow and cannot expose a solid cylinder cap',()=>{
  const g=B2.WorkshopShapes.garmentBand(.02,.095,.096),m=new T.Mesh(g,new T.MeshBasicMaterial()),ray=new T.Raycaster(new T.Vector3(0,.2,0),new T.Vector3(0,-1,0));m.updateMatrixWorld(true);assert.equal(ray.intersectObject(m).length,0);
  ray.set(new T.Vector3(.092,.2,0),new T.Vector3(0,-1,0));assert.ok(ray.intersectObject(m).length>0);
  const p=g.attributes.position,i=g.index;let volume=0;for(let n=0;n<i.count;n+=3){const a=new T.Vector3().fromBufferAttribute(p,i.getX(n)),b=new T.Vector3().fromBufferAttribute(p,i.getX(n+1)),c=new T.Vector3().fromBufferAttribute(p,i.getX(n+2));volume+=a.dot(b.cross(c))/6;}assert.ok(volume>0&&volume<.0001);
 });
 test('elbow sleeves cover the pivot while the articulated glove is retained',()=>{
  for(let k=0;k<2;k++){
   const arm=rig.arms[k],sleeve=meshes(arm).find(n=>n.name==='continuous-sleeve');assert.ok(sleeve);
   for(const bend of [0,.7,1.4,2]){rig.elbows[k].rotation.x=bend;rig.root.updateMatrixWorld(true);const center=arm.localToWorld(new T.Vector3(0,-.245,0)),direction=new T.Vector3(0,-.8,.6).applyQuaternion(arm.getWorldQuaternion(new T.Quaternion())),ray=new T.Raycaster(center.clone().addScaledVector(direction,.7),direction.clone().negate());const posed=posedWorkerMesh(sleeve);try{const hit=ray.intersectObject(posed)[0];assert.ok(hit&&hit.distance<.7&&hit.point.distanceTo(center)>.065,JSON.stringify({k,bend,radius:hit?.point.distanceTo(center),reason:'elbow coverage'}));}finally{posed.geometry.dispose();}}
  }
 });
 test('unchanged head equipment and cuff shapes, texture count, body draw inventory and released motion anchors are conserved; face, fabric UVs, gloves and boots are checked separately',()=>{
  const compare=(a,b)=>{assert.equal(a.length,b.length);for(let j=0;j<a.length;j++){const x=a[j].geometry,y=b[j].geometry;assert.deepEqual(x.index?.array,y.index?.array);for(const n of Object.keys(x.attributes)){if(n==='uv'&&a[j].material===rig.materials[1])continue;assert.deepEqual(x.attributes[n].array,y.attributes[n].array);}}};
  const equipment=art=>meshes(art.head).filter(n=>![6,7,8].includes(art.materials.indexOf(n.material)));compare(equipment(rig),equipment(old));for(let k=0;k<2;k++){compare(meshes(rig.elbows[k]).filter(n=>![2,3,5].includes(rig.materials.indexOf(n.material))),meshes(old.elbows[k]).filter(n=>![2,3,5].includes(old.materials.indexOf(n.material))));for(const prop of ['legs','knees','feet','arms','elbows'])assert.deepEqual(rig[prop][k].position.toArray(),old[prop][k].position.toArray());}
  assert.equal(meshes(rig.root).length,42);assert.equal(new Set(meshes(rig.root).map(n=>n.material)).size,27);assert.equal(rig.textures.length,old.textures.length);assert.equal(trisWithoutGloves(rig)-trisWithoutGloves(old),5150);
  for(const m of meshes(rig.root))assert.ok(m.castShadow&&m.receiveShadow);
 });
}finally{clearInterval(h.game.net.timer);h.close();}
console.log(`COMPLETE ${minerGarmentChecks} miner garment checks passed (closure, articulated volume and asset budgets; visual verdict separate)`);
