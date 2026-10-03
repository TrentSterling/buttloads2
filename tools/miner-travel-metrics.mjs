// Actual rig observations; no renderer timing or physical input.
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE,net=g.net,nativeFloor=v.minerFloor,source=fs.readFileSync(new URL('../src/crew-view.js',import.meta.url),'utf8'),current=B2.View.prototype.poseMinerTravel;
vm.runInThisContext(fs.readFileSync(new URL('fixtures/crew-view-2.63.0.js',import.meta.url),'utf8'));const prior=B2.View.prototype.poseMinerTravel;vm.runInThisContext(source);
const rows=[];g.settings.motion=true;v.minerFloor=()=>0;
try{
 for(const [label,fn]of [['released',prior],['candidate',current]])for(const speed of [1.5,3.8,6])for(const [direction,dx,dz]of [['forward',0,-1],['backward',0,1],['right',1,0],['left',-1,0],['diagonal',Math.SQRT1_2,-Math.SQRT1_2]]){
  v.poseMinerTravel=fn;v.clearMiners();const p={id:'travel',name:'Copperhead',color:1,tool:'cutter',playing:true,player:{x:0,y:.012,z:12,grounded:true,yaw:0,pitch:0,vx:0,vz:0}};g.net={role:'fixture',members:[p],count:2};v.renderCrew(g,0);
  let minimumHip=Infinity,meanHip=0,maxReachError=0,maxGripError=0,maxFootTravel=0,plants=0,collisionFrames=0,maxKneeBend=0,maxForeAftSeparation=0,maxLateralSeparation=0;const last=[null,null];
  for(let i=0;i<240;i++){
   p.player.x+=dx*speed/60;p.player.z+=dz*speed/60;p.player.vx=dx*speed;p.player.vz=dz*speed;v.renderCrew(g,1/60);const m=v.miners.get(p.id);m.root.updateMatrixWorld(true);if(i<60)continue;
   const hip=m.legs[0].position.y;minimumHip=Math.min(minimumHip,hip);meanHip+=hip;
   const feet=m.feet.map(n=>n.getWorldPosition(new T.Vector3()));maxForeAftSeparation=Math.max(maxForeAftSeparation,Math.abs(feet[0].z-feet[1].z));maxLateralSeparation=Math.max(maxLateralSeparation,Math.abs(feet[0].x-feet[1].x));
   for(let j=0;j<2;j++){maxReachError=Math.max(maxReachError,feet[j].distanceTo(m.gait.feet[j].position));maxKneeBend=Math.max(maxKneeBend,2*Math.acos(Math.min(1,Math.abs(m.knees[j].quaternion.w))));if(!m.gait.feet[j].swing&&!m.gait.feet[j].settling){plants++;if(last[j])maxFootTravel=Math.max(maxFootTravel,feet[j].distanceTo(last[j]));last[j]=feet[j];}else last[j]=null;}
   const model=m.weapon.children[0],point=model.localToWorld(new T.Vector3(0,-.22,.096)),palm=m.elbows[1].localToWorld(new T.Vector3(0,-.265,-.01));maxGripError=Math.max(maxGripError,palm.distanceTo(point));
   if(new T.Box3().setFromObject(m.feet[0]).intersectsBox(new T.Box3().setFromObject(m.feet[1])))collisionFrames++;
  }
  rows.push({label,speed,direction,minimumHip,meanHip:meanHip/180,maxKneeBendDegrees:maxKneeBend*180/Math.PI,maxForeAftSeparation,maxLateralSeparation,maxReachError,maxGripError,maxPlantedFootTravel:maxFootTravel,plants,collisionFrames});
 }
 fs.writeFileSync(new URL('out/miner-travel-metrics.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),sourceSha256:createHash('sha256').update(source).digest('hex'),baselineSourceSha256:createHash('sha256').update(fs.readFileSync(new URL('fixtures/crew-view-2.63.0.js',import.meta.url))).digest('hex'),frames:7200,scope:'Thirty actual flat-floor rig traces; average/max constraints, no speedup or global intersection claim',rows},null,2));
 for(const speed of [1.5,3.8,6])for(const direction of ['forward','right']){const r=rows.filter(r=>r.speed===speed&&r.direction===direction);console.log(JSON.stringify(r.map(x=>({label:x.label,speed,direction,hip:[x.minimumHip,x.meanHip],kneeDegrees:x.maxKneeBendDegrees,foreAft:x.maxForeAftSeparation,lateral:x.maxLateralSeparation,plants:x.plants,slip:x.maxPlantedFootTravel,reach:x.maxReachError,collisions:x.collisionFrames}))));}
}finally{v.poseMinerTravel=current;v.minerFloor=nativeFloor;v.clearMiners();g.net=net;clearInterval(net.timer);h.close();}
