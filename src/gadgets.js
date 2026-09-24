/* Thrown charges and persistent, physical work lights. */
'use strict';
(function (B) {
  const CHARGES = {
    blast: { name: 'Blast charge', short: 'BLAST', depth: 0, cost: 1, fuse: 2.6, radius: 2.8, hint: 'A broad pocket. 2.6 s fuse.', color: '#efb665' },
    sticky: { name: 'Remote satchel', short: 'REMOTE', depth: 9, cost: 1, fuse: 0, radius: 3.2, hint: 'Sticks to rock. H detonates planted satchels.', color: '#ef9479' },
    bore: { name: 'Bore charge', short: 'BORE', depth: 25, cost: 2, fuse: 3.2, radius: 1.5, length: 6, hint: 'A 6 m directional tunnel. Uses 2 charges.', color: '#9bd6e3' }
  };
  class Gadgets {
    constructor(world, state, progress = { deepest: 0 }) {
      this.world = world; this.state = state; this.progress = progress; this.events = []; this.blasts = []; this.serial = 0;
      state.supplies ||= { bombs: 3, lights: 6 }; state.devices ||= [];
      state.chargeMode ||= 'blast';
      this.nodes = state.devices.map(d => ({ ...d, radius: .16, kind: 0, collected: false, offsets: Gadgets.offsets() }));
      this.physics = new B.OreSystem(world, this.nodes, state.devices);
      this.physics.onContact = (n, hit) => {
        if (n.type !== 'bomb' || !['sticky', 'bore'].includes(n.mode)) return false;
        const normal = world.normal(hit.x, hit.y, hit.z);
        n.anchor = { x: hit.x - normal[0] * .07, y: hit.y - normal[1] * .07, z: hit.z - normal[2] * .07 };
        n.vx = n.vy = n.vz = 0; n.motion = 'resting'; return true;
      };
      this.nextID = this.nodes.reduce((max, n) => Math.max(max, n.id + 1), 0);
    }
    spec(mode = this.state.chargeMode) {
      const spec = CHARGES[mode];
      if (!this.state.mysteries?.solved.includes(0)) return spec;
      return mode === 'bore' ? { ...spec, length: 9, hint: 'Aftershock: a 9 m tunnel. Uses 2 charges.' } : mode === 'sticky' ? { ...spec, radius: 3.6, hint: 'Aftershock: 3.6 m blast radius. H detonates satchels.' } : spec;
    }
    modes() { return Object.keys(CHARGES).filter(k => this.progress.deepest >= CHARGES[k].depth); }
    select(mode) { if (!this.modes().includes(mode)) return false; this.state.chargeMode = mode; return true; }
    get remoteCount() { return this.nodes.filter(n => n.type === 'bomb' && n.mode === 'sticky' && !n.triggered).length; }
    detonate() {
      const armed = this.nodes.filter(n => n.type === 'bomb' && n.mode === 'sticky' && !n.triggered);
      armed.forEach((n, i) => { n.triggered = true; n.fuse = .08 + i * .12; });
      if (armed.length) this.save(); return armed.length;
    }
    static offsets() { return [[0, 0, 0], [.16, 0, 0], [-.16, 0, 0], [0, .16, 0], [0, -.16, 0], [0, 0, .16], [0, 0, -.16]]; }
    placement(type, player) {
      if (!['bomb', 'lamp'].includes(type)) return { reason: 'Unknown field equipment.' };
      const key = type === 'bomb' ? 'bombs' : 'lights';
      const mode = this.state.chargeMode, spec = this.spec(mode), cost = type === 'bomb' ? spec.cost : 1;
      if (type === 'bomb' && !this.modes().includes(mode)) return { reason: `Reach ${spec.depth} m to unlock this charge.` };
      const p = player.head, d = player.direction, n = { id: this.nextID, type, radius: .16, kind: 0, collected: false, offsets: Gadgets.offsets(), x: p.x + d.x * .45, y: p.y + d.y * .45, z: p.z + d.z * .45, vx: d.x * (type === 'bomb' ? 7 : 2), vy: d.y * (type === 'bomb' ? 7 : 2) + 1.5, vz: d.z * (type === 'bomb' ? 7 : 2), fuse: type === 'bomb' ? spec.fuse : 0, motion: 'falling' };
      if (type === 'bomb') { n.mode = mode; if (mode === 'bore') n.direction = { ...d }; if (mode === 'sticky') n.triggered = false; }
      if (this.state.supplies[key] < cost) return { reason: type === 'bomb' ? cost > 1 ? 'Bore charges use 2 charges. Restock at the workshop.' : 'Out of charges. Restock at the workshop.' : 'Out of lights. Retrieve a placed lamp or restock.' };
      if (this.nodes.filter(n => n.type === type).length >= (type === 'lamp' ? 48 : 6)) return { reason: type === 'lamp' ? '48 lights deployed. Retrieve a lamp with E to move it.' : 'Six charges already deployed. H fires remote satchels.' };
      if (Math.abs(n.x) > 13.6 || Math.abs(n.z) > 13.6 || n.y > 19) return { reason: 'Deploy equipment inside the marked claim.' };
      if (this.physics.contact(n).density < -.004 || !this.world.clearLine(p, n, .01)) return { reason: 'No room to throw. Step back from the rock.' };
      return { body: n, reason: '' };
    }
    deploy(type, player) {
      const { body: n } = this.placement(type, player); if (!n) return false;
      const key = type === 'bomb' ? 'bombs' : 'lights';
      this.nextID++; this.state.supplies[key] -= type === 'bomb' ? CHARGES[n.mode].cost : 1; this.nodes.push(n); this.physics.index.move(n); this.physics.loose.add(n); this.physics.awake.add(n); this.save(); return true;
    }
    preview(player) {
      const { body: n, reason } = this.placement('bomb', player); if (!n) return { reason, points: [] };
      const spec = this.spec(n.mode), steps = Math.round((spec.fuse || 6) * 120), stride = Math.ceil(steps / 60), points = [{ x: n.x, y: n.y, z: n.z }];
      for (let i = 1; i <= steps; i++) { if (n.motion !== 'resting') this.physics.advance(n, 1 / 120); if (i % stride === 0 || i === steps || n.anchor) points.push({ x: n.x, y: n.y, z: n.z }); if (n.anchor) break; }
      return { points, end: points.at(-1), reason: '', radius: spec.radius, length: spec.length || 0, direction: n.direction, mode: n.mode };
    }
    lampTarget(head, direction) { return this.aimedDevice(head, direction, n => n.type === 'lamp'); }
    remoteTarget(head, direction) { return this.aimedDevice(head, direction, n => n.type === 'bomb' && n.mode === 'sticky' && !n.triggered); }
    aimedDevice(head, direction, matches) {
      let result = null, best = Infinity;
      for (const n of this.physics.index.query(head.x, head.y, head.z, 3)) {
        if (!matches(n)) continue;
        const dx = n.x - head.x, dy = n.y - head.y, dz = n.z - head.z, ahead = dx * direction.x + dy * direction.y + dz * direction.z;
        const miss = Math.hypot(dx - direction.x * ahead, dy - direction.y * ahead, dz - direction.z * ahead);
        if (ahead <= 0 || miss > .25 + ahead * .08 || miss >= best || !this.world.clearLine(head, n, .1)) continue;
        result = n; best = miss;
      }
      return result;
    }
    retrieve(id, head) {
      const n = this.nodes.find(n => n.id === id);
      if (!n || n.type !== 'lamp' || this.state.supplies.lights >= 99 || Math.hypot(n.x - head.x, n.y - head.y, n.z - head.z) > 3 || !this.world.clearLine(head, n, .1)) return false;
      this.state.supplies.lights++; this.remove(n); this.save(); return true;
    }
    disarm(id, head) {
      const n = this.nodes.find(n => n.id === id);
      if (!n || n.type !== 'bomb' || n.mode !== 'sticky' || n.triggered || this.state.supplies.bombs >= 99 || Math.hypot(n.x - head.x, n.y - head.y, n.z - head.z) > 3 || !this.world.clearLine(head, n, .1)) return false;
      this.state.supplies.bombs++; this.remove(n); this.save(); return true;
    }
    remove(n) { this.physics.awake.delete(n); this.physics.loose.delete(n); this.physics.index.remove(n); this.nodes.splice(this.nodes.indexOf(n), 1); }
    restock(type, economy) {
      if (!['bomb', 'lamp'].includes(type)) return false;
      const key = type === 'bomb' ? 'bombs' : 'lights', cost = type === 'bomb' ? 32 : 24, count = type === 'bomb' ? 3 : 6;
      if (economy.state.cash < cost || this.state.supplies[key] + count > 99) return false;
      economy.state.cash -= cost; this.state.supplies[key] += count; return true;
    }
    update(dt, ore, salvage, player) {
      for (const n of this.nodes) if (n.anchor) {
        if (this.world.density(n.anchor.x, n.anchor.y, n.anchor.z) < -.01) { n.motion = 'resting'; this.physics.awake.delete(n); }
        else { delete n.anchor; n.motion = 'falling'; this.physics.awake.add(n); }
      }
      let changed = this.physics.update(dt);
      for (const n of [...this.nodes]) if (n.type === 'bomb') {
        if (n.mode === 'sticky' && !n.triggered) continue;
        n.fuse -= dt; changed = true;
        if (n.fuse > 1e-9) continue;
        this.explode(n, this.spec(n.mode || 'blast'), ore, salvage, player);
        this.remove(n);
        this.events.push('blast');
      }
      if (changed) this.save(); return changed;
    }
    explode(n, spec, ore, salvage, player) {
      const centers = [n];
      if (spec.length) for (let distance = .6; distance <= spec.length + 1e-6; distance += .6) centers.push({ x: n.x + n.direction.x * distance, y: n.y + n.direction.y * distance, z: n.z + n.direction.z * distance });
      for (const p of centers) this.world.carve(p, spec.radius);
      this.blasts.push({ x: n.x, y: n.y, z: n.z, mode: n.mode || 'blast', radius: spec.radius, length: spec.length || 0, direction: n.direction, serial: ++this.serial });
      if (this.blasts.length > 32) this.blasts.shift();
      for (const physics of [ore, salvage]) if (physics) for (const o of physics.index.query(n.x, n.y, n.z, 5 + (spec.length || 0))) {
        const source = centers.reduce((a, b) => Math.hypot(o.x - a.x, o.y - a.y, o.z - a.z) < Math.hypot(o.x - b.x, o.y - b.y, o.z - b.z) ? a : b);
        if (o.motion === 'embedded' || !this.world.clearLine(source, o, .12)) continue;
        const dx = o.x - source.x, dy = o.y - source.y, dz = o.z - source.z, distance = Math.hypot(dx, dy, dz) || 1, force = Math.max(0, 1 - distance / (spec.radius + 2.2)) * 12;
        if (!force) continue;
        o.vx += dx / distance * force; o.vy += dy / distance * force + 3; o.vz += dz / distance * force;
        for (const k of ['vx', 'vy', 'vz']) o[k] = B.clamp(o[k], -18, 18);
        o.motion = 'falling'; physics.awake.add(o);
      }
      if (player) { const dx = player.x - n.x, dy = player.head.y - n.y, dz = player.z - n.z, distance = Math.hypot(dx, dy, dz); if (distance < 4 && this.world.clearLine(n, player.head, .2)) { const force = (1 - distance / 4) * 7; player.vx += dx / (distance || 1) * force; player.vy += 3 + force; player.vz += dz / (distance || 1) * force; } }
    }
    save() { this.state.devices = this.nodes.map(n => ({ id: n.id, type: n.type, x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz, fuse: n.fuse, ...(n.mode ? { mode: n.mode } : {}), ...(n.direction ? { direction: { ...n.direction } } : {}), ...(n.anchor ? { anchor: { ...n.anchor } } : {}), ...(n.mode === 'sticky' ? { triggered: !!n.triggered } : {}) })); }
  }
  Object.assign(B, { Gadgets, CHARGES });
})(B2);
