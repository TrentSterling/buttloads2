// Production Crew tick/receive/members/stepRemotes/updateGuest and Player contact.
// Nonmovement world systems, rendering and transport are inert; no browser or OS input.
import {loadCrew,fixture} from './guest-motion-fixture.mjs';
export {loadCrew};
function systems(g){
 g.world=g.player.world;
 g.expedition.state=g.economy.state.expedition;g.expedition.state.tool='axe';g.expedition.update=()=>false;g.expedition.pulseSerial=0;
 g.gadgets.state={chargeMode:'blast'};g.kinetics={state:{held:null,charge:0},consumePulse(){},control(){}};g.thunder={consumePulse(){}};
 g.cutter.trace=()=>null;g.actions.update=()=>{};g.collect=()=>{};g.survey={update(){}};g.changed=()=>{};g.feedback.cut=()=>{};
}
export function latencyReplay(B,{rtt=250,hz=144,duration=4,turn=true,wall=false,stop=false,gap=null,jitter=0,clockOffset=0,warp=0,fresh=false}={}){
 const world={floor:-297,density:(x,y,z)=>y,normal:()=>[0,1,0],canDig:()=>false},local=fixture(B,world),authority=fixture(B,world),{g,n}=local,host=authority.n;systems(g);systems(authority.g);
 host.id=host.hostId='lead';host.role='host';host.peers.clear();host.world=world;
 const p={id:'guest',hello:true,synced:true,last:0,profile:{name:'Replay',color:1},health:100,player:new B.Player(world),keys:new Set(['KeyD']),tool:'axe',input:{seq:0,playing:true},cutter:{},actions:{update(){}},transient:{},weapon:{},sling:{held:null,charge:0}};
 p.player.teleport(0,.06,0);p.player.vx=3.8;p.player.grounded=true;host.peers.set(p.id,p);
 p.last=clockOffset;p.input.received=clockOffset;
 if(fresh){g.player.vx=p.player.vx=0;p.input.playing=false;p.keys.clear();}
 g.player.obstacles=authority.g.player.obstacles=p.player.obstacles=wall?[[1,0,-6,2,3,6]]:[];
 n.peers.get('lead').ping=rtt;n.world=world;let corrections=0,correctionDistance=0,maxCorrection=0,teleports=0,maxTeleport=0,aligned=0,poses=0;
 const correct=g.player.correctPosition.bind(g.player),teleport=g.player.teleport.bind(g.player);
 g.player.correctPosition=(x,y,z)=>{const d=Math.hypot(x-g.player.x,y-g.player.y,z-g.player.z);corrections++;correctionDistance+=d;maxCorrection=Math.max(maxCorrection,d);correct(x,y,z);};
 g.player.teleport=(x,y,z)=>{const d=Math.hypot(x-g.player.x,y-g.player.y,z-g.player.z);teleports++;maxTeleport=Math.max(maxTeleport,d);teleport(x,y,z);};
 const queue=[],trace=[];let packet=0,warped=false;
 const send=(from,m)=>{if(!['input','poses'].includes(m.type))return Promise.resolve();if(m.type==='poses'&&gap&&from.time-clockOffset>=gap[0]&&from.time-clockOffset<=gap[1])return Promise.resolve();const delay=Math.max(0,rtt/2000+jitter/1000*Math.sin(++packet*2.13));queue.push({when:from.time-(from===host?clockOffset:0)+delay,from:from===host?'lead':'guest',m:structuredClone(m)});return Promise.resolve();};
 for(const from of [n,host]){from.room={};from.patchAt=from.frameAt=Infinity;from.sendControl=m=>send(from,m);}
 for(let i=0;i<Math.ceil(duration*hz);i++){
  const t=(i+1)/hz,dt=1/hz;n.time=t;host.time=t+clockOffset;
  g.player.yaw=turn?Math.sin(t*2):wall?Math.PI/4:0;g.player.pitch=Math.sin(t)*.1;g.input.keys=new Set(stop&&t>=2?[]:['KeyD']);
  // Deliver before each side advances the current interval; tick publishes afterward.
  for(let j=0;j<queue.length;)if(queue[j].when<=t+1e-8){const q=queue.splice(j,1)[0];if(q.from==='guest')host.receive(q.m,p.id);else{n.receive(q.m,'lead');poses++;if(n.serverPose?.error)aligned++;}}else j++;
  if(warp&&!warped&&t>=1){p.player.correctPosition(p.player.x+warp,p.player.y,p.player.z);warped=true;}
  host.stepRemotes(dt);host.tick(0);n.updateGuest(dt);n.tick(0);
  const camera=g.player.cameraPose(g.accumulator*120,dt);
  trace.push({time:t,camera,position:g.player.position,host:p.player.position,correctionDistance,teleports,aimError:Math.abs(camera.yaw-g.player.yaw),blocked:g.player.blocked(g.player.x,g.player.y,g.player.z)});
 }
 const firstSecond=trace.find(f=>f.time>=1)?.correctionDistance||0;
 return {rtt,hz,duration,turn,wall,stop,gap,jitter,clockOffset,warp,fresh,corrections,correctionDistance,sustainedCorrectionDistance:correctionDistance-firstSecond,maxCorrection,teleports,maxTeleport,aligned,poses,end:g.player.position,host:p.player.position,aimError:Math.max(...trace.map(f=>f.aimError)),blockedFrames:trace.filter(f=>f.blocked).length,historySamples:n.predictionSamples?.length||0,rememberedInputs:n.predictionInputs?.size||0,trace};
}
