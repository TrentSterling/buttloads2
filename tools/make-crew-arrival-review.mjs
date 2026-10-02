import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'tools/out');
const read=file=>JSON.parse(fs.readFileSync(path.join(out,file),'utf8'));
const before=read('network-idle-2.29.1/report.json'),after=read('network-idle-2.29.2/report.json'),perf=read('perf-crew-spawn-current/report.json');
const raw=fs.readFileSync(path.join(out,'system-crew-spawn.log')),log=raw.toString(raw[0]===255&&raw[1]===254?'utf16le':'utf8'),checks=Number(log.match(/COMPLETE (\d+) system checks passed/)?.[1]);
const hash=createHash('sha256').update(fs.readFileSync(path.join(root,'dist/index.html'))).digest('hex');
if(checks!==416||after.version!=='2.29.2'||after.error||after.checks.length!==7||hash!==after.buildSha256||hash!==perf.buildSha256||perf.errors.length)throw Error('Incomplete current arrival evidence');
if(before.error||before.checks.length!==6||before.version!=='2.29.1')throw Error('Missing original public evidence');
const links=[['Public lobby report','network-idle-2.29.2/report.json'],['Before lobby report','network-idle-2.29.1/report.json'],['Full system log','system-crew-spawn.log'],['Failed spawn regression','crew-spawn-before-failure.log'],['Final 30-second profile','perf-crew-spawn-current/report.json'],['Critic record','../../docs/CREW-ARRIVALS.md']];
const slides=[],pair=(title,shot,caption)=>{
 const beforeImage='network-idle-2.29.1/'+shot+'.png',afterImage='network-idle-2.29.2/'+shot+'.png';
 for(const f of [beforeImage,afterImage])if(!fs.existsSync(path.join(out,f)))throw Error('Missing '+f);
 slides.push({kind:'pair',title,caption,before:beforeImage,after:afterImage,beforeLabel:'BEFORE / 2.29.1',afterLabel:'AFTER / 2.29.2',receipt:'Actual default global-room browsers: join, close the owned lead, then late join. No room override, gameplay calls or input events. Cameras follow their allocated spawn; these are behavior comparisons rather than identical camera art studies.'});
};
pair('Late arrivals: keep the camera out of another miner','late-join-2','The previous peer-count rule reused a survivor’s spawn after a departure. The real late-join frame put the camera inside their head. New arrivals use clear supported positions separated from existing miners, including those in menus. The rebuilt models and weapons stay visible.');
pair('Automatic joining: retain the production global crew','joined-1','Three unconfigured standalone browsers discover the public Ridge Common room. The same seed, terrain bits and epoch arrive automatically. Current arrival positions are distinct; the seven-observation report also records actual open data-channel traffic.');
pair('Closing the lead: preserve the mine and survivors','migrated-0','The owned lead browser closes. A survivor inherits authority while both remaining miners retain the shared terrain. A fourth fresh browser then joins that surviving crew. Only owned audit browsers are closed.');
const scene=perf.scenes[0];
slides.push({kind:'receipts',title:'Longer frame samples retain the hitch evidence',caption:'The 49.9 ms frame from the preceding art profile was investigated with repeat samples. This spawn fix does not claim a rendering speedup.',checks,inventory:[],links,items:[
 'Final 2.29.2: '+scene.frame.count+' frames over 30 seconds, frame p95 '+scene.frame.p95.toFixed(1)+' ms, maximum '+scene.frame.max.toFixed(1)+' ms, '+scene.framesOver25+' frames above 25 ms.',
 '2.29.1 repeat: six seconds, 17.0 ms maximum. Its longer 30-second sample had one 33.9 ms frame across 1,801 frames.',
 'Around that 33.9 ms frame, previous/current render CPU was 2.8 / 3.5 ms and simulation was 0.6 / 0.9 ms. GPU or browser scheduling remains uncertain.',
 'The preserved 2.29.0 baseline sampled 1,802 frames over 30 seconds, with a 17.0 ms maximum.',
 'All samples use the animated four-miner rendering fixture, RTX 5070 Ti, 1920 × 1080, pixel ratio one and 100 warm frames.',
 'CPU and GPU values vary between samples. The system suite was running during the final profile; lower frame maxima are observations, without attribution to the spawn fix.'
],receipt:'Raw profiles retain GPU values, full-sample frame statistics and slow-frame work. The 600-frame in-game ring buffer no longer truncates longer profiling samples.'});
slides.push({kind:'receipts',title:'Current proof and remaining work',caption:'All eight current connected-browser frames were visually inspected. The wider improvement goal remains active.',checks,inventory:[],links,items:[
 'Six new spawn checks cover departure and rejoining, 64 distinct arrivals, machinery clearance, preserved poses and aim, rejected overlapping poses and an excavated entrance.',
 'Seven public observations cover default-room membership, bidirectional SCTP messages/bytes, bit-identical transfer, migration, late joining, separate positions and input safety.',
 'The real connected frames use the fresh-game cutter. Earlier seven-weapon captures retain their dates; current weapon and grip regression coverage remains.',
 'The rejected audit reports remain: inactive aim is null, and a selected ICE pair can show one-way counters after traffic moves to another pair. Open data-channel counters prove both directions.',
 'Public trackers were used, but all browsers ran on this computer. This does not certify separate-network NAT traversal or physical Firefox mouse feel.',
 'Remaining: physical movement review, unexplained intermittent scheduling spikes, close-up foliage and rocks, garden borders, shop interiors and distant-cliff composition.'
],receipt:'Crew leads need 2.29.2 for safe arrival allocation. Protocol, room and save generation remain v3; existing crew saves and contact rules remain. No push or deployment.'});
let html=fs.readFileSync(path.join(out,'world-art-review.html'),'utf8');
const start=html.indexOf('const slides='),end=html.indexOf(';let index=0',start);if(start<0||end<0)throw Error('Review template changed');
html=html.slice(0,start)+'const slides='+JSON.stringify(slides).replace(/</g,'\\u003c')+html.slice(end);
html=html.replace('world art receipts / 2.29.1','crew arrivals / 2.29.2').replace('GROUND AND COVER / 2.29.1','CREW ARRIVALS / 2.29.2').replace('window.__worldArtReview=','window.__crewArrivalReview=');
fs.writeFileSync(path.join(out,'crew-arrival-review.html'),html);
fs.writeFileSync(path.join(out,'crew-arrival-release.json'),JSON.stringify({version:after.version,date:new Date().toISOString(),buildSha256:hash,beforeBuildSha256:before.buildSha256,checks,publicObservations:after.checks.length,inspectedNetworkFrames:8,slides:slides.length,frame:scene.frame},null,2));
console.log('Crew arrivals: five slides, seven actual global observations and '+checks+' system checks.');
