// Production combat, navigation, conservation and UI bindings; no browser or OS input.
import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), g = h.game, B = B2;
export let combatChecks = 0;
const test = async (name, fn) => { await fn(); combatChecks++; console.log('PASS combat: ' + name); };
const frames = (seconds, fn, hz = 60) => { for (let i = 0; i < Math.round(seconds * hz); i++) fn(1 / hz); };
const aim = (p, n) => { const dx = n.x - p.x, dy = n.y - p.head.y, dz = n.z - p.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(dy, Math.hypot(dx, dz)); };
function setup() {
  const world = new B.World(260923, 0), state = B.freshState(); state.deepest = 16; state.expedition.supplies = { bombs: 3, lights: 6 }; world.carve({ x: 0, y: -14, z: 0 }, 6);
  const combat = new B.Combat(world, state), player = new B.Player(world), cutter = new B.Cutter(world), actions = new B.ToolActions(world, cutter, combat);
  player.teleport(0, -15.1, 2.5); const n = combat.enemies[0]; Object.assign(n, { x: 0, y: -14, z: 0, phase: 'idle' }); aim(player, n);
  const game = { player, gadgets: { nodes: [], blasts: [] }, refuges: { nodes: [], state: { lit: [] } }, expedition: { pulseSerial: 0, lastPulse: null } };
  return { world, state, combat, player, cutter, actions, n, game };
}
try {
  await test('real Game exposes axe at 9 m, builds finite creatures and binds health and tool UI', () => {
    assert.equal(g.combat.enemies.length, 3); assert.ok(!g.expedition.tools().includes('axe'));
    g.economy.state.deepest = 9; g.setScreen(null); h.handlers.get('keydown')({ code: 'Digit6', repeat: false, preventDefault() {} }); assert.equal(g.expedition.state.tool, 'axe');
    g.view.render(g, 1 / 60, 1); assert.ok(g.view.axeTool.visible); assert.ok(!g.view.tool.visible); assert.equal(h.elements.get('primary-use-label').textContent, 'Swing');
    g.view.combatScene.traverse(n => { if (n.geometry) for (const value of n.geometry.attributes.position.array) assert.ok(Number.isFinite(value)); });
    const model = g.view.mothModels[0];
    for (const yaw of [0, .8, 1.5]) { model.node.yaw = yaw; g.view.renderCombat(g, 3); const bounds = new THREE.Box3().setFromObject(model.root); for (const [i, k] of ['x', 'y', 'z'].entries()) { assert.ok(bounds.min[k] >= model.node[k] - B.MOTH_SIZE[i] / 2); assert.ok(bounds.max[k] <= model.node[k] + B.MOTH_SIZE[i] / 2); } }
    g.selectTool('cutter'); g.view.render(g, 1 / 60, 1); assert.equal(g.view.axeTool.visible, false); assert.equal(g.view.tool.visible, true);
  });
  await test('one shared tool target damages a reachable moth without excavating behind it', () => {
    const q = setup(), field = q.world.field.slice(); q.actions.update(.2, q.player, q.state, true);
    assert.equal(q.actions.target.kind, 'enemy'); assert.ok(q.n.hp < 60); assert.deepEqual(q.world.field, field); assert.equal(q.cutter.edited, false);
    q.n.phase = 'dead'; q.n.hp = 0; q.player.y = -16.3; q.player.pitch = -1.3; q.actions.update(.2, q.player, q.state, true); assert.ok(q.cutter.edited);
  });
  await test('rock occlusion, reach and aim reject weapon damage; residents are not targets', () => {
    const q = setup(); q.player.yaw += Math.PI; q.actions.update(.1, q.player, q.state, true); assert.equal(q.n.hp, 60);
    q.player.teleport(0, -15.1, 8); aim(q.player, q.n); assert.equal(B.enemyTarget(q.world, q.combat.enemies, q.player.head, q.player.direction, 5.2), null);
    // A real remaining slab between two excavated chambers.
    const wall = new B.World(260923); wall.field.fill(-2); wall.carve({ x: 0, y: -14, z: 0 }, 1.2); wall.carve({ x: 0, y: -14, z: 3 }, 1.2);
    q.player.teleport(0, -15.3, 3); aim(q.player, q.n); assert.equal(B.enemyTarget(wall, [q.n], q.player.head, q.player.direction, 5.2), null);
    assert.equal(B.enemyTarget(q.world, B.TOWN.people, q.player.head, q.player.direction, 100), null);
  });
  await test('drill contact and timed axe damage agree at 30, 60 and 120 Hz', () => {
    const drill = [], axe = [], sustained = [];
    for (const hz of [30, 60, 120]) {
      let q = setup(); frames(1, dt => q.actions.update(dt, q.player, q.state, true), hz); drill.push(q.n.hp);
      q = setup(); q.state.expedition.tool = 'axe'; frames(.4, dt => q.actions.update(dt, q.player, q.state, true), hz); axe.push(q.n.hp); assert.equal(q.n.phase, 'stunned');
      q = setup(); q.state.expedition.tool = 'axe'; q.n.hp = 600; frames(5, dt => q.actions.update(dt, q.player, q.state, true), hz); sustained.push(q.n.hp);
    }
    assert.ok(Math.max(...drill) - Math.min(...drill) < 1e-8); assert.deepEqual(axe, [26, 26, 26]); assert.deepEqual(sustained, [328, 328, 328]);
  });
  await test('axe has a windup, rechecks aim at impact, and pause cancels its pending strike', () => {
    const q = setup(); q.state.expedition.tool = 'axe'; q.actions.update(.1, q.player, q.state, true); assert.equal(q.n.hp, 60);
    q.player.yaw += Math.PI; q.actions.update(.1, q.player, q.state, true); assert.equal(q.n.hp, 60);
    g.economy.state.deepest = 16; g.setScreen(null); g.selectTool('axe'); g.input.fire = true; g.actions.update(.05, g.player, g.economy.state, true); assert.ok(g.combat.state.swing > 0);
    g.setScreen('pause'); assert.equal(g.combat.state.swing, 0); assert.ok(g.combat.state.weaponCooldown > 0); assert.equal(g.input.fire, false);
  });
  await test('full-body flight finds a route around rock and never crosses the wall', () => {
    const q = setup(); q.world.field.fill(-2);
    const points = [{ x: -3, y: -14, z: 0 }, { x: -3, y: -14, z: 3 }, { x: 3, y: -14, z: 3 }, { x: 3, y: -14, z: 0 }];
    for (let j = 1; j < points.length; j++) { const a = points[j - 1], b = points[j], len = Math.hypot(b.x - a.x, b.z - a.z); for (let i = 0; i <= len / .3; i++) q.world.carve({ x: a.x + (b.x - a.x) * i / (len / .3), y: -14, z: a.z + (b.z - a.z) * i / (len / .3) }, 1.3); }
    Object.assign(q.n, points[0]); const target = points.at(-1); assert.equal(q.combat.segment(q.n, target), false);
    const route = q.combat.path(q.n, target, q.combat.homes[0]); assert.ok(route.length > 5, 'moth finds the side corridor');
    let wentAround = false;
    for (let i = 0; i < 120 * 12; i++) { q.combat.time += 1 / 120; q.combat.navigate(q.n, target, 2, 1 / 120); assert.equal(q.combat.blocked(q.n), false); if (q.n.z > 2) wentAround = true; }
    assert.ok(wentAround); assert.ok(Math.hypot(q.n.x - target.x, q.n.z - target.z) < .3, JSON.stringify({ position: [q.n.x, q.n.y, q.n.z], route: q.combat.routes.get(q.n.id) }));
    q.combat.obstacles = [[-2, -16, -2, 2, -12, 2]]; assert.equal(q.combat.segment(points[0], target), false);
  });
  await test('telegraphed lunges damage once and can be dodged; no attacks through rock', () => {
    const q = setup(); q.player.teleport(0, -15.1, 2); q.combat.step(1 / 120, q.player); assert.equal(q.n.phase, 'windup'); assert.equal(q.state.expedition.combat.health, 100);
    frames(.7, dt => q.combat.step(dt, q.player), 120); assert.equal(q.state.expedition.combat.health, 100);
    frames(.8, dt => q.combat.step(dt, q.player), 120); assert.equal(q.state.expedition.combat.health, 82);
    const dodge = setup(); dodge.combat.step(1 / 120, dodge.player); dodge.player.x += 3; frames(1.5, dt => dodge.combat.step(dt, dodge.player), 120); assert.equal(dodge.combat.state.health, 100);
  });
  await test('placed lights deter attacks only along clear sight lines', () => {
    const q = setup(); q.game.gadgets.nodes.push({ type: 'lamp', x: 0, y: -14, z: 2 }); frames(3, dt => q.combat.update(dt, q.game)); assert.equal(q.combat.state.health, 100); assert.ok(q.n.z < 0);
    q.combat.lights = [{ x: 0, y: -14, z: 2, range: 4 }]; q.world.field.fill(-2); q.world.carve({ x: 0, y: -14, z: 2 }, .9); q.world.carve({ x: 0, y: -14, z: -.5 }, .9); assert.equal(q.combat.lightAt({ x: 0, y: -14, z: -.5 }), undefined);
  });
  await test('blast and pulse records damage once, with bore reach and terrain shielding', () => {
    const q = setup(); q.game.gadgets.blasts.push({ x: 0, y: -14, z: 4, radius: 1, length: 4, direction: { x: 0, y: 0, z: -1 }, serial: 1 }); q.combat.update(0, q.game); const hp = q.n.hp; assert.ok(hp < 60); q.combat.update(0, q.game); assert.equal(q.n.hp, hp);
    const r = setup(); r.game.expedition.lastPulse = { x: 0, y: -14, z: 0, radius: 2 }; r.game.expedition.pulseSerial = 1; r.combat.update(0, r.game); assert.equal(r.n.hp, 16); r.combat.update(0, r.game); assert.equal(r.n.hp, 16);
    const wall = setup(); wall.world.field.fill(-2); wall.world.carve(wall.n, .8); wall.world.carve({ x: 0, y: -14, z: 2.5 }, .8); wall.combat.area({ x: 0, y: -14, z: 2.5 }, 4, 100, 'blast'); assert.equal(wall.n.hp, 60);
    const actual = setup(); actual.state.expedition.recovered = [1];
    const expedition = new B.Expedition(actual.world, new B.Economy(actual.state)); expedition.damageTarget = (head, dir, reach) => B.enemyTarget(actual.world, actual.combat.enemies, head, dir, reach); actual.game.expedition = expedition;
    assert.ok(expedition.pulse(actual.player, false)); actual.combat.update(0, actual.game); assert.equal(actual.n.hp, 16);
    actual.state.expedition.awakened = true; actual.state.expedition.tool = 'gravity'; const before = Math.hypot(actual.n.x - actual.player.x, actual.n.y - actual.player.head.y, actual.n.z - actual.player.z);
    actual.actions.update(.1, actual.player, actual.state, true); assert.ok(actual.n.hp < 16); assert.ok(Math.hypot(actual.n.x - actual.player.x, actual.n.y - actual.player.head.y, actual.n.z - actual.player.z) < before);
  });
  await test('defeated moths stay cleared; physical husks fall and refund supplies once', () => {
    const q = setup(); q.combat.hit(q.n, 60, 'axe'); assert.equal(q.n.phase, 'dead'); assert.equal(q.combat.drops.length, 1); const drop = q.combat.drops[0], y = drop.y;
    frames(.6, dt => q.combat.physics.update(dt)); assert.ok(drop.y < y - 1); assert.ok(q.combat.physics.contact(drop).density >= -.01);
    q.player.teleport(drop.x, drop.y - q.player.eye, drop.z + 1); aim(q.player, drop); q.state.expedition.supplies.bombs = 98;
    assert.ok(q.combat.collect(0, q.player)); assert.equal(q.state.expedition.supplies.bombs, 99); assert.equal(drop.charges, 1); assert.equal(q.combat.collect(0, q.player), false);
    q.state.expedition.supplies.bombs = 98; assert.ok(q.combat.collect(0, q.player)); assert.equal(q.combat.collect(0, q.player), false); assert.equal(q.n.reward, 0);
    frames(3, dt => q.combat.step(dt, q.player), 120); assert.equal(q.n.hp, 0);
  });
  await test('real defeat moves minerals to a cache, preserves money and reloads the exact ledger', async () => {
    await g.install(null); g.setScreen(null); const n = g.combat.enemies[0]; g.world.carve(n, 3); g.player.teleport(n.x, n.y - 1.1, n.z + 1.5);
    for (const ore of g.deposits.nodes.slice(0, 7)) { ore.collected = true; g.orePhysics.index.remove(ore); g.orePhysics.awake.delete(ore); g.orePhysics.loose.delete(ore); g.economy.collect(ore.kind); }
    const cargo = [...g.economy.state.cargo], money = g.economy.state.cash, field = g.world.field.slice(); g.combat.hurt(100); g.update(1 / 60);
    assert.equal(g.screen, 'discovery'); assert.equal(g.combat.state.health, 100); assert.equal(g.economy.count, 0); assert.equal(g.economy.state.cash, money); assert.deepEqual(g.combat.drops.find(n => n.id === 3).cargo, cargo);
    const save = B.Saves.snapshot(g, true); await g.install(B.Saves.validate(save)); assert.deepEqual(g.world.field, field); assert.equal(g.combat.state.rescues, 1);
    const cache = g.combat.drops.find(n => n.id === 3); g.player.teleport(cache.x, cache.y - g.player.eye, cache.z + 1); aim(g.player, cache); g.setScreen(null); g.use(); assert.deepEqual(g.economy.state.cargo, cargo); assert.equal(g.combat.drops.some(n => n.id === 3), false); B.Saves.validate(B.Saves.snapshot(g));
  });
  await test('repeat rescues retain earlier cargo; partial recovery respects capacity and surface rest heals', () => {
    const q = setup(); q.state.cargo[0] = 10; q.combat.rescue(q.player); const cache = q.combat.drops.find(n => n.id === 3), first = { x: cache.x, y: cache.y, z: cache.z };
    q.player.x += 3; q.state.cargo[1] = 8; q.combat.rescue(q.player); assert.deepEqual(cache.cargo, [10, 8, 0, 0, 0]); assert.deepEqual({ x: cache.x, y: cache.y, z: cache.z }, first);
    q.player.teleport(cache.x, cache.y - q.player.eye, cache.z + 1); aim(q.player, cache); q.combat.collect(3, q.player); assert.equal(q.state.cargo.reduce((a, b) => a + b, 0), 12); assert.equal(cache.cargo.reduce((a, b) => a + b, 0), 6);
    q.combat.state.health = 70; q.player.teleport(0, .06, 12); frames(1, dt => q.combat.step(dt, q.player), 120); assert.ok(Math.abs(q.combat.state.health - 82) < 1e-8);
  });
  await test('portable encounter saves preserve windup and reject invalid damage, duplicate loot and cargo', async () => {
    await g.install(null); const n = g.combat.enemies[0]; g.world.carve(n, 2); n.phase = 'windup'; n.timer = .4; n.hp = 31; n.known = true;
    const save = B.Saves.snapshot(g, true); await g.install(B.Saves.validate(save)); assert.equal(g.combat.enemies[0].timer, .4); assert.equal(g.combat.enemies[0].hp, 31);
    const good = B.Saves.snapshot(g), state = structuredClone(g.economy.state);
    for (const mutate of [s => s.state.expedition.combat.health = NaN, s => s.state.expedition.combat.enemies[0].hp = 61, s => s.state.expedition.combat.enemies[0].phase = 'dead', s => s.state.expedition.combat.enemies[0].direction.x = 4, s => s.state.expedition.combat.enemies[0].reward = 2, s => s.state.expedition.combat.drops.push({ id: 3, x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0, cargo: [20, 0, 0, 0, 0], charges: 0 })]) { const bad = structuredClone(good); mutate(bad); assert.throws(() => B.Saves.validate(bad)); }
    assert.deepEqual(g.economy.state, state);
  });
  await test('older saves gain encounters without a terrain reset and rendering does not advance combat', async () => {
    const old = B.Saves.snapshot(g); delete old.state.expedition.combat; const field = old.field.slice(); await g.install(B.Saves.validate(old)); assert.deepEqual(g.world.field, field); assert.equal(g.combat.state.health, 100);
    const before = structuredClone(g.combat.state); g.view.render(g, .5, 4); g.view.render(g, .5, 5); assert.deepEqual(g.combat.state, before);
  });
} finally { h.close(); }
console.log(`COMPLETE ${combatChecks} combat checks passed (inert renderer and DOM; no browser or OS input)`);
