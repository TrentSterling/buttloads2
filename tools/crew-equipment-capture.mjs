// Static native co-op presentation fixtures, with inert members and guarded input.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2];
if(!['before','after'].includes(label))throw Error('Expected before or after');
const out=path.join(root,'tools/out/crew-equipment-'+label),build=path.join(out,'index.html');
fs.mkdirSync(out,{recursive:true});
if(label==='after')fs.copyFileSync(path.join(root,'dist/index.html'),build);
const report={date:new Date().toISOString(),label,buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),method:'Native renderer, fixed terrain/seed/camera/time and inert co-op members. No browser input events, public networking or FPS measurement.',shots:[]};
const p=await launch({port:9554,width:1440,height:1000,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');
 await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.settings.motion=true;g.running=false;g.update=()=>{};g.advanceSimulation=()=>{};g._crewNative=g.view.render;g.view.render=()=>{};g.view.renderer.info.autoReset=false;return true;})()`);
 const cases=[{name:'one-miner',count:1,tools:['cutter']},{name:'two-miners',count:2,tools:['cutter','axe']},{name:'four-miners',count:4,tools:['cutter','axe','sling','resonance']},{name:'eight-miners',count:8,tools:['cutter','scoop','lance','resonance','gravity','axe','sling','cutter']},...['cutter','scoop','lance','resonance','gravity','axe','sling'].map(tool=>({name:'tool-'+tool,count:2,tools:[tool],firing:true})),{name:'outside-camera',count:4,tools:['cutter'],outside:true},{name:'eight-cutters',count:8,tools:['cutter'],firing:true},{name:'sling-charges',count:4,tools:['sling'],firing:true,charges:true},{name:'shadow-clipped',count:4,tools:['cutter'],clipped:true}];
 for(const fixture of cases){
  const s=await p.eval(`(()=>{
   const g=__buttloads,v=g.view,T=THREE,f=${JSON.stringify(fixture)};v.clearMiners();g.player.teleport(0,.06,13.5);g.player.yaw=0;g.player.pitch=-.12;g.expedition.state.tool='cutter';
   for(let i=0;i<60;i++)g.player.step(1/120,new Set(),6);
   v.feel={phase:0,swayX:0,swayY:0,land:0,vy:0,tool:'cutter',equip:0,yaw:0,pitch:-.12};v.windUniform.value=0;v.skyDome.material.uniforms.windTime.value=0;
   v.rotor.rotation.set(0,0,0);v.resonatorHead.rotation.set(0,0,0);
   g.net={role:'offline',members:[],count:1,tick(){},stepRemotes(){}};g._crewNative.call(v,g,0,4);
   const members=Array.from({length:f.count},(_,i)=>({id:'receipt-'+i,name:['Copperhead','Shale','Bell','Flint','Cinder','Ridge','Mica','Quartz'][i],color:i%8,tool:f.tools[i%f.tools.length],fire:!!f.firing,playing:true,sling:{charge:f.charges?i*.25:.35},transient:{charge:f.charges?i*.25:.35},player:{x:f.count===1?-.35:(i%4-(Math.min(f.count,4)-1)/2)*1.25,y:.06,z:f.outside&&i>1?14.8:Math.floor(i/4)?2.5:9.4,grounded:true,yaw:Math.PI,pitch:f.firing?.22:0,vx:1.4,vz:.2}}));
   const probe=new B2.Player(g.world);probe.obstacles=g.player.obstacles;
   const support=members.map(m=>{probe.teleport(m.player.x,.06,m.player.z);for(let i=0;i<60;i++)probe.step(1/120,new Set(),6);m.player.y=probe.y;m.player.grounded=probe.grounded;return{id:m.id,y:probe.y,clear:!probe.blocked(probe.x,probe.y,probe.z),supported:probe.grounded&&probe.blocked(probe.x,probe.y-.06,probe.z)};});
   if(support.some(s=>!s.clear||!s.supported))throw Error('Receipt miner is not on supported native ground: '+JSON.stringify(support));
   g.net={role:'receipt',members,count:members.length+1,tick(){},stepRemotes(){}};
   const sc=v.sun.shadow.camera,shadowPrior=[sc.left,sc.right,sc.top,sc.bottom];if(f.clipped){sc.left=200;sc.right=201;sc.top=201;sc.bottom=200;sc.updateProjectionMatrix();}
   // Fixed camera and animation state. Prime both versions before counting.
   g._crewNative.call(v,g,0,4);for(const m of v.miners.values())m.root.rotation.y=Math.PI;g._crewNative.call(v,g,.035,4);
   v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;g._crewNative.call(v,g,0,4);
   const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};
   v.renderer.info.reset();v.gameUI.dirty=true;g._crewNative.call(v,g,0,4);
   const cached={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};
   const poses=[...v.miners.values()].map(m=>({name:m.label,color:m.color,tool:m.tool,root:m.root.position.toArray(),yaw:m.root.rotation.y,head:m.head.rotation.toArray(),arms:m.arms.map(n=>n.quaternion.toArray()),legs:m.legs.map(n=>n.rotation.toArray()),knees:m.knees.map(n=>n.rotation.toArray()),weapon:m.weapon.position.toArray(),weaponRotation:m.weapon.rotation.toArray(),attachments:Object.fromEntries(Object.entries(m.attachments).map(([k,n])=>[k,{visible:n.visible,rotation:n.rotation.toArray(),position:n.position.toArray()}])),badge:m.badge.visible,field:m.field.visible,fieldRings:m.field.children.map(n=>({rotation:n.rotation.toArray(),color:n.material.color.toArray(),opacity:n.material.opacity})),core:m.core?{scale:m.core.scale.toArray(),emissiveIntensity:m.core.material.emissiveIntensity}:null,forks:m.forks.map(n=>n.rotation.toArray()),rootVisible:m.root.visible}));
   const weaponMeshes=[...v.miners.values()].flatMap(m=>{const meshes=[];m.weapon.traverse(n=>{if(n.isMesh)meshes.push(n);});return meshes;});const resources={meshes:weaponMeshes.length,materials:new Set(weaponMeshes.map(n=>n.material)).size,geometries:new Set(weaponMeshes.map(n=>n.geometry)).size};
   if(f.clipped){[sc.left,sc.right,sc.top,sc.bottom]=shadowPrior;sc.updateProjectionMatrix();}
   return{name:f.name,resources,weaponBatching:v.crewWeaponBatchStats||{groups:0,instances:0,capacity:0,instanceBytes:0},members:members.length,support,camera:{position:v.camera.position.toArray(),rotation:v.camera.rotation.toArray()},cached,refresh,poses,batching:v.crewBatchStats||null};
  })()`);
  await p.shot(path.join(out,fixture.name+'.png'));report.shots.push(s);
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));
 report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');
 if(report.errors.length||report.input.pointerLock||report.input.keys||report.input.fire)throw Error('Static input guard failed');
 console.log(JSON.stringify({version:report.version,shots:report.shots.map(s=>({name:s.name,cached:s.cached,refresh:s.refresh,batching:s.batching}))}));
 console.log('COMPLETE '+report.shots.length+' native crew equipment views '+label);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
