import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE;
try{
 v.renderCaverns(g);
 const entries=v.caveSupportBatches.batches.flatMap(b=>b.entries);
 const caps=v.caveGrowth.filter(n=>n.root.userData.formation==='lantern-cap');
 console.log(JSON.stringify({caps:caps.map(n=>{const sources=entries.filter(e=>e.record===n),box=new T.Box3();for(const e of sources)box.union(e.mesh.geometry.boundingBox.clone().applyMatrix4(e.transform));return{index:v.caveGrowth.indexOf(n),visible:n.root.visible,anchor:n.anchor,position:n.root.position.toArray(),box:[box.min.toArray(),box.max.toArray()],triangles:sources.reduce((s,e)=>s+e.mesh.geometry.index.count/3,0)};}),cells:v.caveSupportBatches.batches.length,chamber:g.world.caverns.networks[0].chamber},null,2));
}finally{h.close();clearInterval(g.net.timer);}
