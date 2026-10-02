import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,D=B2.DOM;
export let hudWriteChecks=0;
const test=(name,fn)=>{fn();hudWriteChecks++;console.log('PASS HUD model: '+name);};
const original={hud:g.updateHUD,combat:g.updateCombatHUD,sync:g.fieldKit.sync};
const legacy=vm.runInThisContext(fs.readFileSync(new URL('fixtures/hud-model-2.43.1.js',import.meta.url),'utf8'));
const legacySync=legacy.sync;
const model=()=>[...h.elements, ...[...g.fieldKit.rows].map(([id,row])=>['row-'+id,row])].map(([id,n])=>({id,text:String(n.textContent??''),html:String(n.innerHTML??''),hidden:!!n.hidden,disabled:!!n.disabled,title:String(n.title??''),attributes:[...n.attributes].sort(),classes:['selected','locked','cutting','hit-confirm'].filter(c=>n.classList.contains(c)),style:Object.entries(n.style).filter(([,v])=>typeof v!=='function').sort()}));
function useLegacy(on){g.updateHUD=on?legacy.updateHUD:original.hud;g.updateCombatHUD=on?legacy.updateCombatHUD:original.combat;g.fieldKit.sync=on?legacySync:original.sync;}
try{
 test('changing economy, tools, combat, aim, recall and prompts match the frozen model immediately',()=>{
  g.running=true;g.clock=0;
  const changes=[()=>{},()=>g.economy.collect(0),()=>g.economy.state.cash=144,()=>{while(g.economy.count<g.economy.capacity)g.economy.collect(0);},()=>g.player.teleport(0,.06,18.6),()=>{g.economy.state.deepest=60;g.expedition.state.recovered=[0,1];g.expedition.state.awakened=true;},()=>g.expedition.state.tool='resonance',()=>g.expedition.charge=.37,()=>{g.combat.state.health=73;g.combat.hurtFlash=.2;g.combat.hitFlash=.1;},()=>{g.input.aim='bomb';g.expedition.state.chargeMode='sticky';},()=>{g.recallTime=.5;g.scanUntil=10;g.pickupUntil=10;},()=>{g.expedition.state.tool='sling';g.kinetics.state.held=0;g.kinetics.obstruction=true;g.kinetics.state.charge=.3;},()=>{g.input.aim='freight';g.freightPreview={reason:'Release to place / freight route clear'};},()=>{g.input.aim=null;g.recallTime=0;g.expedition.state.tool='axe';g.crawlers.state.impactHead=true;},()=>{g.economy.sell();g.player.teleport(0,.06,13);g.scanUntil=0;g.guide.state.done=[];}];
  changes.push(()=>{g.economy.state.mined=1;g.guide.state.done=[];g.settings.tips=true;},()=>g.fieldKit.dismiss());
  for(let i=0;i<changes.length;i++){changes[i]();useLegacy(true);g.updateHUD();const expected=model(),guide=JSON.stringify(g.guide.state);useLegacy(false);g.updateHUD();assert.deepEqual(model(),expected,'transition '+i);assert.equal(JSON.stringify(g.guide.state),guide);}
 });
 test('unchanged production HUD, including sling and freight overrides, performs zero setters',()=>{
  let writes=0;
  for(const n of [...h.elements.values(),...g.fieldKit.rows.values(),document.body]){
   for(const key of ['textContent','innerHTML','hidden','disabled','title']){let value=n[key];Object.defineProperty(n,key,{configurable:true,get(){return value;},set(v){writes++;value=v;}});}
   for(const name of ['setAttribute']){const fn=n[name];n[name]=function(...a){writes++;return fn.apply(this,a);};}
   const toggle=n.classList.toggle;n.classList.toggle=(...a)=>{writes++;return toggle(...a);};
   n.style=new Proxy(n.style,{set(t,key,v){writes++;t[key]=v;return true;}});
  }
  for(const [tool,aim]of [['cutter',null],['resonance','bomb'],['sling',null],['sling','freight']]){g.expedition.state.tool=tool;g.input.aim=aim;g.updateHUD();writes=0;for(let i=0;i<120;i++)g.updateHUD();assert.equal(writes,0,tool+'/'+aim);}
 });
 test('external DOM edits are repaired on the next model update',()=>{
  g.updateHUD();const expected=model();
  h.elements.get('cash').textContent='wrong';h.elements.get('cargo').innerHTML='wrong';h.elements.get('cargo-bar').style.width='99%';h.elements.get('tool-readout').style.setProperty('--tool-color','pink');h.elements.get('tool-sling').setAttribute('aria-pressed','false');h.elements.get('tool-sling').disabled=true;h.elements.get('tool-sling').classList.toggle('selected',false);
  g.updateHUD();assert.deepEqual(model(),expected);
 });
 test('HTML entity and CSS normalization do not cause repeated writes or stale output',()=>{
  let html='',width='',writes=0;
  const n={get innerHTML(){return html;},set innerHTML(v){writes++;html=v.replace(/&(?!amp;)/g,'&amp;');},style:{get width(){return width;},set width(v){writes++;width=parseFloat(v).toFixed(6).replace(/0+$/,'').replace(/\.$/,'')+'%';}}};
  D.html(n,'A & B');D.style(n,'width','17.333333333333336%');assert.equal(writes,2);
  for(let i=0;i<120;i++){D.html(n,'A & B');D.style(n,'width','17.333333333333336%');}assert.equal(writes,2);
  html='external';width='99%';D.html(n,'A & B');D.style(n,'width','17.333333333333336%');assert.equal(writes,4);assert.equal(html,'A &amp; B');assert.equal(width,'17.333333%');
 });
}finally{useLegacy(false);h.close();clearInterval(g.net.timer);}
