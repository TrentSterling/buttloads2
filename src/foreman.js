/* The Foreman Below: physical machinery, exposed pressure locks and terrain-aware attacks. */
'use strict';
(function (B) {
  const PARTS = [
    { id: 100, x: 0, y: -279.7, z: 0, size: [3.6, 4.2, 3.6], hp: 420, name: 'The Foreman Below' },
    { id: 101, x: -8.1, y: -280.5, z: 0, size: [1.3, 2.6, 1.3], hp: 80, name: 'West pressure lock' },
    { id: 102, x: 8.1, y: -280.5, z: 0, size: [1.3, 2.6, 1.3], hp: 80, name: 'East pressure lock' },
    { id: 103, x: 0, y: -280.5, z: -8.1, size: [1.3, 2.6, 1.3], hp: 80, name: 'North pressure lock' }
  ];
  const pos = n => ({ x: n.x, y: n.y, z: n.z }), distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const fresh = () => ({ version: 1, known: false, active: false, defeated: false, phase: 'dormant', timer: 0, cycle: 0, aim: null, impact: null, forgeCooldown: 0, parts: PARTS.map(n => ({ id: n.id, hp: n.hp })), bodies: [] });
  class Foreman {
    constructor(world, progress, combat) {
      this.world = world; this.progress = progress; this.combat = combat;
      this.state = progress.expedition.foreman ||= fresh(); this.events = []; this.revision = 0; this.accumulator = 0; this.flash = 0; this.hitId = null; this.bore = null;
      this.nodes = world.depthVersion ? PARTS.map((p, i) => ({ ...p, hp: this.state.parts[i].hp, kind: 0, radius: Math.hypot(...p.size) / 2, targetRadius: i ? .65 : 1.65, collected: false, offsets: B.boxOffsets(p.size) })) : [];
      this.physics = new B.OreSystem(world, this.nodes, this.state.bodies); this.physics.supportRadius = Math.hypot(...PARTS[0].size) / 2;
      this.refreshTargets(); combat.foreman = this;
    }
    static validate(s, world, progress) {
      const finite = (n, a, b) => Number.isFinite(n) && n >= a && n <= b;
      const point = p => p && ['x', 'y', 'z'].every(k => Number.isFinite(p[k])) && Math.abs(p.x) <= 16 && Math.abs(p.z) <= 16 && p.y >= world.floor && p.y <= -250;
      if (!s || s.version !== 1 || ['known', 'active', 'defeated'].some(k => typeof s[k] !== 'boolean') || !['dormant', 'rest', 'aim', 'jet', 'quake-windup', 'quake', 'defeated'].includes(s.phase) || !finite(s.timer, 0, 4) || !Number.isSafeInteger(s.cycle) || s.cycle < 0 || s.cycle > 1e9 || !finite(s.forgeCooldown, 0, 6) || s.aim !== null && !point(s.aim) || s.impact != null && !point(s.impact) || !Array.isArray(s.parts) || s.parts.length !== 4 || !Array.isArray(s.bodies) || s.bodies.length > 4) throw new Error('Invalid furnace encounter.');
      if ((s.active || s.defeated || s.parts?.some((n, i) => n?.hp < PARTS[i]?.hp)) && !s.known || s.active && (!s.known || s.defeated) || s.defeated !== (s.phase === 'defeated') || !s.defeated && (s.active ? s.phase === 'dormant' : s.phase !== 'dormant') || !s.defeated && s.forgeCooldown || ['aim', 'jet'].includes(s.phase) && !s.aim) throw new Error('Inconsistent furnace phase.');
      for (let i = 0; i < 4; i++) if (s.parts[i]?.id !== PARTS[i].id || !finite(s.parts[i].hp, 0, PARTS[i].hp)) throw new Error('Invalid furnace part.');
      const locks = s.parts.slice(1).filter(n => n.hp === 0).length;
      if (s.parts[0].hp < 420 - locks * 140 - .0001 || s.defeated !== (s.parts[0].hp === 0) || (s.active || s.defeated || s.parts.some((n, i) => n.hp < PARTS[i].hp)) && (!world.depthVersion || !progress.expedition.deep?.open || !progress.expedition.awakened)) throw new Error('Inconsistent furnace progress.');
      const ids = new Set();
      for (const n of s.bodies) {
        const part = PARTS.find(p => p.id === n?.id);
        if (!part || !world.depthVersion || ids.has(n.id) || !point(n) || !['vx', 'vy', 'vz'].every(k => finite(n[k], -25, 25)) || B.boxOffsets(part.size).some(o => world.density(n.x + o[0], n.y + o[1], n.z + o[2]) < -.011)) throw new Error('Invalid furnace body.');
        ids.add(n.id);
      }
      return { version: 1, known: s.known, active: s.active, defeated: s.defeated, phase: s.phase, timer: s.timer, cycle: s.cycle, aim: s.aim ? pos(s.aim) : null, impact: s.impact ? pos(s.impact) : null, forgeCooldown: s.forgeCooldown, parts: s.parts.map(n => ({ id: n.id, hp: n.hp })), bodies: s.bodies.map(n => ({ id: n.id, ...pos(n), vx: n.vx, vy: n.vy, vz: n.vz })) };
    }
    get core() { return this.nodes[0]; }
    get broken() { return this.nodes.slice(1).filter(n => n.hp <= 0).length; }
    get healthFloor() { return 420 - this.broken * 140; }
    owns(n) { return this.nodes.includes(n); }
    refreshTargets() { for (const n of this.nodes) n.phase = n.hp <= 0 ? 'dead' : this.physics.contact(n).density < -.004 ? 'buried' : 'idle'; }
    targets() { if (!this.progress.expedition.deep?.open) return []; this.refreshTargets(); return this.nodes; }
    obstacles() { return this.nodes.map(n => [n.x - n.size[0] / 2, n.y - n.size[1] / 2, n.z - n.size[2] / 2, n.x + n.size[0] / 2, n.y + n.size[1] / 2, n.z + n.size[2] / 2]); }
    wake() {
      const s = this.state; if (s.active || s.defeated || !this.progress.expedition.deep?.open) return false;
      s.active = s.known = true; s.phase = 'rest'; s.timer = 2.5; this.events.push({ kind: 'wake' }); this.revision++; return true;
    }
    hit(n, amount, mode) {
      if (!this.owns(n) || !this.progress.expedition.deep?.open || this.state.defeated || n.hp <= 0 || !(amount > 0) || this.physics.contact(n).density < -.004) return false;
      this.wake(); this.hitId=n.id; const core = n === this.core, floor = core ? this.healthFloor : 0;
      if (n.hp <= floor) { this.flash = .14; return false; }
      const old = n.hp; n.hp = Math.max(floor, n.hp - amount * (mode === 'lance' && !core ? 1.4 : 1));
      this.state.parts[n.id - 100].hp = n.hp; this.combat.hitFlash = .14; this.flash = .12; this.revision++;
      if (!core && n.hp === 0) { this.state.phase = 'rest'; this.state.timer = 2.4; this.events.push({ kind: 'lock', point: pos(n) }); }
      if (core && old > 0 && n.hp === 0) this.defeat();
      return n.hp !== old;
    }
    defeat() {
      const s = this.state; if (s.defeated) return;
      s.defeated = s.known = true; s.active = false; s.phase = 'defeated'; s.timer = 0;
      this.progress.cash += 5000; this.progress.earned += 5000; this.events.push({ kind: 'victory', point: pos(this.core) }); this.revision++;
    }
    beam() {
      if (!this.core || !this.state.aim) return null;
      const from = { x: this.core.x, y: this.core.y + .8, z: this.core.z }, p = this.state.aim, length = distance(from, p) || 1, direction = { x: (p.x - from.x) / length, y: (p.y - from.y) / length, z: (p.z - from.z) / length };
      const hit = this.world.ray(from, direction, 22), reach = hit?.distance ?? 22;
      return { from, direction, hit, reach, to: { x: from.x + direction.x * reach, y: from.y + direction.y * reach, z: from.z + direction.z * reach } };
    }
    quakeRadius() { return (2.4-this.state.timer)*5.5; }
    quakeGround() { return this.core.y-this.core.size[1]/2; }
    quakeReaches(point) {
      const n=this.core,ground=this.quakeGround();
      return Math.abs(point.y-ground)<1.1 && this.world.clearLine({x:n.x,y:ground+.35,z:n.z},{x:point.x,y:point.y+.35,z:point.z},.05);
    }
    fire(player) {
      const beam = this.beam(); if (!beam) return;
      this.state.impact = pos(beam.to);
      // Test the entire standing player against the beam before its impact excavates cover.
      for (const h of [.3, .85, 1.4]) {
        const p = { x: player.x, y: player.y + h, z: player.z }, dx = p.x - beam.from.x, dy = p.y - beam.from.y, dz = p.z - beam.from.z, t = dx * beam.direction.x + dy * beam.direction.y + dz * beam.direction.z;
        if (t > 0 && t <= beam.reach && Math.hypot(dx - beam.direction.x * t, dy - beam.direction.y * t, dz - beam.direction.z * t) < .7) { this.combat.hurt(24); break; }
      }
      if (beam.hit) this.world.carve(beam.hit, .8);
      this.events.push({ kind: 'jet', point: beam.to });
    }
    step(dt, player) {
      const s = this.state, n = this.core; if (!n) return;
      if (s.forgeCooldown > 0) { s.forgeCooldown = Math.max(0, s.forgeCooldown - dt); this.revision++; }
      this.flash = Math.max(0, this.flash - dt); if (s.defeated) return;
      const near = player.y < -264 && distance(player.head, n) < 24;
      if (!s.active) { if (near && this.world.clearLine(player.head, n, .08)) this.wake(); return; }
      if (!near) { s.phase = 'rest'; s.timer = 2.5; return; }
      s.timer = Math.max(0, s.timer - dt); this.revision++;
      if (s.phase === 'rest' && s.timer === 0) {
        s.cycle++; s.phase = s.cycle % 2 ? 'aim' : 'quake-windup'; s.timer = this.broken === 3 ? 1.25 : 1.65;
        s.impact = null; s.aim = { x: player.x, y: player.y + 1, z: player.z }; this.events.push({ kind: 'warn' });
      } else if (s.phase === 'aim' && s.timer === 0) { s.phase = 'jet'; s.timer = .3; this.fire(player); }
      else if (s.phase === 'quake-windup' && s.timer === 0) { s.phase = 'quake'; s.timer = 2.4; this.events.push({ kind: 'quake', point: pos(n) }); }
      else if (s.phase === 'quake') {
        const r = this.quakeRadius();
        if (player.grounded && Math.abs(Math.hypot(player.x - n.x, player.z - n.z) - r) < .6 && this.quakeReaches(player)) this.combat.hurt(20);
        if (s.timer === 0) { s.phase = 'rest'; s.timer = this.broken === 3 ? .9 : 1.5; }
      } else if (s.phase === 'jet' && s.timer === 0) { s.phase = 'rest'; s.timer = this.broken === 3 ? .9 : 1.5; }
    }
    update(dt, player) {
      const before = this.revision; if (this.physics.update(dt)) this.revision++;
      this.accumulator += Math.min(.1, dt); while (this.accumulator + 1e-10 >= 1 / 120) { this.step(1 / 120, player); this.accumulator -= 1 / 120; }
      if (this.bore) { this.bore.time -= dt; if (this.bore.time <= 0) this.bore = null; }
      return before !== this.revision;
    }
    forge(player) {
      const s = this.state; if (!s.defeated || s.forgeCooldown > 0 || player.y > -2) return false;
      const from = player.head, direction = player.direction, radius = 2, length = 12; let edits = 0;
      for (let d = 1; d <= length; d += .65) edits += this.world.carve({ x: from.x + direction.x * d, y: from.y + direction.y * d, z: from.z + direction.z * d }, radius);
      let damage = false;
      for (const n of this.combat.targets()) {
        const along = B.clamp((n.x - from.x) * direction.x + (n.y - from.y) * direction.y + (n.z - from.z) * direction.z, 0, length), p = { x: from.x + direction.x * along, y: from.y + direction.y * along, z: from.z + direction.z * along };
        if (distance(p, n) < radius && this.world.clearLine(p, n, .05)) damage = this.combat.hit(n, 80, 'rift') || damage;
      }
      if (!edits && !damage) return false;
      s.forgeCooldown = 6; this.bore = { from: pos(from), direction: pos(direction), length, time: .55 }; this.revision++; this.events.push({ kind: 'bore', point: from }); return true;
    }
    hint() {
      if (this.state.defeated) return 'Foundry bore acquired. Z melts a passage; the common has power again.';
      if (this.state.phase === 'aim' || this.state.phase === 'jet') return 'Cutting jet marked. Move off the line or get behind rock.';
      if (this.state.phase === 'quake-windup' || this.state.phase === 'quake') return 'Ground shock incoming. Hold Space to lift clear.';
      return this.core?.hp > this.healthFloor ? 'Core exposed. Drill, strike or blast the furnace.' : 'Excavate a pressure lock, then break it to expose the core.';
    }
    scan(head, range) { const nodes = this.progress.expedition.deep?.open ? this.nodes.filter(n => n.hp > 0 && distance(head, n) <= range) : []; if (nodes.length && !this.state.known) { this.state.known = true; this.revision++; } return nodes; }
    markers() { return this.state.known ? this.nodes.filter(n => n.hp > 0).map(n => ({ ...pos(n), name: n.name, type: 'foreman', color: n === this.core ? '#ffa069' : '#edc480' })) : []; }
    save() { this.state.bodies = this.physics.snapshot(); }
  }
  Object.assign(B, { Foreman, FOREMAN_PARTS: PARTS });
})(B2);
