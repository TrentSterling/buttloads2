export function unchangedWorkerMeshes(art){
 const list=[];art.root.traverse(n=>{if(!n.isMesh||n.userData.workerJoint)return;
  // Face skin, inner detail and hair were reconstructed in 2.60; their current
  // topology and all other head parts are checked by test-miner-face.mjs.
  if(n.parent===art.head&&[6,7,8].includes(art.materials.indexOf(n.material)))return;
  // Shirt collar and upper torso were reconstructed in 2.61 and are checked
  // against the released 2.60 factory by test-miner-collar.mjs.
  if(n.parent===art.torso&&[0,2].includes(art.materials.indexOf(n.material)))return;
  // The entire boot assembly is reconstructed in 2.62 and checked against
  // the released 2.61 factory by test-miner-boots.mjs.
  if(art.feet.includes(n.parent)||n.userData.workerBoot)return;
  if(art.knees.includes(n.parent)||art.legs.includes(n.parent)&&n.material===art.materials[0]||art.arms.includes(n.parent)&&n.material===art.materials[2]||art.elbows.includes(n.parent)&&n.material===art.materials[2])return;
  list.push(n);
 });return list;
}
export function posedWorkerMesh(source){
 const {joint,pivot,span,weightPivot=pivot}=source.userData.workerJoint,geometry=source.geometry.clone(),p=geometry.attributes.position,point=new THREE.Vector3(),posed=new THREE.Vector3();
 for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);B2.WorkerJoint.point(point,joint.quaternion,pivot,span,posed,weightPivot);const s=source.userData.workerShoulder;if(s)B2.WorkerShoulder.point(point,posed,s.arm.quaternion,s.torso.quaternion,s,posed);p.setXYZ(i,posed.x,posed.y,posed.z);}
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const mesh=new THREE.Mesh(geometry,source.material);mesh.matrixAutoUpdate=false;mesh.matrixWorld.copy(source.matrixWorld);return mesh;
}
