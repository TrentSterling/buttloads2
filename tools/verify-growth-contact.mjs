// Geometry/presentation conservation against the frozen pre-art production source.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),files=['beauty','cavern-view','deep-view','scenery','cave-form-art'],sha=v=>createHash('sha256').update(v).digest('hex'),bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
function capture(g){
 const v=g.view;v.renderCaverns(g);v.renderDeep(g,10);v.renderExpedition(g,0,10);v.scene.updateWorldMatrix(true,true);const groups={},cost={};
 for(const name of ['commonScene','cavernScene','deepScene','discovery']){const records=[];let triangles=0,meshes=0;v[name].traverse(m=>{if(!m.isMesh)return;const geo=m.geometry,mat=m.material;triangles+=(geo.index?.count||geo.attributes.position.count)/3;meshes++;if(m.name==='supported-growth')return;
  records.push(JSON.stringify({attributes:Object.keys(geo.attributes).sort().map(k=>[k,geo.attributes[k].itemSize,sha(bytes(geo.attributes[k].array))]),index:geo.index?sha(bytes(geo.index.array)):null,range:geo.drawRange,matrix:m.matrixWorld.toArray(),visible:m.visible,cast:m.castShadow,receive:m.receiveShadow,layers:m.layers.mask,material:[mat.type,mat.color?.getHexString(),mat.emissive?.getHexString(),mat.emissiveIntensity,mat.metalness,mat.roughness,mat.side,mat.transparent,mat.opacity,mat.vertexColors]}));
 });records.sort();groups[name]={meshes:records.length,sha256:sha(JSON.stringify(records))};cost[name]={meshes,triangles};}
 const systems=[['upper',v.caveGrowth,v.caveSupportBatches],['deep',v.deepGrowth,v.deepSupportBatches],['expedition',v.growth,v.expeditionSupportBatches]];
 const ownership=systems.map(([name,records,system])=>({name,batches:system.batches.map(b=>({entries:b.entries.map(e=>({index:records.indexOf(e.record),transform:e.transform.toArray(),visible:e.mesh.visible})),states:b.states,visible:b.mesh.visible,cast:b.mesh.castShadow,receive:b.mesh.receiveShadow,layers:b.mesh.layers.mask,material:[b.mesh.material.color.getHexString(),b.mesh.material.emissive.getHexString(),b.mesh.material.emissiveIntensity,b.mesh.material.roughness,b.mesh.material.metalness,b.mesh.material.side]}))}));

 const contact={},shapes={};
 const untouchedSupported=systems.map(([name,records,system])=>({name,sources:system.batches.flatMap(b=>b.entries).map(e=>{const geo=e.mesh.geometry,p=geo.attributes.position,key=name+':'+records.indexOf(e.record)+':'+system.batches.flatMap(b=>b.entries).indexOf(e);shapes[key]={mounted:!!geo.userData.growthMount,positions:Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(e.transform).toArray()).flat(),indices:Array.from(geo.index.array)};
  if(geo.userData.ordinaryGrowth){const ids=geo.userData.rootVertices||Array.from({length:p.count},(_,i)=>i).filter(i=>Math.abs(p.getY(i)-geo.boundingBox.min.y)<1e-6),r=contact[name]||{vertices:0,air:0,min:Infinity,max:-Infinity};for(const i of ids){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(e.transform),d=g.world.density(v.x,v.y,v.z);r.vertices++;if(d>0)r.air++;r.min=Math.min(r.min,d);r.max=Math.max(r.max,d);}contact[name]=r;}
  return{index:records.indexOf(e.record),type:geo.type,transform:e.transform.toArray(),vertices:p.count,attributes:Object.keys(geo.attributes).filter(k=>!['position','normal'].includes(k)).sort().map(k=>[k,sha(bytes(geo.attributes[k].array))]),indices:sha(bytes(geo.index.array))};
 })}));
 return{preserved:{groups,ownership,untouchedSupported,terrainSha256:sha(bytes(g.world.field)),contacts:v.obstacles,caveRoots:v.caveGrowth.map(n=>({type:n.root.userData.formation,anchor:n.anchor,position:n.root.position.toArray(),quaternion:n.root.quaternion.toArray()})),deepRoots:v.deepGrowth.map(n=>({anchor:n.anchor,position:n.root.position.toArray(),quaternion:n.root.quaternion.toArray()})),expeditionRoots:v.growth.map(n=>({anchor:[n.x,n.y,n.z],position:n.mesh.position.toArray(),quaternion:n.mesh.quaternion.toArray()})),accentSites:v.caveAccentSites.map(n=>({point:n.point.toArray(),color:n.color})),state:structuredClone(g.economy.state),ore:g.deposits.nodes.map(n=>[n.id,n.kind,n.x,n.y,n.z,n.collected])},cost,contact,shapes};
}
const sources=Object.fromEntries(files.map(n=>[n,fs.readFileSync(new URL('growth-contact-before/'+n+'.js',out),'utf8')]));
const old=await nodeGame({sources});let before;try{before=capture(old.game);}finally{old.close();clearInterval(old.game.net.timer);}
const live=await nodeGame();let after;try{after=capture(live.game);}finally{live.close();clearInterval(live.game.net.timer);}
assert.deepEqual(after.preserved,before.preserved);assert.deepEqual(Object.values(after.cost).map(v=>v.meshes),Object.values(before.cost).map(v=>v.meshes));

let maxEdgeError=0,mountedSources=0,unchangedSources=0;
for(const [key,a]of Object.entries(after.shapes)){const b=before.shapes[key];assert.ok(b);assert.deepEqual(a.indices,b.indices);assert.equal(a.positions.length,b.positions.length);
 if(!a.mounted){assert.deepEqual(a.positions,b.positions);unchangedSources++;continue;}mountedSources++;
 for(let i=0;i<a.indices.length;i+=3)for(let j=0;j<3;j++){const x=a.indices[i+j]*3,y=a.indices[i+(j+1)%3]*3,length=s=>Math.hypot(s.positions[x]-s.positions[y],s.positions[x+1]-s.positions[y+1],s.positions[x+2]-s.positions[y+2]);maxEdgeError=Math.max(maxEdgeError,Math.abs(length(a)-length(b)));}
}
assert.ok(maxEdgeError<2e-6,'Mount deformed world triangles: '+maxEdgeError);for(const r of Object.values(after.contact))assert.equal(r.air,0);
const report={date:new Date().toISOString(),exact:true,maxEdgeError,mountedSources,unchangedSources,contact:{before:before.contact,after:after.contact},before:before.cost,after:after.cost,preserved:after.preserved,sourceSha256:Object.fromEntries(files.map(n=>[n+'.js',sha(fs.readFileSync(new URL('../src/'+n+'.js',import.meta.url)))])),scope:'Root mounting rigidly moves existing upper/deep supported geometry; every UV, colour, index, vertex count and triangle edge is preserved. Expedition source positions remain byte-exact. All other common/cavern/deep/discovery native geometry, material, transforms and shadow flags remain byte-exact. Terrain, contacts, all original support anchors and poses, batch ownership/masks, accent sites, ore and economy remain exact. The existing 45 cells and all other native art remain. No input or frame-time claim.'};
fs.writeFileSync(new URL('growth-contact-conservation.json',out),JSON.stringify(report,null,2));console.log('COMPLETE native growth contact conservation: four other scene inventories and world/support state exact.');console.log(JSON.stringify({before:before.cost,after:after.cost}));
