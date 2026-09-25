// Real simulation and Three.js scene construction, without a browser or OS input.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const root = path.resolve(import.meta.dirname, '..');
if (!globalThis.B2?.Gadgets) for (const name of ['core', 'town', 'caverns', 'deep-terrain', 'parcels', 'mesher', 'world', 'mining', 'player', 'ore', 'expedition', 'refuges', 'deep', 'combat', 'foreman', 'rescue', 'crawlers', 'kinetics', 'fossil', 'actions', 'gadgets', 'thunderstone', 'freight', 'mysteries', 'survey', 'persistence', 'feedback', 'audio', 'fieldkit', 'town-ui']) vm.runInThisContext(fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8'));
const B = globalThis.B2;
export let depthChecks = 0;
const test = async (name, fn) => { await fn(); depthChecks++; console.log('PASS depths: ' + name); };
const simulate = (seconds, fn, hz = 60) => { for (let i = 0; i < Math.round(seconds * hz); i++) fn(1 / hz); };
function setup() { const world = new B.World(260923), economy = new B.Economy(), deposits = B.generateDeposits(260923), orePhysics = new B.OreSystem(world, deposits.nodes), expedition = new B.Expedition(world, economy), gadgets = new B.Gadgets(world, economy.state.expedition), player = new B.Player(world); return { world, economy, deposits, orePhysics, expedition, gadgets, player, settings: {} }; }
function aim(player, p) { const h = player.head, dx = p.x - h.x, dy = p.y - h.y, dz = p.z - h.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); }
function shaft(world, x, z, from, to, r) { for (let y = from; y >= to; y -= .65) world.carve({ x, y, z }, r); }

