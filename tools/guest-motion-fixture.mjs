// Production Crew receive/prediction and Player contact; all presentation is inert.
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
export function loadCrew(source=fs.readFileSync(new URL('src/multiplayer.js',root),'utf8')){
 const B={};const context=vm.createContext({B2:B,structuredClone});
 for(const file of ['core','town','deep-terrain','player','expedition'])vm.runInContext(fs.readFileSync(new URL('src/'+file+'.js',root),'utf8'),context);
 vm.runInContext(source,context);return B;
}
export function fixture(B,world={floor:-297,density:(x,y,z)=>y}){
 const g={player:new B.Player(world),store:{key:'current'},economy:{state:B.freshState()},running:true,clock:0,accumulator:0,combat:{hurtFlash:0,state:{health:100}},refreshPlayerObstacles(){},playerLiftSpeed:()=>6,input:{keys:new Set(['KeyD']),fire:false},expedition:{state:{tool:'axe'}},gadgets:{modes:()=>['blast']},actions:{swingAge:0},cutter:{},mining:{update(){}},feedback:{update(){}},audio:{drill(){},update(){},note(){}},updateHUD(){},toast(){}};
 g.player.teleport(0,.06,0);g.player.vx=3.8;g.player.grounded=true;
 const n=new B.Crew(g);n.id='guest';n.hostId='lead';n.role='guest';n.ready=true;n.epoch='trace';n.peers.set('lead',{id:'lead',hello:true,ping:0});
 return {g,n};
}
export function runGuestMotion(B,{rtt=0,gap=null,turn=false,wall=false,hz=144,duration=4}={}){
 const world={floor:-297,density:(x,y,z)=>y},h=fixture(B,world),{g,n}=h,authority=fixture(B,world),host=authority.n;
 host.id=host.hostId='lead';host.role='host';host.peers.clear();const p={id:'guest',hello:true,synced:true,player:authority.g.player,keys:new Set(['KeyD']),tool:'cutter',input:{seq:0,playing:true}};host.peers.set(p.id,p);p.player.obstacles=wall?[[1,0,-6,2,3,6]]:[];g.player.obstacles=p.player.obstacles;
 n.peers.get('lead').ping=rtt;let hostAccumulator=0,inputAt=0,poseAt=0,inputSeq=0,poseSeq=0,corrections=0,correctionDistance=0,teleports=0,maxTeleport=0,maxCorrection=0;
 const correct=g.player.correctPosition.bind(g.player),teleport=g.player.teleport.bind(g.player);
 g.player.correctPosition=(x,y,z)=>{const d=Math.hypot(x-g.player.x,y-g.player.y,z-g.player.z);corrections++;correctionDistance+=d;maxCorrection=Math.max(maxCorrection,d);correct(x,y,z);};
 g.player.teleport=(x,y,z)=>{const d=Math.hypot(x-g.player.x,y-g.player.y,z-g.player.z);teleports++;maxTeleport=Math.max(maxTeleport,d);teleport(x,y,z);};
 const queue=[],trace=[];for(let i=0;i<Math.ceil(duration*hz);i++){
  const t=(i+1)/hz,dt=1/hz;n.time=host.time=t;g.player.yaw=turn?Math.sin(t*2)*1.0:wall?Math.PI/4:0;g.player.pitch=Math.sin(t)*.1;
  g.input.keys=new Set(['KeyD']);
  if(t-inputAt>=.05-1e-8){inputAt=t;queue.push({when:t+rtt/2000,kind:'input',packet:{v:B.CREW_PROTOCOL||2,type:'input',seq:++inputSeq,keys:[...g.input.keys],yaw:g.player.yaw,pitch:g.player.pitch,playing:true,tool:'cutter'}});}
  for(let j=queue.length-1;j>=0;j--)if(queue[j].when<=t&&queue[j].kind==='input'){host.receive(queue[j].packet,p.id);queue.splice(j,1);}
  hostAccumulator+=dt;while(hostAccumulator>=1/120){p.player.step(1/120,p.keys,6);hostAccumulator-=1/120;}
  if(t-poseAt>=.05-1e-8){poseAt=t;const members=[{id:'guest',player:{...p.player.position,vx:p.player.vx,vy:p.player.vy,vz:p.player.vz,yaw:p.player.yaw,pitch:p.player.pitch},health:100}];if(!gap||t<gap[0]||t>gap[1])queue.push({when:t+rtt/2000,kind:'pose',packet:{v:B.CREW_PROTOCOL||2,type:'poses',epoch:'trace',seq:++poseSeq,at:t,members}});}
  for(let j=0;j<queue.length;)if(queue[j].when<=t&&queue[j].kind==='pose'){n.receive(queue[j].packet,'lead');queue.splice(j,1);}else j++;
  n.updateGuest(dt);const camera=g.player.cameraPose(g.accumulator*120,dt);
  trace.push({time:t,camera,position:g.player.position,host:p.player.position,correctionDistance,teleports,maxTeleport,aimError:Math.abs(camera.yaw-g.player.yaw),blocked:g.player.blocked(g.player.x,g.player.y,g.player.z)});
 }
 return {rtt,gap,turn,wall,hz,corrections,correctionDistance,maxCorrection,teleports,maxTeleport,end:g.player.position,host:p.player.position,aimError:Math.max(...trace.map(f=>f.aimError)),blockedFrames:trace.filter(f=>f.blocked).length,trace};
}
export function poseOrder(B){
 const {g,n}=fixture(B);n.peers.set('other',{id:'other',hello:true});const members=(x,health,tool)=>[{id:n.id,player:{x,y:.06,z:0,yaw:0,pitch:0},health},{id:'other',player:{x,y:.06,z:2,yaw:0,pitch:0},health,tool}];
 n.applyPoses(members(3,70,'lance'),3);n.applyPoses(members(2,100,'cutter'),2);
 return {positionX:n.serverPose.x,health:g.combat.state.health,remoteTool:n.peers.get('other').tool};
}
