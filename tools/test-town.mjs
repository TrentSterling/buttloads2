// Production town, movement, economy and persistence with an inert renderer.
import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), g = h.game, B = globalThis.B2;
export let townChecks = 0;
const test = async (name, fn) => { await fn(); townChecks++; console.log('PASS town: ' + name); };
const aim = p => { const a = g.player.head, dx = p.x - a.x, dy = (p.y ?? 1.55) - a.y, dz = p.z - a.z; g.player.yaw = Math.atan2(-dx, -dz); g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); };
const atCounter = id => { const n = B.TOWN.people.find(n => n.id === id); g.player.teleport(n.x, .06, n.z - 2.4); aim(n); g.setScreen(null); return n; };
const walk = (x, z) => {
  for (let i = 0; i < 7200 && Math.hypot(g.player.x - x, g.player.z - z) > .2; i++) {
    aim({ x, y: g.player.head.y, z }); g.player.step(1 / 120, new Set(['KeyW']), 6);
  }
  assert.ok(Math.hypot(g.player.x - x, g.player.z - z) < .3, `route reached ${g.player.x.toFixed(2)},${g.player.z.toFixed(2)} instead of ${x},${z}`);
};
const buttons = () => h.elements.get('town-services').children;
const button = name => buttons().find(b => b.children[0].textContent === name);
// Tests never call pointer lock or a real audio device.
g.play = () => g.setScreen(null);
try {
  await test('fresh Game builds two residents and an additive empty town history', () => {
    assert.deepEqual(g.town.state, { version: 1, met: [], heard: [] }); assert.equal(g.view.townRigs.length, 3); assert.equal(g.view.townRigs.filter(r => r.root.visible).length, 2);
    let meshes = 0;
    g.view.townScene.updateMatrixWorld(true);
    g.view.townScene.traverse(n => { if (!n.isMesh) return; meshes++; assert.ok(n.matrixWorld.elements.every(Number.isFinite)); for (const a of Object.values(n.geometry.attributes)) assert.ok(a.array.every(Number.isFinite)); });
    assert.ok(meshes > 40); assert.ok(g.view.obstacles.length > 30);
  });
  await test('walk from the claim through town and both real doorways, then return', () => {
    g.player.teleport(7, .06, 12); walk(7, 29.5); walk(-9, 29.5); walk(-9, 35);
    assert.equal(g.town.target(g.player, g.world, g.view.obstacles)?.id, 'mara');
    walk(-9, 29.5); walk(19, 29.5); walk(19, 36);
    assert.equal(g.town.target(g.player, g.world, g.view.obstacles)?.id, 'otis');
    walk(19, 29.5); walk(10, 29.5); walk(10, 12);
    assert.ok(g.player.y > -.1 && g.player.y < .4);
  });
  await test('walls, counters, people and roof block movement while doors are open', () => {
    const b = B.TOWN.buildings[0];
    assert.ok(g.player.blocked(b.x - b.w / 2, .06, b.z));
    assert.ok(g.player.blocked(b.x, .06, b.z + b.d / 2));
    assert.ok(g.player.blocked(-9, .06, 36.65));
    assert.ok(g.player.blocked(-9, .06, 37.4));
    assert.ok(!g.player.blocked(b.x, .06, b.z - b.d / 2));
    assert.ok(g.player.blocked(b.x, b.h - 1, b.z));
  });
  await test('surface travel extends past the old fence through gates; unowned soil is protected', () => {
    g.player.teleport(19, .06, 4); walk(42, 4); assert.equal(B.Town.region(g.player), 'Common land');
    assert.ok(g.player.blocked(21, .06, 12)); assert.ok(!g.player.blocked(21, .06, 4));
    assert.ok(g.player.blocked(B.SURFACE.maxX + 1, .06, 4));
    const field = g.world.field.slice(), edits = g.world.audit.edits;
    assert.equal(g.world.carve({ x: 26, y: -.5, z: 4 }, 3), 0);
    aim({ x: 43, y: -1, z: 4 }); g.cutter.update(.05, g.player, 4, true);
    assert.ok(g.cutter.contact.protected); assert.equal(g.world.audit.edits, edits); assert.deepEqual(g.world.field, field);
    assert.match(g.gadgets.placement('bomb', g.player).reason, /marked claim/);
  });
  await test('E conversation requires aim, reach and an unobstructed physical line', () => {
    const n = atCounter('mara'); assert.equal(g.interaction().kind, 'resident');
    g.player.yaw += Math.PI; assert.equal(g.town.target(g.player, g.world, g.view.obstacles), null); aim(n);
    assert.equal(g.town.target(g.player, g.world, [...g.view.obstacles, [-10, 0, 35.8, -8, 3, 36]]), null);
    g.player.teleport(n.x, .06, n.z + 3); aim(n); assert.equal(g.town.target(g.player, g.world, g.view.obstacles), null);
    g.player.teleport(n.x, .06, n.z - 5); aim(n); assert.equal(g.townUI.open('mara'), false);
  });
  await test('opening a conversation cancels a held throw and records one introduction', () => {
    atCounter('mara'); g.input.fire = true; g.input.keys.add('KeyW'); g.input.aim = 'bomb'; const supplies = g.gadgets.state.supplies.bombs;
    h.handlers.get('keydown')({ code: 'KeyE', preventDefault() {} }); assert.equal(g.screen, 'town'); assert.equal(g.running, false); assert.equal(g.input.fire, false); assert.equal(g.input.keys.size, 0); assert.equal(g.input.aim, null);
    g.releaseBomb(); assert.equal(g.gadgets.state.supplies.bombs, supplies);
    assert.deepEqual(g.town.state.met, ['mara']); assert.deepEqual(g.town.state.heard, ['mara:hello']);
    atCounter('mara'); g.use(); assert.deepEqual(g.town.state.heard, ['mara:hello']);
    assert.match(h.elements.get('town-dialogue').textContent, /Mara/); assert.equal(buttons().length, 5); assert.ok(button('Eastcut deed').disabled);
    let prevented = false; h.handlers.get('keydown')({ code: 'Tab', preventDefault() { prevented = true; } }); assert.equal(prevented, false); assert.equal(g.screen, 'town');
  });
  await test('Mara sells real supplies atomically and pays the existing mineral ledger once', () => {
    g.economy.state.cash = 56; g.townUI.refresh(); const s = g.gadgets.state.supplies, before = { ...s };
    button('Three charges').onclick(); assert.equal(s.bombs, before.bombs + 3); assert.equal(g.economy.state.cash, 24);
    button('Six work lights').onclick(); assert.equal(s.lights, before.lights + 6); assert.equal(g.economy.state.cash, 0); assert.ok(button('Three charges').disabled);
    button('Three charges').onclick(); assert.equal(s.bombs, before.bombs + 3);
    const ore = g.deposits.nodes.find(n => !n.collected && n.kind === 0); assert.ok(g.economy.collect(ore.kind)); ore.collected = true;
    g.townUI.refresh(); button('Sell your haul').onclick(); const paid = g.economy.state.cash;
    assert.ok(paid >= B.ORES[0].value); assert.equal(g.economy.count, 0); assert.ok(button('Sell your haul').disabled);
    button('Sell your haul').onclick(); assert.equal(g.economy.state.cash, paid);
    assert.ok(B.Saves.validate(B.Saves.snapshot(g)));
  });
  await test('Otis respects upgrade and freight gates; stale buttons cannot buy after leaving', () => {
    atCounter('otis'); g.use(); g.economy.state.cash = 1000; g.townUI.refresh();
    const level = g.economy.state.gear.drill; button('Cutter').onclick(); assert.equal(g.economy.state.gear.drill, level + 1);
    assert.ok(button('Freight rig').disabled); button('Freight rig').onclick(); assert.equal(g.freight.state.owned, false);
    const cash = g.economy.state.cash, stale = button('Cargo rack'); h.handlers.get('keydown')({ code: 'Escape', preventDefault() {} }); assert.equal(g.screen, null); stale.onclick(); assert.equal(g.economy.state.cash, cash);
    atCounter('otis'); g.use(); h.elements.get('town-advice').onclick(); assert.match(h.elements.get('town-dialogue').textContent, /flywheel/);
  });
  await test('discovery dialogue progresses without paying duplicate rewards or revealing the ending early', () => {
    const progress = B.freshState(), town = new B.Town(progress);
    assert.equal(town.talk('otis').chapter, 'hello'); progress.trips = 1; assert.equal(town.talk('otis').chapter, 'first');
    progress.expedition.recovered.push(0); assert.equal(town.talk('otis').chapter, 'flywheel');
    progress.expedition.recovered.push(1); assert.equal(town.talk('otis').chapter, 'engine');
    progress.expedition.awakened = true; assert.equal(town.talk('otis').chapter, 'heart');
    progress.expedition.vaults = [0, 1, 2]; assert.equal(town.talk('otis').chapter, 'after'); assert.equal(town.talk('otis').fresh, false);
    assert.equal(progress.cash, 0); assert.equal(town.state.heard.length, 6); assert.ok(B.Town.validate(town.state));
  });
  await test('portable save keeps town history, expanded position, excavations and inventory on install', async () => {
    g.world.carve({ x: 3, y: -2, z: 8 }, 1); g.player.teleport(42, .06, 4);
    const save = B.Saves.snapshot(g, true), data = B.Saves.validate(save), field = g.world.field.slice(), state = structuredClone(g.economy.state);
    await g.install(data); assert.equal(g.player.x, 42); assert.equal(g.player.z, 4); assert.deepEqual(g.world.field, field);
    assert.deepEqual(g.town.state, state.expedition.town); assert.equal(g.economy.state.cash, state.cash); assert.deepEqual(g.economy.state.sold, state.sold);
  });
  await test('old claims gain town state without a terrain reset and invalid dialogue fails before install', async () => {
    const original = B.Saves.snapshot(g); delete original.state.expedition.town; original.player.x = 0; original.player.z = 12;
    const validated = B.Saves.validate(original); await g.install(validated); assert.deepEqual(g.world.field, original.field); assert.deepEqual(g.town.state.met, []);
    const good = B.Saves.snapshot(g), before = structuredClone(g.town.state);
    for (const bad of [{ version: 2, met: [], heard: [] }, { version: 1, met: ['stranger'], heard: [] }, { version: 1, met: ['mara', 'mara'], heard: [] }, { version: 1, met: [], heard: ['otis:hello'] }, { version: 1, met: ['otis'], heard: ['otis:evil'] }]) {
      const copy = structuredClone(good); copy.state.expedition.town = bad; assert.throws(() => B.Saves.validate(copy), /town/);
    }
    const out = structuredClone(good); out.player.x = B.SURFACE.maxX + 1; assert.throws(() => B.Saves.validate(out), /player/); assert.deepEqual(g.town.state, before);
  });
  await test('town animation leaves simulation state untouched and respects motion preference', () => {
    const before = B.Saves.snapshot(g); g.settings.motion = false; g.view.render(g, .02, 20);
    for (const rig of g.view.townRigs) { assert.equal(rig.body.rotation.z, 0); assert.equal(rig.head.rotation.z, 0); }
    g.settings.motion = true; g.view.render(g, .02, 21); assert.deepEqual(g.world.field, before.field); assert.deepEqual(g.economy.state, before.state);
    for (const rig of g.view.townRigs) assert.ok([rig.head.rotation.y, rig.head.rotation.z].every(Number.isFinite));
  });
} finally { h.close(); }
console.log(`COMPLETE ${townChecks} town checks passed (inert renderer and DOM; no browser or OS input)`);
