import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2;
export let kineticChecks=0;
const test=async(name,fn)=>{await fn();kineticChecks++;console.log('PASS kinetics: '+name);};
const frames=(s,fn,hz=60)=>{for(let i=0;i<Math.round(s*hz);i++)fn(1/hz);};
const aim=(p,n)=>{const dx=n.x-p.x,dy=n.y-p.head.y,dz=n.z-p.z;p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(dy,Math.hypot(dx,dz));};
function setup(){
 const world=new B.World(260923,1,1);world.deepOpen=true;
 for(let z=0;z<world.nz;z++)for(let y=0;y<world.ny;y++){const at=world.index(0,y,z);world.field.fill(B.clamp(world.bottom+y*.5+100,-2,2),at,at+world.nx);}
 const state=B.freshState();state.deepest=145;state.expedition.deep={open:true};state.expedition.awakened=true;
 const nodes=[{id:0,x:0,y:-96,z:0,radius:.3,kind:1,collected:false}],ore=new B.OreSystem(world,nodes),combat=new B.Combat(world,state),k=new B.Kinetics(world,state,ore,combat),player=new B.Player(world);
 Object.assign(k.state,{known:true,coils:[0,1],unlocked:true});state.expedition.tool='sling';player.teleport(0,-97.58,4);aim(player,nodes[0]);
 const exp={pulseSerial:0,lastPulse:null};const step=(dt,fire=true,active=true,boxes=[])=>{k.update(dt,player,fire,active,exp,boxes);ore.update(dt);};
 return {world,state,n:nodes[0],ore,combat,k,player,exp,step};
}
try{
 await test('fresh workshop preserves terrain and stays locked behind exposed, resonated coils',()=>{
  const field=g.world.field.slice(),s=g.kinetics.state;
  assert.equal(s.unlocked,false);assert.ok(!B.availableTools(g.economy.state).includes('sling'));assert.equal(g.kinetics.candidate(g.player),null);assert.deepEqual(g.kinetics.markers(),[]);
  g.kinetics.update(.1,g.player,false,false,g.expedition);assert.deepEqual(g.world.field,field);B.Saves.validate(B.Saves.snapshot(g));
 });
 await test('production resonance targets exposed coils in air, charges each once and unlocks the real tool',()=>{
  const k=g.kinetics;Object.assign(g.expedition.state,{recovered:[0,1],runes:[0,1,2],awakened:true});for(const n of g.expedition.bodies)n.collected=true;g.expedition.physics.awake.clear();g.expedition.physics.loose.clear();g.deep.state.open=g.world.deepOpen=true;g.economy.state.deepest=145;
  g.world.carve(k.bench,3.8);g.selectTool('resonance');g.play();
  for(let i=0;i<2;i++){const c=k.coil(i);g.player.teleport(c.x,c.y-g.player.eye,c.z+2);aim(g.player,c);g.expedition.cooldown=0;assert.ok(g.expedition.pulse(g.player,false));k.update(0,g.player,false,false,g.expedition);assert.ok(k.state.coils.includes(i));}
  assert.deepEqual(k.state.coils,[0,1]);const n=k.bench;g.player.teleport(n.x,n.y-.18-g.player.eye,n.z+2.5);aim(g.player,{x:n.x,y:n.y-.18,z:n.z+.76});assert.equal(g.interaction()?.kind,'stonewright');const supplies={...g.expedition.state.supplies};g.use();assert.ok(k.state.unlocked);assert.deepEqual(g.expedition.state.supplies,supplies);assert.equal(k.recover(g.player),false);g.selectTool('sling');assert.equal(g.expedition.state.tool,'sling');
 });
 await test('buried coils and terrain-occluded pulses cannot charge the workshop',()=>{
  const q=setup();q.k.state.coils=[];q.k.state.unlocked=false;const c=q.k.coil(0);q.exp.lastPulse={...c,radius:2,magic:false};q.exp.pulseSerial=1;q.k.update(0,q.player,false,false,q.exp);assert.deepEqual(q.k.state.coils,[]);
  q.world.carve(c,1);q.exp.lastPulse={x:c.x,y:c.y,z:c.z+2,radius:3,magic:false};q.exp.pulseSerial++;q.k.update(0,q.player,false,false,q.exp);assert.deepEqual(q.k.state.coils,[]);
 });
 await test('only detached visible ore can be held, charged and released with its identity intact',()=>{
  const q=setup(),economy=new B.Economy(q.state);q.n.motion='embedded';assert.equal(q.k.candidate(q.player),null);q.n.motion='falling';assert.equal(q.k.candidate(q.player),q.n);
  frames(1,dt=>q.step(dt));assert.equal(q.k.state.held,0);assert.equal(q.k.state.charge,1);assert.ok(q.n.z>1.7);assert.equal(q.ore.collect(q.n,economy,q.player.head),false);assert.equal(q.state.mined,0);
  q.step(1/60,false);assert.equal(q.k.state.held,null);assert.equal(q.k.state.flights.length,1);assert.ok(q.n.vz< -23);assert.equal(q.n.id,0);assert.equal(q.n.collected,false);
 });
 await test('held minerals stop at thin rock and equipment, and an interrupted sight line drops them',()=>{
  const q=setup();q.step(1/60);q.player.yaw=Math.PI/2;
  frames(.2,dt=>q.step(dt,true,true,[[-1,-99,-2,-.8,-92,5]]));assert.ok(q.n.x>-.8);assert.ok(q.k.obstruction);assert.match(q.k.hint(),/caught/);
  const density=q.world.density.bind(q.world),mid=(q.n.z+q.player.z)/2;q.world.density=(x,y,z)=>Math.abs(z-mid)<.04?-2:density(x,y,z);q.step(1/60);assert.equal(q.k.state.held,null);assert.equal(q.k.state.flights.length,0);
 });
 await test('fast impacts damage a creature once and leave the same mineral collectible',()=>{
  const q=setup();const enemy=q.combat.enemies[0];Object.assign(enemy,{x:0,y:-96.1,z:-2,hp:60,phase:'idle'});frames(1,dt=>q.step(dt));aim(q.player,enemy);q.step(1/60,false);frames(.3,dt=>q.step(dt,false));assert.equal(enemy.hp,0);assert.equal(q.k.state.flights.length,0);assert.equal(q.n.collected,false);
  const economy=new B.Economy(q.state);assert.ok(q.ore.collect(q.n,economy,{x:q.n.x,y:q.n.y+.1,z:q.n.z}));assert.equal(q.state.mined,1);assert.equal(q.state.cargo[1],1);assert.equal(q.ore.collect(q.n,economy,q.n),false);
 });
 await test('terrain and machinery stop projectiles before creatures on the other side',()=>{
  for(const wall of ['rock','machine']){const q=setup(),enemy=q.combat.enemies[0];Object.assign(enemy,{x:0,y:-96,z:-2,hp:60,phase:'idle'});frames(1,dt=>q.step(dt));
   let boxes=[];if(wall==='rock'){const density=q.world.density.bind(q.world);q.world.density=(x,y,z)=>z<-.1&&z>-.24?-2:density(x,y,z);}else boxes=[[-3,-100,-.24,3,-90,-.1]];
   q.step(1/60,false,true,boxes);frames(.4,dt=>q.step(dt,false,true,boxes));assert.equal(enemy.hp,60);assert.equal(q.k.state.flights.length,0);assert.ok(q.n.z>-.24);
  }
 });
 await test('kinetic hits fracture crawler armor and use the exposed rear instead when aimed behind it',()=>{
  const q=setup(),c=new B.Crawlers(q.world,q.state,q.combat),n=c.nodes[0];Object.assign(n,{x:0,y:-96,z:-2,hp:110,shell:90,phase:'idle',yaw:0});frames(1,dt=>q.step(dt));aim(q.player,n);q.step(1/60,false);frames(.3,dt=>q.step(dt,false));assert.equal(n.shell,0);assert.equal(n.hp,110);
  q.combat.hit(n,20,'kinetic',{x:0,y:0,z:1});assert.equal(n.hp,85);
 });
 await test('fixed-step holding and flight match at 30, 60 and 120 Hz',()=>{
  const exact=[];for(const hz of [30,60,120]){const q=setup();frames(1,dt=>q.step(dt),hz);q.k.fire(q.player);q.k.wasHeld=false;frames(.5,dt=>q.step(dt,false),hz);exact.push([q.n.x,q.n.y,q.n.z,q.n.vy]);}for(let i=1;i<exact.length;i++)for(let j=0;j<4;j++)assert.ok(Math.abs(exact[i][j]-exact[0][j])<1e-7);
 });
 await test('a real blast breaks the grip and leaves a valid physical mineral instead of a corrupt held save',()=>{
  const q=setup(),gadgets=new B.Gadgets(q.world,q.state.expedition,q.state);frames(.5,dt=>q.step(dt));assert.equal(q.k.state.held,0);
  gadgets.explode({x:q.n.x+1,y:q.n.y,z:q.n.z},{radius:2.8},q.ore,null,null);assert.equal(q.k.state.held,null);assert.equal(q.n.slingHeld,false);assert.ok(Math.hypot(q.n.vx,q.n.vy,q.n.vz)>0);assert.equal(q.n.collected,false);B.Kinetics.validate(q.k.state,q.world,q.state,q.ore.snapshot(),q.player);
 });
 await test('furnace collision receives kinetic damage at the exposed lock rather than swallowing it',()=>{
  const q=setup(),f=new B.Foreman(q.world,q.state,q.combat),n=f.nodes[1];Object.assign(n,{x:0,y:-96,z:-2});frames(1,dt=>q.step(dt));aim(q.player,n);q.step(1/60,false,true,f.obstacles());frames(.3,dt=>q.step(dt,false,true,f.obstacles()));assert.ok(n.hp<80);assert.equal(q.k.state.flights.length,0);
 });
 await test('a saved projectile continues to its impact without repeating damage on subsequent steps',()=>{
  const q=setup(),n=q.combat.enemies[0];Object.assign(n,{x:0,y:-96.1,z:-2,hp:60,phase:'idle'});frames(1,dt=>q.step(dt));q.k.fire(q.player);q.k.wasHeld=false;frames(.05,dt=>q.step(dt,false));
  q.k.save();q.combat.save();const state=structuredClone(q.state),bodies=q.ore.snapshot();B.Kinetics.validate(state.expedition.kinetics,q.world,state,bodies,q.player);
  const ore=new B.OreSystem(q.world,[{id:0,x:0,y:-96,z:0,radius:.3,kind:1,collected:false}],bodies),combat=new B.Combat(q.world,state),k=new B.Kinetics(q.world,state,ore,combat);let impacts=0;const hit=combat.hit.bind(combat);combat.hit=(...args)=>{impacts++;return hit(...args);};
  frames(.5,dt=>{k.update(dt,q.player,false,true,q.exp);ore.update(dt);});assert.equal(impacts,1);assert.equal(combat.enemies[0].hp,0);assert.equal(k.state.flights.length,0);assert.equal(ore.nodes[0].collected,false);
 });
 await test('real pause, tool change and touch cancellation release without firing; touch release does fire',()=>{
  const k=g.kinetics,n=g.deposits.nodes.find(n=>!n.collected && n.y>-5);g.expeditionEvents();g.world.carve(n,3.8);g.player.teleport(n.x,n.y-g.player.eye,n.z+3);aim(g.player,n);g.selectTool('sling');g.play();g.input.fire=true;g.update(1/60);assert.equal(k.state.held,n.id);g.setScreen('pause');assert.equal(k.state.held,null);assert.equal(k.state.flights.length,0);
  g.play();aim(g.player,n);g.input.fire=true;g.update(1/60);assert.equal(k.state.held,n.id);g.selectTool('cutter');assert.equal(k.state.held,null);assert.equal(k.state.flights.length,0);
  g.selectTool('sling');aim(g.player,n);g.input.fire=true;g.update(1/60);h.elements.get('touch-cut').listeners.get('pointercancel')();assert.equal(k.state.held,null);assert.equal(k.state.flights.length,0);
  g.input.fire=true;g.update(1/60);assert.equal(k.state.held,n.id);h.elements.get('touch-cut').listeners.get('pointerup')();h.elements.get('touch-cut').listeners.get('lostpointercapture')();assert.equal(k.state.flights.length,1);assert.equal(k.state.held,null);
 });
 await test('midflight portable saves preserve one projectile and held saves restore as loose ore',async()=>{
  let save=B.Saves.snapshot(g,true),field=g.world.field.slice(),id=g.kinetics.state.flights[0].id;await g.install(B.Saves.validate(save));assert.equal(g.kinetics.state.flights[0].id,id);assert.ok(g.deposits.nodes[id].slingFlight);assert.deepEqual(g.world.field,field);
  g.kinetics.endFlight(g.deposits.nodes[id]);const n=g.deposits.nodes[id];g.world.carve(n,3.8);g.player.teleport(n.x,n.y-g.player.eye,n.z+3);aim(g.player,n);g.play();g.input.fire=true;g.update(1/60);assert.equal(g.kinetics.state.held,id);save=B.Saves.snapshot(g,true);await g.install(B.Saves.validate(save));assert.equal(g.kinetics.state.held,null);assert.equal(g.kinetics.state.flights.length,0);assert.equal(g.deposits.nodes[id].collected,false);
 });
 await test('workshop falls with its coils, models stay in collision bounds and rendering changes no state',()=>{
  const k=g.kinetics,start=k.bench.y;g.world.carve({x:k.bench.x,y:start-3,z:k.bench.z},3.8);frames(1,dt=>k.update(dt,g.player,false,false,g.expedition));assert.ok(k.bench.y<start-1);assert.equal(k.coil(0).y,k.bench.y+.48);
  g.view.render(g,0,10);const b=new THREE.Box3().setFromObject(g.view.workshopModel);for(const[i,a]of ['x','y','z'].entries()){assert.ok(b.min[a]>=k.bench[a]-B.STONEWRIGHT_SIZE[i]/2-1e-5);assert.ok(b.max[a]<=k.bench[a]+B.STONEWRIGHT_SIZE[i]/2+1e-5,`${a} ${b.max[a]-k.bench[a]}`);}
  const before=B.Saves.snapshot(g);g.view.render(g,.1,20);assert.deepEqual(g.economy.state,before.state);assert.deepEqual(g.world.field,before.field);
 });
 await test('invalid unlocks, duplicate projectiles and bad held minerals reject; older terrain stays exact',async()=>{
  const good=B.Saves.snapshot(g),looseID=good.loose[0].id;for(const mutate of[s=>{s.unlocked=true;s.coils=[];},s=>s.charge=2,s=>s.held=999999,s=>s.flights=[{id:0,remaining:4}],s=>s.flights=[{id:looseID,remaining:1},{id:looseID,remaining:1}],s=>s.coils=[0,0]]){const bad=structuredClone(good);mutate(bad.state.expedition.kinetics);assert.throws(()=>B.Saves.validate(bad),/sling|Stonewright/i);}
  const old=structuredClone(good);delete old.state.expedition.kinetics;old.state.expedition.tool='cutter';await g.install(B.Saves.validate(old));assert.equal(g.kinetics.state.unlocked,false);assert.deepEqual(g.world.field,good.field);
 });
}finally{h.close();}
console.log(`COMPLETE ${kineticChecks} kinetic checks passed (inert scene and DOM; no browser or OS input)`);
