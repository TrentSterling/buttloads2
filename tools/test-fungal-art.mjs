import assert from 'node:assert/strict';import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,T=THREE;
export let fungalArtChecks=0;
const test=async(name,fn)=>{await fn();fungalArtChecks++;console.log('PASS fungal art: '+name);};
function solid(geo,label){
 const p=geo.attributes.position,ids=geo.index.array,edges=new Map(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let volume=0;
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e6)).join(',');
 for(const attr of Object.values(geo.attributes)){assert.equal(attr.count,p.count,label+' incomplete attributes');assert.ok(Array.from(attr.array).every(Number.isFinite),label+' nonfinite');}
 for(let i=0;i<ids.length;i+=3){const tri=Array.from(ids.slice(i,i+3));a.fromBufferAttribute(p,tri[0]);b.fromBufferAttribute(p,tri[1]);c.fromBufferAttribute(p,tri[2]);assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-20,label+' collapsed face');volume+=a.dot(b.clone().cross(c))/6;
  for(let j=0;j<3;j++){const x=key(tri[j]),y=key(tri[(j+1)%3]),k=[x,y].sort().join('|'),e=edges.get(k)||{count:0,balance:0};e.count++;e.balance+=x<y?1:-1;edges.set(k,e);}
 }assert.ok(volume>1e-8,label+' inward solid');for(const e of edges.values()){assert.equal(e.count,2,label+' open/nonmanifold edge');assert.equal(e.balance,0,label+' inconsistent winding');}
}
const entries=()=>g.view.caveSupportBatches.batches.flatMap(b=>b.entries);
function contact(){let count=0,worst=-Infinity;for(const e of entries()){const geo=e.mesh.geometry;if(!geo.userData.fungalGrowth||!e.record.root.visible)continue;for(const i of geo.userData.rootVertices){const p=new T.Vector3().fromBufferAttribute(geo.attributes.position,i).applyMatrix4(e.transform);worst=Math.max(worst,g.world.density(p.x,p.y,p.z));count++;}}assert.ok(count>=100);assert.ok(worst<=.00001,'fungal root in air: '+worst);return{count,worst};}
try{
 await test('cap, stem and twenty solid gills are closed and outward over the native scale range',()=>{
  for(const radius of [.1,.27])for(const height of [.2,.65])for(const seed of [0,.83,3.7,8.91,19.43]){const forms=B2.CaveForms.fungus(radius,height,seed);for(const [name,geo]of Object.entries(forms)){solid(geo,name+' '+[radius,height,seed]);assert.ok(geo.index.count/3<=420,'piece exceeds cost');geo.dispose();}}
 });
 await test('single-sided cap is visible above and below and encloses the flared stem joint',()=>{
  for(const seed of [0,.83,3.7,8.91,19.43]){const radius=.2,height=.4,forms=B2.CaveForms.fungus(radius,height,seed),cap=new T.Mesh(forms.cap,new T.MeshBasicMaterial({side:T.FrontSide}));cap.scale.y=.42;cap.position.y=height*.7;cap.updateMatrixWorld(true);
   const x=radius*.13*Math.sin(seed),z=radius*.10*Math.cos(seed*.8);for(const sign of [-1,1])assert.ok(new T.Raycaster(new T.Vector3(x,height*.7+sign*2,z),new T.Vector3(0,-sign,0),0,4).intersectObject(cap).length,'missing cap side');
   const p=forms.stem.attributes.position;for(let i=60;i<70;i++){const joint=new T.Vector3().fromBufferAttribute(p,i);joint.y+=height*.35;const hits=new T.Raycaster(joint,new T.Vector3(0,-1,0),0,1).intersectObject(cap);assert.equal(hits.length,0,'stem end outside cap');const fromAbove=joint.clone();fromAbove.y+=1;const hit=new T.Raycaster(fromAbove,new T.Vector3(0,-1,0),0,2).intersectObject(cap)[0];assert.ok(hit&&hit.point.y>joint.y,'stem tip lacks cap above it');}
   cap.material.side=T.DoubleSide;const direction=new T.Vector3(.37,.82,.26).normalize(),gp=forms.gills.attributes.position;
   for(let i=0;i<gp.count;i++)if(i%4<2){const joint=new T.Vector3().fromBufferAttribute(gp,i);joint.y+=height*.69;const hits=new T.Raycaster(joint,direction,1e-6,1).intersectObject(cap);assert.equal(hits.length%2,1,'gill upper edge detached from cap');}
   for(const geo of Object.values(forms))geo.dispose();cap.material.dispose();
  }
 });
 await test('native fungi keep all supported cells, material roles, source poses and bounded cost',()=>{
  g.view.renderCaverns(g);assert.deepEqual([g.view.caveSupportBatches.batches.length,g.view.deepSupportBatches.batches.length,g.view.expeditionSupportBatches.batches.length],[16,19,10]);
  const caps=g.view.caveGrowth.filter(n=>n.root.userData.formation==='lantern-cap');assert.equal(caps.length,14);for(const n of caps){const sources=entries().filter(e=>e.record===n);assert.equal(sources.length,3);assert.deepEqual(sources.map(e=>e.mesh.geometry.userData.fungalPart).sort(),['cap','gills','stem']);assert.equal(new Set(sources.map(e=>e.mesh.material)).size,2);for(const e of sources){assert.equal(e.mesh.material.side,T.FrontSide);assert.ok(e.mesh.material.vertexColors);}}
  let triangles=0,meshes=0;g.view.cavernScene.traverse(m=>{if(m.isMesh){meshes++;triangles+=m.geometry.index?.count/3||m.geometry.attributes.position.count/3;}});assert.equal(meshes,114);assert.ok(triangles<=110000);contact();
 });
 await test('support excavation removes all three pieces and portable reload retains removal and root contacts',async()=>{
  const site=g.view.caveGrowth.find(n=>n.root.userData.formation==='lantern-cap'&&n.root.visible);assert.ok(g.world.carve(site.anchor,.7));g.view.renderCaverns(g);assert.equal(site.root.visible,false);for(const batch of g.view.caveSupportBatches.batches){for(let i=0;i<batch.entries.length;i++)if(batch.entries[i].record===site)assert.equal(batch.states[i],false);}
  const field=g.world.field.slice(),mask=g.view.caveGrowth.map(n=>n.root.visible),save=B2.Saves.snapshot(g),state=structuredClone(save.state);await g.install(B2.Saves.validate(save));g.view.renderCaverns(g);assert.deepEqual(g.world.field,field);assert.deepEqual(g.economy.state,state);assert.deepEqual(g.view.caveGrowth.map(n=>n.root.visible),mask);contact();
 });
}finally{h.close();clearInterval(g.net.timer);}
console.log(`COMPLETE ${fungalArtChecks} fungal art checks passed (inert renderer; no input or timing claim)`);
