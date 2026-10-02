export function unchangedWorkerMeshes(art){
 const list=[];art.root.traverse(n=>{if(!n.isMesh||n.userData.workerJoint)return;
  if(art.knees.includes(n.parent)||art.legs.includes(n.parent)&&n.material===art.materials[0]||art.arms.includes(n.parent)&&n.material===art.materials[2]||art.elbows.includes(n.parent)&&n.material===art.materials[2])return;
  list.push(n);
 });return list;
}
export function posedWorkerMesh(source){
 const {joint,pivot,span}=source.userData.workerJoint,geometry=source.geometry.clone(),p=geometry.attributes.position,point=new THREE.Vector3(),posed=new THREE.Vector3();
 for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);B2.WorkerJoint.point(point,joint.quaternion,pivot,span,posed);p.setXYZ(i,posed.x,posed.y,posed.z);}
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const mesh=new THREE.Mesh(geometry,source.material);mesh.matrixAutoUpdate=false;mesh.matrixWorld.copy(source.matrixWorld);return mesh;
}
