/* Original furnace machinery, attack tells and the powered common. */
'use strict';
(function (B) {
  const T = THREE, V = T.Vector3;
  B.View.prototype.makeForeman = function (game) {
    if (this.foremanScene) { const mats = new Set(); this.foremanScene.traverse(n => { n.geometry?.dispose(); if (n.material) mats.add(n.material); }); mats.forEach(m => m.dispose()); this.scene.remove(this.foremanScene); }
    const group = this.foremanScene = new T.Group(); this.scene.add(group); this.foremanModels = []; this.pressureLinks = [];
    const mat = (color, glow = 0, metal = .65) => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glow, roughness: .58, metalness: metal });
    const iron = mat('#383d3c'), bronze = mat('#96623e'), steel = mat('#868a79'), dark = mat('#161e1c');
    for (const n of game.foreman.nodes) {
      const root = new T.Group(); group.add(root); const core = n.id === 100, hot = mat('#eab378', .5), b = (...args) => this.box(root, ...args);
      if (core) {
        for (const x of [-1.2, 1.2]) { b(x, -1.77, 0, .75, .66, 1.7, iron); b(x, -.85, 0, .45, 1.4, .8, bronze); }
        this.cylinder(root, 0, .1, 0, 1.46, 1.6, 2.5, iron, 12);
        for (const y of [-1, .05, 1.2]) this.cylinder(root, 0, y, 0, 1.66, 1.66, .15, bronze, 12);
        b(0, .1, 1.5, 1.5, 1.65, .16, hot);
        for (let i = -3; i <= 3; i++) b(i * .25, .1, 1.62, .07, 1.8, .12, iron);
        b(0, 1.68, .25, 2.8, .7, 2.4, iron);
        for (const x of [-.65, .65]) { b(x, 1.66, 1.49, .67, .17, .12, hot); b(x, 1.85, 1.47, .9, .11, .17, bronze); }
        b(0, 1.31, 1.43, 1.4, .16, .16, steel);
        for (const x of [-1.7, 1.7]) b(x, .25, 0, .18, 2.8, .8, bronze);
        for (let i = 0; i < 3; i++) b(-.65 + i * .65, -.99, 1.55, .35, .17, .13, hot);
      } else {
        b(0, -1.16, 0, 1.3, .28, 1.3, iron); b(0, -.08, 0, 1.08, 1.9, 1.08, bronze); b(0, 1.08, 0, 1.2, .44, 1.2, iron);
        for (const z of [-.56, .56]) { b(0, -.02, z, .75, 1.5, .08, hot); for (const x of [-.27, 0, .27]) b(x, -.02, z * 1.08, .055, 1.7, .04, dark); }
        const gauge = new T.Mesh(new T.TorusGeometry(.3, .045, 6, 18), steel); gauge.position.set(0, .77, -.56); root.add(gauge);
      }
      this.foremanModels.push({ root, hot, node: n });
    }
    const tube = color => { const mesh = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshBasicMaterial({ color, transparent: true, opacity: .8, depthWrite: false })); group.add(mesh); return mesh; };
    for (let i = 0; i < 3; i++) this.pressureLinks.push(tube('#91c7b7'));
    this.furnaceJet = tube('#f2bd83'); this.foundryBeam = tube('#85f4ce');
    this.furnaceRing = new T.Mesh(new T.TorusGeometry(1, .028, 6, 72), new T.MeshBasicMaterial({ color: '#ffbe7e', transparent: true, opacity: .9, depthWrite: false })); this.furnaceRing.rotation.x = Math.PI / 2; group.add(this.furnaceRing);
    this.furnaceLight = new T.PointLight('#ffb173', 0, 18, 1.6); group.add(this.furnaceLight);
    const beacon = this.commonBeacon = new T.Group(); beacon.position.set(5, .6, 46); group.add(beacon);
    const crystal = mat('#8effd1', 1.4, .3);
    for (let i = 0; i < 3; i++) { const gem = new T.Mesh(new T.OctahedronGeometry(.28, 0), crystal); gem.position.set(Math.cos(i * 2.09) * .45, .4, Math.sin(i * 2.09) * .45); gem.scale.y = 1.8; beacon.add(gem); }
    const halo = new T.Mesh(new T.TorusGeometry(.85, .035, 6, 48), crystal); halo.rotation.x = Math.PI / 2; halo.position.y = .4; beacon.add(halo);
    this.commonLight = new T.PointLight('#a6f9cd', 0, 13, 1.7); this.commonLight.position.set(5, 1.5, 46); group.add(this.commonLight);
    for (const [x, z, w, d] of [[8.8, 38, .055, 14], [11.2, 38, .055, 14], [5, 29.5, 42, .055]]) this.box(beacon, x - 5, -.54, z - 46, w, .016, d, crystal);
  };
  B.View.prototype.furnaceTube = function (mesh, a, b, radius) {
    const start = new V(a.x, a.y, a.z), end = new V(b.x, b.y, b.z), delta = end.clone().sub(start);
    mesh.position.copy(start.add(end).multiplyScalar(.5)); mesh.scale.set(radius, delta.length(), radius);
    if (delta.lengthSq() > 1e-9) mesh.quaternion.setFromUnitVectors(new V(0, 1, 0), delta.normalize());
  };
  B.View.prototype.renderForeman = function (game, time) {
    const f = game.foreman, s = f.state, n = f.core; if (!this.foremanScene) return;
    const won = s.defeated, near = n && Math.hypot(n.x - game.player.x, n.y - game.player.y, n.z - game.player.z) < 27;
    this.commonBeacon.visible = won; this.commonLight.intensity = won && game.player.y > -1 ? 1.3 : 0;
    for (const m of this.foremanModels) {
      m.root.position.set(m.node.x, m.node.y, m.node.z);
      m.hot.color.set(won ? '#84cbb0' : m.node === n && n.hp <= f.healthFloor ? '#83b9ac' : '#edac71');
      m.hot.emissive.copy(m.hot.color); m.hot.emissiveIntensity = f.flash * 5 + (m.node.hp <= 0 && m.node !== n ? .04 : won ? .5 : s.phase === 'aim' || s.phase === 'quake-windup' ? 1.8 : s.active ? .9 : .25);
      const slot = this.ghostSlots?.get('foreman:' + m.node.id); if (slot !== undefined) { const dummy = new T.Object3D(); dummy.position.copy(m.root.position); dummy.scale.setScalar(m.node.id === 100 ? 7 : 3); dummy.updateMatrix(); this.ghosts.setMatrixAt(slot, dummy.matrix); this.ghosts.instanceMatrix.needsUpdate = true; }
    }
    this.pressureLinks.forEach((mesh, i) => { const lock = f.nodes[i + 1]; mesh.visible = !!lock && lock.hp > 0 && s.active && near; if (mesh.visible) this.furnaceTube(mesh, lock, { x: n.x, y: n.y + 1, z: n.z }, .035); });
    const beam = near && ['aim', 'jet'].includes(s.phase) ? f.beam() : null;
    this.furnaceJet.visible = !!beam; if (beam) { this.furnaceTube(this.furnaceJet, beam.from, s.phase === 'jet' && s.impact ? s.impact : beam.to, s.phase === 'jet' ? .3 : .028); this.furnaceJet.material.opacity = s.phase === 'jet' ? .95 : .55; }
    this.furnaceRing.visible = near && ['quake-windup', 'quake'].includes(s.phase);
    if (this.furnaceRing.visible) { this.furnaceRing.position.set(n.x, n.y - n.size[1] / 2 + .07, n.z); this.furnaceRing.scale.setScalar(s.phase === 'quake' ? Math.max(.05, (2.4 - s.timer) * 5.5) : 1.3); }
    this.furnaceLight.intensity = near && game.world.clearLine(game.player.head, n, .1) ? won ? 1.2 : s.phase === 'jet' ? 4 : 1.7 : 0; if (n) this.furnaceLight.position.set(n.x, n.y + 1, n.z);
    this.foundryBeam.visible = !!f.bore;
    if (f.bore) { const b = f.bore, end = { x: b.from.x + b.direction.x * b.length, y: b.from.y + b.direction.y * b.length, z: b.from.z + b.direction.z * b.length }; this.furnaceTube(this.foundryBeam, b.from, end, b.time * .25); this.foundryBeam.material.opacity = b.time; }
  };
})(B2);
