/* Expedition art: physical machinery, subterranean growth, runes, tools and light. */
'use strict';
(function (B) {
  const T = THREE, V = T.Vector3;
  const glow = (color, intensity = 1) => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: .35, metalness: .35 });
  B.View.prototype.makeExpedition = function (exp) {
    const disposed = new Set(), palette = Object.values(this.palette);
    this.discovery.traverse(m => { m.geometry?.dispose(); if (m.material && !palette.includes(m.material) && !disposed.has(m.material)) { disposed.add(m.material); m.material.map?.dispose(); m.material.dispose(); } });
    this.discovery.clear(); this.salvageModels = []; this.runeModels = []; this.vaultModels = []; this.growth = []; this.deviceModels = new Map(); this.effects = []; this.lastPulseSerial = 0; this.lastBlastSerial = 0; this.growthRevision = -1;
    const p = this.palette, amber = glow('#fbb965', .8), cyan = glow('#64eed1', 1.25), violet = glow('#aa90ed', 1.1);
    this.expeditionMaterials = { amber, cyan, violet };
    const add = (group, geometry, mat, x, y, z) => { const m = new T.Mesh(geometry, mat); m.position.set(x, y, z); group.add(m); return m; };
    for (const spec of B.SALVAGE) {
      const g = new T.Group(); this.discovery.add(g); const [w, h, d] = spec.size;
      this.box(g, 0, -.38 * h, 0, w, h * .2, d, p.dark);
      for (const x of [-w * .4, w * .4]) { this.box(g, x, 0, 0, .12, h, d * .9, p.metal); this.box(g, x, h * .38, 0, .14, .14, d, p.yellow); }
      if (spec.id === 0) {
        const wheel = add(g, new T.TorusGeometry(.5, .12, 8, 24), p.yellow, 0, 0, 0); wheel.rotation.y = Math.PI / 2;
        for (let i = 0; i < 6; i++) { const spoke = this.box(g, 0, 0, 0, .16, .85, .07, p.steel); spoke.rotation.x = i * Math.PI / 3; }
        this.cylinder(g, 0, 0, 0, .16, .16, 1.2, p.metal).rotation.z = Math.PI / 2;
      } else {
        const cylinder = this.cylinder(g, 0, 0, 0, .54, .54, 1.75, p.dark); cylinder.rotation.z = Math.PI / 2;
        for (const x of [-.7, -.35, 0, .35, .7]) { const ring = add(g, new T.TorusGeometry(.57, .045, 6, 24), violet, x, 0, 0); ring.rotation.y = Math.PI / 2; }
        for (const z of [-.63, .63]) this.box(g, 0, .35, z, 1.8, .24, .23, p.red);
      }
      this.salvageModels.push(g);
    }
    this.tetherLine = new T.Line(new T.BufferGeometry().setFromPoints([new V(), new V()]), new T.LineBasicMaterial({ color: '#f6c06c' })); this.tetherLine.frustumCulled = false; this.discovery.add(this.tetherLine);
    this.snagMarker = add(this.discovery, new T.OctahedronGeometry(.18), new T.MeshBasicMaterial({ color: '#ff9273', wireframe: true, depthTest: false, depthWrite: false, transparent: true, opacity: .85 }), 0, 0, 0); this.snagMarker.visible = false; this.snagMarker.renderOrder = 8;
    // Distinct silhouettes and color temperatures in each chamber.
    const rng = B.random(9917), caveColors = ['#d6a15e', '#94d5d9', '#ac8de9', '#61e6c2'];
    B.RELICS.forEach((r, i) => {
      const mat = glow(caveColors[i], i >= 2 ? .7 : .12), center = { x: r.x, y: r.y + 1, z: r.z };
      for (let j = 0; j < (i === 3 ? 65 : 22); j++) {
        const a = rng() * Math.PI * 2, direction = { x: Math.cos(a) * .7, y: -.45 - rng() * .5, z: Math.sin(a) * .7 }, len = Math.hypot(direction.x, direction.y, direction.z); for (const k of ['x', 'y', 'z']) direction[k] /= len;
        const hit = exp.world.ray(center, direction, 7); if (!hit) continue;
        const normal = exp.world.normal(hit.x, hit.y, hit.z), height = .3 + rng() * (i === 3 ? 1.25 : .5);
        const crystal = add(this.discovery, new T.ConeGeometry(.10 + rng() * .16, height, i === 3 ? 5 : 6), mat, hit.x + normal[0] * height * .45, hit.y + normal[1] * height * .45, hit.z + normal[2] * height * .45);
        crystal.quaternion.setFromUnitVectors(new V(0, 1, 0), new V(...normal));
        this.growth.push({ mesh: crystal, x: hit.x - normal[0] * .10, y: hit.y - normal[1] * .10, z: hit.z - normal[2] * .10 });
      }
      const light = new T.PointLight(caveColors[i], i === 3 ? 2.8 : .8, 11, 1.5); light.position.set(r.x, r.y + 1.6, r.z); this.discovery.add(light);
      // Half-buried ribs around the seal and the garden, clear of the center path.
      if (i >= 2) for (let k = 0; k < 5; k++) {
        const a = k * Math.PI * 2 / 5, points = [], hit = exp.world.ray(center, { x: Math.cos(a), y: 0, z: Math.sin(a) }, 8); if (!hit) continue;
        const normal = exp.world.normal(hit.x, hit.y, hit.z);
        for (let j = 0; j <= 12; j++) { const t = j / 12, radius = hit.distance * .97 + Math.sin(t * Math.PI) * .12; points.push(new V(r.x + Math.cos(a + (t - .5) * .12) * radius, r.y - 1 + t * 4.1, r.z + Math.sin(a + (t - .5) * .12) * radius)); }
        const mesh = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 18, .06, 5, false), mat); this.discovery.add(mesh);
        // Rootwork fades out when its supporting wall is excavated.
        this.growth.push({ mesh, x: hit.x - normal[0] * .1, y: hit.y - normal[1] * .1, z: hit.z - normal[2] * .1 });
      }
    });
    B.RUNES.forEach((r, i) => {
      const g = new T.Group(); g.position.set(r.x, r.y, r.z); this.discovery.add(g);
      add(g, new T.DodecahedronGeometry(.62), p.dark, 0, 0, 0).scale.set(1, 1.3, .6);
      const symbol = add(g, new T.TorusGeometry(.29, .045, 6, 3 + i), violet, 0, 0, .4); symbol.rotation.z = Math.PI / 2;
      const ring = add(g, new T.TorusGeometry(.8, .015, 5, 40), violet, 0, 0, 0);
      const toward = new V(B.SEAL.x - r.x, 0, B.SEAL.z - r.z).normalize(); g.quaternion.setFromUnitVectors(new V(0, 0, 1), toward);
      this.runeModels.push({ group: g, symbol, ring });
    });
    const heart = this.heartModel = new T.Group(); heart.position.set(B.HEART.x, B.HEART.y, B.HEART.z); this.discovery.add(heart);
    add(heart, new T.OctahedronGeometry(.65), cyan, 0, 0, 0);
    for (let i = 0; i < 3; i++) { const ring = add(heart, new T.TorusGeometry(1 + i * .15, .025, 6, 60), i === 1 ? violet : cyan, 0, 0, 0); ring.rotation.set(i * 1.1, i * .7, .4); }
    B.VAULTS.forEach(v => { const g = new T.Group(); g.position.set(v.x, v.y, v.z); this.discovery.add(g); add(g, new T.IcosahedronGeometry(.85, 1), p.dark, 0, 0, 0); for (let i = 0; i < 3; i++) { const ring = add(g, new T.TorusGeometry(.86, .025, 6, 32), cyan, 0, 0, 0); ring.rotation.set(i, i * 1.4, .5); } this.vaultModels.push(g); });
    this.anchorModel = new T.Group(); this.discovery.add(this.anchorModel);
    this.cylinder(this.anchorModel, 0, .5, 0, .025, .06, 1, p.metal);
    add(this.anchorModel, new T.OctahedronGeometry(.13), amber, 0, 1.05, 0);
    const anchorLight = new T.PointLight('#ffd799', 1.8, 13, 1.3); anchorLight.position.y = 1.2; this.anchorModel.add(anchorLight); this.updateAnchor(exp.state.anchor);
    this.workLights = Array.from({ length: 6 }, () => { const l = new T.PointLight('#ffdea0', 0, 16, 1.4); this.discovery.add(l); return l; });
    this.throwGuide = new T.Group(); this.discovery.add(this.throwGuide); this.throwGuide.visible = false; this.lastPreview = null;
    const arc = new T.BufferGeometry(); arc.setAttribute('position', new T.BufferAttribute(new Float32Array(64 * 3), 3).setUsage(T.DynamicDrawUsage)); arc.setDrawRange(0, 0);
    this.throwArc = new T.Line(arc, new T.LineBasicMaterial({ color: '#f8d586', transparent: true, opacity: .85 })); this.throwArc.frustumCulled = false; this.throwGuide.add(this.throwArc);
    this.throwRadius = new T.Mesh(new T.IcosahedronGeometry(1, 1), new T.MeshBasicMaterial({ color: '#f4b665', wireframe: true, transparent: true, opacity: .25, depthWrite: false })); this.throwGuide.add(this.throwRadius);
    this.boreGuide = new T.Group(); this.throwGuide.add(this.boreGuide);
    const boreMaterial = new T.MeshBasicMaterial({ color: '#9bd6e3', transparent: true, opacity: .5, depthWrite: false });
    for (let i = 0; i <= 6; i++) add(this.boreGuide, new T.TorusGeometry(B.CHARGES.bore.radius, .018, 4, 32), boreMaterial, 0, 0, i);
    const arrow = add(this.boreGuide, new T.ConeGeometry(.18, .5, 6), boreMaterial, 0, 0, 6.3); arrow.rotation.x = Math.PI / 2;
    // A second tool silhouette replaces the drill after the magical unlock.
    if (!this.magicTool) {
      this.magicTool = new T.Group(); this.magicTool.position.set(.36, -.25, -.8); this.toolScene.add(this.magicTool);
      this.magicCore = add(this.magicTool, new T.OctahedronGeometry(.1), glow('#73efd4', 1.5), 0, 0, 0);
      for (let i = 0; i < 3; i++) { const ring = add(this.magicTool, new T.TorusGeometry(.16 + i * .025, .006, 5, 40), glow(i === 1 ? '#b6a0f3' : '#71e9cf', 1), 0, 0, 0); ring.rotation.set(i * .8, .7, i); }
      this.scoopHead = new T.Group(); this.tool.add(this.scoopHead);
      this.box(this.scoopHead, 0, -.05, -.5, .44, .06, .3, p.steel); for (const x of [-.2, .2]) this.box(this.scoopHead, x, .015, -.5, .04, .16, .3, p.metal);
      for (let i = 0; i < 5; i++) this.box(this.scoopHead, -.17 + i * .085, -.06, -.7, .045, .04, .16, p.steel);
      this.lanceHead = new T.Group(); this.tool.add(this.lanceHead); this.cylinder(this.lanceHead, 0, 0, -.53, .015, .075, .6, p.steel).rotation.x = -Math.PI / 2;
      this.resonatorHead = new T.Group(); this.tool.add(this.resonatorHead);
      for (let i = 0; i < 4; i++) { const ring = add(this.resonatorHead, new T.TorusGeometry(.12 + i * .015, .015, 5, 20), glow('#bfa0f1', .8), 0, 0, -.3 - i * .075); ring.rotation.z = i * .4; }
    }
  };
  B.View.prototype.updateAnchor = function (a) { this.anchorModel.visible = !!a; if (a) this.anchorModel.position.set(a.x, a.y, a.z); };
  B.View.prototype.renderExpedition = function (game, dt, time) {
    const exp = game.expedition, e = exp.state;
    if (game.mysteries) this.renderMysteries(game, time);
    if (game.freight) this.renderFreight(game, time);
    if (game.thunder) this.renderThunderstone(game);
    const preview = game.aimPreview; this.throwGuide.visible = game.running && game.input.aim === 'bomb' && !!preview?.end;
    if (this.throwGuide.visible && preview !== this.lastPreview) {
      this.lastPreview = preview; const positions = this.throwArc.geometry.attributes.position;
      preview.points.forEach((p, i) => positions.setXYZ(i, p.x, p.y, p.z)); positions.needsUpdate = true; this.throwArc.geometry.setDrawRange(0, preview.points.length);
      this.throwRadius.position.set(preview.end.x, preview.end.y, preview.end.z); this.throwRadius.scale.setScalar(preview.radius);
      this.throwRadius.visible = !preview.length; this.boreGuide.visible = !!preview.length;
      this.throwArc.material.color.set(B.CHARGES[preview.mode || 'blast'].color); this.throwRadius.material.color.copy(this.throwArc.material.color);
      if (preview.length) { this.boreGuide.position.copy(this.throwRadius.position); this.boreGuide.scale.z = preview.length / 6; this.boreGuide.quaternion.setFromUnitVectors(new V(0, 0, 1), new V(preview.direction.x, preview.direction.y, preview.direction.z)); }
    }
    exp.bodies.forEach((b, i) => { const g = this.salvageModels[i]; g.position.set(b.x, b.y, b.z); g.visible = !b.collected; });
    this.tetherLine.visible = exp.tether !== null;
    if (this.tetherLine.visible) { const b = exp.bodies[exp.tether], a = this.tetherLine.geometry.attributes.position; a.setXYZ(0, game.player.x, game.player.head.y - .35, game.player.z); a.setXYZ(1, b.x, b.y, b.z); a.needsUpdate = true; this.tetherLine.material.color.set(exp.snagged ? '#ef735d' : '#edbe60'); }
    this.snagMarker.visible = exp.tether !== null && !!exp.obstruction;
    if (this.snagMarker.visible) { const p = exp.obstruction; this.snagMarker.position.set(p.x, p.y, p.z); this.snagMarker.rotation.y = time; this.snagMarker.scale.setScalar(1 + Math.sin(time * 6) * .12); }
    this.runeModels.forEach((r, i) => { const on = e.runes.includes(i); r.symbol.material = on ? this.expeditionMaterials.cyan : this.expeditionMaterials.violet; r.ring.rotation.z = on ? time * .35 : 0; r.ring.visible = on; });
    this.heartModel.visible = !e.awakened; this.heartModel.rotation.y = time * .3; this.heartModel.position.y = B.HEART.y + Math.sin(time * 1.4) * .12;
    this.vaultModels.forEach((g, i) => { g.visible = !e.vaults.includes(i); });
    if (game.world.revision !== this.growthRevision) { this.growthRevision = game.world.revision; for (const g of this.growth) g.mesh.visible = game.world.density(g.x, g.y, g.z) < .04; }
    const gadgets = game.gadgets;
    if (gadgets) {
      const alive = new Set(gadgets.nodes.map(n => n.id));
      for (const [id, m] of this.deviceModels) if (!alive.has(id)) { this.discovery.remove(m); m.geometry.dispose(); this.deviceModels.delete(id); }
      for (const n of gadgets.nodes) {
        let m = this.deviceModels.get(n.id);
        if (!m) { const geometry = n.type === 'lamp' ? new T.OctahedronGeometry(.16) : n.mode === 'sticky' ? new T.BoxGeometry(.27, .12, .22) : n.mode === 'bore' ? new T.CylinderGeometry(.06, .1, .28, 8) : new T.SphereGeometry(.16, 10, 8); m = new T.Mesh(geometry, this.palette.red); this.discovery.add(m); this.deviceModels.set(n.id, m); }
        m.position.set(n.x, n.y, n.z);
        if (n.type === 'lamp') m.material = game.fossil?.state.lenses ? this.expeditionMaterials.cyan : this.expeditionMaterials.amber;
        else if (n.mode === 'bore') { m.material = Math.sin(n.fuse * 18) > 0 ? this.expeditionMaterials.cyan : this.palette.metal; m.quaternion.setFromUnitVectors(new V(0, 1, 0), new V(n.direction.x, n.direction.y, n.direction.z)); }
        else { m.material = n.mode === 'sticky' && !n.triggered ? this.expeditionMaterials.amber : Math.sin(n.fuse * 18) > 0 ? this.expeditionMaterials.amber : this.palette.red; if (n.anchor) { const normal = game.world.normal(n.anchor.x, n.anchor.y, n.anchor.z); m.quaternion.setFromUnitVectors(new V(0, 1, 0), new V(...normal)); } }
      }
      const lights = gadgets.nodes.filter(n => n.type === 'lamp').sort((a, b) => Math.hypot(a.x - this.camera.position.x, a.y - this.camera.position.y, a.z - this.camera.position.z) - Math.hypot(b.x - this.camera.position.x, b.y - this.camera.position.y, b.z - this.camera.position.z));
      this.workLights.forEach((l, i) => { const n = lights[i],profile=gadgets.lampProfile; l.intensity = n ? profile.intensity : 0; l.distance=profile.reach; l.color.set(profile.color); if (n) l.position.set(n.x, n.y + .23, n.z); });

    }

    this.tool.visible = e.tool !== 'gravity'; this.magicTool.visible = !this.tool.visible; this.magicTool.rotation.set(this.settings.motion ? time * .13 : 0, this.settings.motion ? time * .2 : 0, this.settings.motion ? Math.sin(time) * .2 : 0);
    this.magicCore.scale.setScalar(1 + (this.settings.motion ? Math.sin(time * 3) * .08 : 0) + (game.input.fire ? .2 : 0));
    this.rotor.visible = e.tool === 'cutter'; this.scoopHead.visible = e.tool === 'scoop'; this.lanceHead.visible = e.tool === 'lance'; this.resonatorHead.visible = e.tool === 'resonance';
    if (this.settings.motion) this.resonatorHead.rotation.z += dt * (1 + exp.charge * 14);
    this.tool.scale.setScalar(.67); if (this.settings.motion) this.tool.position.x += exp.charge * Math.sin(time * 45) * .004;
    if (game.input.aim) this.tool.position.y -= .1;
  };
})(B2);
