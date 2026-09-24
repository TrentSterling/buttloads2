import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), { game: g, handlers, elements } = h, B = B2;
export let thunderChecks = 0;
const test = async (name, fn) => { await fn(); thunderChecks++; console.log('PASS thunderstone: ' + name); };
const run = (s, seconds, hz = 120) => { for (let i = 0; i < Math.round(seconds * hz); i++) { s.gadgets.update(1 / hz, s.orePhysics, s.expedition.physics, s.player); s.thunder.update(1 / hz, s); s.orePhysics?.update(1 / hz); } };
function setup() {
  const world = new B.World(260923), economy = new B.Economy(), player = new B.Player(world), gadgets = new B.Gadgets(world, economy.state.expedition, economy.state), thunder = new B.Thunderstone(world, economy.state), deposits = B.generateDeposits(economy.state.seed), orePhysics = new B.OreSystem(world, deposits.nodes);
  return { world, economy, player, gadgets, thunder, deposits, orePhysics, expedition: { pulseSerial: 0 } };
}
function face(s, n) { s.player.teleport(n.x, n.y - s.player.eye, n.z + 1.3); s.player.yaw = 0; s.player.pitch = 0; }
function blast(s, n = s.thunder.nodes[0]) { s.gadgets.explode({ ...n, mode: 'blast' }, B.CHARGES.blast, s.orePhysics, null, s.player); }

