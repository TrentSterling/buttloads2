import fs from 'node:fs';
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const baseline=process.argv.includes('--baseline'),h=await nodeGame(baseline?{sources:{'crew-view':fs.readFileSync(new URL('fixtures/crew-view-2.49.0.js',import.meta.url),'utf8')}}:{}),g=h.game,v=g.view,T=THREE,net=g.net,nativeFloor=v.minerFloor;
export let minerCarryChecks=0;
const test=(name,fn)=>{fn();minerCarryChecks++;console.log('PASS miner carry: '+name);};
const boot=tool=>{v.clearMiners();const p={id:'carry',name:'Copperhead',color:1,tool,playing:true,fire:false,player:{x:0,y:.012,z:12,grounded:true,yaw:0,pitch:0,vx:0,vz:0}};g.net={role:'fixture',members:[p],count:2};v.renderCrew(g,0);return p;};
const step=(p,dx,dz,dt=1/60)=>{p.player.x+=dx;p.player.z+=dz;p.player.vx=dx/dt;p.player.vz=dz/dt;v.renderCrew(g,dt);const m=v.miners.get(p.id);m.root.updateMatrixWorld(true);return m;};
const palm=(m,i)=>m.elbows[i].localToWorld(new T.Vector3(0,-.265,-.01));
try{
 v.minerFloor=()=>0;g.settings.motion=true;
 test('both palms retain mechanical tool contact while walking, firing and aiming steeply',()=>{
  for(const tool of ['cutter','scoop','lance','resonance'])for(const pitch of [-1.54,-1.45,-.8,0,.8,1.45,1.54])for(const [dx,dz]of [[0,-.025],[.025,0]]){
   const p=boot(tool);p.player.pitch=pitch;p.fire=true;for(let i=0;i<90;i++){const m=step(p,dx,dz),model=m.weapon.children[0],primary=model.localToWorld(new T.Vector3(0,-.22,.096)),support=model.localToWorld(new T.Vector3(-.145,-.07,-.085));assert.ok(palm(m,0).distanceTo(support)<.025,tool+' support glove misses the casing');assert.ok(palm(m,1).distanceTo(primary)<.025,tool+' primary glove misses the handle');for(let k=0;k<2;k++){const point=m.torso.worldToLocal(palm(m,k));assert.ok(point.z<-.175,JSON.stringify({tool,pitch,i,k,point:point.toArray()})+' glove sinks into chest');}}
  }
 });
 test('raised mechanical working ends remain separate from the animated head through firing and travel',()=>{
  let minimum=Infinity;
  for(const tool of ['cutter','scoop','lance','resonance'])for(const pitch of [1.2,1.54])for(const [dx,dz]of [[0,-.025],[.025,0]]){
   const p=boot(tool);p.player.pitch=pitch;p.fire=true;
   for(let i=0;i<180;i++){
    const m=step(p,dx,dz),head=new T.Box3().setFromObject(m.head),end=new T.Box3().setFromObject(m.attachments[tool]);
    const clearance=head.min.z-end.max.z;minimum=Math.min(minimum,clearance);
    assert.ok(clearance>0,JSON.stringify({tool,pitch,i,clearance})+' working end overlaps the head forward plane');
   }
  }
  console.log('Raised mechanical end minimum head-plane clearance: '+(minimum*1000).toFixed(2)+' mm (sampled animated poses).');
 });
 test('support palm is located at the real casing surface rather than an arbitrary air point',()=>{
  const p=boot('cutter'),m=step(p,0,0),model=m.weapon.children[0];model.updateWorldMatrix(true,true);
  const direction=new T.Vector3(1,.3,0).normalize(),point=new T.Vector3(-.145,-.07,-.085),origin=model.localToWorld(point.clone().addScaledVector(direction,-.12)),worldDirection=direction.transformDirection(model.matrixWorld),ray=new T.Raycaster(origin,worldDirection);const meshes=[];model.traverse(n=>{if(n.isMesh)meshes.push(n);});const hit=ray.intersectObjects(meshes,false)[0];assert.ok(hit,'support ray misses the actual casing');assert.ok(hit.point.distanceTo(model.localToWorld(point))<.025,'support point floats away from casing');
 });
 test('one-handed tools balance sideways travel without swinging the free glove through the hip',()=>{
  for(const [dx,dz]of [[.03,0],[-.03,0],[0,-.03],[0,.03]]){
   const p=boot('axe'),points=[];for(let i=0;i<150;i++){const m=step(p,dx,dz);if(i>30){const point=m.root.worldToLocal(palm(m,0));assert.ok(point.x<-.17,'free glove crosses the hip');points.push(point);}}
   const span=axis=>Math.max(...points.map(p=>p[axis]))-Math.min(...points.map(p=>p[axis]));if(dx){assert.ok(span('x')>.07,'sideways balance has no lateral motion');assert.ok(span('z')<.10,'sideways balance keeps swinging forward');}else assert.ok(span('z')>.18,'forward/backward travel has no arm swing');
  }
 });
 test('tool switching and reduced motion retain stable geometry, solved grips and reusable solver storage',()=>{
  const p=boot('cutter'),m=v.miners.get(p.id),body=m.bodyMeshes.slice(),geometry=body.map(n=>n.geometry),scratch=m.armSolve;for(const tool of Object.keys(B2.TOOLS))for(const animated of [true,false]){p.tool=tool;g.settings.motion=animated;for(let i=0;i<30;i++){step(p,0,-.025);assert.equal(m.armSolve,scratch);assert.deepEqual(m.bodyMeshes,body);assert.deepEqual(body.map(n=>n.geometry),geometry);if(['cutter','scoop','lance','resonance'].includes(tool)){const contact=m.weapon.children[0].localToWorld(new T.Vector3(-.145,-.07,-.085));assert.ok(palm(m,0).distanceTo(contact)<.025);}}}g.settings.motion=true;
 });
}finally{v.minerFloor=nativeFloor;v.clearMiners();g.net=net;clearInterval(net.timer);h.close();}
console.log(`COMPLETE ${minerCarryChecks} miner carry checks passed (dual grips, physical casing contact, travel direction and transitions; visual verdict separate)`);
