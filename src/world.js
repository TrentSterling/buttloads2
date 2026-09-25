'use strict';
(function (B) {
  const { WORLD: W, clamp, RELICS } = B;
  class World {
    constructor(seed, generation = 0, depthVersion = 0, parcelVersion = 0) {
      if (!B.DEPTHS[depthVersion] || !Number.isInteger(depthVersion)) throw new Error('Unsupported mine depth.');
      if (![0,1].includes(parcelVersion) || parcelVersion && !depthVersion) throw new Error('Unsupported neighboring claim.');
      this.parcelVersion=parcelVersion;this.parcelTerrain=parcelVersion?new B.ParcelTerrain(seed):null;this.parcelField=this.parcelTerrain?.field() || null;
      this.seed = seed; this.generation = generation; this.depthVersion = depthVersion; this.deepOpen = false; this.caverns = new B.Caverns(seed, generation); this.deepTerrain = depthVersion ? new B.DeepTerrain(seed) : null; this.nx = 65; this.ny = B.DEPTHS[depthVersion].ny; this.nz = 65;
      this.field = new Float32Array(this.nx * this.ny * this.nz);
      this.kernel = B.createMesher(); this.chunks = new Map(); this.revision = 0;
      this.audit = { edits: 0, samples: 0, lastEditMs: 0, maxEditMs: 0 };
      this.onChunk = () => {}; this.onChange = () => {}; this.onEdit = () => {};
      this.generate();
    }
    index(x, y, z) { return x + this.nx * (y + this.ny * z); }
    get bottom() { return B.DEPTHS[this.depthVersion || 0].bottom; }
    get floor() { return B.DEPTHS[this.depthVersion || 0].floor; }
    get digFloor() { return this.depthVersion && !this.deepOpen ? W.floor : this.floor; }
    get minChunkY() { return this.bottom / W.size; }
    get maxChunkX() { return this.parcelVersion?5:1; }
    owns(x,z,margin=0) { return B.claimContains(this.parcelVersion,x,z,margin); }
    floorAt(x,z) { return this.parcelVersion && x>=14 ? B.EASTCUT.floor : this.digFloor; }
    canDig(x,y,z,margin=0) { return this.owns(x,z,margin) && y>this.floorAt(x,z)+margin; }
    installParcelField(field) {
      if(!this.parcelVersion || !(field instanceof Float32Array) || field.length!==this.parcelField.length)throw Error('Invalid neighboring terrain extent.');
      this.parcelField.set(field);
    }
    installField(field, depthVersion = 0) {
      const source = B.DEPTHS[depthVersion]; if (!source || field.length !== this.nx * source.ny * this.nz || source.bottom < this.bottom) throw new Error('Invalid terrain extent.');
      const offset = (source.bottom - this.bottom) * 2;
      for (let z = 0; z < this.nz; z++) this.field.set(field.subarray(z * source.ny * this.nx, (z + 1) * source.ny * this.nx), this.index(0, offset, z));
    }
    fieldAtDepth(depthVersion) {
      const target = B.DEPTHS[depthVersion]; if (!target || target.bottom < this.bottom) throw new Error('Invalid terrain projection.');
      const field = new Float32Array(this.nx * target.ny * this.nz), offset = (target.bottom - this.bottom) * 2;
      for (let z = 0; z < this.nz; z++) field.set(this.field.subarray(this.index(0, offset, z), this.index(0, offset, z) + target.ny * this.nx), z * target.ny * this.nx);
      return field;
    }
    base(x, y, z) {
      if(x>16 && this.parcelTerrain)return this.parcelTerrain.density(x,y,z);
      if (y < -80) return clamp(this.deepTerrain?.density(x, y, z) ?? -2, -2, 2);
      let density = y;
      for (const r of RELICS) { const cave = 3.3 - Math.hypot((x - r.x) * .9, (y - r.y - 1.1) * 1.1, (z - r.z) * .9); density = Math.max(density, cave); }
      // The final chamber opens out into a low, asymmetric crystal garden.
      const garden = 4.8 - Math.hypot((x - 1) * .85, (y + 67.1) * 1.7, (z - 1) * .9);
      density = Math.max(density, garden);
      for (const c of B.MYSTERY_CAVES || []) density = Math.max(density, c.radius - Math.hypot(x - c.x, (y - c.y) * 1.15, z - c.z));
      return clamp(Math.max(density, this.caverns?.density(x, y, z) ?? -2, this.deepTerrain?.density(x, y, z) ?? -2), -2, 2);
    }
    generate() {
      for (let z = 0; z < this.nz; z++) for (let y = 0; y < this.ny; y++) for (let x = 0; x < this.nx; x++) this.field[this.index(x, y, z)] = this.base(W.min + x * .5, this.bottom + y * .5, W.min + z * .5);
    }
    sample(x, y, z) {
      if(this.parcelVersion && x>=65 && x<129 && z>=0 && z<65){const py=y+(this.bottom+80)*2;if(py>=0 && py<165)return this.parcelField[x-65+64*(py+165*z)];}
      if (x < 0 || x >= this.nx || y < 0 || y >= this.ny || z < 0 || z >= this.nz) return clamp(this.bottom + y * .5, -2, 2);
      return this.field[this.index(x, y, z)];
    }
    density(x, y, z) {
      if (B.COMMON.outside(x,z)) return clamp(y-B.COMMON.height(x,z),-2,2);
      if (y > W.top) return 2;
      const fx = (x - W.min) * 2, fy = (y - this.bottom) * 2, fz = (z - W.min) * 2;
      const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz), u = fx - ix, v = fy - iy, w = fz - iz;
      let d = 0;
      for (let c = 0; c < 8; c++) d += this.sample(ix + (c & 1), iy + ((c >> 1) & 1), iz + (c >> 2)) * (c & 1 ? u : 1 - u) * (c & 2 ? v : 1 - v) * (c & 4 ? w : 1 - w);
      return d;
    }
    normal(x, y, z) {
      const e = .12, d = this.density.bind(this), n = [d(x + e, y, z) - d(x - e, y, z), d(x, y + e, z) - d(x, y - e, z), d(x, y, z + e) - d(x, y, z - e)];
      const l = Math.hypot(...n) || 1; return n.map(v => v / l);
    }
    ray(origin, direction, reach = 5) {
      let previous = 0;
      for (let t = .05; t <= reach; t += .16) {
        const x = origin.x + direction.x * t, y = origin.y + direction.y * t, z = origin.z + direction.z * t;
        if (this.density(x, y, z) < 0) {
          let lo = previous, hi = t;
          for (let k = 0; k < 7; k++) { const m = (lo + hi) * .5; if (this.density(origin.x + direction.x * m, origin.y + direction.y * m, origin.z + direction.z * m) < 0) hi = m; else lo = m; }
          const distance = (lo + hi) * .5;
          return { x: origin.x + direction.x * distance, y: origin.y + direction.y * distance, z: origin.z + direction.z * distance, distance };
        }
        previous = t;
      }
      return null;
    }
    clearLine(a, b, margin = .2) {
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, distance = Math.hypot(dx, dy, dz);
      return distance < margin || !this.ray(a, { x: dx / distance, y: dy / distance, z: dz / distance }, distance - margin);
    }
    samplesFor(cx, cy, cz) {
      const m = this.kernel.M, samples = new Float32Array(m ** 3);
      for (let z = -1; z <= 16; z++) for (let y = -1; y <= 16; y++) for (let x = -1; x <= 16; x++) samples[this.kernel.sampleId(x, y, z)] = this.sample(cx * 16 + x + 32, cy * 16 + y - this.bottom * 2, cz * 16 + z + 32);
      return samples;
    }
    adopt(cx, cy, cz, mesh) {
      if (!mesh) return;
      const key = `${cx},${cy},${cz}`, rec = { key, cx, cy, cz, mesh };
      this.chunks.set(key, rec); this.onChunk(rec); this.kernel.clear(mesh);
      return rec;
    }
    async build(progress = () => {}) {
      const jobs = [];
      for (let cy = -1; cy >= this.minChunkY; cy--) for (let cz = -2; cz < 2; cz++) for (let cx = -2; cx <= this.maxChunkX; cx++) {
        if(cx>=2 && cy<-10)continue;
        const samples = this.samplesFor(cx, cy, cz); let positive = false, negative = false;
        for (const v of samples) { if (v < 0) negative = true; else positive = true; if (positive && negative) break; }
        if (positive && negative) jobs.push({ cx, cy, cz, samples });
      }
      let at = 0, done = 0;
      const source = `const K=(${B.createMesher.toString()})();onmessage=e=>{try{const j=e.data,s=K.build([j.cx*8,j.cy*8,j.cz*8],j.samples);postMessage(s,Object.values(s).filter(v=>ArrayBuffer.isView(v)).map(v=>v.buffer));}catch(e){postMessage({error:e.message});}};`;
      let url;
      try { if (typeof Worker !== 'undefined') url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' })); } catch { /* file:// or browser policy: synchronous cold-build fallback */ }
      const work = async () => {
        let worker;
        try { if (url) worker = new Worker(url); } catch { /* fallback below */ }
        try {
          while (at < jobs.length) {
            const job = jobs[at++]; let result;
            if (worker) {
              try {
                result = await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => reject(new Error('Mesher timeout')), 15000);
                  worker.onmessage = e => { clearTimeout(timeout); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data); };
                  worker.onerror = e => { clearTimeout(timeout); reject(new Error(e.message)); };
                  worker.postMessage(job);
                });
              } catch { worker.terminate(); worker = null; }
            }
            if (!result) { result = this.kernel.build([job.cx * 8, job.cy * 8, job.cz * 8], job.samples); await new Promise(r => setTimeout(r, 0)); }
            this.adopt(job.cx, job.cy, job.cz, result); progress(++done / jobs.length);
          }
        } finally { worker?.terminate(); }
      };
      try { await Promise.all(Array.from({ length: Math.min(8, Math.max(1, (globalThis.navigator?.hardwareConcurrency || 4) - 2), jobs.length || 1) }, work)); }
      finally { if (url) URL.revokeObjectURL(url); }
      progress(1);
    }
    carve(p, radius, strength = Infinity, shape = null) {
      const begin = performance.now();
      // Oriented tools share exactly the same ownership, dirty halo and support notifications.
      // Minimum-axis scaling keeps their scalar field conservative near the cut surface.
      const bound = radius * (shape ? Math.max(...shape.axes) : 1), scale = shape ? Math.min(...shape.axes) : 1;
      const lo = [p.x - bound, p.y - bound, p.z - bound], hi = [p.x + bound, p.y + bound, p.z + bound], base = [W.min, this.bottom, W.min], dims = [this.parcelVersion?129:this.nx, this.ny, this.nz];
      for (let k = 0; k < 3; k++) { lo[k] = clamp(Math.floor((lo[k] - base[k]) * 2), 0, dims[k] - 1); hi[k] = clamp(Math.ceil((hi[k] - base[k]) * 2), 0, dims[k] - 1); }
      let changed = 0; const dirty = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
      for (let z = lo[2]; z <= hi[2]; z++) for (let y = lo[1]; y <= hi[1]; y++) for (let x = lo[0]; x <= hi[0]; x++) {
        const wx = W.min + x * .5, wy = this.bottom + y * .5, wz = W.min + z * .5;
        if (!this.canDig(wx,wy,wz)) continue;
        const dx = wx - p.x, dy = wy - p.y, dz = wz - p.z;
        const distance = shape ? Math.hypot(...shape.basis.map((v, i) => (dx * v.x + dy * v.y + dz * v.z) / shape.axes[i])) : Math.hypot(dx, dy, dz); if (distance >= radius) continue;
        const field=x>=65?this.parcelField:this.field,id=x>=65?x-65+64*(y+(this.bottom+80)*2+165*z):this.index(x,y,z),target=(radius-distance)*scale,value=Math.fround(Math.max(field[id],Math.min(target,field[id]+strength)));
        if (value <= field[id] + 1e-7) continue;
        field[id] = value; changed++;
        dirty[0] = Math.min(dirty[0], x); dirty[1] = Math.min(dirty[1], y); dirty[2] = Math.min(dirty[2], z); dirty[3] = Math.max(dirty[3], x); dirty[4] = Math.max(dirty[4], y); dirty[5] = Math.max(dirty[5], z);
      }
      if (!changed) return 0;
      this.revision++;
      // Include the sample halo of every affected chunk, including corners.
      const min = [Math.max(-2, Math.floor((dirty[0] - 33) / 16)), Math.max(this.minChunkY, Math.floor((dirty[1] + this.bottom * 2 - 1) / 16)), Math.max(-2, Math.floor((dirty[2] - 33) / 16))];
      const max = [Math.min(this.maxChunkX, Math.floor((dirty[3] - 31) / 16)), Math.min(-1, Math.floor((dirty[4] + this.bottom * 2 + 1) / 16)), Math.min(1, Math.floor((dirty[5] - 31) / 16))];
      for (let cz = min[2]; cz <= max[2]; cz++) for (let cy = min[1]; cy <= max[1]; cy++) for (let cx = min[0]; cx <= max[0]; cx++) {
        const key = `${cx},${cy},${cz}`; let rec = this.chunks.get(key);
        if (!rec) { this.adopt(cx, cy, cz, this.kernel.build([cx * 8, cy * 8, cz * 8], this.samplesFor(cx, cy, cz))); continue; }
        const offset = [cx * 16 + 32, cy * 16 - this.bottom * 2, cz * 16 + 32], bounds = dirty.map((v, i) => clamp(v - offset[i % 3], -1, 16));
        for (let z = bounds[2]; z <= bounds[5]; z++) for (let y = bounds[1]; y <= bounds[4]; y++) for (let x = bounds[0]; x <= bounds[3]; x++) rec.mesh.samples[this.kernel.sampleId(x, y, z)] = this.sample(offset[0] + x, offset[1] + y, offset[2] + z);
        this.kernel.update(rec.mesh, bounds); this.onChange(rec); this.kernel.clear(rec.mesh);
      }
      this.audit.edits++; this.audit.samples += changed; this.audit.lastEditMs = performance.now() - begin; this.audit.maxEditMs = Math.max(this.audit.maxEditMs, this.audit.lastEditMs);
      this.onEdit(p, bound);
      return changed;
    }
  }
  B.World = World;
})(B2);
