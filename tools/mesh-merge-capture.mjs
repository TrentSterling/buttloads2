// Matched native geometry and draw receipts, without gameplay or input.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2],build=path.resolve(root,process.argv[3]||'dist/index.html');
if(!label)throw Error('Capture label required');
const out=path.join(root,'tools/out/mesh-merge-'+label);fs.mkdirSync(out,{recursive:true});
const report={label,date:new Date().toISOString(),buildSha256:createHash('sha256').update(fs.readFileSync(build)).digest('hex'),shots:[],method:'Static rendering fixtures, same seed and fixed camera/light/time. Draw calls include shadow passes. No public network, gameplay, OS input or pointer lock.'};
const p=await launch({port:9497,width:1280,height:900,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000,label:'boot'});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._mergeRender=g.view.render;g.view.render=()=>{};g.view.renderer.info.autoReset=false;
  window._mergeCount=root=>{let meshes=0,triangles=0,vertices=0;const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),point=new THREE.Vector3();root.traverse(m=>{if(!m.isMesh)return;meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;vertices+=m.geometry.attributes.position.count;const transform=inverse.clone().multiply(m.matrixWorld),a=m.geometry.attributes.position;for(let i=0;i<a.count;i++){point.fromBufferAttribute(a,i).applyMatrix4(transform);for(let k=0;k<3;k++){min[k]=Math.min(min[k],point.getComponent(k));max[k]=Math.max(max[k],point.getComponent(k));}}});return{meshes,triangles,vertices,min,max};};return true;})()`);
 report.inventory=await p.eval(`Object.fromEntries(['fossilModel','lanternCart','fossilScene','parcelScene','cavernScene','kineticScene','tool'].map(k=>[k,_mergeCount(__buttloads.view[k])]))`);
 for(const name of ['fossil','cart','cave-fan','workshop',...['cutter','scoop','lance','resonance','gravity','axe','sling'].map(k=>'miner-'+k)]){
  const info=await p.eval(`(()=>{
   const g=__buttloads,v=g.view,T=THREE,name=${JSON.stringify(name)};let model;
   if(name.startsWith('miner-')){const m=v.makeMiner('merge-inspector',2,'Copperhead');v.equipMiner(m,name.slice(6));v.poseMinerWeapon(m,.12);m.badge.visible=false;m.field.visible=false;model=m.root;model.parent.remove(model);model.position.set(0,0,0);}
   else{const source=name==='fossil'?v.fossilModel:name==='cart'?v.lanternCart:name==='workshop'?v.workshopModel:v.caveGrowth.find(n=>n.root.userData.formation==='amethyst-fan').root;model=source.clone(true);model.visible=true;model.position.set(0,0,0);model.rotation.set(0,0,0);}
   const scene=new T.Scene();scene.background=new T.Color('#333f41');scene.add(model);scene.add(new T.HemisphereLight('#e4f0f4','#52513f',.75));
   const key=new T.DirectionalLight('#ffe6c4',2.5);key.position.set(-3,5,-4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:25});key.shadow.normalBias=.012;key.shadow.bias=-.0001;scene.add(key);
   const rim=new T.DirectionalLight('#b2d0da',1.1);rim.position.set(3,2,2);scene.add(rim);
   const shape=_mergeCount(model),bounds=new T.Box3(new T.Vector3(...shape.min),new T.Vector3(...shape.max)),center=bounds.getCenter(new T.Vector3()),radius=bounds.getSize(new T.Vector3()).length()*.5,camera=new T.PerspectiveCamera(33,1280/900,.01,60),distance=radius/Math.sin(33*Math.PI/360)*1.1;
   camera.position.copy(center).add(new T.Vector3(-.55,.23,-.8).normalize().multiplyScalar(distance));camera.lookAt(center);v.renderer.autoClear=true;v.renderer.shadowMap.needsUpdate=true;v.renderer.info.reset();v.renderer.render(scene,camera);
   const result={name,model:shape,camera:camera.position.toArray(),aim:center.toArray(),calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};
   if(name.startsWith('miner-'))v.removeMiner('merge-inspector');return result;
  })()`);
  // Pixel capture follows the completed render; no page event dispatch.
  await p.shot(path.join(out,name+'.png'));report.shots.push(info);
 }
 for(const [name,pos,yaw,pitch]of [['yard',[0,.1,11.5],0,-.12],['parcel',[33,.1,7],0,.035]]){
  const data=await p.eval(`(()=>{const g=__buttloads,v=g.view;g.player.teleport(${pos});g.player.yaw=${yaw};g.player.pitch=${pitch};v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;g._mergeRender.call(v,g,0,0);const refresh={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.reset();g._mergeRender.call(v,g,0,0);return{name:${JSON.stringify(name)},refresh,calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};})()`);
  await p.shot(path.join(out,name+'.png'));report.shots.push(data);
 }
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.input=await p.eval('({pointerLocked:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');
 if(report.errors.length||report.input.pointerLocked||report.input.keys||report.input.fire)throw Error('Static isolation failed');
 console.log(JSON.stringify({version:report.version,inventory:report.inventory,draws:report.shots.map(s=>[s.name,s.calls,s.triangles])}));
 console.log('COMPLETE 13 native mesh merge views '+label);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
