// Bind the actual fixed-camera images to their frozen builds before making slides.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),out=new URL('out/',import.meta.url);
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=name=>JSON.parse(fs.readFileSync(new URL(name+'/report.json',out),'utf8'));
const before=read('fracture-before'),after=read('fracture-release');
const raw=fs.readFileSync(new URL('system-fracture.log',out)),log=raw.toString(raw[0]===255&&raw[1]===254?'utf16le':'utf8'),checks=Number(log.match(/COMPLETE (\d+) system checks passed/)?.[1]);
assert.equal(checks,423);assert.equal(before.version,'2.32.0');assert.equal(after.version,'2.33.0');
assert.equal(after.buildSha256,sha(new URL('dist/index.html',root)));
for(const name of ['before','round-1','round-2','round-3','candidate','release']){
 const folder='fracture-'+name,r=read(folder);
 assert.equal(r.shots.length,6);assert.equal(r.buildSha256,sha(new URL(folder+'/build.html',out)));
 assert.deepEqual(r.errors,[]);assert.equal(r.pointerLock,false);assert.deepEqual(r.inventory.invalidAttributes,[]);
 for(const shot of r.shots){assert.deepEqual(shot.camera,before.shots.find(b=>b.name===shot.name).camera);assert.ok(fs.statSync(new URL(folder+'/'+shot.name+'.png',out)).size>1000);}
}
for(const key of ['obstacles','trees','gardens','rocks','ridgeBounds','terrainHash'])assert.deepEqual(after.inventory[key],before.inventory[key],key+' changed');
assert.deepEqual(after.inventory.groups,read('fracture-candidate').inventory.groups);
assert.equal(sha(new URL('fracture-release/common-view.js',out)),sha(new URL('src/common-view.js',root)));
const slides=[],pair=(title,shot,caption)=>slides.push({kind:'pair',title,caption,before:'fracture-before/'+shot+'.png',after:'fracture-release/'+shot+'.png',note:'Native game / identical seed, walking-height camera and sunlight / 1440 x 1000. No timing sweep during the reported Qwen workload; physical mouse feel remains untried.'});
pair('Western outcrop: separate fractured masses','outcrop-west','Wrapped concentric ledges become three stone masses with open fissures, sloping shoulders, broken lower corners and grounded chips. The surface deformation changes the model itself. Broad faces remain stylized and need further judgment.');
pair('Northern outcrop: inspect the shaded silhouette','outcrop-north','The crest and side pieces have different heights and slopes. The first revision resembled concrete blocks; the second made pointed pyramids with dark stripes. Both are retained below as rejected work.');
pair('Eastern outcrop: inspect the shaded break','outcrop-east','A taller central mass and lower shoulder replace the same banded mound. Crack faces use restrained baked shading. The nearby tree occludes part of this view; the comparison does not hide that limitation.');
pair('Smaller outcrop: inspect from the slope','outcrop-pair','This view judges the smaller rock from below. It retains its position on the rise, existing support height and collision record. Coarse break faces remain an art limitation.');
pair('Southern outcrop: judge the bright face','outcrop-south','The same terrain still buries part of the rock. Separate shoulders and an open break replace repeated concentric seams. The bright broad face has weak surface detail; that remains criticism.');
pair('Wide grove: inspect both rocks together','outcrop-wide','The nearby pair now differs in crest, height distribution and break direction. Other environment weaknesses remain visible: angular grass, oversized broadleaf leaves and soft distant cliffs.');
slides.push({kind:'pair',title:'Rejected first revision: concrete blocks',caption:'The cracks appeared, but large flat tops and tall straight faces made the outcrops look manufactured. All six views were inspected. The frozen build and source remain available.',before:'fracture-round-1/outcrop-west.png',after:'fracture-release/outcrop-west.png',beforeLabel:'REJECTED / ROUND 1',note:'Actual intermediate native frame, not a mockup. Its version label is still 2.32.0; the recorded build hash distinguishes it from the baseline.'});
slides.push({kind:'pair',title:'Rejected second revision: pointed pyramids',caption:'Stronger bevels made pointed tents. Dark fissure materials read as stripes across their shoulders. The final construction relaxes those crests, lowers separate shoulders and reduces the crack-face contrast.',before:'fracture-round-2/outcrop-north.png',after:'fracture-release/outcrop-north.png',beforeLabel:'REJECTED / ROUND 2',note:'All six round-two frames were inspected. Round three and the final candidate also retain six images and frozen source/build snapshots.'});
const b=before.inventory.groups,a=after.inventory.groups,delta=a.commonScene.triangles-b.commonScene.triangles;
slides.push({title:'Native cost and outstanding review',caption:'2.33.0 passes '+checks+' system checks. All five support heights and outward-facing exteriors retain regression coverage. This is a rock-model checkpoint; the full game review remains open.',rows:[['Common scene triangles',b.commonScene.triangles,a.commonScene.triangles],['Common material batches',b.commonScene.meshes,a.commonScene.meshes],['Distant ridge triangles',b.ridgeline.triangles,a.ridgeline.triangles],['Distant ridge material batches',b.ridgeline.meshes,a.ridgeline.meshes],['Lights in these groups',0,0],['Collision tuples',before.inventory.obstacles.length,after.inventory.obstacles.length]],note:'Common geometry changes by '+delta.toLocaleString('en-US')+' triangles. Contact, planting and field fingerprint '+after.inventory.terrainHash+' remain exact. Quiet-machine performance, physical Firefox input feel and separate-network co-op remain unverified.'});
let html=fs.readFileSync(new URL('mouse-entry-review.html',out),'utf8');
const start=html.indexOf('const slides='),end=html.indexOf(';let index=0',start);assert.ok(start>=0&&end>=0);
html=html.slice(0,start)+'const slides='+JSON.stringify(slides).replace(/</g,'\\u003c')+html.slice(end);
html=html.replace('Buttloads 2 / Mouse entry / 2.29.3','Buttloads 2 / Fractured rocks / 2.33.0').replace('MOUSE ENTRY / 2.29.3','FRACTURED ROCKS / 2.33.0').replace('window.__mouseEntryReview=','window.__fractureReview=');
html=html.replace('<span class="label old">BEFORE / 2.29.2</span>',`<span class="label old">'+e(s.beforeLabel||'BEFORE / 2.32.0')+'</span>`).replace('<span class="label new">AFTER / 2.29.3</span>',`<span class="label new">AFTER / 2.33.0</span>`);
html=html.replace('Before: no acquisition cue','Before: native rock model').replace('After: current unlocked desktop cue','After: native rock model').replaceAll('mouse-entry-2.29.3','fracture-2.33.0').replace('BEFORE / 2.29.2</th>','BEFORE / 2.32.0</th>').replace('AFTER / 2.29.3</th>','AFTER / 2.33.0</th>').replace('Observed behavior</th>','Native scene inventory</th>');
const links=[['Native baseline','fracture-before/report.json'],['Native release','fracture-release/report.json'],['Rejected blocks','fracture-round-1/report.json'],['Rejected pyramids','fracture-round-2/report.json'],['Third revision','fracture-round-3/report.json'],['Final candidate','fracture-candidate/report.json'],['Full system log','system-fracture.log'],['Critic record','../../docs/FRACTURED-ROCKS.md']];
const linksStart=html.indexOf('<details>'),linksEnd=html.indexOf('</details>',linksStart);assert.ok(linksStart>=0&&linksEnd>=0);
html=html.slice(0,linksStart)+'<details><summary>Raw receipts</summary>'+links.map(([name,file])=>'<a href="'+file+'">'+name+'</a>').join('')+'</details>'+html.slice(linksEnd+10);
fs.writeFileSync(new URL('fracture-review.html',out),html);
fs.writeFileSync(new URL('fracture-release.json',out),JSON.stringify({version:after.version,date:new Date().toISOString(),buildSha256:after.buildSha256,beforeBuildSha256:before.buildSha256,checks,slides:slides.length,matchedViews:6,rejectedRounds:2,triangleDelta:delta,inventory:after.inventory,timingContext:after.timingContext},null,2));
console.log('COMPLETE fracture receipts: nine slides; six matched views; frozen hashes, attributes and contact records verified; '+checks+' system checks.');
