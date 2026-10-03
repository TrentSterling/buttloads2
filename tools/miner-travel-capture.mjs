// Fixed native scene samples. Never dispatches browser or OS input.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2];
if(!/^[a-z0-9-]+$/.test(label||''))throw Error('Expected a safe label');
const out=path.join(root,'tools/out/miner-travel-'+label),build=path.join(out,'index.html');fs.mkdirSync(out,{recursive:true});
if(label!=='before')fs.copyFileSync(path.join(root,'dist/index.html'),build);
const report={date:new Date().toISOString(),label,buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),method:'Fixed native rendering with inert co-op targets and pure Player support replay. Zero-time presentation renders retain the last moving travel pose. No input events, networking, activation or timing.',preserveMovingPose:true,shots:[]};
const p=await launch({port:9668,width:1440,height:1000,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.running=false;g.update=()=>{};g.advanceSimulation=()=>{};g.setScreen(null);g.settings.motion=true;g._motionNative=v.render;v.render=()=>{};const travel=v.poseMinerTravel;v.poseMinerTravel=function(m,target,world,dt,animated,reset){if(dt===0&&m.gait&&!reset)return;return travel.call(this,m,target,world,dt,animated,reset);};const render=v.renderer.render.bind(v.renderer);v.renderer.render=(scene,camera)=>{if(scene!==v.toolScene)render(scene,camera);};v.gameUI.ctx.clearRect(0,0,innerWidth,innerHeight);v.gameUI.render=()=>{};v.windUniform.value=0;v.skyDome.material.uniforms.windTime.value=0;v.renderer.info.autoReset=false;return true;})()`);
 const frames=[84,87,90,93,96,99,102,105];
 const cases=[{name:'walk-front',view:'front',keys:['KeyW'],frames},{name:'walk-side',view:'side',keys:['KeyW'],frames},{name:'strafe',view:'front',keys:['KeyD'],frames},{name:'stop',view:'front',keys:['KeyW'],stop:75,frames:[72,96,132,180]},{name:'strafe-reversal',view:'front',keys:['KeyD'],reverse:60,frames:[57,63,72,84]},{name:'strafe-stop',view:'front',keys:['KeyD'],stop:75,frames:[72,96,132,180]},...['cutter','scoop','lance','resonance','gravity','axe','sling'].map(tool=>({name:'tool-'+tool,tool,view:'front',keys:['KeyW'],frames:[84],fire:true}))];
 const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
 for(const fixture of cases.filter(f=>!only||only.includes(f.name))){
  await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE,f=${JSON.stringify(fixture)};v.clearMiners();const player=new B2.Player(g.world);player.obstacles=g.player.obstacles;player.teleport(3,.06,13);player.yaw=0;for(let i=0;i<60;i++)player.step(1/120,new Set(),1.5);const member={id:'motion',name:'Copperhead',color:1,tool:f.tool||'cutter',fire:!!f.fire,playing:true,sling:{charge:.55},player:{x:player.x,y:player.y,z:player.z,grounded:true,yaw:0,pitch:f.fire?.22:0,vx:0,vz:0}};g.net={role:'receipt',members:[member],count:2,tick(){},stepRemotes(){}};g._motionFixture={f,player,member,frame:0};g.player.teleport(5,0,10);g.player.yaw=0;g.player.pitch=0;g._motionNative.call(v,g,0,4);v.miners.get('motion').root.rotation.y=0;return true;})()`);
  for(const frame of fixture.frames){
   const s=await p.eval(`(()=>{const g=__buttloads,v=g.view,T=THREE,{f,player,member}=g._motionFixture,s=g._motionFixture;
    while(s.frame<${frame}){const keys=new Set(f.stop&&s.frame>=f.stop?[]:f.reverse&&s.frame>=f.reverse?['KeyA']:f.keys);player.step(1/60,keys,1.5);if(!player.grounded||player.blocked(player.x,player.y,player.z))throw Error('Unsupported receipt path');Object.assign(member.player,{x:player.x,y:player.y,z:player.z,vx:player.vx,vz:player.vz,grounded:player.grounded});
     const m=v.miners.get('motion'),r=m.root.position;const offset=f.view==='side'?new T.Vector3(2.65,1.4,-.3):new T.Vector3(1.35,1.4,-2.3);g.player.teleport(r.x+offset.x,r.y+offset.y-g.player.eye,r.z+offset.z);g.player.yaw=Math.atan2(offset.x,offset.z);g.player.pitch=Math.atan2(.89-offset.y,Math.hypot(offset.x,offset.z));g._motionNative.call(v,g,1/60,4);s.frame++;
    }
    v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;g._motionNative.call(v,g,0,4);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();g._motionNative.call(v,g,0,4);const cached={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};const m=v.miners.get('motion'),wp=n=>n.getWorldPosition(new T.Vector3()).toArray(),model=m.weapon.children[0],point=m.tool==='gravity'?new T.Vector3(0,-.168,.04):m.tool==='axe'?new T.Vector3(-.01,-.13,.022):m.tool==='sling'?new T.Vector3(0,-.11,.024):new T.Vector3(0,-.22,.096);model.localToWorld(point);const palm=m.elbows[1].localToWorld(new T.Vector3(0,-.265,-.01));
    return{name:f.name+'-'+String(${frame}).padStart(3,'0'),sequence:f.name,frame:${frame},tool:m.tool,camera:{position:v.camera.position.toArray(),rotation:v.camera.rotation.toArray()},authoritative:{x:player.x,y:player.y,z:player.z,grounded:player.grounded,clear:!player.blocked(player.x,player.y,player.z),supported:player.blocked(player.x,player.y-.06,player.z)},root:m.root.position.toArray(),feet:m.feet.map(wp),knees:m.knees.map(wp),hips:m.legs.map(wp),soleUp:m.feet.map(n=>new T.Vector3(0,1,0).applyQuaternion(n.getWorldQuaternion(new T.Quaternion())).toArray()),torso:{position:m.torso.position.toArray(),rotation:m.torso.rotation.toArray()},gripDistance:palm.distanceTo(point),gait:m.gait?{phase:m.gait.phase,speed:m.gait.speed,weight:m.gait.weight,feet:m.gait.feet.map(f=>({position:f.position.toArray(),swing:f.swing,settling:f.settling}))}:null,cached,refresh,bodyMeshes:m.bodyMeshes.length,weaponMeshes:m.weaponMeshes.length,ownedMaterials:m.weaponMaterials.length};})()`);
   await p.shot(path.join(out,s.name+'.png'));report.shots.push(s);
  }
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');
 if(report.errors.length||report.input.pointerLock||report.input.keys||report.input.fire)throw Error('Static capture guard failed');
 console.log('COMPLETE '+report.shots.length+' native miner motion frames '+label);console.log(JSON.stringify({version:report.version,maxGripDistance:Math.max(...report.shots.map(s=>s.gripDistance)),maxCalls:Math.max(...report.shots.map(s=>s.cached.calls))}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
