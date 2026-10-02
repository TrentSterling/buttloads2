// Frozen pre-art comparison. No GPU, browser, input or timing measurement.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex'),types=new Set(['lantern-shelves','chalk-drapery','amethyst-fan']);
const bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
function capture(g){
 const v=g.view;v.renderCaverns(g);v.renderDeep(g,10);v.renderExpedition(g,0,10);v.scene.updateWorldMatrix(true,true);const groups={};
 for(const name of ['commonScene','cavernScene','deepScene','discovery']){
  const records=[];let triangles=0,meshes=0;v[name].traverse(m=>{if(!m.isMesh)return;for(let n=m;n;n=n.parent)if(types.has(n.userData.formation))return;
   const geo=m.geometry,mat=m.material;triangles+=(geo.index?.count||geo.attributes.position.count)/3;meshes++;
   records.push(JSON.stringify({attributes:Object.keys(geo.attributes).sort().map(k=>[k,geo.attributes[k].itemSize,sha(bytes(geo.attributes[k].array))]),index:geo.index?sha(bytes(geo.index.array)):null,range:geo.drawRange,matrix:m.matrixWorld.toArray(),visible:m.visible,cast:m.castShadow,receive:m.receiveShadow,layers:m.layers.mask,material:[mat.type,mat.color?.getHexString(),mat.emissive?.getHexString(),mat.emissiveIntensity,mat.metalness,mat.roughness,mat.side,mat.transparent,mat.opacity,mat.vertexColors]}));
  });records.sort();groups[name]={meshes,triangles,sha256:sha(JSON.stringify(records))};
 }
 return{groups,terrainSha256:sha(bytes(g.world.field)),contacts:v.obstacles,landmarks:v.caveGrowth.filter(n=>types.has(n.root.userData.formation)).map(n=>({type:n.root.userData.formation,anchor:n.anchor,position:n.root.position.toArray(),quaternion:n.root.quaternion.toArray()})),caveAnchors:v.caveGrowth.map(n=>n.anchor),deepAnchors:v.deepGrowth.map(n=>n.anchor),expeditionAnchors:v.growth.map(n=>[n.x,n.y,n.z]),accentSites:v.caveAccentSites.map(n=>({point:n.point.toArray(),color:n.color})),state:structuredClone(g.economy.state),ore:g.deposits.nodes.map(n=>[n.id,n.kind,n.x,n.y,n.z,n.collected]),supportedBatches:v.caveSupportBatches.batches.length};
}
const old=await nodeGame({sources:{'underground-view':fs.readFileSync(new URL('cave-form-before/underground-view.js',out),'utf8')}});let before;try{before=capture(old.game);}finally{old.close();}
const live=await nodeGame();let after;try{after=capture(live.game);}finally{live.close();}
assert.deepEqual(after,before);
const report={date:new Date().toISOString(),...after,exact:true,sourceSha256:Object.fromEntries(['cave-form-art.js','underground-view.js'].map(n=>[n,sha(fs.readFileSync(new URL('../src/'+n,import.meta.url)))])),scope:'All other common/cavern/deep/discovery native attributes, indices, draw ranges, transforms, material and shadow state remain byte-exact. Terrain, contacts, all support anchors, landmark root poses, accents, ore and economy state remain exact. No input or frame-time claim.'};
fs.writeFileSync(new URL('cave-form-conservation.json',out),JSON.stringify(report,null,2));console.log('COMPLETE cave form conservation: all '+Object.keys(after.groups).length+' other scene groups, terrain, contacts, anchors, accent sites, ore and economy remain exact.');console.log(JSON.stringify(after.groups));
