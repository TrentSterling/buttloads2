// Matched production-code traces, with an inert renderer and no network or input automation.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,current=B.Crew;
vm.runInThisContext(fs.readFileSync(new URL('out/coop-controller-before/multiplayer.js',import.meta.url),'utf8'));
const previous=B.Crew;B.Crew=current;
const report={version:JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url))).version,date:new Date().toISOString(),method:'Matched production Crew/Player simulation at 120 Hz. Preserved 2.27.2 versus current source. A command reply is delivered 100 ms after host execution. No browser, internet latency measurement or physical input.',command:{},machinery:{}};
report.sources=Object.fromEntries(['out/coop-controller-before/multiplayer.js','../src/multiplayer.js','../src/game.js','../src/player.js'].map(file=>[file,createHash('sha256').update(fs.readFileSync(new URL(file,import.meta.url))).digest('hex')]));
function crew(Crew){const n=g.net=new Crew(g);n.role='guest';n.ready=true;n.hostId='fixture-lead';n.peers.set(n.hostId,{id:n.hostId,hello:true});g.setScreen(null);g.clearInput();g.accumulator=0;g.expedition.tether=null;g.economy.state.gear.lift=0;g.refreshPlayerObstacles();return n;}
function commands(Crew){
 const n=crew(Crew),trace=[];g.player.teleport(0,.06,10);g.player.yaw=0;g.input.keys.add('KeyD');let reply,velocity;
 for(let i=0;i<120;i++){
  if(i===36){n.role='host';const peer={id:'fixture-guest',profile:{name:'Test',color:1}};n.makeRemote(peer);peer.player.teleport(g.player.x,g.player.y,g.player.z);n.send=m=>{if(m.type==='result')reply={v:Crew===current?B.CREW_PROTOCOL:1,...m};return Promise.resolve(true);};n.execute(peer,'scan',[]);n.role='guest';}
  if(i===48){velocity={before:g.player.vx};n.receive(reply,n.hostId);velocity.after=g.player.vx;}
  n.time+=1/120;n.updateGuest(1/120);trace.push({t:(i+1)/120,x:g.player.cameraPose(.5,1/120).x});
 }
 return {trace,velocity,positionReply:!!reply.position,maxBackwardStep:Math.max(0,...trace.slice(1).map((p,i)=>trace[i].x-p.x))};
}
function machinery(Crew){
 const body=g.expedition.bodies[1];Object.assign(body,{x:6,y:.9,z:6,collected:false});const n=crew(Crew),trace=[];g.player.teleport(6,.06,9.5);g.player.yaw=0;g.input.keys.add('KeyW');
 for(let i=0;i<180;i++){if(i===60)body.x=10;n.time+=1/120;n.updateGuest(1/120);trace.push({t:(i+1)/120,z:g.player.z});}
 body.collected=true;return {trace,finalZ:g.player.z};
}
try{
 for(const [key,Crew]of [['before',previous],['after',current]])report.machinery[key]=machinery(Crew);
 for(const [key,Crew]of [['before',previous],['after',current]])report.command[key]=commands(Crew);
 assert.ok(report.command.before.maxBackwardStep>.3);assert.equal(report.command.after.maxBackwardStep,0);assert.equal(report.command.before.velocity.after,0);assert.ok(report.command.after.velocity.after>3.7);
 assert.ok(report.machinery.before.finalZ>7);assert.ok(report.machinery.after.finalZ<5);
}finally{g.net.role='offline';g.net.room=null;h.close();}
const out=new URL('out/',import.meta.url);fs.writeFileSync(new URL('coop-controller-report.json',out),JSON.stringify(report,null,2));
const data=JSON.stringify(report).replace(/</g,'\\u003c');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Buttloads 2 / Co-op movement ${report.version}</title>
<style>*{box-sizing:border-box}body{margin:0;background:#111d22;color:#f8e8c6;font:17px system-ui;padding:38px;max-width:1500px;margin:auto}h1{font-size:44px;line-height:1.1}p{line-height:1.6;max-width:1100px;color:#b6c9c7}a{color:#f0b94e}canvas{width:100%;height:310px;background:#16282e;display:block;border:1px solid #445b59;margin:24px 0}.before{color:#e5826a}.after{color:#f0b94e}strong{color:#f8e8c6}code{font-size:14px}li{margin:12px 0;line-height:1.5}</style>
<small>BUTTLOADS 2 / CO-OP CONTROLLER / ${report.version}</small><h1>Scanning should not interrupt your stride.</h1>
<p>The previous host attached a teleport to every command reply. In this matched replay, a scan reply delivered 100 ms later moved the camera backward <strong>${(report.command.before.maxBackwardStep*100).toFixed(1)} cm</strong> and reset walking velocity to zero. The revised reply preserves position, velocity and interpolation history. Recall and return travel still deliver their actual new positions.</p>
<p><span class="before">Before</span> / <span class="after">After</span> / Camera position in metres; scan reply at 0.4 seconds.</p><canvas id="command"></canvas>
<h2>Moved machinery must clear its old space.</h2><p>Both guests start with the same collision box. The machinery moves aside at 0.5 seconds. Previously the guest stopped at its old position; the revised guest refreshes collision from replicated body positions and continues along the cleared route.</p><canvas id="machinery"></canvas>
<ul><li>Host, guest prediction and remote simulation share the hauling cap and restored deep-lift speed.</li><li>Snapshot installation recovers shallow machinery overlap while preserving the saved location.</li><li>Recalls and new snapshot epochs discard stale reconciliation targets.</li></ul>
<p><strong>Measurement limits:</strong> this is a deterministic replay of game code with simulated reply delay. It measures these defects, not actual internet latency or physical Firefox mouse delivery.</p>
<p><a href="coop-controller-report.json">Raw matched traces</a> · <a href="coop-controller-command-before.log">Failing command regression before the fix</a> · <a href="coop-controller-before/test.log">Failing collision regression before the fix</a> · <a href="coop-controller-after.log">Eight current integration checks</a> · <a href="system-coop-controller.log">Full system suite</a></p>
<script>const report=${data};function graph(id,caseName,key){const canvas=document.getElementById(id),c=canvas.getContext('2d'),ratio=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight,p=45;canvas.width=w*ratio;canvas.height=h*ratio;c.scale(ratio,ratio);const series=report[caseName],all=[...series.before.trace,...series.after.trace].map(v=>v[key]),lo=Math.min(...all)-.1,hi=Math.max(...all)+.1;c.font='13px monospace';for(let j=0;j<5;j++){const y=h-p-j*(h-p*2)/4;c.strokeStyle='#354d53';c.beginPath();c.moveTo(p,y);c.lineTo(w-p,y);c.stroke();c.fillStyle='#a7bfbe';c.fillText((lo+j*(hi-lo)/4).toFixed(1),4,y+4);}for(const [name,color]of [['before','#e5826a'],['after','#f0b94e']]){const t=series[name].trace;c.strokeStyle=color;c.lineWidth=2;c.beginPath();t.forEach((v,i)=>{const x=p+v.t/t.at(-1).t*(w-p*2),y=h-p-(v[key]-lo)/(hi-lo)*(h-p*2);i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();}}function draw(){graph('command','command','x');graph('machinery','machinery','z');}addEventListener('resize',draw);draw();</script></html>`;
fs.writeFileSync(new URL('coop-controller-review.html',out),html);
console.log(JSON.stringify({version:report.version,commandBeforeBackwardCm:report.command.before.maxBackwardStep*100,commandAfterBackwardCm:report.command.after.maxBackwardStep*100,velocityBefore:report.command.before.velocity,velocityAfter:report.command.after.velocity,machineryBeforeZ:report.machinery.before.finalZ,machineryAfterZ:report.machinery.after.finalZ},null,2));
