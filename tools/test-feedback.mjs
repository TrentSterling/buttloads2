import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const harness = await nodeGame(), { game: g } = harness, B = B2;
export let feedbackChecks = 0;
const test = async (name, fn) => { await fn(); feedbackChecks++; console.log('PASS feedback: ' + name); };
const air = { density: () => 1, normal: () => [0, 1, 0], clearLine: () => true };
const idle = { cutter: { edited: false }, player: { head: { x: 0, y: 2, z: 0 } }, expedition: { pulseSerial: 0 }, gadgets: { blasts: [] } };
const step = (fx, seconds, hz = 120) => { for (let i = 0; i < seconds * hz; i++) fx.update(1 / hz, idle); };

await test('fragments stay finite, obey terrain contact and expire at different update rates', () => {
  const floor = { density: (x, y) => y, normal: () => [0, 1, 0] }, results = [];
  for (const hz of [30, 60, 120]) {
    const fx = new B.Feedback(floor); fx.spawn({ x: 0, y: .1, z: 0 }, 'chip', [1, .5, .2], { vx: 1, vy: -4, vz: 0 }, 1, .05);
    step(fx, .1, hz); assert.equal(fx.particles.length, 1); const p = fx.particles[0]; assert.ok(p.y >= 0); assert.ok(p.bounces > 0); assert.ok(Object.values(p).filter(v => typeof v === 'number').every(Number.isFinite)); results.push(p.y);
    step(fx, 2, hz); assert.equal(fx.particles.length, 0);
    fx.spawn({ x: 0, y: .02, z: 0 }, 'dust', [1, 1, 1], { vx: 0, vy: -4, vz: 0 }, 1, .1); step(fx, .1, hz); assert.equal(fx.particles.length, 0);
    fx.spawn({ x: 0, y: -1, z: 0 }, 'chip', [1, 1, 1], { vx: 0, vy: 0, vz: 0 }, 1, .1); assert.equal(fx.particles.length, 0);
  }
  assert.ok(Math.max(...results) - Math.min(...results) < 1e-8);
});
await test('one blast emits once, overload is bounded, and effects do not write gameplay state', () => {
  const fx = new B.Feedback(g.world), field = g.world.field.slice(), state = structuredClone(g.economy.state), player = [g.player.x, g.player.y, g.player.z, g.player.yaw, g.player.pitch];
  const event = { ...idle, gadgets: { blasts: [{ x: 0, y: 2, z: 0, radius: 3, serial: 1 }] } };
  fx.update(1 / 120, event); assert.equal(fx.flashes.length, 1); const serial = fx.serial;
  fx.update(1 / 120, event); assert.equal(fx.serial, serial);
  for (let i = 0; i < 100; i++) fx.burst({ x: 0, y: 2, z: 0 }, 3);
  assert.ok(fx.particles.length <= 512); assert.equal(fx.flashes.length, 12); step(fx, 3); assert.equal(fx.particles.length, 0); assert.equal(fx.flashes.length, 0);
  assert.deepEqual(g.world.field, field); assert.deepEqual(g.economy.state, state); assert.deepEqual([g.player.x, g.player.y, g.player.z, g.player.yaw, g.player.pitch], player);
});
await test('cutter feedback requires edited terrain; geological debris and pickups retain their colors', () => {
  const fx = new B.Feedback(air), game = { ...idle, cutter: { edited: false, contact: { x: 0, y: 0, z: 0 } } };
  fx.update(1 / 30, game); assert.equal(fx.particles.length, 0); game.cutter.edited = true; fx.update(1 / 30, game); assert.ok(fx.particles.length >= 2);
  const color = B.geology(0).color; assert.ok(Math.abs(fx.particles[0].color[0] / fx.particles[0].color[1] - color[0] / color[1]) < 1e-6);
  const before = fx.particles.length; fx.collect({ x: 0, y: 1, z: 0, kind: 0 }); assert.equal(fx.particles.length - before, 5); assert.ok(fx.particles.slice(before).every(p => p.type === 'mote'));
});
await test('rendering effects never advances them and builds finite faded instances with unobstructed light', () => {
  const fx = g.feedback; fx.burst({ x: 0, y: 2, z: 0 }, 3); fx.collect({ x: 0, y: 2, z: 0, kind: 2 }); fx.update(1 / 30, idle);
  const before = JSON.stringify([fx.particles, fx.flashes]);
  for (let i = 0; i < 10; i++) g.view.renderFeedback(g);
  assert.equal(JSON.stringify([fx.particles, fx.flashes]), before);
  for (const mesh of [g.view.chipMesh, g.view.dustMesh, g.view.moteMesh]) {
    assert.ok(mesh.count > 0); assert.ok(mesh.instanceMatrix.array.slice(0, mesh.count * 16).every(Number.isFinite)); assert.ok(mesh.instanceColor.array.slice(0, mesh.count * 3).every(Number.isFinite));
    assert.ok(mesh.geometry.attributes.instanceFade.array.slice(0, mesh.count).every(v => v >= 0 && v <= 1));
    const lib = THREE.ShaderLib[mesh === g.view.chipMesh ? 'standard' : 'basic'], shader = { vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader }; mesh.material.onBeforeCompile(shader);
    assert.ok(shader.vertexShader.includes('vFeedbackFade=instanceFade;')); assert.ok(shader.fragmentShader.includes('diffuseColor.a*=vFeedbackFade;'));
  }
  const texture = g.view.dustMesh.material.map.image; assert.equal(texture.width, 64); assert.equal(texture.data[3], 0); assert.ok(texture.data[(31 + 31 * 64) * 4 + 3] > 200);
  assert.ok(g.view.blastLights.some(l => l.intensity > 0));
  const clear = g.world.clearLine; g.world.clearLine = () => false; try { g.view.renderFeedback(g); assert.ok(g.view.blastLights.every(l => l.intensity === 0)); } finally { g.world.clearLine = clear; }
});
await test('tool motion toggle freezes tool animation without altering player look or camera orientation', () => {
  g.screen = null; g.running = true; g.input.fire = true; g.settings.motion = false;
  const orientation = [g.player.yaw, g.player.pitch], transforms = () => [g.view.tool.position.toArray(), g.view.rotor.rotation.toArray(), g.view.needle.rotation.toArray(), g.view.resonatorHead.rotation.toArray(), g.view.magicTool.rotation.toArray(), g.view.magicCore.scale.toArray(), g.view.camera.quaternion.toArray()];
  g.view.render(g, 1 / 60, 4); const a = transforms(); g.view.render(g, 1 / 60, 8); assert.deepEqual(transforms(), a); assert.deepEqual([g.player.yaw, g.player.pitch], orientation);
  g.settings.motion = true; g.view.render(g, 1 / 60, 12); assert.notDeepEqual(transforms(), a); assert.deepEqual([g.player.yaw, g.player.pitch], orientation); g.input.fire = false;
});
await test('underground palettes are distinct and continuous at each layer boundary', () => {
  const colors = B.STRATA.map(s => g.view.atmosphere(s.depth).fog.getHex()); assert.equal(new Set(colors).size, 5);
  for (const layer of B.STRATA.slice(1)) { const before = g.view.atmosphere(layer.depth - .00001).fog.clone(), after = g.view.atmosphere(layer.depth).fog; assert.ok(Math.abs(before.r - after.r) + Math.abs(before.g - after.g) + Math.abs(before.b - after.b) < .00001); }
});
await test('procedural audio is finite, bounded and fades at common device rates', () => {
  const kinds = ['blast', 'resonance', 'rift', 'step', 'impact', 'pickup', 'drip', 'tool', 'air', 'motor'];
  for (const rate of [44100, 48000]) for (const kind of kinds) {
    const samples = B.soundSamples(kind, rate), mean = samples.reduce((s, v) => s + v, 0) / samples.length, rms = Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / samples.length);
    assert.ok(samples.every(v => Number.isFinite(v) && Math.abs(v) <= 1), kind); assert.ok(rms > .003 && rms < .5, `${kind}: RMS ${rms}`); assert.ok(Math.abs(mean) < .015, `${kind}: DC ${mean}`); assert.ok(samples[0] === 0); assert.ok(Math.abs(samples.at(-1)) < .001);
  }
  assert.notDeepEqual(B.soundSamples('step', 44100, { layer: 0 }), B.soundSamples('step', 44100, { layer: 4 }));
  assert.notDeepEqual(B.soundSamples('resonance'), B.soundSamples('rift'));
});
await test('sound attenuation, rock occlusion and left-right placement follow the listener', () => {
  const p = { head: { x: 0, y: 0, z: 0 }, yaw: 0 }, near = B.soundSpace({ x: 2, y: 0, z: 0 }, p, air), far = B.soundSpace({ x: 40, y: 0, z: 0 }, p, air);
  assert.ok(near.gain > far.gain * 10); assert.ok(near.pan > 0); assert.ok(B.soundSpace({ x: -2, y: 0, z: 0 }, p, air).pan < 0);
  p.yaw = Math.PI; assert.ok(B.soundSpace({ x: 2, y: 0, z: 0 }, p, air).pan < 0);
  const blocked = B.soundSpace({ x: 2, y: 0, z: 0 }, p, { clearLine: () => false }); assert.ok(blocked.gain < near.gain * .25); assert.ok(blocked.cutoff < near.cutoff / 10);
  assert.equal(B.soundSpace({ x: 60, y: 0, z: 0 }, p, air).gain, 0);
});

