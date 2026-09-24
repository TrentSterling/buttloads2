/* Ridge Common: original procedural buildings, people and surface details. */
'use strict';
(function (B) {
  const T = THREE;
  const mat = (color, metalness = 0, roughness = .83) => new T.MeshStandardMaterial({ color: new T.Color(color).convertSRGBToLinear(), metalness, roughness });
  B.View.prototype.makeTown = function () {
    const g = this.townScene = new T.Group(); this.scene.add(g);
    const p = this.palette, timber = mat('#80634b'), trim = mat('#ddd1ad'), road = mat('#9e9580'), paving = mat('#bcb3a0'), glass = mat('#29494b', .15, .22), warm = new T.MeshStandardMaterial({ color: '#ffd49b', emissive: '#ffbf68', emissiveIntensity: .65 });
    const box = (x, y, z, w, h, d, m, r = 0) => this.box(g, x, y, z, w, h, d, m, r);
    const cyl = (x, y, z, a, b, h, m, sides = 10) => this.cylinder(g, x, y, z, a, b, h, m, sides);
    this.obstacles.push(...B.Town.obstacles());
    // Raised, separate surfaces prevent road/grass coplanar flicker.
    box(10, .018, 43, 6, .036, 44, road); box(5, .024, 29.5, 46, .048, 5, road);
    box(-14, .021, 49, 29, .042, 3, road); box(5, .028, 46, 13, .056, 11, paving);
    box(33, .02, 4, 24, .04, 4, road); box(-35, .02, -4, 28, .04, 4, road); box(0, .02, -34, 4, .04, 26, road);
    for (const b of B.TOWN.buildings) {
      const paint = mat(b.color), roof = mat(b.roof, .25, .65), front = b.z - b.d / 2;
      for (const w of B.TOWN.walls(b)) box((w[0] + w[3]) / 2, (w[1] + w[4]) / 2, (w[2] + w[5]) / 2, w[3] - w[0], w[4] - w[1], w[5] - w[2], paint);
      box(b.x, .033, b.z, b.w, .066, b.d, timber);
      box(b.x, b.h + .14, b.z - .05, b.w + .8, .28, b.d + 1.1, roof);
      for (let i = 0; i <= Math.floor(b.w / .38); i++) box(b.x - b.w / 2 + i * .38, b.h + .3, b.z, .035, .065, b.d + 1, roof);
      box(b.x, b.h + .38, front - .51, b.w + .7, .32, .17, trim);
      for (const x of [b.x - b.w / 2 + .15, b.x + b.w / 2 - .15]) { box(x, b.h / 2, front - .15, .18, b.h, .22, trim); box(x, 1.1, front - 1.1, .17, 2.2, .17, timber); }
      // Weatherboards and a dark kick plate lend readable scale at walking height.
      for (let y = .34; y < b.h; y += .34) for (const side of [-1, 1]) box(b.x + side * (b.w / 4 + .65), y, front - .022, b.w / 2 - 1.3, .025, .055, timber);
      box(b.x, .11, front - .6, b.w + .3, .14, 1.25, timber);
      this.sign(g, b.name, b.sub, b.x, b.h - .48, front - .19, b.w - .65, .75, Math.PI, b.person === 'otis' ? '#303c39' : '#24483f', '#f1d292');
      if (!b.closed) {
        for (const side of [-1, 1]) {
          const x = b.x + side * (b.w / 2 - 1.35);
          box(x, 1.95, front - .04, 1.7, 1.18, .065, trim); box(x, 1.95, front - .081, 1.47, .97, .035, glass);
          box(x, 1.95, front - .11, .07, 1.05, .03, trim); box(x, 1.95, front - .115, 1.5, .07, .03, trim);
          box(x, 1.34, front - .13, 1.85, .08, .25, trim);
        }
        const n = B.TOWN.people.find(n => n.id === b.person);
        box(n.x, .5, n.z - .75, 4.8, 1, .8, paint); box(n.x, 1.045, n.z - .75, 5, .09, 1, timber);
        this.sign(g, b.person === 'mara' ? 'SUPPLIES & ORE' : 'TOOLS & FREIGHT', 'E / TALK', n.x, .6, n.z - 1.161, 2.5, .45);
        box(b.x, 1.8, b.z + b.d / 2 - .5, b.w - 1, .09, .6, timber);
        box(b.x, .9, b.z + b.d / 2 - .5, b.w - 1, .09, .6, timber);
        const rng = B.random(b.person === 'mara' ? 221 : 883);
        for (let i = 0; i < 14; i++) {
          const x = b.x - b.w / 2 + .75 + (i % 7) * (b.w - 1.5) / 7, y = i < 7 ? 1.18 : 2.08, z = b.z + b.d / 2 - .55;
          if (b.person === 'mara') { cyl(x, y, z, .13, .16, .4, i % 3 ? p.yellow : p.red, 8); box(x, y + .2, z, .2, .07, .2, p.black); }
          else { cyl(x, y, z, .2 + rng() * .09, .2, .2, p.metal, 8).rotation.x = Math.PI / 2; box(x, y + .23, z, .12, .23, .1, p.dark); }
        }
        cyl(n.x + 1.65, 1.19, n.z - .72, .13, .1, .23, trim); // a mug, safely on the counter
        box(b.x, b.h - .35, b.z, 1.25, .09, .2, warm);
        const light = new T.PointLight('#ffd7a1', .75, 9, 1.7); light.position.set(b.x, b.h - .55, b.z); g.add(light);
      } else { box(b.x, 1.25, front - .05, 1.5, 2.5, .13, timber); box(b.x + .5, 1.2, front - .15, .09, .09, .09, p.yellow); }
      box(b.x + b.w / 2 - 1, b.h + .8, b.z + 1, .6, 1.35, .7, p.dark);
    }
    // A low stone well and benches form a small common between the shops and office.
    cyl(5, .38, 46, 1.3, 1.3, .76, p.concrete, 16); cyl(5, .79, 46, 1.02, 1.02, .05, glass, 16);
    for (const z of [42.5, 50]) { box(5, .49, z, 3, .14, .6, timber); for (const x of [3.9, 6.1]) { box(x, .24, z, .12, .48, .42, p.dark); this.obstacles.push([x - .12, 0, z - .32, x + .12, .58, z + .32]); } }
    const post = (x, z, title, sub, yaw = Math.PI) => { cyl(x, 1.4, z, .07, .1, 2.8, timber); this.sign(g, title, sub, x, 2.2, z - .08, 3.5, .85, yaw); this.obstacles.push([x - .12, 0, z - .12, x + .12, 2.8, z + .12]); };
    post(14, 25, 'RIDGE COMMON', 'SUPPLIES / WORKSHOP / SURVEY'); post(6, 26, 'CLAIM 02', 'YOUR YARD / 12 m NORTH', 0);
    post(31, 12, 'CLAIM 03', 'PRIVATE LAND / NO EXCAVATION'); post(-29, -9, 'COMMON LAND', 'FOOTPATH OPEN / NO EXCAVATION');
    post(45, 3, 'RIDGE TRAIL', 'THE COMMON ENDS AT THE STONE WALL', Math.PI / 2);
    for (const [x, z] of [[2, 30], [28, 30], [-17, 30], [12, 47]]) {
      cyl(x, 1.8, z, .06, .12, 3.6, p.dark); box(x, 3.6, z, .48, .12, .48, p.dark); box(x, 3.36, z, .27, .38, .27, warm);
      this.obstacles.push([x - .14, 0, z - .14, x + .14, 3.7, z + .14]);
    }
    const rng = B.random(9142), green = mat('#73844e'), flower = mat('#d4b578');
    for (let i = 0; i < 130; i++) {
      const x = -54 + rng() * 108, z = -46 + rng() * 110;
      if (Math.abs(x) < 24 && z < 24 && z > -24 || z > 23 && x > -31 && x < 30 || Math.abs(z - 4) < 3 || Math.abs(z + 4) < 3 || Math.abs(x) < 3) continue;
      const size = .2 + rng() * .6;
      if (i % 4) { const rock = new T.Mesh(new T.DodecahedronGeometry(size, 0), i % 3 ? green : flower); rock.position.set(x, size * .42, z); rock.scale.set(1, .7, .85); g.add(rock); }
      else { cyl(x, .4, z, .02, .04, .8, green, 4); const bush = new T.Mesh(new T.IcosahedronGeometry(.5, 0), green); bush.position.set(x, .65, z); bush.scale.set(1.5, .7, 1); g.add(bush); }
    }
    // The traversal edge is represented by a continuous stone boundary.
    const s = B.SURFACE;
    box(s.minX - .3, .65, (s.minZ + s.maxZ) / 2, .6, 1.3, s.maxZ - s.minZ + 1, p.concrete);
    box(s.maxX + .3, .65, (s.minZ + s.maxZ) / 2, .6, 1.3, s.maxZ - s.minZ + 1, p.concrete);
    for (const z of [s.minZ - .3, s.maxZ + .3]) box(0, .65, z, s.maxX - s.minX + 1, 1.3, .6, p.concrete);
    this.merge(g); this.townRigs = B.TOWN.people.map(person => this.makeTownPerson(person));
    this.renderer.shadowMap.needsUpdate = true;
  };
  B.View.prototype.makeTownPerson = function (person) {
    const root = new T.Group(); root.position.set(person.x, 0, person.z); this.townScene.add(root);
    const skin = mat(person.skin), coat = mat(person.coat), dark = mat('#263834'), hair = mat(person.id === 'mara' ? '#392e26' : '#817c69'), shirt = mat('#d8c3a0'), brass = mat('#cdae6a', .4), eye = mat('#142525');
    const box = (...args) => this.box(root, ...args);
    for (const x of [-.13, .13]) { box(x, .31, 0, .18, .57, .22, dark); box(x, .06, -.05, .22, .12, .37, dark); }
    const body = new T.Group(); body.position.y = .68; root.add(body);
    this.box(body, 0, .34, 0, .5, .72, .3, coat); this.box(body, 0, .37, -.162, .16, .63, .04, shirt);
    for (const x of [-.14, .14]) this.box(body, x, .26, -.185, .1, .16, .03, dark);
    const arms = [];
    for (const side of [-1, 1]) {
      const arm = new T.Group(); arm.position.set(side * .32, .6, 0); body.add(arm); arm.rotation.z = side * .08;
      this.box(arm, 0, -.22, 0, .16, .44, .19, coat); this.box(arm, 0, -.48, -.025, .14, .18, .15, skin); arms.push(arm);
    }
    const head = new T.Group(); head.position.y = 1.57; root.add(head);
    const face = new T.Mesh(new T.SphereGeometry(.23, 10, 8), skin); face.scale.set(.88, 1.1, .87); head.add(face);
    this.box(head, 0, -.04, -.205, .09, .09, .075, skin);
    const eyes = [];
    for (const x of [-.078, .078]) eyes.push(this.box(head, x, .04, -.186, .035, .031, .026, eye));
    this.box(head, 0, -.13, -.17, .1, .015, .035, hair);
    if (person.id === 'mara') {
      const cap = this.cylinder(head, 0, .2, 0, .2, .24, .17, hair, 10); cap.rotation.z = -.07;
      this.cylinder(head, 0, .19, -.02, .34, .34, .045, brass, 12);
      this.box(head, 0, -.06, .18, .3, .39, .14, hair); arms[1].rotation.x = -.35;
    } else {
      this.box(head, 0, -.15, -.11, .3, .19, .22, hair);
      this.cylinder(head, 0, .21, 0, .23, .25, .12, dark, 10);
      for (const x of [-.09, .09]) { const lens = new T.Mesh(new T.TorusGeometry(.064, .012, 5, 12), brass); lens.position.set(x, .07, -.207); head.add(lens); }
      this.box(arms[0], 0, -.65, -.04, .055, .25, .055, brass); arms[0].rotation.x = -.6;
    }
    return { person, root, body, head, arms, eyes };
  };
  B.View.prototype.renderTown = function (game, dt, time) {
    if (!this.townRigs) return;
    const surface = game.player.y > -2, motion = this.settings.motion && (game.running || game.screen === 'title');
    for (const rig of this.townRigs) {
      const close = surface && Math.hypot(game.player.x - rig.person.x, game.player.z - rig.person.z) < 7, t = motion ? time + (rig.person.id === 'otis' ? 1.7 : 0) : 0;
      rig.body.rotation.z = motion ? Math.sin(t * 1.1) * .017 : 0;
      rig.head.rotation.y = close ? B.clamp(Math.atan2(rig.person.x - game.player.x, rig.person.z - game.player.z), -.65, .65) : Math.sin(t * .3) * .12;
      rig.head.rotation.z = motion ? Math.sin(t * .7) * .035 : 0;
      rig.arms[1].rotation.x = motion ? -.12 + Math.sin(t * 1.6) * .09 : 0;
      const blink = motion && t % 4.7 > 4.55; for (const eye of rig.eyes) eye.scale.y = blink ? .15 : 1;
    }
    if (surface && motion && time - (this.townShadowAt || 0) > .2) { this.townShadowAt = time; this.renderer.shadowMap.needsUpdate = true; }
  };
})(B2);
