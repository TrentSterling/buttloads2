import assert from 'node:assert/strict';
import fs from 'node:fs';
import {nodeGame} from './node-game.mjs';
const baseline=process.argv.includes('--baseline'),h=await nodeGame(baseline?{sources:{'crew-view':fs.readFileSync('tools/out/miner-motion-before/crew-view.js','utf8')}}:{}),g=h.game,v=g.view,T=THREE,net=g.net;
export let minerMotionChecks=0;
const test=(name,fn)=>{fn();minerMotionChecks++;console.log('PASS miner motion: '+name);};
const nativeFloor=v.minerFloor,world=g.world;
v.camera.position.set(0,1.65,20);g.player.teleport(0,.06,20);g.settings.motion=true;
const boot=(tool='cutter')=>{v.clearMiners();const p={id:'motion',name:'Copperhead',color:1,tool,playing:true,fire:false,player:{x:0,y:.012,z:12,grounded:true,yaw:0,pitch:0,vx:0,vz:0}};g.net={role:'fixture',members:[p],count:2};v.renderCrew(g,0);return p;};
const step=(p,dx,dz,dt=1/60)=>{p.player.x+=dx;p.player.z+=dz;p.player.vx=dx/dt;p.player.vz=dz/dt;v.renderCrew(g,dt);const m=v.miners.get(p.id);m.root.updateMatrixWorld(true);return m;};
const pos=n=>n.getWorldPosition(new T.Vector3()),grip=m=>{const model=m.weapon.children[0],point=m.tool==='gravity'?new T.Vector3(0,-.168,.04):m.tool==='axe'?new T.Vector3(-.01,-.13,.022):m.tool==='sling'?new T.Vector3(0,-.11,.024):new T.Vector3(0,-.22,.096);return model.localToWorld(point).distanceTo(m.elbows[1].localToWorld(new T.Vector3(0,-.265,-.01)));};
try{
 v.minerFloor=()=>0;
 test('actual rendered boots hold world position for sustained support instead of sliding with the capsule',()=>{
  const p=boot(),last=[null,null],runs=[0,0];let longest=0,rootTravel=0;
  for(let i=0;i<240;i++){const m=step(p,0,-1.5/60),feet=m.feet.map(pos);if(i>30)for(let j=0;j<2;j++){runs[j]=last[j]&&feet[j].distanceTo(last[j])<.001?runs[j]+1:0;longest=Math.max(longest,runs[j]);}last.splice(0,2,...feet);rootTravel=m.root.position.z;}
  assert.ok(rootTravel<7,'the rendered root must actually travel');assert.ok(longest>=10,`longest planted run ${longest} frames`);
 });
 test('forward, backward and both strafes preserve soles and leg reach from slow walking to sprinting',()=>{
  for(const speed of [.5,1.5,3,6])for(const [dx,dz]of [[0,-1],[0,1],[1,0],[-1,0]]){
   const p=boot();let raised=0;
   for(let i=0;i<180;i++){const m=step(p,dx*speed/60,dz*speed/60);for(let j=0;j<2;j++){
    assert.ok(pos(m.feet[j]).distanceTo(m.gait.feet[j].position)<.004,JSON.stringify({reason:'unreachable sole',speed,dx,dz,i,j,hip:m.legs[j].position.toArray(),foot:m.gait.feet[j].position.toArray(),root:m.root.position.toArray(),actual:pos(m.feet[j]).toArray()}));const up=new T.Vector3(0,1,0).applyQuaternion(m.feet[j].getWorldQuaternion(new T.Quaternion()));assert.ok(up.y>.999,'sole tilts into the floor');
    const knee=pos(m.knees[j]),hip=pos(m.legs[j]);assert.ok(knee.y<hip.y&&knee.y>pos(m.feet[j]).y,'inverted knee');if(m.gait.feet[j].swing&&pos(m.feet[j]).y>.055)raised++;
   }if(dx&&i>45){const a=new T.Box3().setFromObject(m.feet[0]),b=new T.Box3().setFromObject(m.feet[1]);assert.ok(!a.intersectsBox(b),JSON.stringify({reason:'strafe boots intersect',speed,dx,i,a:[a.min.toArray(),a.max.toArray()],b:[b.min.toArray(),b.max.toArray()],feet:m.gait.feet.map(f=>f.position.toArray())}));}}assert.ok(raised>10,'walking must lift boots');
  }
 });
 test('reported velocity cannot animate stationary rigs; stopping completes a step and settles both feet',()=>{
  const p=boot();p.player.vx=6;p.player.vz=4;for(let i=0;i<120;i++)v.renderCrew(g,1/60);const m=v.miners.get(p.id),prior=m.feet.map(pos),phase=m.gait.phase;
  for(let i=0;i<120;i++)v.renderCrew(g,1/60);assert.equal(m.gait.phase,phase);m.root.updateMatrixWorld(true);m.feet.forEach((n,i)=>assert.ok(pos(n).distanceTo(prior[i])<1e-8));
  for(let i=0;i<100;i++)step(p,0,-.025);for(let i=0;i<180;i++)step(p,0,0);assert.ok(m.gait.feet.every(f=>!f.swing));
  for(let i=0;i<2;i++){const local=m.root.worldToLocal(pos(m.feet[i]));assert.ok(Math.abs(local.z)<.036&&Math.abs(local.x-(i?.12:-.12))<.036);}
 });
 test('sideways starts, reversal and stops preserve each supported sole orientation; turns occur while lifted',()=>{
  for(const hz of [30,60,144])for(const speed of [.5,1.5,3.8,6])for(const start of [1,-1]){
   const p=boot(),last=[null,null];let supportedPairs=0,turns=0;
   for(let i=0;i<hz*6;i++){
    const direction=i<hz*2?start:i<hz*4?-start:0,m=step(p,direction*speed/hz,0,1/hz);
    assert.ok(!new T.Box3().setFromObject(m.feet[0]).intersectsBox(new T.Box3().setFromObject(m.feet[1])),JSON.stringify({reason:'reversal boots overlap',hz,speed,i,boxes:m.feet.map(n=>{const b=new T.Box3().setFromObject(n);return [b.min.toArray(),b.max.toArray()];}),feet:m.gait.feet.map(f=>({position:f.position.toArray(),yaw:f.yaw,swing:f.swing,settling:f.settling,turning:f.turning}))}));
    for(let j=0;j<2;j++){
     const q=m.feet[j].getWorldQuaternion(new T.Quaternion()),f=m.gait.feet[j],prior=last[j];
     assert.ok(pos(m.feet[j]).distanceTo(f.position)<.005,JSON.stringify({reason:'reversal sole unreachable',hz,speed,i,j,root:m.root.position.toArray(),hip:pos(m.legs[j]).toArray(),actual:pos(m.feet[j]).toArray(),feet:m.gait.feet.map(f=>({position:f.position.toArray(),yaw:f.yaw,swing:f.swing,settling:f.settling}))}));
     if(prior&&!prior.lifted&&!f.swing&&!f.settling){assert.ok(q.angleTo(prior.q)<1e-6,JSON.stringify({reason:'planted sole twists',hz,i,j,angle:q.angleTo(prior.q),root:m.root.position.toArray(),f:{yaw:f.yaw,aimYaw:f.aimYaw,phase:f.phase,position:f.position.toArray()},q:q.toArray(),prior:prior.q.toArray()}));supportedPairs++;}
     if(prior&&q.angleTo(prior.q)>.005){assert.ok(f.swing||f.settling||prior.lifted,'sole turns without a step');turns++;}
     last[j]={q,lifted:f.swing||f.settling};
    }
   }
   assert.ok(supportedPairs>hz*2,'no sustained supported sole orientations');assert.ok(turns>hz/4,'sideways travel never turns the boots');
   const m=v.miners.get(p.id);assert.ok(m.gait.feet.every(f=>!f.swing&&!f.settling),JSON.stringify({reason:'sideways stop never settles',hz,speed,start,idle:m.gait.idle,feet:m.gait.feet.map(f=>({position:f.position.toArray(),yaw:f.yaw,swing:f.swing,settling:f.settling,phase:f.phase}))}));
   m.feet.forEach((n,j)=>{const local=m.root.worldToLocal(pos(n));assert.ok(Math.abs(local.z)<.036&&Math.abs(local.x-(j?.12:-.12))<.036,'sideways stop retains the wide stance');});
  }
 });
 test('all seven grips remain attached through moving, firing and steep aiming poses',()=>{
  for(const tool of Object.keys(B2.TOOLS))for(const pitch of [-1.2,0,1.2]){const p=boot(tool);p.player.pitch=pitch;p.fire=true;for(let i=0;i<90;i++){const m=step(p,i%2?.02:-.02,-.04);assert.ok(grip(m)<.025,tool+' grip detached');}}
 });
 test('teleport, airborne travel and reduced motion cannot retain stale world foot anchors',()=>{
  const p=boot();for(let i=0;i<70;i++)step(p,0,-.025);let m=v.miners.get(p.id),old=m.gait;p.player.x+=12;v.renderCrew(g,1/60);assert.notEqual(m.gait,old);m.root.updateMatrixWorld(true);assert.ok(m.feet.every(n=>Math.abs(pos(n).x-m.root.position.x)<.15));
  p.player.grounded=false;p.player.y=3;v.renderCrew(g,1/60);assert.ok(m.gait.feet.every(f=>!f.swing));assert.ok(m.gait.feet.every(f=>f.position.y>m.root.position.y+.1));
  g.settings.motion=false;for(let i=0;i<60;i++)step(p,.02,0);assert.ok(Math.abs(m.torso.rotation.x)<1e-12);assert.ok(Math.abs(m.torso.rotation.z)<1e-12);assert.ok(Math.abs(m.legs[0].rotation.x)<1e-12);assert.ok(Math.abs(m.knees[0].rotation.x)<1e-12);g.settings.motion=true;
  p.player.grounded=true;p.player.y=.012;v.renderCrew(g,1/60);assert.ok(m.gait.feet.every(f=>Math.abs(f.position.y-.015)<1e-8));
 });
 test('step support queries are bounded and steep drops shorten the foot target towards supported ground',()=>{
  let queries=0;v.minerFloor=(m,t)=>{queries++;return t.z<11.6?-.6:0;};const p=boot();let peak=0;
  for(let i=0;i<40;i++){const prior=queries,m=step(p,0,-.006);peak=Math.max(peak,queries-prior);for(const f of m.gait.feet)assert.ok(f.position.y>=m.root.position.y-.165-1e-8);}
  // One root query and at most three support probes per foot; there are no
  // terrain raycasts per bone or continuously updated planted boot.
  assert.ok(peak<=7,'unbounded support probes');const prior=queries;for(let i=0;i<240;i++)step(p,0,0);const settled=queries;for(let i=0;i<60;i++)step(p,0,0);assert.equal(queries-settled,60);assert.ok(settled-prior<260);
  v.minerFloor=()=>0;
 });
 test('body and weapon allocations stay stable through motion and source triangles are conserved',()=>{
  const p=boot(),m=v.miners.get(p.id),body=m.bodyMeshes.slice(),weapon=m.weapon.children[0],geometries=body.map(n=>n.geometry),materials=body.map(n=>n.material);let tri=0;for(const n of body)tri+=(n.geometry.index?.count||n.geometry.attributes.position.count)/3;assert.equal(body.length,42);
  for(let i=0;i<240;i++){step(p,0,-.025);assert.equal(m.weapon.children[0],weapon);assert.deepEqual(m.bodyMeshes,body);assert.deepEqual(m.bodyMeshes.map(n=>n.geometry),geometries);assert.deepEqual(m.bodyMeshes.map(n=>n.material),materials);}assert.equal(tri,body.reduce((sum,n)=>sum+(n.geometry.index?.count||n.geometry.attributes.position.count)/3,0));
 });
 test('render rates of 30, 60 and 144 preserve planted endpoints and complete stop shadows',()=>{
  for(const hz of [30,60,144]){const p=boot();for(let i=0;i<hz*3;i++){const m=step(p,0,-3/hz,1/hz);for(let j=0;j<2;j++)assert.ok(pos(m.feet[j]).distanceTo(m.gait.feet[j].position)<.005);}
   let refreshed=0;for(let i=0;i<hz;i++){v.renderer.shadowMap.needsUpdate=false;step(p,0,0,1/hz);if(v.renderer.shadowMap.needsUpdate)refreshed++;}assert.ok(refreshed>0,'settling step left stale shadows');
  }
 });
 test('terrain edits refresh support at a bounded rate without restarting the stride',()=>{
  const p=boot();for(let i=0;i<60;i++)step(p,0,-.025);const m=v.miners.get(p.id),gait=m.gait,revision=g.world.revision,phase=gait.phase;
  try{for(let i=0;i<60;i++){g.world.revision++;step(p,0,-.025);assert.equal(m.gait,gait);}assert.ok(gait.phase>phase+1);assert.ok(g.world.revision-gait.revision<8);}finally{g.world.revision=revision;}
 });
 v.minerFloor=nativeFloor;
 test('native floor plants remain close to rendered support on real supported capsule travel',()=>{
  const p=boot(),probe=new B2.Player(g.world);probe.obstacles=g.player.obstacles;probe.teleport(3,.06,13);probe.yaw=0;for(let i=0;i<60;i++)probe.step(1/120,new Set(),1.5);v.clearMiners();Object.assign(p.player,{x:probe.x,y:probe.y,z:probe.z,grounded:true});v.renderCrew(g,0);let plants=0;
  for(let i=0;i<120;i++){probe.step(1/60,new Set(['KeyW']),1.5);assert.ok(probe.grounded&&!probe.blocked(probe.x,probe.y,probe.z));Object.assign(p.player,{x:probe.x,y:probe.y,z:probe.z,grounded:true,vx:probe.vx,vz:probe.vz});v.renderCrew(g,1/60);const m=v.miners.get(p.id);m.root.updateMatrixWorld(true);
   for(let j=0;j<2;j++)if(!m.gait.feet[j].swing){const ankle=pos(m.feet[j]),floor=v.minerFloor({}, {x:ankle.x,y:probe.y,z:ankle.z,grounded:true},g.world)+.015;assert.ok(Math.abs(ankle.y-floor)<.03,JSON.stringify({reason:'native support mismatch',i,j,ankle:ankle.toArray(),floor,root:m.root.position.toArray(),probe:[probe.x,probe.y,probe.z]}));plants++;}
  }assert.ok(plants>100);
 });
 const p=boot();for(let i=0;i<60;i++)step(p,0,-.012);const rig=v.miners.get(p.id),oldGait=rig.gait;
 await g.install(B2.Saves.validate(B2.Saves.snapshot(g)));v.renderCrew(g,0);
 test('portable world replacement resets cached support without recreating the live miner',()=>{assert.equal(v.miners.get(p.id),rig);assert.notEqual(rig.gait,oldGait);assert.equal(rig.gait.world,g.world);assert.equal(rig.gait.revision,g.world.revision);});
}finally{v.minerFloor=nativeFloor;v.clearMiners();g.net=net;clearInterval(net.timer);h.close();}
console.log(`COMPLETE ${minerMotionChecks} miner motion checks passed (travel, planting, grips and support; no physical input or FPS claim)`);
