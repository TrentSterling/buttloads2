// Closed physical attachment surfaces and motion boundaries. Visual verdict is separate.
import assert from 'node:assert/strict';import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE;export let attachmentArtChecks=0;
const test=(name,fn)=>{fn();attachmentArtChecks++;console.log('PASS attachment art: '+name);};
function solid(geometries){
 const edges=new Map(),positions=new Map();let volume=0;
 const key=p=>p.map(x=>Math.round(x*1e6)).join(',');
 for(const geo of geometries){
  const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
  assert.equal(n.count,p.count);assert.equal(uv.count,p.count);assert.ok(geo.boundingBox&&geo.boundingSphere);
  for(const a of Object.values(geo.attributes))assert.ok([...a.array].every(Number.isFinite));
  for(let i=0;i<p.count;i++){const point=new T.Vector3().fromBufferAttribute(p,i);assert.ok(geo.boundingBox.containsPoint(point));assert.ok(point.distanceTo(geo.boundingSphere.center)<=geo.boundingSphere.radius+1e-7);assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(n,i).length()-1)<1e-5);}
  for(let i=0;i<(geo.index?.count||p.count);i+=3){
   const ids=[0,1,2].map(k=>geo.index?geo.index.getX(i+k):i+k),points=ids.map(id=>new T.Vector3().fromBufferAttribute(p,id)),keys=points.map(p=>key(p.toArray())),normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
   assert.ok(normal.lengthSq()>1e-16,'Degenerate equipment triangle');volume+=points[0].dot(points[1].clone().cross(points[2]))/6;
   for(const [a,b]of [[0,1],[1,2],[2,0]]){positions.set(keys[a],points[a]);const ordered=[keys[a],keys[b]].sort(),id=ordered.join('|'),record=edges.get(id)||{count:0,balance:0};record.count++;record.balance+=keys[a]===ordered[0]?1:-1;edges.set(id,record);}
  }
 }
 assert.ok(volume>1e-9,'Closed solid must face outward');
 for(const edge of edges.values()){assert.equal(edge.count,2,'Every equipment edge must have two faces');assert.equal(edge.balance,0,'Shared faces must use opposite edge winding');}
 return{volume,vertices:positions.size};
}
try{
 test('bucket floor, cheeks and fitted ribs are closed outward solids with valid bounds and UVs',()=>{for(const key of ['bucketFloor','bucketCheek','bucketRib']){const geo=B2.ToolArt[key]();solid([geo]);geo.dispose();}});
 test('the continuous resonator winding is closed across its cross-section and end caps',()=>{const geo=B2.ToolArt.coil();const proof=solid([geo]);assert.ok(proof.volume>.0001&&proof.volume<.001);geo.dispose();});
 test('hollow turned housings expose both outer and inner physical faces without reversed winding',()=>{const geo=B2.ToolArt.turned([[.04,.07],[.02,.10],[-.10,.10],[-.13,.07],[-.13,.05],[.04,.05]]);solid([geo]);const mesh=new T.Mesh(geo,new T.MeshStandardMaterial());mesh.updateWorldMatrix(true,false);for(const [x,dx]of [[.12,-1],[0,1]]){const ray=new T.Raycaster(new T.Vector3(x,0,-.04),new T.Vector3(dx,0,0),0,.15);assert.ok(ray.intersectObject(mesh,false).length);}geo.dispose();mesh.material.dispose();});
 test('the bucket interior and underside render with FrontSide material',()=>{const geo=B2.ToolArt.bucketFloor(),material=new T.MeshStandardMaterial(),mesh=new T.Mesh(geo,material);mesh.updateWorldMatrix(true,false);for(const sign of [-1,1]){const ray=new T.Raycaster(new T.Vector3(0,sign,-.57),new T.Vector3(0,-sign,0),0,2);assert.ok(ray.intersectObject(mesh,false).length);}geo.dispose();material.dispose();});
 test('reinforcing ribs stay below the interior at all sampled stations',()=>{const mat=new T.MeshStandardMaterial(),floor=new T.Mesh(B2.ToolArt.bucketFloor(),mat),rib=new T.Mesh(B2.ToolArt.bucketRib(),mat);floor.updateWorldMatrix(true,false);rib.updateWorldMatrix(true,false);for(const z of [-.31,-.36,-.44,-.56,-.64,-.71]){const ray=new T.Raycaster(new T.Vector3(0,1,z),new T.Vector3(0,-1,0),0,2),top=ray.intersectObject(floor,false)[0],reinforcement=ray.intersectObject(rib,false)[0];assert.ok(top&&reinforcement);assert.ok(top.point.y-reinforcement.point.y>.012,'Reinforcement breaks through the bucket interior at '+z);}floor.geometry.dispose();rib.geometry.dispose();mat.dispose();});
 test('rigid merging retains independent scoop and striker motion through a full cycle',()=>{const scoop=v.scoopHead,striker=v.lanceStriker;g.running=true;v.settings.motion=true;g.expedition.state.tool='lance';for(const stroke of [0,.125,.25,.5,.75,1]){Object.assign(g.mining,{rev:1,load:.4,stroke,phase:1,beat:.3,contacts:[]});v.renderMining(g,0);assert.equal(v.scoopHead,scoop);assert.equal(v.lanceStriker,striker);assert.equal(striker.parent,v.lanceHead);assert.ok(Math.abs(striker.position.z-(1-(1-stroke)**3)*.065)<1e-12);assert.ok(Math.abs(scoop.rotation.x-Math.sin(stroke*Math.PI*2)*.14)<1e-12);assert.ok(Math.abs(scoop.position.z-Math.sin(stroke*Math.PI*2)*.035)<1e-12);}g.running=false;v.renderMining(g,0);assert.equal(striker.position.z,0);assert.equal(scoop.rotation.x,0);});
 test('combined mechanical art stays below the previous submission inventory and reuses kit materials',()=>{let count=0,triangles=0;v.tool.traverse(n=>{if(n.isMesh){count++;triangles+=(n.geometry.index?.count||n.geometry.attributes.position.count)/3;}});assert.ok(count<31);assert.ok(triangles<22922);for(const root of [v.scoopHead,v.lanceHead])root.traverse(n=>{if(n.isMesh){assert.ok(Object.values(v.artToolKit.p).includes(n.material));assert.equal(n.material.side,T.FrontSide);}});});
}finally{clearInterval(g.net.timer);h.close();}
console.log('COMPLETE '+attachmentArtChecks+' attachment art checks passed (physical geometry and motion; visual verdict separate)');
