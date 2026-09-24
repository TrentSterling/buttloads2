/* Original procedural sounds. Sample generation is shared with offline verification. */
'use strict';
(function (B) {
  const TAU = Math.PI * 2;
  function soundSamples(kind, rate = 44100, options = {}) {
    const duration = options.duration || ({ blast: 1.05, resonance: .9, rift: 1.25, step: .18, impact: .24, pickup: .42, drip: .55, tool: 1, air: 2, motor: 1 }[kind] || .2);
    const data = new Float32Array(Math.ceil(rate * duration)), rng = B.random(options.seed ?? 7103), rock = B.clamp(options.layer || 0, 0, 4), frequency = options.frequency || 540;
    let brown = 0, previous = 0, phase = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / rate, u = t / duration, noise = rng() * 2 - 1; brown = brown * .965 + noise * .035;
      const high = noise - previous; previous = noise; let sample = 0;
      if (kind === 'blast') {
        phase += TAU * (34 + 80 * Math.exp(-t * 16)) / rate;
        sample = Math.sin(phase) * Math.exp(-t * 8) * .68 + brown * Math.exp(-t * 3.5) * 1.7 + high * Math.exp(-t * 55) * .32;
        if (t > .13) sample += brown * Math.exp(-(t - .13) * 6) * .45;
      } else if (kind === 'resonance' || kind === 'rift') {
        const f = kind === 'rift' ? 92 : 185; phase += TAU * (f + 110 * Math.exp(-t * 7)) / rate;
        sample = (Math.sin(phase) * .4 + Math.sin(phase * 1.5) * .17 + Math.sin(phase * 2.012) * .13) * Math.exp(-t * 4) + brown * Math.exp(-t * 3) * .45;
      } else if (kind === 'step' || kind === 'impact') {
        const f = kind === 'step' ? 78 + rock * 32 : 135 + rock * 65;
        sample = (brown * (2.5 - rock * .3) + high * (.1 + rock * .04)) * Math.exp(-t * (24 + rock * 4)) + Math.sin(t * TAU * f) * .25 * Math.exp(-t * 42);
      } else if (kind === 'pickup' || kind === 'note') {
        sample = (Math.sin(t * TAU * frequency) * .46 + Math.sin(t * TAU * frequency * 2.003) * .17 * Math.exp(-t * 12) + Math.sin(t * TAU * frequency * 3.99) * .06 * Math.exp(-t * 25)) * Math.exp(-t * 8);
      } else if (kind === 'drip') {
        phase += TAU * (950 - Math.min(600, t * 2000)) / rate;
        sample = Math.sin(phase) * Math.exp(-t * 13) * .32 + brown * Math.exp(-t * 20) * .25;
      } else if (kind === 'tool') {
        sample = noise * .15 * (.65 + .35 * Math.sin(t * TAU * 47)) + Math.sin(t * TAU * 120) * .15 + Math.sin(t * TAU * 240) * .06 + brown * .9;
      } else if (kind === 'motor') sample = Math.sin(t * TAU * 60) * .4 + Math.sin(t * TAU * 120) * .12 + brown * .45;
      else if (kind === 'air') sample = brown * 2;
      const fade = Math.min(1, t / .003, (duration - t) / .018);
      data[i] = Math.tanh(sample) * Math.max(0, fade);
    }
    return data;
  }
  function soundSpace(point, player, world) {
    if (!point || !player) return { gain: 1, pan: 0, cutoff: 16000 };
    const h = player.head, dx = point.x - h.x, dy = point.y - h.y, dz = point.z - h.z, distance = Math.hypot(dx, dy, dz);
    const clear = !world || world.clearLine(h, point, .25), side = dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw);
    return { gain: (distance >= 60 ? 0 : 1 / (1 + (distance / 9) ** 2)) * (clear ? 1 : .22), pan: B.clamp(side / Math.max(1, Math.hypot(dx, dz)), -.9, .9), cutoff: clear ? 16000 : 650 };
  }
  class AudioEngine {
    constructor(settings) { this.settings = settings; this.context = null; this.cache = new Map(); this.voices = new Set(); this.steps = 0; this.wasGrounded = false; this.nextDrip = 0; this.lastImpact = -1; this.lastPickup = -1; }
    start() {
      if (!this.settings.sound) { this.mute(); return; }
      if (!this.context) {
        let c;
        try {
          c = new (window.AudioContext || window.webkitAudioContext)(); this.context = c;
          this.master = c.createGain(); this.master.gain.value = .7;
          const limiter = c.createDynamicsCompressor(); limiter.threshold.value = -18; limiter.knee.value = 15; limiter.ratio.value = 5; limiter.attack.value = .004; limiter.release.value = .16;
          this.master.connect(limiter).connect(c.destination);
          this.tool = this.loop('tool', 'lowpass', 1500); this.air = this.loop('air', 'lowpass', 900); this.motor = this.loop('motor', 'lowpass', 650);
          const hum = c.createOscillator(), gain = c.createGain(); hum.type = 'sine'; hum.frequency.value = 68; gain.gain.value = 0; hum.connect(gain).connect(this.master); hum.start(); this.hum = { source: hum, gain };
        } catch { c?.close?.(); this.context = null; this.cache.clear(); return; }
      }
      this.master.gain.setTargetAtTime(.7, this.context.currentTime, .02); this.context.resume().catch(() => {});
    }
    mute() { if (this.context) this.master.gain.setTargetAtTime(0, this.context.currentTime, .01); }
    buffer(kind, options = {}) {
      const key = kind + JSON.stringify(options); if (this.cache.has(key)) return this.cache.get(key);
      const samples = soundSamples(kind, this.context.sampleRate, options), b = this.context.createBuffer(1, samples.length, this.context.sampleRate); b.getChannelData(0).set(samples);
      // Fixed event variants plus the small set of UI tones; avoid an unbounded session cache.
      if (this.cache.size >= 48) this.cache.delete(this.cache.keys().next().value); this.cache.set(key, b); return b;
    }
    loop(kind, type, frequency) {
      const c = this.context, source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain(); source.buffer = this.buffer(kind); source.loop = true; filter.type = type; filter.frequency.value = frequency; gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(this.master); source.start(); return { source, filter, gain };
    }
    playSound(kind, volume, options = {}, space = { gain: 1, pan: 0, cutoff: 16000 }) {
      if (!this.context || !this.settings.sound || space.gain < .002) return;
      const c = this.context, now = c.currentTime;
      if (this.voices.size >= 24) { const old = this.voices.values().next().value; old.gain.gain.setTargetAtTime(0, now, .005); old.source.stop(now + .02); this.voices.delete(old); }
      const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain(), pan = c.createStereoPanner?.();
      source.buffer = this.buffer(kind, options); filter.type = 'lowpass'; filter.frequency.value = Math.min(space.cutoff, c.sampleRate * .45); gain.gain.value = volume * space.gain;
      source.connect(filter).connect(gain); if (pan) { pan.pan.value = space.pan; gain.connect(pan).connect(this.master); } else gain.connect(this.master);
      const voice = { source, gain }; this.voices.add(voice); source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); pan?.disconnect(); this.voices.delete(voice); };
      source.start(); source.stop(now + source.buffer.duration + .02);
    }
    note(frequency = 700, duration = .12, volume = .035) { this.playSound('note', volume * 1.5, { frequency, duration }); }
    pickup(kind) {
      if (!this.context || this.context.currentTime - this.lastPickup < .045) return;
      this.lastPickup = this.context.currentTime; this.playSound('pickup', .12, { frequency: [392, 440, 587, 740, 988][kind] });
    }
    blast(magic = false, point, player, world) { this.playSound(magic ? magic === 'rift' ? 'rift' : 'resonance' : 'blast', magic ? .4 : .62, {}, soundSpace(point, player, world)); }
    impact(node, player, world) {
      if (!this.context || this.context.currentTime - this.lastImpact < .07 || Math.hypot(node.vx, node.vy, node.vz) < 2) return;
      this.lastImpact = this.context.currentTime; this.playSound('impact', .12, { layer: node.kind }, soundSpace(node, player, world));
    }
    drill(fire, contact, depth, mode = 'cutter', charge = 0) {
      if (!this.context) return; const now = this.context.currentTime, magic = mode === 'gravity' || mode === 'resonance', layer = B.chapter(Math.max(0, depth));
      const active = this.settings.sound && fire;
      this.tool.gain.gain.setTargetAtTime(active && !magic ? contact ? .24 : .06 : 0, now, .035);
      this.tool.source.playbackRate.setTargetAtTime(mode === 'scoop' ? .72 : mode === 'lance' ? 1.35 : 1, now, .06);
      this.tool.filter.frequency.setTargetAtTime(contact ? 850 + layer * 420 : 1800, now, .06);
      this.hum.source.frequency.setTargetAtTime(active && magic ? 100 + charge * 160 : 62 + layer * 9, now, .08);
      this.hum.gain.gain.setTargetAtTime(active && magic ? .033 : this.settings.sound && depth > 25 ? .005 : 0, now, .1);
    }
    silence() { if (!this.context) return; for (const loop of [this.tool, this.air, this.motor, this.hum]) loop.gain.gain.setTargetAtTime(0, this.context.currentTime, .04); this.steps = 0; }
    update(game, dt) {
      if (!this.context || !this.settings.sound) return;
      const p = game.player, now = this.context.currentTime, depth = Math.max(0, -p.y), layer = B.chapter(depth), speed = Math.hypot(p.vx, p.vz);
      this.air.gain.gain.setTargetAtTime(depth < 3 ? .026 : layer === 1 ? .012 : .006, now, .7); this.air.filter.frequency.setTargetAtTime(depth < 3 ? 1600 : 340 + layer * 110, now, .7);
      if (p.grounded && speed > .8) { this.steps += speed * dt; if (this.steps >= 1.8) { this.steps %= 1.8; this.playSound('step', .15, { layer }); } } else this.steps = 0;
      if (p.grounded && !this.wasGrounded && this.fallSpeed < -5) this.playSound('step', Math.min(.35, -this.fallSpeed * .022), { layer });
      this.wasGrounded = p.grounded; this.fallSpeed = p.vy;
      const f = game.freight, moving = f?.state.dock && f.state.phase !== 'idle' && !f.blockedBy, space = moving ? soundSpace(f.cage, p, game.world) : { gain: 0 };
      this.motor.gain.gain.setTargetAtTime(space.gain * .055, now, .08);
      if (now > this.nextDrip && depth > 9) {
        this.nextDrip = now + 3.4; const ceiling = game.world.ray(p.head, { x: .2, y: .97, z: .1 }, 6);
        if (ceiling) this.playSound(layer >= 3 ? 'pickup' : 'drip', .035, layer >= 3 ? { frequency: layer === 4 ? 784 : 293 } : {}, soundSpace(ceiling, p, game.world));
      }
    }
  }
  Object.assign(B, { AudioEngine, soundSamples, soundSpace });
})(B2);
