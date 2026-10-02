// Independent samples for the actual deformation reference, not a shader reimplementation.
export function shoulderSamples(mesh){
 const T=THREE,p=mesh.geometry.attributes.position,ix=mesh.geometry.index,s=mesh.userData.workerShoulder;
 const samples=Array.from({length:p.count},(_,i)=>new T.Vector3().fromBufferAttribute(p,i));
 for(let i=0;i<ix.count;i+=3){
  const q=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,ix.getX(i+k)));
  if(Math.min(...q.map(v=>v.length()))>=s.radius+s.falloff)continue;
  samples.push(q[0].clone().add(q[1]).add(q[2]).multiplyScalar(1/3));
  for(let k=0;k<3;k++)samples.push(q[k].clone().add(q[(k+1)%3]).multiplyScalar(.5));
 }
 return samples.filter(q=>q.length()<s.radius+s.falloff);
}
export function shoulderJacobian(mesh,samples){
 const T=THREE,s=mesh.userData.workerShoulder,j=mesh.userData.workerJoint,at=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),columns=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
 const deform=(rest,target)=>{B2.WorkerJoint.point(rest,j.joint.quaternion,j.pivot,j.span,target);return B2.WorkerShoulder.point(rest,target,s.arm.quaternion,s.torso.quaternion,s,target);};
 let minimum=Infinity,negative=0,minimumPoint;
 for(const point of samples){
  for(const [i,axis]of ['x','y','z'].entries()){at.copy(point);at[axis]+=1e-5;deform(at,a);at.copy(point);at[axis]-=1e-5;deform(at,b);columns[i].copy(a).sub(b).multiplyScalar(50000);}
  const det=columns[0].dot(columns[1].cross(columns[2]));if(det<minimum){minimum=det;minimumPoint=point.toArray();}if(!Number.isFinite(det)||det<=0)negative++;
 }
 return{minimum,negative,samples:samples.length,minimumPoint};
}
