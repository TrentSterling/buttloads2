import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), { game: g, elements: el, handlers } = h, B = B2;
export let kitChecks = 0;
const test = async (name, fn) => { await fn(); kitChecks++; console.log('PASS field kit: ' + name); };
const key = (code, extra = {}) => ({ code, repeat: false, preventDefault() {}, ...extra });
const down = (code, extra) => handlers.get('keydown')(key(code, extra)), up = code => handlers.get('keyup')(key(code));
// Resume is evaluated as a Game state transition. Never request pointer lock or start a device.
let resumes = 0; g.play = () => { resumes++; g.setScreen(null); };
const fresh = async () => { await g.install(null); g.setScreen(null); g.updateHUD(); };

await test('a fresh claim shows only the cutter and keeps unavailable actions out of the HUD', () => {
  assert.equal(el.get('tool-cutter').hidden, false); assert.equal(el.get('tool-slots').hidden, true); assert.equal(el.get('tool-meter').hidden, true);
  for (const k of ['scoop', 'lance', 'resonance', 'gravity']) { assert.equal(el.get('tool-' + k).hidden, true); assert.equal(g.fieldKit.rows.get(k).hidden, true); }
  assert.equal(el.get('charge-sticky').disabled, true); assert.equal(el.get('charge-bore').disabled, true); assert.equal(el.get('hud-charge-cycle').hidden, true);
  assert.equal(el.get('touch-anchor').hidden, true); assert.equal(el.get('touch-rift').hidden, true); assert.equal(el.get('touch-tool').hidden, true); assert.equal(el.get('touch-use').disabled, true);
  assert.ok(el.get('kit-next').textContent.startsWith('Next stratum at 9 m')); assert.ok(!el.get('kit-next').textContent.includes('heart'));
});
await test('depth and recovery unlocks reveal real selections without exposing magical tools early', () => {
  g.economy.state.deepest = 9; g.updateHUD(); assert.equal(el.get('tool-scoop').hidden, false); assert.equal(el.get('tool-lance').hidden, true); assert.equal(el.get('charge-sticky').disabled, false); assert.equal(el.get('hud-charge-cycle').hidden, false);
  g.economy.state.deepest = 60; g.updateHUD(); assert.equal(el.get('tool-lance').hidden, false); assert.equal(el.get('charge-bore').disabled, false); assert.equal(el.get('tool-resonance').hidden, true); assert.equal(el.get('tool-gravity').hidden, true);
  g.expedition.state.recovered = [0, 1]; g.updateHUD(); assert.equal(el.get('tool-resonance').hidden, false); assert.equal(el.get('touch-anchor').hidden, false); assert.equal(el.get('tool-gravity').hidden, true);
  g.expedition.state.runes = [0, 1, 2]; g.expedition.state.awakened = true; g.updateHUD(); assert.equal(el.get('tool-gravity').hidden, false); assert.equal(el.get('kit-rift').hidden, false);
});
await test('opening I cancels a held throw, fire and movement; releasing keys in the kit spends nothing', async () => {
  await fresh(); g.input.fire = true; down('KeyW'); down('KeyC'); assert.equal(g.input.aim, 'bomb'); const supplies = g.gadgets.state.supplies.bombs, before = g.world.field.slice(), resumed = resumes;
  down('KeyI'); assert.equal(g.screen, 'kit'); assert.equal(g.running, false); assert.equal(g.input.fire, false); assert.equal(g.input.aim, null); assert.equal(g.input.keys.size, 0); assert.equal(el.get('field-tip').hidden, true);
  up('KeyC'); up('KeyW'); assert.equal(g.gadgets.state.supplies.bombs, supplies); assert.equal(g.gadgets.nodes.length, 0); assert.deepEqual(g.world.field, before); assert.equal(resumes, resumed);
  down('KeyI', { repeat: true }); assert.equal(g.screen, 'kit'); down('KeyI', { ctrlKey: true }); assert.equal(g.screen, 'kit');
  down('Escape'); assert.equal(g.running, true); assert.equal(resumes, resumed + 1); assert.equal(g.input.fire, false);
});
await test('kit selection changes real equipment while remaining paused and respects locked tools', async () => {
  await fresh(); el.get('kit-button').onclick(); const resumed = resumes, state = g.expedition.state;
  g.fieldKit.rows.get('gravity').onclick(); assert.equal(state.tool, 'cutter'); assert.equal(g.screen, 'kit');
  g.economy.state.deepest = 25; g.fieldKit.sync(); g.fieldKit.rows.get('lance').onclick(); assert.equal(state.tool, 'lance'); assert.equal(g.running, false); assert.equal(el.get('tool-name').textContent, 'Lance'); assert.equal(g.fieldKit.rows.get('lance').attributes.get('aria-pressed'), 'true'); assert.equal(resumes, resumed);
  el.get('charge-bore').onclick(); assert.equal(g.gadgets.state.chargeMode, 'bore'); assert.equal(el.get('hud-charge-name').textContent, 'Bore'); assert.equal(g.running, false);
  down('Digit2'); assert.equal(state.tool, 'scoop'); down('KeyX'); assert.equal(state.tool, 'lance'); down('KeyN'); assert.equal(g.gadgets.state.chargeMode, 'blast'); assert.equal(g.running, false); assert.equal(resumes, resumed);
  el.get('kit-close').onclick(); assert.equal(g.running, true); assert.equal(g.input.fire, false); assert.equal(resumes, resumed + 1);
});
await test('opening the kit cancels freight placement and consumes no equipment or terrain', async () => {
  await fresh(); g.expedition.state.recovered = [0]; g.economy.state.cash = 180; g.buyFreight(); down('KeyT'); assert.equal(g.input.aim, 'freight'); const before = g.world.field.slice();
  down('KeyI'); up('KeyT'); assert.equal(g.freight.state.dock, null); assert.deepEqual(g.world.field, before); assert.equal(g.freight.state.owned, true);
  down('KeyI'); assert.equal(g.running, true); assert.equal(g.input.aim, null);
});
await test('tips follow useful context and yield to scans, interactions, full cargo and ignition', async () => {
  await fresh(); g.economy.state.mined = 1; g.fieldKit.sync(); assert.equal(g.fieldKit.tip.id, 'scan'); assert.equal(el.get('field-tip').hidden, false);
  g.scan(); g.updateHUD(); assert.ok(g.guide.state.done.includes('scan')); assert.equal(el.get('field-tip').hidden, true);
  g.clock += 7; g.economy.state.deepest = 8; g.player.teleport(0, -8, 11); g.fieldKit.sync(); assert.equal(g.fieldKit.tip.id, 'charge');
  g.input.fire = true; down('KeyY'); assert.ok(g.guide.state.done.includes('charge')); assert.equal(g.fieldKit.tip.id, 'light'); assert.equal(g.input.fire, true); g.input.fire = false; up('KeyY');
  g.input.aim = 'bomb'; g.fieldKit.sync(); assert.equal(g.fieldKit.tip, null); g.input.aim = null;
  g.economy.state.cargo[0] = g.economy.capacity; g.fieldKit.sync(); assert.equal(g.fieldKit.tip, null); g.economy.state.cargo[0] = 0;
  const stone = g.thunder.nodes[0], pos = { x: stone.x, y: stone.y, z: stone.z }; Object.assign(stone, { x: g.player.x, y: g.player.head.y, z: g.player.z, fuse: .5 }); g.fieldKit.sync(); assert.equal(g.fieldKit.tip, null); Object.assign(stone, pos, { fuse: -1 });
  g.player.teleport(0, .1, 17); g.fieldKit.sync(); assert.equal(g.fieldKit.tip, null); // Workshop interaction has priority.
});
await test('successful deployments retire tips, while a refused bore throw never counts as learned', async () => {
  await fresh(); g.deploy('lamp'); g.deploy('bomb'); g.updateHUD(); assert.ok(g.guide.state.done.includes('light')); assert.ok(g.guide.state.done.includes('charge'));
  g.economy.state.deepest = 25; g.selectCharge('sticky'); g.deploy('bomb'); g.updateHUD(); assert.ok(g.guide.state.done.includes('remote'));
  g.selectCharge('bore'); assert.equal(g.gadgets.state.supplies.bombs, 1); g.deploy('bomb'); g.updateHUD(); assert.ok(!g.guide.state.done.includes('bore'));
  g.selectTool('lance'); assert.ok(g.guide.state.done.includes('lance')); assert.equal(el.get('touch-detonate').hidden, false); assert.equal(el.get('remote-trigger').hidden, false);
});
await test('tip dismissal and the opt-out setting survive portable saves and older claims migrate', async () => {
  await fresh(); g.economy.state.deepest = 4; g.player.teleport(0, 0, 11.5); g.fieldKit.sync(); assert.equal(g.fieldKit.tip.id, 'charge'); el.get('tip-dismiss').onclick();
  el.get('tips-setting').oninput({ target: { type: 'checkbox', checked: false } }); assert.equal(g.settings.tips, false); assert.equal(el.get('field-tip').hidden, true);
  const snapshot = B.Saves.snapshot(g, true), data = B.Saves.validate(JSON.parse(JSON.stringify(snapshot))); await g.install(data); assert.equal(g.settings.tips, false); assert.deepEqual(g.guide.state.done, ['charge']); assert.equal(el.get('tips-setting').checked, false);
  const old = B.Saves.snapshot(g); delete old.state.expedition.guide; delete old.settings.tips; const field = old.field.slice(); await g.install(B.Saves.validate(old)); assert.equal(g.settings.tips, true); assert.deepEqual(g.guide.state.done, []); assert.deepEqual(g.world.field, field);
});
await test('malformed tip history is rejected before installation and does not alter progression', () => {
  const snapshot = B.Saves.snapshot(g), before = structuredClone(g.economy.state);
  for (const guide of [{ version: 9, done: [] }, { version: 1, done: ['unknown'] }, { version: 1, done: ['scan', 'scan'] }, { version: 1, done: 'scan' }]) { const copy = structuredClone(snapshot); copy.state.expedition.guide = guide; assert.throws(() => B.Saves.validate(copy)); }
  assert.deepEqual(g.economy.state, before);
});
await test('touch copy names visible actions and unavailable anchor controls remain hidden', async () => {
  await fresh(); const original = globalThis.matchMedia; globalThis.matchMedia = q => ({ matches: q === '(pointer:coarse)' });
  try { g.economy.state.mined = 1; g.fieldKit.sync(); assert.ok(el.get('tip-text').textContent.includes('Tap Scan')); assert.equal(el.get('tip-key').textContent, 'FIELD TIP'); assert.equal(el.get('touch-anchor').hidden, true); el.get('kit-button').onclick(); assert.equal(g.screen, 'kit'); assert.equal(g.running, false); }
  finally { globalThis.matchMedia = original; }
});
h.close(); console.log(`COMPLETE ${kitChecks} field kit checks passed (inert DOM; no browser or input automation)`);
