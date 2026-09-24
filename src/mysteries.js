/* Optional ruins: discoveries change the mining kit, never gate the main descent. */
'use strict';
(function (B) {
  const MYSTERIES = [
    { id: 0, x: 7, y: -21, z: 6, name: 'The echo vault', color: '#efae78', reward: 'Aftershock core', clue: 'Three impacts. One echo. Expose the three copper seals and hit all three with explosions within one second. Plant remote satchels beside the seals, then fire them together with H.', benefit: 'Remote blasts widen to 3.6 m. Bore charges reach 9 m, using the same supplies.' },
    { id: 1, x: -7, y: -38, z: -9, name: 'The blackglass array', color: '#99e4ec', reward: 'Prism survey lens', clue: 'Follow the light. Cut a clear path from the emitter through both prisms to the round receiver. Aim at a prism and press E to turn its arrow. Rock blocks the beam.', benefit: 'Choose a mineral in the survey to focus your scanner. Focused scans reach 8 m farther and hide other minerals.' }
  ];
  const ECHO_SEALS = [{ x: 3.3, y: -21, z: 6 }, { x: 10.7, y: -21, z: 6 }, { x: 7, y: -21, z: 10 }];
  const ARRAY_NODES = [{ x: -11, y: -38, z: -9 }, { x: -7, y: -38, z: -9 }, { x: -7, y: -38, z: -4 }, { x: -2, y: -38, z: -4 }];
  const CARDINAL = [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }];
  const MYSTERY_CAVES = [{ x: 7, y: -22, z: 6, radius: 3.1 }, ...ARRAY_NODES.map(p => ({ ...p, radius: 1.8 }))];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  class Mysteries {
    constructor(world, state) {
      this.world = world; this.progress = state;
      this.state = state.expedition.mysteries ||= { version: 1, known: [], solved: [], mirrors: [2, 3], focus: -1, tracked: -1 };
      this.events = []; this.time = 0; this.sealUntil = [0, 0, 0]; this.lastBlast = 0; this.beams = []; this.connected = 0; this.linkTime = 0; this.revision = 0; this.nextLook = 0;
      this.traceArray();
    }
    static validate(s) {
      const list = a => Array.isArray(a) && a.length <= 2 && a.every(i => i === 0 || i === 1) && new Set(a).size === a.length;
      if (!s || s.version !== 1 || !list(s.known) || !list(s.solved) || s.solved.some(i => !s.known.includes(i)) || !Array.isArray(s.mirrors) || s.mirrors.length !== 2 || s.mirrors.some(i => !Number.isInteger(i) || i < 0 || i > 3) || !Number.isInteger(s.focus) || s.focus < -1 || s.focus >= B.ORES.length || (s.focus >= 0 && !s.solved.includes(1)) || !Number.isInteger(s.tracked) || (s.tracked !== -1 && (!s.known.includes(s.tracked) || s.solved.includes(s.tracked)))) throw new Error('Invalid underground discoveries.');
      return { version: 1, known: [...s.known], solved: [...s.solved], mirrors: [...s.mirrors], focus: s.focus, tracked: s.tracked };
    }
    discover(id) {
      if (this.state.known.includes(id)) return false;
      this.state.known.push(id); this.revision++;
      this.events.push({ text: `${MYSTERIES[id].name}: an unusual signal. Field notes (J) now have a lead.`, tone: 820 }); return true;
    }
    scan(head, range) { for (const m of MYSTERIES) if (distance(head, m) <= range) this.discover(m.id); }
    track(id) {
      if (id !== -1 && (!this.state.known.includes(id) || this.state.solved.includes(id))) return false;
      this.state.tracked = id; this.revision++; return true;
    }
    target() { return MYSTERIES[this.state.tracked] || null; }
    focus(kind) {
      if (!Number.isInteger(kind) || kind < -1 || kind >= B.ORES.length || (kind >= 0 && !this.state.solved.includes(1))) return false;
      this.state.focus = kind; this.revision++; return true;
    }
    scannerRange() { return B.GEAR.scanner.values[this.progress.gear.scanner] + (this.progress.deepest >= 43 ? 10 : 0) + (this.state.focus >= 0 ? 8 : 0); }
    solve(id) {
      if (this.state.solved.includes(id)) return false;
      this.discover(id); this.state.solved.push(id); if (this.state.tracked === id) this.state.tracked = -1;
      this.revision++; const m = MYSTERIES[id];
      this.events.push({ title: m.reward + ' recovered', text: (id === 0 ? 'The three seals answer as one. A copper core unfolds inside your charge rig. ' : 'The receiver fills with light. A sliver of blackglass settles into your scanner. ') + m.benefit }); return true;
    }
    blast(b) {
      if (this.state.solved.includes(0)) return;
      ECHO_SEALS.forEach((p, i) => {
        const along = b.length ? B.clamp((p.x - b.x) * b.direction.x + (p.y - b.y) * b.direction.y + (p.z - b.z) * b.direction.z, 0, b.length) : 0;
        const origin = along ? { x: b.x + b.direction.x * along, y: b.y + b.direction.y * along, z: b.z + b.direction.z * along } : b;
        if (distance(origin, p) > b.radius - .1 || this.world.density(p.x, p.y, p.z) < .04 || !this.world.clearLine(origin, p, .08)) return;
        this.discover(0); this.sealUntil[i] = this.time + 1;
        this.events.push({ tone: [330, 440, 550][i] });
      });
      if (this.sealUntil.every(t => t > this.time)) this.solve(0);
    }
    traceArray() {
      this.beams = []; this.connected = 0;
      for (let i = 0; i < 3; i++) {
        const from = ARRAY_NODES[i], to = ARRAY_NODES[i + 1], dir = CARDINAL[i === 0 ? 0 : this.state.mirrors[i - 1]];
        if (this.world.density(from.x, from.y, from.z) < .04) break;
        const along = (to.x - from.x) * dir.x + (to.z - from.z) * dir.z;
        const aimed = along > 0 && Math.abs((to.x - from.x) * dir.z - (to.z - from.z) * dir.x) < .1;
        const length = aimed ? along : 8, hit = this.world.ray(from, dir, length);
        const end = hit || { x: from.x + dir.x * length, y: from.y, z: from.z + dir.z * length };
        this.beams.push({ from, end, hit: !!hit });
        if (!aimed || hit || !this.world.clearLine(from, to, .02)) break;
        this.connected++;
      }
    }
    interaction(player) {
      for (let i = 0; i < 2; i++) {
        const p = ARRAY_NODES[i + 1], head = player.head, d = player.direction, delta = { x: p.x - head.x, y: p.y - head.y, z: p.z - head.z }, along = delta.x * d.x + delta.y * d.y + delta.z * d.z;
        if (distance(head, p) <= 3 && along > 0 && Math.hypot(delta.x - d.x * along, delta.y - d.y * along, delta.z - d.z * along) < .65 && this.world.density(p.x, p.y, p.z) > .04 && this.world.clearLine(head, p, .1)) return { kind: 'prism', id: i, label: `Turn blackglass prism ${i + 1} / ${this.connected} of 3 light paths linked` };
      }
      return null;
    }
    rotate(id, player) {
      if (this.interaction(player)?.id !== id) return false;
      this.discover(1); this.state.mirrors[id] = (this.state.mirrors[id] + 1) % 4; this.traceArray(); this.revision++; return true;
    }
    update(dt, player, gadgets) {
      const before = this.revision; this.time += dt;
      if (this.time >= this.nextLook) {
        this.nextLook = this.time + .3;
        for (const m of MYSTERIES) {
          const points = m.id === 0 ? [m, ...ECHO_SEALS] : ARRAY_NODES;
          if (points.some(p => distance(player.head, p) < 5 && this.world.density(p.x, p.y, p.z) > .04 && this.world.clearLine(player.head, p, .1))) this.discover(m.id);
        }
        // Recoveries contain leads, but not solutions or the rest of the campaign.
        if (this.progress.expedition.recovered.includes(0)) this.discover(0);
        if (this.progress.expedition.recovered.includes(1)) this.discover(1);
      }
      for (const b of gadgets.blasts) if (b.serial > this.lastBlast) { this.blast(b); this.lastBlast = b.serial; }
      if (this.terrainRevision !== this.world.revision) { this.terrainRevision = this.world.revision; this.traceArray(); }
      this.linkTime = this.connected === 3 ? this.linkTime + dt : 0;
      if (this.linkTime >= .75) this.solve(1);
      return before !== this.revision;
    }
  }
  Object.assign(B, { Mysteries, MYSTERIES, ECHO_SEALS, ARRAY_NODES, CARDINAL, MYSTERY_CAVES });
})(B2);
