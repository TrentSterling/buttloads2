import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const harness = await nodeGame(), { game: g, handlers, elements } = harness, B = B2;
export let explosiveChecks = 0;
const test = async (name, fn) => { await fn(); explosiveChecks++; console.log('PASS explosives: ' + name); };
const run = (seconds, fn, hz = 60) => { for (let i = 0; i < Math.round(seconds * hz); i++) fn(1 / hz); };
const key = code => ({ code, repeat: false, preventDefault() {} });
function setup(depth = 30) {
  const world = new B.World(260923), economy = new B.Economy(); economy.state.deepest = depth;
  const state = economy.state.expedition, gadgets = new B.Gadgets(world, state, economy.state), player = new B.Player(world);
  state.supplies.bombs = 12; return { world, economy, state, gadgets, player };
}
function cave(s, y = -30) { s.world.field.fill(-2); s.world.carve({ x: 0, y, z: 0 }, 2.5); s.player.teleport(0, y - s.player.eye, 0); s.player.pitch = 0; }

await test('charge unlocks follow depth and bore costs two charges atomically', () => {
  const s = setup(0); assert.deepEqual(s.gadgets.modes(), ['blast']); assert.equal(s.gadgets.select('sticky'), false);
  s.economy.state.deepest = 9; assert.ok(s.gadgets.select('sticky')); assert.equal(s.gadgets.select('bore'), false);
  s.economy.state.deepest = 25; assert.ok(s.gadgets.select('bore')); s.player.teleport(0, .1, 6); s.player.pitch = -.8;
  s.state.supplies.bombs = 1; assert.equal(s.gadgets.deploy('bomb', s.player), false); assert.equal(s.state.supplies.bombs, 1);
  s.state.supplies.bombs = 2; assert.ok(s.gadgets.deploy('bomb', s.player)); assert.equal(s.state.supplies.bombs, 0); assert.equal(s.gadgets.nodes.length, 1);
});
await test('remote satchels stick to a ceiling and remain armed until commanded', () => {
  const s = setup(); cave(s, -12); s.player.pitch = 1.4; s.gadgets.select('sticky');
  const before = s.world.revision, preview = s.gadgets.preview(s.player); assert.ok(preview.end); assert.equal(s.gadgets.nodes.length, 0);
  assert.ok(s.gadgets.deploy('bomb', s.player)); run(3, dt => s.gadgets.update(dt)); const n = s.gadgets.nodes[0]; assert.ok(n.anchor); assert.ok(n.y > s.player.head.y + 1);
  assert.ok(Math.hypot(n.x - preview.end.x, n.y - preview.end.y, n.z - preview.end.z) < 1e-6);
  const position = [n.x, n.y, n.z]; run(10, dt => s.gadgets.update(dt)); assert.deepEqual([n.x, n.y, n.z], position); assert.equal(s.world.revision, before); assert.equal(s.gadgets.remoteCount, 1);
  assert.equal(s.gadgets.detonate(), 1); assert.equal(s.gadgets.detonate(), 0); run(.2, dt => s.gadgets.update(dt)); assert.equal(s.gadgets.nodes.length, 0); assert.equal(s.gadgets.blasts.length, 1); assert.ok(s.world.revision > before);
});
await test('excavating an attachment releases a satchel instead of leaving it floating', () => {
  const s = setup(); cave(s, -12); s.player.pitch = 1.4; s.gadgets.select('sticky'); s.gadgets.deploy('bomb', s.player); run(1, dt => s.gadgets.update(dt));
  const n = s.gadgets.nodes[0], oldY = n.y; assert.ok(n.anchor); s.world.carve(n.anchor, 1.6); run(.4, dt => s.gadgets.update(dt)); assert.ok(n.y < oldY - .8); assert.equal(n.anchor, undefined); assert.equal(s.gadgets.blasts.length, 0);
});
await test('one trigger fires multiple remotes once; committed charges cannot be refunded', () => {
  const s = setup(); s.gadgets.select('sticky'); s.player.teleport(0, .1, 6); s.player.pitch = -.8;
  for (let i = 0; i < 3; i++) { s.player.yaw = i; s.gadgets.deploy('bomb', s.player); }
  run(1, dt => s.gadgets.update(dt)); assert.equal(s.gadgets.detonate(), 3); assert.equal(s.gadgets.disarm(s.gadgets.nodes[0].id, s.gadgets.nodes[0]), false);
  run(1, dt => s.gadgets.update(dt)); assert.equal(s.gadgets.blasts.length, 3); assert.equal(new Set(s.gadgets.blasts.map(b => b.serial)).size, 3); assert.equal(s.gadgets.remoteCount, 0); run(2, dt => s.gadgets.update(dt)); assert.equal(s.gadgets.blasts.length, 3);
});
await test('bore charge opens a narrow walkable tunnel and leaves adjacent rock intact', () => {
  const s = setup(); cave(s); s.gadgets.select('bore'); const preview = s.gadgets.preview(s.player);
  assert.equal(preview.length, 6); assert.equal(preview.direction.z, -1); s.gadgets.deploy('bomb', s.player); run(3.2, dt => s.gadgets.update(dt));
  const blast = s.gadgets.blasts[0]; assert.ok(blast); assert.ok(Math.hypot(blast.x - preview.end.x, blast.y - preview.end.y, blast.z - preview.end.z) < 1e-6);
  for (let distance = 1; distance < 6; distance += .5) {
    const q = { x: blast.x, y: blast.y, z: blast.z - distance };
    assert.ok(s.world.density(q.x, q.y, q.z) > 0); assert.ok(s.world.density(q.x + 2, q.y, q.z) < 0, 'bore became a broad blast');
    assert.equal(s.player.blocked(q.x, q.y - .85, q.z), false, 'player cannot fit through the bored tunnel');
  }
});
await test('bore follows its stored aim and cannot cut the protected claim boundary', () => {
  const s = setup(); cave(s); s.gadgets.select('bore'); s.player.yaw = -Math.PI / 2;
  s.gadgets.deploy('bomb', s.player); s.player.yaw = Math.PI; run(3.2, dt => s.gadgets.update(dt)); const blast = s.gadgets.blasts[0];
  assert.ok(s.world.density(blast.x + 5, blast.y, blast.z) > 0); assert.ok(s.world.density(blast.x, blast.y, blast.z - 5) < 0);
  s.world.carve({ x: 11, y: -30, z: 0 }, 2); s.player.teleport(11, -31.58, 0); s.player.yaw = -Math.PI / 2; s.gadgets.deploy('bomb', s.player); run(3.2, dt => s.gadgets.update(dt)); assert.ok(s.world.density(14, -30, 0) < 0);
});
await test('bore excavation releases embedded ore along the tunnel without destroying it', () => {
  const s = setup(); cave(s); const ore = { id: 0, x: 0, y: -30, z: -6, radius: .24, kind: 2, collected: false }, physics = new B.OreSystem(s.world, [ore]);
  assert.equal(ore.motion, 'embedded'); s.gadgets.select('bore'); s.gadgets.deploy('bomb', s.player);
  run(3.2, dt => s.gadgets.update(dt, physics)); assert.notEqual(ore.motion, 'embedded'); assert.equal(ore.collected, false);
  const start = [ore.x, ore.y, ore.z]; run(.3, dt => physics.update(dt)); assert.notDeepEqual([ore.x, ore.y, ore.z], start); assert.ok(physics.contact(ore).density >= -.0041);
});
await test('charges, orientation and planted attachment survive portable save and install', async () => {
  g.setScreen(null); g.economy.state.deepest = 30; g.player.teleport(3, .1, 5); g.player.pitch = -.8; g.selectCharge('sticky'); g.deploy('bomb'); run(1, dt => g.update(dt));
  const n = g.gadgets.nodes[0]; assert.ok(n.anchor); const save = B.Saves.snapshot(g, true), validated = B.Saves.validate(save);
  assert.equal(validated.state.expedition.devices[0].mode, 'sticky'); assert.deepEqual(validated.state.expedition.devices[0].anchor, n.anchor);
  await g.install(validated); g.setScreen(null); const position = [g.gadgets.nodes[0].x, g.gadgets.nodes[0].y, g.gadgets.nodes[0].z]; run(1, dt => g.update(dt)); assert.deepEqual([g.gadgets.nodes[0].x, g.gadgets.nodes[0].y, g.gadgets.nodes[0].z], position);
  handlers.get('keydown')(key('KeyH')); assert.equal(g.gadgets.remoteCount, 0); run(1, dt => g.update(dt)); assert.equal(g.gadgets.nodes.length, 0); assert.equal(g.gadgets.blasts.length, 1); B.Saves.validate(B.Saves.snapshot(g));
});
await test('actual E disarms the aimed satchel once and the survey records armed locations', () => {
  g.setScreen(null); g.player.teleport(-4, .1, 8); g.player.pitch = -1; g.selectCharge('sticky'); const supply = g.expedition.state.supplies.bombs; g.deploy('bomb'); run(1, dt => g.gadgets.update(dt));
  const n = g.gadgets.nodes[0]; assert.ok(n); assert.ok(g.survey.markers(g).some(m => m.type === 'charge'));
  g.player.teleport(n.x, .1, n.z + 1); g.player.yaw = 0; g.player.pitch = Math.atan2(n.y - g.player.head.y, 1); assert.equal(g.interaction()?.kind, 'disarm'); g.use(); assert.equal(g.gadgets.nodes.length, 0); assert.equal(g.expedition.state.supplies.bombs, supply); assert.equal(g.gadgets.disarm(n.id, g.player.head), false);
});
await test('charge cycling and the real preview geometry show a directed bore', () => {
  g.setScreen(null); g.player.teleport(0, .1, 6); g.player.pitch = -.9; g.gadgets.state.supplies.bombs = 6; g.selectCharge('sticky'); handlers.get('keydown')(key('KeyN')); assert.equal(g.gadgets.state.chargeMode, 'bore');
  handlers.get('keydown')(key('KeyC')); g.view.render(g, 1 / 60, 4); assert.ok(g.view.boreGuide.visible); assert.equal(g.view.throwRadius.visible, false); assert.equal(elements.get('charge-name').textContent, 'Bore charge');
  const tip = new THREE.Vector3(0, 0, 6).applyQuaternion(g.view.boreGuide.quaternion).add(g.view.boreGuide.position), preview = g.aimPreview;
  assert.ok(Math.abs(tip.y - (preview.end.y + preview.direction.y * 6)) < 1e-6); g.clearInput();
});
await test('malformed direction, attachment, fuse, trigger and locked selection are rejected', () => {
  g.setScreen(null); g.player.teleport(0, .1, 6); g.player.pitch = -.9; g.selectCharge('bore'); g.deploy('bomb'); run(.2, dt => g.gadgets.update(dt));
  const original = B.Saves.snapshot(g); B.Saves.validate(original);
  for (const mutate of [e => e.chargeMode = 'unknown', e => e.chargeMode = 'constructor', e => e.devices[0].mode = 'toString', e => e.devices[0].mode = 'unknown', e => e.devices[0].direction.x = 10, e => e.devices[0].fuse = 10, e => e.devices[0].anchor = { x: 0, y: -99, z: 0 }, e => e.devices[0].triggered = true]) { const copy = structuredClone(original); mutate(copy.state.expedition); assert.throws(() => B.Saves.validate(copy)); }
  const locked = structuredClone(original); locked.state.deepest = 0; assert.throws(() => B.Saves.validate(locked));
});
await test('bore fuse and final crater agree at 30, 60 and 120 Hz', () => {
  let expected;
  for (const hz of [30, 60, 120]) { const s = setup(); cave(s); s.gadgets.select('bore'); s.gadgets.deploy('bomb', s.player); run(3.2, dt => s.gadgets.update(dt), hz); assert.equal(s.gadgets.blasts.length, 1); if (expected) assert.deepEqual(s.world.field, expected); else expected = s.world.field; }
});
await test('charges can be dropped from a lift hover above the claim', () => {
  const s = setup(); s.player.teleport(12.5, 15.9, 0); s.player.pitch = .2; s.player.yaw = -Math.PI / 2;
  assert.ok(s.gadgets.deploy('bomb', s.player)); run(2, dt => s.gadgets.update(dt)); const n = s.gadgets.nodes[0]; assert.ok(Math.abs(n.x) < 24 && n.y < 20); assert.ok(s.gadgets.physics.contact(n).density >= -.0041);
  s.player.teleport(16, 2, 0); assert.equal(s.gadgets.deploy('bomb', s.player), false);
});
await test('older timed-charge saves keep their remaining fuse without new mode fields', async () => {
  await g.install(null); g.setScreen(null); g.player.teleport(0, .1, 6); g.player.pitch = -.8; g.deploy('bomb'); run(1.5, dt => g.gadgets.update(dt));
  const legacy = B.Saves.snapshot(g, true); delete legacy.state.expedition.chargeMode; delete legacy.state.expedition.devices[0].mode;
  await g.install(B.Saves.validate(legacy)); g.setScreen(null); run(1, dt => g.gadgets.update(dt)); assert.equal(g.gadgets.blasts.length, 0);
  run(.2, dt => g.gadgets.update(dt)); assert.equal(g.gadgets.blasts.length, 1); assert.equal(g.gadgets.blasts[0].mode, 'blast');
});
harness.close();
console.log(`COMPLETE ${explosiveChecks} explosive checks passed (no browser or input automation)`);
