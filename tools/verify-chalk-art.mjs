// Compare native scenes and the portable source scope without a browser.
import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';import {createHash} from 'node:crypto';import {nodeGame} from './node-game.mjs';
const out=new URL('out/',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex'),bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength),files=['cave-form-art','underground-view'];
function capture(g){
 const v=g.view;v.renderCaverns(g);v.renderDeep(g,10);v.renderExpedition(g,0,10);v.scene.updateWorldMatrix(true,true);const meshes=[],lights=[];let chalkMeshes=0,chalkTriangles=0;
 v.scene.traverse(m=>{
  if(m.isLight)lights.push([m.type,m.position.toArray(),m.color.getHexString(),m.intensity,m.distance,m.decay,m.castShadow]);
  if(!m.isMesh)return;for(let n=m;n;n=n.parent)if(n.userData.formation==='chalk-drapery'){chalkMeshes++;chalkTriangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;return;}
  const geo=m.geometry,mat=m.material;assert.ok(!Array.isArray(mat));
  meshes.push(JSON.stringify({attributes:Object.keys(geo.attributes).sort().map(k=>[k,geo.attributes[k].itemSize,sha(bytes(geo.attributes[k].array))]),index:geo.index?sha(bytes(geo.index.array)):null,box:geo.boundingBox?[geo.boundingBox.min.toArray(),geo.boundingBox.max.toArray()]:null,sphere:geo.boundingSphere?[geo.boundingSphere.center.toArray(),geo.boundingSphere.radius]:null,range:geo.drawRange,matrix:m.matrixWorld.toArray(),visible:m.visible,cast:m.castShadow,receive:m.receiveShadow,layers:m.layers.mask,cull:m.frustumCulled,instances:m.instanceMatrix?sha(bytes(m.instanceMatrix.array)):null,instanceColours:m.instanceColor?sha(bytes(m.instanceColor.array)):null,material:[mat.type,mat.color?.getHexString(),mat.emissive?.getHexString(),mat.emissiveIntensity,mat.metalness,mat.roughness,mat.side,mat.transparent,mat.opacity,mat.vertexColors]}));
 });meshes.sort();
 const roots=records=>records.map(n=>({anchor:n.anchor||[n.x,n.y,n.z],type:n.root?.userData.formation,position:(n.root||n.mesh).position.toArray(),quaternion:(n.root||n.mesh).quaternion.toArray(),visible:(n.root||n.mesh).visible}));
 const masks=[v.caveSupportBatches,v.deepSupportBatches,v.expeditionSupportBatches].map(s=>s.batches.map(b=>({states:b.states,visible:b.mesh.visible,entries:b.entries.map(e=>e.transform.toArray())})));
 return{preserved:{otherSceneMeshes:meshes.length,otherSceneMeshSha256:sha(JSON.stringify(meshes)),lights,masks,terrainSha256:sha(bytes(g.world.field)),contacts:v.obstacles,caveRoots:roots(v.caveGrowth),deepRoots:roots(v.deepGrowth),expeditionRoots:roots(v.growth),accents:v.caveAccentSites.map(n=>({point:n.point.toArray(),color:n.color})),state:structuredClone(g.economy.state),ore:g.deposits.nodes.map(n=>[n.id,n.kind,n.x,n.y,n.z,n.collected])},chalk:{meshes:chalkMeshes,triangles:chalkTriangles}};
}
const sources=Object.fromEntries(files.map(n=>[n,fs.readFileSync(new URL('chalk-art-before/'+n+'.js',out),'utf8')]));
let before,after;const old=await nodeGame({sources});try{before=capture(old.game);}finally{old.close();clearInterval(old.game.net.timer);}
const live=await nodeGame();try{after=capture(live.game);}finally{live.close();clearInterval(live.game.net.timer);}
assert.deepEqual(after.preserved,before.preserved);assert.equal(after.chalk.meshes,before.chalk.meshes);assert.equal(after.chalk.triangles-before.chalk.triangles,-4070);
const conservation={date:new Date().toISOString(),exact:true,beforeChalk:before.chalk,afterChalk:after.chalk,preserved:after.preserved,scope:'All other scene mesh attributes, indices, bounds, instance buffers, transforms, material flags, shadow flags and culling flags match. Lights, supported masks/transforms, all original roots/anchors/accents, contacts, terrain, ore and economy match. Static inert native scene; no input or timing claim.'};
fs.writeFileSync(new URL('chalk-art-conservation.json',out),JSON.stringify(conservation,null,2));
const prior=fs.readFileSync(new URL('chalk-art-before/index.html',out),'utf8'),current=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const parse=html=>[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json'));
const a=parse(prior),b=parse(current),names=parse(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8')).map((m,i)=>m[1].match(/src="([^"]+)"/)?.[1]||'inline-'+i),changes=[];
assert.equal(a.length,71);assert.equal(b.length,71);for(let i=0;i<a.length;i++){new vm.Script(b[i][2]);if(a[i][2]!==b[i][2])changes.push({file:names[i],beforeSha256:sha(a[i][2]),afterSha256:sha(b[i][2])});}
assert.deepEqual(changes.map(c=>c.file),['src/cave-form-art.js','src/underground-view.js']);
const factory=text=>text.replace(/ function drapery\([\s\S]*?(?= function crystal\()/,' DRAPERY\n');assert.equal(factory(fs.readFileSync(new URL('../src/cave-form-art.js',import.meta.url),'utf8')),factory(sources['cave-form-art']));
const mounting=fs.readFileSync(new URL('../src/underground-view.js',import.meta.url),'utf8'),start=mounting.indexOf('     if(geo.userData.chalkParts){'),end=mounting.indexOf('     }else for(',start),lineEnd=mounting.indexOf('\n',end);assert.ok(start>=0&&end>start);const oldLoop=mounting.slice(end,lineEnd).replace('     }else for(','     for(');assert.equal((mounting.slice(0,start)+oldLoop+mounting.slice(lineEnd)).replaceAll('\r',''),sources['underground-view'].replaceAll('\r',''));
const markup=html=>html.replace(/<script([^>]*)>[\s\S]*?<\/script>/g,'<script$1></script>').replace(/(<meta name="application-version" content=")[^"]+/,'$1VERSION');assert.equal(markup(current),markup(prior));
const diff={date:new Date().toISOString(),beforeVersion:'2.44.0',afterVersion:'2.45.0',beforeBuildSha256:sha(prior),afterBuildSha256:sha(current),executableScripts:71,changes,onlyDraperyFactoryChanges:true,onlyChalkWallMountingChanges:true,allOtherExecutableScriptsExact:true,stylesAndMarkupExactExceptVersion:true,physicsInputHudNetworkSaveSourcesExact:true};
fs.writeFileSync(new URL('chalk-art-build-diff.json',out),JSON.stringify(diff,null,2));
console.log('COMPLETE chalk conservation: '+after.preserved.otherSceneMeshes+' other scene meshes and native state exact; 4,070 fewer chalk triangles.');console.log('COMPLETE 71-script comparison: chalk factory/mounting and version metadata alone change.');console.log(diff.afterBuildSha256);
