// Matched native geometry receipts; no browser input or frame-time claim.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const out=new URL('out/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,out)));
const sha=value=>createHash('sha256').update(value).digest('hex');
const num=value=>value.toLocaleString('en-US');
const before=read('chalk-art-before/report.json'),after=read('chalk-art-after/report.json');
const conservation=read('chalk-art-conservation.json'),diff=read('chalk-art-build-diff.json');
const buildHash=sha(fs.readFileSync(new URL('../dist/index.html',import.meta.url)));
assert.equal(before.version,'2.44.0');assert.equal(after.version,'2.45.0');
assert.equal(after.buildSha256,buildHash);assert.equal(diff.afterBuildSha256,buildHash);
assert.equal(conservation.exact,true);assert.equal(conservation.preserved.otherSceneMeshes,1148);
assert.deepEqual(conservation.beforeChalk,{meshes:11,triangles:23672});
assert.deepEqual(conservation.afterChalk,{meshes:11,triangles:19602});
assert.equal(diff.onlyDraperyFactoryChanges,true);assert.equal(diff.onlyChalkWallMountingChanges,true);
assert.equal(diff.allOtherExecutableScriptsExact,true);
for(const stage of ['before','after','round-1','round-2','round-3','round-4']){
 const report=read('chalk-art-'+stage+'/report.json');
 assert.equal(report.shots.length,10);assert.deepEqual(report.errors,[]);
 assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
 assert.equal(report.buildSha256,sha(fs.readFileSync(new URL('chalk-art-'+stage+'/index.html',out))));
}
const raw=fs.readFileSync(new URL('chalk-art-suite.log',out));
assert.ok(raw.toString(raw[0]===255&&raw[1]===254?'utf16le':'utf8').includes('COMPLETE 506 system checks passed'));
const titles={
 'upright-mine':'Native mine: solid drops replace the thin chalk curtain',
 'upright-front':'Front: unequal fluted drops and open gaps',
 'upright-oblique':'Oblique: hanging bodies retain their volume',
 'upright-side':'Side: thickness survives the actual wall projection',
 'steep-front':'Steep wall: original mounting and varied lengths',
 'steep-oblique':'Steep wall: warmer streaks on closed bodies',
 'steep-side':'Steep wall from the side: the coat remains too smooth',
 'steep-mine':'Native steep chamber: the headlamp still flattens colour',
 'gallery-west':'Native gallery west: the new profile at game scale',
 'gallery-east':'Native gallery east: repeated five-drop groups remain obvious'
};
const order=['upright-mine','upright-front','upright-oblique','upright-side','steep-front','steep-oblique','steep-side','steep-mine','gallery-west','gallery-east'];
const slides=[];
for(const name of order){
 const old=before.shots.find(s=>s.name===name),current=after.shots.find(s=>s.name===name);
 assert.deepEqual(current.camera,old.camera);
 if(current.kind==='mine'){
  assert.deepEqual(current.nativeCamera,old.nativeCamera);
  assert.ok(current.cameraField>.03&&old.cameraField>.03);
 }
 slides.push({kind:'pair',title:titles[name],
  caption:(current.kind==='mine'?'Original terrain, camera, mounting and production headlamp. ':'Actual wall-mounted production geometry, isolated under identical study lighting. ')+
   `Cached draws ${old.cached.calls} to ${current.cached.calls}; triangles ${num(old.cached.triangles)} to ${num(current.cached.triangles)}.`,
  before:'chalk-art-before/'+name+'.png',after:'chalk-art-after/'+name+'.png',
  note:current.kind==='mine'?'Same seed and native camera. Direct static evaluation, no input events or gameplay traversal. A changed shape/bound can change visibility by one draw; this is not an FPS test.':'Matched framing contains the entire model in both versions. These enlarged studies show construction, not normal gameplay scale. One mesh remains one mesh; 2,152 to 1,782 triangles.'});
}
for(const [stage,title,caption]of [
 ['round-1','Rejected: wall projection stretched the tips into fins','Full wall projection pulled solid tips sideways. The flat cuts and narrow pointed ends looked manufactured; passing solid-geometry tests did not make the art acceptable.'],
 ['round-2','Rejected: broad drops looked like a row of teeth','Rigid drops fixed the stretching, but the smooth oval backing and broad bodies still looked manufactured. The accepted version uses narrower fluting, unequal lengths and a smaller coat.']
]){
 const candidate=read('chalk-art-'+stage+'/report.json').shots.find(s=>s.name==='upright-mine');
 assert.deepEqual(candidate.camera,after.shots.find(s=>s.name==='upright-mine').camera);
 slides.push({kind:'pair',title,caption,before:'chalk-art-'+stage+'/upright-mine.png',after:'chalk-art-after/upright-mine.png',beforeLabel:'REJECTED / '+stage.toUpperCase(),defaultBefore:true,note:'Frozen candidate build, sources and native capture reports are linked below. Rejected studio framing differs; only this unchanged native mine camera is used for comparison.'});
}
slides.push({title:'4,070 fewer model triangles; draw savings are not claimed',
 caption:'Eleven chalk meshes remain eleven. Cavern inventory falls from 107,266 to 103,196 triangles with the same 114 meshes. The upper/deep/expedition supported cells remain 16 / 19 / 10. No textures, materials or lights are added.',
 headers:['Native mine view','Cached draws / triangles: before → after','Refresh draws / triangles: before → after'],
 rows:after.shots.filter(s=>s.kind==='mine').map(s=>{const b=before.shots.find(t=>t.name===s.name);return[s.name,`${b.cached.calls} / ${num(b.cached.triangles)} → ${s.cached.calls} / ${num(s.cached.triangles)}`,`${b.refresh.calls} / ${num(b.refresh.triangles)} → ${s.refresh.calls} / ${num(s.refresh.triangles)}`];}),
 note:'Changed geometry and refreshed bounds alter visibility by up to one draw. Upright refresh adds one draw. Prior merge savings and adaptive ore source remain exact. Competing GPU work prevents a quiet-machine FPS claim.'});
