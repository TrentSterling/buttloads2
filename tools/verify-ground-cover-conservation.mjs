// Compare actual frozen baseline construction with current native source.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),root=new URL('../',import.meta.url),sha=data=>createHash('sha256').update(data).digest('hex');
const signature=(g,group=g.view.commonScene)=>{
 const groups=new Map();let vertices=0,triangles=0,meshes=0;
 for(const mesh of group.children.filter(m=>m.isMesh)){
  meshes++;const geo=mesh.geometry,n=geo.index?.count||geo.attributes.position.count,names=Object.keys(geo.attributes).filter(k=>geo.attributes[k].count===geo.attributes.position.count).sort(),mat=mesh.material,key=[mat.color.getHexString(),mat.metalness,mat.roughness,mat.side,mat.vertexColors,!!mat.map,names.join(',')].join(':');
  if(!groups.has(key))groups.set(key,[]);const records=groups.get(key);vertices+=geo.attributes.position.count;triangles+=n/3;
  const values=new Float32Array(names.reduce((n,k)=>n+geo.attributes[k].itemSize*3,0));
  for(let i=0;i<n;i+=3){let at=0;for(let j=0;j<3;j++){const id=geo.index?geo.index.getX(i+j):i+j;for(const k of names){const a=geo.attributes[k];values.set(a.array.subarray(id*a.itemSize,(id+1)*a.itemSize),at);at+=a.itemSize;}}records.push(sha(new Uint8Array(values.buffer)));}
 }
 return{meshes,vertices,triangles,materials:[...groups].map(([key,records])=>({key,triangles:records.length,sha256:sha(records.sort().join(''))})).sort((a,b)=>a.key.localeCompare(b.key)),obstacles:g.view.obstacles,trees:g.view.commonTrees,meadow:g.view.commonMeadow,terrainSha256:sha(new Uint8Array(g.world.field.buffer,g.world.field.byteOffset,g.world.field.byteLength))};
};

const old=await nodeGame({commonViewSource:fs.readFileSync(new URL('ground-cover-before/common-view.js',out),'utf8')});
const ground=g=>g.view.surfaceGround.map(m=>({triangles:m.geometry.index.count/3,attributes:Object.fromEntries(['position','normal','uv'].map(k=>[k,sha(new Uint8Array(m.geometry.attributes[k].array.buffer))])),index:sha(new Uint8Array(m.geometry.index.array.buffer)),colourSha256:sha(new Uint8Array(m.geometry.attributes.color.array.buffer))}));
const capture=g=>({common:signature(g),ground:ground(g),other:Object.fromEntries(['perimeterScene','ridgeline','verge'].map(key=>[key,signature(g,g.view[key])])),gardens:g.view.commonGardens,rocks:g.view.commonRocks,understory:g.view.commonUnderstory,ridgeBounds:g.view.ridgeBounds});
let before;try{before=capture(old.game);}finally{clearInterval(old.game.net.timer);old.close();}
const current=await nodeGame();let after,cover;try{after=capture(current.game);cover={inventory:signature(current.game,current.game.view.groundCoverScene),records:current.game.view.groundCoverRecords};}finally{clearInterval(current.game.net.timer);current.close();}
assert.deepEqual(after.common,before.common);assert.deepEqual(after.other,before.other);for(const key of ['gardens','rocks','understory','ridgeBounds'])assert.deepEqual(after[key],before[key]);for(let i=0;i<before.ground.length;i++){const {colourSha256:b,...base}=before.ground[i],{colourSha256:a,...final}=after.ground[i];assert.deepEqual(final,base);assert.notEqual(a,b);}
const report={date:new Date().toISOString(),before,after,cover,sourceSha256:Object.fromEntries(['common-view.js','ground-cover.js'].map(name=>[name,sha(fs.readFileSync(new URL('src/'+name,root)))])),scope:'Exact oriented triangle attributes preserve all previous common/perimeter/ridge/verge geometry, materials, contacts, placement and terrain. Base ground positions, normals, UVs and indices stay exact; only its colours change. New cover is separate native geometry. No timing or human-input claim.'};fs.writeFileSync(new URL('ground-cover-conservation.json',out),JSON.stringify(report,null,2));console.log('COMPLETE ground-cover conservation: '+after.common.triangles+' common triangles preserved; all other measured scenery, ground geometry, contacts, placement and terrain match; '+cover.inventory.triangles+' separate cover triangles.');
