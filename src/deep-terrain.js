/* Original lower workings. Versioned separately so old upper claims retain every sample. */
'use strict';
(function (B) {
  const DEEP_GATE = { x: 2, y: -69.1, z: 2 };
  const DEEP_STATIONS = [
    { id: 0, x: 5, y: -102, z: 4, name: 'Rootworks pump house', color: '#bfaa72', reward: 'Deep-bore gearing', text: 'The pump drives your cutter through dense lower rock. Mechanical excavation below 80 m gains double torque.' },
    { id: 1, x: -5, y: -178, z: 3, name: 'Ashfall exchange', color: '#d78666', reward: 'Overdrive coil', text: 'A surviving coil feeds the lift pack. Untethered lift speed below 80 m is at least 16 m/s.' },
    { id: 2, x: 4, y: -258, z: -4, name: 'Furnace approach', color: '#e9bf73', reward: 'Foundry receiver', text: 'The receiver reads dense strata. Deep scans gain another 12 metres. The oldest chamber lies below the approach.' }
  ];
  const DEEP_STRATA = [
    { depth: 80, name: 'The rootworks', subtitle: 'Your yard was the roof of something older.', color: '#baa275', unlock: 'Restore the buried pump house' },
    { depth: 128, name: 'Ashfall', subtitle: 'The machines burned. Their foundations did not.', color: '#d5896d', unlock: 'Find the exchange and its overdrive coil' },
    { depth: 208, name: 'The old foundry', subtitle: 'The heat has a rhythm.', color: '#dfb56f', unlock: 'Restore the foundry receiver' },
    { depth: 266, name: 'The furnace roots', subtitle: 'All of the roads end beneath the furnace.', color: '#e7bd85', unlock: 'Investigate the deep chamber' }
  ];
  class DeepTerrain {
    constructor(seed) {
      const rng = B.random(seed ^ 0x58ab6371); this.shapes = []; this.bins = new Map(); this.rooms = [];
      const add = shape => {
        this.shapes.push(shape); const lo = [], hi = [];
        for (const k of ['x', 'y', 'z']) { const r = shape.kind === 'room' ? shape['r' + k] : shape.r; lo.push((shape.kind === 'room' ? shape[k] : Math.min(shape.a[k], shape.b[k])) - r); hi.push((shape.kind === 'room' ? shape[k] : Math.max(shape.a[k], shape.b[k])) + r); }
        for (let z = Math.floor(lo[2] / 8); z <= Math.floor(hi[2] / 8); z++) for (let y = Math.floor(lo[1] / 8); y <= Math.floor(hi[1] / 8); y++) for (let x = Math.floor(lo[0] / 8); x <= Math.floor(hi[0] / 8); x++) { const key = x + ',' + y + ',' + z; if (!this.bins.has(key)) this.bins.set(key, []); this.bins.get(key).push(shape); }
      };
      for (const [id, depth] of [91, 134, 177, 220, 273].entries()) {
        const room = { kind: 'room', id, x: (rng() - .5) * 7, y: -depth, z: (rng() - .5) * 7, rx: 4 + rng(), ry: 3.5 + rng(), rz: 4 + rng() }; add(room); this.rooms.push(room);
        const loop = Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2; return { x: room.x + Math.cos(a) * 5, y: room.y + Math.sin(a) * 6, z: room.z + Math.sin(a) * 5 }; });
        for (let i = 0; i < loop.length; i++) add({ kind: 'tunnel', a: loop[i], b: loop[(i + 1) % loop.length], r: 1.5 + rng() * .3 });
        for (const i of [0, 3, 5]) add({ kind: 'tunnel', a: room, b: loop[i], r: 1.7 });
        add({ kind: 'room', x: loop[3].x, y: loop[3].y - 4, z: loop[3].z, rx: 2.4, ry: 5, rz: 2.4 });
      }
      // Station rooms and the first landing have authored clearances inside the seeded mine.
      for (const s of DEEP_STATIONS) add({ kind: 'room', x: s.x, y: s.y + 1, z: s.z, rx: 4.5, ry: 3.2, rz: 4.5 });
      add({ kind: 'room', x: 2, y: -86, z: 2, rx: 3.6, ry: 4.5, rz: 3.6 });
      add({ kind: 'tunnel', a: { x: 2, y: -85, z: 2 }, b: this.rooms[0], r: 1.9 });
      add({ kind: 'room', x: 0, y: -278, z: 0, rx: 10, ry: 6, rz: 10 });
    }
    density(x, y, z) {
      if (y >= -80 || y < -296 || Math.abs(x) > 13 || Math.abs(z) > 13) return -2;
      let density = -2;
      for (const s of this.bins.get(Math.floor(x / 8) + ',' + Math.floor(y / 8) + ',' + Math.floor(z / 8)) || []) {
        let d;
        if (s.kind === 'room') d = (1 - Math.hypot((x - s.x) / s.rx, (y - s.y) / s.ry, (z - s.z) / s.rz)) * Math.min(s.rx, s.ry, s.rz);
        else { const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, dz = s.b.z - s.a.z, t = B.clamp(((x - s.a.x) * dx + (y - s.a.y) * dy + (z - s.a.z) * dz) / (dx * dx + dy * dy + dz * dz || 1), 0, 1); d = s.r - Math.hypot(x - s.a.x - dx * t, y - s.a.y - dy * t, z - s.a.z - dz * t); }
        density = Math.max(density, d);
      }
      return density;
    }
  }
  function appendDeepDeposits(seed, nodes, veins) {
    const rng = B.random(seed ^ 0x7643971);
    for (let seam = 0; seam < 42; seam++) {
      const depth = 83 + rng() * 207, x = (rng() - .5) * 19, z = (rng() - .5) * 19, kind = depth > 180 || seam % 3 === 0 ? 4 : 3, id = veins.length;
      veins.push({ x, y: -depth, z, kind, radius: 3, name: depth < 128 ? 'Rootwork seam' : depth < 208 ? 'Ashfall seam' : 'Foundry seam' });
      for (let i = 0; i < 14; i++) nodes.push({ id: nodes.length, x: B.clamp(x + Math.sin(i * .55 + seam) * 1.5, -12, 12), y: -Math.min(294, depth + i * .38), z: B.clamp(z + Math.cos(i * .4) * 1.3, -12, 12), kind, vein: id, radius: .18 + rng() * .15, collected: false });
    }
  }
  Object.assign(B, { DeepTerrain, DEEP_GATE, DEEP_STATIONS, DEEP_STRATA, appendDeepDeposits });
})(B2);
