/* Original cave formations and physical survey cabinets. */
'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeCaverns = function (game) {
    if (this.cavernScene) { const materials = new Set(); this.cavernScene.traverse(n => { n.geometry?.dispose(); if (n.material) materials.add(n.material); }); for (const m of materials) m.dispose(); this.scene.remove(this.cavernScene); }
    const g = this.cavernScene = new T.Group(); this.scene.add(g); this.caveGrowth = []; this.refugeModels = [];
    const material = (color, glow = 0) => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glow, roughness: .82 });
    const frame = material('#46594b'), bronze = material('#ae8a52'), dark = material('#28312b'), paper = material('#b6bba1');
    for (const n of game.refuges.nodes) {
      const root = new T.Group(); g.add(root); root.position.set(n.x, n.y, n.z);
      const box = (...args) => this.box(root, ...args);
      box(0, -.07, 0, .9, .99, .59, frame); box(0, -.14, -.297, .78, .72, .032, paper);
      for (const x of [-.36, .36]) box(x, -.02, -.314, .035, .92, .02, bronze);
      for (let j = 0; j < 4; j++) { const line = box((j % 2 ? .05 : -.05), -.38 + j * .13, -.318, .51, .012, .008, dark); line.rotation.z = j % 2 ? -.2 : .15; }
      box(.31, -.11, -.29, .08, .17, .07, bronze); box(0, .45, 0, .9, .08, .65, bronze);
      const lensMat = material(n.color, .1), lens = box(0, .52, -.22, .56, .09, .1, lensMat); lens.userData.caveMaterial = true;
      this.refugeModels.push({ root, lens, node: n });
    }
    const rng = B.random(game.world.seed ^ 0x748196), world = game.world, baseline = Object.create(B.World.prototype); baseline.density = (x, y, z) => world.base(x, y, z);
    for (const network of world.caverns.networks) {
      const growth = material(network.growth, .08), glow = material(network.color, .26);
      for (let i = 0; i < 22; i++) {
        const at = i < 12 ? network.chamber : network.nodes[i % network.nodes.length], x = at.x + (rng() - .5) * 2.5, z = at.z + (rng() - .5) * 2.5, ceiling = i % 3 === 0;
        const origin = { x, y: at.y, z }; if (baseline.density(x, at.y, z) < .1) continue;
        const hit = baseline.ray(origin, { x: 0, y: ceiling ? 1 : -1, z: 0 }, 5); if (!hit) continue;
        const height = .2 + rng() * (ceiling ? 1.2 : .45), root = new T.Group(); root.position.set(hit.x, hit.y, hit.z); g.add(root);
        const shape = new T.Mesh(new T.ConeGeometry(.1 + rng() * .17, height, 5), i % 4 === 0 ? glow : growth); shape.position.y = (ceiling ? -1 : 1) * height / 2; if (ceiling) shape.rotation.z = Math.PI; root.add(shape);
        this.caveGrowth.push({ root, anchor: { x: hit.x, y: hit.y + (ceiling ? .12 : -.12), z: hit.z } });
      }
    }
    this.refugeLights = Array.from({ length: 2 }, () => { const light = new T.PointLight('#ffddb0', 0, 13, 1.7); g.add(light); return light; });
    this.caveSupportRevision = -1;
  };
  B.View.prototype.renderCaverns = function (game) {
    if (!this.cavernScene) return;
    if (this.caveSupportRevision !== game.world.revision) {
      this.caveSupportRevision = game.world.revision;
      for (const growth of this.caveGrowth) { const p = growth.anchor; growth.root.visible = game.world.density(p.x, p.y, p.z) < -.015; }
    }
    for (const m of this.refugeModels) {
      const n = m.node; m.root.position.set(n.x, n.y, n.z); m.lens.material.emissiveIntensity = game.refuges.state.lit.includes(n.id) ? 1.5 : .1;
      const slot = this.ghostSlots?.get('refuge:' + n.id); if (slot !== undefined) { const dummy = new T.Object3D(); dummy.position.set(n.x, n.y, n.z); dummy.scale.setScalar(3); dummy.updateMatrix(); this.ghosts.setMatrixAt(slot, dummy.matrix); this.ghosts.instanceMatrix.needsUpdate = true; }
    }
    const near = game.refuges.nodes.filter(n => game.refuges.state.lit.includes(n.id) && game.world.density(n.x, n.y + .55, n.z) > .04 && game.world.clearLine(game.player.head, { x: n.x, y: n.y + .55, z: n.z }, .05)).sort((a, b) => Math.hypot(a.x - game.player.x, a.y - game.player.y, a.z - game.player.z) - Math.hypot(b.x - game.player.x, b.y - game.player.y, b.z - game.player.z));
    this.refugeLights.forEach((light, i) => { const n = near[i]; light.intensity = n ? 2.1 : 0; if (n) light.position.set(n.x, n.y + .55, n.z); });
  };
})(B2);
