// Full oriented triangle conservation against the frozen 2.40.1 construction.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),names=['residents','ruins','town-view'],sources=Object.fromEntries(names.map(k=>[k,fs.readFileSync(new URL('prop-merge-before/'+k+'.js',out),'utf8')])),sha=data=>createHash('sha256').update(data).digest('hex');
function capture(g){
 const v=g.view,groups={};
 for(const phase of ['rest','close','blink','solved']){
  g.player.teleport(phase==='close'?-23.7:6,.06,phase==='close'?51:6);
  for(const rig of [...v.townRigs,v.bellPerson])v.animateResident(rig,g,phase==='blink'?5.23:phase==='solved'?14:2,phase!=='rest');
  g.mysteries.state.solved=phase==='solved'?[0]:[];g.mysteries.state.mirrors=phase==='solved'?[1,0]:[2,3];g.mysteries.connected=phase==='solved'?3:0;v.renderMysteries(g,phase==='solved'?14:2);v.scene.updateWorldMatrix(true,true);
 for(const name of ['townScene','ruins','rescueScene']){
  const triangles=[],inventory={meshes:0,triangles:0,vertices:0};v[name].traverse(mesh=>{if(!mesh.isMesh)return;const geo=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),attrs=Object.keys(geo.attributes).sort(),m=mesh.material,key=[m.type,m.color.getHexString(),m.emissive?.getHexString(),m.emissiveIntensity,m.metalness,m.roughness,m.side,m.transparent,m.opacity,m.depthWrite,mesh.castShadow,mesh.receiveShadow,mesh.layers.mask,mesh.renderOrder,attrs.join(',')].join(':'),indices=geo.index?.array||Array.from({length:geo.attributes.position.count},(_,i)=>i);inventory.meshes++;inventory.triangles+=indices.length/3;inventory.vertices+=geo.attributes.position.count;
   for(let i=0;i<indices.length;i+=3){const positions=[],data=[];for(let j=0;j<3;j++){const id=indices[i+j];for(const name of attrs){const a=geo.attributes[name];data.push(...a.array.subarray(id*a.itemSize,(id+1)*a.itemSize));}positions.push(...geo.attributes.position.array.subarray(id*3,id*3+3));}triangles.push({key,center:[0,1,2].map(k=>(positions[k]+positions[k+3]+positions[k+6])/3),data});}geo.dispose();});groups[phase+':'+name]={inventory,triangles};
 }
 }
 return{groups,terrainSha256:sha(new Uint8Array(g.world.field.buffer)),contacts:v.obstacles,economy:structuredClone(g.economy.state),ore:g.deposits.nodes.map(n=>[n.id,n.x,n.y,n.z,n.collected])};
}
const baseline=await nodeGame({sources});let before;try{before=capture(baseline.game);}finally{clearInterval(baseline.game.net.timer);baseline.close();}
const current=await nodeGame();let after;try{after=capture(current.game);}finally{clearInterval(current.game.net.timer);current.close();}
for(const key of ['terrainSha256','contacts','economy','ore'])assert.deepEqual(after[key],before[key]);
const tolerance=4e-5,groups={};
for(const name of Object.keys(before.groups)){
 const old=before.groups[name],next=after.groups[name],buckets=new Map(),key=(t,c=t.center)=>t.key+':'+c.map(v=>Math.floor(v/.05)).join(':');assert.equal(next.inventory.triangles,old.inventory.triangles);assert.equal(next.inventory.vertices,old.inventory.vertices);
 for(const t of old.triangles){const k=key(t);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(t);}let maximum=0;
 for(const t of next.triangles){let found=false;for(const delta of [[0,0,0],...Array.from({length:27},(_,i)=>[i%3-1,Math.floor(i/3)%3-1,Math.floor(i/9)-1])]){const list=buckets.get(key(t,t.center.map((v,i)=>v+delta[i]*.05)));if(!list)continue;const at=list.findIndex(old=>old.data.length===t.data.length&&old.data.every((value,i)=>Math.abs(value-t.data[i])<=tolerance));if(at<0)continue;const matched=list.splice(at,1)[0];for(let i=0;i<t.data.length;i++)maximum=Math.max(maximum,Math.abs(t.data[i]-matched.data[i]));found=true;break;}assert.ok(found,'Unmatched '+name+' triangle near '+t.center);}
 assert.ok([...buckets.values()].every(list=>!list.length));groups[name]={before:old.inventory,after:next.inventory,maximumAttributeDifference:maximum};
}
const report={date:new Date().toISOString(),groups,tolerance,removedMeshes:['townScene','ruins','rescueScene'].reduce((n,k)=>n+groups['rest:'+k].before.meshes-groups['rest:'+k].after.meshes,0),terrainSha256:after.terrainSha256,contactsExact:true,economyExact:true,sourceSha256:Object.fromEntries(names.map(name=>[name+'.js',sha(fs.readFileSync(new URL('../src/'+name+'.js',import.meta.url)))])),scope:'Rest, conversational, blinking and solved/turned poses match all model triangles, vertex records and material/shadow/layer state against frozen construction; every position, normal and UV compared. No timing or physical input claim.'};
fs.writeFileSync(new URL('prop-merge-conservation.json',out),JSON.stringify(report,null,2));console.log('COMPLETE prop merge conservation: '+JSON.stringify(report));