await test('strata unlock distinct tools; recoveries and the heart gate powers', () => {
  const e = new B.Economy(), s = e.state;
  assert.deepEqual(B.availableTools(s), ['cutter']); s.deepest = 9; assert.ok(B.availableTools(s).includes('scoop')); s.deepest = 25; assert.ok(B.availableTools(s).includes('lance'));
  s.deepest = 73; assert.ok(!B.availableTools(s).includes('resonance')); s.expedition.recovered.push(1); assert.ok(B.availableTools(s).includes('resonance')); assert.ok(!B.availableTools(s).includes('gravity'));
  s.expedition.awakened = true; assert.ok(B.availableTools(s).includes('gravity')); assert.equal(B.chapter(58), 3); assert.equal(B.chapter(59), 4);
});
await test('scoop cuts a broader path and lance removes hard rock faster', () => {
  function cut(mode, depth) { const w = new B.World(1); w.field.fill(-2); const p = new B.Player(w); p.teleport(0, depth, 0); w.carve(p.head, 2); p.pitch = 0; const cutter = new B.Cutter(w); const before = w.field.slice(); simulate(2, dt => cutter.update(dt, p, 1, true, mode)); let volume = 0; for (let i = 0; i < before.length; i++) volume += w.field[i] - before[i]; return { volume, reach: w.ray(p.head, p.direction, 10)?.distance ?? 10, w }; }
  const cutter = cut('cutter', -3), scoop = cut('scoop', -3); assert.ok(scoop.volume > cutter.volume * 1.5);
  const hardScoop = cut('scoop', -47), lance = cut('lance', -47); assert.ok(lance.reach > hardScoop.reach + .3, `lance ${lance.reach} m vs scoop ${hardScoop.reach} m in basalt`);
});
await test('a wider attachment can ream an existing shaft while aimed along its open center', () => {
  const w = new B.World(1), p = new B.Player(w), cutter = new B.Cutter(w);
  shaft(w, 0, 0, 0, -20, 1.22); p.teleport(0, -10, 0); p.pitch = 1.54;
  assert.ok(w.density(1.4, -8, 0) < 0);
  simulate(3, dt => cutter.update(dt, p, 1, true, 'scoop'));
  assert.ok(w.density(1.4, -8, 0) > 0, 'wide brush missed the walls around an existing open shaft');
});
await test('long seams lead downward, fork into richer ore, and keep old IDs intact', () => {
  const d = B.generateDeposits(260923), seams = d.veins.filter(v => v.points);
  assert.equal(seams.length, 4); assert.ok(seams.every(v => v.points.length === 35 && v.points.at(-1).y < v.points[0].y - 9));
  for (const s of seams.slice(0, 3)) assert.ok(d.nodes.some(n => n.vein === d.veins.indexOf(s) && n.kind > s.kind));
  assert.ok(Math.abs(d.nodes[0].x + 1.15) < 1e-12); assert.equal(d.nodes[0].kind, 0);
});
await test('a narrow player shaft blocks a bulky load until widened', () => {
  const g = setup(), exp = g.expedition, body = exp.bodies[1]; g.economy.state.deepest = 35;
  shaft(g.world, 5, -4, 0, -34, .95);
  simulate(1, dt => exp.update(dt, g.player, false, g.orePhysics)); g.player.teleport(5, body.y + .8, -4); assert.ok(exp.attach(1, g.player.head));
  simulate(4, dt => { g.player.y = Math.min(-24, g.player.y + dt * 2); exp.update(dt, g.player, false, g.orePhysics); });
  assert.ok(body.y < -29, 'bulky engine squeezed through a narrow shaft'); assert.ok(!exp.state.recovered.includes(1));
  assert.ok(exp.obstruction, 'caught load has no obstruction marker'); assert.ok(g.world.density(exp.obstruction.x, exp.obstruction.y, exp.obstruction.z) < 0, 'marker does not point to rock');
  shaft(g.world, 5, -4, 0, -34, 2.1); g.player.teleport(5, body.y + .8, -4); assert.ok(exp.attach(1, g.player.head));
  simulate(19, dt => { g.player.y = Math.min(5, g.player.y + dt * 2.5); exp.update(dt, g.player, false, g.orePhysics); });
  assert.ok(exp.state.recovered.includes(1)); assert.equal(g.economy.state.cash, 900); simulate(1, dt => exp.update(dt, g.player, false, g.orePhysics)); assert.equal(g.economy.state.cash, 900);
  assert.equal(exp.obstruction, null);
});
await test('physical flywheel delivery unlocks a collision-checked return anchor', () => {
  const g = setup(), exp = g.expedition, b = exp.bodies[0]; g.economy.state.deepest = 15; shaft(g.world, -4, 1, 0, -14, 1.65);
  g.player.teleport(-4, b.y + .8, 1); assert.ok(exp.attach(0, g.player.head));
  simulate(10, dt => { g.player.step(dt, new Set(['Space']), 3.5); exp.update(dt, g.player, false, g.orePhysics); });
  assert.ok(exp.state.recovered.includes(0)); assert.equal(g.economy.state.cash, 240);
  g.player.teleport(-4, -11, 1); assert.ok(exp.placeAnchor(g.player)); g.player.teleport(0, .1, 13); assert.ok(exp.returnToAnchor(g.player)); assert.equal(g.player.y, -11);
  assert.equal(exp.returnToAnchor(g.player), false); assert.equal(g.world.density(g.player.x, g.player.head.y, g.player.z) < 0, false);
});
await test('resonance awakens exposed stones, opens the heart, then magic opens geodes', () => {
  const g = setup(), exp = g.expedition; g.economy.state.deepest = 70; exp.state.recovered.push(1); exp.select('resonance');
  assert.equal(exp.awaken(g.player.head), false);
  g.player.teleport(B.SEAL.x, -53, B.SEAL.z);
  for (const [i, rune] of B.RUNES.entries()) { g.world.carve(rune, 1.2); aim(g.player, rune); exp.cooldown = 0; assert.ok(exp.pulse(g.player, false)); assert.ok(exp.state.runes.includes(i), 'rune was not awakened'); }
  g.player.teleport(B.HEART.x, B.HEART.y - g.player.eye, B.HEART.z + 1.5); assert.ok(exp.awaken(g.player.head)); assert.equal(exp.state.tool, 'gravity'); assert.equal(exp.awaken(g.player.head), false);
  const cash = g.economy.state.cash;
  for (const v of B.VAULTS) { g.world.carve(v, 3.2); g.player.teleport(v.x, v.y - g.player.eye, v.z + 2); aim(g.player, v); exp.cooldown = 0; assert.ok(exp.pulse(g.player, true)); }
  assert.equal(exp.state.vaults.length, 3); assert.equal(g.economy.state.cash, cash + 8800); exp.cooldown = 0; exp.pulse(g.player, true); assert.equal(g.economy.state.cash, cash + 8800);
});
await test('pulses cannot awaken a stone through an intervening wall', () => {
  const g = setup(), exp = g.expedition; exp.state.recovered.push(1); const r = B.RUNES[0];
  g.world.carve({ x: r.x - 6, y: r.y, z: r.z }, 1.1); g.player.teleport(r.x - 6, r.y - g.player.eye, r.z); aim(g.player, r);
  assert.ok(exp.pulse(g.player, false)); assert.ok(!exp.state.runes.includes(0));
});
await test('gravity draws loose ore along clear paths and cannot pull through rock', () => {
  const g = setup(), n = { id: 0, x: 0, y: -4, z: -2, radius: .24, kind: 0, collected: false };
  g.world.carve(n, 1.3); g.world.carve({ x: 0, y: -4, z: 5 }, 1.3); const physics = new B.OreSystem(g.world, [n]);
  g.expedition.state.awakened = true; g.expedition.select('gravity'); g.player.teleport(0, -4 - g.player.eye, 5);
  g.expedition.update(1 / 60, g.player, true, physics); assert.equal(n.vz, 0);
  for (let z = -2; z <= 5; z += .5) g.world.carve({ x: 0, y: -4, z }, 1.3);
  simulate(.3, dt => { g.expedition.update(dt, g.player, true, physics); physics.update(dt); }); assert.ok(n.z > 0); assert.ok(g.world.density(n.x, n.y, n.z) > 0);
});
await test('thrown bombs wait for the fuse, excavate rock, and apply impulses once', () => {
  const g = setup(); g.player.teleport(0, .1, 7); g.player.pitch = -.9;
  const revision = g.world.revision; assert.ok(g.gadgets.deploy('bomb', g.player)); assert.equal(g.expedition.state.supplies.bombs, 2);
  simulate(2, dt => g.gadgets.update(dt, g.orePhysics, g.expedition.physics, g.player)); assert.equal(g.world.revision, revision);
  simulate(1, dt => g.gadgets.update(dt, g.orePhysics, g.expedition.physics, g.player)); assert.ok(g.world.revision > revision); assert.equal(g.gadgets.nodes.length, 0); assert.equal(g.gadgets.blasts.length, 1);
  assert.ok(g.deposits.nodes.some(n => n.motion !== 'embedded' && Math.hypot(n.vx, n.vy, n.vz) > 1));
  const r = g.world.revision; simulate(1, dt => g.gadgets.update(dt, g.orePhysics, g.expedition.physics, g.player)); assert.equal(g.world.revision, r);
});
await test('lamps settle, persist and fall when their supporting floor is cut away', () => {
  const g = setup(); g.player.teleport(3, .1, 3); g.player.pitch = -1;
  assert.ok(g.gadgets.deploy('lamp', g.player)); simulate(3, dt => g.gadgets.update(dt)); const lamp = g.gadgets.nodes[0]; assert.equal(lamp.motion, 'resting');
  const oldY = lamp.y; g.world.carve({ x: lamp.x, y: -1, z: lamp.z }, 2); simulate(.5, dt => g.gadgets.update(dt)); assert.ok(lamp.y < oldY - .2);
  const saved = B.Saves.validate(B.Saves.snapshot(g)); assert.equal(saved.state.expedition.devices[0].y, lamp.y);
});
await test('charges and lamps retain sparse IDs, remaining fuse and motion across a save', () => {
  const g = setup(); g.player.teleport(0, .1, 5); g.player.pitch = -.9;
  g.gadgets.deploy('bomb', g.player); g.gadgets.deploy('lamp', g.player); simulate(3, dt => { g.gadgets.update(dt); g.orePhysics.update(dt); g.expedition.update(dt, g.player, false); });
  assert.equal(g.gadgets.nodes[0].id, 1); g.gadgets.deploy('bomb', g.player); simulate(.25, dt => g.gadgets.update(dt));
  const saved = B.Saves.validate(B.Saves.snapshot(g, true)), w = new B.World(saved.state.seed); w.field = saved.field;
  const restored = new B.Gadgets(w, saved.state.expedition); assert.deepEqual(restored.state.devices, g.gadgets.state.devices);
  simulate(.5, dt => { restored.update(dt); g.gadgets.update(dt); }); assert.deepEqual(restored.state.devices, g.gadgets.state.devices);
});
await test('supply spending is atomic and rejected placement consumes nothing', () => {
  const g = setup(); assert.equal(g.gadgets.restock('bomb', g.economy), false); g.economy.state.cash = 32; assert.ok(g.gadgets.restock('bomb', g.economy)); assert.equal(g.economy.state.cash, 0); assert.equal(g.expedition.state.supplies.bombs, 6);
  g.player.teleport(12, -5, 12); assert.equal(g.gadgets.deploy('bomb', g.player), false); assert.equal(g.expedition.state.supplies.bombs, 6);
});
await test('malformed progression and physical equipment saves fail before mutation', () => {
  const g = setup(), original = B.Saves.snapshot(g); B.Saves.validate(original);
  for (const mutate of [e => e.tool = 'gravity', e => e.awakened = true, e => e.recovered = [1, 1], e => e.runes = [0], e => e.vaults = [0], e => e.supplies.bombs = -1, e => e.devices = [{ id: 0, type: 'lamp', x: 0, y: -7, z: 0, vx: 0, vy: 0, vz: 0, fuse: 0 }], e => e.anchor = { x: 0, y: -4, z: 0, yaw: 0, pitch: 0 }]) { const data = structuredClone(original); mutate(data.state.expedition); assert.throws(() => B.Saves.validate(data)); }
  const legacy = structuredClone(original); delete legacy.state.expedition; const migrated = B.Saves.validate(legacy); assert.deepEqual(migrated.state.expedition.recovered, []); assert.deepEqual(migrated.field, g.world.field); assert.equal(migrated.state.cash, g.economy.state.cash);
});

