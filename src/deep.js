/* Heart breakthrough and restorable lower-mine transit stations. */
'use strict';
(function (B) {
  const SIZE = [2.2, 2.1, 1.8], offsets = () => B.boxOffsets(SIZE), distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  class DeepExpedition {
    static sites(world) {
      if (!world.depthVersion) return [];
      const base = Object.create(B.World.prototype); base.density = (x, y, z) => world.base(x, y, z);
      return B.DEEP_STATIONS.map(s => { const hit = base.ray(s, { x: 0, y: -1, z: 0 }, 8); if (!hit) throw new Error('Missing lower station foundation.'); return { ...s, y: hit.y + SIZE[1] / 2 + .04 }; });
    }
    constructor(world, progress) {
      this.world = world; this.progress = progress; this.state = progress.expedition.deep ||= { version: 1, open: false, known: [], repaired: [], arrivals: [], bodies: [] };
      world.deepOpen = this.state.open; world.deepUpgrades = this.state.repaired;
      this.nodes = DeepExpedition.sites(world).map(n => ({ ...n, kind: 0, radius: 1.6, collected: false, offsets: offsets() }));
      this.physics = new B.OreSystem(world, this.nodes, this.state.bodies); this.elapsed = 1; this.events = [];
    }
    static validate(s, world, progress) {
      const id = n => Number.isInteger(n) && n >= 0 && n < 3, ids = a => Array.isArray(a) && a.length <= 3 && new Set(a).size === a.length && a.every(id);
      if (!s || s.version !== 1 || typeof s.open !== 'boolean' || s.open && (!world.depthVersion || !progress.expedition.awakened) || !ids(s.known) || !ids(s.repaired) || !world.depthVersion && (s.known.length || s.repaired.length || s.bodies?.length) || s.repaired.some(n => !s.known.includes(n)) || s.repaired.length && !s.open || !Array.isArray(s.arrivals) || s.arrivals.length !== s.repaired.length || !Array.isArray(s.bodies) || s.bodies.length > 3) throw new Error('Invalid lower expedition.');
      const seen = new Set(), arrivals = [], bodies = [];
      for (const p of s.arrivals) {
        if (!p || !id(p.id) || seen.has(p.id) || !s.repaired.includes(p.id) || !['x', 'y', 'z', 'yaw', 'pitch'].every(k => Number.isFinite(p[k])) || Math.abs(p.x) > 14 || Math.abs(p.z) > 14 || p.y < world.floor || p.y > -80 || Math.abs(p.pitch) > 1.55) throw new Error('Invalid lower return point.');
        const player = new B.Player(world); if (player.blocked(p.x, p.y, p.z)) throw new Error('Lower return point is inside terrain.');
        seen.add(p.id); arrivals.push({ id: p.id, x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch });
      }
      seen.clear();
      for (const n of s.bodies) {
        if (!n || !world.depthVersion || !id(n.id) || seen.has(n.id) || !['x', 'y', 'z', 'vx', 'vy', 'vz'].every(k => Number.isFinite(n[k])) || Math.abs(n.x) > 14 || Math.abs(n.z) > 14 || n.y < world.floor || n.y > -80 || ['vx', 'vy', 'vz'].some(k => Math.abs(n[k]) > 25) || offsets().some(o => world.density(n.x + o[0], n.y + o[1], n.z + o[2]) < -.01)) throw new Error('Invalid lower station body.');
        seen.add(n.id); bodies.push({ id: n.id, x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz });
      }
      return { version: 1, open: s.open, known: [...s.known], repaired: [...s.repaired], arrivals, bodies };
    }
    obstacles() { return this.nodes.map(n => [n.x - SIZE[0] / 2, n.y - SIZE[1] / 2, n.z - SIZE[2] / 2, n.x + SIZE[0] / 2, n.y + SIZE[1] / 2, n.z + SIZE[2] / 2]); }
    aimed(player, p, reach = 3.4) {
      const h = player.head, d = player.direction, r = distance(h, p);
      return r > .1 && r <= reach && ((p.x - h.x) * d.x + (p.y - h.y) * d.y + (p.z - h.z) * d.z) / r > .78 && this.world.clearLine(h, p, .08);
    }
    interaction(player) {
      if (!this.world.depthVersion) return null;
      if (!this.state.open && this.aimed(player, B.DEEP_GATE)) return { kind: 'deep-gate', locked: !this.progress.expedition.awakened, label: this.progress.expedition.awakened ? 'Open the rootway / the mine continues below' : 'The rootway answers only to the living heart' };
      for (const n of this.nodes) if (this.aimed(player, n)) {
        const buried = this.physics.contact(n).density < -.004, repaired = this.state.repaired.includes(n.id), supplies = this.progress.expedition.supplies;
        return { kind: 'deep-station', id: n.id, locked: !this.state.open || buried || !repaired && (supplies.lights < 2 || supplies.bombs < 3), label: buried ? 'Expose the station housing on every side' : repaired ? 'Reset this station return point' : `Restore ${n.name} / 2 lights + 3 charges` };
      }
      return null;
    }
    open(player) {
      const a = this.interaction(player); if (a?.kind !== 'deep-gate' || a.locked || this.state.open) return false;
      this.state.open = true; this.world.deepOpen = true;
      for (let y = -70; y >= -87; y -= 1) this.world.carve({ x: 2, y, z: 2 }, 2.3);
      this.events.push({ title: 'That was only the roof.', text: 'The heart loosens an old shaft beneath the garden. The rootworks, ashfall and foundry continue down to 297 metres. Restore the pump house first; its gearing and return link will make the descent easier.' }); return true;
    }
    repair(id, player) {
      const a = this.interaction(player); if (a?.kind !== 'deep-station' || a.id !== id || a.locked || !this.state.open || player.blocked(player.x, player.y, player.z)) return false;
      const fresh = !this.state.repaired.includes(id);
      if (fresh) { this.progress.expedition.supplies.lights -= 2; this.progress.expedition.supplies.bombs -= 3; this.state.repaired.push(id); }
      if (!this.state.known.includes(id)) this.state.known.push(id);
      const arrival = { id, ...player.position, yaw: player.yaw, pitch: player.pitch }, at = this.state.arrivals.findIndex(p => p.id === id);
      if (at < 0) this.state.arrivals.push(arrival); else this.state.arrivals[at] = arrival;
      if (fresh) { const s = B.DEEP_STATIONS[id]; this.events.push({ title: s.reward, text: s.text + ' Otis can send you back to this landing from Bell Works. E at the station resets its landing point.' }); }
      return true;
    }
    travel(id, player, expedition) {
      const p = this.state.arrivals.find(p => p.id === id);
      if (!p || !this.state.repaired.includes(id) || player.y < -.5 || expedition.tether !== null || player.blocked(p.x, p.y, p.z)) return false;
      player.teleport(p.x, p.y, p.z); player.yaw = p.yaw; player.pitch = p.pitch; return true;
    }
    update(dt, player) {
      let changed = this.physics.update(dt); this.elapsed += dt;
      if (this.elapsed > .35) { this.elapsed = 0; for (const n of this.nodes) if (!this.state.known.includes(n.id) && distance(player.head, n) < 6 && this.world.clearLine(player.head, n, .15)) { this.state.known.push(n.id); changed = true; } }
      return changed;
    }
    scan(head, range) { const nodes = this.nodes.filter(n => distance(head, n) <= range); for (const n of nodes) if (!this.state.known.includes(n.id)) this.state.known.push(n.id); return nodes; }
    target() {
      if (!this.world.depthVersion || !this.progress.expedition.awakened) return null;
      if (!this.state.open) return { ...B.DEEP_GATE, name: 'Open the rootway', brief: 'Aim at the ring beneath the heart and press E.' };
      const n = this.nodes.find(n => !this.state.repaired.includes(n.id)); return n ? { ...n, brief: 'Expose the station. Restore it with two lights and three charges.' } : { x: 0, y: -278, z: 0, name: 'The deep furnace', brief: 'Explore the chamber beneath the furnace approach.' };
    }
    markers() { return this.nodes.filter(n => this.state.known.includes(n.id)).map(n => ({ ...n, type: 'station', color: this.state.repaired.includes(n.id) ? '#8ce0c5' : n.color })); }
    save() { this.state.bodies = this.physics.snapshot(); }
  }
  Object.assign(B, { DeepExpedition, DEEP_STATION_SIZE: SIZE });
})(B2);
