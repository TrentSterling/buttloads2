import assert from 'node:assert/strict';
import fs from 'node:fs';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,ui=g.view.gameUI;
export let interfaceChecks=0;
const test=async(name,fn)=>{await fn();interfaceChecks++;console.log('PASS interface: '+name);};
const event=(extra={})=>({button:0,pointerId:1,pointerType:'mouse',preventDefault(){},stopImmediatePropagation(){},...extra});
const click=id=>{ui.draw();const hit=ui.hits.find(x=>x.id===id);assert.ok(hit,'Missing game control '+id);const e=event({clientX:hit.x+hit.w/2,clientY:hit.y+hit.h/2});h.elements.get('view').listeners.get('pointerdown')(e);assert.ok(e.__b2UIHandled);return hit;};
try{
 await test('the game has a WebGL interface scene and the HTML control model is hidden and inert',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/<div id="ui-model" hidden inert aria-hidden="true">/);assert.doesNotMatch(html,/<link[^>]+(?:style|town|combat|fieldkit)\.css/);assert.match(html,/<\/div>\s*<input type="file" id="import-file"/);
  assert.equal(ui.scene.children[0].material,ui.material);assert.equal(ui.material.map,ui.texture);assert.equal(ui.material.toneMapped,false);assert.equal(ui.material.depthTest,false);assert.equal(ui.texture.generateMipmaps,false);
 });
 await test('canvas pointer input starts and pauses play without firing the cutter',()=>{
  g.setScreen('title');click('start');assert.equal(g.running,true);assert.equal(g.input.fire,false);
  click('pause');assert.equal(g.screen,'pause');assert.equal(g.input.fire,false);click('resume');assert.equal(g.running,true);
 });
 await test('keyboard menu navigation selects actual controls and Escape still reaches game input',()=>{
  g.setScreen('pause');ui.draw();const key=h.handlers.get('keydown');key(event({code:'Tab'}));assert.equal(ui.focus,0);key(event({code:'Enter'}));assert.equal(g.running,true);
  key(event({code:'Escape'}));assert.equal(g.screen,'pause');
 });
 await test('canvas field kit selection uses unlock rules and preserves inventory',()=>{
  g.economy.state.deepest=26;g.fieldKit.open();ui.draw();assert.ok(ui.hits.some(n=>n.id==='equip-scoop'));assert.ok(!ui.hits.some(n=>n.id==='equip-gravity'));
  const cargo=[...g.economy.state.cargo];click('equip-scoop');assert.equal(g.expedition.state.tool,'scoop');assert.deepEqual(g.economy.state.cargo,cargo);
  click('kit-supplies');ui.draw();assert.ok(ui.hits.some(n=>n.id==='charge-bore'));click('charge-bore');assert.equal(g.expedition.state.chargeMode,'bore');
 });
 await test('merchant ledger clicks perform guarded purchases at the actual counter',()=>{
  const p=B.TOWN.people[0];g.player.teleport(p.x,.08,p.z-2.7);g.player.yaw=Math.PI;g.player.pitch=-.12;g.economy.state.cash=100;g.play();assert.equal(g.townUI.open('mara'),true);ui.draw();
  const supply=g.expedition.state.supplies.bombs;click('service-1');assert.equal(g.economy.state.cash,68);assert.equal(g.expedition.state.supplies.bombs,supply+3);assert.equal(g.screen,'town');assert.equal(g.input.fire,false);
  assert.ok(!ui.hits.some(n=>n.id==='service-0'),'locked deed must not activate');
 });
 await test('survey depth and settings work through canvas controls',()=>{
  g.openSurvey();click('deeper');assert.equal(+h.elements.get('survey-depth').value,5);click('shallower');assert.equal(+h.elements.get('survey-depth').value,0);click('projection');assert.equal(ui.mapProfile,true);ui.draw();assert.ok(g.survey.profileColumns().every(id=>id<g.survey.columns),'unvisited underground caves stay hidden');
  g.setScreen('pause');const motion=g.settings.motion;click('setting-motion');assert.equal(g.settings.motion,!motion);assert.equal(h.elements.get('motion-setting').checked,!motion);
  click('setting-sensitivity');assert.ok(g.settings.sensitivity>=.25&&g.settings.sensitivity<=3);h.elements.get('view').listeners.get('pointerup')(event());ui.draw();ui.focus=ui.hits.findIndex(n=>n.id==='setting-sensitivity');const sensitivity=g.settings.sensitivity;h.handlers.get('keydown')(event({code:'ArrowLeft'}));assert.ok(Math.abs(g.settings.sensitivity-(sensitivity-.05))<1e-8);assert.equal(ui.held.size,0);
 });
 await test('all screens and pages keep active hit regions inside desktop and phone viewports',()=>{
  for(const [w,height] of [[1440,900],[1280,720],[390,844]]){
   globalThis.innerWidth=w;globalThis.innerHeight=height;ui.resize();
   for(const screen of ['title','pause','kit','shop','town','survey','journal','about','confirm','discovery','ending','foreman','rescue','freight']){
    if(screen==='shop')g.updateShop();if(screen==='journal')g.journal();g.setScreen(screen);ui.draw();
    const pages=ui.pages;for(let p=0;p<pages;p++){ui.page=p;ui.draw();for(const r of ui.hits){assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=w+.01&&r.y+r.h<=height+.01,`${screen}/${p}/${w}: ${r.id} out of viewport`);}}
   }
  }
  globalThis.innerWidth=1440;globalThis.innerHeight=900;ui.resize();
 });
 await test('touch holds and cancellation stop tools; interface changes never throw a cancelled charge',()=>{
  globalThis.matchMedia=()=>({matches:true});globalThis.innerWidth=390;globalThis.innerHeight=844;ui.resize();g.play();ui.draw();
  const cut=ui.hits.find(n=>n.id==='touch-cut');h.elements.get('view').listeners.get('pointerdown')(event({pointerType:'touch',clientX:cut.x+10,clientY:cut.y+10}));assert.equal(g.input.fire,true);
  h.elements.get('view').listeners.get('pointercancel')(event({pointerType:'touch'}));assert.equal(g.input.fire,false);assert.equal(ui.held.size,0);
  const supply=g.expedition.state.supplies.bombs;click('touch-bomb');assert.equal(g.input.aim,'bomb');g.setScreen('pause');assert.equal(g.input.aim,null);assert.equal(g.expedition.state.supplies.bombs,supply);assert.equal(ui.held.size,0);
  globalThis.matchMedia=()=>({matches:false});globalThis.innerWidth=1440;globalThis.innerHeight=900;ui.resize();
 });
 await test('the actual surface mesh and surrounding land meet without a slit on all four sides',()=>{
  g.play();g.world.carve({x:13.2,y:-.6,z:5},3);g.view.scene.updateMatrixWorld(true);
  const terrain=[];g.view.scene.traverseVisible(m=>{if(m.isMesh&&(m.material===g.view.terrainMaterial||m.material===g.view.palette.grass))terrain.push(m);});
  const ray=new THREE.Raycaster();let count=0;
  for(const edge of [-16.25,15.75])for(const shift of [-.05,-.001,.001,.05])for(const offset of [-15,-4,0,7,15])for(const axis of ['x','z']){
   const x=axis==='x'?edge+shift:offset,z=axis==='z'?edge+shift:offset;ray.set(new THREE.Vector3(x,2,z),new THREE.Vector3(0,-1,0));
   const hits=ray.intersectObjects(terrain,false);assert.ok(hits.some(hit=>Math.abs(hit.point.y)<.001),`surface slit at ${x}, ${z}`);count++;
  }
  assert.equal(count,80);
 });
 await test('full-depth exported saves are accepted by the import-file route and retain UI preferences',async()=>{
  const save=B.Saves.snapshot(g,true),text=JSON.stringify(save),size=Buffer.byteLength(text);assert.ok(size>6000000,'fixture must reproduce the old import limit');assert.ok(size<32*1024*1024);
  const motion=g.settings.motion,money=g.economy.state.cash,field=g.world.field.slice();h.elements.get('import-file').files=[{size,text:async()=>text}];await h.elements.get('import-file').onchange();
  assert.equal(g.settings.motion,motion);assert.equal(g.economy.state.cash,money);assert.deepEqual(g.world.field,field);assert.equal(valueOfToast().includes('Could not import'),false);assert.equal(g.screen,'pause');assert.ok(g.ready);
 });
}finally{h.close();}
function valueOfToast(){return String(h.elements.get('toast').textContent);}
console.log(`COMPLETE ${interfaceChecks} interface checks passed (inert input and renderer; no browser or OS input)`);
