/* Depth progression, recoverable machinery and the thing beneath the mine. */
'use strict';
(function (B) {
  const STRATA = [
    { depth: 0, name: 'The backyard', subtitle: 'A little copper. An unreasonable ambition.', color: '#edbe60', unlock: 'Cutter & scanner' },
    { depth: 9, name: 'Rustwater', subtitle: 'There was a mine here before your yard.', color: '#e89c6f', unlock: 'Scoop, mining axe, salvage tether & remote satchels' },
    { depth: 25, name: 'The white roots', subtitle: 'The rock grew around the machines.', color: '#a9dcdf', unlock: 'Precision lance & bore charges' },
    { depth: 43, name: 'The hollow choir', subtitle: 'That sound is coming from inside the stone.', color: '#baacf1', unlock: 'Deep receiver: +10 m scanner range' },
    { depth: 59, name: 'The impossible garden', subtitle: 'Nothing down here remembers gravity.', color: '#78f1cc', unlock: 'Echo sight: scans reveal sealed geodes' },
    ...B.DEEP_STRATA
  ];
  const TOOLS = {
    cutter: { key: '1', name: 'Cutter', short: 'CUT', hint: 'Balanced excavation', color: '#edbe60', radius: 1, power: 1, depth: 0 },
    scoop: { key: '2', name: 'Scoop', short: 'SCOOP', hint: 'Wide cuts in soil and clay', color: '#e89c6f', radius: 1.55, power: 1.4, depth: 9 },
    lance: { key: '3', name: 'Lance', short: 'LANCE', hint: 'Narrow, fast cuts through hard rock', color: '#a9dcdf', radius: .72, power: 2.8, depth: 25 },
    resonance: { key: '4', name: 'Resonator', short: 'PULSE', hint: 'Hold to charge a rock-breaking pulse', color: '#baacf1', radius: 1.5, power: 1, recovery: 1 },
    gravity: { key: '5', name: 'Heart of the mine', short: 'GRAVITY', hint: 'Hold to draw ore and drain creatures. Q tears open rock.', color: '#78f1cc', radius: 1, power: 1, magic: true },
    axe: { key: '6', name: 'Mining axe', short: 'AXE', hint: 'A short, heavy swing. Chips rock and staggers creatures.', color: '#d59e6b', radius: .65, power: 7, depth: 9 },
    sling: { key: '7', name: 'Stonewright sling', short: 'SLING', hint: 'Hold on a loose mineral to lift it. Release to throw.', color: '#9cdece', radius: 1, power: 0, workshop: true }
  };
  const SALVAGE = [
    { id: 0, name: 'Survey flywheel', x: -4, y: -12.4, z: 1, size: [1.5, 1.2, 1.5], reward: 240, unlock: 'Survey anchor', brief: 'Excavate around the flywheel. Tether it with E, then lift it through a clear shaft to the surface. Delivery unlocks a return anchor.' },
    { id: 1, name: 'Resonance engine', x: 5, y: -32.4, z: -4, size: [2.35, 1.8, 1.85], reward: 900, unlock: 'Resonator', brief: 'This machine is wider than you. Use the scoop to open a hauling route, tether it with E, and bring it above ground. It powers a new tool.' }
  ];
  const SEAL = { x: -3, y: -53, z: -1 };
  // Each stone protrudes from a different wall. Excavation and a charged pulse are both required.
  const RUNES = [
    { x: -6.9, y: -51.8, z: -1 }, { x: .9, y: -51.8, z: -1 }, { x: -3, y: -51.4, z: -4.9 }
  ];
  const HEART = { x: 2, y: -67.2, z: 2 };
  const VAULTS = [
    { x: 9, y: -19, z: -7, name: 'The amber egg', reward: 1600 },
    { x: -9, y: -40, z: 6, name: 'The drowned star', reward: 2800 },
    { x: 9, y: -64, z: -7, name: 'The seed of tomorrow', reward: 4400 }
  ];
  const boxOffsets = size => {
    const out = [], steps = size.map(v => Math.ceil(v / .35));
    // Sample the volume too: a thin pillar inside the load must block it.
    for (let x = 0; x <= steps[0]; x++) for (let y = 0; y <= steps[1]; y++) for (let z = 0; z <= steps[2]; z++) out.push([(x / steps[0] - .5) * size[0], (y / steps[1] - .5) * size[1], (z / steps[2] - .5) * size[2]]);
    return out;
  };
  function availableTools(state) {
    const e = state.expedition;
    return Object.keys(TOOLS).filter(k => { const t = TOOLS[k]; return t.workshop ? !!e.kinetics?.unlocked : t.magic ? e.awakened : t.recovery !== undefined ? e.recovered.includes(t.recovery) : state.deepest >= t.depth; });
  }
  function chapter(depth) { return STRATA.findLastIndex(s => depth >= s.depth); }
  class Expedition {
    constructor(world, economy, saved) {
      this.world = world; this.economy = economy; this.state = economy.state.expedition;
      this.tether = null; this.snagged = false; this.obstruction = null; this.obstructionTime = 0; this.charge = 0; this.cooldown = 0; this.pulseSerial = 0; this.lastPulse = null; this.events = [];
      this.bodies = SALVAGE.map(s => ({ ...s, radius: 1.5, kind: 0, collected: this.state.recovered.includes(s.id), offsets: boxOffsets(s.size) }));
      this.physics = new B.OreSystem(world, this.bodies, saved || this.state.bodies);
      this.physics.accelerate = (n, dt) => {
        if (n.id !== this.tether || !this.toward) { n.vy = Math.max(-12, n.vy - 18 * dt); return; }
        const p = this.toward, dx = p.x - n.x, dy = p.y - n.y, dz = p.z - n.z, distance = Math.hypot(dx, dy, dz);
        if (distance > 8 || !world.clearLine(n, p, .15)) { this.snagged = true; n.vx *= .8; n.vz *= .8; n.vy = Math.max(-12, n.vy - 18 * dt); return; }
        const speed = Math.min(this.state.awakened ? 9 : 4.5, Math.max(0, distance - 2.5) * 3), blend = 1 - Math.exp(-dt * 12);
        for (const [v, delta] of [['vx', dx], ['vy', dy], ['vz', dz]]) n[v] += (delta / (distance || 1) * speed - n[v]) * blend;
      };
    }
    tools() { return availableTools(this.economy.state); }
    select(key) { if (!this.tools().includes(key)) return false; this.state.tool = key; this.charge = 0; return true; }
    target() {
      for (const s of SALVAGE) if (!this.state.recovered.includes(s.id)) return { ...this.bodies[s.id], name: s.name, brief: s.brief };
      const rune = RUNES.find((_, i) => !this.state.runes.includes(i));
      if (rune) return { ...rune, name: 'The choir seal', brief: 'Expose the three wall stones at 53 m. Strike each with a charged resonator pulse.' };
      if (!this.state.awakened) return { ...HEART, name: 'The living heart', brief: 'The seal is open. Descend into the garden and wake the heart.' };
      const vault = VAULTS.find((_, i) => !this.state.vaults.includes(i));
      return vault ? { ...vault, brief: 'Find a sealed geode. Tear its shell open with Q while holding the heart.' } : { ...HEART, name: 'The mine is yours', brief: 'All three ancient geodes are open. Build the mine you wanted.' };
    }
    attach(id, head) {
      const n = this.bodies[id];
      if (!n || n.collected || this.economy.state.deepest < 9 || Math.hypot(n.x - head.x, n.y - head.y, n.z - head.z) > 4 || !this.world.clearLine(head, n, .15) || this.physics.contact(n).density < -.004) return false;
      this.tether = id; this.toward = head; this.physics.refresh([n]); this.events.push({ text: 'Tether attached. Hold Space to lift; widen the route if the load catches.', tone: 340 }); return true;
    }
    detach() { this.tether = null; this.snagged = false; this.obstruction = null; this.obstructionTime = 0; }
    findObstruction(body) {
      const p = this.toward, dx = p.x - body.x, dy = p.y - body.y, dz = p.z - body.z, distance = Math.hypot(dx, dy, dz);
      if (distance < .01) return null;
      const cable = this.world.ray(p, { x: -dx / distance, y: -dy / distance, z: -dz / distance }, distance - .15);
      if (cable) return cable;
      const contact = this.physics.contact(body, body.x + dx / distance * .12, body.y + dy / distance * .12, body.z + dz / distance * .12);
      return contact.density < -.004 ? contact : null;
    }
    reward(value) { const s = this.economy.state; s.cash += value; s.earned += value; }
    update(dt, player, held, ore) {
      this.cooldown = Math.max(0, this.cooldown - dt); this.toward = player.head; this.snagged = false;
      if (this.tether !== null) {
        const n = this.bodies[this.tether];
        if (Math.hypot(n.x - player.x, n.y - player.head.y, n.z - player.z) > 9) { this.detach(); this.events.push({ text: 'Tether released at its limit. The load stays in your mine.', tone: 180 }); }
        else { this.physics.awake.add(n); n.motion = 'falling'; }
      }
      const n = this.tether === null ? null : this.bodies[this.tether], before = n ? { x: n.x, y: n.y, z: n.z } : null;
      let changed = this.physics.update(dt);
      if (n && Math.hypot(n.x - this.toward.x, n.y - this.toward.y, n.z - this.toward.z) > 2.8 && Math.hypot(n.x - before.x, n.y - before.y, n.z - before.z) < dt * .1) this.snagged = true;
      const obstruction = n && this.snagged ? this.findObstruction(n) : null;
      if (obstruction) { this.obstruction = obstruction; this.obstructionTime = .3; }
      else if ((this.obstructionTime -= dt) <= 0) this.obstruction = null;
      this.snagged ||= !!this.obstruction;
      for (const body of this.bodies) if (!body.collected && body.y - body.size[1] / 2 > .15) {
        body.collected = true; this.physics.awake.delete(body); this.physics.loose.delete(body); this.physics.index.remove(body); this.state.recovered.push(body.id);
        if (this.tether === body.id) this.detach(); this.reward(body.reward); changed = true;
        this.events.push({ title: body.unlock + ' unlocked', text: body.id === 0 ? 'The yard crew recovered the flywheel. B plants a lit survey anchor in your tunnel; G returns you to it from the surface. Your haul stays with you.' : 'The recovered engine drives a resonator. Press 4, then hold the trigger to charge a pulse. It breaks rock and wakes the stones below.', reward: body.reward });
      }
      const tool = this.state.tool;
      if (tool === 'resonance' && held && this.cooldown <= 0) {
        this.charge = Math.min(1, this.charge + dt / .85);
        if (this.charge >= 1) { changed = this.pulse(player, false) || changed; this.charge = 0; }
      } else this.charge = 0;
      if (tool === 'gravity' && held && this.state.awakened && ore) {
        for (const o of ore.index.query(player.head.x, player.head.y, player.head.z, 10)) {
          if (o.motion === 'embedded' || !this.world.clearLine(player.head, o, .12)) continue;
          const dx = player.head.x - o.x, dy = player.head.y - o.y, dz = player.head.z - o.z, d = Math.hypot(dx, dy, dz) || 1;
          ore.awake.add(o); o.motion = 'falling'; o.vx = dx / d * 11; o.vy = dy / d * 11; o.vz = dz / d * 11;
        }
      }
      this.state.bodies = this.physics.snapshot(); return changed;
    }
    pulse(player, magic) {
      if (this.cooldown > 0 || (magic ? !this.state.awakened : !this.state.recovered.includes(1))) return false;
      const head = player.head, dir = player.direction, reach = magic ? 10 : 7;
      const hit = this.world.ray(head, dir, reach);
      let target = hit, best = hit?.distance ?? reach;
      const creature = this.damageTarget?.(head, dir, reach);
      if (creature && creature.distance <= best) { target = creature; best = creature.distance; }
      const structure = !magic && this.structureTarget?.(head,dir,reach);
      if(structure && structure.distance <= best){target=structure;best=structure.distance;}
      const targets = magic ? VAULTS : RUNES;
      for (const p of targets) {
        const dx = p.x - head.x, dy = p.y - head.y, dz = p.z - head.z, along = dx * dir.x + dy * dir.y + dz * dir.z;
        if (along > 0 && along <= best + .45 && Math.hypot(dx - dir.x * along, dy - dir.y * along, dz - dir.z * along) < .75 && this.world.clearLine(head, p, .12)) { target = p; best = along; }
      }
      const radius = magic ? 3.4 : 1.85 + this.economy.state.gear.drill * .15;
      // A center ray can miss a lip that still blocks the player's body. Ream the
      // open passage when no direct terrain or discovery target was found.
      if (!target) {
        const side = { x: Math.cos(player.yaw), z: -Math.sin(player.yaw) };
        const up = { x: -dir.y * side.z, y: dir.z * side.x - dir.x * side.z, z: dir.y * side.x };
        for (const offset of [player.radius + .1, radius * .65]) {
          for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4, from = { x: head.x + (side.x * Math.cos(a) + up.x * Math.sin(a)) * offset, y: head.y + up.y * Math.sin(a) * offset, z: head.z + (side.z * Math.cos(a) + up.z * Math.sin(a)) * offset };
            const rim = this.world.ray(from, dir, reach);
            if (rim && (!target || rim.distance < target.distance)) target = rim;
          }
          if (target) break;
        }
      }
      if (!target) return false;
      this.cooldown = magic ? 2.4 : 1.3;
      this.world.carve(target, radius); this.lastPulse = { ...target, radius, magic }; this.pulseSerial++;
      for (let i = 0; i < targets.length; i++) {
        const p = targets[i], list = magic ? this.state.vaults : this.state.runes;
        if (list.includes(i) || Math.hypot(p.x - target.x, p.y - target.y, p.z - target.z) > (magic ? 1.7 : 1.25) || this.world.density(p.x, p.y, p.z) < .08 || !this.world.clearLine(head, p, .1)) continue;
        list.push(i);
        if (magic) { this.reward(p.reward); this.events.push({ title: this.state.vaults.length === 3 ? 'You own the deep.' : p.name, text: this.state.vaults.length === 3 ? 'Three impossible seeds, recovered machinery, and a heart that answers to you. Your little hole became an entire mine. Keep shaping it; the equipment and the magic are yours.' : 'The stone unfolds into light. Its contents are recovered. The heart keeps beating.', reward: p.reward, complete: this.state.vaults.length === 3 }); }
        else this.events.push({ text: this.state.runes.length === 3 ? 'The choir is awake. Something in the garden has answered.' : `Seal stone awakened (${this.state.runes.length}/3). Listen for the others.`, tone: 260 + i * 130 });
      }
      return true;
    }
    awaken(head) {
      if (this.state.awakened || this.state.runes.length !== 3 || Math.hypot(head.x - HEART.x, head.y - HEART.y, head.z - HEART.z) > 3 || !this.world.clearLine(head, HEART, .2)) return false;
      this.state.awakened = true; this.state.tool = 'gravity'; this.reward(1800);
      this.events.push({ title: 'You brought a drill to a miracle.', text: 'The heart chooses you. Hold the trigger to draw loose minerals through the air. Press Q to tear open stone. Three sealed geodes are calling from the upper layers. The mine is not finished with you.', reward: 1800 }); return true;
    }
    placeAnchor(player) {
      if (!this.state.recovered.includes(0) || player.y > -3 || this.tether !== null || player.blocked(player.x, player.y, player.z)) return false;
      this.state.anchor = { x: player.x, y: player.y, z: player.z, yaw: player.yaw, pitch: player.pitch }; return true;
    }
    returnToAnchor(player) {
      const a = this.state.anchor;
      if (!a || player.y < -.5 || this.tether !== null || player.blocked(a.x, a.y, a.z)) return false;
      player.teleport(a.x, a.y, a.z); player.yaw = a.yaw; player.pitch = a.pitch; return true;
    }
  }
  Object.assign(B, { STRATA, TOOLS, SALVAGE, RUNES, SEAL, HEART, VAULTS, boxOffsets, availableTools, chapter, Expedition });
})(B2);
