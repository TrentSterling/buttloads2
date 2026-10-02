// Frozen native models and construction evidence; no input or timing claims.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),read=n=>JSON.parse(fs.readFileSync(new URL(n,out))),sha=b=>createHash('sha256').update(b).digest('hex'),num=n=>n.toLocaleString('en-US');
const before=read('attachment-art-before/report.json'),after=read('attachment-art-after/report.json'),proof=read('attachment-art-conservation.json'),inspection=read('attachment-art-inspection.json');
assert.equal(before.version,'2.46.0');assert.equal(after.version,'2.47.0');
assert.equal(after.buildSha256,sha(fs.readFileSync(new URL('../dist/index.html',import.meta.url))));
assert.equal(proof.afterBuildSha256,after.buildSha256);assert.equal(proof.exactPreservedState,true);
assert.equal(inspection.buildSha256,after.buildSha256);assert.equal(inspection.finalNativeAndStudyFrames,64);
for(const file of inspection.files){assert.equal(file.personallyInspected,true);assert.equal(file.sha256,sha(fs.readFileSync(new URL('../'+file.file,import.meta.url))));}
const log=fs.readFileSync(new URL('attachment-art-suite.log',out));assert.ok(log.toString(log[0]===255&&log[1]===254?'utf16le':'utf8').includes('COMPLETE 526 system checks passed'));
const titles={
 'local-scoop':'First person: a continuous bucket and tapered teeth',
 'local-lance':'First person: a hollow housing and continuous striker',
 'local-resonance':'First person: a copper winding and recessed front guard',
 'active-scoop':'Scoop stroke: the original moving assembly survives',
 'active-lance':'Lance stroke: the striker still travels independently',
 'scoop-quarter':'Scoop study: solid floor, fitted cheeks and teeth',
 'scoop-underside':'Scoop underneath: ribs sit outside the interior',
 'lance-quarter':'Lance study: fitted collars replace thin stacked discs',
 'resonance-quarter':'Resonator study: actual coil spacing and a visible centre',
 'remote-cutter':'Crew cutter: the original model and grip remain',
 'remote-scoop':'Crew scoop: the reconstructed bucket stays attached',
 'remote-lance':'Crew lance: the reconstructed housing follows the palm',
 'remote-resonance':'Crew resonator: the winding and guard are visible',
 'remote-gravity':'Crew gravity tool: original geometry and pose',
 'remote-axe':'Crew axe: original geometry and pose',
 'remote-sling':'Crew sling: original geometry and pose'
};
const slides=Object.entries(titles).map(([name,title])=>{
 const b=before.shots.find(s=>s.name===name),a=after.shots.find(s=>s.name===name);assert.deepEqual(a.camera,b.camera);
 return{kind:'pair',title,caption:(a.kind==='native'?'Native lighting, terrain, camera and tool pose. ':'Actual production model under identical neutral study lighting. ')+`Cached draws ${b.cached.calls} to ${a.cached.calls}; submitted triangles ${num(b.cached.triangles)} to ${num(a.cached.triangles)}.`,before:'attachment-art-before/'+name+'.png',after:'attachment-art-after/'+name+'.png',note:a.kind==='native'?'Fixed seed/time and static native rendering. Active poses use the actual mining-state renderer; simulation and transport are inert. No traversal or FPS test.':'Enlarged production equipment/crew study. Side and underside studies focus on attachments and crop the rear assembly; quarter views retain the whole tool. Normal-distance detail and finished character art remain unproven.'};
});
const rejected=read('attachment-art-round-1/report.json');assert.deepEqual(rejected.shots.find(s=>s.name==='scoop-quarter').camera,after.shots.find(s=>s.name==='scoop-quarter').camera);
slides.push({kind:'pair',title:'Rejected: the ribs cut through the bucket floor',caption:'The first shell offset went toward the interior. Reinforcement plates showed through and flat strip normals made a ladder. A cheek bevel also failed welded closure. The corrected floor puts thickness outside the scoop.',before:'attachment-art-round-1/scoop-quarter.png',after:'attachment-art-after/scoop-quarter.png',beforeLabel:'REJECTED / ROUND-1',defaultBefore:true,note:'Frozen candidate build, source, camera report and written criticism are retained. Continuous floor normals, plain closed cheeks and fitted outer ribs replace the failed construction.'});
slides.push({title:'Three fewer meshes and 896 fewer triangles; the lance costs more',caption:'Entire mechanical inventory: 31 meshes / 22,922 triangles to 28 / 22,026. Materials across four weapon roots: 23 to 18. Geometry arrays: 2,414,490 to 2,366,266 bytes.',headers:['Native equipment','Cached draws / triangles: before to after','Refresh draws: before to after'],rows:after.shots.filter(s=>['local-scoop','local-lance','local-resonance','local-cutter'].includes(s.name)).map(a=>{const b=before.shots.find(s=>s.name===a.name);return[a.name,`${b.cached.calls} / ${num(b.cached.triangles)} to ${a.cached.calls} / ${num(a.cached.triangles)}`,`${b.refresh.calls} to ${a.refresh.calls}`];}),note:'Scoop removes 1,428 triangles; resonator removes 656; lance adds 1,188. No textures or lights are added. Prior crew/world batching remains exact. Submission counts do not establish a timing or FPS gain under the competing GPU workload.'});
slides.push({title:'526 checks pass; the actual faces, motions and grips are checked',caption:'Seven new regressions cover closure, outward winding, finite attributes, physical interior faces, rib clearance, full moving-head cycles and the combined inventory budget. All 71 portable scripts compile.',headers:['Evidence','Result','Scope'],rows:[['Complete pure-system suite','526 checks pass','Seven new attachment regressions'],['Other scene / tool meshes',num(proof.preserved.otherMeshes)+' exact records','Geometry, flags, transforms and materials'],['All seven crew tools / three pitches','21 grip poses pass','Original attachment contacts'],['Matched camera and action reports','32 pairs','Native heads, rotor and needle poses exact'],['Contact marks / renderMining','Exact source','Production motion unchanged'],['Individual final image inspection','64 PNGs','Every local/crew weapon and four study angles']],note:'Only mining-view.js and tool-art.js change executable code. A verification assertion demanding hidden cutter rotation during resonance was rejected; both builds rotate the resonator head instead. Physical Firefox input and separate-network co-op remain unverified.'});
slides.push({title:'Construction improves; finished hard art still fails',caption:'The scoop seams, lance disc stack and resonator sheets are improved. The harsh inspection still rejects the broader finished-art standard.',items:['Steel panels are pristine and unweathered. Teeth and pin heads repeat regularly, and the bucket cheeks have sharp plate edges.','The lance rails remain plain and its needle-like point looks fragile. Coil terminations are abrupt; pale glowing rims still need an aged material treatment.','The miner keeps a stiff posture, broad shoulder/chest forms and a repeated face. Seeing all seven weapons does not settle character art quality.','The unchanged cave view still shows thin shelves and floating-looking clutter. Neutral close-ups magnify details that shrink in normal gameplay.','Quiet-machine CPU/GPU timing, physical Firefox turning/strafing, separate-network co-op and wider art/motion remain open.'],note:'Local 2.47.0 progress checkpoint. The rejected candidate and false verification assertion remain linked. No commit, push or deployment is included.'});
assert.equal(slides.length,20);
let html=fs.readFileSync(new URL('creature-art-review.html',out),'utf8'),start=html.indexOf('const slides='),end=html.indexOf(';let index=0',start);assert.ok(start>=0&&end>start);
html=html.slice(0,start)+'const slides='+JSON.stringify(slides).replace(/</g,'\\u003c')+html.slice(end);
html=html.replaceAll('Native creature art / 2.42.0','Attachment construction / 2.47.0').replaceAll('NATIVE CREATURE ART / 2.42.0','ATTACHMENT CONSTRUCTION / 2.47.0').replaceAll('BEFORE / 2.41.1','BEFORE / 2.46.0').replaceAll('AFTER / 2.42.0','AFTER / 2.47.0').replaceAll('creature-art-2.42.0','attachment-art-2.47.0').replace('window.__creatureArtReview=','window.__attachmentArtReview=').replaceAll('After: native creature anatomy','After: reconstructed production attachment');
const links=[['Frozen baseline','attachment-art-before/report.json'],['Final capture','attachment-art-after/report.json'],['Source / native conservation','attachment-art-conservation.json'],['526 system checks','attachment-art-suite.log'],['Rejected round one','attachment-art-round-1/critic.json'],['Rejected verification assertion','attachment-art-rejected-verification.json'],['Individual inspection','attachment-art-inspection.json'],['Scope and criticism','../../docs/ATTACHMENT-ART.md'],['Previous cutter construction','cutter-art-review.html'],['Previous crew batching','crew-batching-review.html']];
for(const stage of ['before','round-1','round-2','after'])for(const file of ['index.html','tool-art.js','mining-view.js'])links.push([stage+' '+file,'attachment-art-'+stage+'/'+file]);
for(const shot of after.shots)for(const stage of ['before','after'])links.push([shot.name+' '+stage,'attachment-art-'+stage+'/'+shot.name+'.png']);
for(const [,file]of links)assert.ok(fs.existsSync(new URL(file,out)),file);
start=html.indexOf('<details>');end=html.indexOf('</details>',start);
html=html.slice(0,start)+'<details><summary>Raw receipts</summary>'+links.map(([name,file])=>'<a href="'+file+'">'+name+'</a>').join('')+'</details>'+html.slice(end+10);
fs.writeFileSync(new URL('attachment-art-review.html',out),html);
fs.writeFileSync(new URL('attachment-art-release.json',out),JSON.stringify({date:new Date().toISOString(),version:after.version,buildSha256:after.buildSha256,beforeBuildSha256:before.buildSha256,checks:526,slides:20,matchedViews:32,modelCost:proof.after,addedTriangles:proof.addedTriangles,removedMeshes:proof.removedMechanicalMeshes,equipmentResources:proof.equipmentResources,otherSceneRecordsExact:proof.preserved.otherMeshes,addedTextures:0,FPSGainMeasured:false,physicalFirefoxFeel:'unverified',separateNetworkCoop:'unverified',hardArtVerdict:inspection.verdict},null,2));
console.log('COMPLETE attachment receipts: 20 slides, 32 matched views, all seven tools and 526 checks.');
