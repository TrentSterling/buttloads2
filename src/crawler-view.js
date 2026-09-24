/* Original shale-crab silhouettes, broken shells, claw tells and basalt axe fittings. */
'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeCrawlers = function (game) {
    if (this.crawlerScene) { const mats = new Set(); this.crawlerScene.traverse(n => { n.geometry?.dispose(); if (n.material) mats.add(n.material); }); mats.forEach(m => m.dispose()); this.scene.remove(this.crawlerScene); }
    const scene = this.crawlerScene = new T.Group(); this.scene.add(scene); this.crawlerModels = [];
    const mat = (color, glow = 0) => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glow, roughness: .83, flatShading: true });
    for (const n of game.crawlers.nodes) {
      const root = new T.Group(); scene.add(root); const stone = mat('#696c61'), dark = mat('#323d39'), core = mat('#ce805b', .15), glow = mat('#efd6a1', .8);
      const body = new T.Mesh(new T.IcosahedronGeometry(.43, 1), core); body.scale.set(1.15, .65, 1.45); root.add(body);
      const shell = new T.Group(); root.add(shell);
      for (let i = 0; i < 4; i++) { const plate = new T.Mesh(new T.DodecahedronGeometry(.31, 0), stone); plate.position.set(0, .15, -.36 + i * .2); plate.scale.set(1.75, .85, .9); shell.add(plate); }
      const rear = this.box(root, 0, -.035, -.63, .35, .23, .035, core);
      const legs = [], claws = [];
      for (const side of [-1, 1]) {
        for (const z of [-.38, -.1, .18]) {
          const leg = new T.Group(); leg.position.set(side * .44, -.15, z); root.add(leg);
          this.box(leg, side * .15, -.05, -.01, .32, .09, .09, stone, side * -.35);
          this.box(leg, side * .29, -.2, -.01, .055, .25, .06, dark); legs.push(leg);
        }
        const claw = new T.Group(); claw.position.set(side * .32, -.04, .34); root.add(claw);
        this.box(claw, side * .08, -.015, .14, .14, .17, .3, stone, side * -.24);
        this.box(claw, side * .12, .015, .29, .18, .15, .16, dark); claws.push(claw);
        const eye = new T.Mesh(new T.IcosahedronGeometry(.048, 0), glow); eye.position.set(side * .19, .05, .59); root.add(eye);
      }
      const tell = new T.Mesh(new T.TorusGeometry(1, .027, 5, 32), new T.MeshBasicMaterial({ color: '#ffc08a', transparent: true, opacity: .85, depthWrite: false })); tell.rotation.x = Math.PI / 2; scene.add(tell);
      this.crawlerModels.push({ root, shell, body, core, stone, glow, rear, legs, claws, tell, node: n });
    }
    if (!this.impactAxe) {
      const addon = this.impactAxe = new T.Group(); this.axeTool.add(addon);
      for (const y of [.17, .24, .31]) { const tooth = new T.Mesh(new T.ConeGeometry(.042, .12, 5), this.palette.dark); tooth.position.set(.26, y, 0); tooth.rotation.z = -Math.PI / 2; addon.add(tooth); }
      this.box(addon, .11, .24, .052, .2, .085, .025, this.palette.yellow);
    }
    this.renderCrawlers(game, 0);
  };
  B.View.prototype.renderCrawlers = function (game, time) {
    if (!game.crawlers || !this.crawlerScene) return;
    this.impactAxe.visible = game.crawlers.state.impactHead;
    for (const m of this.crawlerModels) {
      const n = m.node; m.root.visible = n.phase !== 'buried'; m.root.position.set(n.x, n.y, n.z); m.root.rotation.y = n.yaw;
      m.shell.visible = n.shell > 0; m.glow.emissiveIntensity = n.hp <= 0 ? 0 : n.phase === 'windup' ? 2.1 : .65; m.core.emissiveIntensity = n.hp <= 0 ? 0 : .18;
      m.body.scale.y = n.hp <= 0 ? .45 : .65;
      const walking = n.hp > 0 && Math.hypot(n.vx, n.vz) > .1 && game.running && this.settings.motion;
      m.legs.forEach((leg, i) => { leg.rotation.x = walking ? Math.sin(time * 15 + i * 2) * .1 : 0; });
      m.claws.forEach(c => { c.rotation.x = n.phase === 'windup' ? -.65 : n.phase === 'lunge' ? .15 : 0; });
      m.tell.visible = n.phase === 'windup'; m.tell.position.set(n.x, n.y - .45, n.z); m.tell.scale.setScalar(1 + n.timer / .95 * .6);
    }
  };
})(B2);
