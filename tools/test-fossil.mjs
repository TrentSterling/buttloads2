import assert from 'node:assert/strict';
import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2;
export let fossilChecks=0;
const test=async(name,fn)=>{await fn();fossilChecks++;console.log('PASS fossil: '+name);};
const aim=(p,n)=>{const dx=n.x-p.x,dz=n.z-p.z;p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(n.y-p.head.y,Math.hypot(dx,dz));};
const frame=(seconds,fn,hz=120)=>{for(let i=0;i<Math.round(seconds*hz);i++)fn(1/hz);};
const openDeep=()=>{const e=g.expedition.state;e.recovered=[0,1];e.runes=[0,1,2];e.awakened=true;for(const n of g.expedition.bodies)n.collected=true;g.expedition.physics.awake.clear();g.expedition.physics.loose.clear();g.deep.state.open=g.world.deepOpen=true;};
const stand=id=>{const p=g.fossil.point(id);g.player.teleport(p.x,p.y-g.player.eye,p.z+1.7);aim(g.player,p);g.setScreen(null);return p;};
const scan=()=>{g.scanCooldown=0;g.scan();};
const button=title=>h.elements.get('town-services').children.find(b=>b.children[0].textContent===title);
const atNell=()=>{g.player.teleport(-6,.06,49);aim(g.player,{x:-6,y:1.55,z:51.4});g.setScreen(null);g.use();assert.equal(g.screen,'town');assert.equal(g.townUI.person.id,'nell');};
try{
 await test('old terrain is unchanged and the keeper is absent before a physical discovery',()=>{
  const before=g.world.field.slice();new B.Fossil(g.world,B.freshState(g.world.seed));assert.deepEqual(g.world.field,before);assert.ok(!g.fossil.state.known);assert.deepEqual(g.fossil.state.plates,[]);assert.equal(g.town.people().some(p=>p.id==='nell'),false);assert.equal(g.view.lanternCart.visible,false);assert.equal(g.view.townRigs.find(r=>r.person.id==='nell').root.visible,false);assert.equal(g.gadgets.lampProfile.reach,16);
  const old=new B.World(260923),f=new B.Fossil(old,B.freshState());assert.equal(f.body,undefined);assert.deepEqual(f.obstacles(),[]);
 });
 await test('a scan reveals the buried skeleton but cannot study its covered sections',()=>{
  openDeep();const p=g.fossil.point(0);g.world.carve(p,.7);g.world.carve({x:p.x,y:p.y,z:p.z+2},1.5);stand(0);scan();assert.ok(g.fossil.state.known);assert.equal(g.fossil.state.plates.length,0);assert.ok(g.survey.markers(g).some(m=>m.type==='fossil'));assert.ok(g.view.ghostSlots.has('fossil'));
  const n=g.fossil.body;for(let x=-4.4;x<4.4;x+=.7)g.world.carve({x:n.x+x,y:n.y,z:n.z},3.1);assert.ok([0,1,2].every(i=>g.fossil.exposed(i)));
 });
 await test('exposed markings require placed light, aim and reach rather than a remote scanner ping',()=>{
  stand(0);scan();assert.deepEqual(g.fossil.state.plates,[]);assert.match(g.fossil.events.at(-1).text,/work light/);
  const p=g.fossil.point(0);g.player.teleport(p.x,p.y-g.player.eye,p.z+1.3);aim(g.player,{...p,y:p.y-1});g.deploy('lamp');assert.equal(g.gadgets.nodes.length,1);assert.ok(g.fossil.illuminated(0,g.gadgets));
  g.player.yaw+=Math.PI;scan();assert.deepEqual(g.fossil.state.plates,[]);g.player.teleport(p.x,p.y-g.player.eye,p.z+7);aim(g.player,p);scan();assert.deepEqual(g.fossil.state.plates,[]);
  stand(0);scan();assert.deepEqual(g.fossil.state.plates,[0]);scan();assert.deepEqual(g.fossil.state.plates,[0]);
 });
 await test('real F records each lit section and E recovers the ember once',()=>{
  for(const id of [1,2]){const p=stand(id);aim(g.player,{x:p.x,y:p.y-.5,z:p.z});g.deploy('lamp');aim(g.player,p);scan();assert.ok(g.fossil.state.plates.includes(id));}
  stand(2);assert.equal(g.interaction()?.kind,'fossil');assert.equal(g.interaction().locked,false);const cash=g.economy.state.cash;g.use();assert.ok(g.fossil.state.recovered);assert.equal(g.fossil.recover(g.player),false);assert.equal(g.economy.state.cash,cash);while(g.expedition.events.length)g.expeditionEvents();assert.equal(g.screen,'discovery');
  g.view.render(g,0,0);assert.ok(g.view.lanternCart.visible);assert.ok(g.view.townRigs.find(r=>r.person.id==='nell').root.visible);assert.ok(g.town.people().some(p=>p.id==='nell'));assert.ok(g.town.residentObstacles().length>2);g.journal();assert.match(h.elements.get('discovery-list').innerHTML,/Nell Wick/);
 });
 await test('Nell sells a single earned retrofit through the physical town counter',()=>{
  atNell();assert.match(h.elements.get('town-name').textContent,/Nell/);g.economy.state.cash=349;g.townUI.refresh();assert.ok(button('Living lantern lenses').disabled);assert.equal(g.fossil.buyLenses(g.economy),false);
  g.economy.state.cash=400;g.townUI.refresh();const stale=button('Living lantern lenses');g.player.teleport(-6,.06,40);stale.onclick();assert.equal(g.economy.state.cash,400);assert.equal(g.fossil.state.lenses,false);
  atNell();button('Living lantern lenses').onclick();assert.ok(g.fossil.state.lenses);assert.equal(g.economy.state.cash,50);assert.ok(button('Living lantern lenses').disabled);assert.equal(g.fossil.buyLenses(g.economy),false);assert.equal(g.economy.state.cash,50);assert.equal(g.town.talk('nell').chapter,'lantern');assert.equal(g.town.talk('mara').chapter,'hello');assert.equal(g.town.talk('mara').chapter,'fossil');
 });
 await test('Nell restocks usable work lights without repeating the lens payment',()=>{
  atNell();const cash=g.economy.state.cash,lights=g.gadgets.state.supplies.lights;assert.ok(cash>=24);button('Six work lights').onclick();assert.equal(g.economy.state.cash,cash-24);assert.equal(g.gadgets.state.supplies.lights,lights+6);assert.ok(g.fossil.state.lenses);assert.ok(button('Living lantern lenses').disabled);
  const stale=button('Six work lights');g.setScreen(null);stale.onclick();assert.equal(g.economy.state.cash,cash-24);assert.equal(g.gadgets.state.supplies.lights,lights+6);
 });
 await test('existing lamps gain real rendering reach and moth deterrence while rock still shields light',()=>{
  g.view.render(g,0,1);assert.equal(g.gadgets.lampProfile.reach,24);assert.equal(g.gadgets.lampProfile.deter,5);assert.ok(g.view.workLights.some(l=>l.intensity===3.4&&l.distance===24));
  g.combat.update(0,g);assert.ok(g.combat.lights.filter(l=>l.range===5).length>=3);
  const lamp=g.gadgets.nodes[0],near={x:lamp.x-4.2,y:lamp.y,z:lamp.z};g.world.carve(near,1.3);for(let x=near.x;x<lamp.x;x+=.3)g.world.carve({x,y:lamp.y,z:lamp.z},.7);
  assert.ok(g.combat.lightAt(near));assert.equal(g.combat.lightAt({x:lamp.x,y:lamp.y-4.6,z:lamp.z}),undefined);
 });
 await test('the supported skeleton falls as a whole when its remaining floor is removed',()=>{
  const n=g.fossil.body,before=n.y;for(let x=-4.4;x<4.4;x+=.7)g.world.carve({x:n.x+x,y:n.y-1.5,z:n.z},3.2);
  frame(2,dt=>g.fossil.update(dt,g.player));assert.ok(n.y<before-.3);assert.ok(g.fossil.physics.contact(n).density>=-.005);g.view.renderFossil(g,3);assert.equal(g.view.fossilModel.position.y,n.y);assert.equal(g.fossil.point(0).y,n.y+B.FOSSIL_ART.plates[0][1]);assert.equal(g.fossil.markers()[0].y,n.y);
  const a=g.fossil.obstacles();assert.ok(a.length>30);assert.ok(a.every(b=>b[1]<n.y+1.1&&b[4]>n.y-1.5));
 });
 await test('portable reload keeps excavation, fossil support, study, lenses and the new resident',async()=>{
  g.recall();const field=g.world.field.slice(),n={x:g.fossil.body.x,y:g.fossil.body.y,z:g.fossil.body.z},before=B.Saves.snapshot(g,true);await g.install(B.Saves.validate(before));assert.deepEqual(g.world.field,field);assert.deepEqual(g.fossil.state.plates,[0,1,2]);assert.ok(g.fossil.state.lenses);assert.deepEqual({x:g.fossil.body.x,y:g.fossil.body.y,z:g.fossil.body.z},n);assert.ok(g.town.state.met.includes('nell'));assert.equal(g.gadgets.lampProfile.deter,5);g.view.render(g,0,0);assert.ok(g.view.lanternCart.visible);
 });
 await test('corrupt study, unearned lenses and impossible keeper histories reject before installation',()=>{
  const good=B.Saves.snapshot(g);
  for(const mutate of[s=>s.state.expedition.fossil.plates=[0,0,2],s=>s.state.expedition.fossil.plates=[0],s=>s.state.expedition.fossil.recovered=false,s=>s.state.expedition.fossil.known=false,s=>s.state.expedition.fossil.bodies[0].y=-999,s=>delete s.state.expedition.fossil]){const bad=structuredClone(good);mutate(bad);assert.throws(()=>B.Saves.validate(bad),/fossil|keeper/);}
 });
 await test('rendering and motion preferences leave the discovery and economy unchanged',()=>{
  const before=B.Saves.snapshot(g);g.settings.motion=false;g.view.render(g,0,100);assert.deepEqual(B.Saves.snapshot(g).state,before.state);for(const m of g.view.keeperLanterns)assert.equal(m.material.emissiveIntensity,1.3);g.view.fossilScene.traverse(n=>{if(n.geometry)assert.ok(n.geometry.attributes.position.array.every(Number.isFinite));});
 });
 await test('older claims gain the buried discovery without a terrain reset or a free lighting reward',async()=>{
  const old=B.Saves.snapshot(g);delete old.state.expedition.fossil;old.state.expedition.town={version:1,met:[],heard:[]};const field=old.field.slice();await g.install(B.Saves.validate(old));assert.deepEqual(g.world.field,field);assert.equal(g.fossil.state.recovered,false);assert.equal(g.fossil.state.lenses,false);assert.equal(g.gadgets.lampProfile.reach,16);assert.equal(g.town.people().some(p=>p.id==='nell'),false);
 });
}finally{h.close();}
console.log(`COMPLETE ${fossilChecks} fossil checks passed (inert renderer and DOM; no browser or OS input)`);
