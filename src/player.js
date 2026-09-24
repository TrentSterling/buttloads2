'use strict';
(function (B) {
  class Player {
    constructor(world) { this.world = world; this.x = 0; this.y = .06; this.z = 11.5; this.vx = this.vy = this.vz = 0; this.yaw = 0; this.pitch = -.35; this.grounded = false; this.eye = 1.58; this.radius = .3; this.height = 1.75; this.liftTime = 0; this.obstacles = []; }
    get position() { return { x: this.x, y: this.y, z: this.z }; }
    get head() { return { x: this.x, y: this.y + this.eye, z: this.z }; }
    get direction() { const c = Math.cos(this.pitch); return { x: -Math.sin(this.yaw) * c, y: Math.sin(this.pitch), z: -Math.cos(this.yaw) * c }; }
    teleport(x, y, z) { this.x = x; this.y = y; this.z = z; this.vx = this.vy = this.vz = 0; }
    blocked(x, y, z) {
      const area = B.SURFACE;
      if (x < area.minX + this.radius || x > area.maxX - this.radius || z < area.minZ + this.radius || z > area.maxZ - this.radius || y < this.world.floor - 1) return true;
      for (const b of this.obstacles) if (x + this.radius > b[0] && x - this.radius < b[3] && y + this.height > b[1] && y < b[4] && z + this.radius > b[2] && z - this.radius < b[5]) return true;
      for (const h of [.025, .45, 1, 1.7]) {
        if (this.world.density(x, y + h, z) < -.005) return true;
        for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4; if (this.world.density(x + Math.cos(angle) * this.radius, y + h, z + Math.sin(angle) * this.radius) < -.005) return true; }
      }
      return false;
    }
    step(dt, keys, liftSpeed) {
      let mx = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0), mz = (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
      const len = Math.hypot(mx, mz) || 1, speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 6 : 3.8; mx /= len; mz /= len;
      const tx = (mx * Math.cos(this.yaw) + mz * Math.sin(this.yaw)) * speed, tz = (-mx * Math.sin(this.yaw) + mz * Math.cos(this.yaw)) * speed;
      const blend = 1 - Math.exp(-dt * (this.grounded ? 20 : 8)); this.vx += (tx - this.vx) * blend; this.vz += (tz - this.vz) * blend;
      if (keys.has('Space')) { this.liftTime += dt; this.vy += ((this.liftTime > .14 ? liftSpeed : 5.5) - this.vy) * Math.min(1, dt * 8); } else { this.liftTime = 0; this.vy = Math.max(-20, this.vy - 23 * dt); }
      if (this.y > 16 && this.vy > 0) this.vy = 0;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(this.vx), Math.abs(this.vy), Math.abs(this.vz)) * dt / .1)), h = dt / steps;
      this.grounded = false;
      for (let i = 0; i < steps; i++) {
        for (const [axis, velocity] of [['x', 'vx'], ['z', 'vz']]) {
          const p = this.position; p[axis] += this[velocity] * h;
          if (!this.blocked(p.x, p.y, p.z)) this[axis] = p[axis];
          else if (this.vy <= 1 && !this.blocked(p.x, p.y + .28, p.z) && !this.blocked(this.x, this.y + .28, this.z)) { this[axis] = p[axis]; this.y += .28; }
          else this[velocity] = 0;
        }
        const next = this.y + this.vy * h;
        if (!this.blocked(this.x, next, this.z)) this.y = next;
        else { if (this.vy < 0) this.grounded = true; this.vy = 0; }
      }
    }
    look(dx, dy, sensitivity) { this.yaw -= dx * .002 * sensitivity; this.pitch = B.clamp(this.pitch - dy * .002 * sensitivity, -1.54, 1.54); }
  }
  class Cutter {
    constructor(world) { this.world = world; this.target = null; this.lastDirection = null; this.contact = null; this.edited = false; this.frames = 0; }
    trace(player, level, mode = 'cutter', reach = 5.2) {
      const tool = B.TOOLS?.[mode] || { radius: 1, power: 1 };
      const origin = player.head, direction = player.direction, radius = B.clamp(B.GEAR.drill.values[level] * tool.radius, .72, 2.8);
      let hit = this.world.ray(origin, direction, reach);
      // Wide brush contact: a center ray falling through its own hole does not release firing.
      const side = { x: Math.cos(player.yaw), y: 0, z: -Math.sin(player.yaw) };
      const up = { x: -direction.y * side.z, y: direction.z * side.x - direction.x * side.z, z: direction.y * side.x };
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, offset = radius * .62;
        const from = { x: origin.x + (side.x * Math.cos(a) + up.x * Math.sin(a)) * offset, y: origin.y + up.y * Math.sin(a) * offset, z: origin.z + (side.z * Math.cos(a) + up.z * Math.sin(a)) * offset };
        const candidate = this.world.ray(from, direction, reach);
        if (candidate && (!hit || candidate.distance < hit.distance - radius * .4)) hit = candidate;
      }
      // Once the center is open, probe the cutting edge to ream a smaller existing tunnel.
      // Keeping the inner ring for forward cuts avoids pinning the brush to its own rim.
      if (!hit) {
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4, offset = radius * .9;
          const from = { x: origin.x + (side.x * Math.cos(a) + up.x * Math.sin(a)) * offset, y: origin.y + up.y * Math.sin(a) * offset, z: origin.z + (side.z * Math.cos(a) + up.z * Math.sin(a)) * offset };
          const candidate = this.world.ray(from, direction, reach);
          if (candidate && (!hit || candidate.distance < hit.distance)) hit = candidate;
        }
      }
      return hit;
    }
    update(dt, player, level, held, mode = 'cutter', resolved = undefined) {
      this.edited = false; this.contact = null;
      if (!held) { this.target = null; return; }
      this.frames++;
      const tool = B.TOOLS?.[mode] || { radius: 1, power: 1 };
      const origin = player.head, direction = player.direction, radius = B.clamp(B.GEAR.drill.values[level] * tool.radius, .72, 2.8);
      const hit = resolved === undefined ? this.trace(player, level, mode) : resolved;
      if (!hit) { this.target = null; return; }
      const layer = B.geology(hit.y), efficiency = mode === 'scoop' && hit.y < -25 ? .22 : mode === 'lance' && hit.y > -9 ? .5 : 1;
      const amount = B.GEAR.drill.power[level] * tool.power * (mode === 'axe' && this.world.impactHead ? 2 : 1) * efficiency * dt / layer.resistance * (hit.y < -80 && this.world.deepUpgrades?.includes(0) ? 2 : 1);
      // Project rim contacts onto the center line, keeping the tunnel wide enough for the capsule.
      const distance = hit.distance + radius * .27;
      const target = { x: origin.x + direction.x * distance, y: origin.y + direction.y * distance, z: origin.z + direction.z * distance };
      this.contact = { ...hit, layer: layer.name, protected: !this.world.canDig(hit.x,hit.y,hit.z,.2) };
      if (this.contact.protected) return;
      this.edited = this.world.carve(target, radius, amount) > 0; this.target = target;
      // Interpolation can leave a sliver at a rim probe after the centered brush saturates.
      // Bite into that actual contact instead of repeatedly carving the same empty volume.
      if (!this.edited) { this.edited = this.world.carve(hit, radius, amount) > 0; this.target = hit; }
    }
  }
  Object.assign(B, { Player, Cutter });
})(B2);
