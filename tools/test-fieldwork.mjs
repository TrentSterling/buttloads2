import assert from 'node:assert/strict';
import fs from 'node:fs';
import { nodeGame } from './node-game.mjs';
const harness = await nodeGame(), { game: g, elements, handlers } = harness, B = B2;
export let fieldChecks = 0;
const test = async (name, fn) => { await fn(); console.log('PASS fieldwork: ' + name); fieldChecks++; };
const run = (seconds, fn, hz = 60) => { for (let i = 0; i < Math.round(seconds * hz); i++) fn(1 / hz); };
const aim = (p, q) => { const dx = q.x - p.x, dz = q.z - p.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(q.y - p.head.y, Math.hypot(dx, dz)); };
const key = code => ({ code, repeat: false, preventDefault() {} });

await test('holding C previews without consuming a charge or editing terrain; release throws once', () => {
  g.setScreen(null); g.player.teleport(2, .1, 5); g.player.pitch = -.6;
  const before = { revision: g.world.revision, supply: g.expedition.state.supplies.bombs, id: g.gadgets.nextID, nodes: g.gadgets.nodes.length, cells: g.gadgets.physics.index.cells.size };
  handlers.get('keydown')(key('KeyC')); run(.5, dt => g.update(dt));
  assert.ok(g.aimPreview.end); assert.ok(g.aimPreview.points.length > 10); assert.equal(g.world.revision, before.revision); assert.equal(g.gadgets.nextID, before.id); assert.equal(g.gadgets.physics.index.cells.size, before.cells); assert.equal(g.expedition.state.supplies.bombs, before.supply);
  const prediction = g.gadgets.preview(g.player), start = g.player.position;
  handlers.get('keyup')(key('KeyC')); handlers.get('keyup')(key('KeyC')); assert.equal(g.gadgets.nodes.length, before.nodes + 1); assert.equal(g.expedition.state.supplies.bombs, before.supply - 1);
  // The same fixed-step solver predicts the actual detonation position for static terrain.
  run(2.6, dt => g.gadgets.update(dt)); const blast = g.gadgets.blasts.at(-1);
  assert.ok(Math.hypot(blast.x - prediction.end.x, blast.y - prediction.end.y, blast.z - prediction.end.z) < 1e-6);
  assert.deepEqual(g.player.position, start);
});
await test('pause, blur and cancelled touch aim never throw a held charge', () => {
  const count = g.expedition.state.supplies.bombs;
  g.aimBomb(); g.setScreen('pause'); handlers.get('keyup')(key('KeyC')); assert.equal(g.expedition.state.supplies.bombs, count);
  g.setScreen(null); g.aimBomb(); handlers.get('blur')(); handlers.get('keyup')(key('KeyC')); assert.equal(g.expedition.state.supplies.bombs, count);
  const button = elements.get('touch-bomb');
  for (const event of ['pointercancel', 'lostpointercapture']) {
    g.setScreen(null); button.listeners.get('pointerdown')({ pointerId: 1, preventDefault() {} }); assert.equal(g.input.aim, 'bomb');
    button.listeners.get(event)(); button.listeners.get('pointerup')(); assert.equal(g.expedition.state.supplies.bombs, count);
  }
});
await test('trajectory contacts walls and shelves using the live collision solver', () => {
  const w = new B.World(2), state = B.freshState().expedition, equipment = new B.Gadgets(w, state), player = new B.Player(w);
  for (let y = 0; y >= -8; y -= .8) w.carve({ x: 0, y, z: 0 }, 1.2);
  player.teleport(0, -5, 0); player.pitch = 0;
  const path = equipment.preview(player); assert.ok(path.end); assert.ok(path.points.every(p => w.density(p.x, p.y, p.z) >= 0)); assert.ok(Math.abs(path.end.z) < 1.3);
  equipment.deploy('bomb', player); run(2.6, dt => equipment.update(dt)); const hit = equipment.blasts[0]; assert.ok(Math.hypot(hit.x - path.end.x, hit.y - path.end.y, hit.z - path.end.z) < 1e-6);
});
await test('retrieving an aimed light refunds it exactly once and removes its body and rendered light', () => {
  g.setScreen(null); g.player.teleport(6, .1, 6); g.player.pitch = -1; const supply = g.expedition.state.supplies.lights; g.deploy('lamp'); run(2, dt => g.gadgets.update(dt));
  const lamp = g.gadgets.nodes.find(n => n.type === 'lamp'); assert.ok(lamp); g.player.teleport(lamp.x, .1, lamp.z + 1.5); aim(g.player, lamp);
  g.view.render(g, 1 / 60, 2); assert.ok(g.view.deviceModels.has(lamp.id)); assert.equal(g.interaction().kind, 'lamp'); g.use(); assert.equal(g.expedition.state.supplies.lights, supply);
  assert.equal(g.gadgets.retrieve(lamp.id, g.player.head), false); g.view.render(g, 1 / 60, 3); assert.ok(!g.view.deviceModels.has(lamp.id)); assert.equal(g.gadgets.physics.index.query(lamp.x, lamp.y, lamp.z, .1).length, 0);
  B.Saves.validate(B.Saves.snapshot(g));
});
await test('lamps cannot be retrieved through rock and bombs cannot be recovered as lights', () => {
  const w = new B.World(3), state = B.freshState().expedition, devices = new B.Gadgets(w, state), player = new B.Player(w);
  w.carve({ x: 0, y: -4, z: 0 }, 1.2); player.teleport(0, -5.5, 0); player.pitch = -.5; assert.ok(devices.deploy('lamp', player));
  const lamp = devices.nodes[0]; assert.equal(devices.retrieve(lamp.id, { x: 0, y: -4, z: 2.5 }), false);
  player.teleport(0, .1, 4); assert.ok(devices.deploy('bomb', player)); assert.equal(devices.retrieve(devices.nodes[1].id, player.head), false);
});
await test('blast impulses are blocked by unexcavated rock', () => {
  const w = new B.World(4), state = B.freshState().expedition, devices = new B.Gadgets(w, state), player = new B.Player(w);
  // A one-meter-thick wall remains beyond the 2.8 m excavation radius.
  w.carve({ x: 0, y: -7, z: 0 }, 1); w.carve({ x: 4.7, y: -7, z: 0 }, .8); player.teleport(0, -8.5, .2); player.pitch = -.8;
  const ore = { id: 0, kind: 0, radius: .16, x: 4.7, y: -7, z: 0, collected: false }, physics = new B.OreSystem(w, [ore]); assert.ok(devices.deploy('bomb', player));
  const bomb = devices.nodes[0]; bomb.x = bomb.z = 0; bomb.y = -7; bomb.vx = bomb.vy = bomb.vz = 0; bomb.fuse = .01;
  devices.update(1 / 60, physics); assert.equal(ore.vx, 0); assert.equal(ore.vy, 0); assert.equal(ore.vz, 0);
});
await test('the survey hides untouched caves and discovers passages through movement or excavation', () => {
  const w = new B.World(5), state = B.freshState(5), deposits = B.generateDeposits(5), exp = new B.Expedition(w, new B.Economy(state)), survey = new B.Survey(w, state, deposits, exp), player = new B.Player(w);
  assert.ok(survey.slice(12).every(v => v === 0)); assert.equal(survey.data.sites.length, 0);
  w.carve({ x: 0, y: -6, z: 0 }, 1.8); assert.ok(survey.slice(6).some(v => v === 2)); assert.ok(survey.slice(33).every(v => v === 0));
  player.teleport(-4, -13, 1); survey.update(1, player); assert.ok(survey.slice(12).some(v => v === 2)); assert.ok(survey.knownSites.has('s0')); assert.ok(!survey.knownSites.has('s1'));
});
await test('old claims reconstruct edited passages without revealing virgin chambers', () => {
  const w = new B.World(6); w.carve({ x: 9, y: -16, z: 6 }, 2);
  const state = B.freshState(6), deposits = B.generateDeposits(6), exp = new B.Expedition(w, new B.Economy(state)), survey = new B.Survey(w, state, deposits, exp);
  assert.ok(survey.slice(16).some(v => v === 2)); assert.ok(survey.slice(33).every(v => v === 0));
});
await test('scanning records moving deposits and depth-gated signals without duplicates', () => {
  const before = g.survey.data.ore.length; g.player.teleport(0, .1, 5); g.scanCooldown = 0; g.scan(); assert.ok(g.survey.data.ore.length > before); const count = g.survey.data.ore.length;
  g.scanCooldown = 0; g.scan(); assert.equal(g.survey.data.ore.length, count);
  assert.ok(!g.survey.sites().some(s => s.type === 'vault')); g.economy.state.deepest = 59; g.survey.scan(B.VAULTS[0], 5, []); assert.ok(g.survey.knownSites.has('v0'));
});
await test('map depth controls render the real plan/profile, markers and geometry without invalid coordinates', () => {
  g.openSurvey(); assert.equal(g.screen, 'survey'); assert.match(elements.get('survey-plan').innerHTML, /<svg/); assert.match(elements.get('survey-profile').innerHTML, /<svg/);
  elements.get('survey-depth').value = 6; elements.get('survey-depth').oninput(); assert.equal(elements.get('survey-level').textContent, '6 m');
  const chart = g.survey.render(6, g); assert.ok(!/NaN|Infinity|undefined/.test(chart.map + chart.profile)); assert.match(chart.map, /Surveyed tunnels at 6 meters/);
  fs.writeFileSync(new URL('./out/survey-plan.svg', import.meta.url), chart.map); fs.writeFileSync(new URL('./out/survey-profile.svg', import.meta.url), chart.profile);
});
await test('survey data survives saves; duplicates, unknown signals and huge maps are rejected', () => {
  const save = B.Saves.snapshot(g), valid = B.Saves.validate(save); assert.deepEqual(valid.state.expedition.survey, g.survey.data);
  for (const mutate of [s => s.cells.push(-1), s => s.cells.push(g.survey.count), s => s.cells.push(s.cells[0]), s => s.ore.push(g.deposits.nodes.length), s => s.sites.push('unknown'), s => s.cells = null]) { const copy = structuredClone(save); mutate(copy.state.expedition.survey); assert.throws(() => B.Saves.validate(copy)); }
});
await test('actual preview geometry follows the prediction and disappears when aiming stops', () => {
  g.setScreen(null); g.player.teleport(4, .1, 3); g.player.pitch = -.6; g.aimBomb(); g.view.render(g, 1 / 60, 4); assert.ok(g.view.throwGuide.visible);
  const end = g.aimPreview.end; assert.equal(g.view.throwRadius.position.y, end.y); assert.equal(g.view.throwArc.geometry.drawRange.count, g.aimPreview.points.length);
  g.clearInput(); g.view.render(g, 1 / 60, 5); assert.ok(!g.view.throwGuide.visible);
});
harness.close();
console.log(`COMPLETE ${fieldChecks} fieldwork checks passed (no browser or input automation)`);
