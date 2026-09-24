/* Surface Nets with stable cell addresses and dense, swap-removed face slots.
   Architecture informed by Tront Terrain Lab (MIT); new standalone kernel. */
'use strict';
(function (B) {
  function createMesher() {
    const N = 16, C = N + 1, M = N + 2, cap = C ** 3, edges = [];
    for (let a = 0; a < 8; a++) for (let axis = 0; axis < 3; axis++) { const b = a ^ (1 << axis); if (a < b) edges.push([a, b]); }
    const cellId = (x, y, z) => x + 1 + (y + 1) * C + (z + 1) * C * C;
    const sampleId = (x, y, z) => x + 1 + (y + 1) * M + (z + 1) * M * M;
    const srgb = n => { n /= 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; };
    function color(x, y, z, ny) {
      const d = -y + Math.sin(x * .24 + z * .17) * .7;
      let c = d < .5 && ny > .4 ? [125, 144, 62] : d < 9 ? [137, 95, 59] : d < 25 ? [181, 96, 59] : d < 43 ? [151, 155, 142] : d < 59 ? [78, 88, 103] : d < 80 ? [77, 113, 104] : d < 128 ? [117, 110, 74] : d < 208 ? [120, 75, 69] : d < 266 ? [82, 88, 103] : [115, 71, 55];
      const band = .91 + .09 * Math.sin(y * 3.1 + Math.sin(x * .4) + Math.sin(z * .3));
      return c.map(v => srgb(v) * band);
    }
    function cell(s, x, y, z) {
      const id = cellId(x, y, z), j = id * 3, v = s.scratch;
      let mask = 0;
      for (let c = 0; c < 8; c++) { v[c] = s.samples[sampleId(x + (c & 1), y + ((c >> 1) & 1), z + (c >> 2))]; if (v[c] < 0) mask |= 1 << c; }
      s.active[id] = mask !== 0 && mask !== 255 ? 1 : 0;
      if (!s.active[id]) return;
      let px = 0, py = 0, pz = 0, crossings = 0;
      for (const [a, b] of edges) {
        if ((v[a] < 0) === (v[b] < 0)) continue;
        const t = v[a] / (v[a] - v[b]);
        px += (a & 1) + t * ((b & 1) - (a & 1)); py += ((a >> 1) & 1) + t * (((b >> 1) & 1) - ((a >> 1) & 1)); pz += (a >> 2) + t * ((b >> 2) - (a >> 2)); crossings++;
      }
      px /= crossings; py /= crossings; pz /= crossings;
      let nx = 0, ny = 0, nz = 0;
      for (let c = 0; c < 8; c++) {
        const wx = c & 1 ? px : 1 - px, wy = c & 2 ? py : 1 - py, wz = c & 4 ? pz : 1 - pz;
        nx += v[c] * (c & 1 ? 1 : -1) * wy * wz;
        ny += v[c] * (c & 2 ? 1 : -1) * wx * wz;
        nz += v[c] * (c & 4 ? 1 : -1) * wx * wy;
      }
      const len = Math.hypot(nx, ny, nz) || 1; nx /= len; ny /= len; nz /= len;
      const wx = s.origin[0] + (x + px) * .5, wy = s.origin[1] + (y + py) * .5, wz = s.origin[2] + (z + pz) * .5;
      s.positions.set([wx, wy, wz], j); s.normals.set([nx, ny, nz], j); s.colors.set(color(wx, wy, wz, ny), j);
      s.vertexMin = Math.min(s.vertexMin, j); s.vertexMax = Math.max(s.vertexMax, j + 3);
    }
    function face(s, eid, corners) {
      let slot = s.edgeSlots[eid];
      if (!corners) {
        if (slot < 0) return;
        const last = --s.count; s.edgeSlots[eid] = -1;
        if (slot !== last) { s.owners[slot] = s.owners[last]; s.edgeSlots[s.owners[slot]] = slot; s.indices.copyWithin(slot * 6, last * 6, last * 6 + 6); s.indexMin = Math.min(s.indexMin, slot * 6); s.indexMax = Math.max(s.indexMax, slot * 6 + 6); }
        return;
      }
      if (corners.some(c => !s.active[c])) throw new Error('Surface topology references an inactive cell');
      if (slot < 0) { slot = s.count++; s.edgeSlots[eid] = slot; s.owners[slot] = eid; }
      const [a, b, c, d] = corners;
      s.indices.set([a, b, c, a, c, d], slot * 6);
      s.indexMin = Math.min(s.indexMin, slot * 6); s.indexMax = Math.max(s.indexMax, slot * 6 + 6);
    }
    function edge(s, x, y, z) {
      const p = [x, y, z], a = s.samples[sampleId(x, y, z)];
      for (let axis = 0; axis < 3; axis++) {
        const end = p.slice(); end[axis]++;
        const eid = (x + y * N + z * N * N) * 3 + axis;
        if ((a < 0) === (s.samples[sampleId(...end)] < 0)) { face(s, eid, null); continue; }
        const u = (axis + 1) % 3, v = (axis + 2) % 3, b = p.slice(), c = p.slice(), d = p.slice(); b[u]--; c[u]--; c[v]--; d[v]--;
        const corners = [cellId(...p), cellId(...b), cellId(...c), cellId(...d)];
        if (a >= 0) corners.reverse();
        face(s, eid, corners);
      }
    }
    function clear(s) { s.vertexMin = s.indexMin = Infinity; s.vertexMax = s.indexMax = 0; }
    function update(s, bounds) {
      // A sample changes its eight incident cells; changed cells affect incident edges.
      const lo = bounds.slice(0, 3).map(v => Math.max(-1, v - 1)), hi = bounds.slice(3).map(v => Math.min(N - 1, v));
      for (let z = lo[2]; z <= hi[2]; z++) for (let y = lo[1]; y <= hi[1]; y++) for (let x = lo[0]; x <= hi[0]; x++) cell(s, x, y, z);
      for (let z = Math.max(0, lo[2]); z <= Math.min(N - 1, hi[2] + 1); z++) for (let y = Math.max(0, lo[1]); y <= Math.min(N - 1, hi[1] + 1); y++) for (let x = Math.max(0, lo[0]); x <= Math.min(N - 1, hi[0] + 1); x++) edge(s, x, y, z);
    }
    function build(origin, samples) {
      const faces = N ** 3 * 3;
      const s = { origin, samples, positions: new Float32Array(cap * 3), normals: new Float32Array(cap * 3), colors: new Float32Array(cap * 3), active: new Uint8Array(cap), indices: new Uint16Array(faces * 6), edgeSlots: new Int32Array(faces).fill(-1), owners: new Int32Array(faces), scratch: new Float32Array(8), count: 0 };
      clear(s); update(s, [-1, -1, -1, N, N, N]); return s;
    }
    return { build, update, clear, sampleId, cellId, N, M, C };
  }
  B.createMesher = createMesher;
})(B2);
