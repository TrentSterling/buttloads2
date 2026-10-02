// Fixed native rock inspection. No events, held input, focus or pointer lock.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2]||'after',build=path.resolve(root,process.argv[3]||'dist/index.html'),out=path.join(root,'tools/out','rock-surface-'+label);
fs.mkdirSync(out,{recursive:true});
const report={label,date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),viewport:[1440,1000],shots:[],method:'Actual production rocks in their native world. Fixed walking-height and underside cameras, light, wind and time. Offline inert crew, no input events, focus or pointer lock. No isolated model or substitute renderer.'};
const p=await launch({port:9582,width:1440,height:1000,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.advanceSimulation=()=>{};g._rockDraw=v.render;v.render=()=>{};g.setScreen(null);g.clearInput();g.settings.motion=false;g.clock=0;g.fieldKit.dismiss();return true;})()`);
 if(process.argv.includes('--rock-shadow-off')){await p.eval('(()=>{const v=__buttloads.view;for(const m of v.commonScene.children)if(v.commonRockMaterials.includes(m.material))m.castShadow=false;return true;})()');report.method+=' Diagnostic only: rock shadow casting disabled in this browser evaluation; production source unchanged.';}
 if(process.argv.includes('--flat-study')){await p.eval('(()=>{const v=__buttloads.view,m=new THREE.MeshBasicMaterial({color:0xffffff});for(const o of v.commonScene.children)if(v.commonRockMaterials.includes(o.material))o.material=m;return true;})()');report.method+=' Diagnostic only: constant white front-face material replaces native rock materials in this observation page.';}
 if(process.argv.includes('--relief-off-study')){await p.eval(`(()=>{for(const m of __buttloads.view.commonRockMaterials){const native=m.onBeforeCompile;m.onBeforeCompile=s=>{native(s);s.fragmentShader=s.fragmentShader.replace('strataHeight+=b2SurfaceHeight(vGround,normalize(vGroundNormal),diffuseColor.rgb)','strataHeight+=0.');};m.customProgramCacheKey=()=> 'rock-relief-diagnostic';m.needsUpdate=true;}return true;})()`);report.method+=' Diagnostic only: shader surface-height perturbation disabled on rock materials in this observation page.';}
 const trees=await p.eval('(()=>{const a=__buttloads.view.commonTrees;return{pine:a.filter(t=>t.conifer).sort((a,b)=>Math.hypot(a.x+43,a.z-20)-Math.hypot(b.x+43,b.z-20))[0],oak:a.find(t=>t.x===-1&&t.z===36)};})()'),{pine,oak}=trees;report.selectedTrees=trees;
 const shots=[
 ['outcrop-west',-42.5,20,-46,25,.95],['outcrop-north',-34.5,-31.5,-38,-37,.8],['outcrop-east',45,39,49,43,.8],['outcrop-pair',-37,26,-41,28,.7],['outcrop-south',31,58,35,62,.7],['outcrop-wide',-34,15,-45,26,1.4],
 ['east-clear',49,39,49,43,.8],['west-close',-42.7,24.9,-46,25,.95],['west-side',-49.4,25.1,-46,25,.95],['west-top',-46,28.1,-46,25,.95],['yard',0,11.5,0,-.18]
 ];
 const only=process.argv.find(s=>s.startsWith('--only='))?.slice(7).split(',')||(process.argv.includes('--extra')?['east-clear']:shots.map(s=>s[0]).filter(s=>s!=='east-clear'));
 for(const [name,x,z,a,b,c,absolute]of shots.filter(row=>!only||only.includes(row[0]))){
  const setup=c===undefined?`g.player.yaw=${a};g.player.pitch=${b};`:`g.player.yaw=Math.atan2(${x-a},${z-b});g.player.pitch=Math.atan2(${absolute?c:`B2.COMMON.height(${a},${b})+${c}`}-g.player.head.y,Math.hypot(${a-x},${b-z}));`;
  const state=await p.eval(`(()=>{const g=__buttloads,v=g.view;g.player.teleport(${x},B2.COMMON.height(${x},${z})+.06,${z});${setup}v.windUniform.value=0;v.skyDome.material.uniforms.windTime.value=0;Object.assign(v.feel,{phase:0,swayX:0,swayY:0,land:0,vy:0,equip:0,yaw:g.player.yaw,pitch:g.player.pitch});v.gameUI.age=0;v.gameUI.dirty=true;v.renderer.info.autoReset=false;v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;g._rockDraw.call(v,g,0,0);return{name:${JSON.stringify(name)},player:{...g.player.position,yaw:g.player.yaw,pitch:g.player.pitch},camera:v.camera.position.toArray(),rotation:v.camera.rotation.toArray(),calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,input:{pointerLock:!!document.pointerLockElement,keys:g.input.keys.size,fire:g.input.fire}};})()`);
  assert.deepEqual(state.input,{pointerLock:false,keys:0,fire:false});await p.shot(path.join(out,name+'.png'));report.shots.push(state);
 }
 report.inventory=await p.eval(`(()=>{const g=__buttloads,v=g.view,invalid=[];let triangles=0,meshes=0,bytes=0,canopyTriangles=0,canopyMeshes=0,lights=0;const mats=new Set();v.commonScene.traverse(o=>{if(o.isMesh){meshes++;mats.add(o.material.uuid);const a=o.geometry.attributes,n=(o.geometry.index?.count||a.position.count)/3;triangles+=n;for(const b of Object.values(a))bytes+=b.array.byteLength;bytes+=o.geometry.index?.array.byteLength||0;if(o.material.side===THREE.DoubleSide&&o.material.vertexColors){canopyTriangles+=n;canopyMeshes++;}for(const k of ['normal',...(o.material.map?['uv']:[]),...(o.material.vertexColors?['color']:[])])if(a[k]?.count!==a.position.count)invalid.push(k);for(const b of Object.values(a))if(!b.array.every(Number.isFinite))invalid.push('nonfinite');}if(o.isLight)lights++;});let field=2166136261;for(const b of new Uint8Array(g.world.field.buffer))field=Math.imul(field^b,16777619)>>>0;return{triangles,meshes,bytes,canopyTriangles,canopyMeshes,materialCount:mats.size,lights,trees:v.commonTrees,rootContacts:v.rootContacts,rocks:v.commonRocks,gardens:v.commonGardens,meadow:v.commonMeadow,obstacles:v.obstacles,fieldHash:field,invalid};})()`);
 report.atlas=await p.eval(`(()=>{const v=__buttloads.view,m=v.canopyMaterial;if(!m)return null;const image=m.map.image,rgba=image.getContext('2d').getImageData(0,0,512,512).data;let hash=2166136261,solid=0;for(let i=0;i<rgba.length;i++){hash=Math.imul(hash^rgba[i],16777619)>>>0;if(i%4===3&&rgba[i]>=m.alphaTest*255)solid++;}return{width:image.width,height:image.height,baseBytes:rgba.byteLength,alphaTest:m.alphaTest,opaquePixels:solid,pixelHash:hash,encoding:m.map.encoding,anisotropy:m.map.anisotropy,generateMipmaps:m.map.generateMipmaps,index:v.canopyIndex};})()`);
 if(report.atlas){const png=await p.eval('__buttloads.view.canopyMaterial.map.image.toDataURL("image/png").split(",")[1]');fs.writeFileSync(path.join(out,'atlas.png'),Buffer.from(png,'base64'));}
 assert.deepEqual(report.inventory.invalid,[]);report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);
 if(label==='after'||label==='after-extra'){
  const before=JSON.parse(fs.readFileSync(path.join(root,'tools/out/rock-surface-'+(label==='after'?'before':'before-extra')+'/report.json')));
  assert.deepEqual(report.selectedTrees,before.selectedTrees);
  for(const s of report.shots){const old=before.shots.find(o=>o.name===s.name);for(const key of ['player','camera','rotation','input'])assert.deepEqual(s[key],old[key],s.name+' '+key);}
  for(const key of ['trees','rootContacts','rocks','gardens','meadow','obstacles','fieldHash','materialCount','lights'])assert.deepEqual(report.inventory[key],before.inventory[key],key);
 }
 console.log('COMPLETE '+report.shots.length+' native rock views '+label+'; '+report.inventory.canopyTriangles+' canopy triangles; no held input, errors or pointer lock.');
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
