import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
import {flat,playerFrom,source,cadence,ramp,diagonal,replay} from './movement-fixtures.mjs';
const h=await nodeGame(),g=h.game,canvas=h.elements.get('view'),text=source();
export let movementChecks=0;
const test=async(name,fn)=>{await fn();movementChecks++;console.log('PASS movement: '+name);};
const event=(extra={})=>({pointerId:1,pointerType:'mouse',button:0,preventDefault(){},...extra});
try{
 await test('locked look consumes the full mouse stream once and leaves pointer duplicates inert',()=>{
  g.play();document.pointerLockElement=canvas;g.player.yaw=g.player.pitch=0;
  const mouse=h.handlers.get('mousemove'),pointer=h.handlers.get('pointermove');
  for(let i=0;i<1000;i++){const e=event({movementX:.75,movementY:.25});mouse(e);pointer(e);}
  assert.ok(Math.abs(g.player.yaw+1.5)<1e-10);assert.ok(Math.abs(g.player.pitch+.5)<1e-10);
  const p=g.player.cameraPose(.3);assert.equal(p.yaw,g.player.yaw);assert.equal(p.pitch,g.player.pitch);
  document.pointerLockElement=null;
 });
 await test('locked input ignores UI hover regions without dirtying the HUD',()=>{
  document.pointerLockElement=canvas;const ui=g.view.gameUI;ui.dirty=false;const old={...ui.pointer};
  canvas.listeners.get('pointermove')(event({clientX:20,clientY:20}));assert.deepEqual(ui.pointer,old);assert.equal(ui.dirty,false);document.pointerLockElement=null;
 });
 await test('right-drag and touch use absolute deltas without compatibility mouse duplication',()=>{
  g.player.yaw=g.player.pitch=0;canvas.listeners.get('pointerdown')(event({button:2,clientX:600,clientY:500}));
  h.handlers.get('pointermove')(event({clientX:630,clientY:490}));h.handlers.get('mousemove')(event({movementX:30,movementY:-10}));
  assert.ok(Math.abs(g.player.yaw+.06)<1e-10);assert.ok(Math.abs(g.player.pitch-.02)<1e-10);
  h.handlers.get('pointerup')(event({button:2}));assert.equal(g.input.lookPointer,null);
  canvas.listeners.get('pointerdown')(event({pointerType:'touch',pointerId:2,clientX:600,clientY:500}));
  h.handlers.get('pointermove')(event({pointerType:'touch',pointerId:2,clientX:620,clientY:505}));assert.ok(Math.abs(g.player.yaw+.1)<1e-10);
 });
 await test('paused input and malformed deltas never change aim',()=>{
  g.setScreen('pause');const aim=[g.player.yaw,g.player.pitch];document.pointerLockElement=canvas;
  h.handlers.get('mousemove')(event({movementX:500,movementY:500}));g.player.look(NaN,1,1);g.player.look(1,Infinity,1);assert.deepEqual([g.player.yaw,g.player.pitch],aim);document.pointerLockElement=null;
 });
 await test('raw mouse acquisition falls back once when unsupported and accepts legacy void APIs',async()=>{
  g.play();const calls=[];canvas.requestPointerLock=opts=>{calls.push(opts);return opts?Promise.reject(Object.assign(new Error('unsupported'),{name:'NotSupportedError'})):Promise.resolve();};
  g.requestLook();await new Promise(setImmediate);assert.deepEqual(calls,[{unadjustedMovement:true},undefined]);assert.equal(g.lockRequest,null);
  calls.length=0;canvas.requestPointerLock=opts=>{calls.push(opts);};g.requestLook();h.documentHandlers.get('pointerlockerror')({});assert.deepEqual(calls,[{unadjustedMovement:true},undefined]);
  document.pointerLockElement=canvas;h.documentHandlers.get('pointerlockchange')({});assert.equal(g.lockRequest,null);document.pointerLockElement=null;g.hadPointerLock=false;
 });
 await test('120 Hz physics presents uniform motion at seven refresh rates, including 144 and 240 Hz',()=>{
  for(const hz of [60,75,90,120,144,165,240]){const c=cadence(hz);assert.equal(c.zeroMovementFrames,0,'frozen camera at '+hz);assert.ok(c.maxSpeedError<1e-7,'uneven motion at '+hz+': '+c.maxSpeedError);}
 });
 await test('irregular render timing keeps interpolated travel continuous and does not interpolate aim',()=>{
  const p=playerFrom(text);p.vz=-3.8;p.grounded=true;p.yaw=0;p.pitch=.2;
  const trace=replay(p,Array.from({length:200},(_,i)=>[.005,.011,.007,.025,.014][i%5]));
  for(let i=20;i<trace.length;i++)assert.ok(Math.abs((trace[i].camera.z-trace[i-1].camera.z)+3.8*trace[i].dt)<1e-7);
  p.look(60,-10,1);assert.equal(p.cameraPose(.2).yaw,p.yaw);assert.equal(p.cameraPose(.2).pitch,p.pitch);
 });
 await test('teleport, recall and menu transitions discard old interpolation history',()=>{
  const p=playerFrom(text);p.step(1/120,new Set(['KeyW']),6);p.stepOffset=-.2;p.teleport(20,2,10);
  for(const a of [0,.5,1])assert.deepEqual({...p.cameraPose(a)},{x:20,y:2,z:10,yaw:p.yaw,pitch:p.pitch});
  g.player.stepOffset=-.2;g.player.previous.x=-40;g.clearInput();assert.equal(g.player.stepOffset,0);assert.deepEqual(g.player.previous,g.player.position);
 });
 await test('the actual view draws between physics positions while taking fresh mouse aim in the same frame',()=>{
  g.player.teleport(6,.1,6);g.play();g.player.step(1/120,new Set(['KeyW']),6);g.accumulator=1/240;
  const z=(g.player.previous.z+g.player.z)/2;document.pointerLockElement=canvas;
  h.handlers.get('mousemove')(event({movementX:40,movementY:-20}));g.view.render(g,1/240,5);
  assert.ok(Math.abs(g.view.camera.position.z-z)<1e-10);assert.ok(Math.abs(g.view.camera.rotation.y-g.player.yaw)<1e-10);assert.ok(Math.abs(g.view.camera.rotation.x-g.player.pitch)<1e-10);
  document.pointerLockElement=null;g.clearInput();
 });
 await test('guest corrections translate both interpolation endpoints without overwriting local aim',()=>{
  const p=playerFrom(text);p.previous={x:-.03,y:.06,z:0};const old=p.cameraPose(.4);p.correctPosition(.1,.06,.2);const next=p.cameraPose(.4);
  assert.ok(Math.abs(next.x-old.x-.1)<1e-10);assert.ok(Math.abs(next.z-old.z-.2)<1e-10);assert.equal(next.yaw,old.yaw);
 });
 await test('smooth ramp climbs and descents settle to ground instead of 28 cm sawtooth jumps',()=>{
  const p=playerFrom(text,ramp);p.teleport(0,.06,0);let maxRise=0;
  for(let i=0;i<240;i++){const y=p.y;p.step(1/120,new Set(['KeyD']),6);maxRise=Math.max(maxRise,p.y-y);assert.ok(!p.blocked(p.x,p.y,p.z));}
  assert.ok(p.x>7);assert.ok(maxRise<.02,'ramp rise '+maxRise);
  for(let i=0;i<240;i++)p.step(1/120,new Set(['KeyA']),6);assert.ok(p.x<.3);assert.ok(Math.abs(p.y-(p.x+p.radius)*.25+.03)<.012);
 });
 await test('a low tread uses its measured height and eases only camera elevation',()=>{
  const p=playerFrom(text);p.obstacles=[[1,0,-2,4,.18,2]];p.vx=3.8;p.grounded=true;const trace=replay(p,Array.from({length:144},()=>1/144),new Set(['KeyD']));
  assert.ok(p.x>3.5);assert.ok(Math.abs(p.y-.18)<.001);assert.ok(trace.some(f=>f.y>.17&&f.camera.y<.16),'no step ease');assert.ok(trace.every(f=>!p.blocked(f.x,f.y,f.z)));
  assert.ok(Math.max(...trace.slice(1).map((f,i)=>Math.abs(f.camera.y-trace[i].camera.y)))<.045);
 });
 await test('tall walls and low ceilings prevent stepping, and wall tangents keep moving',()=>{
  const p=playerFrom(text);p.obstacles=[[1,0,-5,2,3,5]];for(let i=0;i<240;i++){p.step(1/120,new Set(['KeyD','KeyS']),6);assert.ok(!p.blocked(p.x,p.y,p.z));if(p.z<=5)assert.ok(p.x<.701);}
  assert.ok(p.x<.85);assert.ok(p.z>5);assert.ok(!p.blocked(p.x,p.y,p.z)); // The round footprint may turn around the wall's exposed end.
  const q=playerFrom(text);q.obstacles=[[1,0,-2,3,.18,2],[-2,1.85,-2,4,3,2]];for(let i=0;i<150;i++)q.step(1/120,new Set(['KeyD']),6);assert.ok(q.x<.701);assert.ok(q.y<.05);
 });
 await test('fast falls and sprint movement cannot tunnel through thin obstructions or world edges',()=>{
  const p=playerFrom(text);p.obstacles=[[1,0,-4,1.06,3,4]];p.vx=6;p.grounded=true;
  for(let i=0;i<10;i++)p.step(.05,new Set(['KeyD','ShiftLeft']),6);assert.ok(p.x<.701);assert.ok(!p.blocked(p.x,p.y,p.z));
  p.teleport(57.65,.1,0);for(let i=0;i<20;i++)p.step(.05,new Set(['KeyD','ShiftLeft']),6);assert.ok(p.x<=57.7);
  const q=playerFrom(text);q.teleport(0,4,0);q.vy=-20;for(let i=0;i<15;i++)q.step(.05,new Set(),6);assert.ok(q.y>-.031&&q.y<.01);assert.ok(!q.blocked(q.x,q.y,q.z));
 });
 await test('oblique rock contact slides along its tangent without axis-aligned staircasing',()=>{
  const p=playerFrom(text,diagonal);const trace=replay(p,Array.from({length:240},()=>1/120),new Set(['KeyD']));
  assert.ok(p.x>4&&p.z>2);assert.ok(trace.every(f=>!p.blocked(f.x,f.y,f.z)));
  for(const f of trace.slice(150))assert.ok(Math.abs(f.speed-3.8/Math.SQRT2)<.04);
 });
 await test('a moving salvage body cannot pin the capsule with a shallow overlap',()=>{
  const p=playerFrom(text);p.teleport(0,1,0);p.obstacles=[[-1,-1,-1,1,1.02,1]];assert.ok(p.blocked(p.x,p.y,p.z));
  for(let i=0;i<30;i++)p.step(1/120,new Set(['Space']),3.5);assert.ok(p.y>1.5);assert.ok(!p.blocked(p.x,p.y,p.z));
  const q=playerFrom(text);q.obstacles=[[.28,0,-1,2,3,1]];q.step(1/120,new Set(['KeyA']),6);assert.ok(q.x<-.02);assert.ok(!q.blocked(q.x,q.y,q.z));
 });
 await test('walking off a shaft falls, lift clears the ground and collision stops at a roof',()=>{
  const p=playerFrom(text,{density:(x,y,z)=>x<1?y:2,floor:-297});for(let i=0;i<160;i++)p.step(1/120,new Set(['KeyD']),6);assert.ok(p.y<-3);assert.equal(p.grounded,false);
  const q=playerFrom(text,{density:(x,y,z)=>Math.min(y,2.2-y),floor:-297});for(let i=0;i<240;i++)q.step(1/120,new Set(['Space']),6);assert.ok(q.y>.3&&q.y<.51);assert.ok(!q.blocked(q.x,q.y,q.z));
 });
}finally{document.pointerLockElement=null;h.close();}
console.log(`COMPLETE ${movementChecks} movement and mouse checks passed (no browser or OS input)`);
