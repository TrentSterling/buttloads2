import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,out))),sha=b=>createHash('sha256').update(b).digest('hex');
const buildSha256=sha(fs.readFileSync(new URL('../dist/index.html',import.meta.url)));
const before=read('cliff-shape-before/report.json'),after=read('cliff-shape-after/report.json'),proof=read('cliff-shape-conservation.json');
const profiles=['before','after','before-repeat'].map(n=>read('perf-cliff-shape-'+n+'/report.json'));
for(const r of [after,proof,profiles[1]])assert.equal(r.buildSha256,buildSha256);
for(const r of [profiles[0],profiles[2]])assert.equal(r.buildSha256,before.buildSha256);
for(let i=1;i<=5;i++)assert.equal(read('cliff-shape-connected-round-'+i+'/report.json').buildSha256,sha(fs.readFileSync(new URL('cliff-connected-round-'+i+'-build.html',out))));
assert.equal(read('cliff-shape-round-3/report.json').buildSha256,sha(fs.readFileSync(new URL('cliff-shape-round-3-build.html',out))));
assert.ok(fs.readFileSync(new URL('cliff-shape-suite.log',out),'utf8').includes('COMPLETE 570 system checks passed'));
const frames=(names,b='cliff-shape-before')=>names.map(name=>({name,label:name,before:b+'/'+name+'.png',after:'cliff-shape-after/'+name+'.png'}));
const pair={beforeLabel:'BEFORE / 2.55.0',afterLabel:'AFTER / 2.56.0'};
const native='Native 1440 by 1000 cameras; capsule, terrain, placements, light, wind and time match. Refreshed-shadow draws match. No automated input, focus or pointer lock.';
const cpu=s=>s.cpu.mean+s.timings.simulation.mean;
const perfRows=profiles[1].scenes.map((s,i)=>{
 const b=profiles[0].scenes[i],r=profiles[2].scenes[i];assert.equal(b.name,s.name);assert.equal(r.name,s.name);
 return s.name+': CPU work '+[b,s,r].map(v=>cpu(v).toFixed(2)).join(' / ')+' ms; GPU mean '+[b,s,r].map(v=>v.gpu.mean.toFixed(2)).join(' / ')+' ms; frame p95 '+[b,s,r].map(v=>v.frame.p95.toFixed(1)).join(' / ')+' ms.';
});
const slides=[
 {title:'Connected cliffs replace stacked waves',caption:'Five distant rock groups now use closed connected surfaces with unequal crests and interrupted joints.',note:native+' The western and southwestern faces are clear; broad planar sectors and angular caps still look constructed.',...pair,frames:frames(['ridge-west','ridge-southwest','west-quarter'])},
 {title:'Inspect the eastern shoulder',caption:'Lower end shoulders remove the tall narrow fin exposed by the quarter camera.',note:native+' The east view shows the upper face above a hill. The quarter view includes a foreground wall; the cliff shoulder remains clear. Faceting and an angular central crest remain criticism.',...pair,frames:frames(['ridge-east','east-quarter'])},
 {title:'Skyline evidence has limits',caption:'The northern and southern hills obscure the lower cliff faces.',note:native+' These pairs support crest inspection only. They do not approve the buried lower face or its terrain contact.',...pair,frames:frames(['ridge-north','ridge-south'])},
 {title:'Judge the actual landscape impact',caption:'The horizon, nearby outcrop and yard retain the change at game scale.',note:native+' Three context views, not full cliff inspections. The yard improvement is subtle; empty hills, carpet-like grass and repeated trees still dominate.',...pair,frames:frames(['horizon-yard','outcrop-context','yard'])},
 {title:'Reject slabs, dunes and thin peaks',caption:'The earlier slab trial and the first two connected trials did not pass the art review.',note:'Retained native candidates only. Thirty slab-trial frames and twenty connected-trial frames were directly inspected across the two checkpoints. Round one was soft and peaked; round two still had a tall blade and triangular scars.',beforeLabel:'REJECTED CANDIDATE',afterLabel:'FINAL / 2.56.0',frames:[...frames(['ridge-west'],'cliff-shape-round-3'),...frames(['ridge-west','east-quarter'],'cliff-shape-connected-round-1'),...frames(['ridge-southwest'],'cliff-shape-connected-round-2')]},
 {title:'A topology pass cannot approve the art',caption:'Round three had four-face edges; round four retained a fin; round five looked spotty.',note:'Round three failed exact edge incidence. Consistent tetrahedral cuts repaired closure in round four, but its eastern fin still failed inspection. Round five lowered the ends, then its blotchy texture was softened for the final build.',beforeLabel:'REJECTED CANDIDATE',afterLabel:'FINAL / 2.56.0',frames:[...frames(['ridge-west'],'cliff-shape-connected-round-3'),...frames(['east-quarter'],'cliff-shape-connected-round-4'),...frames(['ridge-southwest'],'cliff-shape-connected-round-5')]},
 {title:'Expose the added geometry cost',caption:'The ridge remains one indexed mesh with the same material and texture allocation.',note:'Construction evidence does not prove visual quality, geometric self-intersection freedom or a frame-rate benefit.',items:[
  'Ridge triangles: 7,920 -> 17,784 (+9,864). Actual geometry buffers: 1,045,440 -> 723,320 bytes (322,120 fewer). One mesh, no added light or shadow caster.',
  'Complete-record indexing compacts 53,352 -> 14,014 records. Expanding actual indices preserves all 586,872 checked Float32 attribute words; the index uses 106,704 bytes.',
  'All 26,676 exact-position edges have two oppositely directed incident faces. Five closed components have positive signed volume; no zero-area triangle, inverted normal or vertex outside the original footprints remains.',
  'All 1,140 other mesh objects and five other geometry objects retain exact buffers, transforms and material parameters. Field, contacts, obstacles, placements and foliage atlas pixels match.',
  'The common retains 43 meshes, 26 foliage batches, 21 materials, 446,736 triangles and 37,370,414 geometry bytes. The existing 128 by 256 cliff texture changes pixels, not allocation.',
  'Only common-view.js changes executable behaviour. Seventy scripts remain exact; the portable shell matches after LF and version normalization. All 570 system checks pass; 71 standalone scripts compile.'
 ]},
 {title:'Fresh before, after, repeated-before profiles',caption:'Four six-second native RTX windows per build at 1920 by 1080. Row order: baseline / candidate / repeated baseline.',note:'All three runs are fresh: '+profiles.map(p=>p.date).join('; ')+'. Frame cap remains 60 Hz. Competing workload is unknown; this does not establish quiet-machine FPS or a speedup. Four moving miners are render fixtures.',items:perfRows},
 {title:'The harsh critic list stays open',caption:'This improves the distant cliff forms; it does not finish the wider hard art pass.',note:'All ten final native frames and all twelve fresh profile frames were directly inspected. Five face/quarter views, two skyline views and three context views have different inspection value. Earlier input, weapon and multiplayer evidence retains its date.',items:[
  'Broad flat panels and repeated fracture grammar remain visible. Triangular facets and an angular central crest still read as procedural construction.',
  'The wider view remains sparse. Bare hills, carpet-like grass, repeated broadleaf crowns and near fir cards deserve criticism.',
  'Character clothing remains pristine; repeated anatomy and the fixed empty-hand curl remain open.',
  'Physical Firefox turning/strafing, quiet-machine FPS and separate-network co-op remain unverified. The last actual public-lobby audit is dated 2.51.1, with unchanged network source.'
 ]}
];
let html=fs.readFileSync(new URL('rock-surface-review.html',out),'utf8').replaceAll('__rockSurfaceReview','__cliffShapeReview').replaceAll('Rock surfaces','Cliff shapes').replaceAll('ROCK SURFACES','CLIFF SHAPES').replaceAll('2.55.0','2.56.0');
html=html.replace(/const slides=[\s\S]*?;let index=0,sample=0;/,'const slides='+JSON.stringify(slides).replace(/</g,'\\u003c')+';let index=0,sample=0;');
html=html.replace(/<footer>[\s\S]*?<\/footer>/,'<footer><button id="previous">Previous</button><span id="position"></span><a href="cliff-shape-conservation.json" target="_blank">Exact geometry</a><a href="cliff-shape-suite.log" target="_blank">570 checks</a><a href="perf-cliff-shape-after/report.json" target="_blank">Performance</a><a href="../../docs/CLIFF-SHAPES.md" target="_blank">Criticism</a><button id="next">Next</button></footer>');
fs.writeFileSync(new URL('cliff-shape-review.html',out),html);
const hubPath=new URL('current-review.html',out);let hub=fs.readFileSync(hubPath,'utf8');
if(!hub.includes('value="cliff-shape-review.html"'))hub=hub.replace('<select id="review-page">','<select id="review-page"><option value="cliff-shape-review.html">Connected cliff shapes</option>');
hub=hub.replace('Current receipts 2.55.0','Current receipts 2.56.0').replace('<strong>Buttloads 2 / 2.55.0</strong>','<strong>Buttloads 2 / 2.56.0</strong>').replace('?review-2.55.0','?review-2.56.0').replace('src="rock-surface-review.html"','src="cliff-shape-review.html"');
if(!hub.includes('Cliff shapes: 2.56.0.'))hub=hub.replace('<p>Rock surfaces:','<p>Cliff shapes: 2.56.0. Rock surfaces:');fs.writeFileSync(hubPath,hub);
fs.writeFileSync(new URL('cliff-shape-release.json',out),JSON.stringify({date:new Date().toISOString(),version:'2.56.0',buildSha256,checks:570,matchedPairs:10,faceOrQuarterPairs:5,skylinePairs:2,contextPairs:3,slides:9,decodedPairs:17,unchangedExecutableScripts:70,addedGeometryBytes:-322120,addedTriangles:9864,addedDrawBatches:0,addedTextures:0,profileDates:profiles.map(p=>p.date),quietMachineFps:'unverified',physicalFirefoxFeel:'unverified',separateNetworkCoop:'unverified',lastActualGlobalLobbyAudit:'2.51.1'},null,2));
console.log('COMPLETE cliff receipts: nine slides, ten final pairs, seven retained candidate pairs and explicit costs.');
