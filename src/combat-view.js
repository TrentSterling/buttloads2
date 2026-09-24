/* Original cinder moths, recoverable husks, cargo cache and mining axe. */
'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeCombat = function (game) {
    if (this.combatScene) { const geometries = new Set(), materials = new Set(); this.combatScene.traverse(n => { if (n.geometry) geometries.add(n.geometry); if (n.material) materials.add(n.material); }); geometries.forEach(g => g.dispose()); if (this.cacheMaterial) materials.add(this.cacheMaterial); if (this.huskMaterial) materials.add(this.huskMaterial); materials.forEach(m => m.dispose()); this.scene.remove(this.combatScene); }
    const scene = this.combatScene = new T.Group(); this.scene.add(scene); this.mothModels = []; this.combatDrops = new Map();
    const mat = color => new T.MeshStandardMaterial({ color, roughness: .72 });
    for (const n of game.combat.enemies) {
      const root = new T.Group(), body = mat('#473b35'), wing = mat('#b47b51'), light = new T.MeshStandardMaterial({ color: '#f3be7b', emissive: '#fda449', emissiveIntensity: .8 }); scene.add(root);
      const mesh = new T.Mesh(new T.IcosahedronGeometry(.22, 1), body); mesh.scale.set(.8, .7, 1.35); root.add(mesh);
      for (const side of [-1, 1]) {
        const eye = new T.Mesh(new T.IcosahedronGeometry(.047, 0), light); eye.position.set(side * .075, .085, .235); root.add(eye);
        const leg = this.box(root, side * .16, -.08, .03, .026, .035, .28, body); leg.rotation.y = side * .4;
      }
      wing.side = T.DoubleSide; const wings = [];
      for (const side of [-1, 1]) {
        const geo = new T.BufferGeometry(), vertices = [.08, 0, .14, .42, .03, .23, .4, .04, -.23, .08, 0, .14, .4, .04, -.23, .08, 0, -.12];
        for (let i = 0; i < vertices.length; i += 3) vertices[i] *= side;
        geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geo.computeVertexNormals();
        const w = new T.Mesh(geo, wing); root.add(w); wings.push(w);
      }
      const tell = new T.Mesh(new T.TorusGeometry(.7, .018, 5, 32), new T.MeshBasicMaterial({ color: '#ffc278', transparent: true, opacity: 0, depthWrite: false })); scene.add(tell);
      this.mothModels.push({ root, wings, tell, eye: light, node: n });
    }
    this.cacheMaterial = mat('#bfaa71'); this.huskMaterial = new T.MeshStandardMaterial({ color: '#d99151', emissive: '#9c451d', emissiveIntensity: .3, roughness: .8 });
    if (!this.axeTool) {
      const axe = this.axeTool = new T.Group(); this.toolScene.add(axe);
      this.box(axe, 0, -.08, 0, .055, .75, .07, this.palette.wood, -.13);
      this.box(axe, .035, .24, 0, .33, .17, .085, this.palette.steel);
      this.box(axe, .19, .23, 0, .06, .22, .035, this.palette.metal, -.14);
      this.box(axe, -.14, .24, 0, .12, .08, .1, this.palette.dark);
      for (let i = 0; i < 5; i++) this.box(axe, -.016, -.24 + i * .042, .005, .075, .02, .09, this.palette.dark);
    }
  };
  B.View.prototype.renderCombat = function (game, time) {
    if (!this.combatScene) return;
    for (const m of this.mothModels) {
      const n = m.node; m.root.visible = n.hp > 0 && n.phase !== 'buried'; m.root.position.set(n.x, n.y, n.z); m.root.rotation.y = n.yaw;
      m.wings.forEach((w, i) => w.rotation.z = (i ? 1 : -1) * (this.settings.motion ? Math.sin(time * (n.phase === 'windup' ? 45 : 22) + n.id) * .55 : .18));
      m.eye.emissiveIntensity = n.phase === 'windup' ? 2 : .8;
      m.tell.visible = n.hp > 0 && n.phase === 'windup'; m.tell.position.copy(m.root.position); m.tell.quaternion.copy(this.camera.quaternion); m.tell.scale.setScalar(.6 + n.timer / .85 * .6); m.tell.material.opacity = .8;
    }
    const ids = new Set();
    for (const n of game.combat.drops) {
      ids.add(n.id); let mesh = this.combatDrops.get(n.id);
      if (!mesh) { mesh = new T.Mesh(new T.BoxGeometry(.28, .28, .28), n.id === 3 ? this.cacheMaterial : this.huskMaterial); this.combatDrops.set(n.id, mesh); this.combatScene.add(mesh); }
      mesh.position.set(n.x, n.y, n.z);
    }
    for (const [id, mesh] of this.combatDrops) if (!ids.has(id)) { mesh.geometry.dispose(); this.combatScene.remove(mesh); this.combatDrops.delete(id); }
    const equipped = game.expedition.state.tool === 'axe'; this.axeTool.visible = equipped;
    if (equipped) {
      this.tool.visible = false; this.magicTool.visible = false;
      const t = game.actions.swingAge, swing = this.settings.motion && t < .5 ? Math.sin(Math.min(1, t / .5) * Math.PI) : 0;
      this.axeTool.position.set(.38 - swing * .24, -.18 - swing * .12, -.72); this.axeTool.rotation.set(-swing * 1.1, -.25, .15 + swing * .85);
    }
  };
})(B2);
