import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const harness = await nodeGame(), { game: g, elements, handlers } = harness, B = B2;
export let freightChecks = 0;
const test = async (name, fn) => { await fn(); freightChecks++; console.log('PASS freight: ' + name); };
const run = (seconds, fn, hz = 120) => { for (let i = 0; i < Math.round(seconds * hz); i++) fn(1 / hz); };
const key = code => ({ code, repeat: false, preventDefault() {} });
function setup() {
  const world = new B.World(260923), economy = new B.Economy(), freight = new B.Freight(world, economy), player = new B.Player(world);
  economy.state.expedition.recovered = [0]; economy.state.cash = 1000; assert.ok(freight.buy());
  return { world, economy, freight, player };
}
function bay(s) { s.world.carve({ x: 0, y: -12, z: 0 }, 3.5); s.player.teleport(0, -12 - s.player.eye, 2.3); s.player.pitch = -.9; s.player.yaw = 0; const p = s.freight.placement(s.player); assert.equal(p.reason, ''); assert.ok(s.freight.place(s.player)); return s.freight.state.dock; }
function shaft(s, radius = 1) { const d = s.freight.state.dock; for (let y = d.y + 1; y <= 1; y += .4) s.world.carve({ x: d.x, y, z: d.z }, radius); }
function beside(s) { const d = s.freight.state.dock; s.player.teleport(d.x, d.y + .9 - s.player.eye, d.z + 2); }
function load(s, kind = 0, n = 8) { for (let i = 0; i < n; i++) assert.ok(s.economy.collect(kind)); assert.ok(s.freight.send(s.player)); }

