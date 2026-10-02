// Actual Trystero signaling and WebRTC data channels in isolated headless browsers.
// --public uses public trackers; default uses a local WebTorrent-compatible tracker.
import {launch,until,sleep} from './cdp.mjs';
import {WebSocketServer} from 'ws';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'tools/out/network');fs.mkdirSync(out,{recursive:true});
const publicTrackers=process.argv.includes('--public'),standalone=process.argv.includes('--standalone');
for(const flag of process.argv.slice(2))if(!['--public','--standalone','--capture'].includes(flag))throw Error('Unknown gauntlet option: '+flag);
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+(pathname==='/'?(standalone?'/dist/index.html':'/index.html'):pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const tracker=new WebSocketServer({port:0,host:'127.0.0.1'});await new Promise(r=>tracker.once('listening',r));
const groups=new Map();let signals=0;
tracker.on('connection',socket=>{socket.on('message',raw=>{
 const m=JSON.parse(String(raw));if(m.action!=='announce')return;let group=groups.get(m.info_hash);if(!group)groups.set(m.info_hash,group=new Map());group.set(m.peer_id,socket);
 if(m.answer){group.get(m.to_peer_id)?.send(JSON.stringify({action:'announce',info_hash:m.info_hash,peer_id:m.peer_id,offer_id:m.offer_id,answer:m.answer}));signals++;}
 else if(m.offers){const others=[...group].filter(([id,s])=>id!==m.peer_id&&s.readyState===1);for(const [i,offer]of m.offers.entries()){const other=others[i];if(other){other[1].send(JSON.stringify({action:'announce',info_hash:m.info_hash,peer_id:m.peer_id,offer_id:offer.offer_id,offer:offer.offer}));signals++;}}}
 socket.send(JSON.stringify({action:'announce',info_hash:m.info_hash,interval:1,complete:0,incomplete:group.size}));
 });socket.on('close',()=>{for(const group of groups.values())for(const [id,s]of group)if(s===socket)group.delete(id);});});
const pages=[],report={publicTrackers,standalone,checks:[],states:[]};
const check=(label)=>{report.checks.push(label);console.log('PASS network: '+label);};
const room='gauntlet-'+Date.now();
async function open(port){const page=await launch({port,width:1280,height:800});pages.push(page);const options={room,...(publicTrackers?{}:{relays:[`ws://127.0.0.1:${tracker.address().port}`],iceServers:[]})};await page.call('Network.enable');await page.call('Page.addScriptToEvaluateOnNewDocument',{source:'window.BUTTLOADS_NET_OPTIONS='+JSON.stringify(options)+';window.__iceProbe={candidates:[],errors:[],sockets:[]};const RTC=window.RTCPeerConnection;window.RTCPeerConnection=class extends RTC{constructor(...args){super(...args);this.addEventListener("icecandidate",e=>{if(e.candidate)__iceProbe.candidates.push(e.candidate.type);});this.addEventListener("icecandidateerror",e=>__iceProbe.errors.push({url:e.url,code:e.errorCode,text:e.errorText}));}};const WS=window.WebSocket;window.WebSocket=class extends WS{constructor(...args){super(...args);this.addEventListener("open",()=>__iceProbe.sockets.push({url:args[0],open:true}));this.addEventListener("error",()=>__iceProbe.sockets.push({url:args[0],open:false}));}};'});await page.goto(`http://127.0.0.1:${server.address().port}/`);await until(()=>page.eval('!!window.__buttloads?.ready&&!!__buttloads.net.room'),{timeout:90000,label:'boot'});await page.eval('window.__crewRender=__buttloads.view.render;__buttloads.view.render=()=>{};true');return page;}
const state=p=>p.eval('({role:__buttloads.net.role,ready:__buttloads.net.ready,hostId:__buttloads.net.hostId,epoch:__buttloads.net.epoch,count:__buttloads.net.count,seed:__buttloads.world.seed,patchSeq:__buttloads.net.patchSeq,stats:__buttloads.net.stats,errors:__buttloads.net.errors,peers:[...__buttloads.net.peers.values()].map(p=>({id:p.id,hello:p.hello,synced:p.synced,born:p.born})),exceptions:[],pointerLock:!!document.pointerLockElement})');
const routes=page=>page.eval(`(async()=>{const routes=[];for(const pc of Object.values(__buttloads.net.room.getPeers())){const stats=await pc.getStats();for(const s of stats.values())if(s.type==='candidate-pair'&&s.state==='succeeded'&&s.nominated){const a=stats.get(s.localCandidateId),b=stats.get(s.remoteCandidateId);routes.push({local:a?.candidateType,remote:b?.candidateType,protocol:a?.protocol,bytesSent:s.bytesSent,bytesReceived:s.bytesReceived});}}return routes;})()`);
async function captureCrew(viewer,miner){
 const shots=path.join(out,'crew');fs.mkdirSync(shots,{recursive:true});
 const id=await miner.eval('__buttloads.net.id'),peer='__buttloads.net.peers.get('+JSON.stringify(id)+')';
 await viewer.eval('__buttloads.view.render=window.__crewRender;__buttloads.setScreen(null);__buttloads.player.teleport(0,.1,9);__buttloads.player.yaw=0;__buttloads.player.pitch=-.04;const p='+peer+';p.player.teleport(0,.1,5.8);__buttloads.settings.tips=false;__buttloads.syncSettings();__buttloads.fieldKit.dismiss();__buttloads.chapterUntil=0;document.getElementById("toast").classList.remove("visible");true');
 await miner.eval('__buttloads.setScreen(null);__buttloads.player.teleport(0,.1,5.8);__buttloads.player.yaw=Math.PI;__buttloads.player.pitch=0;__buttloads.net.rename("Copperhead");__buttloads.net.recolor(1);true');
 await sleep(400);await viewer.shot(path.join(shots,'connected-miner.png'));
 // Art inspection fixture: unlock all tools only after the gameplay assertions finish.
 await viewer.eval('const g=__buttloads;g.economy.state.deepest=297;g.expedition.state.recovered=[0,1];g.expedition.state.awakened=true;g.kinetics.state.unlocked=g.kinetics.state.known=true;g.kinetics.state.coils=[0,1];g.deep.state.open=g.world.deepOpen=true;true');await sleep(400);
 for(const tool of ['cutter','scoop','lance','resonance','gravity','axe','sling']){
  await miner.eval('__buttloads.expedition.state.tool='+JSON.stringify(tool)+';__buttloads.input.fire=false;true');
  await until(()=>viewer.eval(peer+'.tool==='+JSON.stringify(tool)),{timeout:10000,label:'remote '+tool+' selection'});await sleep(200);await viewer.eval('__buttloads.chapterUntil=0;document.getElementById("toast").classList.remove("visible");true');
  const receipt=await viewer.eval('(()=>{const p='+peer+',m=__buttloads.view.miners.get(p.id);return {received:p.tool,rendered:m.tool,models:m.weapon.children.length,visible:m.weapon.visible,geometry:m.weapon.children[0].children.length,crewCount:__buttloads.net.count,transportPeers:Object.keys(__buttloads.net.room.getPeers()).length};})()');assert.equal(receipt.rendered,tool);assert.equal(receipt.models,1);assert.equal(receipt.crewCount,3,'crew persists during '+tool+' capture');report.checks.push('remote '+tool+' equipped and rendered');
  await viewer.shot(path.join(shots,tool+'.png'));
  if(['resonance','axe','sling','gravity'].includes(tool)){await miner.eval('__buttloads.input.fire=true;true');await sleep(400);await viewer.shot(path.join(shots,tool+'-active.png'));await miner.eval('__buttloads.input.fire=false;true');}
 }
 await viewer.eval('__buttloads.setScreen("crew");true');await sleep(200);await viewer.shot(path.join(shots,'crew-menu.png'));
 await viewer.eval('for(let y=0;y>-12;y-=.8)__buttloads.world.carve({x:0,y,z:6},3.2);__buttloads.net.flushTerrain();true');await sleep(500);
 await viewer.eval('__buttloads.setScreen(null);__buttloads.player.teleport(0,-10,8);__buttloads.player.yaw=0;__buttloads.player.pitch=0;'+peer+'.player.teleport(0,-10,4.8);__buttloads.chapterUntil=0;document.getElementById("toast").classList.remove("visible");true');
 await miner.eval('__buttloads.player.teleport(0,-10,4.8);__buttloads.player.yaw=Math.PI;__buttloads.player.pitch=0;__buttloads.expedition.state.tool="cutter";true');await sleep(500);
 await until(()=>viewer.eval('__buttloads.view.crewLamps?.some(l=>l.intensity>0)'),{timeout:5000,label:'remote headlamp lighting'});
 report.undergroundCrew=await viewer.eval('({count:__buttloads.net.count,transportPeers:Object.keys(__buttloads.net.room.getPeers()).length})');assert.equal(report.undergroundCrew.count,3,'crew persists during underground inspection');
 await viewer.shot(path.join(shots,'underground-crew.png'));check('nearby underground miner casts a directional headlamp');
 report.artFixture='Weapons unlocked for visual review after all gameplay checks; connected-miner.png uses the fresh-game cutter.';
}
try{
 const base=publicTrackers?9511:9491;const first=await open(base);await sleep(400);const second=await open(base+1);
 await until(async()=>{const a=await state(first),b=await state(second);return a.count===2&&b.count===2&&b.role==='guest'&&b.ready&&a.peers.every(p=>p.synced);},{timeout:100000,every:500,label:'automatic join and initial mine transfer'});
 check('two isolated browsers auto-join the same mine through Trystero and WebRTC');
 report.routes=await routes(second);
 assert.equal((await state(first)).seed,(await state(second)).seed);
 await first.eval('__buttloads.setScreen(null);__buttloads.player.teleport(0,.1,11.5);true');await second.eval('__buttloads.setScreen(null);__buttloads.player.pitch=-1.05;__buttloads.input.fire=true;true');
 const start=await first.eval('__buttloads.world.revision');
 await until(()=>first.eval('__buttloads.world.revision>'+start),{timeout:15000,label:'guest excavation'});await sleep(1600);await second.eval('__buttloads.input.fire=false;true');
 await until(()=>second.eval('__buttloads.net.patchSeq>0'),{timeout:10000,label:'terrain deltas'});
 check('guest trigger excavates authoritative terrain and replicates binary edits');
 const digest=()=>`(()=>{let h=2166136261;const a=new Uint32Array(__buttloads.world.field.buffer);for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619);return h>>>0;})()`;
 await first.eval('__buttloads.input.fire=false;true');await sleep(700);assert.equal(await first.eval(digest()),await second.eval(digest()));check('terrain fields match bit for bit after excavation');
 const old=await first.eval('__buttloads.expedition.state.supplies.lights');await second.eval('__buttloads.deploy("lamp");true');
 await until(()=>first.eval('__buttloads.expedition.state.supplies.lights==='+String(old-1)),{timeout:10000,label:'remote work light'});await until(()=>second.eval('__buttloads.gadgets.nodes.some(n=>n.type==="lamp")'),{timeout:10000,label:'light replica'});check('remote work light spends once and appears in both mines');
 const companion=await open(base+3);await until(()=>companion.eval('__buttloads.net.guest&&__buttloads.net.ready&&__buttloads.net.count===3'),{timeout:100000,label:'three-player crew'});assert.equal(await companion.eval(digest()),await second.eval(digest()));await until(()=>first.eval('[...__buttloads.net.peers.values()].every(p=>p.synced)'),{timeout:15000,label:'three acknowledgements'});check('three simultaneous browsers share the same excavated mine');
 await first.eval('__buttloads.setScreen("pause");true');const clock=await first.eval('__buttloads.clock');await second.eval('__buttloads.input.keys.add("KeyW");true');await sleep(700);assert.ok(await first.eval('__buttloads.clock')>clock);await second.eval('__buttloads.input.keys.clear();true');check('the crew keeps playing while the lead opens a menu');
 report.states.push(await state(first),await state(second));const savedDigest=await second.eval(digest());await first.eval('__buttloads.net.room.leave();true');
 await until(()=>second.eval('__buttloads.net.host'),{timeout:15000,label:'authority migration'});assert.equal(await second.eval(digest()),savedDigest);check('authority transfers to the survivor without resetting the mine');
 const third=await open(base+2);await until(()=>third.eval('__buttloads.net.guest&&__buttloads.net.ready&&__buttloads.net.count===3'),{timeout:100000,label:'late join after migration'});assert.equal(await third.eval(digest()),await second.eval(digest()));check('late join downloads the excavated mine after authority migration');
 for(const page of pages){const s=await state(page);assert.equal(s.pointerLock,false);const exceptions=page.logs.filter(x=>x.startsWith('EXCEPTION'));assert.deepEqual(exceptions,[]);report.states.push(s);}
 check('zero runtime exceptions and no pointer lock in any test browser');
 if(process.argv.includes('--capture'))await captureCrew(second,third);
 console.log(`COMPLETE ${report.checks.length} real WebRTC checks passed; ${signals} local signaling messages`);
}catch(error){report.error=error.stack;for(const page of pages)try{report.states.push({...await state(page),probe:await page.eval('__iceProbe'),logs:page.logs.slice(-12)});}catch{}throw error;}
finally{fs.writeFileSync(path.join(out,(publicTrackers?'public':'local')+(standalone?'-standalone':'')+'-report.json'),JSON.stringify(report,null,2));for(const page of pages)page.kill();for(const socket of tracker.clients)socket.terminate();tracker.close();server.close();}
