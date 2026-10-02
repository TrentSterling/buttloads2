// Rendering receipts only. Visual acceptance is recorded separately after inspection.
// Headless, isolated profile, no foregrounding, OS input or pointer lock.
import {launch, sleep, until} from './cdp.mjs';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),round=process.argv[2]||'01';
const out=path.join(root,'tools/out','art-'+round);fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const p=await launch({port:9486,width:1280,height:900,gpu:true}),report={round,visualVerdict:'UNREVIEWED',shots:[]};
try{
 await p.goto(`http://127.0.0.1:${server.address().port}/${process.argv.includes('--before')?'tools/out/hard-art-before/build.html':''}?offline&seed=260923`);
 await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000,label:'game boot'});
 await p.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._artRender=g.view.render;g.view.render=()=>{};document.getElementById('hud')?.style.setProperty('display','none');
  const m=g.view.makeMiner('art-fixture',2,'Copperhead');m.root.position.set(0,0,0);m.badge.visible=false;m.field.visible=false;g.view.equipMiner(m,'cutter');m.arms[1].rotation.x=.58;m.weapon.rotation.y=-.06;g.view.poseMinerGrip?.(m);
  const s=new THREE.Scene();s.background=new THREE.Color('#333f41');s.fog=new THREE.Fog('#333f41',12,30);s.add(m.root);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:new THREE.Color('#6a7166').convertSRGBToLinear(),roughness:1}));plane.rotation.x=-Math.PI/2;plane.receiveShadow=true;s.add(plane);
  s.add(new THREE.HemisphereLight('#e4f0f4','#52513f',.75));const key=new THREE.DirectionalLight('#ffe6c4',2.5);key.position.set(-3,5,-4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:15});key.shadow.normalBias=.012;key.shadow.bias=-.0001;s.add(key);
  const rim=new THREE.DirectionalLight('#b2d0da',1.1);rim.position.set(3,2,2);s.add(rim);const camera=new THREE.PerspectiveCamera(33,1280/900,.01,50);g._art={s,camera,m};return true;})()`);
 for(const [name,pos,aim] of [
  ['miner-front',[0,1.17,-3.8],[0,.94,0]],['miner-quarter',[-2.8,1.5,-2.8],[0,1,0]],
  ['miner-profile',[-3.8,1.27,0],[0,.96,0]],['miner-back',[1.8,1.45,3.35],[0,1,0]],
  ['miner-face',[-.4,1.67,-1.2],[0,1.52,0]],
 ]){
  await p.eval(`(()=>{const g=__buttloads,a=g._art;a.camera.position.set(${pos});a.camera.lookAt(${aim});g.view.renderer.shadowMap.needsUpdate=true;g.view.renderer.autoClear=true;g.view.renderer.render(a.s,a.camera);return true;})()`);
  await sleep(80);await p.shot(path.join(out,name+'.png'));report.shots.push(name);
 }
 for(const key of ['cutter','scoop','lance','resonance','gravity','axe','sling']){
  await p.eval(`(()=>{const g=__buttloads,a=g._art;g.view.equipMiner(a.m,'${key}');g.view.poseMinerGrip?.(a.m);a.camera.position.set(-2.8,1.5,-2.8);a.camera.lookAt(0,1,0);g.view.renderer.shadowMap.needsUpdate=true;g.view.renderer.autoClear=true;g.view.renderer.render(a.s,a.camera);return true;})()`);
  await sleep(60);await p.shot(path.join(out,'remote-'+key+'.png'));report.shots.push('remote-'+key);
 }
 await p.eval(`(()=>{const g=__buttloads;g.view.equipMiner(g._art.m,'cutter');g.view.poseMinerGrip?.(g._art.m);return true;})()`);
 if(!process.argv.includes('--before'))for(const [name,pitch]of [['aim-down',-.9],['aim-up',.9]]){
  await p.eval(`(()=>{const g=__buttloads,a=g._art;g.view.poseMinerWeapon(a.m,${pitch});a.camera.position.set(-2.8,1.5,-2.8);a.camera.lookAt(0,1,0);g.view.renderer.shadowMap.needsUpdate=true;g.view.renderer.autoClear=true;g.view.renderer.render(a.s,a.camera);return true;})()`);
  await sleep(60);await p.shot(path.join(out,name+'.png'));report.shots.push(name);
 }
 await p.eval('(()=>{const g=__buttloads;g.view.poseMinerWeapon?.(g._art.m,0);return true;})()');
 await p.eval(`(()=>{const g=__buttloads,target=new B2.Player(g.world);target.teleport(0,.1,5.8);for(let i=0;i<180;i++)target.step(1/120,new Set(),6);g._art.m.root.position.set(0,g.view.minerFloor?.(g._art.m,target,g.world)??target.y,5.8);g._art.m.root.rotation.y=Math.PI;g._art.m.badge.visible=true;g.view.scene.add(g._art.m.root);g._art.fixtureFeetY=target.y;return true;})()`);
 for(const [name,pos,yaw,pitch] of [
  ['miner-game',[0,.1,9],0,-.04],['yard',[0,.1,11.5],0,-.35],
  ['depot',[0,.1,13],Math.PI,-.05],['town',[5,.1,28],2.7,-.06],
  ['yard-wide',[7,6,6],2.62,-.31],['hopper',[-7,.1,13],Math.PI,-.06],['headframe',[16,.1,9],2.42,.28],
 ]){
  await p.eval(`(()=>{const g=__buttloads;g.player.teleport(${pos});g.player.yaw=${yaw};g.player.pitch=${pitch};g.view.renderer.shadowMap.needsUpdate=true;g._artRender.call(g.view,g,0,0);return true;})()`);
  await sleep(80);await p.shot(path.join(out,name+'.png'));report.shots.push(name);
 }
 for(const key of ['cutter','scoop','lance','resonance','gravity','axe','sling']){
  await p.eval(`(()=>{const g=__buttloads;g.expedition.state.tool='${key}';g.player.teleport(0,.1,11.5);g.player.yaw=0;g.player.pitch=-.35;g.view.gameUI.dirty=true;g._artRender.call(g.view,g,0,.2);return true;})()`);
  await sleep(60);await p.shot(path.join(out,'local-'+key+'.png'));report.shots.push('local-'+key);
 }
 report.grounding=await p.eval(`(()=>{const g=__buttloads,m=g._art.m,r=new THREE.Raycaster(new THREE.Vector3(0,3,5.8),new THREE.Vector3(0,-1,0)),hits=r.intersectObjects(g.view.terrain.children);m.root.updateMatrixWorld(true);const boots=m.feet||m.legs;return{terrainY:hits[0]?.point.y,physicalFeetY:g._art.fixtureFeetY,minerBottom:Math.min(...boots.map(f=>new THREE.Box3().setFromObject(f).min.y))};})()`);
 report.runtimeErrors=p.logs.filter(s=>/EXCEPTION|error/i.test(s));report.pointerLocked=await p.eval('!!document.pointerLockElement');
 if(report.runtimeErrors.length||report.pointerLocked)throw Error(JSON.stringify(report));
 console.log(`CAPTURED ${report.shots.length} art views. Visual verdict: UNREVIEWED. Runtime errors: 0. Pointer lock: false.`);
}finally{fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2));p.kill();server.close();}