await test('new rich pockets append ore IDs and scanning does not reveal untouched caves', () => {
  const stones = B.THUNDERSTONES; delete B.THUNDERSTONES; let previous; try { previous = B.generateDeposits(260923); } finally { B.THUNDERSTONES = stones; }
  const next = B.generateDeposits(260923); assert.deepEqual(next.nodes.slice(0, previous.nodes.length), previous.nodes); assert.equal(next.nodes.length - previous.nodes.length, 48);
  const s = setup(), n = s.thunder.nodes[0], field = s.world.field.slice(); assert.equal(s.thunder.markers().length, 0);
  assert.ok(s.thunder.scan(n, 3).length >= 2); assert.ok(s.thunder.markers().length >= 2); assert.deepEqual(s.world.field, field); assert.equal(s.thunder.state.spent.length, 0);
});
await test('digging alone releases physical crystals without ignition; removal of their new support wakes them', () => {
  const s = setup(), n = s.thunder.nodes[0]; assert.equal(n.motion, 'embedded'); s.world.carve(n, 2.1); const y = n.y; run(s, 2);
  assert.ok(n.y < y - 1); assert.ok(s.thunder.physics.contact(n).density >= -.005); assert.equal(n.fuse, -1); assert.equal(s.gadgets.blasts.length, 0);
  const resting = n.y; s.world.carve({ x: n.x, y: n.y - 1, z: n.z }, 2); run(s, 1); assert.ok(n.y < resting - .5); assert.equal(n.fuse, -1);
});
await test('one charge opens a delayed chain across a buried seam and preserves every valuable', () => {
  const s = setup(), last = { ...s.thunder.nodes[3] }, untouched = s.world.density(12, -16, -10), supplies = s.gadgets.state.supplies.bombs;
  assert.ok(s.world.density(last.x, last.y, last.z) < 0); blast(s); run(s, .3); assert.equal(s.thunder.state.spent.length, 0); assert.ok(s.thunder.state.lit.length > 0);
  run(s, 3); assert.deepEqual(s.thunder.state.spent, [0, 1, 2, 3]); assert.equal(s.gadgets.blasts.filter(b => b.mode === 'thunderstone').length, 4); assert.ok(s.world.density(last.x, last.y, last.z) > 0); assert.equal(s.world.density(12, -16, -10), untouched);
  assert.equal(s.gadgets.state.supplies.bombs, supplies); assert.equal(s.deposits.nodes.filter(n => n.collected).length, 0); assert.equal(s.economy.state.cash, 0);
  const pocket = s.deposits.nodes.filter(n => s.deposits.veins[n.vein]?.name === 'Thunderstone pocket' && n.y > -23); assert.ok(pocket.some(n => n.motion !== 'embedded'));
  run(s, 3); assert.equal(s.gadgets.blasts.length, 5);
});
await test('buried and out-of-range crystals reject pressure through remaining rock', () => {
  const s = setup(), n = s.thunder.nodes[0]; s.thunder.ignite({ x: n.x - 1, y: n.y, z: n.z, radius: 3 }); assert.equal(n.fuse, -1);
  s.world.carve(n, .8); s.world.carve({ x: n.x - 2, y: n.y, z: n.z }, .8); s.thunder.ignite({ x: n.x - 2, y: n.y, z: n.z, radius: 3 }); assert.equal(n.fuse, -1);
  s.thunder.ignite({ ...n, x: n.x + 4, radius: 3 }); assert.equal(n.fuse, -1); s.thunder.ignite({ ...n, radius: 1 }); assert.ok(n.fuse > 0);
});
await test('harvesting a link gives one charge and interrupts propagation beyond the gap', () => {
  const s = setup(), link = s.thunder.nodes[2]; s.world.carve(link, 2); face(s, link); const count = s.gadgets.state.supplies.bombs;
  assert.ok(s.thunder.harvest(2, s.player)); assert.equal(s.gadgets.state.supplies.bombs, count + 1); assert.equal(s.thunder.harvest(2, s.player), false);
  blast(s); run(s, 4); assert.ok(s.thunder.state.spent.includes(0)); assert.ok(s.thunder.state.spent.includes(1)); assert.equal(s.thunder.nodes[3].collected, false); assert.equal(s.thunder.nodes[3].fuse, -1);
});
await test('harvest requires exposure, aim, reach, capacity and a dormant crystal', () => {
  const s = setup(), n = s.thunder.nodes[0]; face(s, n); assert.equal(s.thunder.harvest(n.id, s.player), false); s.world.carve(n, 2.2);
  s.player.yaw = Math.PI; assert.equal(s.thunder.harvest(n.id, s.player), false); face(s, n); s.gadgets.state.supplies.bombs = 99; assert.equal(s.thunder.harvest(n.id, s.player), false);
  s.gadgets.state.supplies.bombs = 3; s.thunder.ignite({ ...n, radius: 1 }); assert.equal(s.thunder.harvest(n.id, s.player), false); assert.equal(s.thunder.interaction(s.player).locked, true);
});
await test('bore reaches crystals along its full excavation line; resonance also ignites exposed crystals', () => {
  const s = setup(), n = s.thunder.nodes[8], source = { x: n.x, y: n.y, z: n.z + 5, direction: { x: 0, y: 0, z: -1 }, mode: 'bore' };
  s.gadgets.explode(source, B.CHARGES.bore, s.orePhysics); run(s, .1); assert.ok(n.fuse > 0);
  const s2 = setup(), n2 = s2.thunder.nodes[0]; s2.world.carve(n2, 1); s2.expedition.pulseSerial = 1; s2.expedition.lastPulse = { ...n2, radius: 1 }; run(s2, .1); assert.ok(n2.fuse > 0); const fuse = n2.fuse; run(s2, .1); assert.ok(n2.fuse < fuse);
});
await test('chain timing, consumed links and craters agree at 30, 60 and 120 Hz', () => {
  const results = [];
  for (const hz of [30, 60, 120]) { const s = setup(); blast(s); run(s, 3, hz); results.push({ spent: s.thunder.state.spent, field: s.world.field, blasts: s.gadgets.blasts }); }
  for (const r of results.slice(1)) { assert.deepEqual(r.spent, results[0].spent); assert.deepEqual(r.field, results[0].field); assert.deepEqual(r.blasts, results[0].blasts); }
});
await test('actual throw, scan, E harvest, warnings and finite scene models are integrated', () => {
  const n = g.thunder.nodes[0]; g.world.carve(n, 2.2); face(g, n); g.running = true; g.scan(); assert.ok(g.thunder.state.known.includes(n.id)); assert.ok(g.survey.markers(g).some(m => m.type === 'thunderstone')); g.journal(); assert.ok(elements.get('discovery-list').innerHTML.includes('Thunderstone seams')); g.setScreen(null);
  const supply = g.gadgets.state.supplies.bombs; assert.equal(g.interaction()?.kind, 'thunderstone'); handlers.get('keydown')({ code: 'KeyE', repeat: false, preventDefault() {} }); assert.equal(g.gadgets.state.supplies.bombs, supply + 1); assert.ok(n.collected);
  g.view.render(g, 1 / 60, 1); assert.equal(g.view.thunderModels[0].visible, false); assert.ok(g.view.ghostSlots.has('thunder:0')); const m = new THREE.Matrix4(); g.view.ghosts.getMatrixAt(g.view.ghostSlots.get('thunder:0'), m); assert.equal(m.elements[0], 0);
  const target = g.thunder.nodes[4]; g.world.carve(target, 2.5); face(g, target); g.player.pitch = -.5; assert.ok(g.gadgets.deploy('bomb', g.player));
  for (let i = 0; i < 170; i++) { g.gadgets.update(1 / 60, g.orePhysics, g.expedition.physics, g.player); g.thunder.update(1 / 60, g); }
  assert.ok(g.thunder.nodes.slice(4, 8).some(n => n.fuse >= 0)); g.updateHUD(); assert.equal(elements.get('mission-label').textContent, 'CHAIN REACTION'); g.view.render(g, 1 / 60, 3);
  assert.ok(g.view.thunderModels.every(m => { m.updateMatrix(); return m.matrix.elements.every(Number.isFinite); }));
  for (const n of g.thunder.nodes) {
    const mesh = g.view.thunderModels[n.id]; if (n.collected) continue;
    const vertices = mesh.geometry.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < vertices.count; i++) { v.fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrix); assert.ok(n.offsets.some(p => Math.hypot(v.x - n.x - p[0], v.y - n.y - p[1], v.z - n.z - p[2]) < 1e-6)); }
  }
});
await test('portable mid-chain save and install preserve fuses, bodies, consumed links and eventual blasts', async () => {
  const snapshot = B.Saves.snapshot(g, true), data = B.Saves.validate(JSON.parse(JSON.stringify(snapshot))), saved = structuredClone(data.state.expedition.thunder);
  assert.ok(saved.lit.length); assert.ok(saved.spent.includes(0)); await g.install(data); assert.deepEqual(g.thunder.state, saved);
  for (let i = 0; i < 480; i++) g.update(1 / 120); assert.ok(g.thunder.nodes.slice(4, 8).some(n => n.collected)); assert.equal(g.thunder.nodes[0].collected, true); B.Saves.validate(B.Saves.snapshot(g));
});
await test('older claims initialize dormant seams without changing terrain, mineral inventory or old IDs', async () => {
  const old = B.Saves.snapshot(g); delete old.state.expedition.thunder; const field = old.field.slice(), inventory = [...old.state.cargo], collected = [...old.collected];
  await g.install(B.Saves.validate(old)); assert.deepEqual(g.world.field, field); assert.deepEqual(g.economy.state.cargo, inventory); assert.deepEqual(g.deposits.nodes.filter(n => n.collected).map(n => n.id), collected); assert.equal(g.thunder.state.spent.length, 0); assert.ok(g.thunder.nodes.every(n => n.fuse === -1));
});
await test('malformed crystal state is rejected before modifying the live mine', () => {
  const snapshot = B.Saves.snapshot(g), before = structuredClone(g.thunder.state);
  for (const mutate of [s => s.known.push(999), s => s.spent.push(0, 0), s => s.lit.push({ id: 0, remaining: NaN }), s => { s.known = [0]; s.lit = [{ id: 0, remaining: 9 }]; }, s => s.loose.push({ id: 0, x: 0, y: -30, z: 0, vx: 0, vy: 0, vz: 0 }), s => { s.known = [0]; s.spent = [0]; s.lit = [{ id: 0, remaining: .2 }]; }]) {
    const copy = structuredClone(snapshot); mutate(copy.state.expedition.thunder); assert.throws(() => B.Saves.validate(copy));
  }
  assert.deepEqual(g.thunder.state, before);
});
await test('rift reams a narrow cleft when the center ray is clear but the player cannot descend', () => {
  const world = new B.World(260923), economy = new B.Economy(), p = new B.Player(world), exp = new B.Expedition(world, economy);
  // Open air above a floor with a continuous, body-narrow fissure beneath it.
  for (let z = 0; z < world.nz; z++) for (let y = 0; y < world.ny; y++) for (let x = 0; x < world.nx; x++) world.field[world.index(x, y, z)] = B.clamp(Math.max(-80 + y * .5 + 5, .22 - Math.abs(-16 + x * .5)), -2, 2);
  p.teleport(0, -4.95, 0); p.pitch = -1.54; for (let i = 0; i < 60; i++) p.step(1 / 120, new Set(), 6);
  assert.ok(p.grounded); assert.equal(world.ray(p.head, p.direction, 10), null); assert.ok(p.blocked(p.x, p.y - .1, p.z));
  exp.state.recovered = [0, 1]; exp.state.runes = [0, 1, 2]; exp.state.awakened = true; assert.ok(exp.pulse(p, true));
  for (let i = 0; i < 120; i++) p.step(1 / 120, new Set(), 6); assert.ok(p.y < -6, 'rift must remove the physical obstruction');
});
h.close(); console.log(`COMPLETE ${thunderChecks} thunderstone checks passed (no browser or input automation)`);
