'use strict';
(function (B) {
  const FORMAT = 'buttloads2', VERSION = 2;
  function encode(field) {
    const bytes = new Uint8Array(field.buffer, field.byteOffset, field.byteLength); let text = '';
    for (let i = 0; i < bytes.length; i += 16384) text += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return btoa(text);
  }
  function validate(input) {
    if (!input || input.format !== FORMAT || input.version !== VERSION) throw new Error('This save belongs to a different game or version. Original prototype saves remain in their original browser storage.');
    const generation = input.generation ?? 0;
    if (generation !== 0 && generation !== B.CAVE_VERSION) throw new Error('Unsupported cave generation.');
    const depthVersion = input.depthVersion ?? 0, extent = B.DEPTHS[depthVersion];
    if (!Number.isInteger(depthVersion) || !extent) throw new Error('Unsupported mine depth.');
    const FIELD_LENGTH = 65 * extent.ny * 65, floor = extent.floor;
    const st = input.state;
    const integer = (n, max = 1e9) => Number.isSafeInteger(n) && n >= 0 && n <= max;
    if (!st || !integer(st.seed, 4294967295)) throw new Error('Invalid world seed.');
    for (const key of ['cash', 'contracts', 'trips', 'earned', 'mined']) if (!integer(st[key], key === 'contracts' ? B.CONTRACTS.length : 1e9)) throw new Error('Invalid economy state.');
    for (const key of ['cargo', 'sold']) if (!Array.isArray(st[key]) || st[key].length !== B.ORES.length || !st[key].every(v => integer(v))) throw new Error('Invalid mineral inventory.');
    if (!st.gear || Object.keys(B.GEAR).some(key => !integer(st.gear[key], B.GEAR[key].costs.length))) throw new Error('Invalid equipment.');
    if (st.cargo.reduce((a, b) => a + b, 0) > B.GEAR.cargo.values[st.gear.cargo]) throw new Error('Cargo exceeds capacity.');
    for (const key of ['relics', 'paidRelics']) if (!Array.isArray(st[key]) || st[key].some(id => !integer(id, 2)) || new Set(st[key]).size !== st[key].length) throw new Error('Invalid discoveries.');
    if (st.paidRelics.some(id => !st.relics.includes(id)) || (st.core && st.relics.length !== 3)) throw new Error('Inconsistent discoveries.');
    if (typeof st.core !== 'boolean' || typeof st.won !== 'boolean' || (st.won && !st.core)) throw new Error('Invalid ending state.');
    if (!Number.isFinite(st.deepest) || st.deepest < 0 || st.deepest > -floor + 1 || !Number.isFinite(st.seconds) || st.seconds < 0 || st.seconds > 1e9) throw new Error('Invalid statistics.');
    const generated = B.generateDeposits(st.seed, depthVersion), ids = input.collected;
    if (!Array.isArray(ids) || ids.some(id => !integer(id, generated.nodes.length - 1)) || new Set(ids).size !== ids.length || ids.length !== st.mined) throw new Error('Invalid collected deposits.');
    const freight = st.expedition?.freight === undefined ? null : B.Freight.validate(st.expedition.freight, st);
    const counts = Array(B.ORES.length).fill(0); for (const id of ids) counts[generated.nodes[id].kind]++;
    const p = input.player;
    if (!p || !['x', 'y', 'z', 'yaw', 'pitch'].every(k => Number.isFinite(p[k])) || p.x < B.SURFACE.minX || p.x > B.SURFACE.maxX || p.z < B.SURFACE.minZ || p.z > B.SURFACE.maxZ || p.y < floor - 1 || p.y > 17 || Math.abs(p.pitch) > 1.55) throw new Error('Invalid player position.');
    let field;
    if (input.field instanceof Float32Array) field = input.field.slice();
    else if (typeof input.field === 'string' && input.field.length <= FIELD_LENGTH * 6) {
      const binary = atob(input.field);
      if (binary.length !== FIELD_LENGTH * 4) throw new Error('Invalid terrain size.');
      const bytes = new Uint8Array(binary.length); for (let i = 0; i < bytes.length; i++) bytes[i] = binary.charCodeAt(i);
      field = new Float32Array(bytes.buffer);
    }
    if (!field || field.length !== FIELD_LENGTH || field.some(v => !Number.isFinite(v) || v < -2.001 || v > 4)) throw new Error('Invalid terrain samples.');
    // Additive v2 field: saves made before ore physics omit this array and detach on load.
    const loose = input.loose === undefined ? [] : input.loose, seen = new Set(), collected = new Set(ids);
    if (!Array.isArray(loose) || loose.length > generated.nodes.length) throw new Error('Invalid loose ore list.');
    const savedWorld = Object.create(B.World.prototype); Object.assign(savedWorld, { nx: 65, ny: extent.ny, nz: 65, field, seed: st.seed, generation, depthVersion, caverns: new B.Caverns(st.seed, generation) });
    const combat = st.expedition?.combat === undefined ? null : B.Combat.validate(st.expedition.combat, savedWorld), cached = combat?.drops.find(n => n.id === 3)?.cargo;
    if (counts.some((count, i) => count !== st.cargo[i] + st.sold[i] + (freight?.load[i] || 0) + (freight?.stock[i] || 0) + (cached?.[i] || 0))) throw new Error('Inventory does not match the excavated deposits.');
    for (const body of loose) {
      if (!body || !integer(body.id, generated.nodes.length - 1) || seen.has(body.id) || collected.has(body.id)) throw new Error('Invalid loose ore ID.');
      seen.add(body.id);
      if (!['x', 'y', 'z', 'vx', 'vy', 'vz'].every(k => Number.isFinite(body[k])) || Math.abs(body.x) > 24 || Math.abs(body.z) > 24 || body.y < floor - 1 || body.y > 20 || ['vx', 'vy', 'vz'].some(k => Math.abs(body[k]) > 25)) throw new Error('Invalid loose ore position or velocity.');
      const offsets = B.oreOffsets(generated.nodes[body.id]);
      if (offsets.some(p => savedWorld.density(body.x + p[0], body.y + p[1], body.z + p[2]) < -.01)) throw new Error('Loose ore is inside solid terrain.');
    }
    const state = B.freshState(st.seed);
    for (const key of Object.keys(state)) if (key !== 'expedition') state[key] = structuredClone(st[key]);
    // Old v2 claims keep their terrain, money and minerals. The new expedition is additive.
    if (st.expedition !== undefined) {
      const e = st.expedition;
      if (!e || e.version !== 1 || !B.TOOLS[e.tool] || typeof e.awakened !== 'boolean') throw new Error('Invalid expedition.');
      for (const [key, max] of [['recovered', 1], ['runes', 2], ['vaults', 2]]) {
        if (!Array.isArray(e[key]) || e[key].some(id => !integer(id, max)) || new Set(e[key]).size !== e[key].length) throw new Error('Invalid expedition discoveries.');
      }
      if ((e.runes.length && !e.recovered.includes(1)) || (e.awakened && e.runes.length !== 3) || (e.vaults.length && !e.awakened)) throw new Error('Inconsistent expedition progress.');
      if (!Array.isArray(e.bodies) || e.bodies.length > 2) throw new Error('Invalid salvage.');
      const bodyIDs = new Set();
      for (const n of e.bodies) {
        if (!n || !integer(n.id, 1) || bodyIDs.has(n.id) || e.recovered.includes(n.id) || !['x', 'y', 'z', 'vx', 'vy', 'vz'].every(k => Number.isFinite(n[k])) || Math.abs(n.x) > 15 || Math.abs(n.z) > 15 || n.y < floor - 1 || n.y > 4 || ['vx', 'vy', 'vz'].some(k => Math.abs(n[k]) > 25)) throw new Error('Invalid salvage body.');
        bodyIDs.add(n.id);
        if (B.boxOffsets(B.SALVAGE[n.id].size).some(p => savedWorld.density(n.x + p[0], n.y + p[1], n.z + p[2]) < -.01)) throw new Error('Salvage is inside terrain.');
      }
      if (e.anchor !== null) {
        const a = e.anchor;
        if (!a || !e.recovered.includes(0) || !['x', 'y', 'z', 'yaw', 'pitch'].every(k => Number.isFinite(a[k])) || Math.abs(a.x) > 14 || Math.abs(a.z) > 14 || a.y < floor || a.y > -3 || Math.abs(a.pitch) > 1.55) throw new Error('Invalid survey anchor.');
        const probe = new B.Player(savedWorld); if (probe.blocked(a.x, a.y, a.z)) throw new Error('Survey anchor is inside terrain.');
      }
      state.expedition = { version: 1, tool: e.tool, recovered: [...e.recovered], runes: [...e.runes], awakened: e.awakened, vaults: [...e.vaults], bodies: e.bodies.map(n => ({ id: n.id, x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz })), anchor: e.anchor ? { x: e.anchor.x, y: e.anchor.y, z: e.anchor.z, yaw: e.anchor.yaw, pitch: e.anchor.pitch } : null };
      const supplies = e.supplies || { bombs: 3, lights: 6 }, devices = e.devices || [];
      if (!integer(supplies.bombs, 99) || !integer(supplies.lights, 99) || !Array.isArray(devices) || devices.length > 54) throw new Error('Invalid field supplies.');
      const deviceIDs = new Set();
      for (const d of devices) {
        if (!d || !integer(d.id) || deviceIDs.has(d.id) || !['lamp', 'bomb'].includes(d.type) || !['x', 'y', 'z', 'vx', 'vy', 'vz', 'fuse'].every(k => Number.isFinite(d[k])) || Math.abs(d.x) > 24 || Math.abs(d.z) > 24 || d.y < floor - 1 || d.y > 20 || ['vx', 'vy', 'vz'].some(k => Math.abs(d[k]) > 25) || d.fuse < 0 || d.fuse > 3.21 || (d.type === 'lamp' && d.fuse !== 0)) throw new Error('Invalid deployed device.');
        const mode = d.mode || 'blast', spec = B.CHARGES[mode];
        if (!Object.hasOwn(B.CHARGES, mode) || (d.mode !== undefined && !Object.hasOwn(B.CHARGES, d.mode)) || (d.type === 'lamp' && (d.mode !== undefined || d.anchor !== undefined || d.direction !== undefined || d.triggered !== undefined)) || (d.type === 'bomb' && st.deepest < spec.depth)) throw new Error('Invalid charge type.');
        if (mode === 'sticky' ? typeof d.triggered !== 'boolean' || (!d.triggered && d.fuse !== 0) || d.fuse > .7 : d.triggered !== undefined || d.fuse > spec.fuse + .01) throw new Error('Invalid charge fuse.');
        if (mode === 'bore') { if (!d.direction || !['x', 'y', 'z'].every(k => Number.isFinite(d.direction[k])) || Math.abs(Math.hypot(d.direction.x, d.direction.y, d.direction.z) - 1) > 1e-5) throw new Error('Invalid bore direction.'); }
        else if (d.direction !== undefined) throw new Error('Unexpected charge direction.');
        if (d.anchor !== undefined && (!['sticky', 'bore'].includes(mode) || !d.anchor || !['x', 'y', 'z'].every(k => Number.isFinite(d.anchor[k])) || Math.hypot(d.anchor.x - d.x, d.anchor.y - d.y, d.anchor.z - d.z) > .55 || d.vx !== 0 || d.vy !== 0 || d.vz !== 0)) throw new Error('Invalid charge attachment.');
        deviceIDs.add(d.id);
        if (B.Gadgets.offsets().some(p => savedWorld.density(d.x + p[0], d.y + p[1], d.z + p[2]) < -.01)) throw new Error('Deployed device is inside terrain.');
      }
      if (devices.filter(d => d.type === 'lamp').length > 48 || devices.filter(d => d.type === 'bomb').length > 6) throw new Error('Too many deployed devices.');
      // Keep absent fields absent in older additive snapshots; the game initializes them on install.
      if (e.supplies !== undefined) state.expedition.supplies = { bombs: supplies.bombs, lights: supplies.lights };
      if (e.devices !== undefined) state.expedition.devices = devices.map(d => ({ id: d.id, type: d.type, x: d.x, y: d.y, z: d.z, vx: d.vx, vy: d.vy, vz: d.vz, fuse: d.fuse, ...(d.mode ? { mode: d.mode } : {}), ...(d.direction ? { direction: { ...d.direction } } : {}), ...(d.anchor ? { anchor: { ...d.anchor } } : {}), ...(d.mode === 'sticky' ? { triggered: d.triggered } : {}) }));
      if (e.chargeMode !== undefined) { if (!Object.hasOwn(B.CHARGES, e.chargeMode) || st.deepest < B.CHARGES[e.chargeMode].depth) throw new Error('Selected charge is not unlocked.'); state.expedition.chargeMode = e.chargeMode; }
      if (freight) state.expedition.freight = B.Freight.validate(freight, st, savedWorld);
      if (e.refuges !== undefined) state.expedition.refuges = B.Refuges.validate(e.refuges, savedWorld);
      if (combat) state.expedition.combat = combat;
      if (e.foreman !== undefined) state.expedition.foreman = B.Foreman.validate(e.foreman, savedWorld, st);
      if (e.deep !== undefined) state.expedition.deep = B.DeepExpedition.validate(e.deep, savedWorld, st);
      if (e.town !== undefined) state.expedition.town = B.Town.validate(e.town);
      if (e.guide !== undefined) state.expedition.guide = B.FieldGuide.validate(e.guide);
      if (e.thunder !== undefined) state.expedition.thunder = B.Thunderstone.validate(e.thunder, savedWorld);
      if (e.mysteries !== undefined) state.expedition.mysteries = B.Mysteries.validate(e.mysteries);
      if (e.survey !== undefined) state.expedition.survey = B.Survey.validate(e.survey, generated.nodes.length, savedWorld);
      if (!B.availableTools(state).includes(e.tool)) throw new Error('Selected tool is not unlocked.');
    }
    const settings = input.settings || {};
    return { generation, depthVersion, state, player: { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch }, field, collected: [...ids], loose: loose.map(n => ({ id: n.id, x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz })), settings: { sound: settings.sound !== false, tips: settings.tips !== false, sensitivity: B.clamp(Number(settings.sensitivity) || 1, .25, 3), quality: B.clamp(Number(settings.quality) || 1.5, .75, 2), motion: settings.motion !== false } };
  }
  function snapshot(game, portable = false) {
    const p = game.player;
    if (game.expedition) game.economy.state.expedition.bodies = game.expedition.physics.snapshot();
    game.gadgets?.save(); game.thunder?.save(); game.refuges?.save(); game.combat?.save(); game.deep?.save(); game.foreman?.save();
    return { format: FORMAT, version: VERSION, generation: game.world.generation || 0, depthVersion: game.world.depthVersion || 0, savedAt: new Date().toISOString(), state: structuredClone(game.economy.state), player: { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch }, collected: game.deposits.nodes.filter(n => n.collected).map(n => n.id), loose: game.orePhysics ? game.orePhysics.snapshot() : [], settings: { ...game.settings }, field: portable ? encode(game.world.field) : game.world.field.slice() };
  }
  class SaveStore {
    constructor() { this.db = null; this.pending = Promise.resolve(); }
    open() {
      if (this.db) return this.db;
      this.db = new Promise((resolve, reject) => {
        const request = indexedDB.open('tront-buttloads2-v2', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('saves');
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Save database is busy in another tab.'));
      });
      return this.db;
    }
    async read() { const db = await this.open(); return new Promise((resolve, reject) => { const request = db.transaction('saves').objectStore('saves').get('current'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
    write(data) {
      // Serialize immutable snapshots so a late old write cannot overwrite a new claim.
      const job = this.pending.catch(() => {}).then(async () => {
        const db = await this.open();
        await new Promise((resolve, reject) => { const tx = db.transaction('saves', 'readwrite'); tx.objectStore('saves').put(data, 'current'); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('Save transaction aborted.')); });
      });
      this.pending = job; return job;
    }
  }
  B.Saves = { validate, snapshot, SaveStore, VERSION, FORMAT };
})(B2);
