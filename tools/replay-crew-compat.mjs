// Production contact and handshake replay against the preserved portable release.
// No browser, sockets or input acquisition. Historical artifact is explicit.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const legacyPath=path.join(root,'tools/out/grounds-before/build.html');
const portable=fs.readFileSync(legacyPath,'utf8');
const scripts=[...portable.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const town=scripts.find(s=>s.includes('/* Surface community,'));
const crew=scripts.find(s=>s.includes('/* Instant public co-op.'));
assert.ok(town&&crew,'Preserved 2.28.0 production modules missing');
const B={};
const context=vm.createContext({B2:B,structuredClone,console});
for(const file of ['core','town','player','multiplayer'])vm.runInContext(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'),context);
const old={clamp:B.clamp};
vm.runInNewContext(town,{B2:old});
vm.runInNewContext(crew,{B2:old,structuredClone});
function walk(Town){
 const world={floor:-297,density:(x,y,z)=>y-B.COMMON.height(x,z)},p=new B.Player(world);
 p.obstacles=Town.obstacles(B.freshState());p.teleport(5,.06,40.8);p.yaw=Math.PI;
 const trace=[];
 for(let i=0;i<180;i++){p.step(1/120,new Set(['KeyW']),6);if(i%6===0)trace.push({...p.position,time:(i+1)/120});}
 return {end:p.position,trace};
}
function handshake(Crew,hello){
 const messages=[],game={store:{key:'current'},toast(){}};
 const n=new Crew(game);n.id='current';n.hostId=n.id;n.born=2;n.role='host';n.room={};n.send=(m,id)=>{messages.push({m,id});return Promise.resolve(true);};n.snapshot=async()=>{};
 n.peers.set('legacy',{id:'legacy',hello:false,synced:false});n.receive(hello,'legacy');
 return {role:n.role,hostId:n.hostId,accepted:n.peers.get('legacy').hello,messages};
}
const oldHello={v:1,type:'hello',born:1,profile:{name:'Legacy miner',color:1},ready:true};
const host=walk(old.Town),guest=walk(B.Town);
const gap=Math.hypot(host.end.x-guest.end.x,host.end.y-guest.end.y,host.end.z-guest.end.z);
assert.ok(gap>1,'Historical collision divergence did not reproduce');
const sameBuild=walk(B.Town),matchedGap=Math.hypot(sameBuild.end.x-guest.end.x,sameBuild.end.y-guest.end.y,sameBuild.end.z-guest.end.z);
const world={floor:-297,density:(x,y,z)=>y-B.COMMON.height(x,z)},player=new B.Player(world);player.obstacles=B.Town.obstacles();player.teleport(guest.end.x,guest.end.y,guest.end.z);
const inert={player,store:{key:'current'},running:true,clock:0,accumulator:0,combat:{hurtFlash:0},refreshPlayerObstacles(){},playerLiftSpeed:()=>6,input:{keys:new Set(),fire:false},expedition:{state:{tool:'axe'}},actions:{swingAge:0},cutter:{},mining:{update(){}},feedback:{update(){}},audio:{drill(){},update(){}},updateHUD(){}};
const correction=new B.Crew(inert);correction.serverPose={...host.end,received:0};correction.updateGuest(0);
const forcedCorrection={before:guest.end,after:player.position,distance:Math.hypot(player.x-guest.end.x,player.y-guest.end.y,player.z-guest.end.z),targetCleared:correction.serverPose===null};
assert.ok(forcedCorrection.distance>2.5&&forcedCorrection.targetCleared,'Production teleport correction did not reproduce');
assert.equal(matchedGap,0);
const source=fs.readFileSync(path.join(root,'src/multiplayer.js'));
const report={date:new Date().toISOString(),legacyVersion:'2.28.0',legacySha256:crypto.createHash('sha256').update(portable).digest('hex'),currentVersion:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,currentSourceSha256:crypto.createHash('sha256').update(source).digest('hex'),contact:{host,guest,gap,matchedHost:sameBuild,matchedGap,forcedCorrection},legacyHello:handshake(old.Crew,oldHello),currentHello:handshake(B.Crew,oldHello),protocol:B.CREW_PROTOCOL||1,room:B.CREW_ROOM||'ridge-common-v1',saveKey:B.CREW_SAVE_KEY||'crew-global-v1',scope:'Production capsule and actual preserved town/contact modules. Production receive/elect and guest teleport correction use inert transport and presentation systems; no claim about physical Firefox delivery. The forced correction bypasses version admission to demonstrate the underlying failure.'};
const out=path.join(root,'tools/out/crew-compat');fs.mkdirSync(out,{recursive:true});
const label=process.argv[2]||'after';assert.match(label,/^[a-z0-9-]+$/);
fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({label,gapMeters:gap,legacyAccepted:report.legacyHello.accepted,currentAccepted:report.currentHello.accepted,currentHost:report.currentHello.hostId},null,2));
