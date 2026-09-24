/* A chart of the mine the player has actually explored, excavated or scanned. */
'use strict';
(function (B) {
  const N = 32, LEVELS = 74, COUNT = N * N * LEVELS;
  const SITE_KEYS = ['s0', 's1', 'r0', 'r1', 'r2', 'heart', 'v0', 'v1', 'v2'];
  const point = id => ({ x: id % N - 15.5, y: -Math.floor(id / (N * N)) - .5, z: Math.floor(id / N) % N - 15.5 });
  const cell = (x, depth, z) => x + N * z + N * N * depth;
  class Survey {
    constructor(world, state, deposits, expedition) {
      this.maxDepth = -world.floor; this.count = N * N * (this.maxDepth + 1); this.world = world; this.state = state; this.deposits = deposits; this.expedition = expedition;
      const fresh = !state.expedition.survey;
      this.data = state.expedition.survey ||= { version: 1, cells: [], ore: [], sites: [] };
      this.cells = new Set(this.data.cells); this.ore = new Set(this.data.ore); this.knownSites = new Set(this.data.sites);
      this.revision = 0; this.elapsed = 1;
      if (fresh) {
        for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) this.mark(cell(x, 0, z));
        // Existing claims can recover their own excavations without exposing untouched caves.
        for (let id = N * N; id < this.count; id++) { const p = point(id); if (world.density(p.x, p.y, p.z) >= 0 && world.base(p.x, p.y, p.z) < 0) this.mark(id); }
      }
      const before = world.onEdit;
      world.onEdit = (p, radius) => { before(p, radius); this.revealCut(p, radius); };
    }
    static validate(data, oreCount, world) {
      const count = N * N * (-(world?.floor ?? B.WORLD.floor) + 1);
      if (!data || data.version !== 1) throw new Error('Invalid mine survey.');
      const list = (key, valid, max) => { const a = data[key]; if (!Array.isArray(a) || a.length > max || new Set(a).size !== a.length || a.some(v => !valid(v))) throw new Error('Invalid survey ' + key + '.'); return [...a]; };
      return { version: 1, cells: list('cells', v => Number.isInteger(v) && v >= 0 && v < count, count), ore: list('ore', v => Number.isInteger(v) && v >= 0 && v < oreCount, oreCount), sites: list('sites', v => SITE_KEYS.includes(v), SITE_KEYS.length) };
    }
    mark(id) { if (this.cells.has(id)) return; this.cells.add(id); this.data.cells.push(id); this.revision++; }
    box(p, radius, visit) {
      const xmin = Math.max(0, Math.floor(p.x - radius + 16)), xmax = Math.min(31, Math.floor(p.x + radius + 16));
      const zmin = Math.max(0, Math.floor(p.z - radius + 16)), zmax = Math.min(31, Math.floor(p.z + radius + 16));
      const ymin = Math.max(0, Math.floor(-p.y - radius)), ymax = Math.min(this.maxDepth, Math.floor(-p.y + radius));
      for (let d = ymin; d <= ymax; d++) for (let z = zmin; z <= zmax; z++) for (let x = xmin; x <= xmax; x++) { const id = cell(x, d, z); if (!this.cells.has(id)) visit(id, point(id)); }
    }
    revealCut(p, radius) { this.box(p, radius + .7, (id, q) => { if (Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) <= radius + .7) this.mark(id); }); }
    sites() {
      const e = this.state.expedition;
      const out = this.expedition.bodies.filter(b => !b.collected).map(b => ({ ...b, key: 's' + b.id, type: 'salvage', color: '#efb564' }));
      B.RUNES.forEach((r, i) => { if (!e.runes.includes(i)) out.push({ ...r, key: 'r' + i, name: 'Seal stone ' + (i + 1), type: 'rune', color: '#bea8ec' }); });
      if (!e.awakened) out.push({ ...B.HEART, key: 'heart', name: 'The living heart', type: 'heart', color: '#83eacb' });
      if (this.state.deepest >= 59 || e.awakened) B.VAULTS.forEach((v, i) => { if (!e.vaults.includes(i)) out.push({ ...v, key: 'v' + i, type: 'vault', color: '#83eacb' }); });
      return out;
    }
    remember(site) { if (this.knownSites.has(site.key)) return; this.knownSites.add(site.key); this.data.sites.push(site.key); this.revision++; }
    update(dt, player) {
      this.elapsed += dt; if (this.elapsed < .35) return false; this.elapsed = 0; const before = this.revision, p = player.head;
      this.box(p, 4.5, (id, q) => { if (Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) <= 4.5 && this.world.clearLine(p, q, .45)) this.mark(id); });
      for (const site of this.sites()) if (Math.hypot(site.x - p.x, site.y - p.y, site.z - p.z) < 5 && this.world.density(site.x, site.y, site.z) > 0 && this.world.clearLine(p, site, .12)) this.remember(site);
      return before !== this.revision;
    }
    scan(head, range, nodes) {
      for (const n of nodes) if (!n.collected && !this.ore.has(n.id)) { this.ore.add(n.id); this.data.ore.push(n.id); this.revision++; }
      const found = this.sites().filter(p => Math.hypot(p.x - head.x, p.y - head.y, p.z - head.z) <= range);
      found.forEach(p => this.remember(p)); return found;
    }
    slice(depth) {
      const d = B.clamp(Math.round(depth), 0, this.maxDepth), out = new Uint8Array(N * N);
      for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const id = cell(x, d, z); if (!this.cells.has(id)) continue; const p = point(id); out[x + z * N] = this.world.density(p.x, p.y, p.z) >= 0 ? 2 : 1; }
      return out;
    }
    markers(game) {
      const markers = this.sites().filter(s => this.knownSites.has(s.key));
      for (const id of this.state.expedition.mysteries?.known || []) { const m = B.MYSTERIES[id]; if (!this.state.expedition.mysteries.solved.includes(id)) markers.push({ ...m, type: 'mystery' }); }
      for (const id of this.ore) { const n = this.deposits.nodes[id]; if (!n.collected && ((this.state.expedition.mysteries?.focus ?? -1) < 0 || n.kind === this.state.expedition.mysteries.focus)) markers.push({ ...n, name: B.ORES[n.kind].name, type: 'ore', color: B.ORES[n.kind].color }); }
      for (const n of game.gadgets.nodes) if (n.type === 'lamp') markers.push({ ...n, name: 'Work light', type: 'lamp', color: '#ffdb8b' });
      for (const n of game.gadgets.nodes) if (n.type === 'bomb' && n.mode === 'sticky') markers.push({ ...n, name: 'Remote satchel', type: 'charge', color: '#ef9479' });
      if (game.thunder) markers.push(...game.thunder.markers());
      if (game.crawlers) markers.push(...game.crawlers.markers());
      if (game.rescue) markers.push(...game.rescue.markers());
      if (game.foreman) markers.push(...game.foreman.markers());
      if (game.deep) markers.push(...game.deep.markers());
      if (game.refuges) markers.push(...game.refuges.markers());
      const freight = game.freight; if (freight?.state.dock) { markers.push({ ...freight.state.dock, name: 'Freight dock', type: 'freight', color: '#f0bf64' }); markers.push({ ...freight.cage, name: freight.status(), type: 'freight', color: '#91d8bd' }); }
      if (game.combat) markers.push(...game.combat.markers());
      const anchor = this.state.expedition.anchor; if (anchor) markers.push({ ...anchor, name: 'Return anchor', type: 'anchor', color: '#ffffff' });
      return markers;
    }
    render(depth, game) {
      const d = B.clamp(Math.round(depth), 0, this.maxDepth), tiles = this.slice(d), markers = this.markers(game), paths = ['', '', ''];
      const xy = p => ({ x: B.clamp((p.x + 16) * 20 + 32, 32, 672), y: B.clamp((p.z + 16) * 20 + 32, 32, 672) });
      for (let i = 0; i < tiles.length; i++) if (tiles[i]) paths[tiles[i]] += `M${32 + i % 32 * 20},${32 + Math.floor(i / 32) * 20}h20v20h-20z`;
      let map = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 704 704" role="img" aria-label="Surveyed tunnels at ${d} meters"><rect width="704" height="704" fill="#101b1b"/><path d="${paths[1]}" fill="#35413a"/><path d="${paths[2]}" fill="#768d7c"/>`;
      for (let i = 0; i <= 8; i++) { const n = 32 + i * 80; map += `<path d="M32 ${n}H672M${n} 32V672" stroke="#b6d0b7" stroke-opacity=".08" fill="none"/>`; }
      map += '<rect x="72" y="72" width="560" height="560" fill="none" stroke="#edbe60" stroke-opacity=".45" stroke-dasharray="9 7"/><g fill="#b8cbbd" font-family="Consolas,monospace" font-size="13"><text x="348" y="21">N</text><text x="348" y="697">S</text><text x="9" y="359">W</text><text x="684" y="359">E</text><text x="42" y="694">4 m</text></g>';
      for (const m of markers) if (Math.abs(-m.y - (d + .5)) <= 1.5) {
        const p = xy(m), r = m.type === 'ore' ? 3 : m.type === 'lamp' ? 5 : 9;
        map += `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${r}" fill="${m.color}" stroke="#10201a" stroke-width="2"><title>${m.name}</title></circle>`;
        if (m.type !== 'ore' && m.type !== 'lamp') map += `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="14" fill="none" stroke="${m.color}" opacity=".6"/>`;
      }
      const p = xy(game.player), visible = Math.abs(-game.player.head.y - d) < 3;
      map += `<g transform="translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${(-game.player.yaw * 180 / Math.PI).toFixed(2)})" opacity="${visible ? 1 : .4}"><path d="M0 -13L9 10L0 6L-9 10Z" fill="#ffffff" stroke="#142620" stroke-width="2"/></g></svg>`;
      // Vertical profile projects only surveyed air, so it cannot reveal untouched caves.
      const columns = new Set();
      for (const id of this.cells) { const q = point(id); if (this.world.density(q.x, q.y, q.z) >= 0) columns.add(id % 32 + Math.floor(id / 1024) * 32); }
      const scale = 370 / (this.maxDepth + 1);
      let profile = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 328 424" role="img" aria-label="East to west profile of explored passages"><rect width="328" height="424" fill="#101b1b"/>';
      for (const c of B.STRATA.filter(c => c.depth <= this.maxDepth)) { const y = 22 + c.depth * scale; profile += `<path d="M34 ${y}H310" stroke="${c.color}" opacity=".22"/><text x="3" y="${y + 4}" fill="#9cafa5" font-family="Consolas,monospace" font-size="10">${c.depth}m</text>`; }
      let tunnel = ''; for (const id of columns) tunnel += `M${40 + id % 32 * 8},${22 + Math.floor(id / 32) * scale}h8v${scale}h-8z`;
      profile += `<path d="${tunnel}" fill="#718c7a"/><path d="M34 ${22 + d * scale}H310" stroke="#efc16c" stroke-dasharray="4 3"/>`;
      for (const m of markers) if (!['ore', 'lamp'].includes(m.type)) profile += `<circle cx="${40 + (m.x + 16) * 8}" cy="${22 - m.y * scale}" r="4" fill="${m.color}"/>`;
      profile += `<circle cx="${40 + B.clamp(game.player.x + 16, 0, 32) * 8}" cy="${22 + B.clamp(-game.player.head.y, 0, this.maxDepth) * scale}" r="4" fill="white"/><text x="40" y="416" fill="#9cafa5" font-family="Consolas,monospace" font-size="10">W / ALL SURVEYED PASSAGES / E</text></svg>`;
      return { map, profile, markers: markers.filter(m => m.type !== 'ore' && m.type !== 'lamp'), ore: markers.filter(m => m.type === 'ore').length };
    }
  }
  Object.assign(B, { Survey, SURVEY_CELLS: COUNT });
})(B2);
