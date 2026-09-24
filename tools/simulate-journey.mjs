// Excavation journey through the real game loop. No fixture shafts, free cash or direct teleports.
// Pilot knows objective coordinates, so this verifies reachability, not human pacing or fun.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const harness = await nodeGame(), g = harness.game, B = B2, dt = 1 / 60;
const kinetics = process.argv.includes('--kinetics'), crawlers = kinetics || process.argv.includes('--crawlers');
const foreman = process.argv.includes('--foreman'), deep = crawlers || foreman || process.argv.includes('--deep');
const rescue = process.argv.includes('--rescue');
const parcel = process.argv.includes('--parcel');
const legacy = process.argv.includes('--legacy'), refuges = process.argv.includes('--refuges');
if (legacy) {
  // Bootstrap the same starting claim written by the old generator. No new cave voids.
  const snapshot = B.Saves.snapshot(g), world = new B.World(snapshot.state.seed, 0);
  world.carve({ x: 0, y: -.12, z: 7 }, 1.35);
  snapshot.depthVersion = 0; snapshot.field = world.field.slice(); snapshot.state = B.freshState(snapshot.state.seed); snapshot.loose = []; snapshot.collected = []; delete snapshot.generation;
  await g.install(B.Saves.validate(snapshot)); assert.equal(g.world.generation, 0); assert.deepEqual(g.world.fieldAtDepth(0), world.field);
}
g.setScreen(null);
const thunderstone = process.argv.includes('--thunderstone'), mysteries = process.argv.includes('--mysteries'), freight = process.argv.includes('--freight'), demolition = thunderstone || mysteries || freight || process.argv.includes('--demolition');
let freightSent = 0, freightDelivered = 0;
let echoSeal = 0, arrayNode = 0, crawlerID = 200, kineticOreID=null, kineticUsed=false, kineticReloaded=false, kineticHealth=0, kineticShots=0, kineticLiftY=0;
const report = { milestones: [], outcome: 'running', endingSeen: false, demolition, mysteries, freight, thunderstone, legacy, refuges, deep, foreman, rescue, crawlers, kinetics, parcel, charges: [] }; let phase = refuges ? 'survey descent' : 'first haul', phaseStart = 0, lastReport = -1, oreTarget = null, lastBomb = -10;
function throwCharge(mode) { if(mode) g.selectCharge(mode); const supply=g.expedition.state.supplies.bombs; g.deploy('bomb'); lastBomb=g.clock; if(supply!==g.expedition.state.supplies.bombs) report.charges.push({mode:g.expedition.state.chargeMode,seconds:+g.clock.toFixed(1),depth:+(-g.player.y).toFixed(1)}); }
function mark(name) { phase = name; phaseStart = g.clock; const m = { name, seconds: +g.clock.toFixed(1), cash: g.economy.state.cash, cargo: g.economy.count, depth: +g.economy.state.deepest.toFixed(1) }; report.milestones.push(m); console.log(JSON.stringify(m)); }
function steer(target, { cut = true, lift = false, walk = true } = {}) {
  const p = g.player, h = p.head, dx = target.x - p.x, dy = target.y - h.y, dz = target.z - p.z;
  p.yaw = Math.atan2(-dx, -dz); p.pitch = B.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -1.54, 1.54);
  g.input.keys.clear(); if (walk && Math.hypot(dx, dz) > .4) g.input.keys.add('KeyW'); if (lift) g.input.keys.add('Space'); g.input.fire = cut;
}
try {
  mark(phase);
  for (let frame = 0; frame < 60 * 60 * 12; frame++) {
    if (!g.running) g.setScreen(null);
    if (phase === 'survey descent') {
      const n = g.refuges.nodes[0]; steer({ x: n.x, y: n.y + .25, z: n.z }, { lift: g.player.head.y < n.y - .2 });
      const action = g.interaction();
      if (action?.kind === 'refuge' && action.id === 0 && !action.locked) {
        const stock = g.gadgets.state.supplies.lights, cells = g.survey.cells.size;
        g.input.fire = false; g.use(); assert.equal(g.gadgets.state.supplies.lights, stock - 1); assert.ok(g.survey.cells.size > cells);
        mark('survey refuge restored');
        const save = B.Saves.snapshot(g, true), field = g.world.field.slice(); await g.install(B.Saves.validate(save));
        assert.deepEqual(g.refuges.state.lit, [0]); assert.deepEqual(g.world.field, field); assert.equal(g.world.generation, legacy ? 0 : B.CAVE_VERSION);
        mark('survey claim reloaded'); g.recall(); mark('first haul');
      }
    } else if (phase === 'first haul') {
      if (g.economy.count === g.economy.capacity) { g.recall(); mark('first sale'); }
      else {
        if (!oreTarget || oreTarget.collected) oreTarget = g.deposits.nodes.filter(n => !n.collected && n.y > -5).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.head.y,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.y-g.player.head.y,b.z-g.player.z))[0];
        steer(oreTarget);
      }
    } else if (phase === 'first sale') {
      steer({x:-7,y:1,z:15},{cut:false}); if (g.interaction()?.kind === 'sell') { g.use(); mark('first upgrade'); }
    } else if (phase === 'first upgrade') {
      steer({x:0,y:1,z:15},{cut:false}); if (g.interaction()?.kind === 'shop') { g.use(); if (!g.buy('drill')) throw Error('First full haul could not buy the cutter'); g.buy('cargo'); g.setScreen(null); mark(rescue ? 'rescue approach' : 'flywheel descent'); }
    } else if (phase === 'rescue approach') {
      const r = g.rescue, target = {x:B.BELL.x,y:r.state.y+.2,z:B.BELL.z-2.6};
      if(g.economy.state.deepest>=9 && g.expedition.state.tool!=='scoop')g.selectTool('scoop');
      steer(target,{lift:g.player.head.y<target.y-.3});
      if(Math.hypot(g.player.x-target.x,g.player.head.y-target.y,g.player.z-target.z)<.8)mark('rescue excavation');
    } else if (phase === 'rescue excavation') {
      const r=g.rescue, hit=r.contact();
      if(hit.density < -.004) steer(hit,{walk:false,lift:g.player.head.y<r.state.y-.3});
      else {
        steer({x:B.BELL.x,y:r.state.y+.2,z:B.BELL.z-.78},{walk:false,lift:g.player.head.y<r.state.y-.3,cut:false});
        if(g.interaction()?.kind==='rescue') {g.use();const stock=g.expedition.state.supplies.lights;harness.elements.get('rescue-control').onclick();assert.equal(g.expedition.state.supplies.lights,stock-1);assert.equal(r.state.phase,'hoisting');mark('rescue ascent');}
      }
    } else if (phase === 'rescue ascent') {
      const r=g.rescue;
      if(r.rescued) {
        g.clearInput();const field=g.world.field.slice(),saved=B.Saves.snapshot(g,true);await g.install(B.Saves.validate(saved));assert.ok(g.rescue.rescued);assert.deepEqual(g.world.field,field);g.recall();mark('rescue yard exit');
      } else {
        const target=r.obstruction || {x:B.BELL.x,y:r.state.y+2,z:B.BELL.z};
        steer(target,{walk:Math.hypot(g.player.x-B.BELL.x,g.player.z-B.BELL.z)>2.5,lift:g.player.head.y<target.y-.8});
      }
    } else if (phase === 'rescue yard exit') {
      steer({x:7,y:1.55,z:29.5},{cut:false}); if(g.player.z>28.9)mark('rescue shops road');
    } else if (phase === 'rescue shops road') {
      steer({x:-9,y:1.55,z:29.5},{cut:false}); if(g.player.x<-8.4)mark('rescue town sale');
    } else if (phase === 'rescue town sale') {
      steer({x:-9,y:1.55,z:35},{cut:false});
      if(Math.hypot(g.player.x+9,g.player.z-35)<.8)steer({x:-9,y:1.55,z:37.4},{cut:false});
      if(g.interaction()?.id==='mara') {g.use();harness.elements.get('town-services').children.find(b=>b.children[0]?.textContent==='Sell your haul').onclick();g.setScreen(null);mark('rescue office approach');}
    } else if (phase === 'rescue office approach') {
      steer({x:-9,y:1.55,z:29.5},{cut:false});if(g.player.z<30)mark('rescue office road');
    } else if (phase === 'rescue office road') {
      steer({x:-18.5,y:1.55,z:29.5},{cut:false});if(g.player.x<-18)mark('rescue office lane');
    } else if (phase === 'rescue office lane') {
      steer({x:-18.5,y:1.55,z:48},{cut:false});if(g.player.z>47.4)mark('rescue office door');
    } else if (phase === 'rescue office door') {
      steer({x:-24,y:1.55,z:48},{cut:false});if(g.player.x<-23.4)mark('rescue surveyor');
    } else if (phase === 'rescue surveyor') {
      steer({x:-24,y:1.55,z:54.4},{cut:false});
      if(g.interaction()?.id==='inez') {
        g.use();const count=g.survey.ore.size,cash=g.economy.state.cash;harness.elements.get('town-services').children.find(b=>b.children[0]?.textContent==='Prospect a new seam').onclick();assert.equal(g.economy.state.cash,cash-40);assert.ok(g.survey.ore.size>count);
        const saved=B.Saves.snapshot(g,true);await g.install(B.Saves.validate(saved));assert.ok(g.town.state.met.includes('inez'));assert.ok(g.survey.ore.has(g.rescue.state.lead));mark('Inez rescued and survey office chart reloaded');g.recall();mark('flywheel descent');
      }
    } else if (phase === 'flywheel descent') {
      if (g.economy.state.deepest >= 9 && g.expedition.state.tool !== 'scoop') g.selectTool('scoop');
      const body=g.expedition.bodies[0]; steer({x:body.x,y:body.y+1.8,z:body.z});
      const action=g.interaction(); if(action?.kind==='salvage' && action.id===0 && !action.locked) { g.use(); mark('flywheel ascent'); }
    } else if (phase === 'flywheel ascent') {
      const body=g.expedition.bodies[0];
      steer({x:g.player.x,y:g.player.head.y+8,z:g.player.z},{lift:!g.expedition.snagged,walk:false});
      if(g.expedition.snagged) steer({x:body.x,y:body.y+2,z:body.z},{walk:false});
      if(g.expedition.state.recovered.includes(0)) { mark('flywheel recovered'); g.recall(); mark(demolition?'demolition resupply':'engine descent'); }
      else if(g.expedition.tether===null) throw Error('Pilot lost its load');
    } else if (phase === 'demolition resupply') {
      steer({x:0,y:1,z:15},{cut:false}); if(g.interaction()?.kind==='shop') { g.use(); while(g.economy.state.cash>=32 && g.expedition.state.supplies.bombs<24) g.restock('bomb'); g.setScreen(null); mark(thunderstone ? 'thunderstone recovery' : 'engine descent'); }
    } else if (phase === 'thunderstone recovery') {
      const n=g.thunder.nodes[0]; steer(n,{lift:g.player.head.y<n.y-.2});
      const action=g.interaction(); if(action?.kind==='thunderstone' && action.id===0 && !action.locked) { const supplies=g.expedition.state.supplies.bombs;g.use();assert.equal(g.expedition.state.supplies.bombs,supplies+1);mark('thunderstone ignition'); }
    } else if (phase === 'thunderstone ignition') {
      const n=g.thunder.nodes[1]; steer(n,{lift:g.player.head.y<n.y-.2});
      if(g.world.density(n.x,n.y,n.z)>.04 && Math.hypot(g.player.x-n.x,g.player.head.y-n.y,g.player.z-n.z)<3) {
        g.selectCharge('sticky'); let best=null;
        for(const pitch of [1.2,.5,0,-.7,-1.3]) for(let i=0;i<8;i++) { g.player.pitch=pitch;g.player.yaw=i*Math.PI/4; const preview=g.gadgets.preview(g.player); if(preview.end) { const d=Math.hypot(preview.end.x-n.x,preview.end.y-n.y,preview.end.z-n.z); if(!best||d<best.d)best={d,pitch,yaw:g.player.yaw}; } }
        if(best?.d<2) { g.player.pitch=best.pitch;g.player.yaw=best.yaw;g.input.fire=false;g.input.keys.clear();throwCharge('sticky');g.detonate();mark('thunderstone chain'); }
      }
    } else if (phase === 'thunderstone chain') {
      g.input.fire=false;g.input.keys.clear();g.input.keys.add('Space');
      if(g.thunder.nodes.slice(0,4).every(n=>n.collected)) {mark('thunderstone seam opened');g.recall();mark('engine descent');}
      else if(g.clock-phaseStart>6) throw Error('Thunderstone chain did not reach the end of its seam');
    } else if (phase === 'engine descent') {
      const body = g.expedition.bodies[1]; if(g.economy.state.deepest >= 25 && g.expedition.state.tool !== 'lance') g.selectTool('lance');
      steer({x:body.x,y:body.y+2,z:body.z});
      const action=g.interaction(); if(action?.kind==='salvage' && action.id===1 && !action.locked) { g.use(); g.selectTool('scoop'); mark('engine ascent'); }
    } else if (phase === 'engine ascent') {
      const body = g.expedition.bodies[1]; steer({x:g.player.x,y:g.player.head.y+8,z:g.player.z},{lift:!g.expedition.snagged,walk:false});
      if(g.expedition.snagged) steer(g.expedition.obstruction || body,{walk:false});
      if(g.player.y < -23 && g.clock-lastBomb>4 && g.expedition.state.supplies.bombs>0) throwCharge(demolition?'sticky':null);
      if(g.expedition.state.recovered.includes(1)) { mark('engine recovered'); g.recall(); g.selectTool('lance'); mark(freight ? 'freight purchase' : mysteries ? 'mystery resupply' : 'seal descent'); }
      else if(g.expedition.tether===null) throw Error('Pilot lost its engine');
    } else if (phase === 'freight purchase') {
      steer({x:0,y:1,z:15},{cut:false}); if(g.interaction()?.kind==='shop') { g.use(); harness.elements.get('buy-freight').onclick(); assert.ok(g.freight.state.owned); g.setScreen(null); mark('freight bay'); }
    } else if (phase === 'freight bay') {
      const target={x:5,y:-31.8,z:-1.8}; steer(target,{lift:g.player.head.y<target.y-.2});
      if(Math.hypot(g.player.x-target.x,g.player.head.y-target.y,g.player.z-target.z)<.8) mark('freight placement');
    } else if (phase === 'freight placement') {
      steer({x:5,y:Math.min(-35,g.player.head.y-2),z:-4},{walk:false,lift:g.player.head.y < -32.2});
      let placement=g.freight.placement(g.player);
      if(placement.reason) {
        const pose={pitch:g.player.pitch,yaw:g.player.yaw}; let found=false;
        for(const pitch of [-.55,-.85,-1.2]) { for(let i=0;i<8;i++) { g.player.pitch=pitch;g.player.yaw=i*Math.PI/4; const candidate=g.freight.placement(g.player); if(!candidate.reason) { placement=candidate;found=true;break; } } if(found)break; }
        if(!found)Object.assign(g.player,pose);
      }
      if(!placement.reason) { g.input.fire=false;harness.handlers.get('keydown')({code:'KeyT',repeat:false,preventDefault(){}});harness.handlers.get('keyup')({code:'KeyT',preventDefault(){}});assert.ok(g.freight.state.dock); mark('freight loading'); }
      else if(g.clock-phaseStart>15) throw Error('Freight placement: '+placement.reason);
    } else if (phase === 'freight loading') {
      const d=g.freight.state.dock;steer({x:d.x,y:d.y+1.6,z:d.z+2},{lift:g.player.head.y<d.y+1.3});
      if(g.interaction()?.kind==='freight') { g.input.fire=false;g.use();harness.elements.get('freight-send').onclick();freightSent=g.freight.loadCount;assert.ok(freightSent>0);mark('freight shipment'); }
    } else if (phase === 'freight shipment') {
      if(g.freight.stockCount) { freightDelivered=g.freight.stockCount;assert.equal(freightDelivered,freightSent);mark('freight delivered');g.recall();mark('freight sale'); }
      else if(g.freight.obstruction) steer(g.freight.obstruction,{lift:g.player.head.y<g.freight.obstruction.y-1});
      else {g.input.fire=false;g.input.keys.clear();}
    } else if (phase === 'freight sale') {
      steer({x:-7,y:1,z:15},{cut:false});if(g.interaction()?.kind==='sell'){ const value=g.freight.stockValue, cash=g.economy.state.cash;g.use();assert.equal(g.freight.stockCount,0);assert.ok(g.economy.state.cash>=cash+value);mark('freight sold');g.recall();g.selectTool('lance');mark(mysteries?'mystery resupply':'seal descent'); }
    } else if (phase === 'mystery resupply') {
      steer({x:0,y:1,z:15},{cut:false}); if(g.interaction()?.kind==='shop') { g.use(); g.sell(); while(g.economy.state.cash>=32 && g.expedition.state.supplies.bombs<30) g.restock('bomb'); g.setScreen(null); g.selectTool('cutter'); mark('echo descent'); }
    } else if (phase === 'echo descent') {
      steer(B.MYSTERIES[0]); if(Math.hypot(g.player.x-7,g.player.head.y+21,g.player.z-6)<2.8) mark('echo planting');
    } else if (phase === 'echo planting') {
      if(echoSeal===3) { g.input.fire=false; g.input.keys.clear(); if(g.clock-lastBomb>1) { g.detonate(); mark('echo firing'); } }
      else {
        const seal=B.ECHO_SEALS[echoSeal], dx=7-seal.x,dz=6-seal.z,len=Math.hypot(dx,dz), target={x:seal.x+dx/len*.7,y:seal.y-.7,z:seal.z+dz/len*.7};
        steer(target,{lift:g.player.head.y<target.y-.15});
        if(Math.hypot(g.player.x-target.x,g.player.head.y-target.y,g.player.z-target.z)<1.2 && g.clock-lastBomb>1) {
          g.selectCharge('sticky'); let best=null;
          for(const pitch of [1.4,.6,0,-.7]) for(let i=0;i<8;i++) { g.player.pitch=pitch;g.player.yaw=i*Math.PI/4; const p=g.gadgets.preview(g.player); if(p.end) { const d=Math.hypot(p.end.x-seal.x,p.end.y-seal.y,p.end.z-seal.z); if(!best||d<best.d)best={d,pitch,yaw:g.player.yaw}; } }
          if(best?.d<2.5) { g.player.pitch=best.pitch;g.player.yaw=best.yaw;g.input.fire=false;g.input.keys.clear();throwCharge('sticky');echoSeal++; }
        }
      }
    } else if (phase === 'echo firing') {
      g.input.fire=false;g.input.keys.clear(); if(g.mysteries.state.solved.includes(0)) { mark('echo vault recovered');g.recall();g.selectTool('lance');mark('array excavation'); }
      else if(g.clock-phaseStart>3) throw Error('Planted charges failed to ring all echo seals');
    } else if (phase === 'array excavation') {
      const node=B.ARRAY_NODES[Math.min(arrayNode,3)];
      steer(node,{lift:g.player.head.y<node.y-.2});
      if(Math.hypot(g.player.x-node.x,g.player.head.y-node.y,g.player.z-node.z)<1.1) {
        if(arrayNode===1||arrayNode===2) { const desired=arrayNode===1?1:0; if(g.mysteries.state.mirrors[arrayNode-1]!==desired) { if(g.interaction()?.kind==='prism')g.use(); } else arrayNode++; }
        else arrayNode++;
        if(arrayNode>3)mark('array connection');
      }
    } else if (phase === 'array connection') {
      if(g.mysteries.state.solved.includes(1)) { mark('prism lens recovered');g.recall();g.selectTool('lance');mark('seal descent'); }
      else { const beam=g.mysteries.beams.find(b=>b.hit); if(beam)steer(beam.end,{lift:g.player.head.y<beam.end.y-.2});else {g.input.fire=false;g.input.keys.clear();} }
    } else if (phase === 'seal descent') {
      steer(B.SEAL);
      if(demolition && g.player.y < -25 && g.clock-lastBomb>3.6 && g.expedition.state.supplies.bombs>=2) throwCharge('bore');
      if(Math.hypot(g.player.x-B.SEAL.x,g.player.head.y-B.SEAL.y,g.player.z-B.SEAL.z)<2) { g.selectTool('resonance'); mark('seal stones'); }
    } else if (phase === 'seal stones') {
      const rune=B.RUNES.find((_,i)=>!g.expedition.state.runes.includes(i));
      if(rune) steer(rune,{walk:false,lift:g.player.head.y<rune.y-2});
      else { mark('seal opened'); g.selectTool('lance'); mark('heart descent'); }
    } else if (phase === 'heart descent') {
      steer(B.HEART); if(g.interaction()?.kind==='heart' && !g.interaction().locked) { g.use(); mark('heart awakened'); g.recall(); mark('geode expedition'); }
      else if(demolition && g.clock-lastBomb>3.6 && g.expedition.state.supplies.bombs>=2) throwCharge('bore');
    } else if (phase === 'geode expedition') {
      const vault=B.VAULTS.find((_,i)=>!g.expedition.state.vaults.includes(i));
      if(vault) {
        if(g.expedition.state.tool!=='gravity') g.selectTool('gravity'); steer(vault,{cut:false,lift:g.player.head.y<vault.y-.5}); harness.handlers.get('keydown')({code:'KeyQ',repeat:false,preventDefault(){}});
        if(g.expedition.state.vaults.includes(B.VAULTS.indexOf(vault))) { mark(vault.name+' recovered'); g.recall(); mark('geode expedition'); }
      } else if (deep) { g.recall(); mark('deep resupply'); } else { report.outcome='complete'; mark('all recoveries complete'); break; }
    }
    if (phase === 'deep resupply') {
      steer({x:0,y:1,z:15},{cut:false});
      if (g.interaction()?.kind === 'shop') {
        g.use(); g.sell(); while(g.economy.state.cash >= 32 && g.expedition.state.supplies.bombs < 12) g.restock('bomb');
        while(g.economy.state.cash >= 24 && g.expedition.state.supplies.lights < 8) g.restock('lamp');
        while(g.buy('drill')) {} g.setScreen(null); g.selectTool('gravity'); mark('rootway approach');
      }
    } else if (phase === 'rootway approach') {
      steer(B.DEEP_GATE,{cut:false,lift:g.player.head.y<B.DEEP_GATE.y-.3});
      if (g.interaction()?.kind === 'deep-gate' && !g.interaction().locked) { g.use(); assert.ok(g.deep.state.open); mark('lower station descent'); }
      else harness.handlers.get('keydown')({code:'KeyQ',repeat:false,preventDefault(){}});
    } else if (phase === 'lower station descent') {
      if(kinetics && !g.kinetics.state.unlocked && g.deep.state.repaired.includes(0)) {g.selectTool('gravity');mark('Stonewright approach');continue;}
      const enemy = crawlers && g.crawlers.nodes.find(n => n.hp > 0 && Math.hypot(n.x-g.player.x,n.y-g.player.head.y,n.z-g.player.z)<8 && g.world.clearLine(g.player.head,n,.05));
      if (enemy) { crawlerID=enemy.id; mark('crawler encounter'); continue; }
      const n = g.deep.nodes.find(n => !g.deep.state.repaired.includes(n.id));
      if (!n) { mark('furnace descent'); }
      else {
        const target = {x:n.x,y:n.y+.25,z:n.z-2}; steer(target,{cut:false,lift:g.player.head.y<target.y-.2});
        if (g.world.clearLine(g.player.head,n,.1) && Math.hypot(g.player.x-target.x,g.player.head.y-target.y,g.player.z-target.z)<1.1) steer(n,{cut:false,walk:false,lift:g.player.head.y<n.y-.15});
        const a = g.interaction();
        if (a?.kind === 'deep-station' && a.id === n.id && !a.locked) { g.use(); assert.ok(g.deep.state.repaired.includes(n.id)); mark(n.name+' restored'); if(crawlers && n.id===0 && !g.crawlers.state.impactHead && g.crawlers.state.recovered.length) {g.recall();mark('impact head workshop');} else mark('lower station descent'); }
        else harness.handlers.get('keydown')({code:'KeyQ',repeat:false,preventDefault(){}});
      }
    } else if (phase === 'furnace descent') {
      steer({x:4,y:-279,z:4},{cut:false}); harness.handlers.get('keydown')({code:'KeyQ',repeat:false,preventDefault(){}});
      if(g.player.y < -279) {
        g.clearInput(); const field=g.world.field.slice(), state=structuredClone(g.deep.state); const save=B.Saves.snapshot(g,true); await g.install(B.Saves.validate(save));
        assert.deepEqual(g.world.field,field); assert.deepEqual(g.deep.state.repaired,[0,1,2]); assert.ok(g.deep.state.open); g.recall(); mark('Otis return route');
      }
    } else if (phase === 'Otis return route') {
      steer({x:19,y:1.6,z:34.8},{cut:false});
      if(Math.hypot(g.player.x-19,g.player.z-34.8)<1) steer({x:19,y:1.55,z:38.4},{cut:false});
      if(g.interaction()?.kind==='resident' && g.interaction().id==='otis') {
        g.use(); const button=harness.elements.get('town-services').children.find(b=>b.children[0]?.textContent==='Return to Furnace approach'); assert.ok(button); button.onclick();
        assert.ok(g.player.y < -250); assert.equal(g.screen,null); mark('lower stations restored and return route used'); if (foreman) { g.selectTool('lance'); mark('furnace encounter'); } else { report.outcome='complete'; break; }
      }
    }
    if (phase === 'crawler encounter') {
      const n=g.crawlers.nodes.find(n=>n.id===crawlerID), target={x:n.x,y:n.y,z:n.z};
      if (g.player.y > -1) { throw Error('Crawler pilot was rescued before earning its tooth.'); }
      if(kinetics && g.kinetics.state.unlocked && !kineticUsed && n.hp>0) {kineticOreID=null;mark('kinetic ammunition');continue;}
      if (n.hp > 0) {
        const tool=n.shell>0?'lance':'axe'; if(g.expedition.state.tool!==tool)g.selectTool(tool);
        steer(target,{walk:Math.hypot(n.x-g.player.x,n.z-g.player.z)>2.5,lift:g.player.head.y<n.y-.4});
        if(n.phase==='windup')g.input.keys.add('KeyD');
        if(g.player.head.y>n.y+2)steer({x:g.player.x,y:g.player.y-3,z:g.player.z},{walk:false});
        if(!g.world.clearLine(g.player.head,n,.05)) harness.handlers.get('keydown')({code:'KeyQ',repeat:false,preventDefault(){}});
      } else {
        steer(n,{walk:Math.hypot(n.x-g.player.x,n.z-g.player.z)>2.3,lift:g.player.head.y<n.y-.4,cut:false});
        if(g.interaction()?.kind==='crawler-loot'){g.use();assert.ok(g.crawlers.state.recovered.includes(crawlerID));mark('basalt tooth recovered'); if(!g.crawlers.state.impactHead && g.deep.state.repaired.includes(0)){g.recall();mark('impact head workshop');}else mark('lower station descent');}
        else if(!g.world.clearLine(g.player.head,n,.05))harness.handlers.get('keydown')({code:'KeyQ',repeat:false,preventDefault(){}});
      }
    } else if (phase === 'impact head workshop') {
      steer({x:19,y:1.6,z:34.8},{cut:false}); if(Math.hypot(g.player.x-19,g.player.z-34.8)<1)steer({x:19,y:1.55,z:38.4},{cut:false});
      if(g.interaction()?.id==='otis') {
        g.use();const cash=g.economy.state.cash;harness.elements.get('town-services').children.find(b=>b.children[0]?.textContent==='Impact axe head').onclick();assert.ok(g.crawlers.state.impactHead);assert.equal(g.economy.state.cash,cash-240);
        const saved=B.Saves.snapshot(g,true);await g.install(B.Saves.validate(saved));assert.ok(g.crawlers.state.impactHead);assert.equal(g.crawlers.nodes[0].hp,0);g.play();g.use();
        harness.elements.get('town-services').children.find(b=>b.children[0]?.textContent==='Return to Rootworks pump house').onclick();assert.ok(g.player.y < -100);
        mark('impact head installed and rootworks return used');mark('lower station descent');
      }
    }
    if(phase==='Stonewright approach') {
      const n=g.kinetics.bench,p={x:n.x,y:n.y+.3,z:n.z+3};steer(p,{cut:false,lift:g.player.head.y<p.y-.2});
      if(Math.hypot(g.player.x-p.x,g.player.head.y-p.y,g.player.z-p.z)<1){g.selectTool('resonance');mark('Stonewright coils');}
      else harness.handlers.get('keydown')({code:'KeyQ',repeat:false,preventDefault(){}});
    } else if(phase==='Stonewright coils') {
      const k=g.kinetics,i=[0,1].find(i=>!k.state.coils.includes(i));
      if(i===undefined){g.selectTool('lance');mark('Stonewright recovery');}
      else {const p=k.coil(i);steer(p,{walk:false,lift:g.player.head.y<p.y-.7});}
    } else if(phase==='Stonewright recovery') {
      const k=g.kinetics,n=k.bench,contact=k.physics.contact(n),p={x:n.x,y:n.y-.18,z:n.z+.76};
      if(contact.density<-.004)steer(contact,{walk:false,lift:g.player.head.y<n.y-.5});
      else steer(p,{cut:false,walk:Math.hypot(g.player.x-p.x,g.player.z-p.z)>2.4,lift:g.player.head.y<n.y-.5});
      if(g.interaction()?.kind==='stonewright' && !g.interaction().locked){g.use();assert.ok(k.state.unlocked);g.clearInput();const field=g.world.field.slice(),save=B.Saves.snapshot(g,true);await g.install(B.Saves.validate(save));assert.ok(g.kinetics.state.unlocked);assert.deepEqual(g.world.field,field);mark('Stonewright sling earned and reloaded');g.selectTool('gravity');mark('lower station descent');}
    } else if(phase==='kinetic ammunition') {
      const enemy=g.crawlers.nodes.find(n=>n.id===crawlerID);
      if(enemy.hp<=0){mark('crawler encounter');continue;}
      if(kineticOreID===null || g.deposits.nodes[kineticOreID].collected){const ore=g.deposits.nodes.filter(n=>!n.collected && Math.abs(n.y-enemy.y)<8).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.head.y,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.y-g.player.head.y,b.z-g.player.z))[0];assert.ok(ore);kineticOreID=ore.id;}
      const ore=g.deposits.nodes[kineticOreID];if(g.expedition.state.tool!=='lance')g.selectTool('lance');steer(ore,{walk:Math.hypot(ore.x-g.player.x,ore.z-g.player.z)>3,lift:g.player.head.y<ore.y-.4});
      if(ore.motion!=='embedded' && g.orePhysics.contact(ore).density>=-.004 && Math.hypot(ore.x-g.player.x,ore.y-g.player.head.y,ore.z-g.player.z)<7 && g.world.clearLine(g.player.head,ore,.05)){g.selectTool('sling');g.input.fire=false;kineticLiftY=ore.y+2.2;mark('kinetic lift');}
    } else if(phase==='kinetic lift') {
      // A low ceiling may stop the player before the desired lift height. Start
      // pulling after a second there; the mineral still has to clear real rock.
      const ore=g.deposits.nodes[kineticOreID];steer(ore,{walk:false,lift:g.player.head.y<kineticLiftY,cut:g.player.head.y>kineticLiftY-.15 || g.clock-phaseStart>1 || g.kinetics.state.held!==null});
      if(g.kinetics.state.held!==null && g.kinetics.state.charge>.95){mark('kinetic aim');}
    } else if(phase==='kinetic aim') {
      const enemy=g.crawlers.nodes.find(n=>n.id===crawlerID);steer({x:enemy.x,y:enemy.y+.25,z:enemy.z},{walk:false,lift:g.player.head.y<kineticLiftY});
      if(g.kinetics.state.held===null){mark('kinetic ammunition');}
      else if(g.clock-phaseStart>.5){kineticHealth=enemy.hp+enemy.shell;g.input.fire=false;kineticShots++;mark('kinetic flight save');}
    } else if(phase==='kinetic flight save') {
      g.input.fire=false;g.input.keys.clear();
      if(g.kinetics.state.flights.length){const id=g.kinetics.state.flights[0].id,save=B.Saves.snapshot(g,true);await g.install(B.Saves.validate(save));assert.equal(g.kinetics.state.flights[0].id,id);assert.equal(g.deposits.nodes[id].collected,false);kineticReloaded=true;mark('mineral reloaded in flight');mark('kinetic impact');}
      else if(g.clock-phaseStart>.2)mark('kinetic impact');
    } else if(phase==='kinetic impact') {
      g.input.fire=false;g.input.keys.clear();const enemy=g.crawlers.nodes.find(n=>n.id===crawlerID);
      if(enemy.hp+enemy.shell<kineticHealth){kineticUsed=true;mark('saved mineral projectile damaged crawler');mark('crawler encounter');}
      else if(g.clock-phaseStart>3.2){assert.ok(kineticShots<5,'Five sling throws missed');kineticOreID=null;mark('kinetic ammunition');}
    }
    if (phase === 'furnace encounter') {
      const f = g.foreman;
      if (f.state.defeated) {
        assert.ok(g.economy.state.cash >= 5000); g.setScreen(null); g.player.pitch = -1.54; const edits=g.world.audit.edits;
        harness.handlers.get('keydown')({code:'KeyZ',repeat:false,preventDefault(){}}); assert.equal(f.state.forgeCooldown,6); assert.ok(g.world.audit.edits > edits);
        const saved=B.Saves.snapshot(g,true), cash=g.economy.state.cash; await g.install(B.Saves.validate(saved)); assert.ok(g.foreman.state.defeated); assert.equal(g.economy.state.cash,cash); assert.equal(g.foreman.state.forgeCooldown,6);
        mark('foreman defeated and foundry bore reloaded'); g.recall(); mark('powered common');
      } else if (g.player.y > -1) { mark('Otis return route'); }
      else {
        const lock=f.nodes.slice(1).find(n=>n.hp>0), target=lock || f.core;
        const horizontal=Math.hypot(target.x-g.player.x,target.z-g.player.z), quake=['quake-windup','quake'].includes(f.state.phase);
        steer(target,{walk:horizontal>3.6,lift:quake ? g.player.y<f.core.y+.2 : g.player.head.y<target.y-.3});
        if(f.state.phase==='aim') g.input.keys.add('KeyD');
        if(target.phase==='buried' && g.expedition.cooldown<=0) harness.handlers.get('keydown')({code:'KeyQ',repeat:false,preventDefault(){}});
      }
    } else if (phase === 'powered common') {
      steer({x:5,y:1,z:43},{cut:false});
      if(Math.hypot(g.player.x-5,g.player.z-43)<1) { g.view.render(g,0,g.clock);assert.ok(g.view.commonBeacon.visible);assert.ok(g.view.commonLight.intensity>0);g.town.talk('mara');assert.equal(g.town.talk('mara').chapter,'foreman');report.outcome='complete';mark('powered Ridge Common');break; }
    }
    if(demolition && !phase.startsWith('echo') && g.gadgets.remoteCount && g.clock-lastBomb>.9) harness.handlers.get('keydown')({code:'KeyH',repeat:false,preventDefault(){}});
    g.update(dt);
    if(g.screen==='ending') report.endingSeen=true;
    const interval=Math.floor(g.clock/30); if(interval!==lastReport) { lastReport=interval; console.log(`t=${g.clock.toFixed(0)} ${phase} p=${g.player.x.toFixed(1)},${g.player.y.toFixed(1)},${g.player.z.toFixed(1)} cargo=${g.economy.count} edits=${g.world.audit.edits} snag=${g.expedition.snagged}`); }
    if(g.clock-phaseStart>240) throw Error(`No milestone for four simulated minutes: ${phase}`);
    if(frame%600===0) await new Promise(r=>setTimeout(r,0));
  }
  if(report.outcome!=='complete') throw Error('Journey exceeded simulation limit');
  if(parcel)await (await import('./journey-eastcut.mjs')).journeyEastcut(harness,report);
  assert.deepEqual(g.expedition.state.recovered, [0,1]); assert.equal(g.expedition.state.runes.length,3); assert.ok(g.expedition.state.awakened); assert.equal(g.expedition.state.vaults.length,3); assert.ok(report.endingSeen,'final recovery did not show the ending');
  if(demolition) assert.ok(['sticky','bore'].every(mode=>report.charges.some(c=>c.mode===mode)),'journey did not exercise both new charge types');
  if(thunderstone) { assert.ok(g.thunder.nodes.slice(0,4).every(n=>n.collected)); assert.ok(report.milestones.some(m=>m.name==='thunderstone seam opened')); console.log('COMPLETE thunderstone choice: excavated and recovered one crystal, planted a real remote, opened the remaining seam and finished the campaign.'); }
  if(freight) { assert.ok(freightDelivered>0); assert.equal(g.freight.stockCount,0); assert.equal(g.freight.loadCount,0); console.log('COMPLETE freight loop: earned crane, placed dock, shipped real cargo, collected yard payment and continued the campaign.'); }
  if(mysteries) { assert.deepEqual(g.mysteries.state.solved,[0,1]); assert.equal(g.gadgets.spec('bore').length,9); assert.ok(g.mysteries.focus(3)); console.log('COMPLETE optional discoveries: excavated both sites, synchronized real charges, reconnected prisms and earned both rewards.'); }
  B.Saves.validate(B.Saves.snapshot(g));
  if(kinetics){assert.ok(g.kinetics.state.unlocked);assert.ok(kineticUsed);assert.ok(kineticReloaded,'No active mineral flight was reloaded');console.log('COMPLETE Stonewright journey: excavated and resonated both workshop coils, recovered the sling, reloaded a thrown mineral in flight and damaged a crawler.');}
  if (crawlers) { assert.ok(g.crawlers.state.impactHead); assert.ok(g.crawlers.state.recovered.includes(200)); console.log('COMPLETE crawler journey: earned the rootway, fought a lower-mine crawler, recovered its tooth, bought/reloaded the impact head and used Otis return travel.'); }
  if (rescue) { assert.ok(g.rescue.rescued); assert.ok(g.town.state.met.includes('inez')); console.log('COMPLETE rescue journey: excavated the survey bell, powered its winch, cleared its ascent, met Inez at the office, bought a real mineral chart and reloaded it.'); }
  if (foreman) { assert.ok(g.foreman.state.defeated); console.log('COMPLETE furnace journey: excavated pressure locks, fought the physical furnace, earned and used foundry bore, reloaded the reward and returned to the powered common.'); }
  if (refuges) { assert.deepEqual(g.refuges.state.lit, [0]); console.log('COMPLETE survey refuge: excavated cabinet, spent one light, charted passages, reloaded exact terrain and completed the campaign.'); }
  console.log(`COMPLETE ${legacy ? 'legacy-claim' : 'fresh-claim'} journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.`);
} catch(error) { report.outcome='failed'; report.error=error.message; report.player=g.player.position; report.cutter={contact:g.cutter.contact,target:g.cutter.target}; report.load=g.expedition.bodies.map(b=>({id:b.id,x:b.x,y:b.y,z:b.z,motion:b.motion})); fs.writeFileSync(new URL('./out/journey-stall.json',import.meta.url),JSON.stringify(B.Saves.snapshot(g,true))); console.error(report.error); process.exitCode=1; }
finally { report.seconds=+g.clock.toFixed(1); report.terrainEdits=g.world.audit.edits; fs.writeFileSync(new URL(parcel?'./out/journey-parcel.json':kinetics?'./out/journey-kinetics.json':crawlers?'./out/journey-crawlers.json':rescue?'./out/journey-rescue.json':foreman?'./out/journey-foreman.json':deep?'./out/journey-deep.json':legacy?'./out/journey-legacy.json':refuges?'./out/journey-refuges.json':thunderstone?'./out/journey-thunderstone.json':freight?'./out/journey-freight.json':mysteries?'./out/journey-mysteries.json':demolition?'./out/journey-demolition.json':'./out/journey.json',import.meta.url),JSON.stringify(report,null,2)); harness.close(); }
