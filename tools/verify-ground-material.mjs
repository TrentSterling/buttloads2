// Production scene conservation and portable source audit; no browser or input.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {nodeGame} from './node-game.mjs';
const hash=data=>createHash('sha256').update(data).digest('hex');
const oldHtml=fs.readFileSync('tools/out/ground-material-before/build.html','utf8'),html=fs.readFileSync('dist/index.html','utf8');
const scripts=s=>[...s.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json')).map(m=>m[2]);
const oldScripts=scripts(oldHtml),newScripts=scripts(html),changed=[];
assert.equal(oldScripts.length,71);assert.equal(newScripts.length,71);
for(let i=0;i<71;i++)if(oldScripts[i]!==newScripts[i])changed.push(i);
assert.equal(changed.length,2);
assert.ok(newScripts[changed[0]].includes('B.GROUND_DETAIL='));
assert.ok(newScripts[changed[1]].includes('for(const m of [sand,path])'));
const normalize=s=>s.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'<script></script>').replaceAll('2.51.1','VERSION').replaceAll('2.52.0','VERSION').replaceAll('\r\n','\n');
assert.equal(normalize(html),normalize(oldHtml));
const byteHash=a=>hash(Buffer.from(a.buffer,a.byteOffset,a.byteLength));
function snapshot(g){
 g.view.scene.updateMatrixWorld(true);const meshes=[];
 g.view.scene.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry;meshes.push({attributes:Object.fromEntries(Object.entries(geo.attributes).sort(([a],[b])=>a.localeCompare(b)).map(([k,a])=>[k,{count:a.count,itemSize:a.itemSize,bytes:a.array.byteLength,hash:byteHash(a.array)}])),index:geo.index?byteHash(geo.index.array):null,range:geo.drawRange,matrix:o.matrixWorld.elements.slice(),visible:o.visible,castShadow:o.castShadow,receiveShadow:o.receiveShadow});});
 return{meshes,field:byteHash(g.world.field),trees:g.view.commonTrees,obstacles:g.view.obstacles,economy:structuredClone(g.economy.state),ore:g.deposits.nodes.map(o=>[o.id,o.x,o.y,o.z,o.collected])};
}
const before=await nodeGame({sources:{beauty:oldScripts.find(s=>s.includes('B.TERRAIN_LOOK={')), 'common-view':oldScripts.find(s=>s.includes('B.View.prototype.makeCommon=function(){'))}});
const previous=snapshot(before.game);before.close();
const after=await nodeGame();
try{
 assert.deepEqual(snapshot(after.game),previous);
 const start=performance.now(),texture=B2.GROUND_DETAIL.texture(),creationMs=performance.now()-start;
 assert.equal(texture,B2.GROUND_DETAIL.texture());
 assert.equal(texture.image.data.byteLength,1048576);assert.equal(texture.wrapS,THREE.RepeatWrapping);assert.equal(texture.wrapT,THREE.RepeatWrapping);assert.equal(texture.generateMipmaps,true);
 const textureHash=byteHash(texture.image.data),materials=new Set();after.game.view.scene.traverse(o=>{if(o.isMesh)materials.add(o.material);});
 let sharedFinishes=0;for(const material of materials)if(material.customProgramCacheKey()==='b2-strata-ground-2'){
  const shader={vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader,uniforms:{}};material.onBeforeCompile(shader);assert.equal(shader.uniforms.b2GroundDetail.value,texture);sharedFinishes++;
 }
 assert.ok(sharedFinishes>=10);assert.equal(byteHash(texture.image.data),textureHash);
 const report={date:new Date().toISOString(),version:'2.52.0',buildSha256:hash(fs.readFileSync('dist/index.html')),changedExecutableScripts:['beauty.js','common-view.js'],unchangedExecutableScripts:69,sceneMeshes:previous.meshes.length,allGeometryAndTransformsExact:true,fieldTreesContactsOreEconomyExact:true,detailTextures:1,baseTextureBytes:1048576,completeMipBytes:1398100,sharedFinishes,textureHash,textureCreationMs:creationMs,scope:'Pure production scene and exact portable source audit. Creation timing is an isolated CPU observation, not frame time or FPS.'};
 fs.writeFileSync('tools/out/ground-material-conservation.json',JSON.stringify(report,null,2));
 console.log('COMPLETE ground material conservation: '+previous.meshes.length+' exact mesh buffers/transforms; mine, contacts and economy exact; 69 unchanged scripts; '+sharedFinishes+' finishes share one 1 MiB detail texture.');
}finally{after.close();}
