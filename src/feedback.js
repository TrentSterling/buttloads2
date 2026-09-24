/* Cosmetic simulation only: it never changes terrain, ore, inventory or player motion. */
'use strict';
(function (B) {
  const ATMOSPHERES = [
    { fog: '#14231f', lamp: '#ffe8bf' }, { fog: '#251a16', lamp: '#ffdfb1' },
    { fog: '#111f27', lamp: '#d7eff3' }, { fog: '#171322', lamp: '#e8def7' }, { fog: '#0a231f', lamp: '#bdf5de' }
  ];
  class Feedback {
    constructor(world, seed = 4091) {
      this.world = world; this.random = B.random(seed); this.particles = []; this.flashes = []; this.time = 0; this.accumulator = 0; this.cutRemainder = 0; this.moteRemainder = 0; this.lastBlast = this.lastPulse = 0; this.kick = 0; this.serial = 0;
    }
    spawn(p, type, color, velocity, life, size) {
      if (this.particles.length >= 512 || this.world.density(p.x, p.y, p.z) < -.004) return;
      const scale = .82 + this.random() * .3;
      this.particles.push({ x: p.x, y: p.y, z: p.z, ...velocity, type, color: color.map(c => c * scale), life, duration: life, size, spin: this.random() * 6.28, bounces: 0 });
    }
    cut(hit, head, dt) {
      if (!hit) return;
      const r = this.random, color = B.geology(hit.y).color.map(c => c / 255), n = this.world.normal(hit.x, hit.y, hit.z);
      if (Math.hypot(...n) < .1) { const length = Math.hypot(head.x - hit.x, head.y - hit.y, head.z - hit.z) || 1; n[0] = (head.x - hit.x) / length; n[1] = (head.y - hit.y) / length; n[2] = (head.z - hit.z) / length; }
      const origin = { x: hit.x + n[0] * .07, y: hit.y + n[1] * .07, z: hit.z + n[2] * .07 };
      this.cutRemainder += dt * 85;
      while (this.cutRemainder >= 1) {
        this.cutRemainder--; const speed = .8 + r() * 2.4, dust = r() < .24;
        this.spawn(origin, dust ? 'dust' : 'chip', color, { vx: n[0] * speed + (r() - .5), vy: n[1] * speed + r(), vz: n[2] * speed + (r() - .5) }, dust ? .7 + r() * .8 : .45 + r() * .55, dust ? .18 + r() * .18 : .035 + r() * .045);
      }
      this.kick = Math.max(this.kick, .18);
    }
    burst(p, radius, magic = false) {
      const r = this.random, color = magic ? [.45, .95, .79] : B.geology(p.y).color.map(c => c / 255);
      for (let i = 0; i < 56; i++) {
        const a = r() * Math.PI * 2, y = r() * 2 - 1, h = Math.sqrt(1 - y * y), speed = 2 + r() * 6, dust = i % 4 === 0;
        const n = { x: Math.cos(a) * h, y, z: Math.sin(a) * h }, offset = r() * Math.min(radius * .55, 1.4);
        this.spawn({ x: p.x + n.x * offset, y: p.y + n.y * offset, z: p.z + n.z * offset }, dust ? 'dust' : magic ? 'mote' : 'chip', color, { vx: n.x * speed, vy: n.y * speed + (magic ? 1 : 2), vz: n.z * speed }, dust ? 1.1 + r() * .7 : .6 + r() * .7, dust ? .35 + r() * .3 : .045 + r() * .06);
      }
      this.flashes.push({ ...p, radius, magic: !!magic, age: 0, serial: ++this.serial }); if (this.flashes.length > 12) this.flashes.shift(); this.kick = Math.min(1, this.kick + .7);
    }
    collect(node) {
      const color = B.ORES[node.kind].color.match(/[0-9a-f]{2}/gi).map(c => parseInt(c, 16) / 255);
      for (let i = 0; i < 5; i++) this.spawn(node, 'mote', color, { vx: (this.random() - .5) * .9, vy: .7 + this.random(), vz: (this.random() - .5) * .9 }, .35 + this.random() * .3, .035);
    }
    step(dt) {
      for (const p of this.particles) {
        p.life -= dt; if (p.life <= 0) continue;
        p.vy -= dt * (p.type === 'chip' ? 14 : p.type === 'dust' ? .2 : -.3); const drag = Math.exp(-dt * (p.type === 'dust' ? 2.8 : .6)); p.vx *= drag; p.vz *= drag;
        const next = { x: p.x + p.vx * dt, y: p.y + p.vy * dt, z: p.z + p.vz * dt };
        if (this.world.density(next.x, next.y, next.z) < .015) {
          if (p.type !== 'chip' || ++p.bounces > 2) { p.life = 0; continue; }
          const n = this.world.normal(next.x, next.y, next.z), into = p.vx * n[0] + p.vy * n[1] + p.vz * n[2];
          if (into < 0) { p.vx -= 1.25 * into * n[0]; p.vy -= 1.25 * into * n[1]; p.vz -= 1.25 * into * n[2]; }
          p.vx *= .55; p.vy *= .55; p.vz *= .55; p.life = Math.min(p.life, .22);
        } else Object.assign(p, next);
        p.spin += dt * (p.type === 'chip' ? 5 : .3);
      }
      this.particles = this.particles.filter(p => p.life > 0);
    }
    update(dt, game) {
      this.time += dt; this.kick *= Math.exp(-dt * 14);
      if (game.cutter.edited) this.cut(game.cutter.contact, game.player.head, dt); else this.cutRemainder = 0;
      const exp = game.expedition;
      if (exp.pulseSerial !== this.lastPulse) { this.lastPulse = exp.pulseSerial; if (exp.lastPulse) this.burst(exp.lastPulse, exp.lastPulse.radius, true); }
      for (const b of game.gadgets.blasts) if (b.serial > this.lastBlast) {
        this.lastBlast = b.serial; this.burst(b, b.radius);
        if (b.length) for (let d = 3; d <= b.length; d += 3) this.burst({ x: b.x + b.direction.x * d, y: b.y + b.direction.y * d, z: b.z + b.direction.z * d }, b.radius);
      }
      if (game.player.head.y < -9) {
        this.moteRemainder += dt * 2.5;
        while (this.moteRemainder >= 1) { this.moteRemainder--; const h = game.player.head, garden = h.y < -59; this.spawn({ x: h.x + (this.random() - .5) * 6, y: h.y + (this.random() - .5) * 3, z: h.z + (this.random() - .5) * 6 }, 'mote', garden ? [.37, .8, .64] : [.37, .36, .31], { vx: .02, vy: .02, vz: -.02 }, 2, .014); }
      }
      this.accumulator += Math.min(.1, dt);
      while (this.accumulator + 1e-10 >= 1 / 120) { this.step(1 / 120); this.accumulator -= 1 / 120; }
      for (const f of this.flashes) f.age += dt; this.flashes = this.flashes.filter(f => f.age < .55);
    }
  }
  Object.assign(B, { Feedback, ATMOSPHERES });
})(B2);
