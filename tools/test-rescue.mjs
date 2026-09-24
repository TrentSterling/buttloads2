// Physical rescue and earned town services, using real Game with inert DOM/renderer.
import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), g = h.game, B = globalThis.B2;
export let rescueChecks = 0;
const test = async (name, fn) => { await fn(); rescueChecks++; console.log('PASS rescue: ' + name); };
const aim = p => { const a = g.player.head, dx = p.x - a.x, dy = p.y - a.y, dz = p.z - a.z; g.player.yaw = Math.atan2(-dx, -dz); g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); };
const intercom = () => aim({ x: 8, y: g.rescue.state.y + .2, z: 7.22 });
const button = name => h.elements.get('town-services').children.find(b => b.children[0].textContent === name);
const step = (seconds, hz = 60) => { g.setScreen(null); for (let i = 0; i < seconds * hz; i++) { g.update(1 / hz); if (!g.running) g.setScreen(null); } };
try {
  await test('stranded surveyor is absent from town, protected and saved without modifying terrain', () => {
    assert.equal(g.rescue.state.phase, 'stranded'); assert.equal(g.town.people().length, 2);
    assert.equal(g.town.talk('inez'), null); assert.ok(!g.view.townRigs.find(r => r.person.id === 'inez').root.visible);
    assert.equal(g.rescue.markers().length, 0); assert.equal(g.rescue.control(g.player), false);
    assert.ok(!g.combat.targets().some(n => n.name === 'Inez Rook'));
    assert.ok(B.Saves.validate(B.Saves.snapshot(g)));
  });
  await test('Mara marks the real bell; scanner and survey retain its moving signal', () => {
    g.player.teleport(-9, .06, 35); aim({ x: -9, y: 1.55, z: 37.4 }); g.play(); g.use();
    button("Inez's last position").onclick(); assert.ok(g.rescue.state.known); assert.ok(g.survey.markers(g).some(m => m.type === 'rescue'));
    g.player.teleport(8, -17, 5); assert.equal(g.rescue.scan(g.player.head, 12).length, 1);
    g.play(); g.scanCooldown = 0; g.scan(); assert.ok(g.view.ghostSlots.has('rescue'));
  });
  await test('real E intercom cancels held input; buried bell and missing cell cannot start the winch', () => {
    g.world.carve({ x: 8, y: -22.8, z: 5.2 }, 1.85);
    g.player.teleport(8, -23.5, 5.3); intercom(); g.play();
    assert.equal(g.interaction()?.kind, 'rescue');
    g.input.keys.add('KeyW'); g.input.fire = true; g.input.aim = 'bomb';
    h.handlers.get('keydown')({ code: 'KeyE', preventDefault() {} });
    assert.equal(g.screen, 'rescue'); assert.ok(g.rescue.state.met); assert.equal(g.input.keys.size, 0); assert.equal(g.input.fire, false); assert.equal(g.input.aim, null);
    assert.ok(h.elements.get('rescue-control').disabled); const lights = g.expedition.state.supplies.lights;
    h.elements.get('rescue-control').onclick(); assert.equal(g.expedition.state.supplies.lights, lights); assert.equal(g.rescue.state.phase, 'stranded');
    g.world.carve({ x: 8, y: -23, z: 8 }, 2.7); g.expedition.state.supplies.lights = 0; g.openRescue(); assert.ok(h.elements.get('rescue-control').disabled);
    assert.equal(g.rescue.control(g.player), false); g.expedition.state.supplies.lights = lights;
  });
  await test('one cell starts a terrain-blocked lift; its exact obstruction is shown without free excavation', () => {
    g.openRescue(); const lights = g.expedition.state.supplies.lights, field = g.world.field.slice();
    h.elements.get('rescue-control').onclick(); assert.equal(g.rescue.state.phase, 'hoisting'); assert.equal(g.expedition.state.supplies.lights, lights - 1);
    step(3); assert.match(g.rescue.blockedBy, /Rock/); assert.ok(g.rescue.state.y > -23 && g.rescue.state.y < -19);
    assert.ok(g.rescue.contact().density >= -.01); assert.deepEqual(g.world.field, field);
    g.view.renderRescue(g, 3); assert.ok(g.view.rescueStop.visible); assert.equal(g.view.rescueStop.position.y, g.rescue.obstruction.y);
    const pos = g.rescue.state.y; step(1); assert.equal(g.rescue.state.y, pos);
  });
  await test('bell sweep stops for player and machinery; holding and resuming never costs a second cell', () => {
    for (let y = -24; y <= 3; y += 1) g.world.carve({ x: 8, y, z: 8 }, 1.8);
    const r = g.rescue, lights = g.expedition.state.supplies.lights;
    g.player.teleport(8, r.state.y + 1.27, 8); let y = r.state.y;
    r.update(.05, g.player); assert.match(r.blockedBy, /Stand clear/); assert.ok(r.state.y - y < .02); y = r.state.y;
    g.player.teleport(5, r.state.y - .8, 8);
    r.update(.05, g.player, [[7.7, y + 1.26, 7.7, 8.3, y + 2, 8.3]]); assert.match(r.blockedBy, /Equipment/); assert.equal(r.state.y, y);
    g.world.carve({ x: 8, y: r.state.y, z: 5.5 }, 2);
    g.player.teleport(8, r.state.y - .5, 5.3); intercom(); assert.ok(r.control(g.player)); assert.equal(r.state.phase, 'held');
    r.update(1, g.player); assert.equal(r.state.y, y); assert.ok(r.control(g.player)); assert.equal(g.expedition.state.supplies.lights, lights);
  });
  await test('30/60/120 Hz winch advance agrees; narrow shaft walls block the full bell, not just its center', () => {
    const results = [];
    for (const hz of [30, 60, 120]) {
      const state = structuredClone(g.economy.state); state.expedition.rescue.y = -18;
      const r = new B.Rescue(g.world, state), p = new B.Player(g.world); p.teleport(0, .1, 12);
      for (let i = 0; i < hz * 2; i++) r.update(1 / hz, p);
      results.push(r.state.y);
    }
    assert.ok(Math.max(...results) - Math.min(...results) < 1e-8);
    const w = { density(x, y, z) { return y > -20 && x > 8.5 ? -1 : 1; } }, state = B.freshState();
    state.expedition.rescue = { version: 1, known: true, met: true, phase: 'hoisting', y: -22, lead: null };
    const r = new B.Rescue(w, state); for (let i = 0; i < 240; i++) r.update(1 / 120, g.player);
    assert.ok(r.state.y <= -21.25 + 1e-8); assert.match(r.blockedBy, /Rock/);
  });
  await test('mid-lift portable save reload keeps height, supplies, terrain and the active machinery', async () => {
    g.player.teleport(0, .08, 12); step(1);
    const snapshot = B.Saves.snapshot(g, true), before = { ...g.rescue.state }, field = g.world.field.slice(), lights = g.expedition.state.supplies.lights;
    await g.install(B.Saves.validate(snapshot)); assert.deepEqual(g.rescue.state, before); assert.deepEqual(g.world.field, field); assert.equal(g.expedition.state.supplies.lights, lights);
    step(.5); assert.ok(g.rescue.state.y > before.y); g.view.render(g, .02, 4); assert.equal(g.view.rescueBell.position.y, g.rescue.state.y);
  });
  await test('a completed rescue opens the office once, preserves the empty bell and allows a real walk to Inez', () => {
    step(20); assert.ok(g.rescue.rescued); assert.equal(g.rescue.state.y, B.BELL.top);
    g.view.render(g, .02, 5); assert.ok(g.view.officeOpen.visible); assert.ok(!g.view.officeClosed.visible); assert.ok(!g.view.bellPerson.root.visible);
    assert.ok(g.view.townRigs.find(r => r.person.id === 'inez').root.visible); assert.equal(g.town.people().length, 3); assert.equal(g.rescue.markers().length, 0);
    const walk = (x, z) => { for (let i = 0; i < 6000 && Math.hypot(g.player.x - x, g.player.z - z) > .25; i++) { aim({ x, y: g.player.head.y, z }); g.player.step(1 / 120, new Set(['KeyW']), 6); } assert.ok(Math.hypot(g.player.x - x, g.player.z - z) < .3); };
    g.recall(); step(.02); walk(7, 29.5); walk(8, 46); walk(-24, 48); walk(-24, 52);
    aim({ x: -24, y: 1.55, z: 54.4 }); assert.equal(g.interaction()?.id, 'inez'); g.use(); assert.equal(g.screen, 'town'); assert.match(h.elements.get('town-dialogue').textContent, /tin can/);
    const events = g.rescue.events.length; g.rescue.update(.1, g.player); assert.equal(g.rescue.events.length, events);
  });
  await test('survey fees buy uncollected, unscanned deposits within earned depth; stale buttons cannot transact', () => {
    g.economy.state.cash = 80; g.economy.state.deepest = 24; g.townUI.refresh();
    const before = new Set(g.survey.ore), field = g.world.field.slice(), collected = g.deposits.nodes.filter(n => n.collected).length;
    button('Prospect a new seam').onclick(); assert.equal(g.economy.state.cash, 40); assert.ok(g.survey.ore.size > before.size);
    for (const id of g.survey.ore) if (!before.has(id)) { const n = g.deposits.nodes[id]; assert.ok(!n.collected && -n.y <= 36); }
    assert.deepEqual(g.world.field, field); assert.equal(g.deposits.nodes.filter(n => n.collected).length, collected); assert.ok(g.rescue.state.lead !== null);
    const known = g.mysteries.state.known.length; button('Read the old survey').onclick(); assert.equal(g.mysteries.state.known.length, known + 1); assert.equal(g.mysteries.state.solved.length, 0);
    const stale = button('Prospect a new seam'); button('Open my chart').onclick(); assert.equal(g.screen, 'survey'); assert.equal(Number(h.elements.get('survey-depth').value), Math.round(-g.deposits.nodes[g.rescue.state.lead].y)); stale.onclick(); assert.equal(g.economy.state.cash, 40);
    g.economy.state.cash = 0; assert.equal(g.rescue.chart(g.deposits, g.survey), null);
  });
  await test('reward, conversation and charts persist; corrupt and contradictory rescues are rejected', async () => {
    const good = B.Saves.snapshot(g, true), data = B.Saves.validate(good); await g.install(data);
    assert.ok(g.rescue.rescued); assert.ok(g.town.state.met.includes('inez')); assert.ok(g.survey.ore.has(g.rescue.state.lead));
    for (const change of [s => s.y = NaN, s => s.y = 99, s => s.phase = 'magic', s => s.met = false, s => s.known = false, s => s.lead = 999999, s => s.phase = 'stranded', s => s.lead = g.deposits.nodes.find(n => !g.survey.ore.has(n.id)).id]) {
      const bad = structuredClone(good); change(bad.state.expedition.rescue); assert.throws(() => B.Saves.validate(bad), /rescue|bell/i);
    }
    const conflict = structuredClone(good); delete conflict.state.expedition.rescue; assert.throws(() => B.Saves.validate(conflict), /Surveyor/);
    const inside = structuredClone(data); inside.state.expedition.rescue.y = -23; inside.state.expedition.rescue.phase = 'hoisting'; inside.state.expedition.rescue.lead = null;
    // Terrain corruption is checked independently of the town unlock dependency.
    inside.state.expedition.town.met = []; inside.state.expedition.town.heard = [];
    const raw = new B.World(data.state.seed, data.generation, data.depthVersion);
    assert.throws(() => B.Rescue.validate(inside.state.expedition.rescue, raw, g.deposits.nodes.length), /bell/i);
  });
  await test('old claims gain the stranded bell without rerolling terrain or inventories; rendering cannot advance rescue', async () => {
    const old = B.Saves.snapshot(g), field = g.world.field.slice(); delete old.state.expedition.rescue; old.state.expedition.town.met = []; old.state.expedition.town.heard = [];
    await g.install(B.Saves.validate(old)); assert.deepEqual(g.world.field, field); assert.equal(g.rescue.state.phase, 'stranded'); assert.equal(g.town.people().length, 2);
    const before = B.Saves.snapshot(g); g.view.render(g, .02, 10); assert.deepEqual(g.economy.state, before.state); assert.deepEqual(g.world.field, before.field);
    const bounds = new THREE.Box3().setFromObject(g.view.rescueBell), p = g.rescue.position;
    for (const [k, half] of [['x', .75], ['y', 1.25], ['z', .75]]) { assert.ok(bounds.min[k] >= p[k] - half - 1e-5); assert.ok(bounds.max[k] <= p[k] + half + 1e-5); }
    g.view.rescueScene.updateMatrixWorld(true); g.view.rescueScene.traverse(n => { if (!n.isMesh) return; assert.ok(n.matrixWorld.elements.every(Number.isFinite)); for (const a of Object.values(n.geometry.attributes)) assert.ok(a.array.every(Number.isFinite)); });
  });
} finally { h.close(); }
console.log(`COMPLETE ${rescueChecks} rescue checks passed (inert renderer and DOM; no browser or OS input)`);
