// Actual furnace systems and Game integration, using inert scene/DOM adapters only.
import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), g = h.game, B = B2;
export let foremanChecks = 0;
const test = async (name, fn) => { await fn(); foremanChecks++; console.log('PASS foreman: ' + name); };
const frames = (seconds, fn, hz = 60) => { for (let i = 0; i < seconds * hz; i++) fn(1 / hz); };
const aim = n => { const p = g.player.head, dx = n.x - p.x, dy = n.y - p.y, dz = n.z - p.z; g.player.yaw = Math.atan2(-dx, -dz); g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); };
const unlock = () => {
  Object.assign(g.expedition.state, { recovered: [0, 1], runes: [0, 1, 2], awakened: true });
  for (const n of g.expedition.bodies) n.collected = true; g.expedition.physics.loose.clear(); g.expedition.physics.awake.clear();
  g.deep.state.open = g.world.deepOpen = true; g.economy.state.deepest = 280;
};
try {
  await test('fresh encounters are dormant, hidden on the map and cannot grant powers through the sealed floor', () => {
    assert.equal(g.foreman.nodes.length, 4); assert.equal(g.foreman.state.active, false); assert.deepEqual(g.foreman.markers(), []);
    assert.equal(g.foreman.hit(g.foreman.core, 100, 'rift'), false); assert.equal(g.foreman.forge(g.player), false);
    B.Saves.validate(B.Saves.snapshot(g)); g.view.render(g, 0, 0); assert.equal(g.view.commonBeacon.visible, false);
  });
  await test('the full furnace settles on terrain and all original model geometry stays within physical bodies', () => {
    const f = g.foreman, y = f.core.y; frames(2, dt => f.update(dt, g.player)); assert.ok(f.core.y < y - .5); assert.ok(f.physics.contact(f.core).density >= -.005);
    g.view.renderForeman(g, 2);
    for (const m of g.view.foremanModels) {
      const box = new THREE.Box3().setFromObject(m.root), n = m.node;
      for (const [i, axis] of ['x', 'y', 'z'].entries()) { assert.ok(box.min[axis] >= n[axis] - n.size[i] / 2 - 1e-6); assert.ok(box.max[axis] <= n[axis] + n.size[i] / 2 + 1e-6); }
      m.root.traverse(o => { for (const a of Object.values(o.geometry?.attributes || {})) assert.ok(a.array.every(Number.isFinite)); });
    }
  });
  await test('buried locks reject damage, then real drill targeting breaks an exposed lock and opens one core segment', () => {
    unlock(); const f = g.foreman, lock = f.nodes[1]; assert.equal(f.hit(lock, 100, 'blast'), false); assert.equal(f.hit(f.core, 100, 'cutter'), false);
    g.world.carve(lock, 2.8); g.player.teleport(lock.x, lock.y - g.player.eye, lock.z + 3); aim(lock); g.selectTool('lance');
    frames(2, dt => g.actions.update(dt, g.player, g.economy.state, true)); assert.equal(lock.hp, 0); assert.equal(f.broken, 1); assert.ok(f.state.active);
    assert.ok(f.hit(f.core, 1000, 'rift')); assert.equal(f.core.hp, 280); assert.equal(f.hit(f.core, 100, 'axe'), false);
    assert.equal(g.foreman.markers().length, 3);
  });
  await test('axe windup and real explosive records damage exposed locks without repeat blast damage', () => {
    const f = g.foreman, lock = f.nodes[2]; g.world.carve(lock, 2.8); g.player.teleport(lock.x, lock.y - g.player.eye, lock.z + 1.8); aim(lock); g.selectTool('axe');
    g.actions.update(.1, g.player, g.economy.state, true); assert.equal(lock.hp, 80);
    g.actions.update(.1, g.player, g.economy.state, true); assert.equal(lock.hp, 46);
    const blast = { serial: ++g.gadgets.serial, ...{ x: lock.x, y: lock.y, z: lock.z }, radius: 2.8, length: 0 }; g.gadgets.blasts.push(blast);
    g.combat.update(1 / 60, g); assert.equal(lock.hp, 0); const hp = f.core.hp; g.combat.update(1 / 60, g); assert.equal(f.core.hp, hp);
    assert.equal(f.healthFloor, 140);
  });
  await test('cutting jet locks its aim, allows a sidestep and collides with cover before carving its impact', () => {
    const f = g.foreman, core = f.core; g.combat.state.health = 100; g.combat.state.grace = 0;
    g.player.teleport(core.x + 5, core.y - .2, core.z); f.state.aim = { x: g.player.x, y: g.player.y + 1, z: g.player.z }; const aimPoint = { ...f.state.aim };
    g.player.z += 2; f.fire(g.player); assert.equal(g.combat.state.health, 100); assert.deepEqual(f.state.aim, aimPoint);
    g.player.z -= 2; f.fire(g.player); assert.equal(g.combat.state.health, 76);
    const original = g.world.density.bind(g.world); g.world.density = (x, y, z) => x > core.x + 2 && x < core.x + 2.8 ? -2 : original(x, y, z);
    g.combat.state.grace = 0; f.fire(g.player); assert.equal(g.combat.state.health, 76); assert.ok(f.beam().reach < 3); g.world.density = original;
  });
  await test('shockwave damages grounded targets once through a clear route and lifting avoids it', () => {
    const f = g.foreman, n = f.core; g.world.carve({ x: n.x + 4, y: n.y - 1, z: n.z }, 2);
    g.player.teleport(n.x + 4, n.y - 2.1, n.z); g.player.grounded = true; g.combat.state.health = 100; g.combat.state.grace = 0;
    f.state.phase = 'quake'; f.state.timer = 2.4 - 4 / 5.5; f.step(1 / 120, g.player); assert.equal(g.combat.state.health, 80);
    frames(.1, dt => f.step(dt, g.player)); assert.equal(g.combat.state.health, 80);
    g.player.grounded = false; g.player.y += 1.6; g.combat.state.grace = 0; f.state.timer = 2.4 - 4 / 5.5; f.step(1 / 120, g.player); assert.equal(g.combat.state.health, 80);
  });
  await test('fixed-step attack phases agree at 30/60/120 Hz and mid-windup save restores the same shot', async () => {
    const f = g.foreman; g.player.teleport(4, f.core.y - .2, 3); f.state.phase = 'aim'; f.state.timer = .9; f.state.aim = { x: 4, y: g.player.y + 1, z: 3 };
    const save = B.Saves.snapshot(g), results = [];
    for (const hz of [30, 60, 120]) {
      const data = B.Saves.validate(save), w = new B.World(data.state.seed, data.generation, data.depthVersion); w.installField(data.field, data.depthVersion); w.deepOpen = true;
      const c = new B.Combat(w, data.state), boss = new B.Foreman(w, data.state, c), p = new B.Player(w); p.teleport(save.player.x, save.player.y, save.player.z); c.state.grace = 0;
      frames(2, dt => boss.update(dt, p), hz); results.push({ phase: boss.state.phase, timer: +boss.state.timer.toFixed(6), health: c.state.health, cycle: boss.state.cycle });
    }
    assert.deepEqual(results[0], results[1]); assert.deepEqual(results[1], results[2]); assert.equal(results[0].health, save.state.expedition.combat.health - 24);
    await g.install(B.Saves.validate(save)); assert.equal(g.foreman.state.phase, 'aim'); assert.equal(g.foreman.state.timer, .9);
    g.combat.state.grace = 0; frames(.95, dt => g.foreman.update(dt, g.player)); assert.equal(g.foreman.state.phase, 'jet');
    const fired = B.Saves.snapshot(g), health = g.combat.state.health; await g.install(B.Saves.validate(fired));
    g.view.renderForeman(g, 3); const beam = g.view.furnaceJet;
    const tip = new THREE.Vector3(0, beam.scale.y / 2, 0).applyQuaternion(beam.quaternion).add(beam.position);
    assert.ok(tip.distanceTo(new THREE.Vector3(...Object.values(g.foreman.state.impact))) < 1e-6, 'rendered shot ends at its recorded impact after the wall craters');
    g.foreman.update(.1, g.player); assert.equal(g.combat.state.health, health, 'loading a fired jet cannot replay its damage');
  });
  await test('real furnace defeat rescues the player with a conserved cache while retaining broken locks and core damage', () => {
    const ore = g.deposits.nodes.find(n => n.y < -210 && !n.collected); g.world.carve(ore, 3); g.player.teleport(ore.x, ore.y - .4, ore.z - 1); assert.ok(g.orePhysics.collect(ore, g.economy, g.player.head));
    const f = g.foreman, damage = f.state.parts.map(n => n.hp), cargo = [...g.economy.state.cargo], cash = g.economy.state.cash;
    g.player.teleport(4, f.core.y - .2, 3); f.state.phase = 'aim'; f.state.timer = .001; f.state.aim = { x: 4, y: g.player.y + 1, z: 3 };
    g.combat.state.health = 1; g.combat.state.grace = 0; g.setScreen(null); g.update(1 / 60);
    assert.equal(g.screen, 'discovery'); assert.ok(g.player.y >= 0); assert.equal(g.combat.state.health, 100); assert.equal(g.economy.state.cash, cash);
    assert.deepEqual(g.economy.state.cargo, [0, 0, 0, 0, 0]); assert.deepEqual(g.combat.drops.find(n => n.id === 3).cargo, cargo); assert.deepEqual(f.state.parts.map(n => n.hp), damage);
    B.Saves.validate(B.Saves.snapshot(g));
  });
  await test('undermining a wide machine releases it and its model/obstacle follow the saved body', () => {
    const f = g.foreman, n = f.core, y = n.y;
    for (const x of [-1.8, 0, 1.8]) for (const z of [-1.8, 0, 1.8]) g.world.carve({ x: n.x + x, y: n.y - 2.2, z: n.z + z }, 1.8);
    frames(.5, dt => f.physics.update(dt)); assert.ok(n.y < y - .1); assert.ok(f.physics.contact(n).density >= -.005);
    g.view.renderForeman(g, 3); assert.equal(g.view.foremanModels[0].root.position.y, n.y);
    const saved = B.Saves.validate(B.Saves.snapshot(g)); assert.ok(saved.state.expedition.foreman.bodies.some(b => b.id === 100 && b.y === n.y));
  });
  await test('victory pays once, cancels attacks, changes town and survives portable reload', async () => {
    const f = g.foreman, lock = f.nodes[3]; g.world.carve(lock, 2.8); assert.ok(f.hit(lock, 100, 'blast')); assert.equal(f.broken, 3);
    const cash = g.economy.state.cash; assert.ok(f.hit(f.core, 1000, 'cutter')); assert.equal(f.state.defeated, true); assert.equal(g.economy.state.cash, cash + 5000);
    f.defeat(); assert.equal(g.economy.state.cash, cash + 5000); g.foremanEvents(); assert.equal(g.screen, 'foreman');
    g.player.teleport(5, .06, 44); g.view.render(g, 0, 4); assert.ok(g.view.commonBeacon.visible); assert.ok(g.view.commonLight.intensity > 0);
    g.town.talk('mara'); assert.equal(g.town.talk('mara').chapter, 'foreman');
    const save = B.Saves.snapshot(g, true); await g.install(B.Saves.validate(save)); assert.ok(g.foreman.state.defeated); assert.equal(g.economy.state.cash, cash + 5000);
  });
  await test('earned Z bore carves a full-body passage, preserves ore and ownership, and persists its cooldown', () => {
    g.player.teleport(-5, -250, 5); g.world.carve(g.player.head, 2); g.player.yaw = Math.PI; g.player.pitch = 0; g.setScreen(null);
    const nodes = g.deposits.nodes.length, collected = g.deposits.nodes.filter(n => n.collected).length, supply = { ...g.expedition.state.supplies };
    h.handlers.get('keydown')({ code: 'KeyZ', repeat: false, preventDefault() {} }); assert.equal(g.foreman.state.forgeCooldown, 6);
    const p = new B.Player(g.world); for (let d = 1; d <= 8; d += .25) assert.ok(!p.blocked(-5, g.player.y, 5 + d), 'bore at ' + d);
    assert.equal(g.world.density(-5, -249, 14), -2); assert.equal(g.foreman.forge(g.player), false); assert.equal(g.deposits.nodes.length, nodes); assert.equal(g.deposits.nodes.filter(n => n.collected).length, collected); assert.deepEqual(g.expedition.state.supplies, supply);
    assert.equal(B.Saves.validate(B.Saves.snapshot(g)).state.expedition.foreman.forgeCooldown, 6);
  });
  await test('corrupt furnace snapshots reject phase/health/lock/body exploits; old claims gain no terrain edits', async () => {
    const good = B.Saves.snapshot(g);
    for (const mutate of [s => s.phase = 'nonsense', s => s.parts[0].hp = 100, s => s.parts[1].hp = 80, s => s.parts[0].id = 1, s => s.bodies.push(s.bodies[0]), s => s.forgeCooldown = 7, s => s.known = false, s => s.bodies[0].x = 40]) { const copy = structuredClone(good); mutate(copy.state.expedition.foreman); assert.throws(() => B.Saves.validate(copy)); }
    const old = structuredClone(good); delete old.state.expedition.foreman; const field = g.world.field.slice(); await g.install(B.Saves.validate(old)); assert.deepEqual(g.world.field, field); assert.equal(g.foreman.state.defeated, false); assert.equal(g.foreman.state.parts[0].hp, 420);
  });
  console.log(`COMPLETE ${foremanChecks} furnace checks passed (inert scene and DOM; no browser or OS input)`);
} finally { h.close(); }
