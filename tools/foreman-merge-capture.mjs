// Frozen native inspection fixtures. No browser events, pointer lock or timings.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2],build=path.resolve(root,process.argv[3]||'dist/index.html');
assert.ok(['before','after'].includes(label));
const out=path.join(root,'tools/out/foreman-merge-'+label);fs.mkdirSync(out,{recursive:true});
const reference=label==='after'?JSON.parse(fs.readFileSync(path.join(root,'tools/out/foreman-merge-before/report.json'))):null;
const p=await launch({port:9518,width:1440,height:1000,gpu:true}),report={date:new Date().toISOString(),label,buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],scope:'Native production assemblies, frozen state, seed, cameras and lighting. Exposed room fixtures carve the production deep field and build its nearby chunks; simulation is frozen. No gameplay input or FPS claim.'};
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923&foreman-merge');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.setScreen(null);g.running=false;g.settings.motion=false;g._mergeRender=v.render;v.render=()=>{};g.advanceSimulation=()=>{};g.fieldKit.dismiss();v.renderer.info.autoReset=false;
  window._fmInventory=root=>{let meshes=0,triangles=0,vertices=0;root.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;vertices+=m.geometry.attributes.position.count;}});return{meshes,triangles,vertices};};
  window._fmState=kind=>{const f=g.foreman,n=f.core,s=f.state;f.nodes.forEach((n,i)=>n.hp=i?80:420);Object.assign(s,{active:true,known:true,defeated:false,phase:'rest',timer:1,aim:null});f.flash=0;f.hitId=null;
   if(['open','quake','damaged'].includes(kind))f.nodes[1].hp=kind==='damaged'?40:0;
   if(kind==='quake'){s.phase='quake-windup';s.timer=.4;}
   if(kind==='open'){s.phase='aim';s.timer=.8;s.aim={x:n.x+5,y:n.y+.8,z:n.z+5};}
   if(['defeated','broken'].includes(kind)){f.nodes.forEach(n=>n.hp=0);s.active=false;s.defeated=true;s.phase='defeated';}
   g.player.teleport(n.x+4,n.y-1,n.z+5);v.renderForeman(g,10);
  };return true;})()`);
 report.inventory=await p.eval('Object.fromEntries(__buttloads.view.foremanModels.map(m=>[m.node.id,_fmInventory(m.root)]))');
 const fixtures=[['furnace-sealed','sealed',0,[-6,3,9],[0,.1,0]],['furnace-rear','sealed',0,[6,3,-9],[0,.1,0]],['furnace-open','open',0,[-6,3,9],[0,.1,0]],['furnace-quake','quake',0,[-6,3,9],[0,.1,0]],['furnace-defeated','defeated',0,[-6,3,9],[0,.1,0]],['lock-intact','sealed',1,[-3,1.6,4.5],[0,0,0]],['lock-damaged','damaged',1,[-3,1.6,4.5],[0,0,0]],['lock-broken','broken',1,[-3,1.6,4.5],[0,0,0]]];
 for(const [name,state,index,position,aim]of fixtures){
  const camera=reference?.shots.find(s=>s.name===name).camera||{position,aim};
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE;_fmState(${JSON.stringify(state)});const model=v.foremanModels[${index}].root.clone(true);model.position.set(0,0,0);model.updateWorldMatrix(true,true);const camera=new T.PerspectiveCamera(33,1.44,.01,40),pose=${JSON.stringify(camera)};camera.position.fromArray(pose.position);camera.lookAt(new T.Vector3(...pose.aim));const scene=new T.Scene();scene.background=new T.Color('#293334');scene.add(model,new T.HemisphereLight('#d7e8e6','#41443a',.7));const key=new T.DirectionalLight('#ffe8cb',2.2);key.position.set(-3,5,-4);key.castShadow=true;key.shadow.autoUpdate=false;key.shadow.needsUpdate=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:20});key.shadow.normalBias=.01;scene.add(key);const rim=new T.DirectionalLight('#b8c9e2',.8);rim.position.set(3,1,2);scene.add(rim);v.renderer.autoClear=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();v.renderer.render(scene,camera);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();v.renderer.render(scene,camera);return{camera:pose,model:_fmInventory(model),refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,state,kind:'studio',...data});
 }
 await p.eval(`(()=>{const g=__buttloads,w=new B2.World(g.world.seed,g.world.generation,1);w.deepOpen=true;g.world=w;g.view.bindWorld(w);w.carve({x:0,y:-279.7,z:0},6.3);for(let cy=-37;cy<=-34;cy++)for(let cz=-2;cz<2;cz++)for(let cx=-2;cx<2;cx++){const mesh=w.kernel.build([cx*8,cy*8,cz*8],w.samplesFor(cx,cy,cz));if(mesh.count)w.adopt(cx,cy,cz,mesh);}return true;})()`);
 report.roomTerrainSha256=createHash('sha256').update(Buffer.from(await p.eval('Array.from(new Uint8Array(__buttloads.world.field.buffer))'))).digest('hex');
 for(const [name,state]of [['room-sealed','sealed'],['room-quake','quake']]){
  const camera=reference?.shots.find(s=>s.name===name).camera||{x:-4,y:-280.5,z:5,yaw:-Math.atan2(4,5),pitch:.03};
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view,c=${JSON.stringify(camera)};_fmState(${JSON.stringify(state)});g.player.teleport(c.x,c.y,c.z);g.player.yaw=c.yaw;g.player.pitch=c.pitch;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();g._mergeRender.call(v,g,0,10);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();g._mergeRender.call(v,g,0,10);return{camera:c,refresh,cached:{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles}};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push({name,state,kind:'room',...data});
 }
 if(reference){assert.equal(report.roomTerrainSha256,reference.roomTerrainSha256);for(const s of report.shots)assert.deepEqual(s.camera,reference.shots.find(t=>t.name===s.name).camera);}
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');assert.deepEqual(report.errors,[]);assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
 console.log(JSON.stringify({label,version:report.version,inventory:report.inventory,shots:report.shots.map(s=>({name:s.name,cached:s.cached,refresh:s.refresh}))}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