// Device-free WebAudio adapter: validates routing, lifecycle and parameter changes, not audibility.
class Param { constructor(value = 0) { this.value = value; } setTargetAtTime(value) { assert.ok(Number.isFinite(value)); this.value = value; } }
class AudioNode {
  constructor(c, kind) { this.kind = kind; this.context = c; this.connections = []; for (const name of ['gain', 'frequency', 'threshold', 'knee', 'ratio', 'attack', 'release', 'playbackRate', 'pan']) this[name] = new Param(); c.nodes.push(this); }
  connect(target) { assert.ok(target); this.connections.push(target); return target; }
  disconnect() { this.disconnected = true; this.connections = []; }
  start() { this.started = true; }
  stop(time) { this.stopTime = time; }
}
class AudioContext {
  constructor() { this.currentTime = 0; this.sampleRate = 48000; this.nodes = []; this.destination = {}; AudioContext.instances.push(this); }
  static instances = [];
  createGain() { return new AudioNode(this, 'gain'); }
  createDynamicsCompressor() { return new AudioNode(this, 'limiter'); }
  createOscillator() { return new AudioNode(this, 'oscillator'); }
  createBufferSource() { return new AudioNode(this, 'source'); }
  createBiquadFilter() { return new AudioNode(this, 'filter'); }
  createStereoPanner() { return new AudioNode(this, 'pan'); }
  createBuffer(channels, length, rate) { const data = new Float32Array(length); return { duration: length / rate, getChannelData: () => data }; }
  resume() { return Promise.resolve(); }
  close() { this.closed = true; return Promise.resolve(); }
  advance(dt) { this.currentTime += dt; for (const n of this.nodes) if (n.stopTime <= this.currentTime && !n.ended) { n.ended = true; n.onended?.(); } }
}
await test('audio starts lazily, caps voices, disconnects completed events and mutes existing loops', () => {
  window.AudioContext = AudioContext; const settings = { sound: false }, audio = new B.AudioEngine(settings); audio.start(); assert.equal(AudioContext.instances.length, 0);
  settings.sound = true; audio.start(); assert.equal(AudioContext.instances.length, 1); audio.start(); assert.equal(AudioContext.instances.length, 1); assert.equal(audio.master.connections[0].kind, 'limiter');
  for (let i = 0; i < 70; i++) audio.note(300 + i); assert.equal(audio.voices.size, 24); assert.ok(audio.cache.size <= 48);
  const c = audio.context; c.advance(2); assert.equal(audio.voices.size, 0); assert.ok(c.nodes.filter(n => n.kind === 'source' && !n.loop).every(n => n.disconnected));
  audio.drill(true, true, 30); assert.ok(audio.tool.gain.gain.value > 0); settings.sound = false; audio.start(); assert.equal(audio.master.gain.value, 0); audio.note(); assert.equal(audio.voices.size, 0); audio.silence();
  assert.ok([audio.tool, audio.air, audio.motor, audio.hum].every(loop => loop.gain.gain.value === 0));
});
await test('actual Game events produce cutter, pickup, blast and ambient audio through the inert device', () => {
  g.settings.sound = true; g.audio.start(); const c = g.audio.context; assert.ok(c); g.player.teleport(6, .08, 6); g.player.pitch = -1.2; g.input.fire = true;
  g.update(1 / 60); assert.ok(g.cutter.edited); assert.ok(g.audio.tool.gain.gain.value > .1); assert.ok(g.audio.air.gain.gain.value > 0); assert.ok(g.feedback.particles.length > 0);
  c.advance(.1); g.audio.pickup(2); const voices = g.audio.voices.size; g.audio.pickup(2); assert.equal(g.audio.voices.size, voices);
  g.gadgets.blasts.push({ x: 6, y: 1, z: 6, radius: 3, serial: 900 }); c.advance(.1); g.update(1 / 60); assert.ok(g.audio.voices.size > voices); assert.equal(g.lastSoundBlast, 900);
  const before = g.audio.voices.size; g.update(1 / 60); assert.equal(g.audio.voices.size, before); g.clearInput(); assert.ok([g.audio.tool, g.audio.air, g.audio.motor, g.audio.hum].every(loop => loop.gain.gain.value === 0));
});
await test('unavailable audio devices degrade without stopping the game', () => {
  window.AudioContext = class { constructor() { throw new Error('No device'); } }; const audio = new B.AudioEngine({ sound: true }); assert.doesNotThrow(() => { audio.start(); audio.note(); audio.drill(true, true, 0); audio.update(g, .1); audio.silence(); }); assert.equal(audio.context, null);
  window.AudioContext = class extends AudioContext { createDynamicsCompressor() { throw new Error('Device disconnected'); } }; audio.start(); assert.equal(audio.context, null); assert.ok(AudioContext.instances.at(-1).closed); delete window.AudioContext;
});
harness.close();
console.log(`COMPLETE ${feedbackChecks} feedback checks passed (inert renderer and audio; no browser or input automation)`);
