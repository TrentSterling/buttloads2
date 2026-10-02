// Bind the actual fixed-camera images to their frozen builds before making slides.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),out=new URL('out/',import.meta.url);
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=name=>JSON.parse(fs.readFileSync(new URL(name+'/report.json',out),'utf8'));
const before=read('escarpment-before'),after=read('escarpment-release');
const raw=fs.readFileSync(new URL('system-escarpment.log',out)),log=raw.toString(raw[0]===255&&raw[1]===254?'utf16le':'utf8'),checks=Number(log.match(/COMPLETE (\d+) system checks passed/)?.[1]);
assert.equal(checks,423);assert.equal(before.version,'2.33.0');assert.equal(after.version,'2.34.0');
assert.equal(after.buildSha256,sha(new URL('dist/index.html',root)));
for(const name of ['before','round-1','round-2','candidate','release']){
 const folder='escarpment-'+name,r=read(folder);
 assert.equal(r.shots.length,6);assert.equal(r.buildSha256,sha(new URL(folder+'/build.html',out)));
 assert.deepEqual(r.errors,[]);assert.equal(r.pointerLock,false);assert.deepEqual(r.inventory.invalidAttributes,[]);
 for(const shot of r.shots){assert.deepEqual(shot.camera,before.shots.find(b=>b.name===shot.name).camera);assert.ok(fs.statSync(new URL(folder+'/'+shot.name+'.png',out)).size>1000);}
}
for(const key of ['obstacles','trees','gardens','rocks','ridgeBounds','terrainHash'])assert.deepEqual(after.inventory[key],before.inventory[key],key+' changed');
assert.deepEqual(after.inventory.groups,read('escarpment-candidate').inventory.groups);
assert.equal(sha(new URL('escarpment-release/common-view.js',out)),sha(new URL('src/common-view.js',root)));
const slides=[],pair=(title,shot,caption)=>slides.push({kind:'pair',title,caption,before:'escarpment-before/'+shot+'.png',after:'escarpment-release/'+shot+'.png',note:'Native game / same seed, walking-height camera and sunlight / 1440 x 1000. No timing sweep during the reported Qwen workload; physical Firefox mouse feel remains untried.'});
pair('Western cliff: follow the real ledges','ridge-west','A rounded mound becomes a cliff with separate crest, face, ledge and foot. Vertices follow those actual bed boundaries. The first revision made organ pipes; the second exposed false vertical stripes. Both failed review.');
pair('Northern crest: judge the distant silhouette','ridge-north','A longer broken crest replaces the rounded peak. The same foreground hill still hides most of the lower cliff; this view establishes the skyline, not close surface detail. The shelf remains too continuous.');
pair('Eastern cliff: uneven erosion','ridge-east','Gullies differ in position, width and depth. Clean boundary shading replaces the dense-grid stripe artifacts. Some slender peaks and broad face sections still look too regular.');
pair('Southern bluff: inspect the bright face','ridge-south','The initial camera at 34,62 was inside a nearby rock. The frozen rejected camera capture remains available. Both comparison frames use the corrected clear position at 26,59. Bright stone still has weak surface contrast.');
pair('Southwestern cliff: crest and broken shoulder','ridge-southwest','A stepped shoulder and separate face replace the soft mound. Erosion varies along the crest. The long bright shelf and smooth rubble slope remain critic findings.');
pair('Yard horizon: inspect it in the whole scene','horizon-yard','The skyline changes behind the original hill, power lines and mine yard. Ground, tree, garden and contact records remain exact. This view also retains the wider environment weaknesses, including sparse foreground composition.');
slides.push({kind:'pair',title:'Rejected first revision: organ pipes',caption:'The steep wall was an improvement, but the same two deep clefts created three similar rounded towers on several cliffs. All six views were inspected; its actual build and source remain frozen.',before:'escarpment-round-1/ridge-east.png',after:'escarpment-release/ridge-east.png',beforeLabel:'REJECTED / ROUND 1',note:'Actual intermediate native frame. Its 2.33.0 label differs from the baseline through its recorded build hash.'});
slides.push({kind:'pair',title:'Rejected second revision: artificial vertical stripes',caption:'Angle-based creasing exposed the steep heightfield grid as thin vertical ribs. The final mesh follows the crest, ledge and foot directly, and creases only their real boundaries.',before:'escarpment-round-2/ridge-southwest.png',after:'escarpment-release/ridge-southwest.png',beforeLabel:'REJECTED / ROUND 2',note:'All six second-round frames were inspected. The final candidate and release retain their own six frames, build/source snapshots and hashes.'});
const b=before.inventory.groups,a=after.inventory.groups,delta=a.ridgeline.triangles-b.ridgeline.triangles;
slides.push({title:'Native cost and outstanding review',caption:'2.34.0 passes '+checks+' system checks. The geometry diagnostic inspects every ridge triangle for outward orientation, unit normals and placement within its original decorative footprint.',rows:[['Distant ridge triangles',b.ridgeline.triangles,a.ridgeline.triangles],['Distant ridge material batches',b.ridgeline.meshes,a.ridgeline.meshes],['Common scene triangles',b.commonScene.triangles,a.commonScene.triangles],['Common material batches',b.commonScene.meshes,a.commonScene.meshes],['Lights in these groups',0,0],['Collision tuples',before.inventory.obstacles.length,after.inventory.obstacles.length]],note:'Ridge geometry changes by '+delta.toLocaleString('en-US')+' triangles. Native UVs, colours and normals are complete and finite. Terrain fingerprint '+after.inventory.terrainHash+'. Quiet-machine performance, physical Firefox input and separate-network co-op remain unverified.'});
let html=fs.readFileSync(new URL('mouse-entry-review.html',out),'utf8');
const start=html.indexOf('const slides='),end=html.indexOf(';let index=0',start);assert.ok(start>=0&&end>=0);
html=html.slice(0,start)+'const slides='+JSON.stringify(slides).replace(/</g,'\\u003c')+html.slice(end);
html=html.replace('Buttloads 2 / Mouse entry / 2.29.3','Buttloads 2 / Escarpment art / 2.34.0').replace('MOUSE ENTRY / 2.29.3','ESCARPMENT ART / 2.34.0').replace('window.__mouseEntryReview=','window.__escarpmentReview=');
html=html.replace('<span class="label old">BEFORE / 2.29.2</span>',`<span class="label old">'+e(s.beforeLabel||'BEFORE / 2.33.0')+'</span>`).replace('<span class="label new">AFTER / 2.29.3</span>',`<span class="label new">AFTER / 2.34.0</span>`);
html=html.replace('Before: no acquisition cue','Before: native cliff model').replace('After: current unlocked desktop cue','After: native cliff model').replaceAll('mouse-entry-2.29.3','escarpment-2.34.0').replace('BEFORE / 2.29.2</th>','BEFORE / 2.33.0</th>').replace('AFTER / 2.29.3</th>','AFTER / 2.34.0</th>').replace('Observed behavior</th>','Native scene inventory</th>');
const links=[['Native baseline','escarpment-before/report.json'],['Native release','escarpment-release/report.json'],['Rejected organ pipes','escarpment-round-1/report.json'],['Rejected vertical stripes','escarpment-round-2/report.json'],['Rejected review camera','escarpment-camera-reject/report.json'],['Geometry diagnostic','escarpment-geometry-report.json'],['Final candidate','escarpment-candidate/report.json'],['Full system log','system-escarpment.log'],['Critic record','../../docs/ESCARPMENT-ART.md']];
const linksStart=html.indexOf('<details>'),linksEnd=html.indexOf('</details>',linksStart);assert.ok(linksStart>=0&&linksEnd>=0);
html=html.slice(0,linksStart)+'<details><summary>Raw receipts</summary>'+links.map(([name,file])=>'<a href="'+file+'">'+name+'</a>').join('')+'</details>'+html.slice(linksEnd+10);
fs.writeFileSync(new URL('escarpment-review.html',out),html);
fs.writeFileSync(new URL('escarpment-release.json',out),JSON.stringify({version:after.version,date:new Date().toISOString(),buildSha256:after.buildSha256,beforeBuildSha256:before.buildSha256,checks,slides:slides.length,matchedViews:6,rejectedRounds:2,triangleDelta:delta,inventory:after.inventory,timingContext:after.timingContext},null,2));
console.log('COMPLETE escarpment receipts: nine slides; six matched views; frozen hashes, attributes and contact records verified; '+checks+' system checks.');
