// Freeze every other native scene component and gameplay field. No browser/input.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex'),bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
function capture(g){
 const v=g.view;v.renderCaverns(g);v.renderDeep(g,10);v.renderExpedition(g,0,10);v.scene.updateWorldMatrix(true,true);const excluded=new Set([v.rootway,...v.salvageModels,...v.vaultModels,v.heartModel]),groups={};
 for(const name of ['commonScene','cavernScene','deepScene','discovery']){
  const records=[];let triangles=0,meshes=0;v[name].traverse(m=>{for(let n=m;n;n=n.parent)if(excluded.has(n))return;
   if(m.isLight){records.push(JSON.stringify({light:m.type,color:m.color.getHexString(),intensity:m.intensity,distance:m.distance,decay:m.decay,matrix:m.matrixWorld.toArray()}));return;}if(!m.isMesh)return;
   const geo=m.geometry,mat=m.material;triangles+=(geo.index?.count||geo.attributes.position.count)/3;meshes++;
   records.push(JSON.stringify({attributes:Object.keys(geo.attributes).sort().map(k=>[k,geo.attributes[k].itemSize,sha(bytes(geo.attributes[k].array))]),index:geo.index?sha(bytes(geo.index.array)):null,range:geo.drawRange,matrix:m.matrixWorld.toArray(),visible:m.visible,cast:m.castShadow,receive:m.receiveShadow,layers:m.layers.mask,material:[mat.type,mat.color?.getHexString(),mat.emissive?.getHexString(),mat.emissiveIntensity,mat.metalness,mat.roughness,mat.side,mat.transparent,mat.opacity,mat.vertexColors]}));
  });records.sort();groups[name]={meshes,triangles,sha256:sha(JSON.stringify(records))};
 }
 return{groups,terrainSha256:sha(bytes(g.world.field)),contacts:v.obstacles,caveAnchors:v.caveGrowth.map(n=>n.anchor),deepAnchors:v.deepGrowth.map(n=>n.anchor),expeditionAnchors:v.growth.map(n=>[n.x,n.y,n.z]),batches:[v.caveSupportBatches.batches.length,v.deepSupportBatches.batches.length,v.expeditionSupportBatches.batches.length],state:structuredClone(g.economy.state),ore:g.deposits.nodes.map(n=>[n.id,n.kind,n.x,n.y,n.z,n.collected]),rootPoses:[v.rootway,...v.salvageModels,...v.vaultModels,v.heartModel].map(r=>({position:r.position.toArray(),quaternion:r.quaternion.toArray(),visible:r.visible}))};
}
const old=await nodeGame({sources:Object.fromEntries(['scenery','deep-view'].map(n=>[n,fs.readFileSync(new URL('mine-asset-before/'+n+'.js',out),'utf8')]))});let before;try{before=capture(old.game);}finally{old.close();}
const live=await nodeGame();let after;try{after=capture(live.game);}finally{live.close();}
assert.deepEqual(after,before);
const report={date:new Date().toISOString(),...after,exact:true,sourceSha256:Object.fromEntries(['mine-asset-art.js','scenery.js','deep-view.js'].map(n=>[n,sha(fs.readFileSync(new URL('../src/'+n,import.meta.url)))])),scope:'Every other common/cavern/deep/discovery mesh attribute, index, draw range, transform, material, shadow flag and light remains exact. Terrain, contacts, support anchors, supported batch counts, ore, economy and the seven changed root poses/state remain exact. No input or timing claim.'};
fs.writeFileSync(new URL('mine-asset-conservation.json',out),JSON.stringify(report,null,2));console.log('COMPLETE mine asset conservation: all four other native scene groups, lights, terrain, contacts, support, ore, economy and root poses remain exact.');console.log(JSON.stringify(after.groups));
