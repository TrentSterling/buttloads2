/* Ridge Common: original procedural buildings, people and surface details. */
'use strict';
(function (B) {
  const T = THREE;
  const mat = (color, metalness = 0, roughness = .83) => new T.MeshStandardMaterial({ color: new T.Color(color).convertSRGBToLinear(), metalness, roughness });
  function paintedBoards(seed){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d'),random=B.random(seed);ctx.fillStyle='#dedbd0';ctx.fillRect(0,0,512,512);
    for(let i=0;i<1900;i++){const x=random()*512,y=random()*512;ctx.fillStyle=i%3?'rgba(74,66,49,.035)':'rgba(249,236,206,.12)';ctx.fillRect(x,y,18+random()*110,.6+random()*.6);}
    for(let i=0;i<240;i++){ctx.fillStyle='rgba(83,71,46,.25)';ctx.fillRect(random()*512,508+random()*4,1+random()*10,.5+random()*2);}
    for(let i=0;i<7;i++){const y=random()*512;ctx.strokeStyle='rgba(78,63,42,.08)';ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(160,y+8,300,y-6,512,y+2);ctx.stroke();}
    const texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;return texture;
  }
  B.View.prototype.makeTown = function () {
    const g = this.townScene = new T.Group(); this.scene.add(g);
    const p = this.palette, timber = mat('#80634b'), trim = mat('#ddd1ad'), road = mat('#9e9580'), paving = mat('#bcb3a0'), glass = mat('#29494b', .15, .22), warm = new T.MeshStandardMaterial({ color: '#ffd49b', emissive: '#ffbf68', emissiveIntensity: .65 });
    timber.map=this.yardArtMaterials.wood.map;timber.bumpMap=timber.map;timber.bumpScale=.008;
    const box = (x, y, z, w, h, d, m, r = 0) => this.box(g, x, y, z, w, h, d, m, r);
    const cyl = (x, y, z, a, b, h, m, sides = 10) => this.cylinder(g, x, y, z, a, b, h, m, sides);
    this.obstacles.push(...B.Town.obstacles());const roofMaterials=new Set();
    for (const b of B.TOWN.buildings) {
      const paint = mat(b.color), roof = mat(b.roof, .25, .65), front = b.z - b.d / 2;
      paint.map=paintedBoards(Math.floor(b.x*179+b.z*271));paint.bumpMap=paint.map;paint.bumpScale=.004;
      roofMaterials.add(roof);
      for (const w of B.TOWN.walls(b)) box((w[0] + w[3]) / 2, (w[1] + w[4]) / 2, (w[2] + w[5]) / 2, w[3] - w[0], w[4] - w[1], w[5] - w[2], paint);
      box(b.x, .033, b.z, b.w, .066, b.d, timber);
      const r=B.TOWN.roof(b),angle=Math.atan2(r.rise,r.reach),length=Math.hypot(r.reach,r.rise);
      // Actual pitched panels, closed gables, verge boards and ridge flashing.
      for(const side of [-1,1]){
        const panel=box(b.x+side*r.reach/2,b.h+.13+r.rise/2,b.z,length,.14,r.depth,roof);panel.rotation.z=-side*angle;
        for(let z=front-.5;z<b.z+b.d/2+.56;z+=.40){const seam=box(b.x+side*r.reach/2,b.h+.22+r.rise/2,z,length,.035,.025,roof);seam.rotation.z=-side*angle;}
        for(const z of [front-.57,b.z+b.d/2+.57]){const verge=box(b.x+side*r.reach/2,b.h+.09+r.rise/2,z,length+.07,.19,.13,trim);verge.rotation.z=-side*angle;}
        box(b.x+side*(r.reach-.04),b.h+.06,b.z,.16,.21,r.depth,trim);
        const gutter=cyl(b.x+side*(r.reach+.04),b.h+.12,b.z,.075,.075,r.depth,timber,8);gutter.rotation.x=Math.PI/2;
        cyl(b.x+side*(r.reach-.10),b.h/2,front+.15,.05,.05,b.h,timber,8);
      }
      box(b.x,b.h+.25+r.rise,b.z,.21,.11,r.depth+.08,roof);
      for(const [z,reverse]of [[front-.01,false],[b.z+b.d/2+.01,true]]){
        const positions=[b.x-b.w/2,b.h,z,b.x,b.h+.13+r.rise,z,b.x+b.w/2,b.h,z];
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,.5,(r.rise+.13)/.34,1,0],2));geo.setIndex(reverse?[2,1,0]:[0,1,2]);geo.computeVertexNormals();const face=new T.Mesh(geo,paint);face.castShadow=face.receiveShadow=true;g.add(face);
        for(let y=b.h+.25;y<b.h+r.rise-.1;y+=.23){const w=b.w*(1-(y-b.h)/(r.rise+.13));box(b.x,y,z+(reverse?.025:-.025),w,.033,.035,trim);}
        const ventY=b.h+r.rise*.79;
        box(b.x,ventY,z+(reverse?.05:-.05),.42,.24,.08,timber);for(let i=0;i<3;i++)box(b.x,ventY-.075+i*.075,z+(reverse?.10:-.10),.33,.025,.03,trim);
      }
      box(b.x,b.h-.60,front-.86,b.w+.48,.12,1.98,roof);
      box(b.x,b.h-.74,front-.96,b.w+.45,.19,.15,timber);
      for(let x=b.x-b.w/2;x<b.x+b.w/2+.1;x+=.38)box(x,b.h-.53,front-.86,.025,.025,1.97,roof);
      for(const side of [-1,1]){
       const x=b.x+side*(b.w/2-.15),postH=b.h-.65;
       box(x,b.h/2,front-.15,.18,b.h,.22,trim);box(x,postH/2,front-.96,.17,postH,.17,timber);
       box(x,.10,front-.96,.30,.20,.30,p.concrete);
       const brace=box(x-side*.24,postH-.24,front-.96,.68,.095,.11,timber);brace.rotation.z=side*.76;
       const cantilever=box(x,postH-.22,front-1.25,.10,.085,.75,timber);cantilever.rotation.x=-.65;
      }
      // Weatherboards and a dark kick plate lend readable scale at walking height.
      const faded=paint.clone();faded.color.lerp(trim.color,.12);
      const joint=paint.clone();joint.color.multiplyScalar(.64);
      for (let y = .34,row=0; y < b.h; y += .34,row++) {
        const board=row%3===0?faded:paint;
        for (const side of [-1, 1]) {
          box(b.x + side * (b.w / 4 + .65), y, front - .025, b.w / 2 - 1.3, .30, .04, board);
          box(b.x + side * (b.w / 2 + .025),y,b.z,.04,.30,b.d,board);
        }
        box(b.x,y,b.z+b.d/2+.025,b.w,.30,.04,board);
      }
      // Broken board lengths and exposed end grain interrupt the broad wall bands.
      for(const side of [-1,1])for(let row=0;row<Math.floor(b.h/.34);row++){
        const y=.34+row*.34,x=b.x+side*(b.w/2+.048),z=front+1.1+(row%3)*1.35;
        box(x-.005*side,y,z,.004,.25,.012,joint);
        for(const off of [-.085,.085]){const nail=cyl(x+side*.014,y+off,z-.045,.012,.012,.016,p.dark,6);nail.rotation.z=Math.PI/2;}
      }
      box(b.x,.17,b.z+b.d/2+.042,b.w,.22,.045,timber);
      for(const side of [-1,1]){
        const x=b.x+side*(b.w/2+.04);
        for(const z of [front+.06,b.z+b.d/2-.06])box(x,b.h/2,z,.15,b.h,.18,trim);
        box(x,1.95,b.z,.08,1.23,2.1,trim);box(x+side*.052,1.95,b.z,.03,1.01,1.85,glass);
        box(x+side*.074,1.95,b.z,.025,1.08,.07,trim);box(x+side*.074,1.95,b.z,.025,.07,1.94,trim);
        box(x+side*.055,1.31,b.z,.25,.10,2.24,trim);
      }
      box(b.x, .11, front - .6, b.w + .3, .14, 1.25, timber);
      this.sign(g, b.name, b.sub, b.x, b.h - .76, front - 1.94, b.w * .70, .54, Math.PI, b.person === 'otis' ? '#303c39' : '#24483f', '#f1d292');
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
    this.makeCommonFurniture();
    const post = (x, z, title, sub, yaw = Math.PI) => { cyl(x, 1.4, z, .07, .1, 2.8, timber); this.sign(g, title, sub, x, 2.2, z - .08, 3.5, .85, yaw); this.obstacles.push([x - .12, 0, z - .12, x + .12, 2.8, z + .12]); };
    post(14, 25, 'RIDGE COMMON', 'SUPPLIES / WORKSHOP / SURVEY'); post(6, 26, 'CLAIM 02', 'YOUR YARD / 12 m NORTH', 0);
    post(31, 12, 'CLAIM 03', 'PRIVATE LAND / NO EXCAVATION'); post(-29, -9, 'COMMON LAND', 'FOOTPATH OPEN / NO EXCAVATION');
    post(45, 3, 'RIDGE TRAIL', 'RESERVOIR / FOLLOW THE WINDING PATH', Math.PI / 2);
    for (const [x, z] of [[2, 30], [28, 30], [-17, 30], [12, 47]]) {
      cyl(x, 1.8, z, .06, .12, 3.6, p.dark); box(x, 3.6, z, .48, .12, .48, p.dark); box(x, 3.36, z, .27, .38, .27, warm);
      this.obstacles.push([x - .14, 0, z - .14, x + .14, 3.7, z + .14]);
    }
    this.shopKey = new T.PointLight('#ffe5ba',0,4.5,1.5);g.add(this.shopKey);
    this.merge(g,true);this.townRoofs=g.children.filter(m=>m.isMesh&&roofMaterials.has(m.material)); this.townRigs = B.TOWN.people.map(person => this.makeTownPerson(person));
    this.officeClosed = new T.Group(); g.add(this.officeClosed); this.sign(this.officeClosed, 'OUT SURVEYING', 'ASK MARA / VALE SUPPLY', -26.1, 1.6, 49.25, 1.7, .65, Math.PI);
    this.officeOpen = new T.Group(); g.add(this.officeOpen); this.officeOpen.visible = false;
    this.sign(this.officeOpen, 'INEZ ROOK', 'PROSPECTOR / BACK IN BUSINESS', -26.1, 1.6, 49.25, 1.7, .65, Math.PI);
    this.box(this.officeOpen, -24, 1.105, 53.65, 2.3, .012, .65, trim);
    for (let i = 0; i < 6; i++) this.box(this.officeOpen, -24.8 + i * .3, 1.115, 53.65, .015, .007, .52, glass);
    B.WorkshopShapes.mergeRigid(this.officeOpen);
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
    // Residents only move the sun shadow when their small animated shadows
    // can be seen from nearby. The static town and depot retain their map.
    const nearby=this.townRigs.some(r=>r.root.visible&&Math.hypot(this.camera.position.x-r.person.x,this.camera.position.z-r.person.z)<22);
    if (surface && motion && nearby && time - (this.townShadowAt || 0) > .2) { this.townShadowAt = time; this.renderer.shadowMap.needsUpdate = true; }
  };
})(B2);
