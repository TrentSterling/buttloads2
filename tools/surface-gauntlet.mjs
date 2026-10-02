// Isolated rendering and scene inventory only. No events, focus or pointer lock.
import {launch,until,sleep} from './cdp.mjs';
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),round=process.argv[2]||'01',out=path.join(root,'tools/out','surface-'+round),build=process.argv[3]||'dist/index.html';fs.mkdirSync(out,{recursive:true});
const p=await launch({port:9496,width:1440,height:1000,gpu:true}),report={round,build,viewport:[1440,1000],visualVerdict:'UNREVIEWED',shots:[],date:new Date().toISOString()};
try{
 await p.goto(pathToFileURL(path.resolve(root,build)).href+'?offline&surface-inspection');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval('(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._surfaceRender=g.view.render;g.view.render=()=>{};return true;})()');
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 for(const [name,x,y,z,yaw,pitch]of [['arrival',4,.06,25,Math.PI,.04],['supply',-14,.06,27.5,-2.61,.12],['workshop',13,.06,28,-2.56,.12],['well',8,.06,44,1.1,.04],['grove',-34,null,24,1.8,.12],['reservoir',40,null,39,-2.98,.25],['yard-wide',7,6,6,2.62,-.31],['north-ridge',0,.06,-12,0,.06]]){
  const draw=await p.eval(`(()=>{const g=__buttloads,v=g.view;g.player.teleport(${x},${y===null?`B2.COMMON.height(${x},${z})+.06`:y},${z});g.player.yaw=${yaw};g.player.pitch=${pitch};v.renderer.shadowMap.needsUpdate=true;v.renderer.info.autoReset=false;v.renderer.info.reset();g._surfaceRender.call(v,g,0,10);return{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};})()`);
  await sleep(60);await p.shot(path.join(out,name+'.png'));report.shots.push({name,...draw});
 }
 report.inventory=await p.eval(`(()=>{const v=__buttloads.view;return ['commonScene','townScene','ridgeline'].map(key=>{let meshes=0,triangles=0;v[key]?.traverse(o=>{if(o.geometry){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});return{key,meshes,triangles};});})()`);
 report.runtimeErrors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.pointerLocked=await p.eval('!!document.pointerLockElement');if(report.runtimeErrors.length||report.pointerLocked)throw Error(JSON.stringify(report));
 console.log(JSON.stringify({round,version:report.version,shots:report.shots.length,inventory:report.inventory,runtimeErrors:report.runtimeErrors,pointerLocked:report.pointerLocked}));
}finally{fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2));p.kill();}
