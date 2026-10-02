// Invoke registered handlers on inert elements; no browser or OS input.
import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,canvas=h.elements.get('view');
export let mouseEntryChecks=0;
const test=async(name,fn)=>{await fn();mouseEntryChecks++;console.log('PASS mouse entry: '+name);};
const event=extra=>({pointerId:1,pointerType:'mouse',button:0,clientX:600,clientY:430,preventDefault(){},stopImmediatePropagation(){},...extra});
const down=e=>canvas.listeners.get('pointerdown')(e);
try{
 await test('an automatically installed guest captures look on its first world click without firing',async()=>{
  const n=g.net,saved=B2.Saves.snapshot(g,true),encoded=await B2.crewCompress(saved);n.role='guest';n.hostId='test-lead';n.sendControl=async()=>{};
  const requests=[];canvas.requestPointerLock=options=>{requests.push(options);};
  await n.receiveSnapshot(encoded.bytes,n.hostId,{epoch:'mouse-entry',seq:0,gzip:encoded.gzip});assert.ok(g.running&&n.ready,n.errors.join('\n'));
  g.view.gameUI.hits=[];down(event());assert.deepEqual(requests,[{unadjustedMovement:true}]);assert.equal(g.input.fire,false,'acquisition click also fires the tool');
  document.pointerLockElement=canvas;h.documentHandlers.get('pointerlockchange')({});down(event());assert.equal(g.input.fire,true,'captured click fails to use the tool');
  h.handlers.get('pointerup')(event());assert.equal(g.input.fire,false);document.pointerLockElement=null;g.hadPointerLock=false;g.lockRequest=null;n.role='offline';n.room=null;
 });
 await test('a pending capture request is not duplicated by repeated world presses',()=>{
  g.setScreen(null);g.view.gameUI.hits=[];const requests=[];canvas.requestPointerLock=options=>{requests.push(options);};
  down(event());down(event());assert.equal(requests.length,1);assert.equal(g.input.fire,false);g.lockRequest=null;
 });
 await test('right-drag starting over a HUD button owns look and leaves that button inactive',()=>{
  g.setScreen(null);const ui=g.view.gameUI;let activated=0;ui.hits=[{id:'test-hud',x:0,y:0,w:300,h:100,action(){activated++;}}];g.player.yaw=0;
  const e=event({button:2,clientX:50,clientY:50});down(e);assert.equal(g.input.lookPointer,1);assert.equal(e.__b2UIHandled,undefined);assert.equal(activated,0);
  ui.dirty=false;const before={...ui.pointer};canvas.listeners.get('pointermove')(event({button:2,clientX:75,clientY:50}));h.handlers.get('pointermove')(event({button:2,clientX:75,clientY:50}));
  assert.equal(g.player.yaw,-.05);assert.equal(ui.dirty,false);assert.deepEqual(ui.pointer,before);h.handlers.get('pointerup')(event({button:2}));assert.equal(g.input.lookPointer,null);
 });
 await test('left HUD actions and touch look retain their own input without requesting mouse capture',()=>{
  g.setScreen(null);const ui=g.view.gameUI;let activated=0,requested=0;canvas.requestPointerLock=()=>{requested++;};ui.hits=[{id:'test-hud',x:0,y:0,w:300,h:100,action(){activated++;}}];
  const e=event({clientX:50,clientY:50});down(e);assert.equal(activated,1);assert.equal(e.__b2UIHandled,true);assert.equal(requested,0);
  ui.hits=[];down(event({pointerType:'touch',pointerId:2}));assert.equal(g.input.lookPointer,2);assert.equal(requested,0);h.handlers.get('pointerup')(event({pointerType:'touch',pointerId:2}));
 });
 await test('failed raw capture falls back to standard capture from the same click',async()=>{
  g.setScreen(null);g.view.gameUI.hits=[];g.lockRequest=null;const requests=[];canvas.requestPointerLock=options=>{requests.push(options);return options?Promise.reject(Object.assign(new Error('unsupported'),{name:'NotSupportedError'})):Promise.resolve();};
  down(event());await new Promise(setImmediate);assert.deepEqual(requests,[{unadjustedMovement:true},undefined]);assert.equal(g.input.fire,false);assert.equal(g.lockRequest,null);
 });
 await test('refused capture retains unlocked tools and right-drag, and successful capture clears fallback',async()=>{
  g.setScreen(null);g.view.gameUI.hits=[];g.lockRequest=null;g.mouseCaptureUnavailable=false;let requested=0;
  canvas.requestPointerLock=()=>{requested++;return Promise.reject(Object.assign(new Error('declined'),{name:'NotAllowedError'}));};
  down(event());await new Promise(setImmediate);assert.equal(requested,1);assert.equal(g.input.fire,false);assert.equal(g.mouseCaptureUnavailable,true);
  down(event());assert.equal(requested,1);assert.equal(g.input.fire,true);h.handlers.get('pointerup')(event());assert.equal(g.input.fire,false);
  g.player.yaw=0;down(event({button:2}));h.handlers.get('pointermove')(event({button:2,clientX:620}));assert.equal(g.player.yaw,-.04);h.handlers.get('pointerup')(event({button:2}));
  canvas.requestPointerLock=()=>{requested++;};B2.Game.prototype.play.call(g);assert.equal(requested,2);
  document.pointerLockElement=canvas;h.documentHandlers.get('pointerlockchange')({});assert.equal(g.mouseCaptureUnavailable,false);assert.equal(g.view.gameUI.dirty,true);
  document.pointerLockElement=null;g.hadPointerLock=false;g.lockRequest=null;
 });
 await test('desktop acquisition help hides during capture or drag and stays absent on touch',()=>{
  g.setScreen(null);const ui=g.view.gameUI,original=ui.text,lines=[];ui.text=(text,...args)=>{lines.push(text);return original.call(ui,text,...args);};
  const help=()=>{lines.length=0;ui.hud();return lines.filter(text=>/Click to look|Right-drag to turn/.test(text));};
  try{
   assert.deepEqual(help(),['Click to look / right-drag to turn']);g.lockRequest={raw:true};assert.deepEqual(help(),[]);g.lockRequest=null;
   g.input.lookPointer=1;assert.deepEqual(help(),[]);g.input.lookPointer=null;document.pointerLockElement=canvas;assert.deepEqual(help(),[]);document.pointerLockElement=null;
   g.mouseCaptureUnavailable=true;assert.deepEqual(help(),['Right-drag to turn']);g.mouseCaptureUnavailable=false;
   const media=globalThis.matchMedia;try{globalThis.matchMedia=()=>({matches:true});assert.deepEqual(help(),[]);}finally{globalThis.matchMedia=media;}
  }finally{ui.text=original;g.lockRequest=null;g.input.lookPointer=null;document.pointerLockElement=null;}
 });
}finally{document.pointerLockElement=null;g.lockRequest=null;g.net.role='offline';g.net.room=null;clearInterval(g.net.timer);h.close();}
console.log('COMPLETE '+mouseEntryChecks+' mouse entry checks passed (no browser or OS input)');
