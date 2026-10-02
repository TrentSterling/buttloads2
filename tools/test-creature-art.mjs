import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,T=THREE;
export let creatureArtChecks=0;
const test=async(name,fn)=>{await fn();creatureArtChecks++;console.log('PASS creature art: '+name);};
function solid(geo,label){
 const p=geo.attributes.position,ids=geo.index.array,edges=new Map(),parent=Array.from({length:ids.length/3},(_,i)=>i),volumes=[],find=i=>parent[i]===i?i:parent[i]=find(parent[i]);
 for(const name of ['normal','uv','color']){const a=geo.attributes[name];assert.equal(a.count,p.count,label+' incomplete '+name);assert.ok(Array.from(a.array).every(Number.isFinite));}
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e7)).join(',');
 for(let i=0;i<ids.length;i+=3){const a=new T.Vector3().fromBufferAttribute(p,ids[i]),b=new T.Vector3().fromBufferAttribute(p,ids[i+1]),c=new T.Vector3().fromBufferAttribute(p,ids[i+2]);assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-18,label+' collapsed triangle');volumes.push(a.dot(b.clone().cross(c))/6);
  for(let j=0;j<3;j++){const x=key(ids[i+j]),y=key(ids[i+(j+1)%3]),k=[x,y].sort().join('|'),e=edges.get(k)||[];e.push({triangle:i/3,direction:x<y?1:-1});edges.set(k,e);}
 }
 for(const e of edges.values()){assert.equal(e.length,2,label+' open or nonmanifold edge');assert.equal(e[0].direction+e[1].direction,0,label+' reversed face');parent[find(e[0].triangle)]=find(e[1].triangle);}
 const components=new Map();for(let i=0;i<volumes.length;i++){const k=find(i);components.set(k,(components.get(k)||0)+volumes[i]);}for(const volume of components.values())assert.ok(volume>1e-10,label+' inward or collapsed solid');
}
function inventory(root){let meshes=0,triangles=0,casters=0;root.traverse(m=>{if(m.isMesh){meshes++;if(m.castShadow)casters++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}});return{meshes,triangles,casters};}
function fingerprint(){return [g.view.mothModels,g.view.crawlerModels].map(models=>models.map(m=>{const parts=[];m.root.traverse(n=>{if(n.isMesh)parts.push([Object.entries(n.geometry.attributes).map(([name,a])=>[name,createHash('sha256').update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength)).digest('hex')]),Array.from(n.geometry.index.array),n.material.color.getHexString()]);});return parts;}));}
try{
 await test('every anatomy component is a closed outward solid with complete finite attributes',()=>{
  for(const seed of [0,.71,2.84])for(const [name,args]of [['mothBody',[seed]],['mothEyes',[seed]],['mothWing',[-1,seed]],['mothWing',[1,seed]],['carapace',[seed]],['abdomen',[seed]],['rear',[seed]],['leg',[-1,false,seed]],['leg',[1,true,seed]],['claw',[-1,false,seed]],['claw',[1,true,seed]],['crawlerEyes',[seed]]]){const geo=B2.CreatureArt[name](...args);solid(geo,name+' '+args);geo.dispose();}
 });
 await test('closed forewings and hindwings remain visible above and below with FrontSide materials',()=>{
  for(const side of [-1,1]){const geo=B2.CreatureArt.mothWing(side),material=new T.MeshBasicMaterial({side:T.FrontSide}),mesh=new T.Mesh(geo,material);mesh.updateMatrixWorld(true);for(const z of [.09,-.15])for(const sign of [-1,1])assert.ok(new T.Raycaster(new T.Vector3(side*.245,sign,z),new T.Vector3(0,-sign,0),0,3).intersectObject(mesh).length,'missing wing surface');geo.dispose();material.dispose();}
 });
 await test('moving, attacking, broken and dead anatomy fits unchanged hitboxes at every sampled yaw',()=>{
  g.running=true;g.settings.motion=true;
  for(const family of ['moth','crawler']){const models=family==='moth'?g.view.mothModels:g.view.crawlerModels,size=family==='moth'?[1.04,.74,1.04]:B2.CRAWLER_SIZE;for(const m of models){assert.equal(inventory(m.root).casters,family==='moth'?1:17,'native shadow casters removed');assert.ok(inventory(m.root).meshes<=(family==='moth'?5:20));assert.ok(inventory(m.root).triangles<=(family==='moth'?1200:1500));const old={...m.node};for(const phase of ['idle','windup','lunge','chase','broken','dead'])for(let step=0;step<32;step++){Object.assign(m.node,{phase:phase==='broken'?'chase':phase,hp:phase==='dead'?0:60,shell:['broken','dead'].includes(phase)?0:90,yaw:step*Math.PI/16,vx:1,vz:0});const time=step*.17;g.view.renderCombat(g,time);g.view.renderCrawlers(g,time);const box=new T.Box3(),point=new T.Vector3();m.root.updateWorldMatrix(true,true);m.root.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)box.expandByPoint(point.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld));});for(const [i,k]of ['x','y','z'].entries()){assert.ok(box.min[k]>=m.node[k]-size[i]/2-1e-5,family+' '+phase+' below '+k);assert.ok(box.max[k]<=m.node[k]+size[i]/2+1e-5,family+' '+phase+' above '+k);}}for(const key of Object.keys(m.node))if(!(key in old))delete m.node[key];Object.assign(m.node,old);}}
 });
 await test('leg and claw roots meet the actual abdomen during walking, windup and corpse compression',()=>{
  for(const m of g.view.crawlerModels){const old={...m.node},side=m.body.material.side;m.body.material.side=T.DoubleSide;
   for(const phase of ['chase','windup','dead'])for(const time of [0,.17,.42,.91]){Object.assign(m.node,{phase,hp:phase==='dead'?0:110,shell:phase==='dead'?0:90,vx:1,vz:0});g.view.renderCrawlers(g,time);m.root.updateWorldMatrix(true,true);
    for(const joint of [...m.legs,...m.claws]){const piece=joint.children.find(n=>n.geometry?.userData.attachment),point=new T.Vector3(...piece.geometry.userData.attachment).applyMatrix4(piece.matrixWorld),ray=new T.Raycaster(point,new T.Vector3(1,.137,.213).normalize(),0,4),hits=ray.intersectObject(m.body);assert.equal(hits.length%2,1,'detached '+piece.geometry.userData.creaturePart+' '+phase);}
   }m.body.material.side=side;Object.assign(m.node,old);
  }
 });
 await test('rebuild and portable reload dispose old anatomy and reconstruct the same native geometry',async()=>{
  g.view.renderCombat(g,0);g.view.renderCrawlers(g,0);const shapes=fingerprint(),field=g.world.field.slice(),save=B2.Saves.snapshot(g),resources=new Set();for(const root of [g.view.combatScene,g.view.crawlerScene])root.traverse(m=>{if(m.geometry)resources.add(m.geometry);if(m.material)resources.add(m.material);});let disposed=0;for(const r of resources)r.addEventListener('dispose',()=>disposed++);
  await g.install(B2.Saves.validate(save));assert.equal(disposed,resources.size);assert.deepEqual(fingerprint(),shapes);assert.deepEqual(g.world.field,field);assert.deepEqual(g.economy.state,save.state);assert.deepEqual([g.view.caveSupportBatches.batches.length,g.view.deepSupportBatches.batches.length,g.view.expeditionSupportBatches.batches.length],[16,19,10]);
 });
}finally{clearInterval(g.net.timer);h.close();}
console.log('COMPLETE '+creatureArtChecks+' creature art checks passed (inert renderer; no input or timing claim)');
