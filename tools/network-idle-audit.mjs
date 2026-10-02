// Observe automatic production lobby behavior. No gameplay calls or input events.
import {launch,until,sleep} from './cdp.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..'),build=path.join(root,'dist/index.html');
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const out=path.join(root,'tools/out','network-idle-'+version);fs.mkdirSync(out,{recursive:true});
const pages=[],closed=new Set(),report={version,date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),method:'Actual default global Trystero app and room from the standalone file, with public trackers and STUN. Separate guarded headless Chrome profiles. Only state observation, RTC statistics, screenshots and closure of owned browser processes; no gameplay calls, input events or pointer lock.',checks:[],states:[]};
const check=label=>{report.checks.push(label);console.log('PASS idle network: '+label);};
const state=p=>p.eval(`(()=>{const g=__buttloads,n=g.net;let h=2166136261;for(const value of new Uint32Array(g.world.field.buffer))h=Math.imul(h^value,16777619);return{version:document.querySelector('meta[name=application-version]').content,room:B2.CREW_ROOM,protocol:B2.CREW_PROTOCOL,override:!!window.BUTTLOADS_NET_OPTIONS,id:n.id,role:n.role,ready:n.ready,hostId:n.hostId,epoch:n.epoch,count:n.count,seed:g.world.seed,fieldSeq:n.host?n.changes.seq:n.patchSeq,fieldDigest:h>>>0,player:{...g.player.position,yaw:g.player.yaw,pitch:g.player.pitch},models:[...(g.view.miners||[])].map(([id,m])=>({id,visible:m.root.visible,tool:m.tool,weaponVisible:m.weapon.visible,models:m.weapon.children.length})),stats:{...n.stats},errors:n.errors.slice(),peers:[...n.peers.values()].map(p=>({id:p.id,hello:p.hello,synced:p.synced})),input:{keys:[...g.input.keys],fire:g.input.fire,aim:g.input.aim},pointerLock:!!document.pointerLockElement,probe:window.__netProbe};})()`);
const routes=p=>p.eval(`(async()=>{const result=[];for(const [id,pc]of Object.entries(__buttloads.net.room.getPeers())){const stats=await pc.getStats(),all=[...stats.values()],transport=all.find(s=>s.type==='transport'&&s.selectedCandidatePairId),pairs=all.filter(s=>s.type==='candidate-pair'),s=stats.get(transport?.selectedCandidatePairId)||pairs.find(s=>s.state==='succeeded'&&s.nominated),a=stats.get(s?.localCandidateId),b=stats.get(s?.remoteCandidateId);result.push({peer:id,connection:pc.connectionState,ice:pc.iceConnectionState,local:a?.candidateType,remote:b?.candidateType,protocol:a?.protocol,bytesSent:s?.bytesSent,bytesReceived:s?.bytesReceived,pairs:pairs.map(s=>({id:s.id,state:s.state,nominated:s.nominated,bytesSent:s.bytesSent,bytesReceived:s.bytesReceived})),channels:all.filter(s=>s.type==='data-channel').map(s=>({state:s.state,messagesSent:s.messagesSent,messagesReceived:s.messagesReceived,bytesSent:s.bytesSent,bytesReceived:s.bytesReceived}))});}return result;})()`);
async function open(port){
 const p=await launch({port,width:1440,height:1000,gpu:true});pages.push(p);
 await p.call('Page.addScriptToEvaluateOnNewDocument',{source:`window.__netProbe={iceErrors:[],sockets:[]};const RTC=RTCPeerConnection;window.RTCPeerConnection=class extends RTC{constructor(...a){super(...a);this.addEventListener('icecandidateerror',e=>__netProbe.iceErrors.push({url:e.url,code:e.errorCode,text:e.errorText}));}};const WS=WebSocket;window.WebSocket=class extends WS{constructor(...a){super(...a);this.addEventListener('open',()=>__netProbe.sockets.push({url:a[0],open:true}));this.addEventListener('error',()=>__netProbe.sockets.push({url:a[0],open:false}));}};`});
 await p.goto(pathToFileURL(build).href+'?network-idle-audit');
 await until(()=>p.eval('!!window.__buttloads?.ready&&!!__buttloads.net.room'),{timeout:90000,label:'automatic production boot'});
 console.log('OPEN owned audit browser '+pages.length);
 return p;
}
async function settled(live){
 return until(async()=>{
  const all=await Promise.all(live.map(state)),ids=all.map(s=>s.id);
  return all.every(s=>s.ready&&ids.every(id=>id===s.id||s.peers.some(p=>p.id===id&&p.hello))&&s.hostId===all[0].hostId&&s.epoch===all[0].epoch)?all:false;
 },{timeout:120000,every:1000,label:'automatic global membership and mine transfer'});
}
function validate(all){
 for(const s of all){assert.equal(s.version,version);assert.equal(s.room,'ridge-common-v3');assert.equal(s.protocol,3);assert.equal(s.override,false);assert.equal(s.pointerLock,false);assert.deepEqual(s.input.keys,[]);assert.equal(s.input.fire,false);assert.equal(s.input.aim,null);}
}
async function observe(live,label){
 const all=await settled(live);validate(all);report.states.push({phase:label,states:all});
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)if(Math.abs(all[i].player.y-all[j].player.y)<1.75)assert.ok(Math.hypot(all[i].player.x-all[j].player.x,all[i].player.z-all[j].player.z)>=.68,'arrival overlaps an observed miner');
 const active=all.find(s=>s.role==='host');
 if(active){assert.ok(all.every(s=>s.seed===active.seed&&s.fieldSeq===active.fieldSeq&&s.fieldDigest===active.fieldDigest),'identical mine fields at a common sequence');}
 else report.externalAuthority=true;
 for(let i=0;i<live.length;i++){
  const contact=await live[i].eval(`(()=>{const g=__buttloads,c=g.cutter.contact;return{hit:!!c,protected:c?.protected,layer:c?.layer,expected:c?B2.geology(c.y).name:null,label:document.getElementById('contact').textContent,edited:g.cutter.edited};})()`);
  report.states.at(-1).states[i].contactFeedback=contact;assert.equal(contact.edited,false,'idle guest predicts cutting');
  if(contact.hit&&!contact.protected){assert.equal(contact.layer,contact.expected);assert.equal(contact.label,contact.expected);}
  const rtc=await until(async()=>{const found=await routes(live[i]);report.states.at(-1).states[i].routes=found;return found.length>=live.length-1&&found.every(r=>r.connection==='connected'&&r.channels.some(c=>c.state==='open'&&c.messagesSent>0&&c.messagesReceived>0&&c.bytesSent>0&&c.bytesReceived>0))?found:false;},{timeout:15000,every:500,label:'open RTC data channels and bidirectional traffic'});
  assert.ok(rtc.length>=live.length-1);await live[i].shot(path.join(out,label+'-'+i+'.png'));
 }
 return all;
}
try{
 const a=await open(9541);await sleep(500);const b=await open(9542);const c=await open(9543);
 const first=await observe([a,b,c],'joined');
 check('three standalone browsers automatically share the production global room without configuration overrides');
 check('open public-signaled WebRTC data channels carry bidirectional messages and bytes');
 if(!report.externalAuthority)check('automatic initial transfer preserves identical terrain bits, seed and epoch');
 const ownLead=first.findIndex(s=>s.role==='host');let live;
 if(ownLead>=0){
  const departing=[a,b,c][ownLead],previous=first[ownLead];departing.kill();closed.add(departing);live=[a,b,c].filter(p=>p!==departing);
  await until(async()=>{const all=await Promise.all(live.map(state));return all.some(s=>s.role==='host')&&all.every(s=>s.hostId!==previous.hostId);},{timeout:30000,every:500,label:'owned lead departure and authority election'});
  const migrated=await observe(live,'migrated');assert.ok(migrated.some(s=>s.role==='host'&&s.hostId!==previous.hostId));assert.ok(migrated.every(s=>s.fieldDigest===previous.fieldDigest&&s.seed===previous.seed));
  check('closing the owned lead transfers authority while preserving the observed mine');
 }else{
  a.kill();closed.add(a);live=[b,c];report.migration='External player owns authority; no external browser was closed.';
 }
 const late=await open(9544);live.push(late);await observe(live,'late-join');
 check('a fresh standalone browser automatically joins the surviving global crew');
 check('observed miners retain separate arrival positions after joining and migration');
 assert.ok(report.states.some(p=>p.states?.some(s=>s.role==='guest'&&s.contactFeedback?.hit&&!s.contactFeedback.protected)),'no real guest rock contact observed');
 check('actual guest rock contacts display their hit stratum with no idle cutting feedback');
 for(const p of pages){assert.deepEqual(p.logs.filter(x=>x.startsWith('EXCEPTION')),[]);if(!closed.has(p))validate([await state(p)]);}
 check('no runtime exceptions, held input, firing or test pointer lock');
 console.log('COMPLETE '+report.checks.length+' current production global WebRTC observations');
}catch(error){report.error=error.stack;for(const p of pages)if(!closed.has(p))try{report.states.push({phase:'failure',state:await state(p),logs:p.logs.slice(-12)});}catch{}throw error;}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));for(const p of pages)if(!closed.has(p))p.kill();}
