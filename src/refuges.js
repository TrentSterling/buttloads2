/* Recoverable survey cabinets: real support, repairable lighting and local charts. */
'use strict';
(function (B) {
  const SIZE = [.95, 1.16, .65], OFFSETS = () => B.boxOffsets(SIZE);
  class Refuges {
    static sites(world) {
      const rooms = world.caverns?.networks.length ? world.caverns.networks.map(n => ({ ...n.chamber, name: n.name, color: n.color })) : B.RELICS.slice(0, 3).map(r => ({ x: r.x - .8, y: r.y + 1.1, z: r.z + .7, name: 'Old survey shelter', color: '#d2b887' }));
      const baseline = Object.create(B.World.prototype); baseline.density = (x, y, z) => world.base(x, y, z);
      return rooms.map((r, id) => {
        const x = r.x - 1.2, z = r.z + .5, from = { x, y: r.y, z }, floor = baseline.ray(from, { x: 0, y: -1, z: 0 }, 8);
        if (!floor) throw new Error('Survey refuge has no supporting floor.');
        return { id, x, y: floor.y + SIZE[1] / 2 + .04, z, name: r.name, color: r.color, chart: { x: r.x, y: r.y, z: r.z } };
      });
    }
    constructor(world, progress) {
      this.world = world; this.progress = progress; this.state = progress.expedition.refuges ||= { version: 1, known: [], lit: [], bodies: [] };
      this.nodes = Refuges.sites(world).map(s => ({ ...s, radius: .7, kind: 0, collected: false, offsets: OFFSETS() }));
      this.physics = new B.OreSystem(world, this.nodes, this.state.bodies); this.elapsed = 1;
    }
    static validate(s, world) {
      const validID = n => Number.isInteger(n) && n >= 0 && n < 3;
      if (!s || s.version !== 1 || !Array.isArray(s.known) || !Array.isArray(s.lit) || [s.known, s.lit].some(a => a.length > 3 || a.some(n => !validID(n)) || new Set(a).size !== a.length) || s.lit.some(id => !s.known.includes(id)) || !Array.isArray(s.bodies) || s.bodies.length > 3) throw new Error('Invalid survey refuges.');
      const seen = new Set();
      for (const n of s.bodies) {
        if (!n || !validID(n.id) || seen.has(n.id) || !['x', 'y', 'z', 'vx', 'vy', 'vz'].every(k => Number.isFinite(n[k])) || Math.abs(n.x) > 14 || Math.abs(n.z) > 14 || n.y < (world?.floor ?? B.WORLD.floor) || n.y > 4 || ['vx', 'vy', 'vz'].some(k => Math.abs(n[k]) > 25)) throw new Error('Invalid refuge body.');
        if (world && OFFSETS().some(p => world.density(n.x + p[0], n.y + p[1], n.z + p[2]) < -.01)) throw new Error('Refuge body is inside terrain.');
        seen.add(n.id);
      }
      return { version: 1, known: [...s.known], lit: [...s.lit], bodies: s.bodies.map(n => ({ id: n.id, x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz })) };
    }
    obstacles() { return this.nodes.map(n => [n.x - SIZE[0] / 2, n.y - SIZE[1] / 2, n.z - SIZE[2] / 2, n.x + SIZE[0] / 2, n.y + SIZE[1] / 2, n.z + SIZE[2] / 2]); }
    remember(id) { if (this.state.known.includes(id)) return false; this.state.known.push(id); return true; }
    update(dt, player) {
      let changed = this.physics.update(dt); this.elapsed += dt;
      if (this.elapsed > .35) { this.elapsed = 0; for (const n of this.nodes) if (Math.hypot(n.x - player.head.x, n.y - player.head.y, n.z - player.head.z) < 5 && this.world.density(n.x, n.y, n.z) > .05 && this.world.clearLine(player.head, n, .1)) changed = this.remember(n.id) || changed; }
      return changed;
    }
    scan(head, range) { const found = this.nodes.filter(n => Math.hypot(n.x - head.x, n.y - head.y, n.z - head.z) <= range); for (const n of found) this.remember(n.id); return found; }
    interaction(player) {
      const a = player.head, d = player.direction;
      for (const n of this.nodes) {
        const dx = n.x - a.x, dy = n.y + .25 - a.y, dz = n.z - a.z, range = Math.hypot(dx, dy, dz);
        if (range > 3 || range < .1 || (dx * d.x + dy * d.y + dz * d.z) / range < .86 || this.physics.contact(n).density < -.004 || !this.world.clearLine(a, { x: n.x, y: n.y + .25, z: n.z }, .08)) continue;
        const lit = this.state.lit.includes(n.id), empty = !this.progress.expedition.supplies.lights;
        return { kind: 'refuge', id: n.id, locked: !lit && empty, label: lit ? 'Read the shelter chart / M opens your survey' : empty ? 'Survey cabinet needs one work light' : 'Restore survey cabinet / 1 work light' };
      }
      return null;
    }
    restore(id, player, survey) {
      const action = this.interaction(player); if (!action || action.id !== id || action.locked) return false;
      const fresh = !this.state.lit.includes(id);
      if (fresh) { this.progress.expedition.supplies.lights--; this.state.lit.push(id); }
      this.remember(id);
      const n = this.nodes[id], network = this.world.caverns?.networks[id];
      const points = network ? [network.chamber, network.branch, ...network.nodes] : [n.chart];
      for (const p of points) survey.box(p, 3.8, (cell, q) => { if (Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) <= 3.8 && this.world.density(q.x, q.y, q.z) > .05) survey.mark(cell); });
      return { fresh, name: n.name };
    }
    markers() { return this.nodes.filter(n => this.state.known.includes(n.id)).map(n => ({ ...n, name: this.state.lit.includes(n.id) ? 'Lit refuge / ' + n.name : 'Survey cabinet / ' + n.name, type: 'refuge', color: this.state.lit.includes(n.id) ? '#ffe1a2' : '#a7bfb2' })); }
    save() { this.state.bodies = this.physics.snapshot(); }
  }
  Object.assign(B, { Refuges, REFUGE_SIZE: SIZE });
})(B2);
