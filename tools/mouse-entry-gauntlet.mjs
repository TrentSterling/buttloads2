// Matched registered-handler replay on inert DOM. No browser or OS input.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const root=new URL('../',import.meta.url),out=new URL('./out/',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const hash=file=>createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex');
const event=extra=>({pointerId:1,pointerType:'mouse',button:0,clientX:600,clientY:430,preventDefault(){},stopImmediatePropagation(){},...extra});
async function replay(before){
 const h=await nodeGame(before?{gameSource:read('tools/out/mouse-entry-before/game.js'),gameUISource:read('tools/out/mouse-entry-before/game-ui.js')}:{}),g=h.game,canvas=h.elements.get('view'),ui=g.view.gameUI;
 const down=e=>canvas.listeners.get('pointerdown')(e),up=e=>h.handlers.get('pointerup')(e);
 try{
  const n=g.net,encoded=await B2.crewCompress(B2.Saves.snapshot(g,true));n.role='guest';n.hostId='mouse-entry-lead';n.sendControl=async()=>{};
  await n.receiveSnapshot(encoded.bytes,n.hostId,{epoch:'mouse-entry',seq:0,gzip:encoded.gzip});assert.ok(g.running&&n.ready,n.errors.join('\n'));
  const requests=[];canvas.requestPointerLock=options=>{requests.push(options);};ui.hits=[];down(event());
  const acquisition={automaticGuestRunning:g.running,requests:structuredClone(requests),fire:g.input.fire};up(event());g.lockRequest=null;
  n.role='offline';n.room=null;g.setScreen(null);g.player.yaw=0;let actions=0;
  ui.hits=[{id:'test-hud',x:0,y:0,w:300,h:100,action(){actions++;}}];const start=event({button:2,clientX:50,clientY:50});down(start);
  canvas.listeners.get('pointermove')(event({button:2,clientX:75,clientY:50}));h.handlers.get('pointermove')(event({button:2,clientX:75,clientY:50}));
  const overHUD={stopped:!!start.__b2UIHandled,lookPointer:g.input.lookPointer,yaw:g.player.yaw,actions};up(event({button:2}));
  g.setScreen(null);g.player.yaw=0;ui.hits=[{id:'test-hud',x:0,y:0,w:300,h:100}];down(event({button:2,clientX:330,clientY:50}));ui.hover=null;ui.dirty=false;
  const pointerBefore={...ui.pointer},rect=canvas.getBoundingClientRect;let rectReads=0;canvas.getBoundingClientRect=()=>{rectReads++;return rect.call(canvas);};
  const move=event({button:2,clientX:290,clientY:50});canvas.listeners.get('pointermove')(move);h.handlers.get('pointermove')(move);
  const crossingHUD={yaw:g.player.yaw,hudDirty:ui.dirty,hover:ui.hover,pointerChanged:JSON.stringify(pointerBefore)!==JSON.stringify(ui.pointer),rectReads};up(event({button:2}));
  document.pointerLockElement=canvas;down(event());const capturedFire=g.input.fire;up(event());document.pointerLockElement=null;
  return {acquisition,overHUD,crossingHUD,capturedFire};
 }finally{document.pointerLockElement=null;g.lockRequest=null;g.net.role='offline';g.net.room=null;clearInterval(g.net.timer);h.close();}
}
const before=await replay(true),after=await replay(false);
assert.equal(before.acquisition.requests.length,0);assert.equal(before.acquisition.fire,true);
assert.deepEqual(after.acquisition.requests,[{unadjustedMovement:true}]);assert.equal(after.acquisition.fire,false);
assert.equal(before.overHUD.stopped,true);assert.equal(before.overHUD.yaw,0);assert.equal(after.overHUD.stopped,false);assert.equal(after.overHUD.yaw,-.05);assert.equal(after.overHUD.actions,0);
assert.equal(before.crossingHUD.hudDirty,true);assert.equal(before.crossingHUD.rectReads,1);assert.equal(after.crossingHUD.hudDirty,false);assert.equal(after.crossingHUD.rectReads,0);
assert.equal(after.crossingHUD.yaw,before.crossingHUD.yaw);assert.ok(before.capturedFire&&after.capturedFire);
const report={date:new Date().toISOString(),version:JSON.parse(read('package.json')).version,beforeVersion:'2.29.2',beforeBuildSha256:hash('tools/out/mouse-entry-before/build.html'),buildSha256:hash('dist/index.html'),gameSha256:hash('src/game.js'),gameUISha256:hash('src/game-ui.js'),before,after,safety:{inertRegisteredHandlers:true,browserInput:false,osInput:false,realPointerCapture:false},limitation:'This reproduces acquisition and gesture ownership; physical Firefox mouse delivery and feel remain unverified.'};
fs.writeFileSync(new URL('mouse-entry-report.json',out),JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version,before,after,safety:report.safety},null,2));
console.log('COMPLETE matched mouse entry replay: automatic snapshot, acquisition, HUD drag, hover work and captured tool use.');
