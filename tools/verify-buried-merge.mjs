// Compare complete native model triangles against frozen pre-merge construction.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),sha=data=>createHash('sha256').update(data).digest('hex'),sources=Object.fromEntries(['scenery','cavern-view','deep-view'].map(k=>[k,fs.readFileSync(new URL('buried-merge-before/'+k+'.js',out),'utf8')]));
function capture(g){
 const v=g.view,T=THREE,packed=new Map();for(const name of ['caveSupportBatches','deepSupportBatches','expeditionSupportBatches'])for(const b of v[name]?.batches||[])packed.set(b.mesh,b.entries.flatMap(e=>Array.from(e.indices)));
 v.renderExpedition(g,0,10);v.renderCaverns(g);v.renderDeep(g,10);v.scene.updateWorldMatrix(true,true);const groups={};
 for(const name of ['cavernScene','deepScene','discovery']){const triangles=[],inventory={meshes:0,triangles:0,vertices:0};v[name].traverse(mesh=>{if(!mesh.isMesh)return;const geo=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),names=Object.keys(geo.attributes).sort(),m=mesh.material,key=[m.type,m.color.getHexString(),m.emissive?.getHexString(),m.emissiveIntensity,m.metalness,m.roughness,m.side,m.transparent,m.opacity,mesh.castShadow,mesh.receiveShadow,mesh.layers.mask,names.join(',')].join(':'),indices=packed.get(mesh)||Array.from(geo.index?.array||Array.from({length:geo.attributes.position.count},(_,i)=>i));inventory.meshes++;inventory.vertices+=geo.attributes.position.count;inventory.triangles+=indices.length/3;
  for(let i=0;i<indices.length;i+=3){const p=[],data=[];for(let j=0;j<3;j++){const id=indices[i+j];for(const name of names){const a=geo.attributes[name];data.push(...a.array.subarray(id*a.itemSize,(id+1)*a.itemSize));}const a=geo.attributes.position;p.push(...a.array.subarray(id*3,id*3+3));}const center=[0,1,2].map(k=>(p[k]+p[k+3]+p[k+6])/3);triangles.push({key,center,data});}geo.dispose();});groups[name]={inventory,triangles};}
 return{groups,terrainSha256:sha(new Uint8Array(g.world.field.buffer,g.world.field.byteOffset,g.world.field.byteLength)),contacts:v.obstacles,caveAnchors:v.caveGrowth.map(n=>n.anchor),deepAnchors:v.deepGrowth.map(n=>n.anchor),expeditionAnchors:v.growth.map(n=>[n.x,n.y,n.z]),state:JSON.parse(JSON.stringify(g.economy.state))};
}
const baseline=await nodeGame({sources});let before;try{before=capture(baseline.game);}finally{clearInterval(baseline.game.net.timer);baseline.close();}
const current=await nodeGame();let after;try{after=capture(current.game);}finally{clearInterval(current.game.net.timer);current.close();}
for(const key of ['terrainSha256','contacts','caveAnchors','deepAnchors','expeditionAnchors','state'])assert.deepEqual(after[key],before[key]);
const tolerance=4e-5,results={};
for(const name of Object.keys(before.groups)){
 const b=before.groups[name],a=after.groups[name],buckets=new Map(),key=(t,c=t.center)=>t.key+':'+c.map(v=>Math.floor(v/.05)).join(':');assert.equal(a.inventory.triangles,b.inventory.triangles);
 for(const t of b.triangles){const k=key(t);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(t);}let maximum=0;
 for(const t of a.triangles){let found=false;for(const [dx,dy,dz]of [[0,0,0],...Array.from({length:27},(_,i)=>[i%3-1,Math.floor(i/3)%3-1,Math.floor(i/9)-1])]){const list=buckets.get(key(t,t.center.map((v,i)=>v+[dx,dy,dz][i]*.05)));if(!list)continue;const at=list.findIndex(old=>old.data.length===t.data.length&&old.data.every((value,i)=>Math.abs(value-t.data[i])<=tolerance));if(at<0)continue;const old=list.splice(at,1)[0];for(let i=0;i<t.data.length;i++)maximum=Math.max(maximum,Math.abs(t.data[i]-old.data[i]));found=true;break;}assert.ok(found,'Unmatched '+name+' oriented triangle near '+t.center.join(','));}
 assert.ok([...buckets.values()].every(list=>list.length===0));results[name]={before:b.inventory,after:a.inventory,maximumAttributeDifference:maximum};
}
const report={date:new Date().toISOString(),groups:results,tolerance,terrainSha256:after.terrainSha256,contactsExact:true,anchorsExact:true,stateExact:true,sourceSha256:Object.fromEntries(['scenery.js','cavern-view.js','deep-view.js','support-batches.js'].map(name=>[name,sha(fs.readFileSync(new URL('../src/'+name,import.meta.url)))])),scope:'Complete oriented model triangles matched by material, shadow/layer state and every position/normal/UV/colour attribute within 0.00004 absolute. Supported batches use their complete immutable source index ranges, including currently hidden support, rather than unused dynamic-index capacity. No input or timing claim.'};fs.writeFileSync(new URL('buried-merge-conservation.json',out),JSON.stringify(report,null,2));console.log('COMPLETE buried merge conservation: '+JSON.stringify(results));
