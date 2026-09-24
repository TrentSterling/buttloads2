/* One reachable target for excavation and tool damage. Friendly residents are not targets. */
'use strict';
(function (B) {
  const WEAPONS = {
    cutter: { reach: 5.2, damage: 24 }, scoop: { reach: 4, damage: 18 },
    lance: { reach: 5.2, damage: 38 }, axe: { reach: 2.35, damage: 34, cone: .3 },
    resonance: { reach: 7, damage: 40 }, gravity: { reach: 10, damage: 14 }
  };
  function enemyTarget(world, enemies, head, direction, reach, cone = 0) {
    let found = null;
    for (const n of enemies) {
      if (!(n.hp > 0) || n.phase === 'buried') continue;
      const dx = n.x - head.x, dy = n.y - head.y, dz = n.z - head.z;
      const along = dx * direction.x + dy * direction.y + dz * direction.z, bodyRadius = n.targetRadius ?? .52, radius = bodyRadius + cone * Math.max(0, along);
      const off2 = dx * dx + dy * dy + dz * dz - along * along;
      if (along <= 0 || Math.hypot(dx, dy, dz) > reach + bodyRadius || off2 > radius * radius) continue;
      const distance = Math.max(0, along - Math.sqrt(Math.max(0, radius * radius - off2)));
      if (distance > reach || found && distance >= found.distance || !world.clearLine(head, n, .05)) continue;
      found = { kind: 'enemy', node: n, x: n.x, y: n.y, z: n.z, distance };
    }
    return found;
  }
  class ToolActions {
    constructor(world, cutter, combat) { this.world = world; this.cutter = cutter; this.combat = combat; this.target = null; this.swingAge = 1; }
    resolve(player, mode, level, terrain = true) {
      const spec = WEAPONS[mode], enemy = enemyTarget(this.world, this.combat.targets(), player.head, player.direction, spec.reach, spec.cone);
      if (enemy) return enemy;
      const hit = terrain ? this.cutter.trace(player, level, mode, spec.reach) : null;
      return hit ? { ...hit, kind: 'terrain' } : null;
    }
    update(dt, player, progress, held) {
      const s = this.combat.state, mode = progress.expedition.tool, spec = WEAPONS[mode];
      if (mode === 'sling') { s.swing = 0; s.weaponCooldown = Math.max(0, s.weaponCooldown-dt); this.target=null; this.cutter.update(dt,player,progress.gear.drill,false,mode,null); return; }
      const oldCooldown = s.weaponCooldown, oldSwing = s.swing;
      this.swingAge += dt;
      if (mode !== 'axe' || !held) s.weaponCooldown = Math.max(0, s.weaponCooldown - dt);
      if (mode !== 'axe' || !held) s.swing = 0;
      this.target = this.resolve(player, mode, progress.gear.drill, held && mode !== 'gravity' && mode !== 'resonance');
      let cut = held && ['cutter', 'scoop', 'lance'].includes(mode), cutDt = dt;
      if (mode === 'axe' && held) {
        let remaining = dt;
        while (remaining > 1e-9) {
          if (!s.swing && s.weaponCooldown <= 1e-8) { s.swing = .19; s.weaponCooldown = .68; this.swingAge = 0; }
          const winding = s.swing > 0, elapsed = Math.min(remaining, winding ? s.swing : s.weaponCooldown);
          s.weaponCooldown = Math.max(0, s.weaponCooldown - elapsed); s.swing = Math.max(0, s.swing - elapsed); remaining -= elapsed;
          if (winding && s.swing <= 1e-9) {
            s.swing = 0;
            if (this.target?.kind === 'enemy') this.combat.hit(this.target.node, progress.expedition.crawlers?.impactHead ? 52 : spec.damage, 'axe', player.direction);
            else { cut = true; cutDt = .24; }
            this.combat.events.push({ kind: 'swing', point: this.target || player.head });
          }
        }
      } else if (held && mode !== 'resonance' && this.target?.kind === 'enemy') {
        this.combat.hit(this.target.node, spec.damage * (1 + progress.gear.drill * .12) * dt, mode, player.direction);
        cut = false;
      }
      this.cutter.update(cutDt, player, progress.gear.drill, cut, mode, this.target?.kind === 'terrain' ? this.target : null);
      if (s.weaponCooldown !== oldCooldown || s.swing !== oldSwing) this.combat.revision++;
    }
  }
  Object.assign(B, { ToolActions, enemyTarget, WEAPONS });
})(B2);
