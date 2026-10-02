// Native fixed-pose captures; no dispatched events, OS input or frame timings.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2],build=path.resolve(root,process.argv[3]||'dist/index.html');
if(!['before','after'].includes(label))throw Error('Expected before or after');
const out=path.join(root,'tools/out/freight-merge-'+label);fs.mkdirSync(out,{recursive:true});
const reference=label==='after'?JSON.parse(fs.readFileSync(path.join(root,'tools/out/freight-merge-before/report.json'))):null;
const p=await launch({port:9515,width:1440,height:1000,gpu:true}),report={label,date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],scope:'Actual native geometry, fixed seed/time/cameras, cached and refreshed shadows. Direct state fixtures, no gameplay input, physical Firefox or quiet-machine FPS claim.'};
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923&freightMerge');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.setScreen(null);g.running=false;g.settings.motion=false;g._receiptRender=v.render;v.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();v.renderer.info.autoReset=false;
  window._inventory=root=>{let meshes=0,triangles=0,vertices=0;root.traverse(m=>{if(!m.isMesh)return;meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;vertices+=m.geometry.attributes.position.count;});return{meshes,triangles,vertices};};return true;})()`);
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 report.inventory=await p.eval(`(()=>{const v=__buttloads.view;return Object.fromEntries(['craneRail','freightCage','freightDock','rescueBell','crawlerScene','combatScene'].map(k=>[k,_inventory(v[k])]));})()`);
 for(const [name,position,yaw,pitch]of [['crane-yard',[0,.06,8],0,.08],['crane-side',[-9,.06,4],-.8,.02]]){
  const pose={position,yaw,pitch},data=await p.eval(`(()=>{const g=__buttloads,v=g.view,p=${JSON.stringify(pose)};Object.assign(g.freight.state,{dock:{x:0,y:-12,z:0},phase:'idle'});g.player.teleport(...p.position);g.player.yaw=p.yaw;g.player.pitch=p.pitch;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._receiptRender.call(v,g,0,10);const refresh={...v.renderer.info.render};v.renderer.info.reset();g._receiptRender.call(v,g,0,10);return{camera:p,refresh:{calls:refresh.calls,triangles:refresh.triangles},cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,...data});
 }
 for(const name of ['rail','cargo-cage','rescue-cage','crawler-intact','crawler-broken','moth-windup']){
  const preset=reference?.shots.find(s=>s.name===name).camera;
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE,name=${JSON.stringify(name)};
   if(name.startsWith('crawler')){const n=g.crawlers.nodes[0];Object.assign(n,{phase:name==='crawler-broken'?'dead':'windup',hp:name==='crawler-broken'?0:80,shell:name==='crawler-broken'?0:3});v.renderCrawlers(g,2);}
   if(name==='moth-windup'){Object.assign(g.combat.enemies[0],{phase:'windup',hp:3});v.renderCombat(g,2);}
   const source=name==='rail'?v.craneRail:name==='cargo-cage'?v.freightCage:name==='rescue-cage'?v.rescueBell:name.startsWith('crawler')?v.crawlerModels[0].root:v.mothModels[0].root,model=source.clone(true);model.visible=true;model.position.set(0,0,0);model.rotation.set(0,0,0);model.updateWorldMatrix(true,true);
   const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),radius=bounds.getSize(new T.Vector3()).length()*.5,camera=new T.PerspectiveCamera(33,1.44,.01,300),preset=${JSON.stringify(preset||null)};
   if(preset){camera.position.fromArray(preset.position);camera.lookAt(new T.Vector3(...preset.aim));}else{camera.position.copy(center).add(new T.Vector3(-.55,.3,-.8).normalize().multiplyScalar(radius/Math.sin(33*Math.PI/360)*1.12));camera.lookAt(center);}
   const scene=new T.Scene();scene.background=new T.Color('#333f41');scene.add(model,new T.HemisphereLight('#e4f0f4','#52513f',.75));const key=new T.DirectionalLight('#ffe6c4',2.5);key.position.set(-3,5,-4);key.castShadow=true;key.shadow.autoUpdate=false;key.shadow.needsUpdate=true;key.shadow.mapSize.set(1024,1024);const span=name==='rail'?32:3;Object.assign(key.shadow.camera,{left:-span,right:span,top:span,bottom:-span,near:.1,far:name==='rail'?100:25});key.shadow.normalBias=.012;key.shadow.bias=-.0001;scene.add(key);const rim=new T.DirectionalLight('#b2d0da',1.1);rim.position.set(3,2,2);scene.add(rim);
   v.renderer.autoClear=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();v.renderer.render(scene,camera);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();v.renderer.render(scene,camera);return{camera:{position:camera.position.toArray(),aim:preset?.aim||center.toArray()},model:_inventory(model),refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  if(preset)assert.deepEqual(data.camera,preset);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,...data});
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');assert.deepEqual(report.errors,[]);assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
 console.log(JSON.stringify({label,version:report.version,inventory:report.inventory,shots:report.shots.map(s=>({name:s.name,cached:s.cached,refresh:s.refresh}))}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
