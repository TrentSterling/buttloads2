/* Explicit stationary growth; shared geometry retains independent terrain support. */
'use strict';
(function(B){
 const T=THREE;
 B.WorkshopShapes.batchSupported=function(parent,records,size=16){
  if(!(size>0)||!Number.isFinite(size))throw Error('Invalid supported growth cell size');
  const buckets=new Map();parent.updateWorldMatrix(true,true);const inverse=parent.matrixWorld.clone().invert();
  for(const record of records){
   const root=record.root||record.mesh;root.updateWorldMatrix(true,true);
   root.traverse(mesh=>{
    if(!mesh.isMesh)return;const g=mesh.geometry,m=mesh.material;
    if(mesh.isInstancedMesh||mesh.children.length||Array.isArray(m)||m.transparent||g.drawRange.start!==0||Number.isFinite(g.drawRange.count)||Object.keys(g.morphAttributes).length)throw Error('Unsupported supported growth');
    const names=Object.keys(g.attributes).sort();if(names.some(k=>!['position','normal','uv','color'].includes(k)||g.attributes[k].isInterleavedBufferAttribute||g.attributes[k].normalized)||!names.includes('normal'))throw Error('Unsupported growth attributes');
    const center=new T.Vector3().setFromMatrixPosition(mesh.matrixWorld).applyMatrix4(inverse),key=[m.uuid,mesh.castShadow,mesh.receiveShadow,mesh.frustumCulled,mesh.renderOrder,mesh.layers.mask,names.join(','),...center.toArray().map(v=>Math.floor(v/size))].join(':');
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({record,mesh,transform:inverse.clone().multiply(mesh.matrixWorld)});
   });
  }
  // Validate every source before disposing or detaching anything.
  const batches=[];
  for(const entries of buckets.values()){
   const geometries=entries.map(e=>e.mesh.geometry.clone().applyMatrix4(e.transform)),count=geometries.reduce((n,g)=>n+g.attributes.position.count,0),indexCount=geometries.reduce((n,g)=>n+(g.index?.count||g.attributes.position.count),0),geo=new T.BufferGeometry();
   for(const name of Object.keys(geometries[0].attributes)){const a=geometries[0].attributes[name],data=new Float32Array(count*a.itemSize);let offset=0;for(const g of geometries){data.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}geo.setAttribute(name,new T.BufferAttribute(data,a.itemSize));}
   const Index=count>65535?Uint32Array:Uint16Array,index=new Index(indexCount);let offset=0;
   entries.forEach((entry,i)=>{const g=geometries[i],n=g.index?.count||g.attributes.position.count;entry.indices=new Index(n);for(let j=0;j<n;j++)entry.indices[j]=offset+(g.index?g.index.getX(j):j);offset+=g.attributes.position.count;g.dispose();});
   geo.setIndex(new T.BufferAttribute(index,1).setUsage(T.DynamicDrawUsage));geo.computeBoundingBox();geo.computeBoundingSphere();
   const source=entries[0].mesh,mesh=new T.Mesh(geo,source.material);mesh.name='supported-growth';for(const k of ['castShadow','receiveShadow','frustumCulled','renderOrder'])mesh[k]=source[k];mesh.layers.mask=source.layers.mask;mesh.matrixAutoUpdate=false;parent.add(mesh);batches.push({mesh,entries});
  }
  for(const entries of buckets.values())for(const e of entries){e.mesh.geometry.dispose();e.mesh.parent.remove(e.mesh);}
  const batch={batches,sync(){let changed=false;for(const b of batches){const states=b.entries.map(e=>(e.record.root||e.record.mesh).visible&&e.mesh.visible);if(b.states&&states.every((v,i)=>v===b.states[i]))continue;let offset=0;for(let i=0;i<states.length;i++)if(states[i]){b.mesh.geometry.index.array.set(b.entries[i].indices,offset);offset+=b.entries[i].indices.length;}b.mesh.geometry.setDrawRange(0,offset);b.mesh.geometry.index.needsUpdate=true;b.mesh.visible=offset>0;b.states=states;changed=true;}return changed;}};
  batch.sync();return batch;
 };
})(B2);