slides.push({title:'506 checks pass, including the mounted-solid regression',
 caption:'All ten final native pairs were inspected. Conservation compares the complete scene; portable comparison compiles all 71 scripts and verifies the narrow source changes.',
 headers:['Verification','Coverage / baseline','Result'],
 rows:[['Mounted pendant centre/rim queries','880 checked','880 inside the coat'],['Mounted geometry / bounds','Closed outward solids','Every vertex enclosed'],['Other native scene meshes','1,148','Exact attributes, bounds, transforms and flags'],['Terrain, contacts, support, roots and accents','Native baseline','Exact'],['Executable source scope','71 scripts compile','Chalk factory/mounting and version alone change'],['Complete pure-system suite','505 before','506 after']],
 note:'Round three retained stale bounds and clipped two study tips. Round four added seating raycasts without repairing those bounds. Simple mounting plus refreshed bounds passes all 880 queries; unnecessary seating queries are removed. The preceding fossil campaign remains dated 2.44.0.'});
slides.push({title:'Better volume; the hard art pass remains unfinished',
 caption:'The thin curtain and swept blade tips are gone. The accepted native views show thicker bodies, gaps, unequal lengths and fluting. The critic pass still fails the broader finished-art standard.',
 items:[
  'The repeated five-drop anatomy is obvious. The coat remains too smooth and oval, and several flutes read as pencil grooves.',
  'Pale green material and the headlamp flatten warmer streaks. Original wall normals tilt some groups sideways, where they can resemble hanging creatures.',
  'The native look prompt overlaps close art. Enlarged model studies must not be treated as evidence of detail at normal game distance.',
  'The depot, tool surfaces, broader environment and simple creature motion still need criticism. This checkpoint does not certify the whole game.',
  'Quiet-machine frame time, physical Firefox mouse feel and separate-network co-op remain unverified. No push or deployment is included.'
 ],note:'Local 2.45.0. The broader multiplayer, hard art, performance and movement improvement goal remains active.'});
assert.equal(slides.length,15);
let html=fs.readFileSync(new URL('creature-art-review.html',out),'utf8');
let start=html.indexOf('const slides='),end=html.indexOf(';let index=0',start);
assert.ok(start>=0&&end>start);
html=html.slice(0,start)+'const slides='+JSON.stringify(slides).replace(/</g,'\\u003c')+html.slice(end);
html=html.replaceAll('Native creature art / 2.42.0','Native chalk art / 2.45.0')
 .replaceAll('NATIVE CREATURE ART / 2.42.0','NATIVE CHALK ART / 2.45.0')
 .replaceAll('BEFORE / 2.41.1','BEFORE / 2.44.0').replaceAll('AFTER / 2.42.0','AFTER / 2.45.0')
 .replaceAll('creature-art-2.42.0','chalk-art-2.45.0').replace('window.__creatureArtReview=','window.__chalkArtReview=')
 .replaceAll('After: native creature anatomy','After: native chalk mineral construction');
const links=[['Frozen baseline','chalk-art-before/report.json'],['Final capture','chalk-art-after/report.json'],['Native conservation','chalk-art-conservation.json'],['Portable source comparison','chalk-art-build-diff.json'],['506 system checks','chalk-art-suite.log'],['Mounting alternative','chalk-art-mount-alternative.json'],['Rejected camera','chalk-art-camera-rejected/rejection.json'],['Scope and criticism','../../docs/CHALK-ART.md'],['Previous ore submission','../../docs/ORE-BATCHING.md']];
for(const stage of ['round-1','round-2','round-3','round-4'])links.push(['Rejected '+stage,'chalk-art-'+stage+'/report.json']);
for(const name of order)for(const stage of ['before','after'])links.push([name+' '+stage,'chalk-art-'+stage+'/'+name+'.png']);
for(const [,file]of links)assert.ok(fs.existsSync(new URL(file,out)),file);
start=html.indexOf('<details>');end=html.indexOf('</details>',start);
html=html.slice(0,start)+'<details><summary>Raw receipts</summary>'+links.map(([name,file])=>'<a href="'+file+'">'+name+'</a>').join('')+'</details>'+html.slice(end+10);
fs.writeFileSync(new URL('chalk-art-review.html',out),html);
fs.writeFileSync(new URL('chalk-art-release.json',out),JSON.stringify({date:new Date().toISOString(),version:after.version,buildSha256:buildHash,beforeBuildSha256:before.buildSha256,checks:506,slides:15,matchedViews:10,removedTriangles:4070,meshCount:{before:11,after:11},otherSceneMeshesExact:1148,frameRateGainMeasured:false,physicalFirefoxFeel:'unverified',separateNetworkCoop:'unverified'},null,2));
console.log('COMPLETE chalk art receipts: 15 slides, ten matched views, rejected revisions and 506 checks.');
