// Compare actual native renders and the sole changed executable function.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),read=n=>JSON.parse(fs.readFileSync(new URL(n,out))),sha=v=>createHash('sha256').update(v).digest('hex');
const before=read('miner-travel-before/report.json'),after=read('miner-travel-after/report.json'),metrics=read('miner-travel-metrics.json');
assert.equal(before.version,'2.63.0');assert.equal(after.version,'2.64.0');assert.equal(before.shots.length,43);assert.equal(after.shots.length,43);
for(const [stage,r]of [['before',before],['after',after]]){
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.input,{pointerLock:false,keys:0,fire:false});
 assert.equal(r.preserveMovingPose,true);
 assert.equal(r.buildSha256,sha(fs.readFileSync(new URL('miner-travel-'+stage+'/index.html',out))));
}
const build=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),old=fs.readFileSync(new URL('miner-travel-before/index.html',out),'utf8');
assert.equal(after.buildSha256,sha(build));
const parse=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json'));
const a=parse(old),b=parse(build),names=parse(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8')).map((m,i)=>m[1].match(/src="([^"]+)"/)?.[1]||'inline-'+i),changes=[];
assert.equal(a.length,71);assert.equal(b.length,71);
for(let i=0;i<71;i++){new vm.Script(b[i][2]);if(a[i][2]!==b[i][2])changes.push(names[i]);}
assert.deepEqual(changes,['src/crew-view.js']);
const clean=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'<script></script>').replace(/(<meta name="application-version" content=")[^"]+/,'$1VERSION');assert.equal(clean(old),clean(build));
const oldCrew=fs.readFileSync(new URL('fixtures/crew-view-2.63.0.js',import.meta.url),'utf8'),newCrew=fs.readFileSync(new URL('../src/crew-view.js',import.meta.url),'utf8');
const strip=s=>{const start=s.indexOf(' B.View.prototype.poseMinerTravel=function'),end=s.indexOf(' B.View.prototype.minerFloor=function',start);assert.ok(start>=0&&end>start);return s.slice(0,start)+s.slice(end);};
assert.equal(strip(oldCrew),strip(newCrew));assert.equal(a[names.indexOf('src/crew-view.js')][2].trim(),oldCrew.trim());
assert.equal(metrics.sourceSha256,sha(newCrew));assert.equal(metrics.baselineSourceSha256,sha(oldCrew));assert.equal(metrics.frames,7200);assert.equal(metrics.rows.length,30);
for(const r of metrics.rows){assert.equal(r.collisionFrames,0);assert.ok(r.maxReachError<.005);assert.ok(r.maxGripError<.025);assert.ok(r.maxPlantedFootTravel<.001);}
const comparisons=after.shots.map(s=>{
 const previous=before.shots.find(p=>p.name===s.name);assert.ok(previous,s.name);
 for(const key of ['camera','root','authoritative','bodyMeshes','weaponMeshes','ownedMaterials'])assert.deepEqual(s[key],previous[key],s.name+' '+key);
 assert.ok(s.authoritative.clear&&s.authoritative.supported&&s.authoritative.grounded,s.name);assert.equal(s.bodyMeshes,42);assert.ok(s.gripDistance<.025,s.name+' grip');
 for(let i=0;i<2;i++){assert.ok(Math.hypot(...s.feet[i].map((n,j)=>n-s.gait.feet[i].position[j]))<.005,s.name+' reach');assert.ok(s.soleUp[i][1]>.999,s.name+' sole');}
 if(s.frame===180)assert.ok(s.gait.feet.every(f=>!f.swing&&!f.settling),s.name+' stop');
 return{name:s.name,beforeCached:previous.cached,afterCached:s.cached,beforeRefresh:previous.refresh,afterRefresh:s.refresh,gripDistance:s.gripDistance};
});
const raw=fs.readFileSync(new URL('miner-travel-suite.log',out)),log=raw.toString(raw[0]===255&&raw[1]===254?'utf16le':'utf8');assert.ok(log.includes('COMPLETE 606 system checks passed'));assert.ok(!/^FAIL /m.test(log));
const result={date:new Date().toISOString(),version:after.version,buildSha256:after.buildSha256,beforeBuildSha256:before.buildSha256,suiteChecks:606,compiledScripts:71,unchangedExecutableScripts:70,changedExecutableSources:changes,onlyChangedFunction:'poseMinerTravel',allOtherCrewFunctionsExact:true,stylesAndMarkupExactExceptVersion:true,geometryMaterialsTexturesInputAndNetworkingSourcesExact:true,matchedPairs:43,camerasRootAndAuthoritativeCapsulesExact:true,allPathsClearAndSupported:true,allNativeSolesReachWithin5mm:true,allNativeSolesLevel:true,allNativeGripsWithin25mm:true,finalNativeStopsSettled:true,addedMeshes:0,addedModelTriangles:0,addedMaterials:0,addedTextures:0,drawCountsExact:comparisons.every(s=>s.beforeCached.calls===s.afterCached.calls&&s.beforeRefresh.calls===s.afterRefresh.calls),submittedTrianglesExact:comparisons.every(s=>s.beforeCached.triangles===s.afterCached.triangles&&s.beforeRefresh.triangles===s.afterRefresh.triangles),metricsSourceSha256:metrics.sourceSha256,steadyRigFrames:7200,animationMathAndScalarStateAdded:true,newTimingProfile:false,physicalFirefoxFeel:'unverified',quietMachineFps:'unverified',separateNetworkCoop:'unverified',comparisons};
fs.writeFileSync(new URL('miner-travel-conservation.json',out),JSON.stringify(result,null,2));
console.log('COMPLETE 43 native travel pairs: exact cameras/capsules; reachable level soles, grips and settled stops; only poseMinerTravel changes executable behavior.');
console.log(JSON.stringify({drawCountsExact:result.drawCountsExact,submittedTrianglesExact:result.submittedTrianglesExact}));
