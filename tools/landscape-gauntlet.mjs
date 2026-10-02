// Matched walking-height landscape captures. Page evaluation only; no input/focus.
import {launch,until,sleep} from './cdp.mjs';
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),round=process.argv[2]||'01',build=process.argv[3]||'dist/index.html',out=path.join(root,'tools/out','landscape-'+round);fs.mkdirSync(out,{recursive:true});
const p=await launch({port:9496,width:1440,height:1000,gpu:true}),report={round,build,buildSha256:createHash('sha256').update(fs.readFileSync(path.resolve(root,build))).digest('hex'),viewport:[1440,1000],date:new Date().toISOString(),shots:[]};
try{
 await p.goto(pathToFileURL(path.resolve(root,build)).href+'?offline&seed=260923&landscape-inspection');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 await p.eval('(()=>{const g=__buttloads;g.setScreen(null);g.running=false;g.settings.motion=false;g._landscapeRender=g.view.render;g.view.render=()=>{};return true;})()');
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 const tree=await p.eval('__buttloads.view.commonTrees.filter(t=>t.conifer).sort((a,b)=>Math.hypot(a.x+43,a.z-20)-Math.hypot(b.x+43,b.z-20))[0]');
 const shots=[
  ['conifer',tree.x+5,tree.z+5,tree.x,tree.z,tree.y+tree.height*.55,false],
  ['grove',-34,24,-43,26,null,false],['west-slope',-30,4,-43,23,null,false],
  ['north-slope',4,-29,27,-41,null,false],['outcrop',-42.5,20,-46,25,null,false],
  ['reservoir',40,39,42,51,null,false],['flowers',.2,33.7,-1,36,.45,false],
  ['flower-bed',-16.1,40.5,-18,43,.45,false],['well',7.2,43.9,5,46,.95,false],
  ['well-powered',7.2,43.9,5,46,.95,true],['workshop',13,28,19,33.2,2.5,false],
  ['town-wide',4,25,5,45,1.6,false]
 ];
 for(const [name,x,z,tx,tz,targetY,powered]of shots){
  const draw=await p.eval(`(()=>{const g=__buttloads,v=g.view,y=B2.COMMON.height(${x},${z})+.06,focus=${targetY===null?`B2.COMMON.height(${tx},${tz})+${name==='outcrop'?.95:name==='reservoir'?8:1.8}`:targetY};g.foreman.state.defeated=${powered};g.player.teleport(${x},y,${z});g.player.yaw=Math.atan2(${x-tx},${z-tz});g.player.pitch=Math.atan2(focus-g.player.head.y,Math.hypot(${tx-x},${tz-z}));v.renderer.shadowMap.needsUpdate=true;v.renderer.info.autoReset=false;v.renderer.info.reset();g._landscapeRender.call(v,g,0,10);return{camera:{x:${x},y,z:${z},yaw:g.player.yaw,pitch:g.player.pitch},calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};})()`);
  await sleep(60);await p.shot(path.join(out,name+'.png'));report.shots.push({name,poweredFixture:powered,...draw});
 }
 report.inventory=await p.eval(`(()=>{const v=__buttloads.view;return ['commonScene','verge','townScene','ridgeline','commonBeacon'].map(key=>{let meshes=0,triangles=0;v[key]?.traverse(o=>{if(o.geometry){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});return{key,meshes,triangles};});})()`);
 report.runtimeErrors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));report.pointerLocked=await p.eval('!!document.pointerLockElement');if(report.runtimeErrors.length||report.pointerLocked)throw Error(JSON.stringify(report));
 console.log(JSON.stringify({round,version:report.version,shots:report.shots.length,inventory:report.inventory,runtimeErrors:report.runtimeErrors,pointerLocked:report.pointerLocked}));
}finally{fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2));p.kill();}
