// Static model observations only: no browser input, focus, pointer lock or timing claims.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {launch,until} from './cdp.mjs';
const root=path.resolve(import.meta.dirname,'..'),label=process.argv[2];
assert.ok(['before','after'].includes(label));
const build=path.join(root,label==='before'?'tools/out/hud-writes-before/index.html':'dist/index.html');
const out=path.join(root,'tools/out/hud-writes-'+label);fs.mkdirSync(out,{recursive:true});
const sha=v=>createHash('sha256').update(v).digest('hex');
const report={date:new Date().toISOString(),label,buildSha256:sha(fs.readFileSync(build)),samples:[],scope:'120 repeated native HUD model updates per state, MutationObserver operation counts. Static direct evaluation, no input or FPS claim.'};
const p=await launch({port:9536,width:1440,height:1000,gpu:true});
try{
 await p.goto(pathToFileURL(build).href+'?offline&seed=260923');
 await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 report.version=await p.eval('document.querySelector("meta[name=application-version]").content');
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.advanceSimulation=()=>{};g._hudRender=v.render;v.render=()=>{};g.setScreen(null);g.running=true;g.settings.motion=false;g.clock=0;g.player.teleport(0,.06,13);g.player.yaw=Math.PI;g.player.pitch=-.08;v.wind={x:0,z:0,time:0};window._hudSnapshot=()=>Array.from(document.querySelectorAll('[id]')).filter(n=>!['SCRIPT','STYLE'].includes(n.tagName)).map(n=>({id:n.id,tag:n.tagName,attributes:Array.from(n.attributes).map(a=>[a.name,a.value]).sort(),html:n.querySelector('[id]')||n.tagName==='CANVAS'?null:n.innerHTML}));return true;})()`);
 const states=[
  ['fresh',''],
  ['partial-cargo','g.economy.collect(0);g.economy.state.cash=144;'],
  ['field-tip','g.economy.state.mined=1;'],
  ['full-cargo','while(g.economy.count<g.economy.capacity)g.economy.collect(0);'],
  ['workshop','g.player.teleport(0,.06,18.6);'],
  ['unlocks','g.player.teleport(0,.06,13);g.economy.state.deepest=60;g.expedition.state.recovered=[0,1];g.expedition.state.awakened=true;g.expedition.state.tool="resonance";g.expedition.state.chargeMode="sticky";'],
  ['charge','g.input.aim="bomb";g.expedition.charge=.375;g.combat.state.health=73;g.combat.hurtFlash=.2;g.combat.hitFlash=.1;g.recallTime=.5;'],
  ['sling','g.expedition.state.tool="sling";g.kinetics.state.held=0;g.kinetics.obstruction=true;g.kinetics.state.charge=.3;'],
  ['freight','g.input.aim="freight";g.freightPreview={reason:"Release to place / freight route clear"};']
 ];
 for(const [name,setup]of states){
  const result=await p.eval(`(()=>{const g=__buttloads;${setup}g.updateHUD();g.updateHUD();const initial=_hudSnapshot(),observer=new MutationObserver(()=>{}),counts={},nodes={},children=new Map();document.querySelectorAll('[id]').forEach(n=>children.set(n,n.firstChild));observer.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});for(let i=0;i<120;i++){g.updateHUD();for(const m of observer.takeRecords()){counts[m.type]=(counts[m.type]||0)+1;const id=m.target.id||m.target.parentElement?.id||m.target.tagName;nodes[id]=(nodes[id]||0)+1;}}observer.disconnect();return{counts,nodes,stableChildren:Array.from(children).filter(([n,c])=>c&&n.firstChild===c).length,snapshot:_hudSnapshot(),initial,guide:JSON.parse(JSON.stringify(g.guide.state)),revision:g.revision};})()`);
  assert.deepEqual(result.initial,result.snapshot,name+' repeated model must remain semantically stable');delete result.initial;
  if(label==='after')assert.equal(Object.values(result.counts).reduce((a,b)=>a+b,0),0,name+' unchanged model must perform zero mutations');
  if(name==='field-tip'){assert.ok(!result.snapshot.find(n=>n.id==='field-tip').attributes.some(([key])=>key==='hidden'));assert.equal(result.snapshot.find(n=>n.id==='tip-title').html,'Follow a vein');}
  const {snapshot,...summary}=result;
  fs.writeFileSync(path.join(out,name+'-dom.json'),JSON.stringify(snapshot,null,2));
  report.samples.push({name,...summary,snapshotSha256:sha(JSON.stringify(snapshot))});
 }
 // Render the same native yard camera after the model observations.
 await p.eval(`(()=>{const g=__buttloads,v=g.view;g.input.aim=null;g.recallTime=0;g.combat.state.health=100;g.combat.hurtFlash=0;g.combat.hitFlash=0;g.expedition.state.tool='cutter';g.player.teleport(0,.06,13);g.player.yaw=Math.PI;g.player.pitch=-.08;Object.assign(v.feel,{phase:0,swayX:0,swayY:0,land:0,vy:0,equip:0,yaw:g.player.yaw,pitch:g.player.pitch});g.updateHUD();v.gameUI.dirty=true;v.renderer.shadowMap.needsUpdate=true;g._hudRender.call(v,g,0,0);return true;})()`);
 await p.shot(path.join(out,'yard.png'));
 report.input=await p.eval('({pointerLock:!!document.pointerLockElement,keys:__buttloads.input.keys.size,fire:__buttloads.input.fire})');
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.input,{pointerLock:false,keys:0,fire:false});
 if(label==='after'){
  const before=JSON.parse(fs.readFileSync(path.join(root,'tools/out/hud-writes-before/report.json')));
  for(const sample of report.samples){const prior=before.samples.find(s=>s.name===sample.name);assert.equal(sample.snapshotSha256,prior.snapshotSha256,sample.name+' native DOM output');assert.deepEqual(sample.guide,prior.guide);}
 }
 console.log(JSON.stringify({label,version:report.version,samples:report.samples.map(s=>({name:s.name,counts:s.counts,stableChildren:s.stableChildren}))}));
 console.log('COMPLETE nine native static HUD model observations '+label);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));p.kill();}
