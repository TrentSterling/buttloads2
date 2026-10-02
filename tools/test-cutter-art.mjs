// Structural equipment regressions; visual acceptance remains separate.
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE;
export let cutterArtChecks=0;
const test=(name,fn)=>{fn();cutterArtChecks++;console.log('PASS cutter art: '+name);};
function solid(geometries){
 const edges=new Map(),positions=new Map();let volume=0;
 const key=p=>p.map(x=>Math.round(x*1e6)).join(',');
 for(const geo of geometries){
  const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
  assert.equal(n.count,p.count);assert.equal(uv.count,p.count);assert.ok(geo.index);assert.ok(geo.boundingBox&&geo.boundingSphere);
  for(const a of Object.values(geo.attributes))assert.ok([...a.array].every(Number.isFinite));
  for(let i=0;i<p.count;i++){const point=new T.Vector3().fromBufferAttribute(p,i);assert.ok(geo.boundingBox.containsPoint(point));assert.ok(point.distanceTo(geo.boundingSphere.center)<=geo.boundingSphere.radius+1e-7);assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(n,i).length()-1)<1e-5);}
  for(let i=0;i<geo.index.count;i+=3){
   const ids=[0,1,2].map(k=>geo.index.getX(i+k)),points=ids.map(id=>new T.Vector3().fromBufferAttribute(p,id)),keys=points.map(p=>key(p.toArray())),normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
   assert.ok(normal.lengthSq()>1e-16,'Degenerate equipment triangle');volume+=points[0].dot(points[1].clone().cross(points[2]))/6;
   for(const [a,b]of [[0,1],[1,2],[2,0]]){positions.set(keys[a],points[a]);const ordered=[keys[a],keys[b]].sort(),id=ordered.join('|'),record=edges.get(id)||{count:0,balance:0};record.count++;record.balance+=keys[a]===ordered[0]?1:-1;edges.set(id,record);}
  }
 }
 assert.ok(volume>1e-9,'Closed solid must face outward');
 for(const edge of edges.values()){assert.equal(edge.count,2,'Every equipment edge must have two faces');assert.equal(edge.balance,0,'Shared faces must use opposite edge winding');}
 return{volume,vertices:positions.size};
}
try{
 test('cutting flights form closed outward solids across the body and bevel material seam',()=>{
  for(const angle of [0,Math.PI]){const shape=B2.ToolArt.flight(angle);const proof=solid([shape.body,shape.edge]);assert.ok(proof.vertices>500);assert.ok(proof.volume<.001);shape.body.dispose();shape.edge.dispose();}
 });
 test('rounded casings keep closed caps, finite UVs, unit normals and complete bounds',()=>{
  for(const rings of [[[-.2,.19,.17,.04,.006],[-.12,.28,.24,.058,.006],[.1,.26,.22,.05,.006]],[[0,.22,.18,.043],[.025,.28,.24,.058],[.07,.24,.20,.047]]]){const geo=B2.ToolArt.housing(rings);solid([geo]);geo.dispose();}
 });
 test('solid flight faces draw from both physical sides with FrontSide materials',()=>{
  const shape=B2.ToolArt.flight(0),mat=new T.MeshStandardMaterial(),meshes=[shape.body,shape.edge].map(geo=>new T.Mesh(geo,mat));
  meshes.forEach(m=>m.updateWorldMatrix(true,false));
  for(const mesh of meshes){const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
   for(const offset of [12,Math.floor(index.count/6)*3,index.count-12]){
    const points=[0,1,2].map(i=>new T.Vector3().fromBufferAttribute(p,index.getX(offset+i))),center=points.reduce((a,p)=>a.add(p),new T.Vector3()).multiplyScalar(1/3),normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
    const ray=new T.Raycaster(center.clone().addScaledVector(normal,.002),normal.clone().negate(),0,.004);assert.ok(ray.intersectObjects(meshes,false).length,'A physical flight face was culled');
   }
  }shape.body.dispose();shape.edge.dispose();mat.dispose();
 });
 test('paint texture channels are reused by crew clones with complete mapped attributes',()=>{
  const paint=v.artToolKit.p.paint;assert.equal(paint.map.image.width,256);assert.equal(paint.roughnessMap.image.height,256);assert.notEqual(paint.map,paint.roughnessMap);assert.equal(paint.map.encoding,T.sRGBEncoding);
  const m=v.makeMiner('paint-regression',3,'Inspector');v.equipMiner(m,'cutter');let mapped=0;
  m.weapon.traverse(n=>{if(n.isMesh&&n.material.map===paint.map){mapped++;assert.equal(n.material.roughnessMap,paint.roughnessMap);assert.equal(n.geometry.attributes.uv.count,n.geometry.attributes.position.count);}});assert.ok(mapped>0);v.removeMiner('paint-regression');assert.equal(paint.map.image.width,256);
 });
 test('all seven weapon grips retain contact while the cutter rotor and needle animate independently',()=>{
  const m=v.makeMiner('cutter-grip',1,'Inspector');for(const key of Object.keys(B2.TOOLS))for(const pitch of [-.9,0,.9]){v.equipMiner(m,key);v.poseMinerWeapon(m,pitch);m.root.updateWorldMatrix(true,true);const grip=key==='gravity'?new T.Vector3(0,-.168,.04):key==='axe'?new T.Vector3(-.01,-.13,.022):key==='sling'?new T.Vector3(0,-.11,.024):new T.Vector3(0,-.22,.096);m.weapon.children[0].localToWorld(grip);const palm=m.elbows[1].localToWorld(new T.Vector3(0,-.265,-.01));assert.ok(palm.distanceTo(grip)<.025,key+' grip');}
  const rotor=v.rotor,needle=v.needle,rotation=rotor.rotation.z;g.running=true;g.expedition.state.tool='cutter';Object.assign(g.mining,{rev:.8,load:.4,phase:1,stroke:.3,beat:.3,contacts:[]});v.renderMining(g,.016);assert.equal(v.rotor,rotor);assert.equal(v.needle,needle);assert.equal(rotor.parent,v.tool);assert.ok(rotor.rotation.z>rotation);assert.ok(Math.abs(needle.rotation.z-(.7-.8*.75-.4*.6))<1e-12);v.removeMiner('cutter-grip');
 });
}finally{clearInterval(g.net.timer);h.close();}
console.log(`COMPLETE ${cutterArtChecks} cutter art checks passed (closed geometry, shared maps and grips; visual verdict separate)`);
