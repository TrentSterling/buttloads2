// Fixed guest presentation through page evaluation. No input or live transport.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const label=process.argv[2];assert.ok(['before','after'].includes(label));
const root=new URL('../',import.meta.url),out=new URL('out/guest-contact-'+label+'/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const build=new URL(label==='before'?'tools/out/frame-cost-before/build.html':'dist/index.html',root);
const sha=v=>createHash('sha256').update(v).digest('hex');
const report={date:new Date().toISOString(),label,buildSha256:sha(fs.readFileSync(build)),shots:[],method:'Fixed native guest prediction at rest, inert transport, no input events or held input; not a public gameplay or performance test.'};
const p=await launch({port:9567,width:1440,height:1000,gpu:true});
try{
  await p.goto(pathToFileURL(build.pathname.replace(/^\//,'')).href+'?offline&seed=260923');
  await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
  report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
  await p.eval(`(()=>{const g=__buttloads,v=g.view;g.advanceSimulation=()=>{};g._contactRender=v.render;v.render=()=>{};g.setScreen(null);g.settings.motion=false;g.clock=0;g.net.role='guest';g.net.ready=true;g.net.serverPose=null;return true;})()`);
  const poses=[['claim','g.player.teleport(0,.06,11.5);g.player.pitch=-.35;'],['common','g.player.teleport(24,B2.COMMON.height(24,11.5)+.08,11.5);g.player.pitch=-1.2;'],['air','g.player.teleport(0,.06,11.5);g.player.pitch=1.54;']];
  for(const [name,setup]of poses){
    const state=await p.eval(`(()=>{const g=__buttloads,v=g.view;g.clearInput();${setup}g.player.yaw=0;g.net.updateGuest(0);v.wind={x:0,z:0,time:0};v.windUniform.value=0;v.skyDome.material.uniforms.windTime.value=0;Object.assign(v.feel,{phase:0,swayX:0,swayY:0,land:0,vy:0,equip:0,yaw:0,pitch:g.player.pitch});v.gameUI.age=0;v.gameUI.dirty=true;v.renderer.info.autoReset=false;v.renderer.info.reset();v.renderer.shadowMap.needsUpdate=true;g._contactRender.call(v,g,0,0);return{name:${JSON.stringify(name)},player:{...g.player.position,yaw:g.player.yaw,pitch:g.player.pitch},camera:v.camera.position.toArray(),rotation:v.camera.rotation.toArray(),contact:g.cutter.contact,contactText:document.getElementById('contact').textContent,edited:g.cutter.edited,calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,input:{pointerLock:!!document.pointerLockElement,keys:g.input.keys.size,fire:g.input.fire}};})()`);
    assert.deepEqual(state.input,{pointerLock:false,keys:0,fire:false});assert.equal(state.edited,false);
    if(label==='after'&&name==='claim')assert.equal(state.contactText,'Topsoil');
    if(name==='common')assert.equal(state.contact.protected,true);
    if(name==='air')assert.equal(state.contact,null);
    await p.shot(new URL(name+'.png',out).pathname.replace(/^\//,''));report.shots.push(state);
  }
  report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));assert.deepEqual(report.errors,[]);
  fs.writeFileSync(new URL('report.json',out),JSON.stringify(report,null,2));
  if(label==='after'){
    const before=JSON.parse(fs.readFileSync(new URL('../guest-contact-before/report.json',out)));
    for(const s of report.shots){const old=before.shots.find(o=>o.name===s.name);for(const k of ['player','camera','rotation','calls','triangles','input'])assert.deepEqual(s[k],old[k],s.name+' '+k);}
  }
  console.log('COMPLETE three fixed native guest contact views '+label+'; zero held input or errors.');
}finally{p.kill();}
