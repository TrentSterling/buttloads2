// Subtract only the frozen baseline wall; preserve every other common triangle.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),root=new URL('../',import.meta.url),sha=data=>createHash('sha256').update(data).digest('hex');
function records(group){
 const buckets=new Map();let triangles=0,meshes=0;
 group.traverse(mesh=>{if(!mesh.isMesh)return;meshes++;assert.deepEqual(mesh.matrix.elements,new THREE.Matrix4().elements,'unexpected transformed static geometry');
  const geo=mesh.geometry,n=geo.index?.count||geo.attributes.position.count,names=Object.keys(geo.attributes).filter(k=>geo.attributes[k].count===geo.attributes.position.count).sort(),m=mesh.material,key=[m.color.getHexString(),m.metalness,m.roughness,m.side,m.vertexColors,!!m.map,names.join(',')].join(':');
  if(!buckets.has(key))buckets.set(key,new Map());const counts=buckets.get(key),values=new Float32Array(names.reduce((n,k)=>n+geo.attributes[k].itemSize*3,0));
  for(let i=0;i<n;i+=3){let at=0;for(let j=0;j<3;j++){const id=geo.index?geo.index.getX(i+j):i+j;for(const k of names){const a=geo.attributes[k];values.set(a.array.subarray(id*a.itemSize,(id+1)*a.itemSize),at);at+=a.itemSize;}}const hash=sha(new Uint8Array(values.buffer));counts.set(hash,(counts.get(hash)||0)+1);triangles++;}
 });return{buckets,triangles,meshes};
}
const summary=r=>({triangles:r.triangles,meshes:r.meshes,materials:[...r.buckets].map(([key,counts])=>({key,triangles:[...counts.values()].reduce((a,b)=>a+b,0),sha256:sha([...counts].sort(([a],[b])=>a.localeCompare(b)).map(([h,n])=>h+':'+n).join('|'))})).sort((a,b)=>a.key.localeCompare(b.key))});
const state=g=>({obstacles:g.view.obstacles,trees:g.view.commonTrees,meadow:g.view.commonMeadow,gardens:g.view.commonGardens,rocks:g.view.commonRocks,ridgeBounds:g.view.ridgeBounds,terrainSha256:sha(new Uint8Array(g.world.field.buffer,g.world.field.byteOffset,g.world.field.byteLength))});
const old=await nodeGame({commonViewSource:fs.readFileSync(new URL('perimeter-before/common-view.js',out),'utf8')});let before,remaining,oldState,unchangedBefore,removed;
try{
 const g=old.game,wall=new THREE.Group(),[stone,,moss]=g.view.commonRockMaterials;
 for(const [a,b]of [[[-58.3,-50.3],[-58.3,68.3]],[[58.3,-50.3],[58.3,68.3]],[[-58.3,-50.3],[58.3,-50.3]],[[-58.3,68.3],[58.3,68.3]]]){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/1.6);for(let i=0;i<steps;i++){const t=(i+.5)/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,y=B2.COMMON.height(x,z),yaw=Math.atan2(a[1]-b[1],b[0]-a[0]);for(let row=0;row<3;row++)g.view.box(wall,x,y+.18+row*.31,z,length/steps+.04,.30,row===2?.52:.66,row===1?moss:stone,yaw);}
 }
 g.view.merge(wall);const original=records(g.view.commonScene),remove=records(wall);before=summary(original);removed=summary(remove);assert.equal(remove.triangles,10656);
 for(const [key,counts]of remove.buckets){const target=original.buckets.get(key);assert.ok(target);for(const [hash,n]of counts){assert.ok(target.get(hash)>=n,'Frozen wall triangle not found in baseline');const left=target.get(hash)-n;if(left)target.set(hash,left);else target.delete(hash);}}
 original.triangles-=remove.triangles;remaining=summary(original);oldState=state(g);unchangedBefore=Object.fromEntries(['ridgeline','verge'].map(key=>[key,summary(records(g.view[key]))]));
}finally{clearInterval(old.game.net.timer);old.close();}
const current=await nodeGame();let after,currentState,perimeter,unchangedAfter;
try{const g=current.game;after=summary(records(g.view.commonScene));perimeter=summary(records(g.view.perimeterScene));currentState=state(g);unchangedAfter=Object.fromEntries(['ridgeline','verge'].map(key=>[key,summary(records(g.view[key]))]));}finally{clearInterval(current.game.net.timer);current.close();}
assert.equal(after.triangles,remaining.triangles);assert.deepEqual(after.materials,remaining.materials);assert.deepEqual(currentState,oldState);assert.deepEqual(unchangedAfter,unchangedBefore);
const report={date:new Date().toISOString(),before,removed,remaining,after,perimeter,modelTriangleDelta:after.triangles+perimeter.triangles-before.triangles,state:currentState,unchanged:unchangedAfter,sourceSha256:Object.fromEntries(['common-view.js','perimeter-art.js'].map(name=>[name,sha(fs.readFileSync(new URL('src/'+name,root)))])),scope:'Exact oriented position/normal/UV/colour triangle multisets after subtracting only the 10,656 old wall triangles. Common scenery, ridges, verge, contacts, placements and terrain stay exact. No frame timing or human-input claim.'};
fs.writeFileSync(new URL('perimeter-conservation.json',out),JSON.stringify(report,null,2));console.log('COMPLETE perimeter conservation: '+after.triangles+' other common triangles preserved exactly; '+perimeter.triangles+' new wall triangles, net '+report.modelTriangleDelta+'; contacts, placement, ridges, verge and terrain match.');
