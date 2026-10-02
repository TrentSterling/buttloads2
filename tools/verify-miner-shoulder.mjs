// Bind the inspected shoulder evidence to the actual release. Art is judged separately.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),root=new URL('../',import.meta.url);
const sha=x=>createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(fs.readFileSync(new URL(p,out),'utf8').replace(/^\uFEFF/,''));
const before=read('miner-shoulder-sewn-before/report.json'),after=read('miner-shoulder-sewn-after/report.json'),source=read('miner-shoulder-source-conservation.json');
const buildSha256=sha(fs.readFileSync(new URL('dist/index.html',root)));
assert.equal(before.version,'2.58.0');assert.equal(after.version,'2.59.0');assert.equal(after.buildSha256,buildSha256);assert.equal(source.buildSha256,buildSha256);
assert.equal(source.unchangedBodyPieces,46);assert.equal(source.unchangedExecutableSources,69);
for(const [tag,r]of [['before',before],['after',after]]){
 assert.equal(r.shots.length,35);assert.equal(r.buildSha256,sha(fs.readFileSync(new URL(`miner-shoulder-sewn-${tag}/index.html`,out))));
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.input,{pointerLock:false,keys:0,fire:false});
}
const shifted=new Set(['aim-up','aim-extreme-up','raised-active-cutter','raised-active-scoop','raised-active-lance','raised-active-resonance']);
const comparisons=after.shots.map(a=>{
 const b=before.shots.find(s=>s.name===a.name);assert.ok(b);assert.deepEqual(a.camera,b.camera);assert.equal(a.counts.calls,b.counts.calls);
 if(shifted.has(a.name)){
  for(const k of ['root','hips','knees','bodyBatchGroups'])assert.deepEqual(a.rig[k],b.rig[k]);assert.notDeepEqual(a.rig.weapon,b.rig.weapon);
 }else assert.deepEqual(a.rig,b.rig);
 if(a.inventory){assert.deepEqual(b.inventory,{meshes:48,triangles:26224,materials:25,textures:1,geometryBytes:1431792});assert.deepEqual(a.inventory,{meshes:48,triangles:26512,materials:25,textures:1,geometryBytes:1438384});}else assert.deepEqual(a.counts,b.counts);
 return{name:a.name,kind:a.kind,carryPoseChanged:shifted.has(a.name),beforeCounts:b.counts,afterCounts:a.counts,beforePngSha256:sha(fs.readFileSync(new URL('miner-shoulder-sewn-before/'+a.name+'.png',out))),afterPngSha256:sha(fs.readFileSync(new URL('miner-shoulder-sewn-after/'+a.name+'.png',out)))};
});
const direct=new Set(read('miner-shoulder-direct-views.json').paths),provenance=read('miner-shoulder-baseline-provenance.json'),frames=[];
assert.equal(direct.size,57);
for(const side of ['before','after'])for(const shot of after.shots){
 const path=new URL(`miner-shoulder-sewn-${side}/${shot.name}.png`,out).pathname.replace(/^\//,''),hash=sha(fs.readFileSync(path)),viewed=direct.has(path);let inheritedFrom=null;
 if(!viewed){assert.equal(side,'before');const p=provenance.find(p=>p.name===shot.name);assert.ok(p.inherited);assert.equal(p.sha256,hash);assert.equal(sha(fs.readFileSync(p.inherited)),hash);inheritedFrom=p.inherited;}
 frames.push({side,name:shot.name,path,sha256:hash,directlyViewedThisPass:viewed,inheritedFrom});
}
assert.equal(frames.filter(f=>f.inheritedFrom).length,13);assert.equal(frames.filter(f=>f.side==='after'&&f.directlyViewedThisPass).length,35);
const gpu=read('miner-shoulder-gpu.json'),pixels=read('miner-shoulder-pixels.json'),gpuPixels=pixels.find(p=>p.name==='gpu');
assert.equal(gpu.buildSha256,buildSha256);assert.deepEqual(gpu.errors,[]);assert.deepEqual(gpu.input,{pointerLock:false,keys:0,fire:false});assert.equal(gpu.instanced.triangles,gpu.native.triangles);assert.ok(gpu.instanced.calls<gpu.native.calls);assert.equal(gpu.instanced.batchStats.instanceBytes,13056);
assert.equal(gpu.instanced.jointGroups.length,10);assert.equal(gpu.instanced.jointGroups.filter(g=>g.shoulderQuaternions).length,2);
assert.equal(gpuPixels.beforeSha256,sha(fs.readFileSync(new URL('miner-shoulder-four-native.png',out))));assert.equal(gpuPixels.afterSha256,sha(fs.readFileSync(new URL('miner-shoulder-four-instanced.png',out))));assert.ok(gpuPixels.differentPixels<gpuPixels.width*gpuPixels.height*.0001);
for(const p of pixels.filter(p=>p.name!=='gpu')){const c=comparisons.find(c=>c.name===p.name);assert.equal(p.beforeSha256,c.beforePngSha256);assert.equal(p.afterSha256,c.afterPngSha256);}
const profiles=['before','candidate','before-repeat'].map(tag=>read(`perf-worker-shoulder-${tag}/report.json`));
assert.equal(profiles[0].buildSha256,before.buildSha256);assert.equal(profiles[2].buildSha256,before.buildSha256);assert.equal(profiles[1].buildSha256,buildSha256);
for(const p of profiles){assert.equal(p.sampleMs,4000);assert.deepEqual(p.viewport,[1920,1080]);assert.deepEqual(p.errors,[]);assert.equal(p.scenes.length,2);assert.ok(p.scenes.every(s=>!s.pointerLocked));}
const logBytes=fs.readFileSync(new URL('miner-shoulder-suite.log',out)),log=logBytes.toString(logBytes[0]===255&&logBytes[1]===254?'utf16le':'utf8');assert.ok(log.includes('COMPLETE 588 system checks passed'));
const math=read('miner-shoulder-math.json');assert.ok(math.minimum>0);assert.equal(math.negativeSamples,0);assert.equal(math.cases,378);assert.equal(math.samples,506898);assert.ok(new Date(math.date)>new Date(after.date));
const criticism=[
 'Accept the attached shoulder construction and raised mechanical carry clearance. This is a specific correction, not a finished-character approval.',
 'Shoulders still have smooth molded surfaces and broad stretched folds. The coloured chest remains a separate visible garment panel.',
 'The unchanged face has a primitive moustache and protruding nostril pieces; extreme head pitch exposes the coarse chin and hair underside.',
 'The scoop can still obscure the face in the quarter-camera projection, despite positive geometric head-plane clearance in the sampled native firing poses.',
 'Fixed glove curl, clean leather, repeated anatomy and broad crouched strafe remain. Boot tops expose their flat closed surface in the side and knee stress views.',
 'All seven first-person sources and draw counts stay exact; six PNGs differ at 3 to 8 pixels by one level, while the resonator has 118 differing pixels with maximum channel difference 50. Pixel identity is not claimed.',
 'Concurrent pure-system tests ran during the three profile windows; external GPU load was unknown. No quiet-machine FPS, speedup or isolated shoulder shader cost is accepted.',
 'Physical Firefox turning/strafing and separate-network co-op remain unverified. The last actual public-lobby audit is dated 2.51.1; network executable sources remain exact.'
];
const inspection={date:new Date().toISOString(),buildSha256,beforeVersion:'2.58.0',afterVersion:'2.59.0',matchedPairs:35,coveredNativeFrames:70,directlyViewedThisPass:57,hashInheritedViews:13,decision:'Accept shoulder attachment and raised carry correction; broader hard art remains open',criticism,frames};
fs.writeFileSync(new URL('miner-shoulder-inspection.json',out),JSON.stringify(inspection,null,2));
const proof={date:new Date().toISOString(),version:'2.59.0',buildSha256,beforeBuildSha256:before.buildSha256,matchedFrames:35,camerasExact:true,unchangedRigPoses:29,changedRaisedCarryPoses:6,nativeDrawCountsExact:true,source,suiteChecks:588,bodyMeshes:48,bodyTriangles:26512,bodyGeometryBytes:1438384,bodyTriangleDelta:288,bodyGeometryByteDelta:6592,mainBodyMaterials:25,totalOwnedRigMaterials:45,bodyTextures:1,extraMeshes:0,extraMaterials:0,extraTextures:0,sharedMaterialPairs:1260,coveredNativeFrames:70,directlyViewedThisPass:57,hashInheritedViews:13,math:{date:math.date,minimumSampledJacobian:math.minimum,cases:math.cases,samples:math.samples,negativeSamples:0},gpu:{nativeCalls:gpu.native.calls,instancedCalls:gpu.instanced.calls,submittedTriangles:gpu.native.triangles,jointGroups:10,shoulderGroups:2,shoulderQuaternionBytes:128,totalQuaternionBytes:768,instanceBytes:13056,ownedJointBatchGeometryBytes:gpu.instanced.jointGroups.reduce((n,g)=>n+g.bytes,0)-768,pixelComparison:gpuPixels},profiles:profiles.map(p=>({date:p.date,label:p.label,buildSha256:p.buildSha256,scenes:p.scenes.map(s=>({name:s.name,cpuMean:s.cpu.mean,gpuMean:s.gpu.mean,frameP95:s.frame.p95,cachedCalls:s.calls.p50,refreshedCalls:s.calls.p95,cachedTriangles:s.triangles.p50,refreshedTriangles:s.triangles.p95}))})),profileConcurrentPureTests:true,externalGpuLoad:'unknown',physicalInputMeasured:false,quietMachinePerformanceMeasured:false,actualNewNetworkClients:false,comparisons};
fs.writeFileSync(new URL('miner-shoulder-conservation.json',out),JSON.stringify(proof,null,2));
console.log('COMPLETE shoulder evidence: 35 matched cameras and draws; 57 direct and 13 exact inherited views; independent GPU poses; 588 system checks; resource costs and profile limits retained.');
