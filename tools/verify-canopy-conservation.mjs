// Frozen production construction comparison; inert renderer, no browser input.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),root=new URL('../',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex');
const oldHtml=fs.readFileSync(new URL('canopy-before/build.html',out),'utf8'),html=fs.readFileSync(new URL('dist/index.html',root),'utf8');
const scripts=s=>[...s.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json')).map(m=>m[2]);
const names=[...fs.readFileSync(new URL('index.html',root),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]),oldScripts=scripts(oldHtml),newScripts=scripts(html);
assert.equal(names.length,71);assert.equal(oldScripts.length,71);assert.equal(newScripts.length,71);
const changed=names.filter((n,i)=>oldScripts[i]!==newScripts[i]);assert.deepEqual(changed,['src/common-view.js']);
const shell=s=>s.replace(/<script([^>]*)>[\s\S]*?<\/script>/g,'<script$1></script>').replace(/content="2\.5[23]\.0"/g,'content="VERSION"');
assert.equal(shell(html),shell(oldHtml),'Non-script shell changed');
const material=m=>({type:m.type,color:m.color?.toArray(),emissive:m.emissive?.toArray(),roughness:m.roughness,metalness:m.metalness,side:m.side,vertexColors:m.vertexColors,alphaTest:m.alphaTest,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,map:!!m.map,bumpMap:!!m.bumpMap,bumpScale:m.bumpScale,program:m.customProgramCacheKey?.()});
const geometry=g=>({index:g.index&&sha(g.index.array),attributes:Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,{itemSize:a.itemSize,normalized:a.normalized,count:a.count,hash:sha(a.array)}])),groups:g.groups,drawRange:g.drawRange});
function snapshot(g){
 const v=g.view;v.scene.updateMatrixWorld(true);const outside=[],groups=new Map(),excluded=new Set(['#66513f','#887050'].map(c=>new THREE.Color(c).convertSRGBToLinear().getHexString()));
 for(const child of v.scene.children)if(child!==v.commonScene)child.traverse(o=>{if(o.geometry)outside.push({type:o.type,mesh:!!o.isMesh,geometry:geometry(o.geometry),matrix:o.matrixWorld.toArray(),visible:o.visible,cast:o.castShadow,receive:o.receiveShadow,material:(Array.isArray(o.material)?o.material:[o.material]).map(material)});});
 v.commonScene.traverse(o=>{if(!o.isMesh||o.material.side===THREE.DoubleSide&&o.material.vertexColors||excluded.has(o.material.color?.getHexString()))return;
  const geo=o.geometry,attrs=Object.entries(geo.attributes).sort(([a],[b])=>a.localeCompare(b)),key=JSON.stringify(material(o.material));if(!groups.has(key))groups.set(key,[]);const records=groups.get(key),bits=attrs.map(([,a])=>new Uint32Array(a.array.buffer,a.array.byteOffset,a.array.length)),row=new Uint32Array(attrs.reduce((n,[,a])=>n+3*a.itemSize,0));
  for(let i=0,n=geo.index?.count||geo.attributes.position.count;i<n;i+=3){let at=0;for(let j=0;j<3;j++){const id=geo.index?geo.index.getX(i+j):i+j;for(let k=0;k<attrs.length;k++){const a=attrs[k][1];row.set(bits[k].subarray(id*a.itemSize,(id+1)*a.itemSize),at);at+=a.itemSize;}}records.push(sha(row));}
 });
 return{outside,common:[...groups].map(([key,rows])=>({key,triangles:rows.length,hash:sha(rows.sort().join(''))})).sort((a,b)=>a.key.localeCompare(b.key)),field:sha(g.world.field),trees:v.commonTrees,roots:v.rootContacts,obstacles:v.obstacles,meadow:v.commonMeadow,economy:g.economy?.snapshot?.()||null};
}
const baseline=await nodeGame({commonViewSource:fs.readFileSync(new URL('canopy-before/common-view.js',out),'utf8')});let before;
try{before=snapshot(baseline.game);}finally{clearInterval(baseline.game.net.timer);baseline.close();}
globalThis.__canopyExact=null;
const source=fs.readFileSync(new URL('src/common-view.js',root),'utf8')+`\n{const native=B2.CANOPY_ART.index;B2.CANOPY_ART.index=function(g){const c=native(g);let values=0;for(const [name,a]of Object.entries(g.attributes)){const b=c.attributes[name],x=new Uint32Array(a.array.buffer,a.array.byteOffset,a.array.length),y=new Uint32Array(b.array.buffer,b.array.byteOffset,b.array.length);for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++){if(x[i*a.itemSize+j]!==y[c.index.getX(i)*a.itemSize+j])throw Error('Actual canopy record changed '+name);values++;}}globalThis.__canopyExact={inputVertices:g.attributes.position.count,outputVertices:c.attributes.position.count,checkedAttributeWords:values,triangles:c.index.count/3,indexType:c.index.array.constructor.name};return c;};}`;
const current=await nodeGame({commonViewSource:source});let after;
try{after=snapshot(current.game);}finally{clearInterval(current.game.net.timer);current.close();}
assert.deepEqual(after,before,'Construction outside the rebuilt tree foliage/wood changed');assert.ok(__canopyExact.checkedAttributeWords>7000000);
const nativeBefore=JSON.parse(fs.readFileSync(new URL('canopy-before/report.json',out))),nativeAfter=JSON.parse(fs.readFileSync(new URL('canopy-after/report.json',out)));
assert.equal(nativeAfter.buildSha256,sha(html));assert.equal(nativeBefore.buildSha256,sha(oldHtml));
const report={date:new Date().toISOString(),version:'2.53.0',buildSha256:sha(html),baselineSha256:sha(oldHtml),changedExecutableScripts:changed,unchangedExecutableScripts:70,shellExact:true,outsideCommonMeshes:after.outside.filter(o=>o.mesh).length,outsideCommonGeometryObjects:after.outside.length,outsideCommonGeometryTransformsMaterialsExact:true,unchangedCommonMaterialGroups:after.common,treesRootsObstaclesMeadowFieldExact:true,actualIndexConservation:__canopyExact,beforeInventory:nativeBefore.inventory,afterInventory:nativeAfter.inventory,scope:'Every complete attribute word of the actual merged canopy expands exactly after indexing. All outside-common geometry/transforms/materials and non-foliage/non-tree-wood common triangles match. Native atlas pixels are verified separately; inert canvases do not certify texture appearance. No FPS or input-feel inference.'};
fs.writeFileSync(new URL('canopy-conservation.json',out),JSON.stringify(report,null,2));
console.log('COMPLETE canopy conservation: '+report.outsideCommonMeshes+' meshes and '+(after.outside.length-report.outsideCommonMeshes)+' other outside-common geometry objects exact; 70 scripts unchanged; '+__canopyExact.checkedAttributeWords+' actual indexed attribute words exact.');
