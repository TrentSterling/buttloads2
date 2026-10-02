// Fixed art studies and native poses. No dispatched input, networking or focus.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2];
if(!['before','candidate','after'].includes(label))throw Error('Expected before, candidate or after');
const out=path.join(root,'tools/out/miner-joint-'+label);fs.mkdirSync(out,{recursive:true});const build=path.join(out,'index.html');
if(label!=='before')fs.copyFileSync(path.join(root,'dist/index.html'),build);
const report={date:new Date().toISOString(),label,buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],method:'Neutral anatomy/joint studies and fixed native poses. No input, networking or frame-rate claims.'};
const p=await launch({port:9606,width:1280,height:900,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE;g.running=false;g.update=()=>{};g.advanceSimulation=()=>{};g.setScreen(null);g.settings.motion=true;g._garmentNative=v.render;v.render=()=>{};g.net={role:'receipt',members:[],count:1,tick(){},stepRemotes(){}};v.windUniform.value=0;v.skyDome.material.uniforms.windTime.value=0;v.renderer.info.autoReset=false;
 const scene=new T.Scene();scene.background=new T.Color('#333f41');const plane=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:new T.Color('#6a7166').convertSRGBToLinear(),roughness:1}));plane.rotation.x=-Math.PI/2;plane.receiveShadow=true;scene.add(plane);
 scene.add(new T.HemisphereLight('#e4f0f4','#52513f',.75));const key=new T.DirectionalLight('#ffe6c4',2.5);key.position.set(-3,5,-4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:15});key.shadow.normalBias=.012;key.shadow.bias=-.0001;scene.add(key);const rim=new T.DirectionalLight('#b2d0da',1.1);rim.position.set(3,2,2);scene.add(rim);g._garmentStudio={scene,camera:new T.PerspectiveCamera(33,1280/900,.01,50)};return true;})()`);
 const views=[['front',[0,1.17,-3.8],[0,.94,0]],['quarter',[-2.8,1.5,-2.8],[0,1,0]],['profile',[-3.8,1.27,0],[0,.96,0]],['back',[1.8,1.45,3.35],[0,1,0]],['face',[-.4,1.67,-1.2],[0,1.52,0]]];
 const cases=views.map(([name,pos,aim])=>({name:'study-'+name,kind:'study',pos,aim}));
 for(const bend of [45,95])for(const side of ['front','profile'])cases.push({name:'knee-'+bend+'-'+side,kind:'study',bend,pos:side==='front'?[0,.72,-2]:[-2,.76,0],aim:[0,.46,0]});
 cases.push({name:'elbow-100',kind:'study',elbow:100,pos:[-1.35,1.35,-.65],aim:[-.23,1.07,0]});
 for(const pitch of [-.9,.9])cases.push({name:pitch<0?'aim-down':'aim-up',kind:'study',pitch,pos:views[1][1],aim:views[1][2]});
 for(const tool of ['cutter','scoop','lance','resonance','gravity','axe','sling'])cases.push({name:'remote-'+tool,kind:'study',tool,pos:views[1][1],aim:views[1][2]});
 for(const view of ['front','side','strafe'])cases.push({name:'native-'+view,kind:'native',view});
 for(const tool of ['cutter','scoop','lance','resonance','gravity','axe','sling'])cases.push({name:'local-'+tool,kind:'local',tool});
 const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
 for(const f of cases.filter(f=>!only||only.includes(f.name))){
  const shot=await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE,f=${JSON.stringify(f)};v.clearMiners();g.net.members=[];let m,camera,scene;
   if(f.kind==='study'){
    m=v.makeMiner('garment',2,'Copperhead');m.root.position.set(0,0,0);m.badge.visible=false;m.field.visible=false;g._garmentStudio.scene.add(m.root);v.equipMiner(m,f.tool||'cutter');
    if(f.bend){const a=f.bend*Math.PI/180;m.legs[0].rotation.set(a*.43,0,-.04);m.knees[0].rotation.x=-a;m.feet[0].rotation.set(a*.57,.10,0);}
    if(f.elbow){m.arms[0].rotation.x=.18;m.elbows[0].rotation.x=f.elbow*Math.PI/180;}
    v.poseMinerWeapon(m,f.pitch||0);if(f.elbow){m.weapon.visible=false;m.arms[0].rotation.set(.18,0,.10);m.elbows[0].rotation.set(f.elbow*Math.PI/180,0,0);}m.root.updateMatrixWorld(true);const bottom=Math.min(...m.feet.map(n=>new T.Box3().setFromObject(n).min.y));m.root.position.y-=bottom;m.root.updateMatrixWorld(true);
    camera=g._garmentStudio.camera;camera.position.set(...f.pos);camera.lookAt(...f.aim);scene=g._garmentStudio.scene;v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;v.renderer.autoClear=true;v.renderer.render(scene,camera);
   }else if(f.kind==='native'){
    const target=new B2.Player(g.world);target.obstacles=g.player.obstacles;target.teleport(3,.06,13);target.yaw=0;for(let i=0;i<60;i++)target.step(1/120,new Set(),1.5);
    const member={id:'garment',name:'Copperhead',color:2,tool:'cutter',playing:true,player:{x:target.x,y:target.y,z:target.z,grounded:true,yaw:0,pitch:0,vx:0,vz:0}};g.net.members=[member];g._garmentNative.call(v,g,0,4);
    for(let i=0;i<84;i++){target.step(1/60,new Set([f.view==='strafe'?'KeyD':'KeyW']),1.5);Object.assign(member.player,{x:target.x,y:target.y,z:target.z,grounded:target.grounded,vx:target.vx,vz:target.vz});m=v.miners.get('garment');const r=m.root.position,o=f.view==='side'?new T.Vector3(2.65,1.4,-.3):new T.Vector3(1.35,1.4,-2.3);g.player.teleport(r.x+o.x,r.y+o.y-g.player.eye,r.z+o.z);g.player.yaw=Math.atan2(o.x,o.z);g.player.pitch=Math.atan2(.89-o.y,Math.hypot(o.x,o.z));g._garmentNative.call(v,g,1/60,4);}
    camera=v.camera;scene=v.scene;v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;g._garmentNative.call(v,g,0,4);
   }else{
    g.expedition.state.tool=f.tool;g.player.teleport(0,.1,11.5);g.player.yaw=Math.PI;g.player.pitch=-.05;g.settings.motion=false;v.gameUI.dirty=true;v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;g._garmentNative.call(v,g,0,4);camera=v.camera;scene=v.scene;
   }
   const counts={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles},inventory=m?{meshes:m.bodyMeshes.length,triangles:m.bodyMeshes.reduce((n,p)=>n+(p.geometry.index?.count||p.geometry.attributes.position.count)/3,0),materials:new Set(m.bodyMeshes.map(n=>n.material)).size,textures:m.textures.length,geometryBytes:m.bodyMeshes.reduce((sum,n)=>sum+Object.values(n.geometry.attributes).reduce((s,a)=>s+a.array.byteLength,0)+(n.geometry.index?.array.byteLength||0),0)}:null;
   const rig=m?{root:m.root.position.toArray(),hips:m.legs.map(n=>n.rotation.toArray()),knees:m.knees.map(n=>n.rotation.toArray()),arms:m.arms.map(n=>n.rotation.toArray()),elbows:m.elbows.map(n=>n.rotation.toArray()),weapon:{position:m.weapon.position.toArray(),rotation:m.weapon.rotation.toArray()},bodyBatchGroups:v.crewBatches?.length||0}:null;
   return{name:f.name,kind:f.kind,camera:{position:camera.position.toArray(),rotation:camera.rotation.toArray()},rig,inventory,counts};})()`);
  await p.shot(path.join(out,f.name+'.png'));report.shots.push(shot);if(!report.fabric){const texture=await p.eval('(()=>{const m=__buttloads.view.miners.values().next().value,t=m?.textures[0];return t?{width:t.image.width,height:t.image.height,repeat:t.repeat.toArray(),wrapS:t.wrapS,wrapT:t.wrapT,png:t.image.toDataURL()}:null;})()');if(texture){fs.writeFileSync(path.join(out,'fabric-atlas.png'),Buffer.from(texture.png.split(',')[1],'base64'));delete texture.png;report.fabric=texture;}}
 }
 const texture=await p.eval('(()=>{const m=__buttloads.view.miners.values().next().value,t=m?.textures[0];return t?{width:t.image.width,height:t.image.height,repeat:t.repeat.toArray(),wrapS:t.wrapS,wrapT:t.wrapT,png:t.image.toDataURL()}:null;})()');
 if(texture){fs.writeFileSync(path.join(out,'fabric-atlas.png'),Buffer.from(texture.png.split(',')[1],'base64'));delete texture.png;report.fabric=texture;}
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');
 if(report.errors.length||report.input.pointerLock||report.input.keys||report.input.fire)throw Error('Capture guard failed');
 console.log('CAPTURED '+report.shots.length+' garment atlas views '+label+'; visual verdict pending.');console.log(JSON.stringify(report.shots[0].inventory));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
