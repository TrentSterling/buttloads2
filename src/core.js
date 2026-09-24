/* BUTTLOADS 2. Copyright 2026 Trent Sterling. MIT. */
'use strict';
globalThis.B2 = globalThis.B2 || {};
(function (B) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function random(seed) {
    let s = seed >>> 0;
    return () => { s += 0x6d2b79f5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const WORLD = Object.freeze({ min: -16, max: 16, bottom: -80, top: 2, step: .5, cells: 16, size: 8, limit: 14, floor: -73 });
  const DEPTHS = Object.freeze([{ bottom: -80, floor: -73, ny: 165 }, { bottom: -304, floor: -297, ny: 613 }]);
  B.DEPTHS = DEPTHS; B.DEPTH_VERSION = 1;
  const ORES = Object.freeze([
    { name: 'Copper', value: 8, color: '#e78c47', depth: 0 },
    { name: 'Iron', value: 18, color: '#becbd1', depth: 9 },
    { name: 'Silver', value: 38, color: '#99c8df', depth: 23 },
    { name: 'Gold', value: 85, color: '#ffd063', depth: 38 },
    { name: 'Prism', value: 180, color: '#8bf2ca', depth: 53 }
  ]);
  const GEAR = Object.freeze({
    drill: { name: 'Cutter', description: 'A wider bite. More torque through deep rock.', costs: [64, 260, 900, 2400], values: [.9, 1.15, 1.45, 1.8, 2.15], power: [2.8, 4.6, 7.5, 12, 19], unit: 'm radius' },
    cargo: { name: 'Cargo rack', description: 'Bring more of the good stuff home.', costs: [80, 300, 1000, 2600], values: [12, 24, 40, 64, 96], unit: 'minerals' },
    scanner: { name: 'Geological scanner', description: 'See deposits and buried machinery through rock.', costs: [100, 380, 1200], values: [10, 18, 28, 42], unit: 'm range' },
    lift: { name: 'Lift pack', description: 'Faster climbs, from any depth. Always fuel-free.', costs: [80, 300, 950], values: [6, 9, 13, 18], unit: 'm/s lift' }
  });
  const RELICS = Object.freeze([
    { name: 'The survey bell', x: -4, y: -13, z: 1, text: 'A survey bell, still ticking. Someone mapped this place before there was a yard.', reward: 100 },
    { name: 'The buried engine', x: 5, y: -33, z: -4, text: 'The engine has no fuel line. Its flywheel turns toward something below.', reward: 350 },
    { name: 'The listening room', x: -3, y: -53, z: -1, text: 'Three receivers. One signal. The machine at the bottom is listening back.', reward: 800 },
    { name: 'The heart of the claim', x: 2, y: -68, z: 2, text: 'It was never a mineral deposit. Bring the heart back to the surface.', reward: 3000 }
  ]);
  const CONTRACTS = Object.freeze([
    { name: 'First honest haul', text: 'Sell 8 copper', kind: 0, count: 8, depth: 0, reward: 48 },
    { name: 'Something stronger', text: 'Sell 12 iron and reach 18 m', kind: 1, count: 12, depth: 18, reward: 180 },
    { name: 'Under the limestone', text: 'Sell 10 silver and reach 35 m', kind: 2, count: 10, depth: 35, reward: 450 },
    { name: 'Worth its weight', text: 'Sell 10 gold and reach 50 m', kind: 3, count: 10, depth: 50, reward: 1000 },
    { name: 'Light in the dark', text: 'Sell 8 prisms and recover the heart', kind: 4, count: 8, depth: 65, reward: 2000, core: true }
  ]);
  function freshState(seed = 260923) {
    return { seed: seed >>> 0, cash: 0, cargo: [0, 0, 0, 0, 0], sold: [0, 0, 0, 0, 0], gear: { drill: 0, cargo: 0, scanner: 0, lift: 0 }, contracts: 0, relics: [], paidRelics: [], core: false, won: false, deepest: 0, seconds: 0, trips: 0, earned: 0, mined: 0, expedition: { version: 1, tool: 'cutter', recovered: [], runes: [], awakened: false, vaults: [], bodies: [], anchor: null } };
  }
  class Economy {
    constructor(state = freshState()) { this.state = state; }
    get count() { return this.state.cargo.reduce((a, b) => a + b, 0); }
    get capacity() { return GEAR.cargo.values[this.state.gear.cargo]; }
    get value() { return this.state.cargo.reduce((a, b, i) => a + b * ORES[i].value, 0); }
    get saleCount() { return this.count + (this.state.expedition.freight?.stock.reduce((a, n) => a + n, 0) || 0); }
    get saleValue() { return this.value + (this.state.expedition.freight?.stock.reduce((a, n, i) => a + n * ORES[i].value, 0) || 0); }
    collect(kind) { if (!ORES[kind] || this.count >= this.capacity) return false; this.state.cargo[kind]++; this.state.mined++; return true; }
    buy(key) {
      const gear = GEAR[key]; if (!gear) return false;
      const level = this.state.gear[key], cost = gear.costs[level];
      if (cost === undefined || this.state.cash < cost) return false;
      this.state.cash -= cost; this.state.gear[key]++; return true;
    }
    sell() {
      const s = this.state, receipt = { minerals: this.saleValue, bonus: 0, count: this.saleCount, contracts: [], relics: [], won: false };
      const stock = s.expedition.freight?.stock;
      s.cargo.forEach((n, i) => { s.sold[i] += n + (stock?.[i] || 0); s.cargo[i] = 0; if (stock) stock[i] = 0; });
      for (const id of s.relics) if (!s.paidRelics.includes(id)) { receipt.bonus += RELICS[id].reward; receipt.relics.push(id); s.paidRelics.push(id); }
      if (s.core && !s.won) { s.won = true; receipt.won = true; receipt.bonus += RELICS[3].reward; }
      // One starter grant. Subsequent rewards come from physical recoveries, not sale quotas.
      if (s.contracts === 0 && s.sold[0] >= 8) { receipt.bonus += 48; receipt.contracts.push('First haul grant'); s.contracts = 1; }
      const total = receipt.minerals + receipt.bonus; s.cash += total; s.earned += total;
      if (receipt.count || total) s.trips++;
      return receipt;
    }
  }
  function geology(y) {
    const depth = -y;
    if (depth < 9) return { name: 'Topsoil', resistance: 1, color: [123, 85, 54] };
    if (depth < 25) return { name: 'Red clay', resistance: 1.65, color: [171, 88, 53] };
    if (depth < 43) return { name: 'Limestone', resistance: 2.8, color: [134, 140, 132] };
    if (depth < 59) return { name: 'Basalt', resistance: 4.8, color: [66, 77, 87] };
    if (depth < 80) return { name: 'Prismatic rock', resistance: 7, color: [66, 94, 89] };
    if (depth < 128) return { name: 'The rootworks', resistance: 8, color: [106, 98, 63] };
    if (depth < 208) return { name: 'Ashfall', resistance: 9, color: [105, 65, 58] };
    if (depth < 266) return { name: 'The old foundry', resistance: 10, color: [72, 76, 85] };
    return { name: 'The furnace roots', resistance: 11, color: [98, 59, 48] };
  }
  function generateDeposits(seed, depthVersion = 0) {
    const rng = random(seed ^ 0x9e3779b9), nodes = [], veins = [];
    const add = (x, y, z, kind, vein) => nodes.push({ id: nodes.length, x, y, z, kind, vein, radius: .18 + rng() * .15, collected: false });
    // A readable first seam directly in front of the spawn; enough for an upgrade.
    for (let i = 0; i < 18; i++) add((i % 6 - 2.5) * .46, -.55 - Math.floor(i / 6) * .65, 7 - Math.floor(i / 6) * .35, 0, -1);
    for (let n = 0; n < 160; n++) {
      let depth = 2 + rng() * 69, x = (rng() - .5) * 23, z = (rng() - .5) * 23;
      const kind = Math.max(0, ORES.findLastIndex(o => depth >= o.depth + 1));
      const vein = { x, y: -depth, z, kind, radius: 2.2 }; veins.push(vein);
      const dx = (rng() - .5) * .65, dz = (rng() - .5) * .65;
      for (let j = 0, count = 5 + Math.floor(rng() * 5); j < count; j++) {
        add(clamp(x, -12, 12), -clamp(depth, 1, 71), clamp(z, -12, 12), kind, n);
        x += dx + (rng() - .5) * .5; z += dz + (rng() - .5) * .5; depth += (rng() - .35) * .8;
      }
    }
    // Append only: old saved ore IDs retain their mineral and original position.
    // Long descending seams split around machinery, with a rich pocket at each fork.
    const seams = [
      { start: [0, -3, 6], end: [-4, -13, 1], kind: 0, name: 'The copper ribbon' },
      { start: [-4, -17, 1], end: [5, -33, -4], kind: 1, name: 'Rustwater fault' },
      { start: [5, -36, -4], end: [-3, -53, -1], kind: 2, name: 'The silver roots' },
      { start: [-3, -55, -1], end: [2, -68, 2], kind: 4, name: 'Heartglass' }
    ];
    for (const seam of seams) {
      const id = veins.length, points = [], steps = 34;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps, x = seam.start[0] + (seam.end[0] - seam.start[0]) * t + Math.sin(t * 8) * 1.4;
        const y = seam.start[1] + (seam.end[1] - seam.start[1]) * t, z = seam.start[2] + (seam.end[2] - seam.start[2]) * t + Math.sin(t * 6) * 1.2;
        points.push({ x, y, z }); add(x, y, z, seam.kind, id);
        if (j === 13 || j === 24) for (let branch = 1; branch <= 9; branch++) {
          const side = j === 13 ? -1 : 1;
          add(clamp(x + branch * .35 * side, -12, 12), y - branch * .12, clamp(z + branch * .23, -12, 12), Math.min(4, seam.kind + 1), id);
        }
      }
      veins.push({ ...points[0], kind: seam.kind, radius: 3, name: seam.name, points });
    }
    // Append-only rich pockets around natural explosive seams. Existing deposit IDs stay fixed.
    for (const stone of B.THUNDERSTONES || []) {
      const id = veins.length;
      veins.push({ x: stone.x, y: stone.y, z: stone.z, kind: stone.kind, radius: 2, name: 'Thunderstone pocket' });
      for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; add(stone.x + Math.cos(a) * .85, stone.y - .7, stone.z + Math.sin(a) * .85, stone.kind, id); }
    }
    if (depthVersion) B.appendDeepDeposits(seed, nodes, veins);
    return { nodes, veins };
  }
  class SpatialIndex {
    constructor(items, size = 4) { this.size = size; this.cells = new Map(); this.locations = new WeakMap(); for (const item of items) this.move(item); }
    key(x, y, z) { return `${Math.floor(x / this.size)},${Math.floor(y / this.size)},${Math.floor(z / this.size)}`; }
    move(item) {
      const key = this.key(item.x, item.y, item.z); if (key === this.locations.get(item)) return;
      this.remove(item); if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(item); this.locations.set(item, key);
    }
    remove(item) {
      const key = this.locations.get(item), cell = this.cells.get(key); if (!cell) return;
      const at = cell.indexOf(item); if (at >= 0) cell.splice(at, 1);
      if (!cell.length) this.cells.delete(key); this.locations.delete(item);
    }
    query(x, y, z, r) {
      const out = [], n = this.size;
      for (let iz = Math.floor((z - r) / n); iz <= Math.floor((z + r) / n); iz++) for (let iy = Math.floor((y - r) / n); iy <= Math.floor((y + r) / n); iy++) for (let ix = Math.floor((x - r) / n); ix <= Math.floor((x + r) / n); ix++) {
        for (const item of this.cells.get(`${ix},${iy},${iz}`) || []) if ((item.x - x) ** 2 + (item.y - y) ** 2 + (item.z - z) ** 2 <= r * r) out.push(item);
      }
      return out;
    }
  }
  Object.assign(B, { clamp, random, WORLD, ORES, GEAR, RELICS, CONTRACTS, freshState, Economy, geology, generateDeposits, SpatialIndex });
})(B2);
