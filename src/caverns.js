/* Seeded natural passages. Version zero retains the original claim's exact base. */
'use strict';
(function (B) {
  const VERSION = 1;
  const THEMES = [
    { name: 'The lantern workings', x: 7, y: -14, z: 3, color: '#d7ac6d', growth: '#80956b' },
    { name: 'The chalk galleries', x: -7, y: -32, z: 6, color: '#a9d7d2', growth: '#c1d9cd' },
    { name: 'The violet undercroft', x: 5, y: -50, z: 7, color: '#c5acd9', growth: '#9e92bd' }
  ];
  class Caverns {
    constructor(seed, version = VERSION) {
      if (version !== 0 && version !== VERSION) throw new Error('Unsupported cave generation.');
      this.version = version; this.networks = []; this.shapes = []; this.bins = new Map();
      if (!version) return;
      const rng = B.random(seed ^ 0x6a39b2f1);
      const safe = p => ({ ...p, x: B.clamp(p.x, -11, 11), z: B.clamp(p.z, -11, 11) });
      for (let id = 0; id < THEMES.length; id++) {
        const theme = THEMES[id], angle = (rng() - .5) * .6, nodes = [];
        for (let j = 0; j < 7; j++) {
          const a = j / 7 * Math.PI * 2 + angle;
          nodes.push(safe({ x: theme.x + Math.cos(a) * (2.7 + rng() * .8), y: theme.y + Math.sin(a) * (2.1 + rng() * .6) + (rng() - .5) * .7, z: theme.z + Math.sin(a) * (3.1 + rng() * .8), r: 1.35 + rng() * .2 }));
        }
        const chamber = safe({ x: theme.x, y: theme.y, z: theme.z, rx: 3.15 + rng() * .35, ry: 2.3 + rng() * .25, rz: 2.9 + rng() * .4 });
        const branch = safe({ x: theme.x + (id === 1 ? 1 : -1) * 4.7, y: theme.y - 3.5, z: theme.z - 3.4, r: 1.6 });
        const chimney = safe({ x: nodes[1].x, y: nodes[1].y + 3.6, z: nodes[1].z, r: 1.15 });
        const network = { id, ...theme, chamber, nodes, branch, chimney, segments: [] }; this.networks.push(network);
        this.add({ kind: 'room', ...chamber, id });
        for (let j = 0; j < nodes.length; j++) {
          const a = nodes[j], b = nodes[(j + 1) % nodes.length], mid = safe({ x: (a.x + b.x) / 2 + (rng() - .5) * .7, y: (a.y + b.y) / 2 + (rng() - .5) * .5, z: (a.z + b.z) / 2 + (rng() - .5) * .7 });
          network.segments.push({ a, b: mid, r: a.r }, { a: mid, b, r: a.r });
        }
        for (const j of [0, 3, 5]) network.segments.push({ a: chamber, b: nodes[j], r: 1.5 });
        network.segments.push({ a: nodes[4], b: branch, r: 1.35 }, { a: nodes[1], b: chimney, r: 1.18 });
        for (const segment of network.segments) this.add({ kind: 'passage', ...segment, id });
        this.add({ kind: 'room', x: branch.x, y: branch.y, z: branch.z, rx: 1.9, ry: 1.8, rz: 2.1, id });
      }
    }
    add(shape) {
      const lo = [], hi = [];
      for (const k of ['x', 'y', 'z']) {
        const r = shape.kind === 'room' ? shape['r' + k] : shape.r;
        lo.push((shape.kind === 'room' ? shape[k] : Math.min(shape.a[k], shape.b[k])) - r);
        hi.push((shape.kind === 'room' ? shape[k] : Math.max(shape.a[k], shape.b[k])) + r);
      }
      shape.bounds = [lo, hi]; this.shapes.push(shape);
      for (let z = Math.floor(lo[2] / 4); z <= Math.floor(hi[2] / 4); z++) for (let y = Math.floor(lo[1] / 4); y <= Math.floor(hi[1] / 4); y++) for (let x = Math.floor(lo[0] / 4); x <= Math.floor(hi[0] / 4); x++) { const key = x + ',' + y + ',' + z; if (!this.bins.has(key)) this.bins.set(key, []); this.bins.get(key).push(shape); }
    }
    density(x, y, z) {
      if (!this.version || y > -7 || y < -60 || Math.abs(x) > 13.2 || Math.abs(z) > 13.2) return -2;
      // Keep the machinery and authored puzzle shells unchanged. Natural corridors lie around them.
      for (const r of B.RELICS) if (Math.hypot(x - r.x, y - r.y, z - r.z) < 4.2) return -2;
      let best = -2;
      for (const s of this.bins.get(Math.floor(x / 4) + ',' + Math.floor(y / 4) + ',' + Math.floor(z / 4)) || []) {
        let value;
        if (s.kind === 'room') value = (1 - Math.hypot((x - s.x) / s.rx, (y - s.y) / s.ry, (z - s.z) / s.rz)) * Math.min(s.rx, s.ry, s.rz);
        else {
          const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, dz = s.b.z - s.a.z, t = B.clamp(((x - s.a.x) * dx + (y - s.a.y) * dy + (z - s.a.z) * dz) / (dx * dx + dy * dy + dz * dz || 1), 0, 1);
          value = s.r - Math.hypot(x - s.a.x - dx * t, y - s.a.y - dy * t, z - s.a.z - dz * t);
        }
        best = Math.max(best, value);
      }
      // Gentle wall variation retains broad passages and a smooth centerline.
      if (best > -.35 && best < .4) best += .065 * Math.sin(x * 3.7 + Math.sin(y * 1.3)) * Math.sin(z * 2.6 + y * .9);
      return best;
    }
  }
  Object.assign(B, { Caverns, CAVE_VERSION: VERSION });
})(B2);
