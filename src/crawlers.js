/* Ground-bound shale crawlers. Armor, attacks and navigation obey the excavated mine. */
'use strict';
(function (B) {
  const SIZE = [1.8, 1, 1.8], OFFSETS = B.boxOffsets(SIZE), FEET = OFFSETS.filter(o => o[1] === -.5);
  const HP = 110, SHELL = 90, PRICE = 240, PHASES = ['buried', 'idle', 'chase', 'windup', 'lunge', 'recover', 'stunned', 'dead'];
  const pos = n => ({ x: n.x, y: n.y, z: n.z }), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const direction = (a, b) => { const d = Math.hypot(b.x - a.x, b.z - a.z); if (d < 1e-8) return { x: 0, y: 0, z: 1 }; return { x: (b.x - a.x) / d, y: 0, z: (b.z - a.z) / d }; };
  const freshNode = (p, i) => ({ id: 200 + i, ...p, hp: HP, shell: SHELL, phase: 'buried', timer: 0, yaw: 0, known: false, vx: 0, vy: 0, vz: 0, direction: { x: 0, y: 0, z: 1 }, alert: 0, lastSeen: null, reward: 0 });
  class Crawlers {
    static sites(world) { return world.depthVersion ? [0, 2, 3].map(i => { const r = (world.deepTerrain || new B.DeepTerrain(world.seed)).rooms[i]; return { x: r.x + 1, y: r.y, z: r.z - 1 }; }) : []; }
    constructor(world, progress, combat) {
      this.world = world; this.progress = progress; this.combat = combat; this.homes = Crawlers.sites(world);
      this.state = progress.expedition.crawlers ||= { version: 1, impactHead: false, recovered: [], enemies: this.homes.map(freshNode) };
      this.nodes = this.state.enemies.map(n => ({ ...n, direction: { ...n.direction }, lastSeen: n.lastSeen ? { ...n.lastSeen } : null, targetRadius: .9, name: 'Shale crawler' }));
      this.accumulator = 0; this.time = 0; this.events = []; this.routes = new Map(); this.obstacles = []; this.revision = 0; this.player = null;
      this.world.impactHead = this.state.impactHead; combat.crawlers = this;
    }
    owns(n) { return this.nodes.includes(n); }
    box(n) { return [n.x - .9, n.y - .5, n.z - .9, n.x + .9, n.y + .5, n.z + .9]; }
    obstaclesForPlayer() { return this.nodes.filter(n => n.phase !== 'buried').map(n => this.box(n)); }
    terrain(p) { return OFFSETS.some(o => this.world.density(p.x + o[0], p.y + o[1], p.z + o[2]) < -.004); }
    blocked(p, id, actors = true) {
      if (Math.abs(p.x) > 13 || Math.abs(p.z) > 13 || p.y < this.world.floor + .51 || p.y > -80 || this.terrain(p)) return true;
      const boxes = [...this.obstacles, ...this.nodes.filter(n => n.id !== id && n.phase !== 'buried').map(n => this.box(n))];
      if (boxes.some(b => p.x + .9 > b[0] && p.x - .9 < b[3] && p.y + .5 > b[1] && p.y - .5 < b[4] && p.z + .9 > b[2] && p.z - .9 < b[5])) return true;
      const a = this.player;
      return !!(actors && a && Math.abs(p.x - a.x) < .9 + a.radius && Math.abs(p.z - a.z) < .9 + a.radius && p.y + .5 > a.y && p.y - .5 < a.y + a.height);
    }
    supported(p) {
      return FEET.some(o => { const x = p.x + o[0], y = p.y - .56, z = p.z + o[2]; return this.world.density(x, y, z) < -.004 && this.world.normal(x, y, z)[1] > .25; }) || this.obstacles.some(b => p.x + .85 > b[0] && p.x - .85 < b[3] && p.z + .85 > b[2] && p.z - .85 < b[5] && p.y - .5 >= b[4] - .004 && p.y - .56 <= b[4]);
    }
    segment(a, b, id, actors = true) {
      const steps = Math.max(1, Math.ceil(dist(a, b) / .07));
      for (let i = 1; i <= steps; i++) { const t = i / steps; if (this.blocked({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }, id, actors)) return false; }
      return true;
    }
    groundStep(from, dx, dz, id, actors = true) {
      for (let lift = 0; lift <= .301; lift += .075) {
        const above = { x: from.x, y: from.y + lift, z: from.z }, next = { x: from.x + dx, y: above.y, z: from.z + dz };
        if (!this.segment(from, above, id, actors) || !this.segment(above, next, id, actors)) continue;
        for (let drop = 0; drop <= .551; drop += .05) {
          const p = { ...next, y: next.y - drop };
          if (!this.segment(next, p, id, actors)) break;
          if (this.supported(p)) return p;
        }
      }
      return null;
    }
    path(n, target) {
      const key = p => [Math.round(p.x / .7), Math.round(p.y / .3), Math.round(p.z / .7)].join(','), h = p => Math.hypot(p.x - target.x, p.z - target.z), start = pos(n);
      const open = [{ p: start, cost: 0, score: h(start) }], cost = new Map([[key(start), 0]]), parents = new Map(), closed = new Set(); let end = null;
      for (let visits = 0; open.length && visits < 220; visits++) {
        open.sort((a, b) => a.score - b.score); const at = open.shift(), k = key(at.p); if (closed.has(k)) continue; closed.add(k);
        if (h(at.p) < 2) { end = at.p; break; }
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4, p = this.groundStep(at.p, Math.sin(angle) * .7, Math.cos(angle) * .7, n.id, false);
          if (!p || Math.hypot(p.x - start.x, p.z - start.z) > 9) continue;
          const id = key(p), value = at.cost + dist(p, at.p); if (closed.has(id) || (cost.get(id) ?? Infinity) <= value) continue;
          cost.set(id, value); parents.set(id, at.p); open.push({ p, cost: value, score: value + h(p) });
        }
      }
      const route = []; for (let p = end; p && key(p) !== key(start); p = parents.get(key(p))) route.unshift(p); return route;
    }
    walk(n, dir, speed, dt) {
      const p = this.groundStep(n, dir.x * speed * dt, dir.z * speed * dt, n.id);
      if (!p) { n.vx = n.vz = 0; return false; }
      n.vx = (p.x - n.x) / dt; n.vz = (p.z - n.z) / dt; Object.assign(n, p); return true;
    }
    navigate(n, target, dt) {
      const direct = direction(n, target), speed = n.shell > 0 ? 1.35 : 2;
      // Reuse the known detour until reached; otherwise a direct step can pull back into a wall.
      let route = this.routes.get(n.id);
      if (route && (route.revision !== this.world.revision || this.time - route.time > 1.5)) { this.routes.delete(n.id); route = null; }
      if (!route && this.walk(n, direct, speed, dt)) { n.yaw = Math.atan2(direct.x, direct.z); return; }
      if (!route) { route = { points: this.path(n, target), time: this.time, revision: this.world.revision }; this.routes.set(n.id, route); }
      while (route.points.length && Math.hypot(n.x - route.points[0].x, n.z - route.points[0].z) < .16) route.points.shift();
      if (route.points.length) { const d = direction(n, route.points[0]); n.yaw = Math.atan2(d.x, d.z); this.walk(n, d, speed, dt); }
    }
    kill(n) { if (n.phase === 'dead') return; n.hp = 0; n.phase = 'dead'; n.timer = 0; n.reward = 3; n.known = true; this.events.push({ kind: 'crawler-dead', point: pos(n) }); this.revision++; }
    hit(n, amount, mode, dir) {
      if (!this.owns(n) || !this.progress.expedition.deep?.open || n.hp <= 0 || !(amount > 0) || this.terrain(n)) return false;
      n.known = true; n.alert = 4; this.combat.hitFlash = .14; this.revision++;
      const rear = dir && dir.x * Math.sin(n.yaw) + dir.z * Math.cos(n.yaw) > .5;
      if (n.shell > 0 && !rear) {
        const factor = mode === 'lance' ? 2.4 : mode === 'blast' ? 2 : mode === 'rift' ? 1.7 : mode === 'pulse' ? .9 : mode === 'axe' ? .6 : mode === 'gravity' ? .25 : .4;
        n.shell = Math.max(0, n.shell - amount * factor);
        if (!n.shell) { n.phase = 'stunned'; n.timer = 1.1; this.events.push({ kind: 'shell-break', point: pos(n) }); }
      } else { n.hp = Math.max(0, n.hp - amount * (rear ? 1.25 : 1)); if (!n.hp) this.kill(n); }
      if (n.hp > 0 && ['pulse', 'blast', 'rift'].includes(mode)) { n.phase = 'stunned'; n.timer = Math.max(n.timer, .8); }
      else if (n.hp > 0 && mode === 'axe' && !n.shell) { n.phase = 'stunned'; n.timer = Math.max(n.timer, .35); }
      if (n.hp > 0 && mode === 'gravity' && dir && !n.shell) this.walk(n, { x: -dir.x, y: 0, z: -dir.z }, 1.8, Math.min(.1, amount / 14));
      return true;
    }
    land(n) {
      if (n.known && n.vy < -7 && n.hp > 0) { n.hp = Math.max(0, n.hp - Math.min(60, (-n.vy - 6) * 4)); if (!n.hp) this.kill(n); }
      n.vy = 0;
    }
    fall(n, dt) {
      if (this.supported(n) && n.vy <= 0) { this.land(n); return false; }
      n.vx = n.vz = 0; n.vy = Math.max(-20, n.vy - 22 * dt);
      const next = { ...pos(n), y: n.y + n.vy * dt };
      if (this.segment(n, next, n.id)) { Object.assign(n, next); if (n.hp > 0) { n.phase = 'recover'; n.timer = .65; } return true; }
      let lo = 0, hi = 1; for (let i = 0; i < 9; i++) { const t = (lo + hi) / 2; if (this.segment(n, { ...next, y: n.y + n.vy * dt * t }, n.id)) lo = t; else hi = t; }
      n.y += n.vy * dt * lo;
      this.land(n); return true;
    }
    step(dt, player) {
      this.time += dt;
      for (const n of this.nodes) {
        if (n.phase === 'buried') { if (this.terrain(n)) continue; n.phase = 'idle'; }
        if (this.fall(n, dt)) { this.revision++; continue; }
        if (n.hp <= 0 || !this.progress.expedition.deep?.open) continue;
        n.timer = Math.max(0, n.timer - dt); n.alert = Math.max(0, n.alert - dt); n.vx = n.vz = 0;
        const target = { x: player.x, y: player.y + .65, z: player.z }, d = dist(n, target), home = this.homes[n.id - 200];
        const territory = player.y < -80 && Math.hypot(player.x - home.x, player.z - home.z) < 11 && Math.abs(player.y - n.y) < 4;
        const sees = territory && d < 9 && this.world.clearLine(n, target, .05);
        if (sees) { n.known = true; n.alert = 4; n.lastSeen = pos(target); }
        if (['recover', 'stunned'].includes(n.phase)) { if (!n.timer) n.phase = 'idle'; }
        else if (n.phase === 'windup') { if (!n.timer) { n.phase = 'lunge'; n.timer = .42; } }
        else if (n.phase === 'lunge') {
          const moved = this.walk(n, n.direction, 6, dt);
          if (dist(n, target) < 1.65 && this.world.clearLine(n, target, .05)) { this.combat.hurt(24); n.phase = 'recover'; n.timer = 1.35; }
          else if (!n.timer || !moved) { n.phase = 'recover'; n.timer = 1.35; }
        } else if (sees && d < 3.4 && Math.abs(target.y - n.y) < 1.2) {
          n.phase = 'windup'; n.timer = .95; n.direction = direction(n, target); n.yaw = Math.atan2(n.direction.x, n.direction.z); this.events.push({ kind: 'crawler-warn', point: pos(n) });
        } else if (n.alert && n.lastSeen && territory) { n.phase = 'chase'; this.navigate(n, n.lastSeen, dt); }
        else n.phase = 'idle';
        this.revision++;
      }
    }
    update(dt, player, obstacles = []) {
      const before = this.revision; this.player = player; this.obstacles = obstacles;
      this.accumulator += Math.min(.1, dt); while (this.accumulator + 1e-10 >= 1 / 120) { this.step(1 / 120, player); this.accumulator -= 1 / 120; }
      this.save(); return before !== this.revision;
    }
    targets() { if (!this.progress.expedition.deep?.open) return []; for (const n of this.nodes) if (n.phase === 'buried' && !this.terrain(n)) n.phase = 'idle'; return this.nodes; }
    interaction(player) {
      const h = player.head, d = player.direction;
      for (const n of this.nodes) if (!n.hp && (n.reward || !this.state.recovered.includes(n.id))) {
        const range = dist(h, n); if (range > 3.4 || range < .1 || ((n.x - h.x) * d.x + (n.y - h.y) * d.y + (n.z - h.z) * d.z) / range < .75 || !this.world.clearLine(h, n, .05)) continue;
        const tooth = !this.state.recovered.includes(n.id), full = this.progress.expedition.supplies.bombs >= 99;
        return { kind: 'crawler-loot', id: n.id, locked: !tooth && full, label: tooth ? 'Recover basalt tooth / Otis can fit an impact head' : full ? 'Crawler salts / charge pouch full' : `Recover crawler salts / ${n.reward} charges` };
      }
      return null;
    }
    collect(id, player) {
      const a = this.interaction(player); if (!a || a.id !== id || a.locked) return false;
      const n = this.nodes.find(n => n.id === id), first = !this.state.recovered.length;
      if (!this.state.recovered.includes(id)) this.state.recovered.push(id);
      const count = Math.min(n.reward, 99 - this.progress.expedition.supplies.bombs); n.reward -= count; this.progress.expedition.supplies.bombs += count;
      this.events.push({ kind: 'tooth', first }); this.revision++; this.save(); return true;
    }
    buy() { if (this.state.impactHead || !this.state.recovered.length || this.progress.cash < PRICE) return false; this.progress.cash -= PRICE; this.state.impactHead = this.world.impactHead = true; this.revision++; return true; }
    markers() { return this.nodes.filter(n => n.known && (n.hp || n.reward || !this.state.recovered.includes(n.id))).map(n => ({ ...pos(n), name: n.hp ? 'Shale crawler' : 'Basalt tooth / crawler salts', type: n.hp ? 'enemy' : 'cache', color: n.hp ? '#d29b79' : '#9cdbde' })); }
    hint(n) { return n.phase === 'windup' ? 'Claws raised. Sidestep or lift; it commits to that direction.' : !n.shell ? 'Shell broken. Axe or drill the exposed body.' : 'Lance or explosives break its shell. Circle behind, or cut away its footing.'; }
    save() { this.state.enemies = this.nodes.map(n => ({ id: n.id, ...pos(n), hp: n.hp, shell: n.shell, phase: n.phase, timer: n.timer, yaw: n.yaw, known: n.known, vx: n.vx, vy: n.vy, vz: n.vz, direction: { ...n.direction }, alert: n.alert, lastSeen: n.lastSeen ? pos(n.lastSeen) : null, reward: n.reward })); }
    static validate(s, world, progress) {
      const homes = Crawlers.sites(world), finite = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
      const point = p => p && finite(p.x, -13, 13) && finite(p.z, -13, 13) && finite(p.y, world.floor + .5, -80);
      // The player's narrower body can stand closer to the claim edge than a crawler.
      const sighting = p => p && finite(p.x, -14, 14) && finite(p.z, -14, 14) && finite(p.y, world.floor + .4, -79.3);
      if (!s || s.version !== 1 || typeof s.impactHead !== 'boolean' || !Array.isArray(s.recovered) || s.recovered.length > homes.length || new Set(s.recovered).size !== s.recovered.length || s.recovered.some(id => !Number.isInteger(id) || id < 200 || id >= 200 + homes.length) || s.impactHead && !s.recovered.length || !Array.isArray(s.enemies) || s.enemies.length !== homes.length) throw new Error('Invalid crawler equipment.');
      const enemies = s.enemies.map((n, i) => {
        if (!n || n.id !== 200 + i || !point(n) || !finite(n.hp, 0, HP) || !finite(n.shell, 0, SHELL) || !PHASES.includes(n.phase) || (n.hp === 0) !== (n.phase === 'dead') || !finite(n.timer, 0, 1.35) || !finite(n.yaw, -Math.PI, Math.PI) || typeof n.known !== 'boolean' || !['vx', 'vy', 'vz'].every(k => finite(n[k], -25, 25)) || !finite(n.alert, 0, 4) || n.lastSeen !== null && !sighting(n.lastSeen) || !n.direction || n.direction.y !== 0 || !finite(n.direction.x, -1, 1) || !finite(n.direction.z, -1, 1) || Math.abs(Math.hypot(n.direction.x, n.direction.z) - 1) > 1e-5 || !Number.isInteger(n.reward) || n.reward < 0 || n.reward > 3 || n.hp > 0 && (n.reward || s.recovered.includes(n.id)) || n.hp === 0 && !s.recovered.includes(n.id) && n.reward !== 3 || (n.hp < HP || n.shell < SHELL) && !n.known) throw new Error('Invalid shale crawler.');
        if ((n.known || n.hp < HP || n.shell < SHELL || n.reward) && !progress.expedition.deep?.open || n.phase === 'buried' && (dist(n, homes[i]) > 1e-6 || n.hp !== HP || n.shell !== SHELL || n.known) || n.phase !== 'buried' && OFFSETS.some(o => world.density(n.x + o[0], n.y + o[1], n.z + o[2]) < -.011)) throw new Error('Crawler is inside terrain or behind a sealed rootway.');
        return { id: n.id, ...pos(n), hp: n.hp, shell: n.shell, phase: n.phase, timer: n.timer, yaw: n.yaw, known: n.known, vx: n.vx, vy: n.vy, vz: n.vz, direction: { ...n.direction }, alert: n.alert, lastSeen: n.lastSeen ? pos(n.lastSeen) : null, reward: n.reward };
      });
      return { version: 1, impactHead: s.impactHead, recovered: [...s.recovered], enemies };
    }
  }
  Object.assign(B, { Crawlers, CRAWLER_SIZE: SIZE, CRAWLER_HP: HP, CRAWLER_SHELL: SHELL, IMPACT_HEAD_PRICE: PRICE });
})(B2);
