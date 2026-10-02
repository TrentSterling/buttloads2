import fs from 'node:fs';
import crypto from 'node:crypto';
import {loadCrew,runGuestMotion,poseOrder} from './guest-motion-fixture.mjs';
const label=process.argv[2]||'after';if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid run label');
const before=label==='before',source=fs.readFileSync(new URL(before?'out/guest-motion-before/multiplayer.js':'../src/multiplayer.js',import.meta.url),'utf8'),B=loadCrew(source);
const cases=[['walk-0',{rtt:0}],['walk-100',{rtt:100}],['walk-250',{rtt:250}],['turn-100',{rtt:100,turn:true}],['turn-250',{rtt:250,turn:true}],['wall-100',{rtt:100,wall:true}],['pose-gap',{rtt:100,gap:[.5,3],duration:4}]];
const report={label,date:new Date().toISOString(),version:before?'2.28.2':JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8')).version,protocol:B.CREW_PROTOCOL,room:B.CREW_ROOM,saveKey:B.CREW_SAVE_KEY,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),method:'Production Crew input/pose admission and updateGuest, production capsule contact. Simulated symmetric latency, 20 Hz messages, 120 Hz movement, 144 Hz camera. The gap suppresses authority pose messages for 2.5 seconds. No browser or physical input.',ordering:poseOrder(B),cases:Object.fromEntries(cases.map(([name,options])=>[name,runGuestMotion(B,options)]))};
fs.writeFileSync(new URL('out/guest-motion-'+label+'.json',import.meta.url),JSON.stringify(report,null,2));
for(const [name,c]of Object.entries(report.cases))console.log(JSON.stringify({name,rtt:c.rtt,corrections:c.corrections,correctionDistance:c.correctionDistance,maxTeleport:c.maxTeleport,endX:c.end.x,hostX:c.host.x,blockedFrames:c.blockedFrames}));
