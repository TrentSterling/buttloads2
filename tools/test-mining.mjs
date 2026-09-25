import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2;
export let miningChecks=0;
const test=async(name,fn)=>{await fn();miningChecks++;console.log('PASS mining: '+name);};
const player=(yaw=0,pitch=0)=>{const p=new B.Player(g.world);p.yaw=yaw;p.pitch=pitch;return p;};
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
try{
 await test('pitched and rotated brush cross sections remain orthonormal',()=>{
  for(const yaw of [-3,-1,0,1,3])for(const pitch of [-1.54,-.7,0,.7,1.54]){
   const brush=B.cutBrush(player(yaw,pitch),2,'scoop');
   for(let i=0;i<3;i++)for(let j=0;j<3;j++)assert.ok(Math.abs(dot(brush.basis[i],brush.basis[j])-(i===j?1:0))<1e-12);
  }
 });
 await test('scoop makes a broad shallow cut while lance makes a long narrow bore',()=>{
  const center={x:6,y:-6,z:6};
  for(const mode of ['scoop','lance'])for(const yaw of [0,Math.PI/2,Math.PI]){
   const w=new B.World(71),p=player(yaw),shape=B.cutBrush(p,2,mode),[side,,forward]=shape.basis;
   assert.ok(w.carve(center,2,Infinity,shape)>0);
   const along=v=>w.density(center.x+v.x*2,center.y+v.y*2,center.z+v.z*2);
   assert.ok(mode==='scoop'?along(side)>0:along(side)<0,mode+' width');
   assert.ok(mode==='lance'?along(forward)>0:along(forward)<0,mode+' penetration');
   assert.ok(w.density(center.x,center.y,center.z)>0);
  }
 });
 await test('ordinary sphere cuts preserve their exact previous scalar results',()=>{
  const w=new B.World(71),before=w.field.slice(),center={x:6,y:-6,z:6},radius=1.9,strength=.37;
  w.carve(center,radius,strength);
  for(let z=0;z<w.nz;z++)for(let y=0;y<w.ny;y++)for(let x=0;x<w.nx;x++){
   const id=w.index(x,y,z),wx=-16+x*.5,wy=w.bottom+y*.5,wz=-16+z*.5,d=Math.hypot(wx-center.x,wy-center.y,wz-center.z);
   const expected=d<radius&&w.canDig(wx,wy,wz)?Math.fround(Math.max(before[id],Math.min(radius-d,before[id]+strength))):before[id];assert.equal(w.field[id],expected);
  }
 });
 await test('oriented cuts retain claim boundaries and the protected floor',()=>{
  const w=new B.World(71),before=w.field.slice();
  w.carve({x:13,y:-6,z:13},4,Infinity,B.cutBrush(player(.7,-.3),4,'scoop'));
  w.carve({x:0,y:w.floor+.1,z:0},4,Infinity,B.cutBrush(player(0,-1.5),4,'lance'));
  let edited=0;
  for(let z=0;z<w.nz;z++)for(let y=0;y<w.ny;y++)for(let x=0;x<w.nx;x++){
   const id=w.index(x,y,z);if(w.field[id]===before[id])continue;
   edited++;assert.ok(w.canDig(-16+x*.5,w.bottom+y*.5,-16+z*.5));assert.ok(w.field[id]>=before[id]);
  }assert.ok(edited>100);
 });
 await test('wide tool support notifications release ore outside the old spherical cut',()=>{
  const w=new B.World(71),n={id:0,kind:0,x:8.3,y:-6,z:6,radius:.1,collected:false};let bound=0;w.onEdit=(p,r)=>bound=r;
  const ore=new B.OreSystem(w,[n]);assert.equal(n.motion,'embedded');
  w.carve({x:6,y:-6,z:6},2.2,Infinity,B.cutBrush(player(),2.2,'scoop'));
  assert.equal(bound,2.75);assert.equal(n.motion,'falling');const y=n.y;
  for(let i=0;i<30;i++)ore.update(1/60);assert.ok(n.y<y-.2);assert.equal(n.collected,false);
 });
 await test('oriented edits across chunk corners match a cold mesher rebuild',()=>{
  const w=new B.World(71);
  for(let i=0;i<5;i++)w.carve({x:.5*i,y:-8,z:0},2.2,.9,B.cutBrush(player(.45,-.32),2.2,i%2?'lance':'scoop'));
  assert.ok(w.chunks.size>=8);
  for(const rec of w.chunks.values()){
   const cold=w.kernel.build([rec.cx*8,rec.cy*8,rec.cz*8],w.samplesFor(rec.cx,rec.cy,rec.cz)),mesh=rec.mesh;
   assert.equal(mesh.count,cold.count);
   assert.deepEqual(mesh.active,cold.active);
   for(let i=0;i<mesh.active.length;i++)if(mesh.active[i]){assert.deepEqual(mesh.positions.slice(i*3,i*3+3),cold.positions.slice(i*3,i*3+3));assert.deepEqual(mesh.normals.slice(i*3,i*3+3),cold.normals.slice(i*3,i*3+3));}
  }
 });
 await test('real tool actions cut sloping ground, idle preview is read-only and support normals are captured',()=>{
  g.setScreen(null);g.player.teleport(6,.08,6);g.player.pitch=-1.1;g.player.yaw=.4;g.expedition.state.tool='cutter';
  const before=g.world.field.slice(),state=JSON.stringify(g.economy.state),look=[g.player.yaw,g.player.pitch];
  g.mining.update(.1,g);assert.ok(g.mining.preview);assert.ok(g.mining.contacts.length);assert.deepEqual(g.world.field,before);assert.equal(JSON.stringify(g.economy.state),state);
  g.input.fire=true;g.actions.update(1/60,g.player,g.economy.state,true);assert.ok(g.cutter.edited);assert.ok(Math.hypot(...g.cutter.contact.normal)>.99);
  g.mining.update(1/60,g);assert.equal(g.mining.serial,1);assert.ok(g.mining.rev>0);assert.deepEqual([g.player.yaw,g.player.pitch],look);
  g.clearInput();assert.equal(g.mining.rev,0);assert.equal(g.mining.preview,null);
 });
 await test('air and protected terrain never create impact beats, mode changes cancel stale previews',()=>{
  const f=new B.MiningFeel(g.world),state={...g,world:g.world,player:g.player,actions:{target:null},cutter:{edited:false,trace:()=>({x:15,y:0,z:15})},input:{fire:true},expedition:{state:{tool:'scoop'}}};
  f.update(.1,state);assert.ok(f.preview.protected);assert.equal(f.serial,0);state.cutter.trace=()=>null;
  for(let i=0;i<20;i++)f.update(.1,state);assert.equal(f.preview,null);assert.equal(f.serial,0);
  state.cutter.edited=true;f.update(.1,state);assert.ok(f.serial>0);state.expedition.state.tool='gravity';f.update(.1,state);assert.equal(f.rev,0);assert.equal(f.load,0);assert.equal(f.contacts.length,0);
 });
 await test('motor ramp and cadence are consistent at 30, 60 and 120 Hz',()=>{
  const results=[];
  for(const hz of [30,60,120]){
   const f=new B.MiningFeel(g.world),state={...g,cutter:{edited:true,trace:()=>null},input:{fire:true},expedition:{state:{tool:'lance'}}};
   for(let i=0;i<hz;i++)f.update(1/hz,state);results.push({rev:f.rev,load:f.load,serial:f.serial});
  }
  assert.ok(Math.max(...results.map(r=>r.rev))-Math.min(...results.map(r=>r.rev))<1e-12);
  assert.ok(Math.max(...results.map(r=>r.serial))-Math.min(...results.map(r=>r.serial))<=1);
 });
 await test('viewmodel attachments animate independently; motion off preserves player aim',()=>{
  const v=g.view,look=[g.player.yaw,g.player.pitch],f=g.mining;g.setScreen(null);g.settings.motion=true;
  for(const mode of ['scoop','lance']){
   g.expedition.state.tool=mode;f.mode=mode;f.rev=f.load=1;f.stroke=.25;f.beat=1;
   v.render(g,1/60,1);const moving=mode==='scoop'?v.scoopHead.rotation.x:v.lanceStriker.position.z;assert.ok(Math.abs(moving)>.01);
   g.settings.motion=false;v.render(g,1/60,2);assert.equal(mode==='scoop'?v.scoopHead.rotation.x:v.lanceStriker.position.z,0);g.settings.motion=true;
  }
  assert.deepEqual([g.player.yaw,g.player.pitch],look);
  for(const root of [v.scoopHead,v.lanceHead]){let count=0;root.traverse(n=>{if(n.geometry){count++;assert.ok([...n.geometry.attributes.position.array,...n.geometry.attributes.normal.array].every(Number.isFinite));}});assert.ok(count>=10);}
  g.clearInput();g.setScreen('pause');v.render(g,0,2);assert.equal(v.miningMarks.visible,false);
 });
 await test('cut percussion is bounded and distinct at standard audio device rates',()=>{
  for(const rate of [44100,48000])for(const kind of ['bite','grit','chisel'])for(const layer of [0,3,7]){
   const samples=B.soundSamples(kind,rate,{layer});assert.ok(samples.every(Number.isFinite));assert.ok(samples.every(x=>Math.abs(x)<=1));assert.ok(samples.some(x=>Math.abs(x)>.1));assert.equal(Math.abs(samples[0]),0);assert.ok(Math.abs(samples.at(-1))<.001);
  }
  assert.notDeepEqual(B.soundSamples('bite'),B.soundSamples('chisel'));
 });
}finally{h.close();}
console.log(`COMPLETE ${miningChecks} mining checks passed (no browser or OS input)`);
