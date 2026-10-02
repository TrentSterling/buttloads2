// Estimate submitted triangles using Three's production frustum test; no FPS claim.
import fs from 'node:fs';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),v=h.game.view,T=THREE,source=v.commonScene.children.filter(m=>m.isMesh&&m.material.vertexColors&&m.material.side===T.DoubleSide);
try{
 const cameras=JSON.parse(fs.readFileSync(new URL('out/foliage-batching-before-clear/report.json',import.meta.url))).shots;
 // Match the native capture viewport instead of the Node fixture's 1440x900.
 v.camera.aspect=1440/1000;v.camera.updateProjectionMatrix();
 const report={date:new Date().toISOString(),viewport:{width:1440,height:1000},projection:{fov:v.camera.fov,aspect:v.camera.aspect,near:v.camera.near,far:v.camera.far},scope:'CPU frustum prediction over unchanged native geometry; not renderer timings.',sizes:{}};
 for(const size of [24,32,48,64,96]){
  const group=new T.Group();for(const m of source){const clone=m.clone(false);clone.geometry=m.geometry.clone();group.add(clone);}B2.WorkshopShapes.mergeRigid(group);
  for(const mesh of [...group.children])B2.WorkshopShapes.partitionRigid(mesh,size);group.updateMatrixWorld(true);
  const shots=cameras.map(({name,camera:c})=>{v.camera.position.set(c.x,c.y+h.game.player.eye,c.z);v.camera.rotation.set(c.pitch,c.yaw,0,'YXZ');v.camera.updateMatrixWorld(true);const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(v.camera.projectionMatrix,v.camera.matrixWorldInverse)),visible=group.children.filter(m=>frustum.intersectsObject(m));return{name,calls:visible.length,triangles:visible.reduce((n,m)=>n+m.geometry.index.count/3,0)};});
  report.sizes[size]={totalBatches:group.children.length,shots,meanCalls:shots.reduce((n,s)=>n+s.calls,0)/shots.length,meanTriangles:shots.reduce((n,s)=>n+s.triangles,0)/shots.length};for(const m of group.children)m.geometry.dispose();
 }
 fs.writeFileSync(new URL('out/foliage-batching-prediction.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(Object.fromEntries(Object.entries(report.sizes).map(([size,r])=>[size,{batches:r.totalBatches,meanCalls:r.meanCalls,meanTriangles:r.meanTriangles}]))));
}finally{clearInterval(h.game.net.timer);h.close();}
