// Pure-system regression suite. Node 24, no install, no browser or GPU.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
for (const name of ['core', 'town', 'caverns', 'deep-terrain', 'parcels', 'mesher', 'world', 'player', 'ore', 'expedition', 'refuges', 'deep', 'combat', 'foreman', 'rescue', 'crawlers', 'kinetics', 'fossil', 'actions', 'gadgets', 'thunderstone', 'freight', 'mysteries', 'survey', 'persistence', 'feedback', 'audio', 'fieldkit', 'town-ui']) vm.runInThisContext(fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8'), { filename: name + '.js' });
const B = globalThis.B2;
let passed = 0;
async function test(name, fn) { await fn(); console.log('PASS ' + name); passed++; }
await test('deterministic veins, stable IDs and valuable deeper strata', () => {
  const a = B.generateDeposits(10), b = B.generateDeposits(10), c = B.generateDeposits(11);
  assert.deepEqual(a, b); assert.notDeepEqual(a, c); assert.ok(a.nodes.length > 1000);
  for (const o of a.nodes) { assert.ok(o.y <= -.5 && o.y >= -72); assert.ok(Math.abs(o.x) <= 12 && Math.abs(o.z) <= 12); }
  assert.ok(B.geology(-65).resistance > B.geology(-10).resistance);
});
await test('capacity is atomic; first haul buys meaningful equipment', () => {
  const e = new B.Economy(); for (let i = 0; i < 12; i++) assert.ok(e.collect(0));
  assert.equal(e.collect(0), false); assert.equal(e.count, 12); assert.equal(e.value, 96);
  const receipt = e.sell(); assert.equal(receipt.bonus, 48); assert.equal(e.state.cash, 144); assert.equal(e.state.contracts, 1);
  assert.equal(e.sell().bonus, 0); assert.equal(e.state.cash, 144); assert.ok(e.buy('drill')); assert.equal(e.state.cash, 80); assert.equal(e.state.gear.drill, 1);
  assert.equal(e.buy('drill'), false); assert.equal(e.buy('nonsense'), false); assert.ok(e.buy('cargo')); assert.equal(e.capacity, 24);
});
await test('discovery rewards and ending delivery cannot pay twice', () => {
  const e = new B.Economy(); e.state.relics = [0, 1, 2]; e.state.core = true;
  const a = e.sell(); assert.equal(a.bonus, 4250); assert.ok(a.won); assert.ok(e.state.won);
  assert.equal(e.sell().bonus, 0); assert.equal(e.state.cash, 4250);
});
const world = new B.World(260923);
await test('cold construction yields a surface and buried chambers', async () => { await world.build(); assert.ok(world.chunks.size >= 30); assert.ok(world.density(0, -5, 0) < 0); assert.ok(world.density(-4, -12, 1) > 0); });
function auditSeams(w) {
  const cells = new Map(); let shared = 0;
  for (const rec of w.chunks.values()) {
    const s = rec.mesh, C = w.kernel.C;
    for (let id = 0; id < s.active.length; id++) if (s.active[id]) {
      const key = [rec.cx * 16 + id % C - 1, rec.cy * 16 + Math.floor(id / C) % C - 1, rec.cz * 16 + Math.floor(id / (C * C)) - 1].join(',');
      const data = [...s.positions.slice(id * 3, id * 3 + 3), ...s.normals.slice(id * 3, id * 3 + 3)];
      if (cells.has(key)) { assert.deepEqual(data, cells.get(key), 'shared cell ' + key); shared++; } else cells.set(key, data);
    }
    for (let i = 0; i < s.count * 6; i++) assert.equal(s.active[s.indices[i]], 1, 'active topology');
    for (let f = 0; f < s.count; f++) assert.equal(s.edgeSlots[s.owners[f]], f, 'dense face pool ownership');
  }
  assert.ok(shared > 0); return shared;
}
await test('seams are exactly equal before and after crossing chunk corners', () => {
  auditSeams(world);
  for (let y = 0; y > -24; y -= .4) world.carve({ x: 0, y, z: 0 }, 1.6);
  for (let x = -2; x < 3; x += .3) world.carve({ x, y: -8, z: 0 }, 1.3, .5);
  console.log('  shared cells checked:', auditSeams(world));
});
await test('incremental topology matches a cold remesh of current density', () => {
  for (const rec of world.chunks.values()) {
    const live = rec.mesh, fresh = world.kernel.build(live.origin, world.samplesFor(rec.cx, rec.cy, rec.cz));
    assert.deepEqual(live.active, fresh.active); assert.equal(live.count, fresh.count);
    for (let i = 0; i < live.active.length; i++) if (live.active[i]) { assert.deepEqual(live.positions.slice(i * 3, i * 3 + 3), fresh.positions.slice(i * 3, i * 3 + 3)); assert.deepEqual(live.normals.slice(i * 3, i * 3 + 3), fresh.normals.slice(i * 3, i * 3 + 3)); }
    for (let i = 0; i < live.edgeSlots.length; i++) { const a = live.edgeSlots[i], b = fresh.edgeSlots[i]; assert.equal(a >= 0, b >= 0); if (a >= 0) assert.deepEqual(live.indices.slice(a * 6, a * 6 + 6), fresh.indices.slice(b * 6, b * 6 + 6)); }
  }
});
await test('surface winding points out of rock', () => {
  let checked = 0;
  for (const r of world.chunks.values()) { const s = r.mesh; for (let i = 0; i < s.count * 6; i += 3) {
    const a = s.indices[i] * 3, b = s.indices[i + 1] * 3, c = s.indices[i + 2] * 3, p = s.positions;
    const u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]], v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const dot = n.reduce((sum, value, j) => sum + value * (s.normals[a + j] + s.normals[b + j] + s.normals[c + j]), 0); assert.ok(dot > -.001, 'triangle normal reversed'); checked++;
  } } assert.ok(checked > 1000);
});
await test('protected rim and bottom cannot be excavated', () => { const a = world.density(14.5, -10, 0), b = world.density(0, -74, 0); world.carve({ x: 14.5, y: -10, z: 0 }, 3); world.carve({ x: 0, y: -74, z: 0 }, 3); assert.equal(world.density(14.5, -10, 0), a); assert.equal(world.density(0, -74, 0), b); });
await test('fixed-step collision: ground, freefall shaft, lift, ceiling', () => {
  const p = new B.Player(world); p.teleport(6, .1, 6);
  for (let i = 0; i < 240; i++) p.step(1 / 120, new Set(), 6); assert.ok(p.y >= -.1 && p.y < .2);
  p.teleport(0, .1, 0); for (let i = 0; i < 600; i++) p.step(1 / 120, new Set(), 6); assert.ok(p.y < -20 && p.y > -27);
  for (let i = 0; i < 600; i++) p.step(1 / 120, new Set(['Space']), 6); assert.ok(p.y > 0);
  p.teleport(-4, -13, 1); for (let i = 0; i < 600; i++) p.step(1 / 120, new Set(['Space']), 18); assert.ok(p.y < -9, 'lift should not pass through cave roof');
});
await test('held cut edits every contact frame and survives looking through air', () => {
  const p = new B.Player(world), cutter = new B.Cutter(world); p.teleport(6, .08, 6); p.pitch = -1.2;
  let edits = 0; for (let i = 0; i < 45; i++) { cutter.update(1 / 60, p, 0, true); if (cutter.edited) edits++; }
  assert.ok(edits >= 35, `only ${edits} edited frames`); p.pitch = 1; cutter.update(1 / 60, p, 0, true); assert.equal(cutter.contact, null);
  p.pitch = -1.2; p.yaw = .6; cutter.update(1 / 60, p, 0, true); assert.ok(cutter.edited);
});
const game = { world, economy: new B.Economy(), deposits: B.generateDeposits(260923), player: new B.Player(world), settings: { sound: true, sensitivity: 1, quality: 1.5, motion: true } };
await test('portable save round-trip preserves exact density and economy', () => {
  for (let i = 0; i < 8; i++) { game.economy.collect(game.deposits.nodes[i].kind); game.deposits.nodes[i].collected = true; } game.economy.sell(); game.economy.buy('drill');
  const data = B.Saves.snapshot(game, true), valid = B.Saves.validate(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(valid.field, world.field); assert.deepEqual(valid.state, game.economy.state); assert.equal(valid.collected.length, 8);
});
await test('foreign, corrupt, overflowing and inconsistent saves are rejected before mutation', () => {
  const snapshot = B.Saves.snapshot(game); const before = structuredClone(game.economy.state);
  for (const mutate of [s => s.format = 'terrainlab', s => s.state.cash = NaN, s => s.state.gear.drill = 99, s => s.collected.push(0), s => s.state.cargo[0] = 100, s => s.field[0] = Infinity, s => s.player.x = 500, s => s.state.core = true, s => s.state.sold[0] = 999]) { const data = structuredClone(snapshot); mutate(data); assert.throws(() => B.Saves.validate(data)); }
  assert.deepEqual(game.economy.state, before);
});
passed += (await import('./test-ore.mjs')).oreChecks;
passed += (await import('./test-depths.mjs')).depthChecks;
passed += (await import('./test-fieldwork.mjs')).fieldChecks;
passed += (await import('./test-explosives.mjs')).explosiveChecks;
passed += (await import('./test-mysteries.mjs')).mysteryChecks;
passed += (await import('./test-freight.mjs')).freightChecks;
passed += (await import('./test-feedback.mjs')).feedbackChecks;
passed += (await import('./test-thunderstone.mjs')).thunderChecks;
passed += (await import('./test-fieldkit.mjs')).kitChecks;
passed += (await import('./test-town.mjs')).townChecks;
passed += (await import('./test-caverns.mjs')).cavernChecks;
passed += (await import('./test-combat.mjs')).combatChecks;
passed += (await import('./test-deep.mjs')).deepChecks;
passed += (await import('./test-foreman.mjs')).foremanChecks;
passed += (await import('./test-rescue.mjs')).rescueChecks;
passed += (await import('./test-crawlers.mjs')).crawlerChecks;
passed += (await import('./test-kinetics.mjs')).kineticChecks;
passed += (await import('./test-parcels.mjs')).parcelChecks;
passed += (await import('./test-fossil.mjs')).fossilChecks;
passed += (await import('./test-beauty.mjs')).beautyChecks;
console.log(`COMPLETE ${passed} system checks passed`);