await test('purchase and larger cage require their recoveries and spend cash only once', () => {
  const s = setup(); assert.equal(s.economy.state.cash, 820); assert.equal(s.freight.capacity, 24); assert.equal(s.freight.buy(), false); assert.equal(s.economy.state.cash, 820);
  s.economy.state.expedition.recovered.push(1); assert.ok(s.freight.buy()); assert.equal(s.freight.capacity, 64); assert.equal(s.economy.state.cash, 400); assert.equal(s.freight.buy(), false);
  const locked = new B.Freight(s.world, new B.Economy()); assert.equal(locked.buy(), false);
});
await test('placement requires an open underground bay and preview never mutates the mine', () => {
  const s = setup(); assert.ok(s.freight.placement(s.player).reason); s.world.carve({ x: 0, y: -12, z: 0 }, 3.5); s.player.teleport(0, -12 - s.player.eye, 2.3); s.player.pitch = -.9;
  const before = s.world.field.slice(), money = s.economy.state.cash, p = s.freight.placement(s.player); assert.equal(p.reason, ''); assert.ok(p.obstruction); assert.deepEqual(s.world.field, before); assert.equal(s.economy.state.cash, money); assert.equal(s.freight.state.dock, null);
  assert.ok(s.freight.place(s.player)); assert.equal(s.freight.place(s.player), false); assert.deepEqual(s.world.field, before);
});
await test('the cage stops against real rock, then resumes after excavation', () => {
  const s = setup(); bay(s); load(s); run(4, dt => s.freight.update(dt)); assert.ok(s.freight.obstruction); assert.ok(s.freight.state.travel > 1); assert.equal(s.freight.stockCount, 0); const stalled = s.freight.state.travel;
  run(2, dt => s.freight.update(dt)); assert.equal(s.freight.state.travel, stalled); assert.ok(B.Freight.contact(s.world, s.freight.cage).density >= -.0041);
  shaft(s); run(16, dt => s.freight.update(dt)); assert.equal(s.freight.stockCount, 8); assert.equal(s.freight.state.phase, 'idle'); assert.equal(s.freight.state.travel, 0); assert.equal(s.freight.events.filter(e => e.text.includes('delivered')).length, 1);
});
await test('a center-line hole is too narrow for the cage and an orange marker identifies its edge', () => {
  const s = setup(); bay(s); shaft(s, .38); load(s); run(8, dt => s.freight.update(dt)); assert.ok(s.freight.obstruction); assert.equal(s.freight.stockCount, 0);
  const p = s.freight.obstruction, d = s.freight.state.dock; assert.ok(Math.hypot(p.x - d.x, p.z - d.z) > .3);
  shaft(s, 1); run(10, dt => s.freight.update(dt)); assert.equal(s.freight.stockCount, 8);
});
await test('goods cannot be sold in transit; delivery and hopper sale pay exactly once', () => {
  const s = setup(); bay(s); shaft(s); load(s); const cash = s.economy.state.cash;
  assert.equal(s.economy.sell().count, 0); assert.equal(s.economy.state.cash, cash); assert.equal(s.economy.state.mined, 8);
  run(10, dt => s.freight.update(dt)); assert.equal(s.economy.state.cash, cash); assert.equal(s.economy.saleCount, 8); const receipt = s.economy.sell(); assert.equal(receipt.count, 8); assert.equal(receipt.minerals, 64); assert.equal(receipt.bonus, 48); assert.equal(s.freight.stockCount, 0); assert.equal(s.economy.state.sold[0], 8); assert.equal(s.economy.sell().minerals, 0);
});
await test('recalling a blocked load returns it safely and taking it back cannot duplicate it', () => {
  const s = setup(); bay(s); load(s); assert.equal(s.freight.pack(s.player), false); run(4, dt => s.freight.update(dt)); beside(s); assert.ok(s.freight.recall(s.player)); run(5, dt => s.freight.update(dt)); assert.equal(s.freight.state.phase, 'idle'); assert.equal(s.freight.loadCount, 8); assert.equal(s.freight.stockCount, 0);
  assert.ok(s.freight.take(s.player)); assert.equal(s.economy.count, 8); assert.equal(s.economy.state.mined, 8); assert.equal(s.freight.take(s.player), false); assert.ok(s.freight.pack(s.player)); assert.ok(s.freight.state.owned); assert.equal(s.freight.state.dock, null);
});
await test('cage capacity retains overflow in the pack and prioritizes valuable minerals', () => {
  const s = setup(); bay(s); s.economy.state.gear.cargo = 2; for (let i = 0; i < 25; i++) s.economy.collect(0); for (let i = 0; i < 10; i++) s.economy.collect(3);
  assert.ok(s.freight.send(s.player)); assert.equal(s.freight.loadCount, 24); assert.equal(s.freight.state.load[3], 10); assert.equal(s.economy.count, 11); assert.equal(s.freight.send(s.player), false);
});
await test('the returned cage accepts another haul and packing preserves unsold yard stock', () => {
  const s = setup(); bay(s); shaft(s); load(s, 0, 8); run(16, dt => s.freight.update(dt));
  load(s, 1, 6); run(16, dt => s.freight.update(dt)); assert.equal(s.freight.stockCount, 14); assert.equal(s.economy.state.mined, 14); assert.equal(s.freight.loadCount, 0);
  beside(s); assert.ok(s.freight.pack(s.player)); assert.equal(s.freight.stockCount, 14); const receipt = s.economy.sell(); assert.equal(receipt.minerals, 8 * 8 + 6 * 18); assert.equal(receipt.count, 14);
});
await test('moving cage waits for the player or salvage instead of crossing them', () => {
  const s = setup(); bay(s); shaft(s); load(s); const d = s.freight.state.dock;
  s.player.teleport(d.x, d.y + 2, d.z); run(2, dt => s.freight.update(dt, s.player)); assert.equal(s.freight.blockedBy, 'Stand clear of the cage'); assert.ok(s.freight.cage.y + .44 <= s.player.y);
  s.player.teleport(d.x + 2, d.y, d.z); const body = { x: d.x, y: -5, z: d.z, size: [1.5, 1.2, 1.5] }; run(3, dt => s.freight.update(dt, s.player, [body])); assert.equal(s.freight.blockedBy, 'Salvage blocks the cage');
  body.collected = true; run(10, dt => s.freight.update(dt, s.player, [body])); assert.equal(s.freight.stockCount, 8);
});
await test('freight motion and shipment outcomes agree at 30, 60 and 120 Hz', () => {
  let expected;
  for (const hz of [30, 60, 120]) { const s = setup(); bay(s); shaft(s); load(s); run(3, dt => s.freight.update(dt), hz); const state = structuredClone(s.freight.state); if (expected) assert.deepEqual(state, expected); else expected = state; run(10, dt => s.freight.update(dt), hz); assert.equal(s.freight.stockCount, 8); assert.equal(s.freight.state.phase, 'idle'); }
});
await test('real T aim, release, E dock actions, scene geometry and survey markers are connected', () => {
  g.expedition.bodies[0].y = 2; g.expedition.update(1 / 120, g.player, false, g.orePhysics); g.economy.state.cash = 1000; elements.get('buy-freight').onclick(); assert.ok(g.freight.state.owned);
  g.world.carve({ x: 0, y: -12, z: 0 }, 3.5); g.player.teleport(0, -12 - g.player.eye, 2.3); g.player.pitch = -.9; g.setScreen(null);
  handlers.get('keydown')(key('KeyT')); g.view.render(g, 1 / 60, 3); assert.ok(g.view.freightPreview.visible); assert.equal(g.freight.state.dock, null); handlers.get('keyup')(key('KeyT')); assert.ok(g.freight.state.dock);
  handlers.get('keydown')(key('KeyE')); assert.equal(g.screen, 'freight'); assert.equal(elements.get('freight-send').disabled, true); g.setScreen(null); g.view.render(g, 1 / 60, 4); assert.ok(g.view.freightModel.visible); assert.ok(!g.view.freightPreview.visible); assert.equal(g.survey.markers(g).filter(m => m.type === 'freight').length, 2);
  g.view.freightModel.traverse(m => { if (m.geometry) for (const n of m.geometry.attributes.position.array) assert.ok(Number.isFinite(n)); });
  const before = g.freight.state.dock; assert.equal(g.freight.place(g.player), false); assert.equal(g.freight.state.dock, before);
});
await test('mid-shipment save/load conserves every mineral and continues from the saved cage position', async () => {
  // Collect actual generated IDs so validation exercises the complete ore ledger.
  for (const n of g.deposits.nodes.slice(0, 8)) { g.world.carve(n, 1.2); assert.ok(g.orePhysics.collect(n, g.economy, n)); }
  shaft({ world: g.world, freight: g.freight }); g.openFreight(); elements.get('freight-send').onclick(); assert.equal(g.freight.loadCount, 8); run(1, dt => g.freight.update(dt));
  const position = g.freight.cage, save = B.Saves.snapshot(g, true), state = B.Saves.validate(save); assert.equal(state.state.expedition.freight.load[0], 8); await g.install(state); assert.deepEqual(g.freight.cage, position);
  g.player.teleport(4, .1, 6); g.setScreen(null); run(10, dt => g.update(dt)); assert.equal(g.freight.stockCount, 8); B.Saves.validate(B.Saves.snapshot(g)); const receipt = g.sell(); assert.equal(receipt.count, g.economy.state.sold.reduce((a, b) => a + b, 0)); assert.ok(receipt.minerals >= 64); B.Saves.validate(B.Saves.snapshot(g));
});
await test('corrupt freight fields and cross-inventory duplication are rejected before install', () => {
  const save = B.Saves.snapshot(g);
  for (const mutate of [f => f.stock[0]++, f => f.load[0]++, f => f.owned = false, f => f.dock.x = 14, f => f.phase = 'teleport', f => f.travel = 1000, f => f.dock.y = 2, f => f.stock[0] = -1, f => f.upgraded = true, f => f.phase = 'outbound']) { const bad = structuredClone(save); mutate(bad.state.expedition.freight); assert.throws(() => B.Saves.validate(bad)); }
});
await test('old claims initialize an unowned rig and cancelled placement spends nothing', async () => {
  const old = B.Saves.snapshot(g); delete old.state.expedition.freight; await g.install(B.Saves.validate(old)); assert.equal(g.freight.state.owned, false); assert.equal(g.freight.stockCount, 0);
  g.economy.state.cash = 500; g.buyFreight(); g.setScreen(null); g.player.teleport(0, -12 - g.player.eye, 2.3); g.player.pitch = -.9;
  handlers.get('keydown')(key('KeyT')); handlers.get('blur')(); handlers.get('keyup')(key('KeyT')); assert.equal(g.freight.state.dock, null); assert.equal(g.freightPreview, null); assert.ok(g.freight.state.owned);
  g.setScreen(null); const touch = elements.get('touch-freight'); touch.listeners.get('pointerdown')({ pointerId: 2, preventDefault() {} }); touch.listeners.get('pointercancel')(); touch.listeners.get('pointerup')(); assert.equal(g.freight.state.dock, null);
});
harness.close();
console.log(`COMPLETE ${freightChecks} freight checks passed (no browser or input automation)`);
