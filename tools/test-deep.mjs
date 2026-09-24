// Depth migration and lower-mine mechanics. No browser or operating-system input.
import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), g = h.game, B = B2;
export let deepChecks = 0;
const test = async (name, fn) => { await fn(); deepChecks++; console.log('PASS deep: ' + name); };
const aim = p => { const a = g.player.head, dx = p.x - a.x, dy = p.y - a.y, dz = p.z - a.z; g.player.yaw = Math.atan2(-dx, -dz); g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); };
const frames = (time, fn) => { for (let i = 0; i < time * 60; i++) fn(1 / 60); };
try {
  await test('old terrain copies bit for bit while lower caves and ore append deterministically', async () => {
    const old = new B.World(260923, 0); old.carve({ x: 4, y: -18, z: 4 }, 3);
    const s = B.Saves.snapshot(g); s.field = old.field; delete s.depthVersion; s.generation = 0; s.state = B.freshState(); s.loose = []; s.collected = [];
    const data = B.Saves.validate(s); await g.install(data);
    assert.equal(g.world.depthVersion, 1); assert.deepEqual(g.world.fieldAtDepth(0), old.field);
    assert.equal(g.world.density(2, -86, 2), 2); assert.equal(g.world.floor, -297);
    const before = B.generateDeposits(260923), after = B.generateDeposits(260923, 1);
    assert.deepEqual(after.nodes.slice(0, before.nodes.length), before.nodes); assert.deepEqual(after.veins.slice(0, before.veins.length), before.veins);
    assert.equal(after.nodes.length - before.nodes.length, 588); assert.deepEqual(after, B.generateDeposits(260923, 1));
    assert.throws(() => new B.World(1, 0, 99), /depth/);
  });
  await test('old floor resists all carving until the awakened heart opens the real rootway interaction', () => {
    assert.equal(g.world.carve({ x: 2, y: -76, z: 2 }, 2), 0);
    g.player.teleport(2, -69.3, 3.8); aim(B.DEEP_GATE); assert.equal(g.player.blocked(...Object.values(g.player.position)), false);
    assert.equal(g.deep.interaction(g.player)?.locked, true); assert.equal(g.deep.open(g.player), false);
    Object.assign(g.expedition.state, { recovered: [0, 1], runes: [0, 1, 2], awakened: true });
    for (const b of g.expedition.bodies) b.collected = true; g.expedition.physics.loose.clear(); g.expedition.physics.awake.clear();
    g.setScreen(null); g.use(); assert.ok(g.deep.state.open); assert.equal(g.deep.open(g.player), false);
    const p = new B.Player(g.world); for (let y = -70; y >= -87; y -= .2) assert.ok(!p.blocked(2, y, 2), 'shaft clearance at ' + y);
    assert.ok(g.world.carve({ x: 2, y: -78, z: 2 }, 2.7)); assert.equal(g.world.carve({ x: 0, y: -299, z: 0 }, 1.9), 0);
  });
  await test('deep incremental meshes match cold reconstruction across former floor and chunk corners', () => {
    for (const y of [-80, -152, -280]) g.world.carve({ x: 0, y, z: 0 }, 2.4);
    const shared = new Map(); let count = 0;
    for (const rec of g.world.chunks.values()) {
      const a = rec.mesh, b = g.world.kernel.build(a.origin, g.world.samplesFor(rec.cx, rec.cy, rec.cz));
      assert.deepEqual(a.active, b.active); assert.equal(a.count, b.count);
      for (let id = 0; id < a.active.length; id++) if (a.active[id]) {
        const at = id * 3; assert.deepEqual(a.positions.slice(at, at + 3), b.positions.slice(at, at + 3)); assert.deepEqual(a.normals.slice(at, at + 3), b.normals.slice(at, at + 3));
        const C = g.world.kernel.C, key = [rec.cx * 16 + id % C - 1, rec.cy * 16 + Math.floor(id / C) % C - 1, rec.cz * 16 + Math.floor(id / C / C) - 1].join(',');
        const data = [...a.positions.slice(at, at + 3), ...a.normals.slice(at, at + 3)]; if (shared.has(key)) { assert.deepEqual(data, shared.get(key)); count++; } else shared.set(key, data);
      }
    }
    assert.ok(count > 2000);
  });
  await test('station exposure, resource spending, rewards and repeat repairs are atomic', () => {
    const n = g.deep.nodes[0]; g.player.teleport(n.x, n.y - .2, n.z - 2); aim(n);
    assert.equal(g.deep.repair(0, g.player), false);
    g.world.carve(n, 3); frames(.15, dt => g.deep.update(dt, g.player));
    g.player.teleport(n.x, n.y - .5, n.z - 2); aim(n); g.expedition.state.supplies = { bombs: 2, lights: 2 };
    assert.equal(g.deep.repair(0, g.player), false); assert.equal(g.expedition.state.supplies.lights, 2);
    g.expedition.state.supplies.bombs = 3; const before = g.world.revision; assert.ok(g.deep.repair(0, g.player));
    assert.deepEqual(g.expedition.state.supplies, { bombs: 0, lights: 0 }); assert.equal(g.world.revision, before);
    assert.ok(g.world.deepUpgrades.includes(0)); assert.ok(g.deep.repair(0, g.player)); assert.equal(g.deep.state.arrivals.length, 1);
    g.player.yaw += Math.PI; assert.equal(g.deep.repair(0, g.player), false);
  });
  await test('restored machines fall with their light, physical boundary and map marker', () => {
    const n = g.deep.nodes[0], y = n.y; for (let d = y; d >= y - 5; d -= .75) g.world.carve({ x: n.x, y: d, z: n.z }, 3);
    frames(.5, dt => g.deep.update(dt, g.player)); assert.ok(n.y < y - .7); assert.ok(g.deep.physics.contact(n).density > -.011);
    g.view.renderDeep(g, 1); assert.equal(g.view.deepModels[0].root.position.y, n.y); assert.equal(g.deep.markers()[0].y, n.y);
    for (const m of g.view.deepModels) {
      const b = new THREE.Box3().setFromObject(m.root), box = g.deep.obstacles()[m.node.id];
      ['x', 'y', 'z'].forEach((axis, i) => { assert.ok(b.min[axis] >= box[i] - 1e-6); assert.ok(b.max[axis] <= box[i + 3] + 1e-6); });
    }
  });
  await test('station travel rejects blocked landings and attached salvage; Otis uses the earned route', () => {
    const arrival = g.deep.state.arrivals[0]; g.recall(); g.expedition.tether = 0; assert.equal(g.deep.travel(0, g.player, g.expedition), false); g.expedition.detach();
    g.player.obstacles.push([arrival.x - 1, arrival.y - 1, arrival.z - 1, arrival.x + 1, arrival.y + 2, arrival.z + 1]); assert.equal(g.deep.travel(0, g.player, g.expedition), false); g.player.obstacles.pop();
    g.player.teleport(19, .06, 36.1); aim({ x: 19, y: 1.55, z: 38.4 }); g.setScreen(null); g.use(); assert.equal(g.screen, 'town');
    const button = h.elements.get('town-services').children.find(b => b.children[0]?.textContent === 'Return to Rootworks pump house'); assert.ok(button); button.onclick(); assert.equal(g.screen, null); assert.deepEqual(g.player.position, { x: arrival.x, y: arrival.y, z: arrival.z });
  });
  await test('deep survey stores new cells, keeps old IDs, renders bounded profiles and scanner ghosts', () => {
    g.player.teleport(0, -279, 0); g.survey.update(1, g.player); g.setScreen(null); g.scanCooldown = 0; g.scan();
    assert.ok(g.survey.data.cells.some(id => id >= 1024 * 275));
    const chart = g.survey.render(279, g); assert.ok(!/NaN|undefined|Infinity/.test(chart.map + chart.profile));
    for (const m of chart.profile.matchAll(/cy="([\d.-]+)"/g)) assert.ok(+m[1] <= 400 && +m[1] >= 0);
    g.openSurvey(); assert.equal(+h.elements.get('survey-depth').max, 297); assert.ok(+h.elements.get('survey-depth').value > 270);
    for (const d of [81, 129, 209, 280]) { g.player.y = -d; g.view.render(g, 1 / 60, d); assert.ok(Number.isFinite(g.view.lamp.color.r)); }
  });
  await test('station gearing doubles actual deep excavation without changing upper cuts', () => {
    const volume = (y, upgraded) => {
      const w = new B.World(1, 0, 1); w.deepOpen = true; w.field.fill(-2); w.deepUpgrades = upgraded ? [0] : [];
      const p = new B.Player(w); p.teleport(0, y, 0); w.carve(p.head, 2); p.pitch = 0; const cutter = new B.Cutter(w), before = w.field.slice();
      frames(.3, dt => cutter.update(dt, p, 1, true)); return w.field.reduce((sum, n, i) => sum + n - before[i], 0);
    };
    assert.ok(volume(-100, true) > volume(-100, false) * 1.75); assert.equal(volume(-8, true), volume(-8, false));
  });
  await test('later station repairs change actual scanner range and lift speed, with distinct saved town news', () => {
    for (const n of g.deep.nodes.slice(1)) {
      g.world.carve(n, 3); frames(.1, dt => g.deep.update(dt, g.player));
      g.player.teleport(n.x, n.y - .5, n.z - 2); aim(n); g.expedition.state.supplies = { bombs: 3, lights: 2 };
      assert.ok(g.deep.repair(n.id, g.player));
    }
    g.player.teleport(0, -280, 0); g.setScreen(null); g.scanCooldown = 0; g.scan();
    assert.equal(h.elements.get('scan-mode').textContent, `SUBSURFACE SCAN / ${g.mysteries.scannerRange() + 12} m`);
    const step = g.player.step, speeds = []; g.player.step = (dt, keys, speed) => speeds.push(speed);
    g.update(1 / 60); g.player.y = .1; g.update(1 / 60); g.player.step = step;
    assert.deepEqual([...new Set(speeds)], [16, B.GEAR.lift.values[g.economy.state.gear.lift]]);
    assert.equal(g.town.talk('otis').chapter, 'stations'); B.Town.validate(g.town.state);
  });
  await test('deep minerals, deployed light, return anchor and freight dock survive validation at their real depth', () => {
    const node = g.deposits.nodes.find(n => n.y < -210 && !n.collected); g.world.carve(node, 3);
    g.player.teleport(node.x, node.y - .4, node.z - 1); assert.ok(g.orePhysics.collect(node, g.economy, g.player.head));
    g.player.teleport(0, -280, 0); g.player.pitch = -1.2; g.setScreen(null); g.expedition.state.supplies.lights = 1; g.deploy('lamp');
    frames(.5, dt => g.gadgets.update(dt, g.orePhysics, g.expedition.physics, g.player)); assert.ok(g.gadgets.nodes.some(n => n.type === 'lamp' && n.y < -270));
    assert.ok(g.expedition.placeAnchor(g.player)); g.economy.state.cash = 1000; assert.ok(g.freight.buy());
    g.player.teleport(0, -282, 0); const placement = g.freight.placement(g.player); assert.ok(!placement.reason, placement.reason); assert.ok(g.freight.place(g.player));
    const save = B.Saves.snapshot(g), data = B.Saves.validate(save); assert.ok(data.collected.includes(node.id)); assert.ok(data.state.expedition.anchor.y < -270); assert.ok(data.state.expedition.freight.dock.y < -270);
    for (const mutate of [s => s.state.expedition.anchor.y = -400, s => s.state.expedition.devices[0].y = -400, s => s.state.expedition.freight.dock.y = -400, s => s.player.y = -400]) { const copy = structuredClone(save); mutate(copy); assert.throws(() => B.Saves.validate(copy)); }
  });
  await test('portable deep saves retain exact terrain, stations, arrivals and charts; invalid depth/state reject', async () => {
    const save = B.Saves.snapshot(g, true), data = B.Saves.validate(save), field = g.world.field.slice(), deep = structuredClone(g.deep.state);
    await g.install(data); assert.deepEqual(g.world.field, field); assert.deepEqual(g.deep.state, deep); assert.ok(g.world.deepOpen);
    for (const mutate of [s => s.depthVersion = 9, s => s.depthVersion = 0, s => s.state.expedition.deep.open = false, s => s.state.expedition.deep.known.push(8), s => s.state.expedition.deep.arrivals[0].y = -500, s => s.state.expedition.deep.bodies[0].y = -500, s => s.state.expedition.survey.cells.push(g.survey.count)]) {
      const copy = structuredClone(save); mutate(copy); assert.throws(() => B.Saves.validate(copy));
    }
  });
  console.log(`COMPLETE ${deepChecks} lower mine checks passed (no browser or input automation)`);
} finally { h.close(); }
