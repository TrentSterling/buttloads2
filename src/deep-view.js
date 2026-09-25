/* Rootway iris, restored machinery and formations in the lower workings. */
'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeDeep = function (game) {
    if (this.deepScene) {
      const materials = new Set(); this.deepScene.traverse(n => { n.geometry?.dispose(); if (n.material) materials.add(n.material); });
      for (const m of materials) { m.map?.dispose(); m.dispose(); } this.scene.remove(this.deepScene);
    }
    const group = this.deepScene = new T.Group(); this.scene.add(group); this.deepModels = []; this.deepGrowth = [];
    const mat = (color, glow = 0) => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glow, roughness: .65, metalness: .35 });
    const steel = mat('#697771'), iron = mat('#283b36'), brass = mat('#b59959'), rubber = mat('#1a2423');
    const gate = this.rootway = new T.Group(); gate.position.set(B.DEEP_GATE.x, B.DEEP_GATE.y, B.DEEP_GATE.z); group.add(gate);
    const rune = mat('#74cbb0', .4);
    for (const radius of [.7, 1.12]) { const ring = new T.Mesh(new T.TorusGeometry(radius, .045, 6, 32), brass); ring.rotation.x = Math.PI / 2; gate.add(ring); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, tooth = this.box(gate, Math.cos(a) * .9, .015, Math.sin(a) * .9, .16, .05, .25, rune); tooth.rotation.y = -a; }
    for (const n of game.deep.nodes) {
      const model=this.makeStationMachine(n);model.root.position.set(n.x,n.y,n.z);group.add(model.root);this.deepModels.push(model);
    }
    const baseline = Object.create(B.World.prototype); baseline.density = (x, y, z) => game.world.base(x, y, z);
    const rng = B.random(game.world.seed ^ 0x318614);
    for (const room of game.world.deepTerrain?.rooms || []) {
      const color = room.y > -128 ? '#8c9770' : room.y > -208 ? '#bf8279' : '#e9ad64', growth = mat(color, .15);
      for (let i = 0; i < 26; i++) {
        const a = rng() * Math.PI * 2, r = 1 + rng() * 2.4, p = { x: room.x + Math.cos(a) * r, y: room.y, z: room.z + Math.sin(a) * r }, ceiling = i % 3 === 0;
        const hit = baseline.ray(p, { x: 0, y: ceiling ? 1 : -1, z: 0 }, 6); if (!hit) continue;
        const height = .28 + rng() * 1.1, root = new T.Group(); root.position.set(hit.x, hit.y, hit.z); group.add(root);
        const crystal = new T.Mesh(new T.ConeGeometry(.12 + rng() * .18, height, 5), growth); crystal.position.y = height / 2 * (ceiling ? -1 : 1); if (ceiling) crystal.rotation.z = Math.PI; root.add(crystal);
        this.deepGrowth.push({ root, anchor: { x: hit.x, y: hit.y + (ceiling ? .15 : -.15), z: hit.z } });
      }
    }
    this.deepLight = new T.PointLight('#f6dca0', 0, 17, 1.7); group.add(this.deepLight); this.deepSupportRevision = -1;
  };
  B.View.prototype.renderDeep = function (game, time) {
    if (!this.deepScene) return;
    this.rootway.visible = !game.deep.state.open;
    if (this.deepSupportRevision !== game.world.revision) {
      this.deepSupportRevision = game.world.revision;
      for (const n of this.deepGrowth) n.root.visible = game.world.density(n.anchor.x, n.anchor.y, n.anchor.z) < -.015;
    }
    let nearest = null, distance = 18;
    for (const m of this.deepModels) {
      const n = m.node, repaired = game.deep.state.repaired.includes(n.id); m.root.position.set(n.x, n.y, n.z);
      m.lens.material.emissiveIntensity = repaired ? 1.6 : .15;
      m.wheel.rotation.z = repaired && this.settings.motion ? time * .8 : 0;
      const p = { x: n.x, y: n.y + .64, z: n.z - .5 }, d = Math.hypot(p.x - game.player.x, p.y - game.player.head.y, p.z - game.player.z);
      if (repaired && d < distance && game.world.clearLine(game.player.head, p, .05)) { nearest = p; distance = d; }
      const slot = this.ghostSlots?.get('station:' + n.id);
      if (slot !== undefined) { const dummy = new T.Object3D(); dummy.position.set(n.x, n.y, n.z); dummy.scale.setScalar(4); dummy.updateMatrix(); this.ghosts.setMatrixAt(slot, dummy.matrix); this.ghosts.instanceMatrix.needsUpdate = true; }
    }
    this.deepLight.intensity = nearest ? 2.5 : 0; if (nearest) this.deepLight.position.set(nearest.x, nearest.y, nearest.z);
  };
})(B2);
