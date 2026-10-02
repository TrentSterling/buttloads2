// Compare actual frozen baseline construction with current native source.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),root=new URL('../',import.meta.url),sha=data=>createHash('sha256').update(data).digest('hex');
const signature=g=>{
 const groups=new Map();let vertices=0,triangles=0,meshes=0;
 for(const mesh of g.view.commonScene.children.filter(m=>m.isMesh)){
  meshes++;const geo=mesh.geometry,n=geo.index?.count||geo.attributes.position.count,names=Object.keys(geo.attributes).filter(k=>geo.attributes[k].count===geo.attributes.position.count).sort(),mat=mesh.material,key=[mat.color.getHexString(),mat.metalness,mat.roughness,mat.side,mat.vertexColors,!!mat.map,names.join(',')].join(':');
  if(!groups.has(key))groups.set(key,[]);const records=groups.get(key);vertices+=geo.attributes.position.count;triangles+=n/3;
  const values=new Float32Array(names.reduce((n,k)=>n+geo.attributes[k].itemSize*3,0));
  for(let i=0;i<n;i+=3){let at=0;for(let j=0;j<3;j++){const id=geo.index?geo.index.getX(i+j):i+j;for(const k of names){const a=geo.attributes[k];values.set(a.array.subarray(id*a.itemSize,(id+1)*a.itemSize),at);at+=a.itemSize;}}records.push(sha(new Uint8Array(values.buffer)));}
 }
 return{meshes,vertices,triangles,materials:[...groups].map(([key,records])=>({key,triangles:records.length,sha256:sha(records.sort().join(''))})).sort((a,b)=>a.key.localeCompare(b.key)),obstacles:g.view.obstacles,trees:g.view.commonTrees,meadow:g.view.commonMeadow,terrainSha256:sha(new Uint8Array(g.world.field.buffer,g.world.field.byteOffset,g.world.field.byteLength))};
};
const old=await nodeGame({commonViewSource:fs.readFileSync(new URL('foliage-batching-before/common-view.js',out),'utf8'),minerArtSource:fs.readFileSync(new URL('foliage-batching-before/miner-art.js',out),'utf8')});
let before;try{before=signature(old.game);}finally{clearInterval(old.game.net.timer);old.close();}
const current=await nodeGame();let after;try{after=signature(current.game);}finally{clearInterval(current.game.net.timer);current.close();}
for(const key of ['vertices','triangles','materials','obstacles','trees','meadow','terrainSha256'])assert.deepEqual(after[key],before[key],'Foliage partition changed '+key);
const report={date:new Date().toISOString(),before,after,sourceSha256:Object.fromEntries(['common-view.js','miner-art.js'].map(name=>[name,sha(fs.readFileSync(new URL('src/'+name,root)))])),scope:'Exact per-material sorted oriented triangle hashes include original position, normal, UV and color records. Canonical geometry and contact comparison, not FPS or human input testing.'};
fs.writeFileSync(new URL('foliage-batching-conservation.json',out),JSON.stringify(report,null,2));console.log('COMPLETE foliage conservation: '+after.triangles+' triangles and '+after.vertices+' vertex records preserved exactly; material attributes, contacts, placement and terrain match frozen baseline.');
