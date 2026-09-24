/* Surface gantry, travelling cage and suspended underground loading platform. */
'use strict';
(function (B) {
  const T = THREE, V = T.Vector3;
  B.View.prototype.makeFreight = function () {
    const p = this.palette, root = this.freightModel = new T.Group(); this.discovery.add(root);
    this.craneRail = new T.Group(); root.add(this.craneRail);
    for (const x of [-14.7, 14.7]) {
      this.box(this.craneRail, x, .14, 0, 1, .28, 1.3, p.concrete);
      for (const z of [-.22, .22]) this.box(this.craneRail, x, 2.2, z, .22, 4.4, .18, p.yellow);
      for (let y = .4; y < 4; y += .7) this.box(this.craneRail, x, y, 0, .26, .07, .6, p.black);
    }
    for (const y of [4.15, 4.5]) this.box(this.craneRail, 0, y, 0, 29.8, .15, .35, p.yellow);
    for (let x = -14.6; x < 14.7; x += .65) this.box(this.craneRail, x, 4.32, 0, .07, .3, .27, p.metal);
    this.sign(this.craneRail, 'FREIGHT / 02', 'AUTOMATIC YARD TRANSFER', 0, 4.8, .2, 3.8, .48, 0);
    this.box(this.craneRail, 15.6, 1, 0, 1.3, 2, 1.4, p.dark);
    this.sign(this.craneRail, 'YARD DEPOT', 'SELL AT THE HOPPER', 15.6, 1.8, .71, 1.2, .4, 0);
    this.craneTrolley = new T.Group(); this.craneRail.add(this.craneTrolley);
    this.box(this.craneTrolley, 0, 4, 0, .9, .3, .75, p.red);
    this.cylinder(this.craneTrolley, 0, 3.88, 0, .22, .22, .5, p.metal).rotation.x = Math.PI / 2;
    this.freightDock = new T.Group(); root.add(this.freightDock);
    this.box(this.freightDock, 0, .08, 0, 1.4, .16, 1.4, p.metal);
    for (const x of [-.58, .58]) this.box(this.freightDock, x, .18, 0, .12, .06, 1.3, p.yellow);
    this.sign(this.freightDock, 'LOAD / E', 'FREIGHT TO THE YARD', 0, .35, .72, 1.05, .34, 0);
    this.freightCage = new T.Group(); root.add(this.freightCage);
    this.box(this.freightCage, 0, -.4, 0, .88, .08, .88, p.yellow);
    for (const x of [-.4, .4]) for (const z of [-.4, .4]) this.box(this.freightCage, x, 0, z, .07, .86, .07, p.metal);
    for (const y of [-.2, .15, .4]) { this.box(this.freightCage, 0, y, -.4, .86, .045, .04, p.metal); this.box(this.freightCage, 0, y, .4, .86, .045, .04, p.metal); this.box(this.freightCage, -.4, y, 0, .04, .045, .86, p.metal); this.box(this.freightCage, .4, y, 0, .04, .045, .86, p.metal); }
    const glow = new T.MeshStandardMaterial({ color: '#9de3c5', emissive: '#74cbaa', emissiveIntensity: 1 });
    this.freightLamp = this.cylinder(this.freightDock, .6, .4, .6, .06, .06, .18, glow);
    this.freightCargo = new T.InstancedMesh(new T.DodecahedronGeometry(.13), new T.MeshStandardMaterial({ roughness: .65, metalness: .4 }), 12); this.freightCargo.count = 0; this.freightCage.add(this.freightCargo);
    const cable = () => { const l = new T.Line(new T.BufferGeometry().setFromPoints([new V(), new V()]), new T.LineBasicMaterial({ color: '#637b75' })); l.frustumCulled = false; root.add(l); return l; };
    this.freightCable = cable(); this.dockCables = [cable(), cable()];
    this.freightBlock = new T.Mesh(new T.OctahedronGeometry(.18), new T.MeshBasicMaterial({ color: '#ffae65', wireframe: true, depthTest: false, depthWrite: false, transparent: true, opacity: .8 })); root.add(this.freightBlock); this.freightBlock.renderOrder = 9;
    this.freightPreview = new T.Group(); this.discovery.add(this.freightPreview);
    this.freightGhost = this.box(this.freightPreview, 0, .8, 0, 1.4, 1.6, 1.4, new T.MeshBasicMaterial({ color: '#87eac1', wireframe: true, transparent: true, opacity: .65, depthWrite: false }));
    this.freightPreview.visible = root.visible = false; this.freightCargoKey = ''; this.freightDrawRevision = -1;
  };
  B.View.prototype.renderFreight = function (game, time) {
    const freight = game.freight, s = freight.state, root = this.freightModel;
    const preview = game.freightPreview; this.freightPreview.visible = game.input.aim === 'freight' && !!preview?.dock;
    if (this.freightPreview.visible) { this.freightPreview.position.set(preview.dock.x, preview.dock.y, preview.dock.z); this.freightGhost.material.color.set(preview.reason ? '#ed8268' : preview.obstruction ? '#edbd6b' : '#87eac1'); }
    const location = s.dock ? `${s.dock.x},${s.dock.y},${s.dock.z}` : '';
    if (this.freightLocation !== location || (s.phase !== 'idle' && time - (this.freightShadowTime || 0) > .12)) { this.renderer.shadowMap.needsUpdate = true; this.freightLocation = location; this.freightShadowTime = time; }
    root.visible = !!s.dock; if (!s.dock) return;
    const d = s.dock, c = freight.cage;
    this.craneRail.position.z = d.z; this.craneTrolley.position.x = c.x; this.freightDock.position.set(d.x, d.y, d.z); this.freightCage.position.set(c.x, c.y, c.z);
    const line = (l, a, b) => { const v = l.geometry.attributes.position; v.setXYZ(0, a.x, a.y, a.z); v.setXYZ(1, b.x, b.y, b.z); v.needsUpdate = true; };
    line(this.freightCable, { x: c.x, y: 3.95, z: c.z }, { ...c, y: c.y + .44 });
    this.dockCables.forEach((l, i) => { const x = d.x + (i ? .62 : -.62); line(l, { x, y: 4.1, z: d.z - .6 }, { x, y: d.y + .18, z: d.z - .6 }); });
    this.freightBlock.visible = !!freight.obstruction;
    if (freight.obstruction) { const p = freight.obstruction; this.freightBlock.position.set(p.x, p.y, p.z); this.freightBlock.rotation.y = time; }
    this.freightLamp.material.emissive.set(freight.blockedBy ? '#ef9565' : '#74cbaa');
    const cargoKey = s.load.join(',');
    if (cargoKey !== this.freightCargoKey) {
      this.freightCargoKey = cargoKey; const kinds = s.load.flatMap((n, i) => Array(Math.min(n, 12)).fill(i)).slice(0, 12), dummy = new T.Object3D();
      kinds.forEach((kind, i) => { dummy.position.set((i % 3 - 1) * .24, -.22 + Math.floor(i / 6) * .22, (Math.floor(i / 3) % 2 - .5) * .3); dummy.rotation.set(i, i * .7, i); dummy.updateMatrix(); this.freightCargo.setMatrixAt(i, dummy.matrix); this.freightCargo.setColorAt(i, new T.Color(B.ORES[kind].color)); });
      this.freightCargo.count = kinds.length; this.freightCargo.instanceMatrix.needsUpdate = true; if (kinds.length) this.freightCargo.instanceColor.needsUpdate = true;
    }
  };
})(B2);
