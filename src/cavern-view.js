/* Original cave formations and physical survey cabinets. */
'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeCaverns = function (game) {
    if (this.cavernScene) { const materials = new Set(); this.cavernScene.traverse(n => { n.geometry?.dispose(); if (n.material) materials.add(n.material); }); for (const m of materials) m.dispose(); this.scene.remove(this.cavernScene); }
    const g = this.cavernScene = new T.Group(); this.scene.add(g); this.caveGrowth = []; this.refugeModels = [];
    const material = (color, glow = 0) => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glow, roughness: .82 });
    for (const n of game.refuges.nodes) {
      const model=this.makeSurveyCabinet(n,game.world.caverns.networks[n.id]);
      model.root.position.set(n.x,n.y,n.z);g.add(model.root);this.refugeModels.push(model);
    }
    const rng = B.random(game.world.seed ^ 0x748196), world = game.world, baseline = Object.create(B.World.prototype); baseline.density = (x, y, z) => world.base(x, y, z);
    for (const network of world.caverns.networks) {
      const growth = material(network.growth, .08), glow = material(network.color, .26);
      for (let i = 0; i < 22; i++) {
        const at = i < 12 ? network.chamber : network.nodes[i % network.nodes.length], x = at.x + (rng() - .5) * 2.5, z = at.z + (rng() - .5) * 2.5, ceiling = i % 3 === 0;
        const origin = { x, y: at.y, z }; if (baseline.density(x, at.y, z) < .1) continue;
        const hit = baseline.ray(origin, { x: 0, y: ceiling ? 1 : -1, z: 0 }, 5); if (!hit) continue;
        const height = .2 + rng() * (ceiling ? 1.2 : .45), root = new T.Group(); root.position.set(hit.x, hit.y, hit.z); g.add(root);
        this.makeFormation(root,network.id,ceiling,height,.1+rng()*.17,growth,glow);
        this.caveGrowth.push({ root, anchor: { x: hit.x, y: hit.y + (ceiling ? .12 : -.12), z: hit.z } });
      }
    }
    this.makeCaveLandmarks(game);
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
    this.renderCaveAccents(game);
    this.refugeLights.forEach((light, i) => { const n = near[i]; light.intensity = n ? 2.1 : 0; if (n) light.position.set(n.x, n.y + .55, n.z); });
  };
})(B2);
