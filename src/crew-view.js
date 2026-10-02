/* Original procedural miners, interpolated in world space. No camera control. */
'use strict';
(function(B){
 const T=THREE;
 const armScratch=m=>m.armSolve ||= {point:new T.Vector3(),u:new T.Vector3(),out:new T.Vector3(),elbow:new T.Vector3(),direction:new T.Vector3(),down:new T.Vector3(0,-1,0),inverse:new T.Quaternion()};
 B.View.prototype.makeMiner=function(id,color,label){
  this.miners ||= new Map();const rig=B.buildMinerArt(this,color),{root,head,legs,arms}=rig,bodyMeshes=[];
  root.traverse(n=>{if(n.isMesh)bodyMeshes.push(n);});this.crewBatchMembershipDirty=true;
  const add=(geometry,material,x,y,z,parent=root)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
  const weapon=new T.Group();root.add(weapon);const field=new T.Group();root.add(field);
  for(let i=0;i<2;i++){const ring=add(new T.TorusGeometry(.23,.008,5,28),new T.MeshBasicMaterial({color:'#a0e9db',transparent:true,opacity:.55,depthWrite:false}),0,0,-.44,field);ring.rotation.x=i*Math.PI/2;}
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(12,28,31,.85)';ctx.fillRect(0,12,512,56);ctx.fillStyle=B.CREW_COLORS[color];ctx.fillRect(0,12,6,56);ctx.font='600 29px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff0d3';ctx.fillText(label,256,41,470);
  const texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;const badge=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true,transparent:true}));badge.position.y=1.97;badge.scale.set(.78,.122,1);root.add(badge);
  root.position.set(0,0,12);this.scene.add(root);this.renderer.shadowMap.needsUpdate=true;const m={...rig,bodyMeshes,weapon,field,badge,texture,color,label,materials:[...rig.materials,...field.children.map(n=>n.material)],phase:0,initialized:false};this.miners.set(id,m);return m;
 };
 B.View.prototype.equipMiner=function(m,key){
  if(m.tool===key)return;this.clearCrewBatches();for(const material of m.weaponMaterials||[])material.dispose();m.weapon.clear();m.weaponMaterials=[];m.weaponMeshes=[];
  const mechanical=['cutter','scoop','lance','resonance'].includes(key),source=mechanical?this.tool:key==='axe'?this.axeTool:key==='sling'?this.slingTool:this.magicTool;if(!source)return;
  // The local glove and unused mechanical heads never belong to a remote rig.
  // Clone only the equipped branches; geometry and static materials are borrowed.
  const heads={cutter:this.rotor,scoop:this.scoopHead,lance:this.lanceHead,resonance:this.resonatorHead},unused=new Set(mechanical?Object.entries(heads).filter(([tool])=>tool!==key).map(([,head])=>head):[]),copies=new Map(),model=source.clone(false);
  for(const child of source.children){if(child.userData.viewmodelOnly||unused.has(child)||mechanical&&child===this.grip)continue;const copy=child.clone(true);copies.set(child,copy);model.add(copy);}
  model.visible=true;model.position.set(0,0,0);model.rotation.set(0,0,0);model.scale.setScalar(mechanical?.7:key==='gravity'?1:.8);
  m.forks=key==='sling'?this.slingForks.map(fork=>copies.get(fork)):[];m.core=key==='sling'?copies.get(this.slingToolCore):key==='gravity'?copies.get(this.magicCore):null;
  model.traverse(n=>{n.userData.sharedCrewAsset=true;const materialKey=n.material?.uuid;if(n===m.core&&key==='sling'){n.material=n.material.clone();m.weaponMaterials.push(n.material);}n.castShadow=!!n.geometry;if(n.isMesh)m.weaponMeshes.push({source:n,materialKey,visible:n.visible});});
  m.attachments={};if(mechanical){const node=copies.get(heads[key]);if(node){node.visible=true;m.attachments[key]=node;}}
  m.weapon.add(model);m.weapon.position.set(.285,key==='gravity'?1.10:1.065,-.34);m.tool=key;
 };
 B.View.prototype.poseMinerArm=function(m,index,point){
  const s=armScratch(m);
  const arm=m.arms[index],joint=m.elbows[index],l1=.245,l2=.266;s.u.copy(point).sub(arm.position);const d=B.clamp(s.u.length(),.03,l1+l2-.001);s.u.normalize();
  s.out.set(index?m.carry?.9:.45:-.9,-.05,m.carry?.35:1).addScaledVector(s.u,-s.out.dot(s.u)).normalize();const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  s.elbow.copy(arm.position).addScaledVector(s.u,along).addScaledVector(s.out,height);
  arm.quaternion.setFromUnitVectors(s.down,s.direction.copy(s.elbow).sub(arm.position).normalize());s.inverse.copy(arm.quaternion).invert();joint.quaternion.setFromUnitVectors(s.down,s.direction.copy(point).sub(s.elbow).applyQuaternion(s.inverse).normalize());
 };
 B.View.prototype.poseMinerGrip=function(m){
  const point=armScratch(m).point;
  if(m.tool==='gravity')point.set(0,-.168,.04);else if(m.tool==='axe')point.set(-.01,-.13,.022);else if(m.tool==='sling')point.set(0,-.11,.024);else point.set(0,-.22,.096);
  point.multiplyScalar(m.weapon.children[0]?.scale.x||1).applyQuaternion(m.weapon.quaternion).add(m.weapon.position);this.poseMinerArm(m,1,point);
  if(m.carry){point.set(-.145,-.07,-.085).multiplyScalar(m.weapon.children[0]?.scale.x||1).applyQuaternion(m.weapon.quaternion).add(m.weapon.position);this.poseMinerArm(m,0,point);}
 };
 B.View.prototype.poseMinerWeapon=function(m,pitch=0,swing=0,kick=0){
  m.carry=['cutter','scoop','lance','resonance'].includes(m.tool);
  m.weapon.rotation.set(pitch*.75+swing,-.06,0);m.weapon.position.set(m.carry?.045:.285,(m.carry?1.18:m.tool==='gravity'?1.10:1.065)+Math.max(0,pitch)*.09+kick,(m.carry?-.30:-.34)+Math.max(0,pitch)*(m.carry?.11:.14)-(m.carry?Math.max(0,-pitch)*.08:0));
  if(m.gait){m.weapon.position.applyQuaternion(m.torso.quaternion).add(m.torso.position);m.weapon.quaternion.premultiply(m.torso.quaternion);}this.poseMinerGrip(m);
 };
 B.View.prototype.minerFootSupport=function(m,f,point,target,world){
  let floor=this.minerFloor(f.cache,{x:point.x,y:target.y,z:point.z,grounded:true},world);
  // A boot cannot plant at the bottom of a ledge. Shorten that step towards
  // the supported capsule instead of stretching the lower leg through the rim.
  for(let i=0;i<2&&Math.abs(floor-m.root.position.y)>.18;i++){
   point.x+=(m.root.position.x-point.x)*.5;point.z+=(m.root.position.z-point.z)*.5;
   f.cache.floorCache=null;
   floor=this.minerFloor(f.cache,{x:point.x,y:target.y,z:point.z,grounded:true},world);
  }
  point.y=B.clamp(floor,m.root.position.y-.18,m.root.position.y+.18)+.015;
 };
 B.View.prototype.poseMinerTravel=function(m,target,world,dt,animated,reset=false){
  const root=m.root,p=root.position,yaw=root.rotation.y;
  let g=m.gait;
  if(!g||reset||g.world!==world||g.animated!==animated||g.grounded!==target.grounded){
   g=m.gait={world,revision:world.revision,supportTime:0,animated,grounded:target.grounded,last:p.clone(),lastYaw:yaw,phase:.28,speed:0,weight:0,idle:0,feet:[],delta:new T.Vector3(),local:new T.Vector3(),hip:new T.Vector3(),ankle:new T.Vector3(),u:new T.Vector3(),out:new T.Vector3(),knee:new T.Vector3(),down:new T.Vector3(0,-1,0),up:new T.Vector3(0,1,0),q:new T.Quaternion(),sole:new T.Quaternion(),rest:new T.Vector3(),pivot:new T.Vector3(0,.89,0)};
   for(let i=0;i<2;i++)g.feet.push({position:new T.Vector3(),from:new T.Vector3(),to:new T.Vector3(),cache:{},swing:false,settling:false,phase:0,yaw,initialized:false});
  }
  g.supportTime+=dt;
  if(animated&&target.grounded&&g.revision!==world.revision&&g.supportTime>=.12){
   for(const f of g.feet)if(f.initialized&&!f.swing)this.minerFootSupport(m,f,f.position,target,world);
   g.revision=world.revision;g.supportTime=0;
  }
  const travel=Math.hypot(p.x-g.last.x,p.z-g.last.z),moving=animated&&target.grounded&&travel>.00001&&dt>0;
  g.delta.set(p.x-g.last.x,0,p.z-g.last.z);const actual=dt>0?Math.min(8,travel/dt):0;
  if(dt>0){g.speed+=(actual-g.speed)*(1-Math.exp(-dt*12));g.weight+=((moving?1:0)-g.weight)*(1-Math.exp(-dt*10));g.idle=moving?0:g.idle+dt;}
  if(travel>.00001)g.delta.multiplyScalar(1/travel);else g.delta.set(-Math.sin(yaw),0,-Math.cos(yaw));
  if(moving&&!g.started){const across=g.delta.x*Math.cos(yaw)-g.delta.z*Math.sin(yaw);g.phase=across<-.1?.78:.28;g.started=true;}
  if(moving)g.stride=Math.min(1.3,.85+actual*.10);const stride=g.stride||.85,prior=g.phase;
  if(moving)g.phase+=travel/stride;
  // Finish a lifted foot after stopping; settle one boot at a time afterwards.
  else if(animated&&target.grounded&&g.feet.some(f=>f.swing&&!f.settling))g.phase+=dt*Math.max(.8,g.speed/stride);
  const wave=Math.sin(g.phase*Math.PI*2),weight=animated?g.weight:0;
  g.local.copy(g.delta).applyAxisAngle(g.up,-yaw);
  let bob=animated?(target.grounded?-.016-weight*(.034+Math.min(1,g.speed/4)*.035)+Math.cos(g.phase*Math.PI*4)*.009*weight:-.045):0;
  let settling=g.feet.some(f=>f.settling);
  for(let i=0;i<2;i++){
   const side=i?1:-1,f=g.feet[i],phase=(g.phase+i*.5)%1,old=(prior+i*.5)%1;
   // Side steps use staggered fore/aft lanes so the moving boot can pass the
   // planted boot without crossing the same ankle and knee-pad volume.
   g.rest.set(side*.12,.015,side*.25*Math.abs(g.local.x)).applyAxisAngle(g.up,yaw).add(p);
   if(!f.initialized||!animated||!target.grounded||Math.abs(yaw-f.yaw)>.85||f.position.distanceTo(p)>1.2){
    f.position.copy(g.rest);f.yaw=yaw;f.swing=f.settling=false;f.initialized=true;
    if(animated&&target.grounded)this.minerFootSupport(m,f,f.position,target,world);
   }
   if(animated&&target.grounded){
    if(moving&&!f.swing&&phase>=.55&&(old<.55||travel>0&&g.idle===0)){
     f.from.copy(f.position);f.to.copy(g.rest).addScaledVector(g.delta,stride*(1-phase+.26));this.minerFootSupport(m,f,f.to,target,world);f.swing=true;f.settling=false;f.phase=phase;
    }
    if(f.swing&&!f.settling){
     if(phase<f.phase){f.position.copy(f.to);f.swing=false;f.yaw=yaw;}
     else{const t=B.clamp((phase-f.phase)/(1-f.phase),0,1),ease=t*t*(3-2*t);f.position.copy(f.from).lerp(f.to,ease);f.position.y+=Math.sin(Math.PI*t)*(.09+Math.min(.05,g.speed*.012));}
    }
    if(!moving&&g.idle>.20&&!f.swing&&!settling&&Math.hypot(f.position.x-g.rest.x,f.position.z-g.rest.z)>.035){
     f.from.copy(f.position);f.to.copy(g.rest);this.minerFootSupport(m,f,f.to,target,world);f.swing=f.settling=settling=true;f.phase=0;
    }
    if(f.settling){f.phase=Math.min(1,f.phase+dt/.24);const t=f.phase,ease=t*t*(3-2*t);f.position.copy(f.from).lerp(f.to,ease);f.position.y+=Math.sin(Math.PI*t)*.065;if(t===1){f.swing=f.settling=false;f.yaw=yaw;}}
   }else if(animated){f.position.y+=.12+(i?.015:0);}
  }
  // Let the pelvis yield to a long planted step. The root stays on the same
  // authoritative floor; only the articulated body compresses.
  if(animated)for(let i=0;i<2;i++){
   g.ankle.copy(g.feet[i].position).sub(p).applyAxisAngle(g.up,-yaw);const horizontal=Math.hypot(g.ankle.x-(i?1:-1)*.12,g.ankle.z);
   bob=Math.min(bob,g.ankle.y+Math.sqrt(Math.max(.01,.876*.876-horizontal*horizontal))-.89);
  }
  bob=Math.max(-.28,bob);
  m.torso.rotation.set(-g.local.z*.085*weight,wave*.028*weight,-g.local.x*.065*weight+wave*.025*weight);
  m.torso.position.copy(g.pivot).sub(g.rest.copy(g.pivot).applyQuaternion(m.torso.quaternion));m.torso.position.y+=bob;
  m.head.position.set(0,1.51,0).applyQuaternion(m.torso.quaternion).add(m.torso.position);m.head.rotation.set((target.pitch||0)*.6,-m.torso.rotation.y*.65,-m.torso.rotation.z*.7);
  for(let i=0;i<2;i++)m.arms[i].position.set((i?1:-1)*.251,1.30,.018).applyQuaternion(m.torso.quaternion).add(m.torso.position);
  const armSwing=wave*(.30+Math.min(1,g.speed/4)*.24)*weight;
  m.arms[0].rotation.set(armSwing*g.local.z,0,.10-Math.max(0,armSwing*g.local.x));m.arms[0].quaternion.premultiply(m.torso.quaternion);m.elbows[0].rotation.set(.16+Math.max(0,-armSwing*g.local.z)*.28,0,0);
  for(let i=0;i<2;i++){
   const side=i?1:-1,f=g.feet[i],leg=m.legs[i],joint=m.knees[i],foot=m.feet[i];leg.position.set(side*.12,.89+bob,0);
   if(!animated){leg.rotation.set(0,0,side*.04);joint.rotation.set(0,0,0);foot.rotation.set(0,-side*.10,0);continue;}
   // Two-link solve keeps the entire sole level during support, independently of hip swing.
   g.ankle.copy(f.position).sub(p).applyAxisAngle(g.up,-yaw);g.hip.copy(leg.position);g.u.copy(g.ankle).sub(g.hip);const d=B.clamp(g.u.length(),.03,.879);g.u.normalize();
   g.out.set(0,0,-1).addScaledVector(g.u,-g.u.z*-1).normalize();const along=(.38*.38-.50*.50+d*d)/(2*d),height=Math.sqrt(Math.max(0,.38*.38-along*along));g.knee.copy(g.hip).addScaledVector(g.u,along).addScaledVector(g.out,height);
   leg.quaternion.setFromUnitVectors(g.down,g.u.copy(g.knee).sub(g.hip).normalize());g.q.copy(leg.quaternion).invert();joint.quaternion.setFromUnitVectors(g.down,g.u.copy(g.ankle).sub(g.knee).applyQuaternion(g.q).normalize());
   g.sole.setFromAxisAngle(g.up,B.clamp(f.yaw-yaw,-.6,.6)-side*.10);g.q.copy(leg.quaternion).multiply(joint.quaternion).invert();foot.quaternion.copy(g.q).multiply(g.sole);
  }
  g.last.copy(p);g.lastYaw=yaw;m.phase=g.phase*Math.PI*2;
 };
 B.View.prototype.minerFloor=function(m,target,world){
  if(!target.grounded)return target.y-.025;
  const c=m.floorCache;if(c&&c.world===world&&c.revision===world.revision&&Math.hypot(c.x-target.x,c.z-target.z)<.10&&Math.abs(c.bodyY-target.y)<.12)return c.y;
  const candidates=[];
  // Surface Nets extends half a metre across chunk edges. Only the chunks
  // crossed by this one-metre vertical ray can contribute a floor.
  for(let x=Math.floor(target.x/8);x<=Math.floor((target.x+.5)/8);x++)for(let z=Math.floor(target.z/8);z<=Math.floor((target.z+.5)/8);z++)for(let y=Math.floor((target.y-.7)/8);y<=Math.floor((target.y+.8)/8);y++){
   const mesh=world.chunks.get(`${x},${y},${z}`)?.view;if(mesh)candidates.push(mesh);
  }
  this.minerApron ||= (this.yardArt?.children||[]).filter(n=>n.isMesh&&(n.material===this.palette.concrete||n.material===this.yardArtMaterials?.stone));
  if(target.z>15.5)candidates.push(...this.minerApron);
  const roof=B.TOWN.buildings.find(b=>{const r=B.TOWN.roof(b);return Math.abs(target.x-b.x)<r.reach+.3&&Math.abs(target.z-b.z)<r.depth/2+.3&&target.y>b.h-.2&&target.y<r.ridge+.5;});
  if(roof)candidates.push(...this.townRoofs);
  if(this.furnitureBounds?.some(b=>target.x>b[0]-.2&&target.x<b[3]+.2&&target.z>b[2]-.2&&target.z<b[5]+.2&&target.y>b[1]-.2&&target.y<b[4]+.4))candidates.push(...this.furnitureScene.children);
  this.minerFloorRay ||= new T.Raycaster();const ray=this.minerFloorRay;ray.ray.origin.set(target.x,target.y+.3,target.z);ray.ray.direction.set(0,-1,0);ray.far=1;
  const hits=ray.intersectObjects(candidates,false),floor=hits.find(h=>h.face?.normal.y>.3);
  const common=B.COMMON.outside(target.x,target.z)?B.COMMON.height(target.x,target.z):null;
  const y=floor?floor.point.y-.012:common!==null&&Math.abs(target.y-common)<.7?common-.012:target.y-.025;
  m.floorCache={world,x:target.x,z:target.z,bodyY:target.y,revision:world.revision,y};return y;
 };
 B.View.prototype.clearCrewBatches=function(){
  for(const groups of [this.crewBodyBatches,this.crewWeaponBatches])for(const group of groups?.values()||[]){
   for(const item of group.sources)item.source.visible=item.visible;
   if(group.mesh){this.scene.remove(group.mesh);if(group.mesh.userData.ownedCrewJointGeometry)group.mesh.geometry.dispose();group.mesh.dispose?.();}
  }
  this.crewBodyBatches=this.crewWeaponBatches=null;this.crewBatchMembershipDirty=true;
  this.crewBatchStats={groups:0,instances:0,capacity:0,instanceBytes:0};
  this.crewWeaponBatchStats={groups:0,instances:0,capacity:0,instanceBytes:0};
 };
 B.View.prototype.renderCrewBatches=function(){
  if(this.crewBatchMembershipDirty||!this.crewBodyBatches){
   this.clearCrewBatches();const groups=this.crewBodyBatches=new Map(),weapons=this.crewWeaponBatches=new Map();
   for(const m of this.miners?.values()||[])m.bodyMeshes.forEach((source,slot)=>{
    // Slot geometry and fabric are deterministic; retain exact material colours
    // and render-state boundaries instead of recolouring the shader.
    const key=[slot,...source.material.color.toArray(),source.castShadow,source.receiveShadow,source.layers.mask,source.renderOrder].join(':');
    if(!groups.has(key))groups.set(key,{sources:[],active:[],mesh:null,capacity:0});
    groups.get(key).sources.push({m,source,visible:source.visible});
   });
   for(const m of this.miners?.values()||[])for(const item of m.weaponMeshes||[]){
    const {source,materialKey}=item;
    // Clone geometry and template materials are shared. The sling core changes
    // emissive intensity per miner; translucent fields retain native sorting.
    if(source===m.core&&m.tool==='sling'||Array.isArray(source.material)||source.material.transparent)continue;
    const key=[source.geometry.uuid,materialKey,source.castShadow,source.receiveShadow,source.frustumCulled,source.layers.mask,source.renderOrder].join(':');
    if(!weapons.has(key))weapons.set(key,{sources:[],active:[],mesh:null,capacity:0});
    weapons.get(key).sources.push({m,source,visible:item.visible});
   }
   this.crewBatchMembershipDirty=false;
  }
  const stats=this.crewBatchStats={groups:0,instances:0,capacity:0,instanceBytes:0};
  const weaponStats=this.crewWeaponBatchStats={groups:0,instances:0,capacity:0,instanceBytes:0};
  if(!this.crewBodyBatches.size||this.miners.size<2)return;
  this.crewBatchFrustum ||= new T.Frustum();this.crewBatchProjection ||= new T.Matrix4();
  this.camera.updateMatrixWorld();this.crewBatchFrustum.setFromProjectionMatrix(this.crewBatchProjection.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse));
  // A posed piece is batched only when both native passes would submit it. The
  // other pieces keep their original culling, including off-camera casters.
  this.sun.updateWorldMatrix(true,false);this.sun.target.updateWorldMatrix(true,false);this.sun.shadow.updateMatrices(this.sun);
  const shadowFrustum=this.sun.shadow.getFrustum();
  for(const m of this.miners?.values()||[])m.root.updateWorldMatrix(true,true);
  this.renderCrewInstanceGroups(this.crewBodyBatches,stats,'crew-body-batch',shadowFrustum);
  this.renderCrewInstanceGroups(this.crewWeaponBatches,weaponStats,'crew-weapon-batch',shadowFrustum);
 };
 B.View.prototype.renderCrewInstanceGroups=function(groups,stats,name,shadowFrustum){
  for(const group of groups.values()){
   const active=group.active;active.length=0;
   for(const item of group.sources){
    const {m,source}=item;source.visible=item.visible;
    if(!item.visible||!m.root.visible||!source.layers.test(this.camera.layers)||source.frustumCulled&&!this.crewBatchFrustum.intersectsObject(source))continue;
    let parent=source.parent,shown=true;for(;parent&&parent!==m.root;parent=parent.parent)if(!parent.visible){shown=false;break;}if(!shown)continue;
    if(source.castShadow&&(!source.layers.test(this.sun.shadow.camera.layers)||source.frustumCulled&&!shadowFrustum.intersectsObject(source)))continue;
    active.push(item);
   }
   if(active.length>=2){
    if(group.capacity<active.length){
     if(group.mesh){this.scene.remove(group.mesh);if(group.mesh.userData.ownedCrewJointGeometry)group.mesh.geometry.dispose();group.mesh.dispose?.();}
     const source=active[0].source;group.capacity=2**Math.ceil(Math.log2(active.length));
     const geometry=source.userData.workerJoint?source.geometry.clone():source.geometry;
     if(source.userData.workerJoint)geometry.setAttribute('workerInstanceJoint',new T.InstancedBufferAttribute(new Float32Array(group.capacity*4),4).setUsage(T.DynamicDrawUsage));
     const mesh=group.mesh=new T.InstancedMesh(geometry,source.material,group.capacity);
     if(source.userData.workerJoint){mesh.userData.ownedCrewJointGeometry=true;mesh.customDepthMaterial=source.customDepthMaterial;mesh.customDistanceMaterial=source.customDistanceMaterial;}
     mesh.name=name;mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
     mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.layers.mask=source.layers.mask;mesh.renderOrder=source.renderOrder;this.scene.add(mesh);
    }
    group.mesh.count=active.length;group.mesh.visible=true;
    active.forEach(({source},i)=>{group.mesh.setMatrixAt(i,source.matrixWorld);if(source.userData.workerJoint){const q=source.userData.workerJoint.joint.quaternion;group.mesh.geometry.attributes.workerInstanceJoint.setXYZW(i,q.x,q.y,q.z,q.w);}source.visible=false;});group.mesh.instanceMatrix.needsUpdate=true;
    if(group.mesh.geometry.attributes.workerInstanceJoint)group.mesh.geometry.attributes.workerInstanceJoint.needsUpdate=true;
    stats.groups++;stats.instances+=active.length;
   }else if(group.mesh){group.mesh.count=0;group.mesh.visible=false;}
   stats.capacity+=group.capacity;stats.instanceBytes+=group.capacity*(group.mesh?.geometry.attributes.workerInstanceJoint?80:64);
  }
 };
 B.View.prototype.removeMiner=function(id){const m=this.miners?.get(id);if(!m)return;this.clearCrewBatches();m.root.traverse(n=>{if(n.isMesh&&!n.userData.sharedCrewAsset)n.geometry?.dispose();});m.texture.dispose();for(const texture of m.textures||[])texture.dispose();m.badge.material.dispose();[...m.materials,...(m.weaponMaterials||[])].forEach(material=>material.dispose());m.root.parent?.remove(m.root);this.miners.delete(id);};
 B.View.prototype.clearMiners=function(){for(const id of [...(this.miners?.keys()||[])])this.removeMiner(id);};
 B.View.prototype.renderCrew=function(game,dt){
  for(const light of this.crewLamps||[])light.intensity=0;
  const net=game.net;if(!net||net.role==='offline'){this.clearMiners();return;}const members=net.members.filter(p=>!p.local&&p.player),ids=new Set(members.map(p=>p.id)),lamps=[];for(const id of [...(this.miners?.keys()||[])])if(!ids.has(id))this.removeMiner(id);
  for(const p of members){let m=this.miners?.get(p.id);if(m&&(m.color!==p.color||m.label!==p.name)){this.removeMiner(p.id);m=null;}m ||= this.makeMiner(p.id,p.color,p.name);const target=p.player,position=new T.Vector3(target.x,this.minerFloor(m,target,game.world),target.z),distance=m.root.position.distanceTo(position);
   const reset=!m.initialized||distance>5;if(reset){m.root.position.copy(position);m.initialized=true;}else m.root.position.lerp(position,1-Math.exp(-dt*14));
   const delta=Math.atan2(Math.sin((target.yaw||0)-m.root.rotation.y),Math.cos((target.yaw||0)-m.root.rotation.y));m.root.rotation.y+=delta*(1-Math.exp(-dt*16));m.head.rotation.x=(target.pitch||0)*.6;
   const key=B.TOOLS[p.tool]?p.tool:'cutter';this.equipMiner(m,key);const firing=!!p.fire,charge=p.sling?.charge||p.transient?.charge||0,animated=game.settings.motion;
   this.poseMinerTravel(m,target,game.world,dt,animated,reset);
   m.actionPhase=(m.actionPhase||0)+dt;const swing=key==='axe'&&firing&&animated?Math.sin(m.actionPhase*11)*.55:0;
   this.poseMinerWeapon(m,target.pitch||0,swing,firing&&animated?Math.sin(m.actionPhase*47)*.008:0);
   if(m.attachments.cutter&&firing&&animated)m.attachments.cutter.rotation.z+=dt*32;
   if(m.attachments.scoop)m.attachments.scoop.rotation.x=firing&&animated?Math.sin(m.actionPhase*6)*.15:0;
   if(m.attachments.lance)m.attachments.lance.position.z=firing&&animated?Math.sin(m.actionPhase*25)*.045:0;
   m.forks.forEach((fork,i)=>fork.rotation.z=(i?1:-1)*charge*.18);if(m.core){if(key==='sling')m.core.material.emissiveIntensity=.5+charge*2;else m.core.scale.setScalar(1+(firing?.2:0)+(animated?Math.sin(m.actionPhase*3)*.08:0));}
   m.field.visible=['resonance','gravity','sling'].includes(key)&&(firing||charge>0);m.field.position.copy(m.weapon.position);m.field.rotation.copy(m.weapon.rotation);for(const [i,ring]of m.field.children.entries()){ring.rotation.z=animated?m.actionPhase*(i?-.8:.8):0;ring.material.color.set(B.TOOLS[key].color);ring.material.opacity=.35+Math.min(1,charge)*.4;}
   if(distance>.02||firing||m.gait.weight>.02||m.gait.feet.some(f=>f.swing)){m.shadowTime=(m.shadowTime||0)+dt;if(m.shadowTime>.1){m.shadowTime=0;this.renderer.shadowMap.needsUpdate=true;}}
   const d=this.camera.position.distanceTo(position),head={x:m.root.position.x,y:m.root.position.y+1.63,z:m.root.position.z};m.badge.visible=d<24&&game.world.clearLine(game.player.head,head,.08);m.root.visible=d>.5;
   if(target.y<-.5&&d<18&&m.badge.visible&&m.root.visible)lamps.push({head,yaw:m.root.rotation.y,pitch:target.pitch||0,d});
  }
  this.renderCrewBatches();
  if(lamps.length){
   this.crewLamps ||= Array.from({length:3},()=>{const light=new T.SpotLight('#dce9d3',0,14,.65,.55,1.5);this.scene.add(light,light.target);return light;});
   lamps.sort((a,b)=>a.d-b.d).slice(0,3).forEach((miner,i)=>{const light=this.crewLamps[i],c=Math.cos(miner.pitch),dir=new T.Vector3(-Math.sin(miner.yaw)*c,Math.sin(miner.pitch),-Math.cos(miner.yaw)*c);light.position.set(miner.head.x,miner.head.y,miner.head.z).addScaledVector(dir,.24);light.target.position.copy(light.position).addScaledVector(dir,5);light.intensity=1.8;});
  }
 };
 const menu=B.GameUI.prototype.menu;B.GameUI.prototype.menu=function(){if(this.game.screen==='crew')return this.crew();return menu.call(this);};
 B.GameUI.prototype.crew=function(){
  const g=this.game,net=g.net,b=this.frame('The digging crew','Ridge Common / global co-op');if(!net){this.wrap('Multiplayer unavailable.',b.x,b.y,b.w,18);return;}
  this.text(net.status,b.x,b.y,22,'#f0b94e');const descriptionEnd=this.wrap(net.syncing?'The crew is sending the mine. Your local claim is kept separately.':'One mine. Shared cargo, cash and upgrades. Pick a direction and make a hole together.',b.x,b.y+38,b.w,16,'#aab8a5');
  const y=Math.max(b.y+100,descriptionEnd+16);this.button('miner-name',this.nameEditing?this.nameDraft+' |':net.profile.name+'  /  edit name',b.x,y,Math.min(310,b.w),()=>{this.nameDraft=net.profile.name;this.nameEditing=true;},{h:44});
  for(let i=0;i<8;i++){const x=b.x+i*38;this.hit('helmet-'+i,x,y+58,30,30,()=>net.recolor(i));this.ctx.fillStyle=B.CREW_COLORS[i];this.ctx.fillRect(x,y+58,30,30);if(i===net.profile.color){this.ctx.strokeStyle='#fff1cd';this.ctx.lineWidth=2;this.ctx.strokeRect(x-3,y+55,36,36);}}
  const base=y+110,per=Math.max(1,Math.floor((b.bottom-base-100)/43)),members=net.members;this.pages=Math.ceil(members.length/per);this.page=B.clamp(this.page,0,this.pages-1);members.slice(this.page*per,(this.page+1)*per).forEach((p,i)=>{const yy=base+i*43;this.ctx.fillStyle=B.CREW_COLORS[p.color||0];this.ctx.fillRect(b.x,yy+4,9,20);this.text(this.fit(p.name+(p.local?' (you)':''),b.w-115,16),b.x+22,yy,16);this.text(p.id===net.hostId?'CREW LEAD':p.playing?'DIGGING':'TOOLS DOWN',b.x+b.w,yy+3,11,'#aab8a5','monospace','right');});
  const bottom=b.bottom-55;this.footer(b);
  if(net.role==='offline')this.button('join-crew','Join global crew',b.x,bottom,Math.min(260,b.w),()=>net.start(),{primary:true});else this.button('local-claim','Return to local claim',b.x,bottom,Math.min(260,b.w),async()=>{await net.leave();g.play();});
 };
 const bind=B.GameUI.prototype.bind;B.GameUI.prototype.bind=function(){
  window.addEventListener('keydown',e=>{if(!this.nameEditing)return;e.preventDefault();e.stopImmediatePropagation?.();e.__b2UIHandled=true;if(e.code==='Enter'){this.game.net.rename(this.nameDraft);this.nameEditing=false;}else if(e.code==='Escape')this.nameEditing=false;else if(e.code==='Backspace')this.nameDraft=this.nameDraft.slice(0,-1);else if(e.key?.length===1&&!e.ctrlKey&&!e.metaKey&&this.nameDraft.length<18)this.nameDraft+=e.key;this.dirty=true;},true);return bind.call(this);
 };
})(B2);
