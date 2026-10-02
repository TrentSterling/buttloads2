// Static production poses only. No input events, pointer lock or FPS sampling.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2],build=path.resolve(root,process.argv[3]||'dist/index.html');
assert.ok(['before','after'].includes(label));
const out=path.join(root,'tools/out/prop-merge-'+label);fs.mkdirSync(out,{recursive:true});
const reference=label==='after'?JSON.parse(fs.readFileSync(path.join(root,'tools/out/prop-merge-before/report.json'))):null;
const p=await launch({port:9520,width:1440,height:1000,gpu:true}),report={date:new Date().toISOString(),label,buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],scope:'Frozen native resident accessories, echo seals, optical arrows and the opened survey office. Direct production state fixtures; no gameplay input or frame-time claim.'};
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923&prop-merge');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.setScreen(null);g.running=false;g._receiptRender=v.render;v.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();v.renderer.info.autoReset=false;
  window._pmInventory=root=>{let meshes=0,triangles=0,vertices=0;root.traverse(m=>{if(m.isMesh){meshes++;triangles+=Math.min(m.geometry.drawRange.count,(m.geometry.index?.count||m.geometry.attributes.position.count))/3;vertices+=m.geometry.attributes.position.count;}});return{meshes,triangles,vertices};};
  window._pmPose=(active,turn)=>{g.settings.motion=true;g.player.teleport(-23.7,.06,51);for(const r of [...v.townRigs,v.bellPerson])v.animateResident(r,g,5.23,true);g.mysteries.state.solved=active?[0]:[];g.mysteries.state.mirrors=[turn,3];g.mysteries.connected=turn?2:0;v.renderMysteries(g,4);};return true;})()`);
 report.inventory=await p.eval(`(()=>{const v=__buttloads.view;return Object.fromEntries([...v.townRigs.map(r=>[r.person.id,_pmInventory(r.root)]),['bell-person',_pmInventory(v.bellPerson.root)],['ruins',_pmInventory(v.ruins)],['office',_pmInventory(v.officeOpen)]]);})()`);
 const fixtures=[['otis','otis',false,0],['inez','inez',false,0],['nell','nell',false,0],['bell-inez','bell-person',false,0],['echo-rest','echo',false,0],['echo-lit','echo',true,0],['optic-rest','optic',false,0],['optic-turned','optic',true,1]];
 for(const [name,kind,active,turn]of fixtures){
  const preset=reference?.shots.find(s=>s.name===name).camera;
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE,kind=${JSON.stringify(kind)};_pmPose(${active},${turn});const source=kind==='echo'?v.echoModels[2].g:kind==='optic'?v.prismModels[1].g:kind==='bell-person'?v.bellPerson.root:v.townRigs.find(r=>r.person.id===kind).root,model=source.clone(true);model.visible=true;model.position.set(0,0,0);model.quaternion.identity();model.updateWorldMatrix(true,true);
   const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),radius=bounds.getSize(new T.Vector3()).length()*.5,camera=new T.PerspectiveCamera(33,1.44,.01,30),preset=${JSON.stringify(preset||null)};
   if(preset){camera.position.fromArray(preset.position);camera.lookAt(new T.Vector3(...preset.aim));}else{camera.position.copy(center).add(new T.Vector3(-.42,.15,kind==='echo'?1:-1).normalize().multiplyScalar(radius/Math.sin(33*Math.PI/360)*1.10));camera.lookAt(center);}
   const scene=new T.Scene();scene.background=new T.Color('#293334');scene.add(model,new T.HemisphereLight('#d7e8e6','#41443a',.7));const key=new T.DirectionalLight('#ffe8cb',2.2);key.position.set(-3,5,-4);key.castShadow=true;key.shadow.autoUpdate=false;key.shadow.needsUpdate=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:20});key.shadow.normalBias=.01;scene.add(key);const rim=new T.DirectionalLight('#b8c9e2',.8);rim.position.set(3,1,2);scene.add(rim);
   v.renderer.autoClear=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();v.renderer.render(scene,camera);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();v.renderer.render(scene,camera);return{camera:{position:camera.position.toArray(),aim:preset?.aim||center.toArray()},model:_pmInventory(model),refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  if(preset)assert.deepEqual(data.camera,preset);await p.shot(path.join(out,name+'.png'));report.shots.push({name,kind:'studio',active,turn,...data});
 }
 for(const [name,id]of [['town-otis','otis'],['town-inez','inez'],['town-nell','nell']]){
  const preset=reference?.shots.find(s=>s.name===name).camera;
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view;g.rescue.state.phase='rescued';g.fossil.state.recovered=true;g.settings.motion=false;const n=B2.TOWN.people.find(p=>p.id===${JSON.stringify(id)}),c=${JSON.stringify(preset||null)}||{x:n.x+.8,y:.06,z:n.z-2.5,yaw:Math.atan2(.8,-2.5),pitch:-.03};g.player.teleport(c.x,c.y,c.z);g.player.yaw=c.yaw;g.player.pitch=c.pitch;v.gameUI.dirty=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._receiptRender.call(v,g,0,10);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();g._receiptRender.call(v,g,0,10);return{camera:c,refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  if(preset)assert.deepEqual(data.camera,preset);await p.shot(path.join(out,name+'.png'));report.shots.push({name,kind:'game',...data});
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');assert.deepEqual(report.errors,[]);assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
 console.log(JSON.stringify({label,version:report.version,inventory:report.inventory,shots:report.shots.map(s=>({name:s.name,cached:s.cached,refresh:s.refresh}))}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
