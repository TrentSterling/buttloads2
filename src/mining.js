/* Read-only tool response. Excavation and damage remain in Cutter / ToolActions. */
'use strict';
(function (B) {
  const CUT_SHAPES = Object.freeze({ cutter: Object.freeze([1, 1, 1]), scoop: Object.freeze([1.25, 1, .7]), lance: Object.freeze([.84, 1.05, 1.45]) });
  function cutBrush(player, radius, mode) {
    const side = { x: Math.cos(player.yaw), y: 0, z: -Math.sin(player.yaw) }, direction = player.direction;
    const up = { x: side.z * direction.y, y: side.x * direction.z - side.z * direction.x, z: -side.x * direction.y };
    return { radius, axes: CUT_SHAPES[mode] || CUT_SHAPES.cutter, basis: [side, up, direction] };
  }
  class MiningFeel {
    constructor(world) { this.world = world; this.mode = null; this.serial = 0; this.phase = 0; this.reset(); }
    reset() { this.rev = this.load = this.stroke = this.beat = 0; this.preview = null; this.contacts = []; this.previewIn = 0; this.wasCutting = false; }
    update(dt, game) {
      const mode = game.expedition.state.tool, mechanical = !!CUT_SHAPES[mode];
      if (mode !== this.mode) { this.reset(); this.mode = mode; this.phase = 0; }
      const held = mechanical && game.input.fire && !game.input.aim, cutting = held && game.cutter.edited;
      this.rev += ((held ? 1 : 0) - this.rev) * (1 - Math.exp(-dt * (held ? 12 : 8)));
      this.load += ((cutting ? 1 : 0) - this.load) * (1 - Math.exp(-dt * 18));
      this.beat *= Math.exp(-dt * 24);
      const speed = mode === 'scoop' ? 2.6 : mode === 'lance' ? 13 : 7;
      const before = Math.floor(this.phase); this.phase += dt * speed * this.rev;
      this.stroke = this.phase % 1;
      if (cutting && (!this.wasCutting || Math.floor(this.phase) !== before)) { this.serial++; this.beat = 1; }
      this.wasCutting = cutting;
      if (!mechanical || game.input.aim || game.actions?.target?.kind === 'enemy') { this.preview = null; this.contacts = []; return; }
      this.previewIn -= dt;
      if (this.previewIn > 0) return;
      this.previewIn = 1 / 15;
      const p = game.player, level = game.economy.state.gear.drill, reach = B.WEAPONS[mode].reach;
      const hit = game.cutter.trace(p, level, mode, reach);
      this.preview = hit ? { ...hit, protected: !this.world.canDig(hit.x, hit.y, hit.z, .2) } : null;
      this.contacts = [];
      if (!hit) return;
      const radius = B.clamp(B.GEAR.drill.values[level] * B.TOOLS[mode].radius, .72, 2.8), brush = cutBrush(p, radius, mode), h = p.head;
      // Short, depth-tested ticks on real rock, never a decal stretched across a hole.
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, sx = Math.cos(a) * radius * brush.axes[0] * .7, sy = Math.sin(a) * radius * brush.axes[1] * .7;
        const origin = { x: h.x + brush.basis[0].x * sx + brush.basis[1].x * sy, y: h.y + brush.basis[1].y * sy, z: h.z + brush.basis[0].z * sx + brush.basis[1].z * sy };
        const contact = this.world.ray(origin, p.direction, reach);
        if (!contact || !this.world.clearLine(h, contact, .04)) continue;
        const normal = this.world.normal(contact.x, contact.y, contact.z);
        this.contacts.push({ ...contact, normal, protected: !this.world.canDig(contact.x, contact.y, contact.z, .2) });
      }
    }
  }
  Object.assign(B, { CUT_SHAPES, cutBrush, MiningFeel });
})(B2);
