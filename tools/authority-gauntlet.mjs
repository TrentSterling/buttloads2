import fs from 'node:fs';
import crypto from 'node:crypto';
import {authorityReplay} from './authority-fixture.mjs';
const label=process.argv[2]||'after';if(!['before','after'].includes(label))throw Error('Unknown replay label');
const base=label==='before'?'out/authority-before/':'../src/',gameSource=fs.readFileSync(new URL(base+'game.js',import.meta.url),'utf8'),multiplayerSource=fs.readFileSync(new URL(base+'multiplayer.js',import.meta.url),'utf8');
const cases={};for(const hz of [144,60,10,1,0]){cases['render-'+hz]=await authorityReplay({hz,gameSource,multiplayerSource});console.log(JSON.stringify({name:'render-'+hz,...Object.fromEntries(Object.entries(cases['render-'+hz]).filter(([k])=>k!=='trace'))}));}
cases['silence-heartbeat']=await authorityReplay({hz:0,duration:4,stopAt:0,heartbeat:true,controlTraffic:true,gameSource,multiplayerSource});
cases['silence-foreground']=await authorityReplay({hz:60,duration:4,stopAt:0,heartbeat:true,controlTraffic:true,gameSource,multiplayerSource});
cases['invalid-input']=await authorityReplay({hz:0,invalid:true,gameSource,multiplayerSource});
const report={label,date:new Date().toISOString(),version:label==='before'?'2.28.3':JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url))).version,sourceSha256:crypto.createHash('sha256').update(gameSource).update(multiplayerSource).digest('hex'),method:'Production Game.boot callback, Crew.receive and full Game.update at controlled render cadences, with 20Hz admitted inputs. Inert renderer/transport/storage; simulated monotonic time. No browser visibility, internet or physical mouse measurement.',cases};
fs.writeFileSync(new URL('out/authority-'+label+'.json',import.meta.url),JSON.stringify(report,null,2));
console.log('COMPLETE authority '+label+' replay: '+Object.keys(cases).length+' cases.');
