/* Copper impact instruments and a broken underground optical machine. */
'use strict';
(function (B) {
  const T = THREE, V = T.Vector3;
  B.View.prototype.makeMysteries = function () {
    const root = this.ruins = new T.Group(); this.discovery.add(root);
    const metal = this.palette.dark;
    const material = color => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .8, metalness: .65, roughness: .27 });
    const copper = material('#efae78'), glass = material('#99e4ec');
    const mesh = (g, geometry, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geometry, mat); m.position.set(x, y, z); g.add(m); return m; };
    const group = p => { const g = new T.Group(); g.position.set(p.x, p.y, p.z); root.add(g); return g; };
    this.echoModels = B.ECHO_SEALS.map((p, i) => {
      const g = group(p), toward = new V(7 - p.x, 0, 6 - p.z).normalize(); g.quaternion.setFromUnitVectors(new V(0, 0, 1), toward);
      mesh(g, new T.CylinderGeometry(.6, .68, .28, 12), metal).rotation.x = Math.PI / 2;
      const face = mesh(g, new T.TorusGeometry(.39, .065, 6, 28), copper.clone(), 0, 0, .18);
      for (let n = 0; n <= i; n++) mesh(g, new T.BoxGeometry(.055, .25, .06), face.material, (n - i / 2) * .15, 0, .2);
      const halo = mesh(g, new T.TorusGeometry(.72, .018, 4, 40), face.material); halo.visible = false;
      return { g, face, halo };
    });
    const vault = group(B.MYSTERIES[0]); this.echoCore = mesh(vault, new T.OctahedronGeometry(.38), copper);
    this.echoPetals = [];
    for (let i = 0; i < 6; i++) { const g = new T.Group(); g.rotation.y = i * Math.PI / 3; vault.add(g); const petal = mesh(g, new T.BoxGeometry(.42, .9, .18), metal, 0, -.2, .55); this.echoPetals.push(petal); }
    this.prismModels = B.ARRAY_NODES.map((p, i) => {
      const g = group(p);
      // Floating assemblies are intentional here: counter-rotating hoops hold the glass.
      const hoop = mesh(g, new T.TorusGeometry(.64, .06, 6, 28), metal); hoop.rotation.x = Math.PI / 2;
      const ring = mesh(g, new T.TorusGeometry(.45, .025, 6, 28), i === 0 ? glass : glass.clone()); ring.rotation.y = Math.PI / 2;
      const optic = mesh(g, i === 0 ? new T.ConeGeometry(.27, .65, 6) : i === 3 ? new T.SphereGeometry(.31, 12, 8) : new T.OctahedronGeometry(.37), ring.material);
      const arrow = new T.Group(); g.add(arrow);
      mesh(arrow, new T.BoxGeometry(.45, .04, .055), ring.material, .52, .53, 0);
      mesh(arrow, new T.ConeGeometry(.12, .22, 4), ring.material, .83, .53, 0).rotation.z = -Math.PI / 2;
      arrow.visible = i < 3;
      if (i === 0) optic.rotation.z = -Math.PI / 2;
      return { g, ring, optic, arrow };
    });
    this.arrayBeams = Array.from({ length: 3 }, () => {
      const m = mesh(root, new T.CylinderGeometry(.026, .026, 1, 6), new T.MeshBasicMaterial({ color: '#aaf6ef', transparent: true, opacity: .7, depthWrite: false }));
      const spark = mesh(root, new T.IcosahedronGeometry(.085), new T.MeshBasicMaterial({ color: '#e8fff2' })); return { m, spark };
    });
    this.ruinLights = B.MYSTERIES.map(p => { const l = new T.PointLight(p.color, 0, 8, 2); l.position.set(p.x, p.y + .6, p.z); root.add(l); return l; });
  };
  B.View.prototype.renderMysteries = function (game, time) {
    const m = game.mysteries, s = m.state;
    this.echoModels.forEach((r, i) => { const active = s.solved.includes(0) || m.sealUntil[i] > m.time; r.face.material.emissiveIntensity = active ? 3 : .35; r.halo.visible = active; r.halo.scale.setScalar(1 + Math.sin(time * 8) * .07); });
    this.echoCore.rotation.set(time * .2, time * .4, 0); this.echoCore.position.y = s.solved.includes(0) ? .5 + Math.sin(time) * .08 : -.2;
    this.echoPetals.forEach(p => { p.rotation.x = s.solved.includes(0) ? -.9 : 0; });
    this.prismModels.forEach((r, i) => { r.ring.rotation.z = time * (i % 2 ? -.25 : .25); r.arrow.rotation.y = -(i === 0 || i === 3 ? 0 : s.mirrors[i - 1]) * Math.PI / 2; r.ring.material.emissiveIntensity = i <= m.connected ? 2 : .22; });
    this.arrayBeams.forEach((r, i) => {
      const b = m.beams[i]; r.m.visible = !!b; r.spark.visible = !!b?.hit; if (!b) return;
      const a = new V(b.from.x, b.from.y, b.from.z), end = new V(b.end.x, b.end.y, b.end.z), delta = end.clone().sub(a);
      r.m.position.copy(a.add(end).multiplyScalar(.5)); r.m.scale.y = delta.length(); if (delta.lengthSq() > 1e-10) r.m.quaternion.setFromUnitVectors(new V(0, 1, 0), delta.normalize()); r.spark.position.copy(end);
    });
    this.ruinLights.forEach((l, i) => { const p = B.MYSTERIES[i]; l.intensity = Math.hypot(game.player.x - p.x, game.player.head.y - p.y, game.player.z - p.z) < 12 && game.world.clearLine(game.player.head, p, .2) ? 1.1 : 0; });
  };
})(B2);
