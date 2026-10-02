// Portable source and native fixture comparison; no browser or timing samples.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex');
const read=n=>JSON.parse(fs.readFileSync(new URL(n,out)));
const before=read('crew-batching-before/report.json'),after=read('crew-batching-after/report.json');
assert.equal(before.version,'2.45.0');assert.equal(after.version,'2.45.1');assert.equal(before.shots.length,12);assert.equal(after.shots.length,12);
for(const [stage,r]of [['before',before],['after',after]]){
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.input,{pointerLock:false,keys:0,fire:false});
 assert.equal(r.buildSha256,sha(fs.readFileSync(new URL('crew-batching-'+stage+'/index.html',out))));
}
assert.equal(after.buildSha256,sha(fs.readFileSync(new URL('../dist/index.html',import.meta.url))));
const comparisons=after.shots.map(s=>{
 const b=before.shots.find(p=>p.name===s.name);assert.deepEqual(s.camera,b.camera);assert.deepEqual(s.poses,b.poses);
 for(const r of [b,s]){assert.equal(r.support.length,r.members);assert.ok(r.support.every(p=>p.clear&&p.supported));}
 assert.equal(s.cached.triangles,b.cached.triangles,s.name+' cached triangles');assert.equal(s.refresh.triangles,b.refresh.triangles,s.name+' shadow triangles');
 assert.ok(s.cached.calls<=b.cached.calls);assert.ok(s.refresh.calls<=b.refresh.calls);
 return{name:s.name,members:s.members,cachedBefore:b.cached,cachedAfter:s.cached,refreshBefore:b.refresh,refreshAfter:s.refresh,savedCachedCalls:b.cached.calls-s.cached.calls,savedRefreshCalls:b.refresh.calls-s.refresh.calls,instanceBytes:s.batching.instanceBytes};
});
const parse=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json'));
const old=fs.readFileSync(new URL('crew-batching-before/index.html',out),'utf8'),current=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const a=parse(old),b=parse(current),names=parse(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8')).map((m,i)=>m[1].match(/src="([^"]+)"/)?.[1]||'inline-'+i),changes=[];
assert.equal(a.length,71);assert.equal(b.length,71);
for(let i=0;i<71;i++){new vm.Script(b[i][2]);if(a[i][2]!==b[i][2])changes.push({file:names[i],beforeEmbeddedScriptSha256:sha(a[i][2]),afterEmbeddedScriptSha256:sha(b[i][2])});}
assert.deepEqual(changes.map(c=>c.file),['src/render.js','src/crew-view.js']);
const clean=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'<script></script>').replace(/(<meta name="application-version" content=")[^"]+/,'$1VERSION');
assert.equal(clean(old),clean(current));
assert.equal(sha(fs.readFileSync(new URL('../src/miner-art.js',import.meta.url))),sha(fs.readFileSync(new URL('crew-batching-before/miner-art.js',out))));
const rawSourceSha256=Object.fromEntries(['render.js','crew-view.js','miner-art.js'].map(n=>['src/'+n,sha(fs.readFileSync(new URL('../src/'+n,import.meta.url)))]));
fs.writeFileSync(new URL('crew-batching-conservation.json',out),JSON.stringify({date:new Date().toISOString(),beforeBuildSha256:before.buildSha256,afterBuildSha256:after.buildSha256,executableScripts:71,changes,rawSourceSha256,minerFactoryUnchanged:true,allOtherExecutableScriptsExact:true,stylesAndMarkupExactExceptVersion:true,physicalControllerInputHudNetworkSaveSourcesExact:true,matchedNativeViews:12,posesCamerasAndSubmittedTrianglesExact:true,allReceiptMinersOnClearSupportedGround:true,pixelIdentityClaimed:false,visualDifference:'Shared Sprite geometry cleanup repair restores name tags after a miner departs; matching submitted counts alone did not reveal that baseline defect.',comparisons},null,2));
console.log('COMPLETE crew batching: twelve matched native cameras/poses retain all cached and shadow triangles.');
console.log(JSON.stringify(comparisons.map(s=>({name:s.name,savedCached:s.savedCachedCalls,savedRefresh:s.savedRefreshCalls,instanceBytes:s.instanceBytes}))));
