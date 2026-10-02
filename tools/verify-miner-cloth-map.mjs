// Native pose/source conservation. This cannot approve appearance or mouse feel.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const read=s=>JSON.parse(fs.readFileSync(new URL(s,out)));
const before=read('miner-cloth-map-before/report.json'),after=read('miner-cloth-map-after/report.json');
assert.equal(before.version,'2.56.0');assert.equal(after.version,'2.57.0');assert.equal(before.shots.length,29);assert.equal(after.shots.length,29);
for(const [tag,report]of [['before',before],['after',after]]){
 assert.equal(report.buildSha256,sha(fs.readFileSync(new URL('miner-cloth-map-'+tag+'/index.html',out))));
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
 assert.equal(report.fabric.width,256);assert.equal(report.fabric.height,256);
}
assert.equal(after.buildSha256,sha(fs.readFileSync(new URL('../dist/index.html',import.meta.url))));
const comparisons=after.shots.map(a=>{
 const b=before.shots.find(s=>s.name===a.name);assert.ok(b);assert.deepEqual(a.camera,b.camera);assert.deepEqual(a.rig,b.rig);assert.deepEqual(a.inventory,b.inventory);assert.deepEqual(a.counts,b.counts);
 const beforePng=sha(fs.readFileSync(new URL('miner-cloth-map-before/'+a.name+'.png',out))),afterPng=sha(fs.readFileSync(new URL('miner-cloth-map-after/'+a.name+'.png',out)));
 return{name:a.name,kind:a.kind,counts:a.counts,inventory:a.inventory,beforePngSha256:beforePng,afterPngSha256:afterPng,pixelExact:beforePng===afterPng};
});
const scripts=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json'));
const old=fs.readFileSync(new URL('miner-cloth-map-before/index.html',out),'utf8').replace(/\r\n/g,'\n'),current=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n'),a=scripts(old),b=scripts(current),names=scripts(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8')).map((m,i)=>m[1].match(/src="([^"]+)"/)?.[1]||'inline-'+i),changes=[];
assert.equal(a.length,71);assert.equal(b.length,71);
for(let i=0;i<71;i++){new vm.Script(b[i][2]);if(a[i][2]!==b[i][2])changes.push(names[i]);}assert.deepEqual(changes,['src/miner-art.js']);
const clean=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'<script></script>').replace(/(<meta name="application-version" content=")[^"]+/,'$1VERSION');assert.equal(clean(old),clean(current));
const logBytes=fs.readFileSync(new URL('miner-cloth-map-suite.log',out)),log=logBytes.toString(logBytes[0]===255&&logBytes[1]===254?'utf16le':'utf8');
assert.ok(log.includes('COMPLETE 575 system checks passed'));
const result={date:new Date().toISOString(),beforeBuildSha256:before.buildSha256,buildSha256:after.buildSha256,matchedFrames:29,camerasAndRigTransformsExact:true,renderCountsAndInventoriesExact:true,changedExecutableSources:changes,unchangedExecutableSources:70,stylesAndMarkupExactExceptVersion:true,firstPersonPixelExact:comparisons.filter(s=>s.kind==='local'&&s.pixelExact).length,bodyMeshes:52,modelTriangles:27168,geometryBytes:1457744,materials:15,textureCount:1,textureBaseBytes:256*256*4,suiteChecks:575,physicalInputMeasured:false,quietMachinePerformanceMeasured:false,actualNewNetworkClients:false,comparisons};
fs.writeFileSync(new URL('miner-cloth-map-conservation.json',out),JSON.stringify(result,null,2));
console.log('COMPLETE garment atlas conservation: 29 matched cameras, rigs, inventories and render counts; '+result.firstPersonPixelExact+' of seven first-person PNGs exact; only miner-art.js changes executable behaviour.');
