/* Original survey-bell machinery and the physical route home. */
'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeRescue = function (game) {
    if (this.rescueScene) {
      const mats = new Set(); this.rescueScene.traverse(n => { n.geometry?.dispose(); if (n.material) mats.add(n.material); });
      for (const m of mats) { m.map?.dispose(); m.dispose(); } this.scene.remove(this.rescueScene);
    }
    const group = this.rescueScene = new T.Group(); this.scene.add(group);
    const mat = (color, glow = 0) => new T.MeshStandardMaterial({ color, roughness: .65, metalness: .35, emissive: color, emissiveIntensity: glow });
    const metal = mat('#476d76'), trim = mat('#d0b271'), iron = mat('#263b3f');
    const bell = this.rescueBell = new T.Group(); group.add(bell);
    this.box(bell, 0, -1.07, 0, 1.5, .36, 1.5, iron); this.box(bell, 0, 1.1, 0, 1.5, .3, 1.5, metal);
    this.box(bell, 0, -.45, .68, 1.45, 1.5, .13, metal);
    for (const x of [-.67, .67]) for (const z of [-.67, .67]) this.box(bell, x, 0, z, .14, 2.2, .14, trim);
    for (const x of [-.7, .7]) this.box(bell, x, -.1, 0, .08, .12, 1.4, iron);
    this.box(bell, .42, .15, -.685, .37, .51, .13, metal);
    for (let i = 0; i < 3; i++) this.box(bell, .42, .12 + i * .085, -.738, .22, .023, .008, iron);
    const glass = new T.MeshStandardMaterial({ color: '#aed6db', transparent: true, opacity: .12, roughness: .18, metalness: .05, depthWrite: false });
    this.box(bell, 0, .05, -.67, 1.18, 1.66, .025, glass);
    for (const x of [-.67, .67]) this.box(bell, x, .05, 0, .025, 1.66, 1.18, glass);
    this.rescueLens = this.box(bell, .42, .33, -.738, .12, .05, .009, mat('#efc16e', .3));
    const person = B.TOWN.people.find(p => p.id === 'inez'); this.bellPerson = this.makeTownPerson(person, bell);
    this.bellPerson.root.position.set(-.09, -.9, .05); this.bellPerson.root.scale.setScalar(.84); this.bellPerson.root.visible = !game.rescue.rescued;
    this.box(group, 14.6, 2.25, 8, .7, 4.5, .7, iron); this.box(group, 11.3, 4.48, 8, 7.2, .34, .4, metal);
    this.rescueWheel = this.cylinder(group, 14.6, 3.7, 7.55, .34, .34, .4, trim, 12); this.rescueWheel.rotation.x = Math.PI / 2;
    this.rescueCable = this.box(group, 8, 0, 8, .025, 1, .025, iron);
    this.rescueStop = new T.Mesh(new T.OctahedronGeometry(.13), new T.MeshBasicMaterial({ color: '#ffb04e', depthTest: false, transparent: true, opacity: .85 })); group.add(this.rescueStop); this.rescueStop.renderOrder = 5;
    this.rescueLamp = new T.PointLight('#bcdee5', 0, 7, 1.8); group.add(this.rescueLamp);
    this.renderRescue(game, 0);
  };
  B.View.prototype.renderRescue = function (game, time) {
    if (!this.rescueScene || !game.rescue) return;
    const r = game.rescue, p = r.position; this.rescueBell.position.set(p.x, p.y, p.z);
    this.bellPerson.root.visible = !r.rescued; const moving = r.state.phase === 'hoisting' && !r.blockedBy;
    this.rescueWheel.rotation.y = moving && game.running && this.settings.motion ? time * 2 : 0;
    const length = 4.3 - p.y - 1.25; this.rescueCable.position.y = p.y + 1.25 + length / 2; this.rescueCable.scale.y = length;
    this.rescueLens.material.emissiveIntensity = r.state.phase === 'stranded' ? .2 : 1.3;
    this.rescueLamp.position.set(p.x, p.y + .7, p.z - .8); this.rescueLamp.intensity = r.state.phase !== 'stranded' && game.world.clearLine(game.player.head, this.rescueLamp.position, .05) ? 1.1 : 0;
    this.rescueStop.visible = !!r.obstruction && r.state.known && Math.hypot(game.player.x - p.x, game.player.y - p.y, game.player.z - p.z) < 12;
    if (r.obstruction) this.rescueStop.position.set(r.obstruction.x, r.obstruction.y, r.obstruction.z);
    const slot = this.ghostSlots?.get('rescue');
    if (slot !== undefined) { const dummy = new T.Object3D(); dummy.position.set(p.x, p.y, p.z); dummy.scale.setScalar(r.rescued ? 0 : 3.5); dummy.updateMatrix(); this.ghosts.setMatrixAt(slot, dummy.matrix); this.ghosts.instanceMatrix.needsUpdate = true; }
  };
})(B2);
