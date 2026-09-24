import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const harness = await nodeGame(), { game: g, elements, handlers } = harness, B = B2;
export let mysteryChecks = 0;
const test = async (name, fn) => { await fn(); mysteryChecks++; console.log('PASS mysteries: ' + name); };
const run = (seconds, fn) => { for (let i = 0; i < Math.round(seconds * 120); i++) fn(1 / 120); };
const key = code => ({ code, repeat: false, preventDefault() {} });
function setup() {
  const world = new B.World(260923), state = B.freshState(); state.deepest = 40;
  const mysteries = new B.Mysteries(world, state), gadgets = new B.Gadgets(world, state.expedition, state), player = new B.Player(world);
  state.expedition.supplies.bombs = 20;
  return { world, state, mysteries, gadgets, player, step(dt) { gadgets.update(dt); mysteries.update(dt, player, gadgets); } };
}
function prepareSeals(s) {
  s.world.field.fill(-2); s.gadgets.select('sticky');
  for (const p of B.ECHO_SEALS) s.world.carve({ ...p, y: p.y - 1.2 }, 1.3);
}
function plant(s, i) {
  const p = B.ECHO_SEALS[i]; s.player.teleport(p.x, p.y - 1.2 - s.player.eye, p.z); s.player.pitch = 1.54; s.player.yaw = 0;
  assert.ok(s.gadgets.deploy('bomb', s.player)); run(.5, dt => s.step(dt)); assert.ok(s.gadgets.nodes.at(-1).anchor);
}
function connect(world, a, b) { const len = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); for (let t = 0; t <= len; t += .2) world.carve({ x: a.x + (b.x - a.x) * t / len, y: a.y + (b.y - a.y) * t / len, z: a.z + (b.z - a.z) * t / len }, .6); }
function aim(player, p) { const h = player.head, dx = p.x - h.x, dy = p.y - h.y, dz = p.z - h.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); }

