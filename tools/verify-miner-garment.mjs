import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),read=n=>JSON.parse(fs.readFileSync(new URL(n,out))),sha=v=>createHash('sha256').update(v).digest('hex');
const before=read('miner-garment-before/report.json'),after=read('miner-garment-after/report.json');
assert.equal(before.version,'2.48.0');assert.equal(after.version,'2.49.0');assert.equal(before.shots.length,29);assert.equal(after.shots.length,29);
for(const [stage,r]of [['before',before],['after',after]]){assert.deepEqual(r.errors,[]);assert.deepEqual(r.input,{pointerLock:false,keys:0,fire:false});assert.equal(r.buildSha256,sha(fs.readFileSync(new URL('miner-garment-'+stage+'/index.html',out))));}
assert.equal(after.buildSha256,sha(fs.readFileSync(new URL('../dist/index.html',import.meta.url))));
const comparisons=after.shots.map(s=>{const b=before.shots.find(t=>t.name===s.name);assert.deepEqual(s.camera,b.camera);assert.deepEqual(s.rig,b.rig);assert.equal(s.counts.calls-b.counts.calls,['knee-45-profile','knee-95-profile'].includes(s.name)?1:0);
 if(s.inventory&&!s.name.startsWith('local-')){for(const k of ['meshes','materials','textures'])assert.equal(s.inventory[k],b.inventory[k]);assert.equal(s.inventory.triangles-b.inventory.triangles,1816);assert.equal(s.inventory.geometryBytes-b.inventory.geometryBytes,30640);}
 if(s.name.startsWith('local-'))assert.deepEqual(s,b);
 return{name:s.name,before:b.counts,after:s.counts,addedSubmittedTriangles:s.counts.triangles-b.counts.triangles};});
const parse=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json')),old=fs.readFileSync(new URL('miner-garment-before/index.html',out),'utf8'),current=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),a=parse(old),b=parse(current),names=parse(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8')).map((m,i)=>m[1].match(/src="([^"]+)"/)?.[1]||'inline-'+i),changes=[];
assert.equal(a.length,71);assert.equal(b.length,71);for(let i=0;i<71;i++){new vm.Script(b[i][2]);if(a[i][2]!==b[i][2])changes.push(names[i]);}assert.deepEqual(changes,['src/miner-art.js']);
const clean=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'<script></script>').replace(/(<meta name="application-version" content=")[^"]+/,'$1VERSION');assert.equal(clean(old),clean(current));
assert.equal(fs.readFileSync(new URL('miner-garment-before/crew-view.js',out),'utf8'),fs.readFileSync(new URL('../src/crew-view.js',import.meta.url),'utf8'));
const result={date:new Date().toISOString(),beforeBuildSha256:before.buildSha256,afterBuildSha256:after.buildSha256,matchedFrames:29,changes,allOtherExecutableSourcesExact:true,stylesAndMarkupExactExceptVersion:true,camerasAndRigTransformsExact:true,drawCountsExact:comparisons.every(s=>s.before.calls===s.after.calls),maxAddedDraws:1,firstPersonPosesCamerasAndCountsExact:7,pixelIdentityClaimed:false,addedModelTriangles:1816,addedGeometryArrayBytes:30640,addedMeshes:0,addedMaterials:0,addedTextures:0,animationAndExistingBatchingSourceExact:true,FPSMeasured:false,comparisons};
fs.writeFileSync(new URL('miner-garment-conservation.json',out),JSON.stringify(result,null,2));console.log('COMPLETE garment conservation: 29 matched cameras/rig poses; 27 exact draw counts, two profile views add one; seven first-person poses/counts exact; only miner-art.js changes executable behavior.');
