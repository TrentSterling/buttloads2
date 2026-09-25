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
      const faded=paint.clone();faded.color.lerp(trim.color,.12);
      for (let y = .34,row=0; y < b.h; y += .34,row++) {
        const board=row%3===0?faded:paint;
        for (const side of [-1, 1]) {
          box(b.x + side * (b.w / 4 + .65), y, front - .025, b.w / 2 - 1.3, .30, .04, board);
          box(b.x + side * (b.w / 2 + .025),y,b.z,.04,.30,b.d,board);
        }
        box(b.x,y,b.z+b.d/2+.025,b.w,.30,.04,board);
      }
      for(const side of [-1,1]){
        const x=b.x+side*(b.w/2+.04);
        for(const z of [front+.06,b.z+b.d/2-.06])box(x,b.h/2,z,.15,b.h,.18,trim);
        box(x,1.95,b.z,.08,1.23,2.1,trim);box(x+side*.052,1.95,b.z,.03,1.01,1.85,glass);
        box(x+side*.074,1.95,b.z,.025,1.08,.07,trim);box(x+side*.074,1.95,b.z,.025,.07,1.94,trim);
        box(x+side*.055,1.31,b.z,.25,.10,2.24,trim);
      }
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
        this.sign(g, b.person === 'mara' ? 'SUPPLIES & ORE' : b.person === 'inez' ? 'MAPS & LEADS' : 'TOOLS & FREIGHT', 'E / TALK', n.x, .6, n.z - 1.161, 2.5, .45);
        this.makeShopInterior(g,b,n);
        const light = new T.PointLight('#ffd7a1', .75, 9, 1.7); light.position.set(b.x, b.h - .55, b.z); g.add(light); if (b.person === 'inez') { this.officeLight = light; light.intensity = 0; }
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
    this.shopKey = new T.PointLight('#ffe5ba',0,4.5,1.5);g.add(this.shopKey);
    this.merge(g); this.townRigs = B.TOWN.people.map(person => this.makeTownPerson(person));
    this.officeClosed = new T.Group(); g.add(this.officeClosed); this.sign(this.officeClosed, 'OUT SURVEYING', 'ASK MARA / VALE SUPPLY', -26.1, 1.6, 49.25, 1.7, .65, Math.PI);
    this.officeOpen = new T.Group(); g.add(this.officeOpen); this.officeOpen.visible = false;
    this.sign(this.officeOpen, 'INEZ ROOK', 'PROSPECTOR / BACK IN BUSINESS', -26.1, 1.6, 49.25, 1.7, .65, Math.PI);
    this.box(this.officeOpen, -24, 1.105, 53.65, 2.3, .012, .65, trim);
    for (let i = 0; i < 6; i++) this.box(this.officeOpen, -24.8 + i * .3, 1.115, 53.65, .015, .007, .52, glass);
    this.renderer.shadowMap.needsUpdate = true;
  };
  B.View.prototype.renderTown = function (game, dt, time) {
    if (!this.townRigs) return;
    const surface = game.player.y > -2, motion = this.settings.motion && (game.running || game.screen === 'title' || game.screen === 'town');
    const rescued = game.rescue?.rescued;
    this.officeClosed.visible = !rescued; this.officeOpen.visible = !!rescued; this.officeLight.intensity = rescued ? .75 : 0;
    this.shopKey.intensity=0;
    for (const rig of this.townRigs) {
      rig.root.visible = game.town.people().some(p=>p.id===rig.person.id);
      this.animateResident(rig,game,time,motion);
      const n=rig.person;
      if(rig.root.visible&&surface&&n.id!=='nell'&&Math.hypot(game.player.x-n.x,game.player.z-n.z)<5.5&&!B.TOWN.blockedLine(game.player.head,{x:n.x,y:1.6,z:n.z},B.TOWN.buildings.flatMap(B.TOWN.walls))){this.shopKey.position.set(n.x-.75,2.35,n.z-1.25);this.shopKey.intensity=1.05;}

    }
    if (surface && motion && time - (this.townShadowAt || 0) > .2) { this.townShadowAt = time; this.renderer.shadowMap.needsUpdate = true; }
  };
})(B2);
