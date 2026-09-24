/* Natural demolition seams. Dig free for supplies, or ignite a physical chain reaction. */
'use strict';
(function (B) {
  const SEAMS = [
    { x: -5, y: -16, z: 3, dx: -.75, dy: -.35, dz: .55, kind: 1 },
    { x: 7, y: -34, z: -2, dx: -.15, dy: -.35, dz: .92, kind: 2 },
    { x: -6, y: -48, z: -4, dx: .7, dy: -.3, dz: -.65, kind: 3 },
    { x: 5, y: -62, z: 5, dx: -.8, dy: -.35, dz: .2, kind: 4 }
  ];
  const STONES = SEAMS.flatMap((s, group) => Array.from({ length: 4 }, (_, i) => {
    const length = Math.hypot(s.dx, s.dy, s.dz), t = i * 2.15 / length;
    return { id: group * 4 + i, group, x: s.x + s.dx * t, y: s.y + s.dy * t, z: s.z + s.dz * t, kind: s.kind, radius: .42, name: 'Thunderstone seam', color: '#f095ca' };
  }));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  class Thunderstone {
    constructor(world, progress) {
      this.world = world; this.progress = progress;
      this.state = progress.expedition.thunder ||= { version: 1, known: [], spent: [], loose: [], lit: [] };
      this.nodes = STONES.map(p => ({ ...p, kind: 0, collected: this.state.spent.includes(p.id), fuse: this.state.lit.find(n => n.id === p.id)?.remaining ?? -1 }));
      this.physics = new B.OreSystem(world, this.nodes, this.state.loose); this.lastBlast = 0; this.lastPulse = 0; this.accumulator = 0; this.revision = 0; this.time = 0; this.nextLook = 0; this.events = [];
    }
    static validate(s, world) {
      const validID = id => Number.isInteger(id) && id >= 0 && id < STONES.length;
      const ids = a => Array.isArray(a) && a.length <= STONES.length && new Set(a).size === a.length && a.every(validID);
      if (!s || s.version !== 1 || !ids(s.known) || !ids(s.spent) || s.spent.some(id => !s.known.includes(id)) || !Array.isArray(s.loose) || s.loose.length > STONES.length || !Array.isArray(s.lit) || s.lit.length > STONES.length) throw new Error('Invalid thunderstone seam.');
      const seen = new Set();
      for (const n of s.loose) {
        if (!n || !validID(n.id) || seen.has(n.id) || s.spent.includes(n.id) || !['x', 'y', 'z', 'vx', 'vy', 'vz'].every(k => Number.isFinite(n[k])) || Math.abs(n.x) > 24 || Math.abs(n.z) > 24 || n.y < (world?.floor ?? B.WORLD.floor) - 1 || n.y > 20 || ['vx', 'vy', 'vz'].some(k => Math.abs(n[k]) > 25)) throw new Error('Invalid loose thunderstone.');
        seen.add(n.id);
        if (B.oreOffsets({ ...STONES[n.id], kind: 0 }).some(p => world.density(n.x + p[0], n.y + p[1], n.z + p[2]) < -.01)) throw new Error('Thunderstone is inside terrain.');
      }
      seen.clear();
      for (const n of s.lit) {
        if (!n || !validID(n.id) || seen.has(n.id) || !s.known.includes(n.id) || s.spent.includes(n.id) || !Number.isFinite(n.remaining) || n.remaining <= 0 || n.remaining > .65) throw new Error('Invalid thunderstone ignition.');
        seen.add(n.id);
      }
      return { version: 1, known: [...s.known], spent: [...s.spent], loose: s.loose.map(n => ({ id: n.id, x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz })), lit: s.lit.map(n => ({ id: n.id, remaining: n.remaining })) };
    }
    discover(n) {
      if (this.state.known.includes(n.id)) return;
      if (!this.state.known.length) this.events.push({ text: 'Thunderstone. Expose it and recover a charge with E, or hit it with a blast to ignite the seam. J has field notes.', tone: 330 });
      this.state.known.push(n.id); this.revision++;
    }
    scan(head, range) { const found = this.nodes.filter(n => !n.collected && distance(head, n) <= range); found.forEach(n => this.discover(n)); return found; }
    ignite(blast) {
      const centers = [blast];
      if (blast.length && blast.direction) for (let d = .6; d <= blast.length + 1e-6; d += .6) centers.push({ x: blast.x + blast.direction.x * d, y: blast.y + blast.direction.y * d, z: blast.z + blast.direction.z * d });
      for (const n of this.nodes) {
        if (n.collected || n.fuse >= 0 || this.world.density(n.x, n.y, n.z) < .04) continue;
        if (!centers.some(p => distance(p, n) <= blast.radius && this.world.clearLine(p, n, .12))) continue;
        this.discover(n); n.fuse = .65; this.revision++;
      }
    }
    consume(n) {
      this.discover(n); n.collected = true; n.fuse = -1; this.state.spent.push(n.id);
      this.physics.awake.delete(n); this.physics.loose.delete(n); this.physics.index.remove(n); this.revision++;
    }
    interaction(player) {
      const h = player.head, d = player.direction;
      let result = null, best = Infinity;
      for (const n of this.nodes) {
        const delta = { x: n.x - h.x, y: n.y - h.y, z: n.z - h.z }, along = delta.x * d.x + delta.y * d.y + delta.z * d.z;
        if (n.collected || distance(h, n) > 3 || along <= 0 || along >= best || Math.hypot(delta.x - d.x * along, delta.y - d.y * along, delta.z - d.z * along) > .45 || !this.world.clearLine(h, n, .1)) continue;
        best = along; const embedded = this.physics.contact(n).density < -.004, full = this.progress.expedition.supplies.bombs >= 99;
        result = { kind: 'thunderstone', id: n.id, locked: n.fuse >= 0 || embedded || full, label: n.fuse >= 0 ? 'Thunderstone ignited / stand clear' : embedded ? 'Thunderstone / expose all sides, or ignite with a blast' : full ? 'Charge supplies full' : 'Recover thunderstone / +1 charge' };
      }
      return result;
    }
    harvest(id, player) {
      const action = this.interaction(player); if (!action || action.id !== id || action.locked) return false;
      this.consume(this.nodes[id]); this.progress.expedition.supplies.bombs++; this.save(); return true;
    }
    update(dt, game) {
      const before = this.revision, gadgets = game.gadgets;
      for (const b of gadgets.blasts) if (b.serial > this.lastBlast) { this.lastBlast = b.serial; this.ignite(b); }
      if (game.expedition.pulseSerial !== this.lastPulse) { this.lastPulse = game.expedition.pulseSerial; if (game.expedition.lastPulse) this.ignite(game.expedition.lastPulse); }
      this.accumulator += Math.min(.1, dt);
      while (this.accumulator + 1e-10 >= 1 / 120) {
        this.accumulator -= 1 / 120; this.time += 1 / 120;
        if (this.physics.update(1 / 120)) this.revision++;
        const firing = [];
        for (const n of this.nodes) if (!n.collected && n.fuse >= 0) { n.fuse -= 1 / 120; this.revision++; if (n.fuse <= 1e-9) firing.push(n); }
        for (const n of firing) {
          this.consume(n); gadgets.explode({ ...n, mode: 'thunderstone' }, { radius: 2.9 }, game.orePhysics, game.expedition.physics, game.player);
          const blast = gadgets.blasts.at(-1); this.lastBlast = blast.serial; this.ignite(blast);
        }
      }
      if (this.time >= this.nextLook) {
        this.nextLook = this.time + .3;
        for (const n of this.nodes) if (!n.collected && distance(game.player.head, n) < 5 && this.world.density(n.x, n.y, n.z) > .04 && this.world.clearLine(game.player.head, n, .1)) this.discover(n);
      }
      if (before !== this.revision) this.save(); return before !== this.revision;
    }
    markers() { return this.nodes.filter(n => !n.collected && this.state.known.includes(n.id)).map(n => ({ ...n, type: 'thunderstone', name: n.fuse >= 0 ? 'Ignited thunderstone' : 'Thunderstone / blast or recover', color: '#f095ca' })); }
    save() { this.state.loose = this.physics.snapshot(); this.state.lit = this.nodes.filter(n => !n.collected && n.fuse >= 0).map(n => ({ id: n.id, remaining: n.fuse })); }
  }
  Object.assign(B, { Thunderstone, THUNDERSTONES: STONES });
})(B2);
