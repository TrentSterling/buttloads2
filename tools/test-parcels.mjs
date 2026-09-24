import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2;
export let parcelChecks=0;
const test=async(name,fn)=>{await fn();parcelChecks++;console.log('PASS parcels: '+name);};
const aim=(p,n)=>{const dx=n.x-p.x,dz=n.z-p.z;p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(n.y-p.head.y,Math.hypot(dx,dz));};
const counter=()=>{g.player.teleport(-9,.06,34.8);aim(g.player,{x:-9,y:1.55,z:37.4});g.townUI.open('mara');};
const deed=()=>h.elements.get('town-services').children.find(b=>b.children[0].textContent==='Eastcut deed');
try{
 await test('unowned land is walkable but excavation and equipment cannot cross the deed boundary',async()=>{
  const field=g.world.field.slice();assert.equal(g.world.parcelVersion,0);assert.equal(g.world.parcelField,null);
  assert.equal(g.world.carve({x:30,y:-1,z:-8},3),0);assert.deepEqual(g.world.field,field);
  g.player.teleport(30,.06,-8);assert.ok(!g.player.blocked(30,.06,-8));aim(g.player,{x:30,y:-1,z:-8});g.cutter.update(.05,g.player,4,true);assert.ok(g.cutter.contact.protected);
  assert.match(g.gadgets.placement('bomb',g.player).reason,/marked claim/);counter();assert.ok(deed().disabled);
  g.economy.state.cash=1600;assert.equal(await g.buyParcel(),false);
 });
 await test('deed eligibility, payment and purchase preserve every original terrain sample and ore ID',async()=>{
  assert.equal(await g.buyParcel(),false);g.expedition.state.recovered=[0,1];for(const n of g.expedition.bodies)n.collected=true;g.expedition.physics.awake.clear();g.expedition.physics.loose.clear();
  g.world.carve({x:0,y:-5,z:0},2);const field=g.world.field.slice(),prefix=g.deposits.nodes.map(n=>[n.id,n.kind,n.x,n.y,n.z]);
  counter();assert.ok(!deed().disabled);const supply=h.elements.get('town-services').children.find(b=>b.children[0].textContent==='Six work lights'),stock=g.gadgets.state.supplies.lights;
  const purchase=deed().onclick();assert.equal(g.ready,false);supply.onclick();h.handlers.get('keydown')({code:'Escape',repeat:false,preventDefault(){}});assert.equal(g.running,false);assert.equal(g.gadgets.state.supplies.lights,stock);
  assert.equal(await g.buyParcel(),false,'concurrent purchase must reject');await purchase;assert.equal(g.ready,true);
  assert.equal(g.world.parcelVersion,1);assert.equal(g.economy.state.cash,100);assert.deepEqual(g.world.field,field);assert.equal(g.deposits.nodes.length,prefix.length+348);
  assert.deepEqual(g.deposits.nodes.slice(0,prefix.length).map(n=>[n.id,n.kind,n.x,n.y,n.z]),prefix);assert.ok(deed().disabled);assert.equal(await g.buyParcel(),false);assert.equal(g.economy.state.cash,100);assert.equal(g.view.parcelCap.visible,false);
 });
 await test('parcel caves are deterministic and the added ore stays within purchased ground',()=>{
  const a=new B.ParcelTerrain(260923),b=new B.ParcelTerrain(260923),c=new B.ParcelTerrain(4);assert.deepEqual(a.rooms,b.rooms);assert.notDeepEqual(a.rooms,c.rooms);
  for(const r of a.rooms){assert.ok(g.world.density(r.x,r.y,r.z)>1);const p=new B.Player(g.world);assert.ok(!p.blocked(r.x,r.y-.8,r.z));}
  for(const seed of [260923,4,902]){const w=seed===260923?g.world:new B.World(seed,1,1,1),p=new B.Player(w);for(const path of w.parcelTerrain.paths)for(let i=1;i<path.length;i++)for(let t=0;t<=1;t+=.05){const a=path[i-1],b=path[i];assert.ok(!p.blocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t-.8,a.z+(b.z-a.z)*t),'connected capsule route');}}
  const base=B.generateDeposits(260923,1),all=B.generateDeposits(260923,1,1);assert.deepEqual(all.nodes.slice(0,base.nodes.length),base.nodes);
  for(const n of all.nodes.slice(base.nodes.length)){assert.ok(g.world.owns(n.x,n.z));assert.ok(n.y>-73 && n.y<0);}
 });
 await test('both fields join with equal mesh cells and match a cold remesh after excavation',()=>{
  for(let x=12;x<20;x+=.5)g.world.carve({x,y:-8,z:-8},1.8);
  const cells=new Map();let shared=0;
  for(const rec of g.world.chunks.values())if(rec.cx===1 || rec.cx===2){
   const m=rec.mesh,C=g.world.kernel.C,fresh=g.world.kernel.build(m.origin,g.world.samplesFor(rec.cx,rec.cy,rec.cz));assert.deepEqual(m.active,fresh.active);assert.equal(m.count,fresh.count);
   for(let id=0;id<m.active.length;id++)if(m.active[id]){
    const key=[rec.cx*16+id%C-1,rec.cy*16+Math.floor(id/C)%C-1,rec.cz*16+Math.floor(id/C/C)-1].join(',');
    const data=[...m.positions.slice(id*3,id*3+3),...m.normals.slice(id*3,id*3+3)];
    assert.deepEqual([...fresh.positions.slice(id*3,id*3+3),...fresh.normals.slice(id*3,id*3+3)],data);
    if(cells.has(key)){assert.deepEqual(cells.get(key),data);shared++;}else cells.set(key,data);
   }
  }assert.ok(shared>100);
 });
 await test('all excavation stays inside the parcel and leaves the road, outer rim and shallow bedrock intact',()=>{
  const probes=[{x:30,y:-1,z:4},{x:46.5,y:-1,z:-8},{x:30,y:-74,z:-8}],before=probes.map(p=>g.world.density(p.x,p.y,p.z));
  for(const p of probes)g.world.carve(p,3.6);assert.deepEqual(probes.map(p=>g.world.density(p.x,p.y,p.z)),before);
  assert.ok(g.world.carve({x:30,y:-3,z:-8},2)>0);assert.ok(g.world.density(30,-3,-8)>0);
  g.world.deepOpen=true;assert.equal(g.world.carve({x:30,y:-80,z:-8},2),0);g.world.deepOpen=false;
 });
 await test('an Eastcut mineral detaches, falls, collects once and enters the same sale ledger',()=>{
  const n=g.deposits.nodes.find(n=>n.x>24 && n.x<40 && n.y>-8);assert.ok(n);g.world.carve(n,2.5);const y=n.y;for(let i=0;i<90;i++)g.orePhysics.update(1/60);assert.ok(n.y<y-.1);assert.ok(g.orePhysics.contact(n).density>=-.005);
  const count=g.economy.state.mined;assert.ok(g.orePhysics.collect(n,g.economy,{x:n.x,y:n.y+.2,z:n.z}));assert.equal(g.economy.state.mined,count+1);assert.equal(g.orePhysics.collect(n,g.economy,n),false);assert.equal(g.economy.sell().minerals,B.ORES[n.kind].value);assert.equal(g.economy.sell().count,0);
 });
 await test('lamps, a return anchor and both chart panes work in the eastern excavation after a portable reload',async()=>{
  g.world.carve({x:28,y:-6,z:-8},3.5);g.player.teleport(28,-7.5,-8);assert.ok(!g.player.blocked(28,-7.5,-8));aim(g.player,{x:28,y:-8.8,z:-9});g.play();g.deploy('lamp');assert.ok(g.gadgets.nodes.some(n=>n.type==='lamp'&&n.x>24));assert.ok(g.expedition.placeAnchor(g.player));g.survey.update(1,g.player);
  const chart=g.survey.render(7,g);assert.match(chart.map,/EASTCUT/);assert.ok(g.survey.slice(7).slice(32).some(v=>v));const cells=[...g.survey.data.cells],field=g.world.field.slice(),east=g.world.parcelField.slice(),save=B.Saves.snapshot(g,true);
  await g.install(B.Saves.validate(save));assert.deepEqual(g.world.field,field);assert.deepEqual(g.world.parcelField,east);assert.deepEqual(g.survey.data.cells,cells);assert.equal(g.player.x,28);assert.ok(g.gadgets.nodes.some(n=>n.type==='lamp'&&n.x>24));g.recall();assert.ok(g.expedition.returnToAnchor(g.player));assert.equal(g.player.x,28);
 });
 await test('corrupt neighboring fields and unearned or inconsistent deeds reject before installation',()=>{
  const good=B.Saves.snapshot(g);B.Saves.validate(good);
  for(const mutate of[s=>s.parcelVersion=2,s=>s.parcelVersion=0,s=>s.parcelField=new Float32Array(2),s=>s.parcelField[0]=NaN,s=>s.state.expedition.recovered=[0]]){const bad=structuredClone(good);mutate(bad);assert.throws(()=>B.Saves.validate(bad),/claim|terrain|engine/);}
 });
 await test('the freight crane ships real Eastcut cargo through a saved route to its extended depot',async()=>{
  g.economy.state.cash=200;assert.ok(g.freight.buy());g.world.carve({x:37,y:-12,z:-8},3.5);g.player.teleport(37,-12-g.player.eye,-5.7);g.player.pitch=-.9;g.player.yaw=0;assert.ok(g.freight.place(g.player),g.freight.placement(g.player).reason);
  const d=g.freight.state.dock;assert.ok(d.x>30);for(let y=d.y;y<1;y+=.8)g.world.carve({x:d.x,y,z:d.z},1.6);
  const n=g.deposits.nodes.find(n=>!n.collected && n.x>30 && n.y>-8);g.world.carve(n,2.3);assert.ok(g.orePhysics.collect(n,g.economy,{x:n.x,y:n.y+.1,z:n.z}));
  assert.ok(g.freight.send(g.player));g.player.teleport(30,.06,4);for(let i=0;i<60;i++)g.freight.update(1/60,g.player,[]);assert.ok(g.freight.state.travel>1);
  const travel=g.freight.state.travel;await g.install(B.Saves.validate(B.Saves.snapshot(g,true)));assert.equal(g.freight.state.travel,travel);
  for(let i=0;i<1800 && !g.freight.stockCount;i++)g.freight.update(1/60,g.player,[]);assert.equal(g.freight.stockCount,1);assert.ok(g.freight.cage.x>46);
  assert.equal(g.world.canDig(46.7,-1,d.z),false);assert.ok(new THREE.Box3().setFromObject(g.view.craneRail).max.x>47);
  assert.equal(g.economy.sell().minerals,B.ORES[n.kind].value);assert.equal(g.economy.sell().count,0);B.Saves.validate(B.Saves.snapshot(g));
 });
 await test('lost cargo in Eastcut remains a physical recovery cache after saving',async()=>{
  const n=g.deposits.nodes.find(n=>!n.collected && n.x>24 && n.y>-9);g.world.carve(n,2.3);assert.ok(g.orePhysics.collect(n,g.economy,{x:n.x,y:n.y+.1,z:n.z}));
  g.player.teleport(28,-7.5,-8);g.combat.rescue(g.player);const count=g.combat.drops.find(n=>n.id===3).cargo.reduce((a,b)=>a+b,0);assert.equal(count,1);g.recall();await g.install(B.Saves.validate(B.Saves.snapshot(g,true)));
  const cache=g.combat.drops.find(n=>n.id===3);assert.ok(cache.x>24);g.player.teleport(cache.x,cache.y-g.player.eye,cache.z+2);aim(g.player,cache);assert.ok(g.combat.collect(3,g.player));assert.equal(g.economy.count,1);assert.equal(g.combat.collect(3,g.player),false);B.Saves.validate(B.Saves.snapshot(g));
 });
 await test('an old claim installs without a deed, added ore, terrain or a covering floor in the original yard',async()=>{
  const old=B.Saves.snapshot(g);old.parcelVersion=0;old.parcelField=null;old.state=B.freshState(old.state.seed);old.collected=[];old.loose=[];old.player={x:0,y:.06,z:12,yaw:0,pitch:0};const original=old.field.slice();delete old.parcelVersion;delete old.parcelField;
  await g.install(B.Saves.validate(old));assert.equal(g.world.parcelVersion,0);assert.equal(g.world.parcelField,null);assert.deepEqual(g.world.field,original);assert.equal(g.deposits.nodes.length,B.generateDeposits(old.state.seed,1).nodes.length);assert.equal(g.view.parcelCap.visible,true);
 });
 await test('failed construction rolls the purchase back without charging money or replacing the original mine',async()=>{
  g.economy.state.cash=1600;g.expedition.state.recovered=[0,1];for(const n of g.expedition.bodies)n.collected=true;g.expedition.physics.awake.clear();g.expedition.physics.loose.clear();counter();
  const field=g.world.field.slice(),build=B.World.prototype.build;let failed=false;B.World.prototype.build=async function(...args){if(!failed){failed=true;throw Error('simulated construction failure');}return build.apply(this,args);};
  try{assert.equal(await g.buyParcel(),false);}finally{B.World.prototype.build=build;}
  assert.equal(g.world.parcelVersion,0);assert.equal(g.economy.state.cash,1600);assert.deepEqual(g.world.field,field);assert.equal(g.parcelPurchase,false);B.Saves.validate(B.Saves.snapshot(g));
 });
 await test('buying the adjoining claim mid-shipment preserves the cage position and every mineral',async()=>{
  g.economy.state.cash=1780;assert.ok(g.freight.buy());g.world.carve({x:0,y:-12,z:0},3.5);g.player.teleport(0,-12-g.player.eye,2.3);g.player.pitch=-.9;g.player.yaw=0;assert.ok(g.freight.place(g.player));
  const dock=g.freight.state.dock;for(let y=dock.y+1;y<1;y+=.4)g.world.carve({x:dock.x,y,z:dock.z},1.2);
  const n=g.deposits.nodes[0];g.world.carve(n,1.3);assert.ok(g.orePhysics.collect(n,g.economy,n));assert.ok(g.freight.send(g.player));
  for(let i=0;i<60;i++)g.freight.update(1/60,null,[]);assert.ok(g.freight.state.travel>1);
  counter();const cage=g.freight.cage,load=[...g.freight.state.load],field=g.world.field.slice();assert.ok(await g.buyParcel());
  assert.deepEqual(g.freight.cage,cage);assert.deepEqual(g.freight.state.load,load);assert.deepEqual(g.world.field,field);assert.equal(g.economy.state.cash,100);
  await g.install(B.Saves.validate(B.Saves.snapshot(g,true)));assert.deepEqual(g.freight.cage,cage);
  for(let i=0;i<1800 && !g.freight.stockCount;i++)g.freight.update(1/60,null,[]);assert.equal(g.freight.stockCount,1);assert.ok(g.freight.cage.x>46);
  assert.equal(g.economy.sell().minerals,B.ORES[n.kind].value);assert.equal(g.economy.sell().count,0);B.Saves.validate(B.Saves.snapshot(g));
 });
 await test('surface throws remain reachable and save above the old loose-ore height and width limits',async()=>{
  const n=g.deposits.nodes.find(n=>!n.collected&&n.x>30),frames=360;
  Object.assign(n,{x:45,y:19,z:-8,vx:18,vy:15,vz:0,motion:'falling'});g.orePhysics.loose.add(n);g.orePhysics.awake.add(n);g.orePhysics.index.move(n);
  let high=false,wide=false;
  for(let i=0;i<frames;i++){g.orePhysics.update(1/60);high ||= n.y>20;wide ||= n.x>54;assert.ok(n.x<B.SURFACE.maxX+.01);assert.ok(g.orePhysics.contact(n).density>=-.005);if(i%30===0)B.Saves.validate(B.Saves.snapshot(g));}
  assert.ok(high&&wide);assert.equal(n.motion,'resting');const position={x:n.x,y:n.y,z:n.z};await g.install(B.Saves.validate(B.Saves.snapshot(g,true)));const loaded=g.deposits.nodes[n.id];
  assert.deepEqual({x:loaded.x,y:loaded.y,z:loaded.z},position);g.player.teleport(loaded.x-1,.01,loaded.z);assert.ok(!g.player.blocked(g.player.x,g.player.y,g.player.z));assert.ok(g.orePhysics.collect(loaded,g.economy,g.player.head));assert.equal(g.orePhysics.collect(loaded,g.economy,g.player.head),false);
  const upper=g.deposits.nodes.find(n=>!n.collected&&n.x>30);Object.assign(upper,{x:40,y:47,z:-8,vx:0,vy:24,vz:0,motion:'falling'});g.orePhysics.loose.add(upper);g.orePhysics.awake.add(upper);g.orePhysics.index.move(upper);
  for(let i=0;i<90;i++){g.orePhysics.update(1/60);assert.ok(upper.y<B.SURFACE.maxY+.01);assert.ok(g.orePhysics.contact(upper).density>=-.005);}B.Saves.validate(B.Saves.snapshot(g));
 });
}finally{h.close();}
console.log(`COMPLETE ${parcelChecks} parcel checks passed (inert scene and DOM; no browser or OS input)`);
