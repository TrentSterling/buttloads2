/* Ore detachment, swept terrain contacts and sleeping bodies. No browser dependency. */
'use strict';
(function (B) {
  const phi = (1 + Math.sqrt(5)) / 2, vertices = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) vertices.push([x, y, z]);
  for (const a of [-1, 1]) for (const b of [-1, 1]) vertices.push([0, a / phi, b * phi], [a / phi, b * phi, 0], [a * phi, 0, b / phi]);
  function oreOffsets(node) {
    // Same normalized dodecahedron, nonuniform scale and XYZ Euler pose as the renderer.
    // Keeping the pose fixed while falling makes contact points match the visible mineral.
    const r = node.radius / Math.sqrt(3), sx = node.kind === 4 ? .65 : 1.15, sy = node.kind === 4 ? 1.9 : .8;
    const ax = node.id, ay = node.id * .7, az = node.id * .3, cx = Math.cos(ax), sxx = Math.sin(ax), cy = Math.cos(ay), syy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
    return [[0, 0, 0], ...vertices.map(v => {
      const x = v[0] * r * sx, y = v[1] * r * sy, z = v[2] * r;
      const xz = x * cz - y * sz, yz = x * sz + y * cz;
      const xy = xz * cy + z * syy, zy = -xz * syy + z * cy;
      return [xy, yz * cx - zy * sxx, yz * sxx + zy * cx];
    })];
  }
  class OreSystem {
    constructor(world, nodes, saved = []) {
      this.world = world; this.nodes = nodes; this.index = new B.SpatialIndex(nodes.filter(n => !n.collected));
      this.awake = new Set(); this.loose = new Set(); this.accumulator = 0; this.revision = 0; this.onMove = () => {};
      this.accelerate = (n, dt) => { n.vy = Math.max(-18, n.vy - 22 * dt); };
      for (const node of nodes) { node.offsets = node.offsets || oreOffsets(node); node.motion = 'embedded'; node.vx = node.vy = node.vz = 0; }
      const byID = new Map(nodes.map(n => [n.id, n]));
      for (const body of saved) {
        const node = byID.get(body.id); if (!node || node.collected) throw new Error('Invalid loose ore ID.');
        for (const k of ['x', 'y', 'z', 'vx', 'vy', 'vz']) node[k] = body[k];
        node.motion = 'falling'; this.loose.add(node); this.awake.add(node); this.index.move(node);
      }
      // Also repairs floating deposits in an earlier v2 save without loose-body data.
      this.refresh(nodes);
      const previousEdit = world.onEdit;
      world.onEdit = (point, radius) => { previousEdit(point, radius); this.refresh(this.index.query(point.x, point.y, point.z, radius + 1.6)); };
    }
    contact(node, x = node.x, y = node.y, z = node.z) {
      let minimum = Infinity, offset = node.offsets[0];
      for (const p of node.offsets) {
        const d = this.world.density(x + p[0], y + p[1], z + p[2]);
        if (d < minimum) { minimum = d; offset = p; }
      }
      return { density: minimum, x: x + offset[0], y: y + offset[1], z: z + offset[2] };
    }
    refresh(nodes) {
      for (const n of nodes) {
        if (n.collected) continue;
        if (n.motion === 'embedded') {
          if (this.contact(n).density < -.004) continue; // Still physically attached to surrounding rock.
          this.loose.add(n); this.revision++;
        }
        n.motion = 'falling'; this.awake.add(n);
      }
    }
    // Advances a detached body without touching indexes or callbacks. Aiming uses this exact solver.
    advance(n, dt) {
        this.accelerate(n, dt);
        const steps = Math.max(1, Math.ceil(Math.hypot(n.vx, n.vy, n.vz) * dt / .075)), h = dt / steps;
        const oldX = n.x, oldY = n.y, oldZ = n.z;
        for (let i = 0; i < steps; i++) {
          const dx = n.vx * h, dy = n.vy * h, dz = n.vz * h, hit = this.contact(n, n.x + dx, n.y + dy, n.z + dz);
          if (hit.density >= -.004) { n.x += dx; n.y += dy; n.z += dz; continue; }
          let lo = 0, hi = 1;
          for (let k = 0; k < 9; k++) { const t = (lo + hi) * .5; if (this.contact(n, n.x + dx * t, n.y + dy * t, n.z + dz * t).density < -.004) hi = t; else lo = t; }
          n.x += dx * lo; n.y += dy * lo; n.z += dz * lo;
          if (this.onContact?.(n, hit)) break;
          const normal = this.world.normal(hit.x, hit.y, hit.z), into = n.vx * normal[0] + n.vy * normal[1] + n.vz * normal[2];
          if (into < 0) { n.vx -= normal[0] * into; n.vy -= normal[1] * into; n.vz -= normal[2] * into; }
          n.vx *= .75; n.vy *= .75; n.vz *= .75;
          if (normal[1] > .35 && Math.hypot(n.vx, n.vy, n.vz) < .12) { n.vx = n.vy = n.vz = 0; n.motion = 'resting'; break; }
        }
        return oldX !== n.x || oldY !== n.y || oldZ !== n.z;
    }
    step(dt) {
      for (const n of this.awake) {
        if (this.advance(n, dt)) { this.index.move(n); this.onMove(n); this.revision++; }
        if (n.motion === 'resting') this.awake.delete(n);
      }
    }
    update(dt) {
      const before = this.revision; this.accumulator += Math.min(.1, dt);
      while (this.accumulator + 1e-10 >= 1 / 120) { this.step(1 / 120); this.accumulator -= 1 / 120; }
      return this.revision !== before;
    }
    collect(node, economy, playerHead) {
      if (node.collected || Math.hypot(node.x - playerHead.x, node.y - playerHead.y, node.z - playerHead.z) > 3 || this.world.density(node.x, node.y, node.z) < .04 || !this.world.clearLine(playerHead, node, .12)) return false;
      if (!economy.collect(node.kind)) return false;
      node.collected = true; this.awake.delete(node); this.loose.delete(node); this.index.remove(node); this.onMove(node); this.revision++; return true;
    }
    snapshot() { return [...this.loose].map(n => ({ id: n.id, x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz })).sort((a, b) => a.id - b.id); }
  }
  Object.assign(B, { oreOffsets, OreSystem });
})(B2);
