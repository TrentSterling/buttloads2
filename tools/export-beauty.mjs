// Offline scene export only. The DOM/renderer are inert; no browser or OS input.
import fs from 'node:fs';
import path from 'node:path';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,T=THREE,label=process.argv[2]||'current';
const root=path.join(import.meta.dirname,'out','beauty-'+label);fs.mkdirSync(root,{recursive:true});
function flatten(scene,camera){
 camera.updateMatrixWorld();scene.updateMatrixWorld(true);
 const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)),data=[];
 scene.traverseVisible(m=>{
  if(!m.isMesh||!m.geometry.attributes.normal||m.material.opacity<.5||m.material.depthTest===false||m.userData.beautySky)return;
  if(!m.isInstancedMesh&&!frustum.intersectsObject(m))return;
  const geo=m.geometry,a=geo.attributes,indices=geo.index,material=m.material;
  if(Array.isArray(material))return;
  for(let instance=0;instance<(m.isInstancedMesh?m.count:1);instance++){
   const matrix=m.matrixWorld.clone(),ic=new T.Color(1,1,1);
   if(m.isInstancedMesh){const im=new T.Matrix4();m.getMatrixAt(instance,im);matrix.multiply(im);if(m.instanceColor)m.getColorAt(instance,ic);}
   const normal=new T.Matrix3().getNormalMatrix(matrix),base=(material.color||new T.Color(1,1,1)).clone().multiply(ic),emission=(material.emissive||new T.Color(0,0,0)).clone().multiplyScalar(material.emissiveIntensity||0);
   const count=Math.min(geo.drawRange.count,(indices?.count||a.position.count)-geo.drawRange.start),kind=material===g.view.terrainMaterial||material===g.view.palette.grass&&B2.TERRAIN_LOOK?1:material.isMeshBasicMaterial?-1:0;
   const begin=data.length;
   for(let j=geo.drawRange.start;j<geo.drawRange.start+count;j++){
    const k=indices?indices.getX(j):j,p=new T.Vector3().fromBufferAttribute(a.position,k).applyMatrix4(matrix),n=new T.Vector3().fromBufferAttribute(a.normal,k).applyMatrix3(normal).normalize(),c=base.clone();
    if(material.vertexColors&&a.color)c.multiply(new T.Color().fromBufferAttribute(a.color,k));
    data.push(p.x,p.y,p.z,n.x,n.y,n.z,c.r,c.g,c.b,emission.r,emission.g,emission.b,material.roughness??1,material.metalness??0,kind);
   }
   if(material.side===T.DoubleSide)for(let j=begin,end=data.length;j+44<end;j+=45)for(const off of [0,30,15]){const v=data.slice(j+off,j+off+15);v[3]*=-1;v[4]*=-1;v[5]*=-1;data.push(...v);}
  }
 });
 return new Float32Array(data);
}
function capture(name,position,target){
 g.player.teleport(...position);const dx=target[0]-position[0],dz=target[2]-position[2];g.player.yaw=Math.atan2(-dx,-dz);g.player.pitch=Math.atan2(target[1]-g.player.head.y,Math.hypot(dx,dz));g.view.render(g,0,0);
 const v=g.view,lights=[];v.scene.traverseVisible(n=>{if(n.isPointLight&&n.intensity>0){const p=new T.Vector3();n.getWorldPosition(p);if(p.distanceTo(v.camera.position)<n.distance+10)lights.push({position:p.toArray(),color:n.color.toArray(),intensity:n.intensity,distance:n.distance,decay:n.decay});}});
 lights.sort((a,b)=>new T.Vector3(...a.position).distanceTo(v.camera.position)-new T.Vector3(...b.position).distanceTo(v.camera.position));
 const world=flatten(v.scene,v.camera),tool=g.screen==='town'?new Float32Array():flatten(v.toolScene,v.toolCamera);fs.writeFileSync(path.join(root,name+'.bin'),Buffer.from(world.buffer));fs.writeFileSync(path.join(root,name+'-tool.bin'),Buffer.from(tool.buffer));
 const spot=v.headlamp;spot?.shadow.updateMatrices(spot);
 const headlamp=spot?{position:spot.position.toArray(),target:spot.target.position.toArray(),color:spot.color.toArray(),intensity:spot.intensity,distance:spot.distance,angle:spot.angle,penumbra:spot.penumbra,camera:spot.shadow.camera.projectionMatrix.clone().multiply(spot.shadow.camera.matrixWorldInverse).elements}:null;
 const data={name,label,vertices:world.length/15,toolVertices:tool.length/15,camera:v.camera.projectionMatrix.clone().multiply(v.camera.matrixWorldInverse).elements,toolCamera:v.toolCamera.projectionMatrix.clone().multiply(v.toolCamera.matrixWorldInverse).elements,eye:v.camera.position.toArray(),fog:{color:v.scene.fog.color.toArray(),near:v.scene.fog.near,far:v.scene.fog.far},sun:{position:v.sun.position.toArray(),target:v.sun.target.position.toArray(),color:v.sun.color.toArray(),intensity:v.sun.intensity},hemi:{sky:v.hemi.color.toArray(),ground:v.hemi.groundColor.toArray(),intensity:v.hemi.intensity},lights:lights.slice(0,12),headlamp,terrainGLSL:B2.TERRAIN_LOOK?.glsl||null,sky:B2.SKY_LOOK||null,skyShader:v.skyDome?.material.fragmentShader,skyValues:v.skyDome?Object.fromEntries(Object.entries(v.skyDome.material.uniforms).map(([k,u])=>[k,u.value.toArray?u.value.toArray():u.value])):null};
 fs.writeFileSync(path.join(root,name+'.json'),JSON.stringify(data));console.log(`${name}: ${data.vertices/3} world triangles, ${data.toolVertices/3} tool triangles`);
}
try{
 g.settings.motion=false;g.setScreen(null);g.view.camera.aspect=g.view.toolCamera.aspect=16/9;g.view.camera.updateProjectionMatrix();g.view.toolCamera.updateProjectionMatrix();
 if(process.argv.includes('--residents')){
  // Art fixtures expose all four residents, not evidence of earned unlocks.
  g.rescue.state.phase='rescued';g.fossil.state.recovered=true;g.setScreen('town');
  for(const p of B2.TOWN.people){
   g.view.camera.fov=52;g.view.camera.updateProjectionMatrix();
   capture(p.id+'-counter',[p.x+.45,.06,p.z-1.75],[p.x,1.48,p.z]);
   g.view.camera.fov=36;g.view.camera.updateProjectionMatrix();
   capture(p.id+'-portrait',[p.x+.35,.06,p.z-1.38],[p.x,1.58,p.z]);
  }
 } else if(process.argv.includes('--underground')){
  for(const n of g.world.caverns.networks){
   const c=n.chamber;
   capture('cave-'+n.id,[c.x,c.y-g.player.eye,c.z],[c.x+2.4,c.y+.25,c.z-1.7]);
   const cabinet=g.refuges.nodes[n.id];
   capture('cabinet-'+n.id,[cabinet.x+.5,cabinet.y-.35,cabinet.z-1.65],[cabinet.x,cabinet.y+.05,cabinet.z]);
  }
  for(const n of g.deep.nodes){
   capture('station-'+n.id,[n.x+.5,n.y-.35,n.z-2.3],[n.x,n.y+.1,n.z]);
  }
 } else if(process.argv.includes('--common')){
  capture('overview',[43,23,65],[0,1,29]);
  capture('arrival',[9,.06,26],[-4,1.7,41]);
  capture('well',[9,.06,53],[2,1.2,40]);
  capture('ridge',[43,.06,16],[42,7,46]);
  capture('west',[-31,(B2.COMMON?.height(-31,12)||0)+.06,12],[-43,5,25]);
 } else if(process.argv.includes('--mining')){
  for(const [i,mode] of ['cutter','scoop','lance'].entries()){
   g.expedition.state.tool=mode;
   capture(mode+'-head',[2,.06,5],[-4,2.3,21]);
   const p=new B2.Player(g.world);p.yaw=0;p.pitch=-Math.PI/2;
   g.world.carve({x:-7+i*7,y:-.7,z:1},2.5,Infinity,mode==='cutter'?null:B2.cutBrush(p,2.5,mode));
  }
  g.expedition.state.tool='scoop';capture('cut-shapes',[0,8,11],[0,-1,1]);
 } else {
 capture('yard',[2,.06,5],[-4,2.3,21]);capture('town',[5,2,28],[-8,1.8,43]);
 const n=g.world.caverns.networks[0].chamber;capture('cavern',[n.x,n.y-g.player.eye,n.z],[n.x+3,n.y-.6,n.z-2.5]);
 for(const id of [1,2]){
  const c=g.world.caverns.networks[id].chamber;
  const forms=g.view.caveGrowth.filter(f=>id===1?f.root.userData.formation==='chalk-roots':f.root.userData.formation==='mineral-cluster').sort((a,b)=>a.root.position.distanceTo(new T.Vector3(c.x,c.y,c.z))-b.root.position.distanceTo(new T.Vector3(c.x,c.y,c.z)));
  const p=forms[0]?.root.position||new T.Vector3(c.x+2,c.y,c.z);
  capture(id===1?'chalk':'violet',[c.x,c.y-g.player.eye,c.z],[p.x,p.y+(id===1?-.4:.2),p.z]);
 }
 }
 fs.writeFileSync(path.join(root,'label.txt'),'Offline scene geometry and material study. Synthetic lighting adapter; mapped signs omitted. Not a browser screenshot.\n');
}finally{h.close();}
