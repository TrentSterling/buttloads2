// Coordinate-aware encounter pilot through actual movement, excavation and input methods.
// No fixture terrain, free equipment, direct teleports, browser or OS input.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), g = h.game, B = B2, dt = 1 / 60;
const report = { outcome: 'running', phases: [], drillDamage: false, axeUsed: false, huskRecovered: false, rescues: 0 };
let phase = 'excavate encounter', oldPhase = '', lastStatus = -1;
const steer = (target, cut = true) => {
  const p = g.player, h = p.head, dx = target.x - p.x, dy = target.y - h.y, dz = target.z - p.z;
  p.yaw = Math.atan2(-dx, -dz); p.pitch = B.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -1.54, 1.54);
  g.input.keys.clear(); if (Math.hypot(dx, dz) > .35) g.input.keys.add('KeyW'); if (dy > .6) g.input.keys.add('Space'); g.input.fire = cut;
};
try {
  g.setScreen(null);
  for (let frame = 0; frame < 60 * 180; frame++) {
    if (!g.running) g.setScreen(null);
    const n = g.combat.enemies[0], dist = Math.hypot(n.x - g.player.x, n.y - g.player.head.y, n.z - g.player.z);
    if (phase === 'excavate encounter') {
      steer(n);
      if (n.hp < 60) report.drillDamage = true;
      if (n.hp <= 45) { g.selectTool('axe'); report.axeUsed = true; phase = 'axe duel'; }
    } else if (phase === 'axe duel') {
      steer(n);
      if (dist > 3 && g.player.head.y > n.y + 2) steer({ x: g.player.x, y: g.player.y - 3, z: g.player.z });
      if (n.hp === 0) { phase = 'recover husk'; g.selectTool('cutter'); }
    } else if (phase === 'recover husk') {
      const drop = g.combat.drops.find(d => d.id === 0); assert.ok(drop);
      steer(drop); if (g.interaction()?.kind === 'combat-drop') { g.input.fire = false; const supply = g.gadgets.state.supplies.bombs; g.use(); assert.equal(g.gadgets.state.supplies.bombs, supply + 2); report.huskRecovered = true; g.recall(); phase = 'surface recovery'; }
    } else if (phase === 'surface recovery') {
      g.input.keys.clear(); g.input.fire = false;
      if (g.combat.state.health === 100) { report.outcome = 'complete'; break; }
    }
    g.update(dt);
    if (phase !== oldPhase) { oldPhase = phase; const entry = { phase, seconds: +g.clock.toFixed(1), health: +g.combat.state.health.toFixed(1), enemy: +n.hp.toFixed(1) }; report.phases.push(entry); console.log(JSON.stringify(entry)); }
    const status = Math.floor(g.clock / 20); if (status !== lastStatus) { lastStatus = status; console.log(`t=${g.clock.toFixed(0)} ${phase} player=${g.player.x.toFixed(1)},${g.player.y.toFixed(1)},${g.player.z.toFixed(1)} moth=${n.x.toFixed(1)},${n.y.toFixed(1)},${n.z.toFixed(1)} state=${n.phase}`); }
    if (g.combat.state.rescues) throw new Error('Encounter pilot was defeated before finishing its duel.');
    if (frame % 600 === 0) await new Promise(r => setTimeout(r, 0));
  }
  assert.equal(report.outcome, 'complete'); assert.ok(report.drillDamage && report.axeUsed && report.huskRecovered); assert.equal(g.economy.state.gear.drill, 0);
  const save = B.Saves.snapshot(g, true), field = g.world.field.slice(); await g.install(B.Saves.validate(save)); assert.equal(g.combat.enemies[0].hp, 0); assert.equal(g.combat.enemies[0].reward, 0); assert.deepEqual(g.world.field, field); assert.equal(g.gadgets.state.supplies.bombs, 5);
  for (const id of ['mara', 'otis']) { assert.equal(g.town.talk(id).chapter, 'hello'); assert.equal(g.town.talk(id).chapter, 'cinder'); } B.Town.validate(g.town.state);
  console.log('COMPLETE fresh encounter: excavated from spawn, damaged with starter drill, won axe duel, recovered two charges, rested at surface and reloaded persistent cleared encounter.');
} catch (error) { report.outcome = 'failed'; report.error = error.message; console.error(error); process.exitCode = 1; }
finally { report.seconds = +g.clock.toFixed(1); report.rescues = g.combat.state.rescues; fs.writeFileSync(new URL('./out/journey-combat.json', import.meta.url), JSON.stringify(report, null, 2)); h.close(); }
