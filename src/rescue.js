/* Inez's survey bell: a terrain-blocked rescue, then a working survey office. */
'use strict';
(function (B) {
  const BELL = Object.freeze({ x: 8, y: -23, z: 8, top: 1.3, size: [1.5, 2.5, 1.5], speed: 2, fee: 40 });
  const offsets = () => B.boxOffsets(BELL.size), distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  class Rescue {
    constructor(world, progress) {
      this.world = world; this.progress = progress;
      this.state = progress.expedition.rescue ||= { version: 1, known: false, met: false, phase: 'stranded', y: BELL.y, lead: null };
      this.accumulator = 0; this.events = []; this.obstruction = null; this.blockedBy = '';
    }
    get rescued() { return this.state.phase === 'rescued'; }
    get position() { return { x: BELL.x, y: this.state.y, z: BELL.z }; }
    contact(y = this.state.y) {
      let hit = { density: Infinity };
      for (const o of offsets()) { const p = { x: BELL.x + o[0], y: y + o[1], z: BELL.z + o[2] }, density = this.world.density(p.x, p.y, p.z); if (density < hit.density) hit = { ...p, density }; }
      return hit;
    }
    obstacles() {
      const p = this.position;
      return [[p.x - .75, p.y - 1.25, p.z - .75, p.x + .75, p.y + 1.25, p.z + .75], [14.25, 0, 7.65, 14.95, 4.5, 8.35], [7.7, 4.3, 7.8, 14.9, 4.65, 8.2]];
    }
    interaction(player) {
      if (this.rescued) return null;
      // The intercom sits on the front face and is usable before the whole bell is freed.
      const p = { x: BELL.x, y: this.state.y + .2, z: BELL.z - .78 }, a = player.head, d = player.direction, r = distance(a, p);
      if (r < .1 || r > 3.4 || ((p.x - a.x) * d.x + (p.y - a.y) * d.y + (p.z - a.z) * d.z) / r < .72 || !this.world.clearLine(a, p, .06)) return null;
      return { kind: 'rescue', label: this.state.met ? 'Inez / survey bell controls' : 'A voice in the survey bell / answer the intercom' };
    }
    talk(player) { if (!this.interaction(player)) return false; this.state.known = this.state.met = true; return true; }
    control(player) {
      const s = this.state;
      if (!this.interaction(player) || !s.met) return false;
      if (s.phase === 'stranded') {
        if (this.contact().density < -.004 || this.progress.expedition.supplies.lights < 1) return false;
        this.progress.expedition.supplies.lights--; s.phase = 'hoisting';
      } else s.phase = s.phase === 'hoisting' ? 'held' : 'hoisting';
      return true;
    }
    status() {
      if (this.rescued) return 'Inez is back at the survey office in Ridge Common.';
      if (this.state.phase === 'stranded') return this.contact().density < -.004 ? 'Excavate the bell on every side before powering its winch.' : 'Fit one work-light cell to power the winch. Then clear a 1.5 m wide shaft above the bell.';
      if (this.state.phase === 'held') return 'Winch held. E at the intercom resumes the lift.';
      return this.blockedBy || 'Winch lifting. Keep the shaft clear and stand beside the bell.';
    }
    update(dt, player, boxes = []) {
      const s = this.state; let changed = false;
      if (!s.known && distance(player.head, this.position) < 6 && this.world.clearLine(player.head, this.position, .1)) { s.known = true; changed = true; }
      if (s.phase !== 'hoisting') { this.accumulator = 0; this.obstruction = null; this.blockedBy = ''; return changed; }
      this.accumulator += Math.min(.1, dt); this.obstruction = null; this.blockedBy = '';
      while (this.accumulator + 1e-10 >= 1 / 120) {
        this.accumulator -= 1 / 120;
        const y = Math.min(BELL.top, s.y + BELL.speed / 120), hit = this.contact(y);
        if (hit.density < -.004) { this.obstruction = hit; this.blockedBy = 'Rock above the bell. Cut at the orange marker.'; break; }
        if (Math.abs(player.x - BELL.x) < .75 + player.radius && Math.abs(player.z - BELL.z) < .75 + player.radius && player.y < y + 1.25 && player.y + player.height > y - 1.25) { this.blockedBy = 'Stand clear of the rising bell.'; break; }
        if (boxes.some(b => BELL.x + .75 > b[0] && BELL.x - .75 < b[3] && y + 1.25 > b[1] && y - 1.25 < b[4] && BELL.z + .75 > b[2] && BELL.z - .75 < b[5])) { this.blockedBy = 'Equipment blocks the bell. Move it or widen another route.'; break; }
        s.y = y; changed = true;
        if (y >= BELL.top) {
          s.phase = 'rescued';
          this.events.push({ title: 'One more light in the common.', text: 'Inez climbs out of the survey bell. "I owe you a map. Several, probably." She is reopening the survey office west of the well. Bring her your discoveries; she can mark untouched seams and interpret the old workings.' });
          break;
        }
      }
      if (this.blockedBy) this.accumulator = 0;
      return changed;
    }
    scan(head, range) { if (this.rescued || distance(head, this.position) > range) return []; this.state.known = true; return this.markers(); }
    markers() { return this.state.known && !this.rescued ? [{ ...this.position, name: 'Inez / survey bell', color: '#9bd7e5', type: 'rescue', scanKey: 'rescue' }] : []; }
    lead(deposits, survey) {
      if (!this.rescued) return null;
      const groups = new Map(), limit = Math.min(-this.world.digFloor - 1, this.progress.deepest + 12);
      for (const n of deposits.nodes) {
        if (n.collected || survey.ore.has(n.id) || -n.y > limit || n.y > -5) continue;
        const key = n.vein ?? ('ore:' + n.id), list = groups.get(key) || []; list.push(n); groups.set(key, list);
      }
      return [...groups.values()].filter(a => a.length >= 3).sort((a, b) => b.reduce((v, n) => v + B.ORES[n.kind].value, 0) - a.reduce((v, n) => v + B.ORES[n.kind].value, 0) || a[0].id - b[0].id)[0] || null;
    }
    chart(deposits, survey) {
      const nodes = this.lead(deposits, survey);
      if (!nodes || this.progress.cash < BELL.fee) return null;
      this.progress.cash -= BELL.fee;
      for (const n of nodes) { survey.ore.add(n.id); survey.data.ore.push(n.id); }
      survey.revision++; this.state.lead = nodes[0].id;
      return `${nodes.length} uncollected minerals marked on M, around ${Math.round(-nodes[0].y)} m. The map shows deposits; you still choose the route.`;
    }
    static validate(s, world, oreCount) {
      if (!s || s.version !== 1 || typeof s.known !== 'boolean' || typeof s.met !== 'boolean' || s.met && !s.known || !['stranded', 'hoisting', 'held', 'rescued'].includes(s.phase) || !Number.isFinite(s.y) || s.y < BELL.y || s.y > BELL.top || s.phase === 'stranded' && s.y !== BELL.y || s.phase !== 'stranded' && !s.met || (s.phase === 'rescued') !== (s.y === BELL.top) || s.lead !== null && (!Number.isInteger(s.lead) || s.lead < 0 || s.lead >= oreCount || s.phase !== 'rescued')) throw new Error('Invalid survey rescue.');
      if (s.phase !== 'stranded' && offsets().some(o => world.density(BELL.x + o[0], s.y + o[1], BELL.z + o[2]) < -.01)) throw new Error('Survey bell is inside terrain.');
      return { version: 1, known: s.known, met: s.met, phase: s.phase, y: s.y, lead: s.lead };
    }
  }
  Object.assign(B, { Rescue, BELL });
})(B2);
