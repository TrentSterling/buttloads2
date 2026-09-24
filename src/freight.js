/* Persistent crane and physical freight route. Ore stays accounted for in transit. */
'use strict';
(function (B) {
  const FREIGHT = { price: 180, upgrade: 420, capacities: [24, 64], speed: 5, top: 3.2, depot: 14.7, size: .88 };
  const empty = () => B.ORES.map(() => 0), count = a => a.reduce((n, v) => n + v, 0), value = a => a.reduce((n, v, i) => n + v * B.ORES[i].value, 0);
  const offsets = B.boxOffsets([FREIGHT.size, FREIGHT.size, FREIGHT.size]);
  class Freight {
    constructor(world, economy) {
      this.world = world; this.economy = economy;
      this.state = economy.state.expedition.freight ||= { version: 1, owned: false, upgraded: false, dock: null, travel: 0, phase: 'idle', load: empty(), stock: empty() };
      this.accumulator = 0; this.obstruction = null; this.blockedBy = ''; this.events = []; this.revision = 0;
    }
    static length(dock) { return FREIGHT.top - dock.y - .85 + FREIGHT.depot - dock.x; }
    static position(s, travel = s.travel) {
      if (!s.dock) return null;
      const d = s.dock, rise = FREIGHT.top - d.y - .85;
      return travel <= rise ? { x: d.x, y: d.y + .85 + travel, z: d.z } : { x: d.x + travel - rise, y: FREIGHT.top, z: d.z };
    }
    static contact(world, p) {
      let worst = { ...p, density: Infinity };
      for (const o of offsets) { const q = { x: p.x + o[0], y: p.y + o[1], z: p.z + o[2] }, density = world.density(q.x, q.y, q.z); if (density < worst.density) worst = { ...q, density }; }
      return worst;
    }
    static validate(s, progress, world) {
      const inventory = a => Array.isArray(a) && a.length === B.ORES.length && a.every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1e9);
      if (!s || s.version !== 1 || typeof s.owned !== 'boolean' || typeof s.upgraded !== 'boolean' || (s.owned && !progress.expedition?.recovered?.includes(0)) || (s.upgraded && (!s.owned || !progress.expedition?.recovered?.includes(1))) || !inventory(s.load) || !inventory(s.stock) || count(s.load) > FREIGHT.capacities[+s.upgraded] || !Number.isFinite(s.travel) || s.travel < 0 || !['idle', 'outbound', 'returning'].includes(s.phase)) throw new Error('Invalid freight equipment.');
      if (!s.owned && (s.dock || s.upgraded || count(s.load) || count(s.stock))) throw new Error('Unowned freight equipment contains cargo.');
      if (s.dock !== null) {
        const d = s.dock;
        if (!d || !['x', 'y', 'z'].every(k => Number.isFinite(d[k])) || Math.abs(d.x) > 12 || Math.abs(d.z) > 12 || d.y < (world?.floor ?? B.DEPTHS[1].floor) + .3 || d.y > -3 || s.travel > Freight.length(d) + 1e-6) throw new Error('Invalid freight route.');
        if (world && Freight.contact(world, Freight.position(s)).density < -.01) throw new Error('Freight cage is inside terrain.');
      } else if (s.phase !== 'idle' || s.travel !== 0 || count(s.load)) throw new Error('Freight has no loading dock.');
      if ((s.phase === 'idle' && s.travel !== 0) || (s.phase === 'outbound' && !count(s.load))) throw new Error('Inconsistent freight journey.');
      return { version: 1, owned: s.owned, upgraded: s.upgraded, dock: s.dock ? { x: s.dock.x, y: s.dock.y, z: s.dock.z } : null, travel: s.travel, phase: s.phase, load: [...s.load], stock: [...s.stock] };
    }
    get capacity() { return FREIGHT.capacities[+this.state.upgraded]; }
    get loadCount() { return count(this.state.load); }
    get stockCount() { return count(this.state.stock); }
    get stockValue() { return value(this.state.stock); }
    get cage() { return Freight.position(this.state); }
    buy() {
      const s = this.state, p = this.economy.state, cost = s.owned ? FREIGHT.upgrade : FREIGHT.price;
      if (!p.expedition.recovered.includes(s.owned ? 1 : 0) || s.upgraded || p.cash < cost) return false;
      p.cash -= cost; if (s.owned) s.upgraded = true; else s.owned = true; this.revision++; return true;
    }
    placement(player) {
      if (!this.state.owned) return { reason: 'Recover the flywheel, then buy a freight crane at the workshop.' };
      if (this.state.dock) return { reason: 'Pack the existing loading dock before moving the crane.' };
      const hit = this.world.ray(player.head, player.direction, 5.5);
      if (!hit || this.world.normal(hit.x, hit.y, hit.z)[1] < .55) return { reason: 'Aim at the floor of an open chamber.' };
      const dock = { x: hit.x, y: hit.y + .4, z: hit.z };
      if (Math.abs(dock.x) > 12 || Math.abs(dock.z) > 12 || dock.y > -3 || dock.y < this.world.floor + .3) return { reason: 'Place the dock below 3 m, away from the claim boundary.' };
      if (Math.hypot(dock.x - player.x, dock.z - player.z) < 1.3) return { reason: 'Leave room in front of you for the loading cage.', dock };
      for (const o of B.boxOffsets([1.4, 1.6, 1.4])) if (this.world.density(dock.x + o[0], dock.y + .8 + o[1], dock.z + o[2]) < -.004) return { reason: 'Clear a 1.4 m wide loading bay around the preview.', dock };
      const probe = { dock, travel: 0 }, obstruction = this.routeObstruction(probe);
      return { dock, reason: '', obstruction };
    }
    routeObstruction(s = this.state) {
      if (!s.dock) return null;
      const rise = FREIGHT.top - s.dock.y - .85;
      for (let t = 0; t <= rise; t += .2) { const hit = Freight.contact(this.world, Freight.position(s, t)); if (hit.density < -.004) return hit; }
      return null;
    }
    place(player) {
      const p = this.placement(player); if (p.reason) return false;
      this.state.dock = p.dock; this.state.travel = 0; this.obstruction = p.obstruction; this.state.phase = 'idle'; this.revision++; return true;
    }
    near(player) {
      const d = this.state.dock; if (!d) return false;
      const target = { x: d.x, y: d.y + .9, z: d.z }, h = player.head;
      return Math.hypot(h.x - target.x, h.y - target.y, h.z - target.z) <= 3.4 && this.world.clearLine(h, target, .15);
    }
    send(player) {
      if (!this.near(player) || this.state.phase !== 'idle') return false;
      let free = this.capacity - this.loadCount; const cargo = this.economy.state.cargo;
      // Ship the highest-value minerals first if the pack exceeds the cage capacity.
      for (let i = cargo.length - 1; i >= 0; i--) { const n = Math.min(free, cargo[i]); cargo[i] -= n; this.state.load[i] += n; free -= n; }
      if (!this.loadCount) return false;
      this.state.phase = 'outbound'; this.obstruction = null; this.blockedBy = ''; this.revision++; return true;
    }
    recall(player) { if (!this.near(player) || this.state.phase !== 'outbound') return false; this.state.phase = 'returning'; this.revision++; return true; }
    take(player) {
      if (!this.near(player) || this.state.phase !== 'idle' || !this.loadCount) return false;
      let free = this.economy.capacity - this.economy.count, moved = 0;
      for (let i = this.state.load.length - 1; i >= 0; i--) { const n = Math.min(free, this.state.load[i]); this.state.load[i] -= n; this.economy.state.cargo[i] += n; moved += n; free -= n; }
      if (moved) this.revision++; return moved > 0;
    }
    pack(player) { if (!this.near(player) || this.state.phase !== 'idle' || this.loadCount) return false; this.state.dock = null; this.obstruction = null; this.revision++; return true; }
    obstacles() {
      const d = this.state.dock; if (!d) return [];
      const c = this.cage, h = FREIGHT.size / 2;
      return [[d.x - .7, d.y, d.z - .7, d.x + .7, d.y + .16, d.z + .7], [c.x - h, c.y - h, c.z - h, c.x + h, c.y + h, c.z + h], [-15, 0, d.z - .35, -14.4, 4.5, d.z + .35], [14.4, 0, d.z - .35, 15, 4.5, d.z + .35], [-15, 4.1, d.z - .2, 15, 4.55, d.z + .2]];
    }
    movingContact(p, player, bodies) {
      const h = FREIGHT.size / 2;
      if (player && Math.abs(player.x - p.x) < h + player.radius && Math.abs(player.z - p.z) < h + player.radius && player.y < p.y + h && player.y + player.height > p.y - h) return 'Stand clear of the cage';
      for (const b of bodies || []) if (!b.collected && Math.abs(b.x - p.x) < h + b.size[0] / 2 && Math.abs(b.y - p.y) < h + b.size[1] / 2 && Math.abs(b.z - p.z) < h + b.size[2] / 2) return 'Salvage blocks the cage';
      return '';
    }
    update(dt, player, bodies) {
      const s = this.state;
      if (!s.dock || s.phase === 'idle') {
        this.accumulator = 0; this.blockedBy = '';
        if (!s.dock) this.obstruction = null;
        else if (this.routeRevision !== this.world.revision) { this.routeRevision = this.world.revision; this.obstruction = this.routeObstruction(); }
        return false;
      }
      let changed = false; this.accumulator += dt; this.obstruction = null; this.blockedBy = '';
      while (this.accumulator >= 1 / 120) {
        this.accumulator -= 1 / 120;
        if (s.phase === 'idle') break;
        const total = Freight.length(s.dock), next = B.clamp(s.travel + (s.phase === 'outbound' ? 1 : -1) * FREIGHT.speed / 120, 0, total), p = Freight.position(s, next), hit = Freight.contact(this.world, p);
        if (hit.density < -.004) { this.obstruction = hit; this.blockedBy = 'Rock blocks the cage'; continue; }
        this.blockedBy = this.movingContact(p, player, bodies); if (this.blockedBy) continue;
        s.travel = next; changed = true;
        if (s.phase === 'outbound' && next >= total) {
          const shipped = this.loadCount; s.load.forEach((n, i) => { s.stock[i] += n; s.load[i] = 0; }); s.phase = 'returning';
          this.events.push({ text: `${shipped} minerals delivered to the yard. Sell them at the hopper when you return.`, tone: 960 });
        } else if (s.phase === 'returning' && next <= 0) { s.phase = 'idle'; this.routeRevision = -1; this.events.push({ text: this.loadCount ? 'The cage is back with its cargo.' : 'Freight cage ready for another haul.', tone: 660 }); }
      }
      if (changed) this.revision++; return changed;
    }
    status() { if (!this.state.owned) return 'Recover the survey flywheel to unlock'; if (!this.state.dock) return 'Hold T to place a loading dock'; return this.blockedBy || (this.state.phase === 'idle' ? this.loadCount ? 'Cargo recalled. Send or take it back' : 'Cage ready at loading dock' : this.state.phase === 'outbound' ? 'Hauling to the yard' : 'Cage returning'); }
  }
  Object.assign(B, { Freight, FREIGHT });
})(B2);
