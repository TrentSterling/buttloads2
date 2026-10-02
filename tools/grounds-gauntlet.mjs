// Render inspection only. No input events, browser activation or pointer lock.
import {launch,until,sleep} from './cdp.mjs';
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),round=process.argv[2]||'01',build=process.argv[3]||'dist/index.html',out=path.join(root,'tools/out','grounds-'+round);fs.mkdirSync(out,{recursive:true});
const p=await launch({port:9496,width:1440,height:1000,gpu:true}),report={round,build,buildSha256:createHash('sha256').update(fs.readFileSync(path.resolve(root,build))).digest('hex'),viewport:[1440,1000],visualVerdict:'UNREVIEWED',date:new Date().toISOString(),shots:[]};
try{
 await p.goto(pathToFileURL(path.resolve(root,build)).href+'?offline&grounds-inspection');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval('(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._groundsRender=g.view.render;g.view.render=()=>{};return true;})()');
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 for(const [name,x,y,z,yaw,pitch,powered]of [
  ['well-close',7.2,.06,43.9,2.333,-.21,false],['well-interior',5,2.1,44,Math.PI,-1.05,false],
  ['bench-front',6.5,.06,44,.785,-.36,false],['bench-side',8,.06,42.5,Math.PI/2,-.23,false],
  ['grove',-34,null,24,1.8,.12,false],['grove-wide',-37,null,28,.876,.02,false],
  ['reservoir',40,null,39,-2.98,.25,false],['well-powered',7.2,.06,43.9,2.333,-.21,true]
 ]){
  const draw=await p.eval(`(()=>{const g=__buttloads,v=g.view;g.foreman.state.defeated=${powered};g.player.teleport(${x},${y===null?`B2.COMMON.height(${x},${z})+.06`:y},${z});g.player.yaw=${yaw};g.player.pitch=${pitch};v.renderer.shadowMap.needsUpdate=true;v.renderer.info.autoReset=false;v.renderer.info.reset();g._groundsRender.call(v,g,0,10);return{calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};})()`);
  await sleep(60);await p.shot(path.join(out,name+'.png'));report.shots.push({name,poweredFixture:powered,elevatedFixture:name==='well-interior',...draw});
 }
 report.inventory=await p.eval(`(()=>{const v=__buttloads.view;return ['commonScene','townScene','ridgeline','furnitureScene'].map(key=>{let meshes=0,triangles=0;v[key]?.traverse(o=>{if(o.geometry){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});return{key,meshes,triangles};});})()`);
 report.runtimeErrors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.pointerLocked=await p.eval('!!document.pointerLockElement');if(report.runtimeErrors.length||report.pointerLocked)throw Error(JSON.stringify(report));
 console.log(JSON.stringify({round,version:report.version,shots:report.shots.length,inventory:report.inventory,runtimeErrors:report.runtimeErrors,pointerLocked:report.pointerLocked}));
}finally{fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2));p.kill();}
