'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeThunderstone = function (system) {
    if (this.thunderModels) for (const m of this.thunderModels) { m.geometry.dispose(); m.material.dispose(); }
    this.thunderMatrix = new T.Matrix4();
    this.thunderModels = system.nodes.map(n => {
      // This exact pose and scale are shared with oreOffsets for physical support.
      const material = new T.MeshStandardMaterial({ color: '#583b67', emissive: '#f095ca', emissiveIntensity: .4, roughness: .25, metalness: .45 });
      const m = new T.Mesh(new T.DodecahedronGeometry(n.radius), material); m.scale.set(1.15, .8, 1); m.rotation.set(n.id, n.id * .7, n.id * .3); this.discovery.add(m); return m;
    });
  };
  B.View.prototype.renderThunderstone = function (game) {
    for (const n of game.thunder.nodes) {
      const slot = this.ghostSlots.get('thunder:' + n.id);
      if (slot !== undefined) { const size = n.collected ? 0 : 1.4; this.thunderMatrix.makeScale(size, size, size).setPosition(n.x, n.y, n.z); this.ghosts.setMatrixAt(slot, this.thunderMatrix); this.ghosts.instanceMatrix.needsUpdate = true; }
      const m = this.thunderModels[n.id]; m.visible = !n.collected; if (!m.visible) continue;
      m.position.set(n.x, n.y, n.z); const lit = n.fuse >= 0, pulse = .5 + .5 * Math.sin(game.thunder.time * (lit ? 40 : 2.5) + n.id);
      m.material.color.set(lit ? '#ffdce9' : '#583b67'); m.material.emissiveIntensity = lit ? 1 + pulse * 3 : .3 + pulse * .25;
    }
  };
})(B2);
