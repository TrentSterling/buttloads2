// Actual Game.boot animation callback, Crew.receive and full Game.update.
// Only presentation, storage and transport are inert. No browser or desktop input.
import {nodeGame} from './node-game.mjs';
export async function authorityReplay({hz=144,duration=2,inputHz=20,heartbeat=false,gameSource,multiplayerSource,stopAt=Infinity,invalid=false,controlTraffic=false}={}){
 const originalPerformance=globalThis.performance;let now=0,frame,renderCount=0,updates=0,maxUpdateDt=0,poses=0,frames=0,seq=0;
 globalThis.performance={now:()=>now};
 let h;
 try{
  h=await nodeGame({gameSource,multiplayerSource,animationFrame:fn=>{frame=fn;return 1;}});
  const g=h.game,n=g.net;g.view.render=()=>{renderCount++;};
  n.id=n.hostId='lead';n.room={getPeers:()=>({guest:{}})};n.sendControl=async m=>{if(m.type==='poses')poses++;if(m.type==='frame')frames++;};n.sendPatch=async()=>{};n.becomeHost(false);
  const p={id:'guest',hello:true,synced:true,last:0,profile:{name:'Replay',color:1},input:{seq:0,playing:false}};
  n.peers.set(p.id,p);n.makeRemote(p);p.player.teleport(3,.06,11.5);p.synced=true;
  const update=g.update.bind(g);g.update=dt=>{updates++;maxUpdateDt=Math.max(maxUpdateDt,dt);update(dt);};
  const initial=p.player.position,trace=[];let nextInput=0,nextFrame=hz?0:Infinity,nextHeartbeat=1;
  while(Math.min(nextInput,nextFrame,heartbeat?nextHeartbeat:Infinity)<=duration+1e-8){
   const t=Math.min(nextInput,nextFrame,heartbeat?nextHeartbeat:Infinity);now=t*1000;
   if(nextInput<=t+1e-8){
    if(t<=stopAt+1e-8)n.receive({v:B2.CREW_PROTOCOL,type:'input',seq:++seq,keys:['KeyD'],yaw:0,pitch:invalid?NaN:0,playing:true,tool:'cutter',fire:false},p.id);
    nextInput+=1/inputHz;
   }
   if(nextFrame<=t+1e-8){frame(now);nextFrame+=1/hz;}
   if(heartbeat&&nextHeartbeat<=t+1e-8){if(controlTraffic)n.receive({v:B2.CREW_PROTOCOL,type:'ping',at:t},p.id);n.heartbeat();nextHeartbeat++;}
   trace.push({time:t,x:p.player.x,y:p.player.y,z:p.player.z,simulationTime:g.clock,networkTime:n.time,poses,renderCount});
  }
  return {hz,duration,inputHz,heartbeat,controlTraffic,stopAt:Number.isFinite(stopAt)?stopAt:null,invalid,distance:p.player.x-initial.x,simulationTime:g.clock,networkTime:n.time,poses,frames,renderCount,updates,maxUpdateDt,blocked:p.player.blocked(p.player.x,p.player.y,p.player.z),errors:[...n.errors],trace};
 }finally{if(h){h.game.net.room=null;h.game.net.role='offline';clearInterval(h.game.net.timer);h.close();}globalThis.performance=originalPerformance;}
}
