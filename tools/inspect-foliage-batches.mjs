// CPU inventory of production static foliage; no renderer or input timings.
import fs from 'node:fs';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),v=h.game.view,T=THREE;
try{
 const meshes=v.commonScene.children.filter(m=>m.isMesh&&m.material.vertexColors&&m.material.side===T.DoubleSide);
 const cells={};
 for(const size of [24,32,48,64,96]){
  const buckets=[];
  for(const mesh of meshes){const a=mesh.geometry.attributes.position,b=new Map();for(let i=0;i<a.count;i+=3){const x=(a.getX(i)+a.getX(i+1)+a.getX(i+2))/3,z=(a.getZ(i)+a.getZ(i+1)+a.getZ(i+2))/3,key=Math.floor(x/size)+':'+Math.floor(z/size);b.set(key,(b.get(key)||0)+1);}buckets.push([...b.values()]);}
  cells[size]={batches:buckets.reduce((n,b)=>n+b.length,0),triangles:buckets.reduce((n,b)=>n+b.reduce((n,v)=>n+v,0),0),largestBatch:Math.max(...buckets.flat())};
 }
 const report={date:new Date().toISOString(),foliage:meshes.map(m=>{m.geometry.computeBoundingSphere();return{color:m.material.color.clone().convertLinearToSRGB().getHexString(),triangles:m.geometry.attributes.position.count/3,boundRadius:m.geometry.boundingSphere.radius};}),cells,scope:'Static production geometry inventory. Not a CPU/GPU/FPS benchmark.'};
 fs.writeFileSync(new URL('out/foliage-batching-inventory.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{clearInterval(h.game.net.timer);h.close();}
