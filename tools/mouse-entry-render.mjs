// Guarded native rendering only: no browser input events or pointer-lock calls.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {launch,until} from './cdp.mjs';
const root=new URL('../',import.meta.url),out=new URL('./out/',import.meta.url),p=await launch({port:9499,width:1440,height:1000,gpu:true});
const results=[];
try{
 for(const [label,file]of [['before','tools/out/mouse-entry-before/build.html'],['after','dist/index.html']]){
  await p.goto(new URL(file,root).href+'?offline&mouse-entry-view');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
  const result=await p.eval(`(()=>{const g=__buttloads,render=g.view.render;g.setScreen(null);g.view.render=()=>{};g.update=()=>{};
   g.player.teleport(0,.06,11.5);g.player.yaw=Math.PI;g.player.pitch=-.05;g.accumulator=0;g.fieldKit.dismiss();
   const ui=g.view.gameUI,text=ui.text,help=[];ui.text=function(line,...args){if(/Click to look|Right-drag to turn/.test(line))help.push(line);return text.call(this,line,...args);};
   ui.dirty=true;render.call(g.view,g,1/60,5);ui.text=text;
   const gl=g.view.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');return {version:document.querySelector('meta[name=application-version]').content,help,camera:{x:g.view.camera.position.x,y:g.view.camera.position.y,z:g.view.camera.position.z,yaw:g.view.camera.rotation.y,pitch:g.view.camera.rotation.x},pointerLock:!!document.pointerLockElement,running:g.running,hardware:gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)};})()`);
  if(result.pointerLock||!result.running)throw Error('Render input isolation failed');
  await p.shot(new URL('mouse-entry-'+label+'.png',out).pathname.replace(/^\//,''));
  result.label=label;result.buildSha256=createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex');results.push(result);
 }
 if(JSON.stringify(results[0].camera)!==JSON.stringify(results[1].camera))throw Error('Matched camera changed');
 if(results[0].help.length||results[1].help.join()!=='Click to look / right-drag to turn')throw Error('Help cue render failed');
 const errors=p.logs.filter(line=>/EXCEPTION|error:/i.test(line));if(errors.length)throw Error(errors.join('\n'));
 const report={date:new Date().toISOString(),results,errors,safety:{inputEvents:false,pointerLock:false,pointerLockGuard:true,foreground:false},limitation:'Native frames verify the acquisition cue and preserved art. They do not measure physical mouse feel.'};
 fs.writeFileSync(new URL('mouse-entry-render-report.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 console.log('COMPLETE matched native mouse-entry views: same camera, cue present only after, zero errors or pointer lock.');
}finally{p.kill();}