await test('scans and visible exploration reveal optional sites without exposing untouched caves', () => {
  const s = setup(); s.mysteries.scan(s.player.head, 10); assert.deepEqual(s.mysteries.state.known, []);
  s.mysteries.scan({ x: 7, y: -16, z: 6 }, 6); assert.deepEqual(s.mysteries.state.known, [0]); assert.equal(s.mysteries.track(1), false); assert.ok(s.mysteries.track(0));
  const deposits = B.generateDeposits(s.state.seed), expedition = new B.Expedition(s.world, new B.Economy(s.state)), survey = new B.Survey(s.world, s.state, deposits, expedition);
  const chart = survey.render(21, { ...s, economy: { state: s.state } }); assert.ok(chart.markers.some(m => m.name === B.MYSTERIES[0].name)); assert.equal(survey.slice(21).filter(v => v === 2).length, 0);
});
await test('one blast cannot solve all seals, and slow separate blasts do not accumulate', () => {
  const s = setup(); prepareSeals(s);
  for (let i = 0; i < 3; i++) { plant(s, i); assert.equal(s.gadgets.detonate(), 1); run(1.3, dt => s.step(dt)); assert.equal(s.mysteries.state.solved.length, 0); }
  assert.ok(s.mysteries.state.known.includes(0)); assert.equal(s.gadgets.blasts.length, 3);
});
await test('three physically planted remotes open the vault once and upgrade real excavation', () => {
  const s = setup(); prepareSeals(s); for (let i = 0; i < 3; i++) plant(s, i);
  assert.equal(s.gadgets.detonate(), 3); run(.6, dt => s.step(dt)); assert.deepEqual(s.mysteries.state.solved, [0]); assert.equal(s.mysteries.events.filter(e => e.title).length, 1);
  run(2, dt => s.step(dt)); assert.equal(s.mysteries.events.filter(e => e.title).length, 1); assert.equal(s.gadgets.spec('sticky').radius, 3.6);
  s.world.carve({ x: 0, y: -35, z: 0 }, 2); s.player.teleport(0, -35 - s.player.eye, 0); s.player.pitch = 0; s.gadgets.select('bore');
  const preview = s.gadgets.preview(s.player); assert.equal(preview.length, 9); s.gadgets.deploy('bomb', s.player); run(3.2, dt => s.step(dt));
  const b = s.gadgets.blasts.at(-1); assert.equal(b.length, 9); assert.ok(s.world.density(b.x, b.y, b.z - 8.5) > 0); assert.ok(s.world.density(b.x + 2, b.y, b.z - 8.5) < 0);
});
await test('buried seals reject blast records through intervening rock', () => {
  const s = setup(); s.world.field.fill(-2);
  for (const p of B.ECHO_SEALS) s.mysteries.blast({ ...p, radius: 3.2, length: 0 });
  assert.deepEqual(s.mysteries.state.solved, []); assert.deepEqual(s.mysteries.sealUntil, [0, 0, 0]);
});
await test('array needs correct turns, excavated light paths and continuous connection', () => {
  const s = setup(); s.mysteries.state.mirrors = [1, 0]; s.mysteries.traceArray(); run(1, dt => s.step(dt)); assert.equal(s.mysteries.state.solved.length, 0); assert.ok(s.mysteries.beams[0].hit);
  for (let i = 0; i < 3; i++) connect(s.world, B.ARRAY_NODES[i], B.ARRAY_NODES[i + 1]);
  run(.5, dt => s.step(dt)); assert.equal(s.mysteries.connected, 3); assert.equal(s.mysteries.state.solved.length, 0);
  s.mysteries.state.mirrors[0] = 2; s.mysteries.traceArray(); run(.1, dt => s.step(dt)); assert.equal(s.mysteries.linkTime, 0);
  s.mysteries.state.mirrors[0] = 1; s.mysteries.traceArray(); run(.8, dt => s.step(dt)); assert.deepEqual(s.mysteries.state.solved, [1]); assert.ok(s.mysteries.focus(3)); assert.equal(s.mysteries.scannerRange(), 18);
});
await test('real E rotates only an exposed aimed prism; distant and occluded use fails', () => {
  g.setScreen(null); const p = B.ARRAY_NODES[1]; g.player.teleport(p.x, p.y - g.player.eye, p.z + 1); aim(g.player, p);
  const start = g.mysteries.state.mirrors[0]; assert.equal(g.interaction()?.kind, 'prism'); handlers.get('keydown')(key('KeyE')); assert.equal(g.mysteries.state.mirrors[0], (start + 1) % 4);
  const far = { head: { x: p.x, y: p.y, z: p.z + 5 }, direction: { x: 0, y: 0, z: -1 } }; assert.equal(g.mysteries.rotate(0, far), false);
  g.player.yaw += Math.PI; assert.equal(g.mysteries.rotate(0, g.player), false);
  const s = setup(); s.world.field.fill(-2); s.player.teleport(p.x, p.y - s.player.eye, p.z + 1); aim(s.player, p); assert.equal(s.mysteries.rotate(0, s.player), false);
});
await test('fresh notes hide later reveals and tracking changes the real scanner bearing', async () => {
  await g.install(null); g.journal(); const notes = elements.get('discovery-list').innerHTML; assert.ok(!/heart|choir|garden|Resonance engine/i.test(notes)); assert.ok(notes.includes('Survey flywheel'));
  g.mysteries.discover(0); g.journal(); const entry = elements.get('mystery-list').children[0], button = entry.children[0]; button.onclick(); assert.equal(g.mysteries.state.tracked, 0);
  g.setScreen(null); g.scan(); assert.ok(elements.get('scan-detail').textContent.includes('echo vault')); g.journal(); elements.get('mystery-list').children[0].children[0].onclick(); assert.equal(g.mysteries.state.tracked, -1);
});
await test('unlocked mineral focus affects actual scan range, markers and survey controls', () => {
  assert.equal(g.mysteries.focus(3), false); g.mysteries.solve(1); g.openSurvey(); assert.equal(elements.get('survey-focus').hidden, false);
  elements.get('mineral-focus').value = '3'; elements.get('mineral-focus').onchange(); assert.equal(g.mysteries.state.focus, 3);
  const range = g.mysteries.scannerRange(), head = g.player.head, n = g.deposits.nodes.find(n => n.kind === 3); n.x = head.x + range - 1; n.y = head.y; n.z = head.z; g.index.move(n);
  let captured; const original = g.view.scan; g.view.scan = nodes => { captured = nodes; }; g.setScreen(null); g.scanCooldown = 0; g.scan(); g.view.scan = original;
  assert.ok(captured.includes(n)); assert.ok(captured.filter(n => n.kind !== undefined).every(n => n.kind === 3)); assert.ok(g.survey.markers(g).filter(n => n.type === 'ore').every(n => n.kind === 3));
  elements.get('mineral-focus').value = '-1'; elements.get('mineral-focus').onchange(); assert.equal(g.mysteries.scannerRange(), range - 8);
});
await test('real scene beams stop at rock; upgraded preview has the same nine-meter extent', () => {
  g.mysteries.traceArray(); g.view.render(g, 1 / 60, 4); const beam = g.view.arrayBeams[0], path = g.mysteries.beams[0]; assert.ok(beam.m.visible); assert.ok(path.hit); assert.ok(beam.spark.position.distanceTo(new THREE.Vector3(path.end.x, path.end.y, path.end.z)) < 1e-6);
  g.mysteries.solve(0); g.economy.state.deepest = 30; g.player.teleport(0, .1, 6); g.player.pitch = -.6; g.setScreen(null); g.selectCharge('bore'); g.aimBomb(); g.view.render(g, 1 / 60, 4);
  assert.equal(g.aimPreview.length, 9); g.view.boreGuide.updateMatrixWorld(true); const tip = g.view.boreGuide.localToWorld(new THREE.Vector3(0, 0, 6)), p = g.aimPreview;
  assert.ok(tip.distanceTo(new THREE.Vector3(p.end.x + p.direction.x * 9, p.end.y + p.direction.y * 9, p.end.z + p.direction.z * 9)) < 1e-6);
  g.view.ruins.traverse(m => { if (m.geometry) for (const x of m.geometry.attributes.position.array) assert.ok(Number.isFinite(x)); });
});
await test('portable claims retain rewards, rotations and focus; old claims migrate without altering terrain', async () => {
  g.clearInput(); g.mysteries.state.mirrors = [1, 0]; g.mysteries.focus(2); const save = B.Saves.snapshot(g, true), valid = B.Saves.validate(save); assert.deepEqual(valid.state.expedition.mysteries, g.mysteries.state);
  await g.install(valid); assert.equal(g.gadgets.spec('bore').length, 9); assert.equal(g.mysteries.state.focus, 2); assert.deepEqual(g.mysteries.state.mirrors, [1, 0]);
  const legacy = B.Saves.snapshot(g); delete legacy.state.expedition.mysteries; const before = legacy.field.slice(); await g.install(B.Saves.validate(legacy)); assert.deepEqual(g.world.field, before); assert.deepEqual(g.mysteries.state.solved, []); assert.equal(g.gadgets.spec('bore').length, 6);
});
await test('corrupt discoveries, locked filters and invalid tracked targets are rejected', () => {
  const save = B.Saves.snapshot(g);
  for (const mutate of [m => m.known = [0, 0], m => m.known = [3], m => m.solved = [1], m => m.focus = 3, m => m.mirrors[0] = 4, m => m.mirrors = [1], m => m.tracked = 0, m => m.version = 2]) { const bad = structuredClone(save); mutate(bad.state.expedition.mysteries); assert.throws(() => B.Saves.validate(bad)); }
});
harness.close();
console.log(`COMPLETE ${mysteryChecks} mystery checks passed (no browser or input automation)`);
