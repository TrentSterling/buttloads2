/* Persistent cinder moths, terrain-aware flight and recoverable expedition cargo. */
'use strict';
(function (B) {
  const SIZE = [1.04, .74, 1.04], BODY = B.boxOffsets(SIZE), DROP = B.boxOffsets([.3, .3, .3]);
  const PHASES = ['buried', 'idle', 'chase', 'windup', 'lunge', 'recover', 'stunned', 'dead'];
  const point = p => ({ x: p.x, y: p.y, z: p.z }), distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const direction = (a, b) => { const d = distance(a, b) || 1; return { x: (b.x - a.x) / d, y: (b.y - a.y) / d, z: (b.z - a.z) / d }; };
  class Combat {
    static sites(world) { return world.caverns?.networks.length ? world.caverns.networks.map(n => point(n.branch)) : B.RELICS.slice(0, 3).map(n => ({ x: n.x + 1.5, y: n.y + .6, z: n.z + 1.5 })); }
    constructor(world, progress) {
      this.world = world; this.progress = progress; this.homes = Combat.sites(world);
      this.state = progress.expedition.combat ||= { version: 1, health: 100, grace: 0, rescues: 0, weaponCooldown: 0, swing: 0, enemies: this.homes.map((p, id) => ({ id, ...p, hp: 60, phase: 'buried', timer: 0, yaw: 0, known: false, reward: 0, alert: 0, lastSeen: null, direction: { x: 0, y: 0, z: 1 } })), drops: [] };
      this.enemies = this.state.enemies; this.drops = this.state.drops.map(n => ({ ...n, cargo: [...n.cargo], radius: .2, kind: 0, collected: false, offsets: DROP }));
      this.physics = new B.OreSystem(world, this.drops, this.state.drops.map(n => ({ ...n })));
      this.accumulator = 0; this.events = []; this.lastBlast = this.lastPulse = 0; this.hitFlash = 0; this.hurtFlash = 0; this.needsRescue = false; this.obstacles = []; this.lights = [];
      this.routes = new Map(); this.nav = new Map(); this.navRevision = -1; this.time = 0; this.revision = 0;
    }
    static validate(s, world) {
      const finite = (n, min, max) => Number.isFinite(n) && n >= min && n <= max, integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
      const vec = (p, speed = false) => p && ['x', 'y', 'z'].every(k => Number.isFinite(p[k])) && (speed ? Math.abs(Math.hypot(p.x, p.y, p.z) - 1) < 1e-5 : Math.abs(p.x) <= 14 && Math.abs(p.z) <= 14 && p.y >= world.floor + .4 && p.y <= -5);
      if (!s || s.version !== 1 || !finite(s.health, .001, 100) || !finite(s.grace, 0, 3) || !integer(s.rescues, 0, 1e9) || !finite(s.weaponCooldown, 0, .68) || !finite(s.swing, 0, .19) || !Array.isArray(s.enemies) || s.enemies.length !== 3 || !Array.isArray(s.drops) || s.drops.length > 4) throw new Error('Invalid combat state.');
      const homes = Combat.sites(world), enemies = [];
      for (const [id, n] of s.enemies.entries()) {
        if (!n || n.id !== id || !vec(n) || !finite(n.hp, 0, 60) || !PHASES.includes(n.phase) || (n.hp === 0) !== (n.phase === 'dead') || !finite(n.timer, 0, 5) || !finite(n.yaw, -Math.PI * 2, Math.PI * 2) || typeof n.known !== 'boolean' || !integer(n.reward, 0, 2) || n.hp > 0 && n.reward || !finite(n.alert, 0, 4) || n.lastSeen !== null && !vec(n.lastSeen) || !vec(n.direction, true)) throw new Error('Invalid cinder moth.');
        if (n.phase === 'buried' ? n.hp !== 60 || n.known || distance(n, homes[id]) > 1e-6 : n.hp > 0 && BODY.some(p => world.density(n.x + p[0], n.y + p[1], n.z + p[2]) < -.01)) throw new Error('Cinder moth is inside terrain.');
        enemies.push({ id, ...point(n), hp: n.hp, phase: n.phase, timer: n.timer, yaw: n.yaw, known: n.known, reward: n.reward, alert: n.alert, lastSeen: n.lastSeen ? point(n.lastSeen) : null, direction: point(n.direction) });
      }
      const ids = new Set(), drops = [];
      for (const n of s.drops) {
        if (!n || !integer(n.id, 0, 3) || ids.has(n.id) || !['x', 'y', 'z', 'vx', 'vy', 'vz'].every(k => Number.isFinite(n[k])) || Math.abs(n.x) > 14 || Math.abs(n.z) > 14 || n.y < world.floor || n.y > 3 || ['vx', 'vy', 'vz'].some(k => Math.abs(n[k]) > 25) || !Array.isArray(n.cargo) || n.cargo.length !== B.ORES.length || n.cargo.some(n => !integer(n, 0, 1e9))) throw new Error('Invalid recovery cache.');
        if (n.id === 3 ? n.charges !== 0 || !n.cargo.some(n => n > 0) : !integer(n.charges, 1, 2) || n.cargo.some(n => n) || enemies[n.id].hp !== 0 || enemies[n.id].reward !== n.charges) throw new Error('Invalid recovered supplies.');
        if (DROP.some(p => world.density(n.x + p[0], n.y + p[1], n.z + p[2]) < -.01)) throw new Error('Recovery cache is inside terrain.');
        ids.add(n.id); drops.push({ id: n.id, ...point(n), vx: n.vx, vy: n.vy, vz: n.vz, charges: n.charges, cargo: [...n.cargo] });
      }
      if (enemies.some(n => n.reward > 0 && !ids.has(n.id))) throw new Error('Missing recovered supplies.');
      return { version: 1, health: s.health, grace: s.grace, rescues: s.rescues, weaponCooldown: s.weaponCooldown, swing: s.swing, enemies, drops };
    }
    blocked(p) {
      if (Math.abs(p.x) > 13.3 || Math.abs(p.z) > 13.3 || p.y < this.world.floor + 1 || p.y > -5.5) return true;
      if (this.obstacles.some(b => p.x + SIZE[0] / 2 > b[0] && p.x - SIZE[0] / 2 < b[3] && p.y + SIZE[1] / 2 > b[1] && p.y - SIZE[1] / 2 < b[4] && p.z + SIZE[2] / 2 > b[2] && p.z - SIZE[2] / 2 < b[5])) return true;
      return BODY.some(o => this.world.density(p.x + o[0], p.y + o[1], p.z + o[2]) < -.004);
    }
    segment(a, b) {
      const count = Math.max(1, Math.ceil(distance(a, b) / .08));
      for (let i = 1; i <= count; i++) { const t = i / count; if (this.blocked({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t })) return false; }
      return true;
    }
    path(from, target, home) {
      // A bounded local A* search. Current terrain and full body clearance decide every edge.
      this.nav.clear();
      const step = .75, key = p => p.join(','), pos = p => ({ x: p[0] * step, y: p[1] * step, z: p[2] * step });
      const rounded = [Math.round(from.x / step), Math.round(from.y / step), Math.round(from.z / step)], starts = [];
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) starts.push([rounded[0] + x, rounded[1] + y, rounded[2] + z]);
      starts.sort((a, b) => distance(from, pos(a)) - distance(from, pos(b)));
      const start = starts.find(p => !this.blocked(pos(p)) && this.segment(from, pos(p))); if (!start) return [];
      const h = p => distance(pos(p), target), open = [{ p: start, cost: 0, score: h(start) }], costs = new Map([[key(start), 0]]), parents = new Map(), closed = new Set();
      let end = null;
      for (let visits = 0; open.length && visits < 700; visits++) {
        let at = 0; for (let i = 1; i < open.length; i++) if (open[i].score < open[at].score) at = i;
        const current = open.splice(at, 1)[0], k = key(current.p); if (closed.has(k)) continue; closed.add(k);
        if (h(current.p) < 1.15 && this.segment(pos(current.p), target)) { end = current.p; break; }
        for (let axis = 0; axis < 3; axis++) for (const sign of [-1, 1]) {
          const p = current.p.slice(); p[axis] += sign; const k2 = key(p), pt = pos(p), cost = current.cost + step;
          if (closed.has(k2) || distance(pt, home) > 11 || costs.has(k2) && costs.get(k2) <= cost) continue;
          let blocked = this.nav.get(k2); if (blocked === undefined) { blocked = this.blocked(pt); this.nav.set(k2, blocked); }
          if (blocked || !this.segment(pos(current.p), pt)) continue;
          costs.set(k2, cost); parents.set(k2, current.p); open.push({ p, cost, score: cost + h(p) });
        }
      }
      if (!end) return [];
      const route = [point(target)]; for (let p = end; p; p = parents.get(key(p))) route.unshift(pos(p));
      return route;
    }
    move(n, target, speed, dt) {
      const dist = distance(n, target); if (dist < .01) return true;
      const dir = direction(n, target), travel = Math.min(dist, speed * dt), count = Math.max(1, Math.ceil(travel / .08));
      for (let i = 0; i < count; i++) {
        const next = { x: n.x + dir.x * travel / count, y: n.y + dir.y * travel / count, z: n.z + dir.z * travel / count };
        if (this.blocked(next)) return false;
        Object.assign(n, next);
      }
      n.yaw = Math.atan2(dir.x, dir.z); this.revision++; return true;
    }
    navigate(n, target, speed, dt) {
      if (this.segment(n, target) && this.move(n, target, speed, dt)) { this.routes.delete(n.id); return true; }
      let route = this.routes.get(n.id);
      if (!route || route.revision !== this.world.revision && this.time - route.time > .4 || this.time - route.time > 1.2) {
        route = { points: this.path(n, target, this.homes[n.id]), time: this.time, revision: this.world.revision }; this.routes.set(n.id, route);
      }
      while (route.points.length && distance(n, route.points[0]) < .2) route.points.shift();
      if (route.points.length && !this.move(n, route.points[0], speed, dt)) route.points.length = 0;
    }
    lightAt(p) { return this.lights.find(l => distance(l, p) < l.range && this.world.clearLine(l, p, .06)); }
    addDrop(id, p, cargo = Array(B.ORES.length).fill(0), charges = 0) {
      const n = { id, ...point(p), vx: 0, vy: 0, vz: 0, cargo: [...cargo], charges, radius: .2, kind: 0, offsets: DROP, collected: false, motion: 'falling' };
      this.drops.push(n); this.physics.index.move(n); this.physics.loose.add(n); this.physics.awake.add(n); return n;
    }
    hit(n, amount, mode, dir) {
      if (!n || n.hp <= 0 || n.phase === 'buried' || !(amount > 0)) return false;
      this.revision++;
      n.known = true; n.hp = Math.max(0, n.hp - amount); n.alert = 4; this.hitFlash = .14;
      if (n.hp === 0) { n.phase = 'dead'; n.timer = 0; n.reward = 2; this.addDrop(n.id, n, undefined, 2); this.events.push({ kind: 'kill', point: point(n) }); }
      else if (['axe', 'pulse', 'blast', 'rift'].includes(mode)) { n.phase = 'stunned'; n.timer = .65; this.events.push({ kind: 'hit', point: point(n) }); }
      if (n.hp > 0 && dir && mode === 'gravity') this.move(n, { x: n.x - dir.x, y: n.y - dir.y, z: n.z - dir.z }, 1.8, amount / 14);
      return true;
    }
    area(p, radius, damage, mode) {
      for (const n of this.enemies) if (n.hp > 0 && distance(n, p) <= radius + .4 && this.world.clearLine(p, n, .05)) {
        // A blast may be the excavation that first exposes a buried creature.
        if (n.phase === 'buried' && !this.blocked(n)) n.phase = 'idle';
        this.hit(n, damage * Math.max(.35, 1 - distance(n, p) / (radius + 1.2)), mode);
      }
    }
    hurt(amount) {
      if (this.state.grace > 0 || this.needsRescue) return false;
      this.revision++;
      this.state.health = Math.max(0, this.state.health - amount); this.state.grace = 1; this.hurtFlash = .4;
      this.events.push({ kind: 'hurt' }); if (this.state.health <= 0) this.needsRescue = true; return true;
    }
    rescue(player) {
      const cargo = this.progress.cargo, existing = this.drops.find(n => n.id === 3 && !n.collected);
      if (cargo.some(n => n)) {
        const cache = existing || this.addDrop(3, { x: player.x, y: player.y + .9, z: player.z });
        cargo.forEach((v, i) => { cache.cargo[i] += v; cargo[i] = 0; });
      }
      this.state.health = 100; this.state.grace = 3; this.state.rescues++; this.state.swing = 0; this.needsRescue = false; this.save();
    }
    interaction(player) {
      const h = player.head, d = player.direction;
      for (const n of this.drops) {
        const range = distance(h, n), v = direction(h, n);
        if (n.collected || range > 3 || v.x * d.x + v.y * d.y + v.z * d.z < .8 || !this.world.clearLine(h, n, .05)) continue;
        const cache = n.id === 3, full = cache ? this.progress.cargo.reduce((a, b) => a + b, 0) >= B.GEAR.cargo.values[this.progress.gear.cargo] : this.progress.expedition.supplies.bombs >= 99;
        return { kind: 'combat-drop', id: n.id, locked: full, label: cache ? full ? 'Recovery cache / cargo full' : 'Recover lost cargo' : full ? 'Cinder husk / charge pouch full' : `Recover cinder husk / ${n.charges} charges` };
      }
      return null;
    }
    collect(id, player) {
      const action = this.interaction(player); if (!action || action.id !== id || action.locked) return false;
      const n = this.drops.find(n => n.id === id && !n.collected);
      if (id === 3) {
        let space = B.GEAR.cargo.values[this.progress.gear.cargo] - this.progress.cargo.reduce((a, b) => a + b, 0);
        for (let i = B.ORES.length - 1; i >= 0; i--) { const count = Math.min(space, n.cargo[i]); n.cargo[i] -= count; this.progress.cargo[i] += count; space -= count; }
        n.collected = n.cargo.every(v => v === 0);
      } else {
        const supplies = this.progress.expedition.supplies, count = Math.min(n.charges, 99 - supplies.bombs); supplies.bombs += count; n.charges -= count; this.enemies[id].reward = n.charges; n.collected = n.charges === 0;
      }
      if (n.collected) { this.physics.awake.delete(n); this.physics.loose.delete(n); this.physics.index.remove(n); this.drops.splice(this.drops.indexOf(n), 1); }
      this.save(); return true;
    }
    step(dt, player) {
      if (this.state.grace > 0 || player.y > -.5 && this.state.health < 100) this.revision++;
      this.time += dt; this.state.grace = Math.max(0, this.state.grace - dt);
      const target = { x: player.x, y: player.y + 1.1, z: player.z };
      if (player.y > -.5) this.state.health = Math.min(100, this.state.health + dt * 12);
      for (const n of this.enemies) {
        if (n.hp <= 0) continue;
        if (n.phase === 'buried') { if (!this.blocked(n)) { n.phase = 'idle'; this.revision++; } else continue; }
        if (n.timer > 0 || n.alert > 0) this.revision++;
        n.timer = Math.max(0, n.timer - dt); n.alert = Math.max(0, n.alert - dt);
        const dist = distance(n, target), inTerritory = player.y < -6 && distance(target, this.homes[n.id]) < 10;
        const sees = inTerritory && dist < 7 && this.world.clearLine(n, target, .05);
        if (sees) { n.known = true; n.lastSeen = { ...point(target), y: B.clamp(target.y, this.world.floor + .4, -5.5) }; n.alert = 4; this.revision++; }
        const lamp = this.lightAt(n), sheltered = this.lightAt(target);
        if ((lamp || sheltered) && !['stunned', 'recover'].includes(n.phase)) { n.phase = 'recover'; n.timer = 1; }
        if (n.phase === 'stunned') { if (!n.timer) n.phase = 'idle'; continue; }
        if (n.phase === 'recover') {
          if (lamp) { const away = direction(lamp, n); this.move(n, { x: n.x + away.x, y: n.y + away.y, z: n.z + away.z }, 2.1, dt); }
          if (!n.timer) n.phase = 'idle'; continue;
        }
        if (n.phase === 'windup') {
          if (!n.timer) { n.phase = 'lunge'; n.timer = .42; this.events.push({ kind: 'lunge', point: point(n) }); }
          continue;
        }
        if (n.phase === 'lunge') {
          const moved = this.move(n, { x: n.x + n.direction.x, y: n.y + n.direction.y, z: n.z + n.direction.z }, 7, dt);
          if (distance(n, target) < .9 && this.world.clearLine(n, target, .05)) { this.hurt(18); n.phase = 'recover'; n.timer = 1.25; }
          else if (!n.timer || !moved) { n.phase = 'recover'; n.timer = 1.25; }
          continue;
        }
        if (sees && dist < 3.2 && !sheltered) { n.phase = 'windup'; n.timer = .85; n.direction = direction(n, target); n.yaw = Math.atan2(n.direction.x, n.direction.z); this.events.push({ kind: 'warn', point: point(n) }); continue; }
        if (n.alert && n.lastSeen && inTerritory && !sheltered) { n.phase = 'chase'; this.navigate(n, n.lastSeen, 1.65, dt); }
        else {
          n.phase = 'idle';
          if (distance(n, this.homes[n.id]) > .7) this.navigate(n, this.homes[n.id], .9, dt);
        }
      }
    }
    update(dt, game) {
      this.obstacles = game.player.obstacles; this.hitFlash = Math.max(0, this.hitFlash - dt); this.hurtFlash = Math.max(0, this.hurtFlash - dt);
      if (this.navRevision !== this.world.revision) { this.navRevision = this.world.revision; this.nav.clear(); }
      this.lights = [...game.gadgets.nodes.filter(n => n.type === 'lamp').map(n => ({ ...point(n), range: 3 })), ...game.refuges.nodes.filter(n => game.refuges.state.lit.includes(n.id)).map(n => ({ x: n.x, y: n.y + .55, z: n.z, range: 4.2 }))];
      for (const b of game.gadgets.blasts) if (b.serial > this.lastBlast) {
        this.lastBlast = b.serial;
        const struck = new Set();
        for (let d = 0; d <= (b.length || 0); d += .5) {
          const p = { x: b.x + (b.direction?.x || 0) * d, y: b.y + (b.direction?.y || 0) * d, z: b.z + (b.direction?.z || 0) * d };
          for (const n of this.enemies) if (!struck.has(n.id) && n.hp > 0 && distance(n, p) <= b.radius + .4 && this.world.clearLine(p, n, .05)) { struck.add(n.id); if (n.phase === 'buried' && !this.blocked(n)) n.phase = 'idle'; this.hit(n, 70 * Math.max(.35, 1 - distance(n, p) / (b.radius + 1.2)), 'blast'); }
        }
      }
      if (game.expedition.pulseSerial !== this.lastPulse) { this.lastPulse = game.expedition.pulseSerial; const p = game.expedition.lastPulse; if (p) this.area(p, p.radius, p.magic ? 75 : 44, p.magic ? 'rift' : 'pulse'); }
      this.accumulator += Math.min(.1, dt); while (this.accumulator + 1e-10 >= 1 / 120) { this.step(1 / 120, game.player); this.accumulator -= 1 / 120; }
      if (this.physics.update(dt)) this.revision++; this.save();
    }
    markers() { return [...this.enemies.filter(n => n.known && n.hp > 0).map(n => ({ ...point(n), name: 'Cinder moth', type: 'enemy', color: '#f1a076' })), ...this.drops.map(n => ({ ...point(n), name: n.id === 3 ? 'Lost cargo' : 'Cinder husk', type: 'cache', color: n.id === 3 ? '#ffffff' : '#ecc16e' }))]; }
    save() { this.state.drops = this.drops.filter(n => !n.collected).map(n => ({ id: n.id, ...point(n), vx: n.vx, vy: n.vy, vz: n.vz, charges: n.charges, cargo: [...n.cargo] })); }
  }
  Object.assign(B, { Combat, MOTH_SIZE: SIZE });
})(B2);
