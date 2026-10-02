// Actual Crew host-remote and guest-prediction methods, inert transport, fixed 120 Hz.
import fs from 'node:fs';import assert from 'node:assert/strict';import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,n=g.net,dt=1/120,body=p=>[p.x,p.y,p.z,p.vx,p.vy,p.vz,p.grounded],report={date:new Date().toISOString(),scope:'Current-build native corner contacts through actual Crew role methods; no transport delay, public connection or physical input.',routes:[]};
try{
 for(const [name,at]of [['depot post graze',[3,.06,15.4]],['workshop corner',[-1.9,.06,15.4]]]){
  const setup=p=>{p.teleport(...at);p.yaw=Math.PI;p.pitch=-.05;p.obstacles=g.refreshPlayerObstacles();};
  const local=new B2.Player(g.world);setup(local);const expected=[];for(let i=0;i<240;i++){local.step(dt,new Set(['KeyW']),6);expected.push(body(local));}
  n.id=n.hostId='lead';n.role='host';n.peers.clear();const remote={id:'worker',hello:true,synced:true,last:0,profile:{name:'Corner replay',color:1},input:{seq:1,playing:true,fire:false,received:0}};n.peers.set(remote.id,remote);n.makeRemote(remote);setup(remote.player);remote.keys=new Set(['KeyW']);remote.synced=true;
  const host=[];for(let i=0;i<240;i++){n.time=(i+1)*dt;remote.input.received=n.time;n.stepRemotes(dt);host.push(body(remote.player));}assert.deepEqual(host,expected,name+' host remote');
  n.role='guest';n.peers.clear();n.ready=true;n.serverPose=null;n.clearPrediction();g.running=true;g.accumulator=0;g.input.keys=new Set(['KeyW']);setup(g.player);const guest=[];
  for(let i=0;i<240;i++){n.time=(i+1)*dt;n.updateGuest(dt);guest.push(body(g.player));}assert.deepEqual(guest,expected,name+' guest prediction');
  report.routes.push({name,at,ticks:240,hostRemoteExact:true,guestPredictionExact:true,final:expected.at(-1),blocked:g.player.blocked(g.player.x,g.player.y,g.player.z)});
 }
 console.log(JSON.stringify(report));console.log('COMPLETE both native corners match local, host remote and guest prediction traces');
}finally{n.role='offline';n.room=null;clearInterval(n.timer);h.close();fs.writeFileSync(new URL('out/corner-slide-coop.json',import.meta.url),JSON.stringify(report,null,2));}
