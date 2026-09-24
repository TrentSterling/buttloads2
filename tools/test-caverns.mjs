// Natural cave generation, useful structures and old-claim retention. No browser.
import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), g = h.game, B = globalThis.B2;
export let cavernChecks = 0;
const test = async (name, fn) => { await fn(); cavernChecks++; console.log('PASS caverns: ' + name); };
const aim = p => { const a = g.player.head, dx = p.x - a.x, dy = p.y - a.y, dz = p.z - a.z; g.player.yaw = Math.atan2(-dx, -dz); g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); };
const frames = (seconds, fn, hz = 60) => { for (let i = 0; i < seconds * hz; i++) fn(1 / hz); };
function reachable(world, network) {
  const player = new B.Player(world), step = .5, start = [Math.round(network.chamber.x / step), Math.round((network.chamber.y - .65) / step), Math.round(network.chamber.z / step)], key = p => p.join(',');
  assert.ok(!player.blocked(...start.map(n => n * step)), 'chamber accepts a full player');
  const queue = [start], visited = new Set([key(start)]), tested = new Set(visited);
  for (let at = 0; at < queue.length; at++) for (let axis = 0; axis < 3; axis++) for (const direction of [-1, 1]) {
    const p = queue[at].slice(); p[axis] += direction; const k = key(p);
    if (tested.has(k) || Math.abs(p[0] * step - network.x) > 9 || Math.abs(p[1] * step - network.y) > 9 || Math.abs(p[2] * step - network.z) > 9) continue;
    tested.add(k); if (player.blocked(...p.map(n => n * step))) continue;
    visited.add(k); queue.push(p);
  }
  return p => queue.some(q => Math.hypot(q[0] * step - p.x, q[1] * step + .65 - p.y, q[2] * step - p.z) < .9);
}
try {
  await test('fresh Game creates three seeded cave networks and physical survey cabinets', () => {
    assert.equal(g.world.generation, B.CAVE_VERSION); assert.equal(g.world.caverns.networks.length, 3); assert.equal(g.refuges.nodes.length, 3);
    assert.ok(g.world.chunks.size > 40); assert.ok(g.view.caveGrowth.length > 30);
    assert.deepEqual(g.refuges.state.known, []); assert.equal(g.refuges.state.lit.length, 0);
    for (const model of g.view.refugeModels) {
      const bounds = new THREE.Box3().setFromObject(model.root), box = g.refuges.obstacles()[model.node.id];
      for (const [axis, i] of ['x', 'y', 'z'].map((axis, i) => [axis, i])) { assert.ok(bounds.min[axis] >= box[i] - 1e-6); assert.ok(bounds.max[axis] <= box[i + 3] + 1e-6); }
    }
  });
  await test('generation is repeatable, differs by seed and preserves the yard, rim and objective shells', () => {
    const same = new B.World(g.world.seed, 1), different = new B.World(g.world.seed + 1, 1), legacy = new B.World(g.world.seed, 0);
    assert.deepEqual(same.field, new B.World(g.world.seed, 1).field); assert.notDeepEqual(same.field, different.field);
    let added = 0;
    for (let i = 0; i < same.field.length; i++) {
      const x = i % 65 * .5 - 16, y = Math.floor(i / 65) % 165 * .5 - 80, z = Math.floor(i / (65 * 165)) * .5 - 16;
      assert.ok(same.field[i] >= legacy.field[i]);
      if (same.field[i] >= 0 && legacy.field[i] < 0) added++;
      if (y > -6 || y < -62 || Math.abs(x) >= 14 || Math.abs(z) >= 14 || B.RELICS.some(r => Math.hypot(x - r.x, y - r.y, z - r.z) < 4.2)) assert.equal(same.field[i], legacy.field[i]);
    }
    assert.ok(added > 5000 && added < 48000, 'caves add real volume while retaining abundant diggable rock');
    assert.throws(() => new B.World(0, 99), /generation/);
  });
  await test('each network has player-sized routes to its loop nodes and branch across three seeds', () => {
    for (const seed of [260923, 7, 814]) {
      const world = new B.World(seed, 1);
      for (const network of world.caverns.networks) {
        const canReach = reachable(world, network);
        for (const p of [...network.nodes, network.branch]) assert.ok(canReach(p), `seed ${seed} network ${network.id} has a stranded passage at ${JSON.stringify(p)}`);
        assert.equal(network.segments.length, 19);
      }
    }
  });
  await test('new caves and cabinets remain off the survey until explored, scanned or charted', () => {
    for (const n of g.world.caverns.networks) assert.ok(!g.survey.cells.has(Math.floor(n.chamber.x + 16) + 32 * Math.floor(n.chamber.z + 16) + 1024 * Math.floor(-n.chamber.y)));
    const before = g.world.field.slice(); g.player.teleport(7, -9, 3); g.running = true; g.scan();
    assert.ok(g.refuges.state.known.includes(0)); assert.ok(g.survey.markers(g).some(m => m.type === 'refuge'));
    assert.ok(g.view.ghostSlots.has('refuge:0')); assert.deepEqual(g.world.field, before);
  });
  await test('minerals in generated air detach, settle on real support and keep their IDs', () => {
    const world = new B.World(260923, 1), deposits = B.generateDeposits(260923), physics = new B.OreSystem(world, deposits.nodes);
    const free = deposits.nodes.filter(n => n.motion !== 'embedded'); assert.ok(free.length > 40);
    const before = free.map(n => ({ id: n.id, y: n.y })); frames(2, dt => physics.update(dt));
    assert.ok(before.some(p => deposits.nodes[p.id].y < p.y - .5));
    for (const n of free) { assert.equal(n.collected, false); assert.ok(physics.contact(n).density > -.011); }
    assert.deepEqual(deposits.nodes.map(n => n.kind), B.generateDeposits(260923).nodes.map(n => n.kind));
  });
  await test('exposed E repair spends one light, lights the refuge and charts its local workings once', () => {
    const n = g.refuges.nodes[0]; g.world.carve({ x: n.x, y: n.y, z: n.z }, 1.3);
    frames(1, dt => g.refuges.update(dt, g.player));
    g.player.teleport(n.x, n.y - .3, n.z - 2); aim({ x: n.x, y: n.y + .25, z: n.z });
    const action = g.refuges.interaction(g.player); assert.equal(action?.kind, 'refuge'); assert.equal(action.id, 0);
    const before = g.gadgets.state.supplies.lights, count = g.survey.cells.size; g.setScreen(null); g.use();
    assert.equal(g.gadgets.state.supplies.lights, before - 1); assert.deepEqual(g.refuges.state.lit, [0]); assert.ok(g.survey.cells.size > count);
    g.view.renderCaverns(g); assert.ok(g.view.refugeLights.some(l => l.intensity > 0));
    g.use(); assert.equal(g.gadgets.state.supplies.lights, before - 1); assert.equal(g.screen, 'survey');
    for (const id of ['mara', 'otis']) { assert.equal(g.town.talk(id).chapter, 'hello'); assert.equal(g.town.talk(id).chapter, 'refuge'); }
    B.Town.validate(g.town.state);
  });
  await test('buried, distant, misaimed and supply-less cabinets cannot be restored', () => {
    const n = g.refuges.nodes[1]; g.player.teleport(n.x, n.y, n.z - 2); aim({ x: n.x, y: n.y + .25, z: n.z });
    assert.equal(g.refuges.restore(1, g.player, g.survey), false);
    g.world.carve(n, 1.3); frames(.5, dt => g.refuges.update(dt, g.player)); g.player.teleport(n.x, n.y - .3, n.z - 2); aim({ x: n.x, y: n.y + .25, z: n.z });
    const stock = g.gadgets.state.supplies.lights; g.gadgets.state.supplies.lights = 0; assert.equal(g.refuges.interaction(g.player)?.locked, true); assert.equal(g.refuges.restore(1, g.player, g.survey), false);
    g.gadgets.state.supplies.lights = stock; g.player.yaw += Math.PI; assert.equal(g.refuges.restore(1, g.player, g.survey), false);
    g.player.z -= 6; aim({ x: n.x, y: n.y + .25, z: n.z }); assert.equal(g.refuges.restore(1, g.player, g.survey), false); assert.ok(!g.refuges.state.lit.includes(1));
  });
  await test('unsupported cabinets fall with their light, scanner marker and collision box', () => {
    const n = g.refuges.nodes[0], y = n.y;
    for (let depth = y; depth > y - 5; depth -= .6) g.world.carve({ x: n.x, y: depth, z: n.z }, 1.5);
    g.refuges.scan(g.player.head, 100); g.view.scan([{ ...n, kind: undefined, scanKey: 'refuge:0' }]);
    frames(.5, dt => g.refuges.update(dt, g.player)); assert.ok(n.y < y - .7); assert.ok(g.refuges.physics.contact(n).density > -.011);
    g.view.renderCaverns(g); assert.equal(g.view.refugeModels[0].root.position.y, n.y); assert.equal(g.refuges.markers().find(m => m.id === 0).y, n.y); assert.ok(g.refuges.obstacles()[0][1] < n.y);
    assert.equal(g.refuges.state.lit.includes(0), true);
  });
  await test('cave growth loses visibility when its terrain support is removed', () => {
    const growth = g.view.caveGrowth.find(n => g.world.density(n.anchor.x, n.anchor.y, n.anchor.z) < -.02); assert.ok(growth);
    g.view.renderCaverns(g); assert.equal(growth.root.visible, true); g.world.carve(growth.anchor, .6); g.view.renderCaverns(g); assert.equal(growth.root.visible, false);
  });
  await test('portable mid-fall saves preserve generation, charts, lit state and physical cabinets', async () => {
    const save = B.Saves.snapshot(g, true), data = B.Saves.validate(save), field = g.world.field.slice(), old = structuredClone(g.refuges.state), before = g.refuges.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, z: n.z }));
    await g.install(data); assert.equal(g.world.generation, 1); assert.deepEqual(g.world.field, field); assert.deepEqual(g.refuges.state, old);
    for (const n of before) assert.deepEqual({ id: g.refuges.nodes[n.id].id, x: g.refuges.nodes[n.id].x, y: g.refuges.nodes[n.id].y, z: g.refuges.nodes[n.id].z }, n);
    assert.deepEqual(g.survey.data, save.state.expedition.survey); assert.equal(g.view.cavernScene.parent, g.view.scene);
  });
  await test('legacy claims retain exact terrain and receive cabinets in existing authored chambers', async () => {
    const legacy = new B.World(260923, 0); legacy.carve({ x: 1, y: -3, z: 8 }, 2);
    const snapshot = B.Saves.snapshot(g); snapshot.field = legacy.field.slice(); snapshot.generation = 0; snapshot.loose = []; snapshot.collected = []; snapshot.state = B.freshState(); snapshot.player = { x: 0, y: .06, z: 12, yaw: 0, pitch: 0 };
    const withoutVersion = structuredClone(snapshot); delete withoutVersion.generation; const data = B.Saves.validate(withoutVersion);
    await g.install(data); assert.equal(g.world.generation, 0); assert.equal(g.world.caverns.networks.length, 0); assert.deepEqual(g.world.field, legacy.field);
    assert.equal(g.refuges.nodes.length, 3); assert.ok(g.refuges.nodes.every(n => n.name === 'Old survey shelter'));
    const roundTrip = B.Saves.validate(B.Saves.snapshot(g, true)); assert.equal(roundTrip.generation, 0); assert.deepEqual(roundTrip.field, legacy.field);
  });
  await test('malformed generation, duplicate repairs and invalid refuge bodies fail before mutation', () => {
    const good = B.Saves.snapshot(g), before = structuredClone(g.economy.state);
    for (const mutate of [s => s.generation = 2, s => s.generation = '1', s => s.state.expedition.refuges.lit = [0, 0], s => s.state.expedition.refuges.lit = [1], s => s.state.expedition.refuges.bodies = [{ id: 7, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }], s => s.state.expedition.refuges.bodies = [{ id: 0, x: 0, y: -70, z: 0, vx: 0, vy: 0, vz: 0 }]]) { const bad = structuredClone(good); mutate(bad); assert.throws(() => B.Saves.validate(bad)); }
    assert.deepEqual(g.economy.state, before);
  });
} finally { h.close(); }
console.log(`COMPLETE ${cavernChecks} cavern checks passed (inert renderer; no browser or OS input)`);
