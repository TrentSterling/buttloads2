// Frozen production construction comparison; inert renderer, no browser input.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),root=new URL('../',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex');
const oldHtml=fs.readFileSync(new URL('rock-surface-before/build.html',out),'utf8'),html=fs.readFileSync(new URL('dist/index.html',root),'utf8');
const scripts=s=>[...s.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json')).map(m=>m[2]);
const names=[...fs.readFileSync(new URL('index.html',root),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]),oldScripts=scripts(oldHtml),newScripts=scripts(html);
assert.equal(names.length,71);assert.equal(oldScripts.length,71);assert.equal(newScripts.length,71);
const changed=names.filter((n,i)=>oldScripts[i]!==newScripts[i]);assert.deepEqual(changed,['src/common-view.js']);
const shell=s=>s.replace(/<script([^>]*)>[\s\S]*?<\/script>/g,'<script$1></script>').replace(/content="2\.5[45]\.0"/g,'content="VERSION"');
assert.equal(shell(html),shell(oldHtml),'Non-script shell changed');
const material=m=>({type:m.type,color:m.color?.toArray(),emissive:m.emissive?.toArray(),roughness:m.roughness,metalness:m.metalness,side:m.side,vertexColors:m.vertexColors,alphaTest:m.alphaTest,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,map:!!m.map,bumpMap:!!m.bumpMap,bumpScale:m.bumpScale,program:m.customProgramCacheKey?.()});
const geometry=g=>({index:g.index&&sha(g.index.array),attributes:Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,{itemSize:a.itemSize,normalized:a.normalized,count:a.count,hash:sha(a.array)}])),groups:g.groups,drawRange:g.drawRange});
const mesh=o=>({type:o.type,mesh:!!o.isMesh,geometry:geometry(o.geometry),matrix:o.matrixWorld.toArray(),visible:o.visible,cast:o.castShadow,receive:o.receiveShadow,material:(Array.isArray(o.material)?o.material:[o.material]).map(material)});
function measured(source){
 source=source.replace('  const bedBox=bottom=>{','  globalThis.__rockStart=g.children.length;\n  const bedBox=bottom=>{');
 source=source.replace('  // Grass follows compositional patches','  globalThis.__rockMeshes=new Set(g.children.slice(__rockStart));\n  // Grass follows compositional patches');
 source=source.replace('  const emitBed=(faces,cx,cy,cz,sx,sy,sz,buckets)=>{','  const emitBed=(faces,cx,cy,cz,sx,sy,sz,buckets)=>{\n   const starts=buckets.map(b=>b.pos.length);');
 source=source.replace('  };\n  for(const [variant,[x,z,w,h,d]]',`   globalThis.__rockMasses.push({cx,cy,cz,sx,sy,sz,pos:buckets.flatMap((b,i)=>b.pos.slice(starts[i]))});\n  };\n  for(const [variant,[x,z,w,h,d]]`);
 return source+`\n{const original=B2.View.prototype.merge;B2.View.prototype.merge=function(group,...args){if(group===this.commonScene){this.scene.updateMatrixWorld(true);globalThis.__nonRockCommon=group.children.filter(o=>o.geometry&&!__rockMeshes.has(o)).map(o=>globalThis.__rockSnapshot(o));globalThis.__rawRocks=[...__rockMeshes].map(o=>({pos:[...o.geometry.attributes.position.array],normals:[...o.geometry.attributes.normal.array]}));}return original.call(this,group,...args);};const index=B2.CANOPY_ART.index;B2.CANOPY_ART.index=function(g){const c=index(g);let words=0;for(const [name,a]of Object.entries(g.attributes)){const b=c.attributes[name],x=new Uint32Array(a.array.buffer,a.array.byteOffset,a.array.length),y=new Uint32Array(b.array.buffer,b.array.byteOffset,b.array.length);for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++){if(x[i*a.itemSize+j]!==y[c.index.getX(i)*a.itemSize+j])throw Error('Indexed static attribute changed '+name);words++;}}globalThis.__rockIndexProof.push({inputVertices:g.attributes.position.count,outputVertices:c.attributes.position.count,triangles:c.index.count/3,checkedAttributeWords:words,indexBytes:c.index.array.byteLength});return c;};}`;
}
globalThis.__rockSnapshot=mesh;
async function capture(source){
 globalThis.__rockMasses=[];globalThis.__nonRockCommon=null;globalThis.__rawRocks=null;globalThis.__rockIndexProof=[];
 const h=await nodeGame({commonViewSource:measured(source)});
 try{
  const g=h.game,v=g.view;v.scene.updateMatrixWorld(true);const outside=[];
  for(const child of v.scene.children)if(child!==v.commonScene)child.traverse(o=>{if(o.geometry)outside.push(mesh(o));});
  const common=v.commonScene.children.filter(o=>o.geometry&&!v.commonRockMaterials.includes(o.material)).map(mesh);
  assert.ok(__nonRockCommon.length>1000);assert.ok(__rockMasses.length===55);
  return {unchanged:{outside,common,unmergedCommon:__nonRockCommon,field:sha(g.world.field),trees:v.commonTrees,rocks:v.commonRocks,gardens:v.commonGardens,roots:v.rootContacts,obstacles:v.obstacles,meadow:v.commonMeadow},masses:__rockMasses,rawRocks:__rawRocks,indexProof:__rockIndexProof};
 }finally{clearInterval(h.game.net.timer);h.close();}
}
const before=await capture(fs.readFileSync(new URL('rock-surface-before/common-view.js',out),'utf8'));
const after=await capture(fs.readFileSync(new URL('src/common-view.js',root),'utf8'));
assert.deepEqual(after.unchanged,before.unchanged,'Construction outside the five rock masses and their chips changed');
function inspect(a){
 let triangles=0,zeroAreas=0,normalMin=Infinity,normalMax=0;const closure=[];
 for(const data of a.rawRocks){for(let i=0;i<data.pos.length;i+=9){triangles++;const p=data.pos.slice(i,i+9),u=p.slice(3,6).map((v,j)=>v-p[j]),v=p.slice(6,9).map((v,j)=>v-p[j]),area=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);if(area<1e-9)zeroAreas++;}for(let i=0;i<data.normals.length;i+=3){const length=Math.hypot(...data.normals.slice(i,i+3));normalMin=Math.min(normalMin,length);normalMax=Math.max(normalMax,length);}}
 for(const mass of a.masses.filter(m=>m.sy>.5)){
  const edges=new Map(),key=p=>p.map(v=>Math.round(v*1e5)).join(',');
  for(let i=0;i<mass.pos.length;i+=9){const p=[0,3,6].map(j=>key(mass.pos.slice(i+j,i+j+3)));for(let j=0;j<3;j++){if(p[j]===p[(j+1)%3])continue;const id=[p[j],p[(j+1)%3]].sort().join('/');edges.set(id,(edges.get(id)||0)+1);}}
  closure.push({cx:mass.cx,cz:mass.cz,triangles:mass.pos.length/9,unpairedEdges:[...edges.values()].filter(n=>n!==2).length});
 }
 return {triangles,zeroAreas,normalMin,normalMax,closure};
}
const beforeGeometry=inspect(before),afterGeometry=inspect(after);
assert.equal(afterGeometry.zeroAreas,0);assert.ok(afterGeometry.normalMin>.99999&&afterGeometry.normalMax<1.00001);assert.equal(afterGeometry.closure.length,15);assert.ok(afterGeometry.closure.every(m=>m.unpairedEdges===0));assert.equal(before.indexProof.length,1);assert.equal(after.indexProof.length,4);
let matchedViews=0;const nativeBefore=JSON.parse(fs.readFileSync(new URL('rock-surface-before/report.json',out))),nativeAfter=JSON.parse(fs.readFileSync(new URL('rock-surface-after/report.json',out)));
for(const suffix of ['', '-extra']){const a=JSON.parse(fs.readFileSync(new URL('rock-surface-after'+suffix+'/report.json',out))),b=JSON.parse(fs.readFileSync(new URL('rock-surface-before'+suffix+'/report.json',out)));assert.equal(a.buildSha256,sha(html));assert.equal(b.buildSha256,sha(oldHtml));for(const view of a.shots){const old=b.shots.find(s=>s.name===view.name);for(const key of ['calls','player','camera','rotation','input'])assert.deepEqual(view[key],old[key],view.name+' '+key);matchedViews++;}}assert.equal(matchedViews,11);
for(const key of ['width','height','baseBytes','alphaTest','opaquePixels','pixelHash','encoding','anisotropy','generateMipmaps'])assert.equal(nativeAfter.atlas[key],nativeBefore.atlas[key]);
const report={date:new Date().toISOString(),version:JSON.parse(fs.readFileSync(new URL('package.json',root))).version,buildSha256:sha(html),baselineSha256:sha(oldHtml),changedExecutableScripts:changed,unchangedExecutableScripts:70,matchedRefreshedShadowDrawViews:matchedViews,outsideCommonMeshes:after.unchanged.outside.filter(o=>o.mesh).length,outsideCommonGeometryObjects:after.unchanged.outside.length,unmergedNonRockCommonObjects:after.unchanged.unmergedCommon.length,mergedNonRockCommonMeshes:after.unchanged.common.length,outsideRockGeometryTransformsMaterialsExact:true,worldPlacementsContactsExact:true,actualRockIndexConservation:after.indexProof.slice(0,3),closureMethod:'Undirected actual emitted triangle edges paired after coordinate quantization to 0.00001 metres; no Boolean surface-union certification.',beforeGeometry,afterGeometry,beforeInventory:nativeBefore.inventory,afterInventory:nativeAfter.inventory};
fs.writeFileSync(new URL('rock-surface-conservation.json',out),JSON.stringify(report,null,2));
console.log('COMPLETE rock conservation '+JSON.stringify({meshes:report.outsideCommonMeshes,commonObjects:report.unmergedNonRockCommonObjects,before:{triangles:beforeGeometry.triangles,zeroAreas:beforeGeometry.zeroAreas},after:{triangles:afterGeometry.triangles,zeroAreas:afterGeometry.zeroAreas,normalMin:afterGeometry.normalMin,normalMax:afterGeometry.normalMax,unpairedMassEdges:afterGeometry.closure.map(m=>m.unpairedEdges)}}));
