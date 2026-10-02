// Static native production growth; guarded rendering without input or FPS claims.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2],build=path.resolve(root,process.argv[3]||'dist/index.html');assert.ok(label);
const out=path.join(root,'tools/out/growth-pass-'+label);fs.mkdirSync(out,{recursive:true});
const reference=label==='before'?null:JSON.parse(fs.readFileSync(path.join(root,'tools/out/growth-pass-before/report.json')));
const report={date:new Date().toISOString(),label,buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],scope:'Frozen native ordinary growth studies and mine views; seed, cameras, light and terrain retained. Deep chunks are built directly. No gameplay, physical input or timing claim.'};
const p=await launch({port:9522,width:1440,height:1000,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923&growth-pass');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE;g.setScreen(null);g.running=false;g.settings.motion=false;g._growthRender=v.render;v.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();v.renderer.info.autoReset=false;v.renderCaverns(g);v.renderDeep(g,10);v.renderExpedition(g,0,10);
  window._gpInventory=root=>{let meshes=0,triangles=0;root.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}});return{meshes,triangles};};
  window._gpEntries=system=>system.batches.flatMap(b=>b.entries);
  window._gpModel=(record,entries)=>{const root=record.root||record.mesh,model=new T.Group();root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();for(const e of entries.filter(e=>e.record===record)){const mesh=new T.Mesh(e.mesh.geometry.clone().applyMatrix4(inverse.clone().multiply(e.transform)),e.mesh.material);mesh.castShadow=e.mesh.castShadow;mesh.receiveShadow=e.mesh.receiveShadow;model.add(mesh);}return model;};
  window._gpSets=[{name:'upper',records:v.caveGrowth.filter(n=>n.root.userData.formation==='mineral-cluster'&&n.root.position.y<-32&&n.anchor.y<n.root.position.y),system:v.caveSupportBatches},{name:'deep-floor',records:v.deepGrowth.filter(n=>n.anchor.y<n.root.position.y),system:v.deepSupportBatches},{name:'deep-ceiling',records:v.deepGrowth.filter(n=>n.anchor.y>n.root.position.y),system:v.deepSupportBatches},{name:'garden',records:v.growth.filter(n=>n.mesh.material.color.getHexString()==='61e6c2'&&(n.mesh.geometry.type==='ConeGeometry'||n.mesh.geometry.userData.ordinaryGrowth)),system:v.expeditionSupportBatches}];
  const ids=${JSON.stringify(reference?.selected||null)};
  window._gpSelected=_gpSets.map((s,i)=>{const all=s.name==='upper'?v.caveGrowth:s.name.startsWith('deep')?v.deepGrowth:v.growth,entries=_gpEntries(s.system),record=ids?all[ids[i].index]:s.records.filter(n=>(n.root||n.mesh).visible).sort((a,b)=>{const height=n=>new T.Box3().setFromObject(_gpModel(n,entries)).getSize(new T.Vector3()).y;return height(b)-height(a);})[0];if(!record)throw Error('Missing growth '+s.name);return{...s,record,index:all.indexOf(record)};});
  return true;})()`);
 report.selected=await p.eval('_gpSelected.map(s=>({name:s.name,index:s.index}))');
 report.inventory=await p.eval(`(()=>{const v=__buttloads.view;return{cavern:_gpInventory(v.cavernScene),deep:_gpInventory(v.deepScene),discovery:_gpInventory(v.discovery),batches:[v.caveSupportBatches.batches.length,v.deepSupportBatches.batches.length,v.expeditionSupportBatches.batches.length]};})()`);
 for(let i=0;i<4;i++)for(const side of ['front','side']){
  const name=report.selected[i].name+'-'+side,preset=reference?.shots.find(s=>s.name===name).camera;
  const data=await p.eval(`(()=>{const v=__buttloads.view,T=THREE,s=_gpSelected[${i}],model=_gpModel(s.record,_gpEntries(s.system)),box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3()),radius=box.getSize(new T.Vector3()).length()*.5,preset=${JSON.stringify(preset||null)},camera=new T.PerspectiveCamera(33,1.44,.01,30),aim=preset?.aim||center.toArray(),position=preset?.position||center.clone().add(new T.Vector3(...(${JSON.stringify(side)}==='front'?[-.4,.15,1]:[1,.2,.35])).normalize().multiplyScalar(radius/Math.sin(33*Math.PI/360)*1.3)).toArray();camera.position.fromArray(position);camera.lookAt(new T.Vector3(...aim));
   const scene=new T.Scene();scene.background=new T.Color('#293334');scene.add(model,new T.HemisphereLight('#d7e8e6','#41443a',.7));const key=new T.DirectionalLight('#ffe8cb',2.2);key.position.set(-3,5,4);scene.add(key);const rim=new T.DirectionalLight('#b8c9e2',.8);rim.position.set(3,1,-2);scene.add(rim);v.renderer.autoClear=true;v.renderer.info.reset();v.renderer.render(scene,camera);return{camera:{position,aim},model:_gpInventory(model),cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,kind:'studio',...data});
 }
 // Build unchanged production deep terrain close to both selected anchors.
 await p.eval(`(()=>{const g=__buttloads,w=g.world;w.deepOpen=true;const built=new Set();for(const s of _gpSelected.filter(s=>s.name.startsWith('deep'))){const at=s.record.root.position,c=[at.x,at.y,at.z].map(v=>Math.floor(v/8));for(let cy=c[1]-1;cy<=c[1]+1;cy++)for(let cz=c[2]-1;cz<=c[2]+1;cz++)for(let cx=c[0]-1;cx<=c[0]+1;cx++){const key=[cx,cy,cz].join(',');if(built.has(key))continue;built.add(key);const mesh=w.kernel.build([cx*8,cy*8,cz*8],w.samplesFor(cx,cy,cz));if(mesh.count)w.adopt(cx,cy,cz,mesh);}}return true;})()`);
 report.terrainSha256=createHash('sha256').update(Buffer.from(await p.eval('Array.from(new Uint8Array(__buttloads.world.field.buffer))'))).digest('hex');
 for(let i=0;i<4;i++){
  const name=report.selected[i].name+'-mine',preset=reference?.shots.find(s=>s.name===name).camera;
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE,s=_gpSelected[${i}],root=s.record.root||s.record.mesh,model=_gpModel(s.record,_gpEntries(s.system));model.applyMatrix4(root.matrixWorld);const aim=new T.Box3().setFromObject(model).getCenter(new T.Vector3());let head=aim.clone().add(new T.Vector3(1.0,s.name==='deep-ceiling'?-1.15:.85,2));if(s.name.startsWith('deep')){const room=g.world.deepTerrain.rooms.reduce((a,b)=>Math.abs(a.y-aim.y)<Math.abs(b.y-aim.y)?a:b);head.set(room.x*.65+root.position.x*.35,room.y-.35,room.z*.65+root.position.z*.35);}const d=aim.clone().sub(head).normalize(),c=${JSON.stringify(preset||null)}||{x:head.x,y:head.y-g.player.eye,z:head.z,yaw:Math.atan2(-d.x,-d.z),pitch:Math.asin(d.y)};g.player.teleport(c.x,c.y,c.z);g.player.yaw=c.yaw;g.player.pitch=c.pitch;v.gameUI.dirty=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._growthRender.call(v,g,0,10);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();g._growthRender.call(v,g,0,10);return{camera:c,refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,kind:'mine',...data});
 }
 if(reference){assert.deepEqual(report.selected,reference.selected);assert.equal(report.terrainSha256,reference.terrainSha256);for(const s of report.shots)assert.deepEqual(s.camera,reference.shots.find(t=>t.name===s.name).camera);}
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');assert.deepEqual(report.errors,[]);assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
 console.log(JSON.stringify({label,version:report.version,inventory:report.inventory,selected:report.selected,shots:report.shots.map(s=>({name:s.name,cached:s.cached}))}));console.log('COMPLETE twelve guarded native ordinary growth views '+label);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
