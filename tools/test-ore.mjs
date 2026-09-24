// Cursor-free tests: actual density, ore simulation, saves and Three.js instance buffers.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '..');
if (!globalThis.B2?.OreSystem) for (const name of ['core', 'town', 'caverns', 'deep-terrain', 'parcels', 'mesher', 'world', 'player', 'ore', 'expedition', 'refuges', 'deep', 'combat', 'foreman', 'rescue', 'crawlers', 'kinetics', 'fossil', 'actions', 'gadgets', 'thunderstone', 'freight', 'mysteries', 'survey', 'persistence', 'feedback', 'audio', 'fieldkit', 'town-ui']) vm.runInThisContext(fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8'));
const B = globalThis.B2;
export let oreChecks = 0;
function test(name, fn) { fn(); console.log('PASS ore: ' + name); oreChecks++; }
const ore = (x = 0, y = -2, z = 0, id = 0, kind = 0) => ({ id, x, y, z, kind, radius: .28, collected: false });
const simulate = (system, seconds, hz = 60) => { for (let i = 0; i < Math.round(seconds * hz); i++) system.update(1 / hz); };
function field(density) { const world = Object.create(B.World.prototype); world.density = density; return world; }
const world = new B.World(260923), node = ore(), system = new B.OreSystem(world, [node]);
test('embedded ore stays attached; carving its support releases it immediately', () => {
  simulate(system, .5); assert.equal(node.y, -2); assert.equal(node.motion, 'embedded');
  world.carve({ x: 0, y: -2, z: .8 }, .7); assert.equal(node.motion, 'embedded');
  world.carve({ x: 0, y: -2, z: 0 }, 1.5); assert.equal(node.motion, 'falling');
  simulate(system, .1); assert.ok(node.y < -2.05); assert.equal(system.loose.size, 1);
});
test('released ore falls down a shaft, contacts actual terrain and sleeps', () => {
  for (let y = 0; y >= -14; y -= .7) world.carve({ x: 0, y, z: 0 }, 1.7);
  simulate(system, 4); assert.ok(node.y < -13 && node.y > -16);
  assert.equal(node.motion, 'resting'); assert.equal(system.awake.size, 0);
  const gap = system.contact(node).density; assert.ok(gap >= -.0041 && gap < .01, 'mineral should touch the visible floor');
  const y = node.y; simulate(system, 2); assert.equal(node.y, y);
});
test('sleeping ore falls again when its landing surface is excavated', () => {
  const y = node.y; world.carve({ x: node.x, y: y - 1, z: node.z }, 2);
  assert.equal(node.motion, 'falling'); simulate(system, .5); assert.ok(node.y < y - .5);
});
test('pickup and scanner spatial queries track new positions across cell boundaries', () => {
  assert.ok(system.index.query(node.x, node.y, node.z, .1).includes(node));
  assert.ok(!system.index.query(0, -2, 0, 1).includes(node));
  const references = [...system.index.cells.values()].flat().filter(n => n === node); assert.equal(references.length, 1);
});
test('fast falling minerals cannot tunnel through a thin rock shelf', () => {
  const w = field((x, y, z) => Math.max(y, -y - .12)), n = ore(0, 2, 0), s = new B.OreSystem(w, [n]); n.vy = -18;
  simulate(s, 1, 10); assert.equal(n.motion, 'resting'); assert.ok(n.y > 0); assert.ok(s.contact(n).density >= -.0041);
});
test('lateral motion collides with shaft walls', () => {
  const w = field((x, y, z) => Math.min(y + 10, 1 - x)), n = ore(0, -2, 0), s = new B.OreSystem(w, [n]); n.vx = 18;
  simulate(s, 1, 30); assert.ok(Math.max(...n.offsets.map(p => n.x + p[0])) <= 1.005); assert.ok(s.contact(n).density >= -.0041);
});
test('physics agrees at 30, 60 and 120 rendered frames per second', () => {
  const result = [];
  for (const hz of [30, 60, 120]) { const n = ore(0, 4, 0), s = new B.OreSystem(field((x, y, z) => y), [n]); simulate(s, .4, hz); result.push({ y: n.y, vy: n.vy }); }
  assert.deepEqual(result[0], result[1]); assert.deepEqual(result[1], result[2]);
});
test('full cargo leaves loose ore in the world; collecting it later pays once', () => {
  const n = ore(0, 1, 0), s = new B.OreSystem(field((x, y, z) => y), [n]), economy = new B.Economy(), head = { x: 0, y: 1.5, z: 0 };
  for (let i = 0; i < 12; i++) economy.collect(0);
  assert.equal(s.collect(n, economy, head), false); assert.equal(n.collected, false);
  simulate(s, 1); assert.equal(n.motion, 'resting'); assert.ok(s.index.query(n.x, n.y, n.z, .1).includes(n));
  economy.sell(); assert.equal(s.collect(n, economy, head), true); assert.equal(economy.count, 1);
  assert.equal(s.collect(n, economy, head), false); assert.equal(economy.count, 1); assert.equal(s.loose.size, 0); assert.equal(s.awake.size, 0); assert.equal(s.index.query(n.x, n.y, n.z, .1).length, 0);
});
test('falling ore cannot be collected through intervening rock', () => {
  const w = field((x, y, z) => Math.min(y, Math.max(-x, x - .2))), n = ore(-1, 1, 0), s = new B.OreSystem(w, [n]), economy = new B.Economy();
  assert.equal(s.collect(n, economy, { x: 1, y: 1, z: 0 }), false); assert.equal(n.collected, false); assert.equal(economy.count, 0);
});
const saveWorld = new B.World(260923), deposits = B.generateDeposits(260923), physics = new B.OreSystem(saveWorld, deposits.nodes), first = deposits.nodes[0];
saveWorld.carve({ x: first.x, y: first.y, z: first.z }, 1.5); simulate(physics, .15);
const game = { world: saveWorld, deposits, orePhysics: physics, economy: new B.Economy(), player: new B.Player(saveWorld), settings: { sound: true, sensitivity: 1, quality: 1.5, motion: true } };
test('save round-trip restores falling positions, velocities and continued motion', () => {
  const snapshot = B.Saves.snapshot(game, true), data = B.Saves.validate(JSON.parse(JSON.stringify(snapshot)));
  const w = new B.World(data.state.seed); w.field = data.field;
  const nodes = B.generateDeposits(data.state.seed).nodes, restored = new B.OreSystem(w, nodes, data.loose);
  assert.equal(nodes[0].y, first.y); assert.equal(nodes[0].vy, first.vy); assert.deepEqual(restored.snapshot(), physics.snapshot());
  simulate(physics, .4); simulate(restored, .4); assert.deepEqual(restored.snapshot(), physics.snapshot());
});
test('saves from before this fix release already-floating ore on load', () => {
  const snapshot = B.Saves.snapshot(game); delete snapshot.loose; const data = B.Saves.validate(snapshot);
  assert.deepEqual(data.loose, []); const w = new B.World(data.state.seed); w.field = data.field;
  const nodes = B.generateDeposits(data.state.seed).nodes, restored = new B.OreSystem(w, nodes, data.loose);
  assert.equal(nodes[0].motion, 'falling'); const before = nodes[0].y; simulate(restored, .1); assert.ok(nodes[0].y < before);
});
test('malformed loose-body data cannot inject duplicates, invalid motion or buried bodies', () => {
  const original = B.Saves.snapshot(game);
  assert.ok(original.loose.length);
  for (const mutate of [s => s.loose.push({ ...s.loose[0] }), s => s.loose[0].id = -1, s => s.loose[0].vy = Infinity, s => s.loose[0].vx = 100, s => s.loose[0].y = -500, s => s.loose = null, s => { s.loose[0].x = 12; s.loose[0].y = -5; s.loose[0].z = 12; }, s => { const id = s.loose[0].id; s.collected.push(id); s.state.mined++; s.state.cargo[deposits.nodes[id].kind]++; }]) { const invalid = structuredClone(original); mutate(invalid); assert.throws(() => B.Saves.validate(invalid)); }
  B.Saves.validate(original);
});
const require = createRequire(import.meta.url); globalThis.THREE = require(path.join(root, 'vendor/three.min.js'));
vm.runInThisContext(fs.readFileSync(path.join(root, 'src/render.js'), 'utf8'));
const view = Object.create(B.View.prototype); view.resources = new THREE.Group(); const renderNodes = [ore(0, 1, 0), ore(1, 2, 0, 1, 4), ore(2, 3, 0, 2, 2)]; view.setDeposits({ nodes: renderNodes });
test('collision support points match rendered ore geometry, including elongated prisms', () => {
  const vertices = view.oreMesh.geometry.attributes.position, matrix = new THREE.Matrix4(), v = new THREE.Vector3();
  for (const n of renderNodes) {
    view.oreMesh.getMatrixAt(n.id, matrix); const offsets = B.oreOffsets(n);
    for (let i = 0; i < vertices.count; i++) { v.fromBufferAttribute(vertices, i).applyMatrix4(matrix); assert.ok(offsets.some(p => Math.hypot(v.x - n.x - p[0], v.y - n.y - p[1], v.z - n.z - p[2]) < 1e-6), 'collision vertex differs from instance geometry'); }
  }
});
test('ore and scanner instance buffers follow falling ore and hide collected ore', () => {
  const n = renderNodes[0], matrix = new THREE.Matrix4(); view.scan(renderNodes, null); n.y = -7; view.updateOre(n);
  view.oreMesh.getMatrixAt(n.id, matrix); assert.equal(matrix.elements[13], -7);
  view.ghosts.getMatrixAt(view.ghostSlots.get(n.id), matrix); assert.equal(matrix.elements[13], -7);
  n.collected = true; view.updateOre(n); view.oreMesh.getMatrixAt(n.id, matrix); assert.equal(matrix.determinant(), 0);
  view.ghosts.getMatrixAt(view.ghostSlots.get(n.id), matrix); assert.equal(matrix.determinant(), 0);
  view.scan(renderNodes, null); assert.equal(view.ghosts.count, 2); assert.ok(!view.ghostSlots.has(n.id));
});
test('actual game update still mines a first haul with ore gravity enabled', () => {
  // Load Game without its browser auto-start. No DOM events, browser, cursor or window.
  const elements = new Map(); globalThis.document = { getElementById(id) { if (!elements.has(id)) elements.set(id, {}); return elements.get(id); } };
  const source = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
  vm.runInThisContext(source.slice(0, source.indexOf('  const game = new Game();')) + '\n})(B2);');
  const g = Object.create(B.Game.prototype), w = new B.World(260923); w.carve({ x: 0, y: -.12, z: 7 }, 1.35);
  const d = B.generateDeposits(260923), oreSystem = new B.OreSystem(w, d.nodes);
  Object.assign(g, { world: w, deposits: d, orePhysics: oreSystem, index: oreSystem.index, economy: new B.Economy(), player: new B.Player(w), cutter: new B.Cutter(w), input: { keys: new Set(), fire: true }, clock: 0, accumulator: 0, recallTime: 0, lastSave: 0, revision: 0, audit: { pickups: 0 }, audio: { note() {}, drill() {} }, updateHUD() {} });
  g.player.teleport(0, .04, 8.2); g.player.pitch = -.9;
  for (let i = 0; i < 600 && g.economy.count < g.economy.capacity; i++) {
    g.player.yaw = Math.sin(i * .017) * .65;
    // Walk into the opening to follow the seam and its falling minerals.
    if (i >= 120 && i < 155) g.input.keys.add('KeyW'); else g.input.keys.delete('KeyW');
    g.update(1 / 60);
  }
  assert.ok(g.economy.count >= 8, `first haul collected only ${g.economy.count}`);
  const receipt = g.economy.sell(); assert.equal(receipt.bonus, 48); assert.ok(g.economy.buy('drill'));
  console.log(`  actual update: ${receipt.count} minerals sold; first cutter upgrade purchased`);
});
console.log(`COMPLETE ${oreChecks} ore checks passed (no browser or input automation)`);