// Build the real scene and run the real game update/HUD against an inert renderer and DOM.
// This checks geometry, bindings and integration; it is not a WebGL or visual approval.
const harness = await nodeGame(), { game, elements } = harness;
await test('real Game boots every new system, builds finite geometry and binds every UI action', () => {
  assert.ok(game.ready); assert.ok(game.view.salvageModels.length === 2); assert.equal(game.view.runeModels.length, 3); assert.equal(game.view.vaultModels.length, 3); assert.ok(game.view.growth.length > 80);
  let meshes = 0; game.view.scene.updateMatrixWorld(true); game.view.scene.traverse(m => { if (m.geometry?.attributes.position) { assert.ok([...m.geometry.attributes.position.array].every(Number.isFinite)); meshes++; } }); assert.ok(meshes > 100);
  game.screen = null; game.running = true; game.updateShop(); game.journal(); game.screen = null; game.running = true;
  game.update(1 / 60); game.view.render(game, 1 / 60, 1); assert.equal(elements.get('tool-name').textContent, 'Cutter');
  for (const id of ['buy-bombs', 'buy-lights', 'touch-light', 'touch-tool', 'touch-anchor', 'touch-rift']) assert.equal(typeof elements.get(id).onclick, 'function');
});
await test('actual update integrates bombs, lamps, rendered tool changes and chapter announcements', () => {
  game.player.teleport(0, .1, 7); game.player.pitch = -.9; game.deploy('bomb'); game.deploy('lamp');
  simulate(3.2, dt => { game.update(dt); game.view.render(game, dt, game.clock); }); assert.equal(game.gadgets.blasts.length, 1); assert.equal(game.view.deviceModels.size, 1); assert.equal(game.gadgets.nodes[0].type, 'lamp'); assert.ok(game.view.workLights[0].intensity > 0);
  game.world.carve({ x: 0, y: -10, z: 0 }, 3); game.player.teleport(0, -10, 0); game.update(1 / 60); assert.equal(elements.get('chapter-name').textContent, 'Rustwater');
  game.selectTool('scoop'); game.view.render(game, 1 / 60, 4); assert.ok(game.view.scoopHead.visible); assert.ok(!game.view.rotor.visible);
  assert.equal(elements.get('bomb-count').textContent, 2); assert.equal(elements.get('light-count').textContent, 5);
});
await test('recall releases the tether without smuggling heavy salvage to the yard', () => {
  const body = game.expedition.bodies[0]; game.economy.state.deepest = 20; game.player.teleport(body.x, body.y + .5, body.z); game.world.carve(body, 2); game.expedition.physics.refresh([body]); assert.ok(game.expedition.attach(0, game.player.head));
  const before = { x: body.x, y: body.y, z: body.z }; game.recall(); assert.equal(game.expedition.tether, null); assert.deepEqual({ x: body.x, y: body.y, z: body.z }, before); assert.ok(!game.expedition.state.recovered.includes(0));
});
await test('actual Game lift paces a tethered load and delivers it without player overlap', () => {
  const body = game.expedition.bodies[0]; shaft(game.world, body.x, body.z, 0, -15, 1.9); game.player.teleport(body.x, body.y + body.size[1] / 2 + .1, body.z);
  game.screen = null; game.running = true; game.use(); assert.equal(game.expedition.tether, 0); game.input.keys.add('Space');
  for (let i = 0; i < 1800 && !body.collected; i++) { game.update(1 / 60); if (!body.collected) assert.ok(game.player.y >= body.y + body.size[1] / 2, 'hauling load intersected the player'); }
  assert.ok(body.collected); assert.ok(game.expedition.state.recovered.includes(0)); assert.equal(game.screen, 'discovery');
});
await test('device, salvage and progression snapshots survive actual Game install', async () => {
  const data = B.Saves.validate(B.Saves.snapshot(game)); await game.install(data); assert.ok(game.ready); game.updateHUD(); game.view.render(game, 1 / 60, 5);
  assert.equal(game.gadgets.nodes.length, 1); assert.equal(game.expedition.state.tool, 'scoop'); assert.equal(game.view.deviceModels.size, 1);
});
await test('43 m increases real scanner range; 59 m reveals sealed geodes', () => {
  const original = game.view.scan; let captured;
  game.view.scan = nodes => { captured = nodes; }; game.setScreen(null); game.player.teleport(9, -19 - game.player.eye, -7);
  game.economy.state.deepest = 42; game.scanCooldown = 0; game.scan(); const count = captured.length;
  game.economy.state.deepest = 43; game.scanCooldown = 0; game.scan(); assert.ok(captured.length > count);
  assert.ok(captured.every(n => n.kind !== undefined || B.MYSTERIES.some(m => m.name === n.name) || n.scanKey === 'rescue' || n.scanKey?.startsWith('thunder:') || game.refuges.nodes.some(r => n.scanKey === 'refuge:' + r.id))); assert.ok(!captured.some(n => B.VAULTS.some(v => v.name === n.name))); game.economy.state.deepest = 59; game.scanCooldown = 0; game.scan(); assert.ok(captured.some(n => n.name === B.VAULTS[0].name));
  game.view.scan = original;
});
await test('real Game resolves the seal, heart and final geode into the new ending', () => {
  // The extraction path is tested above. Stage the engine at the surface to start this chapter.
  const engine = game.expedition.bodies[1]; engine.y = 1.4; engine.vx = engine.vy = engine.vz = 0; game.expedition.physics.index.move(engine); game.setScreen(null); game.update(1 / 60);
  assert.ok(game.expedition.state.recovered.includes(1)); game.setScreen(null); game.selectTool('resonance');
  for (const [i, rune] of B.RUNES.entries()) {
    game.world.carve(rune, 1.2); game.player.teleport(B.SEAL.x, -53, B.SEAL.z); game.input.fire = false; simulate(1.5, dt => game.update(dt)); aim(game.player, rune); game.expedition.cooldown = 0; game.input.fire = true;
    for (let frame = 0; frame < 180 && !game.expedition.state.runes.includes(i); frame++) game.update(1 / 60);
    assert.ok(game.expedition.state.runes.includes(i)); game.input.fire = false;
  }
  game.player.teleport(B.HEART.x, B.HEART.y - game.player.eye, B.HEART.z + 1.5); game.use(); assert.ok(game.expedition.state.awakened); assert.equal(game.screen, 'discovery');
  game.setScreen(null); game.view.render(game, 1 / 60, 6); assert.ok(game.view.magicTool.visible); assert.ok(!game.view.tool.visible);
  for (const v of B.VAULTS) { game.world.carve(v, 3.2); game.player.teleport(v.x, v.y - game.player.eye, v.z + 2); aim(game.player, v); game.expedition.cooldown = 0; game.expedition.pulse(game.player, true); game.update(1 / 60); if (game.expedition.state.vaults.length < 3) game.setScreen(null); }
  assert.equal(game.expedition.state.vaults.length, 3); assert.equal(game.screen, 'ending'); B.Saves.validate(B.Saves.snapshot(game));
});
await test('concrete apron has no top triangles coplanar with the ground', () => {
  let found = 0; game.view.scene.traverse(m => { if (m.material !== game.view.palette.concrete) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) if (m.geometry.attributes.normal.array[i + 1] > .5 && Math.abs(a[i + 1] - a[i + 4]) < 1e-6 && Math.abs(a[i + 4] - a[i + 7]) < 1e-6) { assert.ok(Math.abs(a[i + 1]) > .01); found++; } }); assert.ok(found >= 2);
});
clearTimeout(game.toastTimer);
console.log(`COMPLETE ${depthChecks} depth checks passed (no browser or input automation)`);
