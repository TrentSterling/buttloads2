// Bind native evidence to the shipped executable sources. Appearance remains a human judgement.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),root=new URL('../',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(new URL(p,out),'utf8').replace(/^\uFEFF/,''));
const before=read('miner-joint-before/report.json'),after=read('miner-joint-after/report.json');
assert.equal(before.version,'2.57.0');assert.equal(after.version,'2.58.0');
for(const [tag,r]of [['before',before],['after',after]]){
 assert.equal(r.shots.length,29);assert.equal(r.buildSha256,sha(fs.readFileSync(new URL(`miner-joint-${tag}/index.html`,out))));
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.input,{pointerLock:false,keys:0,fire:false});
}
const build=fs.readFileSync(new URL('dist/index.html',root),'utf8'),buildSha256=sha(Buffer.from(build));assert.equal(after.buildSha256,buildSha256);
for(const name of ['miner-art.js','crew-view.js'])assert.equal(fs.readFileSync(new URL('src/'+name,root),'utf8').replace(/\r\n/g,'\n'),fs.readFileSync(new URL('miner-joint-after/'+name,out),'utf8').replace(/\r\n/g,'\n'));
const inventoryBefore={meshes:52,triangles:27168,materials:15,textures:1,geometryBytes:1457744},inventoryAfter={meshes:48,triangles:26224,materials:25,textures:1,geometryBytes:1431792};
const comparisons=after.shots.map(a=>{
 const b=before.shots.find(s=>s.name===a.name);assert.ok(b);assert.deepEqual(a.camera,b.camera);assert.deepEqual(a.rig,b.rig);
 if(a.inventory){assert.deepEqual(b.inventory,inventoryBefore);assert.deepEqual(a.inventory,inventoryAfter);}else assert.deepEqual(a.counts,b.counts);
 return{name:a.name,kind:a.kind,beforeCounts:b.counts,afterCounts:a.counts,beforePngSha256:sha(fs.readFileSync(new URL('miner-joint-before/'+a.name+'.png',out))),afterPngSha256:sha(fs.readFileSync(new URL('miner-joint-after/'+a.name+'.png',out)))};
});
assert.deepEqual(before.fabric,after.fabric);assert.equal(sha(fs.readFileSync(new URL('miner-joint-before/fabric-atlas.png',out))),sha(fs.readFileSync(new URL('miner-joint-after/fabric-atlas.png',out))));
const scriptMatches=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json'));
const old=fs.readFileSync(new URL('miner-joint-before/index.html',out),'utf8').replace(/\r\n/g,'\n'),current=build.replace(/\r\n/g,'\n'),a=scriptMatches(old),b=scriptMatches(current),names=scriptMatches(fs.readFileSync(new URL('index.html',root),'utf8')).map((m,i)=>m[1].match(/src="([^"]+)"/)?.[1]||'inline-'+i),changes=[];
assert.equal(a.length,71);assert.equal(b.length,71);
for(let i=0;i<71;i++){new vm.Script(b[i][2]);if(a[i][2]!==b[i][2])changes.push(names[i]);}
assert.deepEqual(changes,['src/miner-art.js','src/crew-view.js']);
const clean=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'<script></script>').replace(/(<meta name="application-version" content=")[^"]+/,'$1VERSION');assert.equal(clean(old),clean(current));
const prior=read('miner-cloth-map-inspection.json'),direct=read('miner-joint-direct-views.json').views;
assert.equal(direct.length,38);assert.equal(new Set(direct.map(v=>v.side+'/'+v.name)).size,38);
assert.equal(direct.filter(v=>v.side==='after').length,29);
const frames=[],reused=[];
for(const side of ['before','after'])for(const shot of after.shots){
 const path=new URL(`miner-joint-${side}/${shot.name}.png`,out).pathname.replace(/^\//,''),hash=sha(fs.readFileSync(path)),viewed=direct.some(v=>v.side===side&&v.name===shot.name);
 let inheritedFrom=null;if(!viewed){assert.equal(side,'before');const f=prior.frames.find(f=>f.path.endsWith('/miner-cloth-map-after/'+shot.name+'.png'));assert.ok(f);assert.equal(f.sha256,hash);assert.equal(sha(fs.readFileSync(f.path)),hash);inheritedFrom=f.path;reused.push(shot.name);}
 frames.push({side,name:shot.name,path,sha256:hash,directlyViewedThisPass:viewed,inheritedFrom});
}
assert.equal(reused.length,20);
const criticism=[
 'Continuous knees and elbows remove the rigid cut-edge overlap in these views. Knee pads and retention bands now bend together with the trouser.',
 'Shoulder caps still look molded; stretched broad fabric folds need better placed crease detail.',
 'Repeated anatomy, primitive moustache, clean leather and fixed claw-like empty glove curl remain visible.',
 'Native strafe retains the wide crouched pose. This release changes garment deformation, not controller travel or physical mouse feel.',
 'Five first-person PNGs match exactly; the scoop has 13 pixels differing by one level. The resonator differs visibly in its lit coil region, so exact first-person pixel conservation is not claimed.',
 'Quiet-machine FPS and physical Firefox turning/strafing remain unverified. The last actual public-lobby audit is dated 2.51.1; separate-network and relay acceptance remain open.'
];
const inspection={date:new Date().toISOString(),beforeVersion:before.version,afterVersion:after.version,buildSha256,matchedPairs:29,coveredNativeFrames:58,directlyViewedThisPass:38,hashInheritedViews:20,method:'29 candidate and nine baseline full PNGs individually viewed; twenty baseline PNGs exactly match previously individually inspected 2.57.0 frames',decision:'Accept continuous joint construction and aligned knee equipment; broader character art remains open',criticism,frames};
fs.writeFileSync(new URL('miner-joint-inspection.json',out),JSON.stringify(inspection,null,2));
const gpu=read('miner-joint-gpu.json');assert.equal(gpu.buildSha256,buildSha256);assert.equal(gpu.instanced.triangles,gpu.native.triangles);assert.ok(gpu.instanced.calls<gpu.native.calls);assert.equal(gpu.instanced.jointGroups.length,10);assert.equal(gpu.instanced.batchStats.instanceBytes,12928);assert.deepEqual(gpu.errors,[]);assert.deepEqual(gpu.input,{pointerLock:false,keys:0,fire:false});
const pixels=read('miner-joint-pixels.json'),gpuPixels=pixels.find(p=>p.name==='gpu');
assert.equal(gpuPixels.beforeSha256,sha(fs.readFileSync(new URL('miner-joint-four-native.png',out))));assert.equal(gpuPixels.afterSha256,sha(fs.readFileSync(new URL('miner-joint-four-instanced.png',out))));assert.ok(gpuPixels.differentPixels<gpuPixels.width*gpuPixels.height*.0001);
for(const p of pixels.filter(p=>p.name!=='gpu')){const pair=comparisons.find(c=>c.name===p.name);assert.equal(pair.beforePngSha256,p.beforeSha256);assert.equal(pair.afterPngSha256,p.afterSha256);}
const profiles=['before','candidate','before-repeat'].map(tag=>read(`perf-worker-bend-${tag}/report.json`));
assert.equal(profiles[0].buildSha256,before.buildSha256);assert.equal(profiles[2].buildSha256,before.buildSha256);
assert.equal(profiles[1].buildSha256,sha(Buffer.from(build.replace('<meta name="application-version" content="2.58.0"','<meta name="application-version" content="2.57.0"'))));
for(const p of profiles){assert.deepEqual(p.errors,[]);assert.deepEqual(p.viewport,[1920,1080]);assert.equal(p.sampleMs,4000);}
const logBytes=fs.readFileSync(new URL('worker-bend-suite.log',out)),log=logBytes.toString(logBytes[0]===255&&logBytes[1]===254?'utf16le':'utf8');assert.ok(log.includes('COMPLETE 581 system checks passed'));
const proof={date:new Date().toISOString(),version:'2.58.0',buildSha256,beforeBuildSha256:before.buildSha256,matchedFrames:29,camerasAndRigTransformsExact:true,countsExactForLocalTools:true,changedExecutableSources:changes,unchangedExecutableSources:69,compiledScripts:71,stylesAndMarkupExactExceptVersion:true,inventoryBefore,inventoryAfter,bodyMeshDelta:-4,bodyTriangleDelta:-944,bodyGeometryByteDelta:-25952,mainMaterialDelta:10,additionalShadowMaterials:20,totalOwnedRigMaterials:45,textureCount:1,textureBaseBytes:262144,unchangedBodyPieces:38,sharedMaterialPairs:1260,suiteChecks:581,coveredNativeFrames:58,directlyViewedThisPass:38,hashInheritedViews:20,firstPersonPixelExact:pixels.filter(p=>p.name.startsWith('local-')&&p.differentPixels===0).length,gpu:{instancedCalls:gpu.instanced.calls,nativeCalls:gpu.native.calls,submittedTriangles:gpu.native.triangles,jointGroups:10,instanceBytes:12928,quaternionBytes:640,ownedJointBatchGeometryBytes:gpu.instanced.jointGroups.reduce((n,g)=>n+g.bytes,0)-640,pixelComparison:gpuPixels},profiles:profiles.map(p=>({date:p.date,label:p.label,buildSha256:p.buildSha256,scenes:p.scenes.map(s=>({name:s.name,cpuMean:s.cpu.mean,gpuMean:s.gpu.mean,frameP95:s.frame.p95,cachedCalls:s.calls.p50,refreshedCalls:s.calls.p95,cachedTriangles:s.triangles.p50,refreshedTriangles:s.triangles.p95}))})),physicalInputMeasured:false,quietMachinePerformanceMeasured:false,actualNewNetworkClients:false,comparisons};
fs.writeFileSync(new URL('miner-joint-conservation.json',out),JSON.stringify(proof,null,2));
console.log('COMPLETE continuous joints: 29 matched rigs/cameras; 38 directly viewed plus 20 exact inherited frames; 69 unchanged scripts; independent GPU instance poses and equal submitted triangles; resource costs and noisy profiles retained.');
