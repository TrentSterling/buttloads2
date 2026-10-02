import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,T=THREE;
export let caveFormChecks=0;
const test=async(name,fn)=>{await fn();caveFormChecks++;console.log('PASS cave forms: '+name);};
const types=new Set(['lantern-shelves','chalk-drapery','amethyst-fan']);
function solid(geo,label){
 const p=geo.attributes.position,ids=geo.index.array,edges=new Map(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let volume=0;
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e6)).join(',');
 for(const attr of Object.values(geo.attributes)){assert.equal(attr.count,p.count,label+' incomplete attributes');assert.ok(Array.from(attr.array).every(Number.isFinite),label+' nonfinite attributes');}
 for(let i=0;i<ids.length;i+=3){const tri=Array.from(ids.slice(i,i+3));a.fromBufferAttribute(p,tri[0]);b.fromBufferAttribute(p,tri[1]);c.fromBufferAttribute(p,tri[2]);assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-18,label+' collapsed face');volume+=a.dot(b.clone().cross(c))/6;
  for(let j=0;j<3;j++){const x=key(tri[j]),y=key(tri[(j+1)%3]),k=[x,y].sort().join('|'),e=edges.get(k)||{count:0,balance:0};e.count++;e.balance+=x<y?1:-1;edges.set(k,e);}
 }
 assert.ok(volume>1e-7,label+' inward volume');for(const e of edges.values()){assert.equal(e.count,2,label+' open/nonmanifold edge');assert.equal(e.balance,0,label+' inconsistent winding');}
}
function hit(geo,origin,direction){const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({side:T.FrontSide}));mesh.updateMatrixWorld(true);return new T.Raycaster(new T.Vector3(...origin),new T.Vector3(...direction),0,10).intersectObject(mesh);}
try{
 await test('all four mineral solids have closed consistently oriented nondegenerate surfaces',()=>{
  for(const seed of [0,.83,3.7,8.91])for(const [name,args]of [['shelf',[.32,seed]],['drapery',[seed]],['crystal',[.055,.73,seed]],['stalactite',[.09,.3,seed]]]){const geo=B2.CaveForms[name](...args);solid(geo,name+' seed '+seed);geo.dispose();}
 });
 await test('single-sided shelf, chalk, prism and drops remain visible from opposite sides',()=>{
  for(const [name,args,point,axis]of [['shelf',[.4,1],[0,0,.15],1],['drapery',[1],[0,0,0],2],['crystal',[.07,.7,1],[.0098,.28,0],0],['stalactite',[.09,.3,1],[0,-.1,0],2]]){
   const geo=B2.CaveForms[name](...args);for(const sign of [-1,1]){const origin=point.slice(),direction=[0,0,0];origin[axis]+=sign*4;direction[axis]=-sign;assert.ok(hit(geo,origin,direction).length>0,name+' missing side '+sign);}geo.dispose();
  }
 });
 await test('ordinary prisms, clusters and bent drops are closed across the production scale range',()=>{
  for(const seed of [0,.83,3.7,8.91,19.43])for(const radius of [.10,.30])for(const length of [.20,1.55])for(const [kind,cluster]of [['prism',false],['prism',true],['drop',false]]){
   const geo=B2.CaveForms.ordinary(radius,length,seed,kind,cluster);solid(geo,kind+' '+[seed,radius,length,cluster]);assert.ok(geo.boundingBox.min.y>=-length*.5-1e-6,'root extends below its mounting axis');assert.ok(geo.boundingBox.max.y<=length*.5+radius*.3+1e-6,'unexpected tip extent');
   for(const sign of [-1,1])assert.ok(hit(geo,[sign*4,-length*.32,0],[-sign,0,0]).length,kind+' missing single-sided body');geo.dispose();
  }
 });
 await test('ordinary mineral art retains the 45 supported cells and bounded native scene cost',()=>{
  assert.deepEqual([g.view.caveSupportBatches.batches.length,g.view.deepSupportBatches.batches.length,g.view.expeditionSupportBatches.batches.length],[16,19,10]);
  for(const [name,budget]of [['cavernScene',110000],['deepScene',29000],['discovery',47000]]){let triangles=0;g.view[name].traverse(m=>{if(m.isMesh)triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;});assert.ok(triangles<=budget,name+' art exceeds bounded cost');}
  for(const system of [g.view.caveSupportBatches,g.view.deepSupportBatches,g.view.expeditionSupportBatches])for(const batch of system.batches){const mesh=batch.mesh;assert.ok(mesh.material.vertexColors);for(const attr of Object.values(mesh.geometry.attributes)){assert.equal(attr.count,mesh.geometry.attributes.position.count);assert.ok(Array.from(attr.array).every(Number.isFinite));}for(const e of batch.entries)assert.notEqual(e.mesh.geometry.type,'ConeGeometry','ordinary spike left unreconstructed');}
 });
 await test('merged wall landmarks retain complete finite mapped and coloured attributes',()=>{
  const forms=g.view.caveGrowth.filter(n=>types.has(n.root.userData.formation));assert.ok(forms.length>=24);assert.equal(new Set(forms.map(n=>n.root.userData.formation)).size,3);
  for(const n of forms)n.root.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position;for(const name of ['normal','uv','color']){const attr=mesh.geometry.attributes[name];assert.ok(attr);assert.equal(attr.count,p.count);assert.ok(Array.from(attr.array).every(Number.isFinite));}assert.ok(mesh.castShadow&&mesh.receiveShadow);assert.equal(mesh.material.side,T.FrontSide);assert.ok(mesh.material.vertexColors);});
 });
 await test('chalk remains closed after wall mounting and every pendant rim sits inside its deposit',()=>{
  const forms=g.view.caveGrowth.filter(n=>n.root.userData.formation==='chalk-drapery');assert.equal(forms.length,11);let joints=0;
  for(const n of forms){const geo=n.root.children[0].geometry;solid(geo,'mounted chalk');for(let i=0;i<geo.attributes.position.count;i++){const point=new T.Vector3().fromBufferAttribute(geo.attributes.position,i);assert.ok(geo.boundingBox.containsPoint(point),'mounted chalk vertex outside bounds');assert.ok(point.distanceTo(geo.boundingSphere.center)<=geo.boundingSphere.radius+1e-6,'mounted chalk vertex outside sphere');}const parts=geo.userData.chalkParts,coat=parts.find(p=>p.kind==='shoulder'),ids=[];
   for(let i=0;i<geo.index.count;i+=3){const tri=[geo.index.getX(i),geo.index.getX(i+1),geo.index.getX(i+2)];if(tri.every(n=>n>=coat.start&&n<coat.start+coat.count))ids.push(...tri);}
   const shell=geo.clone();shell.setIndex(ids);const mesh=new T.Mesh(shell,new T.MeshBasicMaterial({side:T.DoubleSide}));mesh.updateMatrixWorld(true);
   for(const p of parts.filter(p=>p.kind==='runnel'))for(const index of [p.start+p.count-2,...Array.from({length:p.rimCount},(_,i)=>p.start+i)]){const point=new T.Vector3().fromBufferAttribute(geo.attributes.position,index),ray=new T.Raycaster(point,new T.Vector3(.313,.721,.184).normalize(),1e-6,5);assert.equal(ray.intersectObject(mesh).length%2,1,'pendant attachment outside mounted coat');joints++;}
   shell.dispose();mesh.material.dispose();
  }assert.ok(joints>=800,'insufficient native attachment coverage');
 });
 await test('cave model cost stays within the accepted art budget and retains supported batching',()=>{
  let meshes=0,triangles=0;g.view.cavernScene.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}});
  assert.ok(meshes<=136,'regressed pre-art mesh count');assert.ok(triangles<=110000,'exceeds 26,481 triangle art allowance');assert.equal(g.view.caveSupportBatches.batches.length,16);
  const chalk=g.view.caveGrowth.filter(n=>n.root.userData.formation==='chalk-drapery');assert.ok(chalk.every(n=>n.root.children.filter(m=>m.isMesh).length===1),'chalk should share its mineral material');
 });
}finally{h.close();}
console.log(`COMPLETE ${caveFormChecks} cave form checks passed (inert renderer; no input or timing claim)`);
