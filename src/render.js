'use strict';
(function (B) {
  const T = THREE, V = T.Vector3;
  const material = (color, metalness = 0) => new T.MeshStandardMaterial({ color: new T.Color(color).convertSRGBToLinear(), roughness: metalness ? .5 : .92, metalness });
  class View {
    constructor(canvas, settings) {
      this.settings = settings;
      this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.outputEncoding = T.sRGBEncoding; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = .95;
      this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap; this.renderer.shadowMap.autoUpdate = false;
      this.scene = new T.Scene(); this.scene.background = new T.Color('#b5c6c4'); this.scene.fog = new T.Fog('#b5c6c4', 55, 150);
      this.camera = new T.PerspectiveCamera(72, innerWidth / innerHeight, .045, 220);
      this.hemi = new T.HemisphereLight('#d7e9ed', '#55432f', .95); this.scene.add(this.hemi);
      this.sun = new T.DirectionalLight('#ffe2b0', 2.3); this.sun.position.set(-26, 40, 18); this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(2048, 2048); Object.assign(this.sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 110 }); this.sun.shadow.normalBias = .025; this.sun.shadow.bias = -.0002; this.scene.add(this.sun);
      this.lamp = new T.PointLight('#ffe6b8', 2.6, 22, 1.2); this.scene.add(this.lamp);
      this.terrainMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: .96 });
      this.terrain = new T.Group(); this.resources = new T.Group(); this.discovery = new T.Group(); this.scene.add(this.terrain, this.resources, this.discovery);
      this.palette = { dirt: material('#aa8c60'), grass: material('#919c59'), dark: material('#263434'), metal: material('#70817f', .5), steel: material('#b5bcb3', .65), yellow: material('#efb645'), red: material('#a85638'), wood: material('#726344'), leaf: material('#697e48'), black: material('#182321'), concrete: material('#b9b3a0'), pale: material('#d9d1ac') };
      this.obstacles = []; this.makeLook(); this.makeHeadlamp(); this.makeYard(); this.makeTown(); this.makeCommon(); this.makeTool(); this.makeToolFinish(); this.makeParticles(); this.gameUI = new B.GameUI(this,canvas); this.resize();
    }
    box(group, x, y, z, sx, sy, sz, mat, rotation = 0) {
      const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.rotation.y = rotation; m.castShadow = m.receiveShadow = true; group.add(m); return m;
    }
    cylinder(group, x, y, z, top, bottom, height, mat, sides = 12) {
      const m = new T.Mesh(new T.CylinderGeometry(top, bottom, height, sides), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; group.add(m); return m;
    }
    sign(group, text, sub, x, y, z, w, h, rotation = Math.PI, bg = '#253837', fg = '#f3cf79') {
      const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w); const ctx = c.getContext('2d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 ${c.height * (sub ? .43 : .57)}px Arial`;
      ctx.fillText(text, 512, c.height * (sub ? .38 : .5), 940);
      if (sub) { ctx.font = `600 ${c.height * .18}px Arial`; ctx.fillText(sub, 512, c.height * .8, 940); }
      const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: .18, roughness: .85 })); m.position.set(x, y, z); m.rotation.y = rotation; group.add(m); return m;
    }
    makeYard() {
      const g = new T.Group(), p = this.palette; this.scene.add(g);
      const box = (...args) => this.box(g, ...args), cylinder = (...args) => this.cylinder(g, ...args);
      // Four strips; there is deliberately no uneditable floor under the claim.
      // Surface Nets averages flat cells at sample + .25. Join the actual mesh border.
      this.makeCommonGround();
      // Raised apron: its top no longer shares the grass plane at y=0.
      box(0, -.045, 18.8, 40, .16, 5.6, p.concrete);
      for (let i = -14; i <= 14; i += 2) for (const z of [-14.1, 14.1]) { const b = box(i, .045, z, .9, .08, .16, i % 4 === 0 ? p.yellow : p.black); }
      for (let i = -14; i <= 14; i += 2) for (const x of [-14.1]) box(x, .045, i, .16, .08, .9, i % 4 === 0 ? p.yellow : p.black);
      for (let i = -20; i <= 20; i += 2) {
        for (const x of [-21, i<0?49:21]) { if (x < 0 ? i > -8 && i < 0 : i > 0 && i < 8) continue; box(x, .95, i, .14, 1.9, .14, p.wood); for (const h of [.6, 1.25]) box(x, h, i, .09, .15, 2.1, p.wood); }
        if (i > -4 && i < 4) continue;
        box(i, .95, -21, .14, 1.9, .14, p.wood); for (const h of [.6, 1.25]) box(i, h, -21, 2.1, .15, .09, p.wood);
      }
      // Salvage shed and service apron.
      box(-4, 2, 21.3, 15, 4, 2.5, p.dark); box(-4, 4.08, 19.3, 16.3, .18, 6.8, p.red);
      for (let i = 0; i < 38; i++) box(-11.8 + i * .42, 4.21, 19.3, .045, .13, 6.8, p.red);
      for (const x of [-11.5, 3.5]) box(x, 2, 16.4, .18, 4, .18, p.yellow);
      for (let i = 0; i < 32; i++) box(-11.4 + i * .48, 2, 19.98, .04, 3.8, .05, p.metal);
      this.sign(g, 'BUTTLOADS', 'SALVAGE & SUPPLY', -4, 3.13, 19.91, 7, 1.1);
      box(-7, .65, 17.7, 4.1, 1.3, 2.3, p.yellow); box(-7, 1.32, 17.7, 3.65, .08, 1.85, p.black);
      for (let i = 0; i < 12; i++) box(-8.65 + i * .3, 1.39, 17.7, .055, .035, 1.85, p.metal);
      this.sign(g, 'SELL YOUR HAUL', 'E  /  ORE HOPPER', -7, 2.27, 18.5, 3.8, .76);
      box(0, .72, 17.6, 3, 1.44, 1.5, p.dark); box(0, 1.5, 17.6, 3.25, .12, 1.8, p.wood);
      box(0, 2.03, 18.06, 2, .96, .16, p.black); this.sign(g, 'GEAR & RECOVERY', 'E  /  WORKSHOP', 0, 2.04, 17.95, 1.94, .87);
      this.obstacles.push([-9.1, 0, 16.5, -4.9, 1.5, 19], [-1.7, 0, 16.6, 1.7, 2.5, 18.5], [-12, 0, 20, 4, 5, 23]);
      for (const x of [5.6, 7]) { cylinder(x, .65, 19.5, .52, .52, 1.3, p.red); for (const h of [.18, 1.1]) cylinder(x, h, 19.5, .54, .54, .07, p.metal); }
      for (let i = 0; i < 5; i++) { const x = -14.8 + (i % 2) * 1.4, y = .5 + Math.floor(i / 2) * 1.04; box(x, y, 19, 1.25, 1, 1.2, p.wood); for (const dx of [-.45, .45]) box(x + dx, y, 18.38, .09, .93, .025, p.pale); }
      // Headframe, hanging cable and a landmark visible from the excavation.
      for (const x of [8.5, 12]) { const leg = box(x, 4, 15.5, .28, 8, .3, p.yellow); leg.rotation.z = x < 10 ? -.08 : .08; }
      box(10.25, 8, 15.5, 4.6, .4, .4, p.yellow); box(10.25, 4.8, 15.5, 4, .17, .23, p.black);
      cylinder(10.25, 7.8, 15.5, .4, .4, .22, p.metal).rotation.x = Math.PI / 2;
      cylinder(10.25, 5.5, 15.5, .025, .025, 4.2, p.black, 5);
      this.sign(g, 'CLAIM 02', 'KEEP GOING DOWN', 10.25, 3.1, 15.28, 3.2, .9);
      for (const x of [-17, 17]) { cylinder(x, 4.7, -18, .15, .2, 9.4, p.wood); box(x, 8.5, -18, 2.5, .16, .15, p.wood); }
      for (const dx of [-.8, .8]) { const curve = new T.CatmullRomCurve3([new V(-17 + dx, 8.6, -18), new V(dx, 6.6, -18), new V(17 + dx, 8.6, -18)]); g.add(new T.Mesh(new T.TubeGeometry(curve, 20, .028, 4, false), p.black)); }
      this.merge(g); this.renderer.shadowMap.needsUpdate = true;
    }
    merge(group) {
      const buckets = new Map();
      for (const m of [...group.children]) { if (!m.isMesh || m.material.map) continue; if (!buckets.has(m.material)) buckets.set(m.material, []); buckets.get(m.material).push(m); }
      for (const [mat, meshes] of buckets) {
        const arrays = { position: [], normal: [], uv: [] };
        for (const mesh of meshes) { mesh.updateMatrixWorld(true); const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone(); geo.applyMatrix4(mesh.matrixWorld); for (const key of Object.keys(arrays)) if (geo.attributes[key]) arrays[key].push(geo.attributes[key].array); geo.dispose(); mesh.geometry.dispose(); group.remove(mesh); }
        const geo = new T.BufferGeometry();
        for (const [key, values] of Object.entries(arrays)) { const data = new Float32Array(values.reduce((n, a) => n + a.length, 0)); let offset = 0; for (const a of values) { data.set(a, offset); offset += a.length; } geo.setAttribute(key, new T.BufferAttribute(data, key === 'uv' ? 2 : 3)); }
        const mesh = new T.Mesh(geo, mat); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
      }
    }
    bindWorld(world) {
      for (const child of [...this.terrain.children]) { child.geometry.dispose(); this.terrain.remove(child); }
      world.onChunk = rec => {
        const s = rec.mesh, geo = new T.BufferGeometry();
        for (const [key, data] of [['position', s.positions], ['normal', s.normals], ['color', s.colors]]) geo.setAttribute(key, new T.BufferAttribute(data, 3).setUsage(T.DynamicDrawUsage));
        geo.setIndex(new T.BufferAttribute(s.indices, 1).setUsage(T.DynamicDrawUsage)); geo.setDrawRange(0, s.count * 6);
        geo.boundingBox = new T.Box3(new V(rec.cx * 8 - .5, rec.cy * 8 - .5, rec.cz * 8 - .5), new V(rec.cx * 8 + 8, rec.cy * 8 + 8, rec.cz * 8 + 8)); geo.boundingSphere = new T.Sphere(geo.boundingBox.getCenter(new V()), 7.5);
        const mesh = new T.Mesh(geo, this.terrainMaterial); mesh.castShadow = true; mesh.receiveShadow = true; this.terrain.add(mesh); rec.view = mesh;
        this.renderer.shadowMap.needsUpdate = true;
      };
      world.onChange = rec => {
        const s = rec.mesh, geo = rec.view.geometry;
        const range = (attr, lo, hi) => { if (!Number.isFinite(lo) || hi <= lo) return; if (attr.updateRange.count > 0) { hi = Math.max(hi, attr.updateRange.offset + attr.updateRange.count); lo = Math.min(lo, attr.updateRange.offset); } attr.updateRange.offset = lo; attr.updateRange.count = hi - lo; attr.needsUpdate = true; };
        for (const key of ['position', 'normal', 'color']) range(geo.attributes[key], s.vertexMin, s.vertexMax);
        range(geo.index, s.indexMin, s.indexMax); geo.setDrawRange(0, s.count * 6); if (rec.cy === -1) this.renderer.shadowMap.needsUpdate = true;
      };
    }
    setDeposits(deposits) {
      for (const m of [...this.resources.children]) { m.geometry.dispose(); m.material.dispose(); this.resources.remove(m); }
      const count = deposits.nodes.length; this.oreDummy = new T.Object3D(); this.ghostSlots = new Map();
      this.oreMesh = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), new T.MeshStandardMaterial({ roughness: .55, metalness: .28, flatShading: true }), count);
      this.oreMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); this.oreMesh.frustumCulled = false;
      for (const o of deposits.nodes) { this.updateOre(o); this.oreMesh.setColorAt(o.id, new T.Color(B.ORES[o.kind].color).convertSRGBToLinear()); }
      this.resources.add(this.oreMesh);
      this.ghosts = new T.InstancedMesh(new T.IcosahedronGeometry(.2, 0), new T.MeshBasicMaterial({ transparent: true, opacity: .65, depthTest: false, depthWrite: false, blending: T.AdditiveBlending }), count + 18 + B.MYSTERIES.length + B.THUNDERSTONES.length);
      this.ghosts.count = 0; this.ghosts.frustumCulled = false; this.ghosts.renderOrder = 10; this.resources.add(this.ghosts);
    }
    updateOre(node) {
      const dummy = this.oreDummy, r = node.collected ? 0 : node.radius;
      dummy.position.set(node.x, node.y, node.z); dummy.scale.set(r * (node.kind === 4 ? .65 : 1.15), r * (node.kind === 4 ? 1.9 : .8), r); dummy.rotation.set(node.id, node.id * .7, node.id * .3); dummy.updateMatrix();
      this.oreMesh.setMatrixAt(node.id, dummy.matrix); this.oreMesh.instanceMatrix.needsUpdate = true;
      const slot = this.ghostSlots.get(node.id);
      if (slot !== undefined) { dummy.scale.setScalar(node.collected ? 0 : 1.1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); this.ghosts.setMatrixAt(slot, dummy.matrix); this.ghosts.instanceMatrix.needsUpdate = true; }
    }
    collect(node) { this.updateOre(node); }
    scan(nodes, relic) {
      const dummy = new T.Object3D(); let i = 0; this.ghostSlots.clear();
      for (const n of [...nodes, ...(relic ? [relic] : [])]) { if (n.collected) continue; if (n.kind !== undefined) this.ghostSlots.set(n.id, i); else if (n.scanKey) this.ghostSlots.set(n.scanKey, i); dummy.position.set(n.x, n.y, n.z); dummy.scale.setScalar(n.kind === undefined ? 3 : 1.1); dummy.updateMatrix(); this.ghosts.setMatrixAt(i, dummy.matrix); this.ghosts.setColorAt(i++, new T.Color(n.color || (n.kind === undefined ? '#ffdc89' : B.ORES[n.kind].color))); }
      this.ghosts.count = i; this.ghosts.instanceMatrix.needsUpdate = true; if (i) this.ghosts.instanceColor.needsUpdate = true;
    }
    makeRelics(state) {
      for (const m of [...this.discovery.children]) { m.traverse(child => { if (child.geometry) child.geometry.dispose(); if (child.material && !Object.values(this.palette).includes(child.material)) { child.material.map?.dispose(); child.material.dispose(); } }); this.discovery.remove(m); }
      this.relicModels = [];
      B.RELICS.forEach((r, i) => {
        const g = new T.Group(); g.position.set(r.x, r.y, r.z); this.discovery.add(g); const p = this.palette;
        this.cylinder(g, 0, -.55, 0, 1.5, 1.7, .3, p.dark, 10);
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; this.box(g, Math.cos(a) * 1.5, .1, Math.sin(a) * 1.5, .13, 1.3, .13, p.metal); }
        const artifact = new T.Group(); g.add(artifact);
        const glow = new T.MeshStandardMaterial({ color: i === 3 ? '#b5ffe1' : '#edc267', emissive: i === 3 ? '#52cfa5' : '#b9832c', emissiveIntensity: .6, metalness: .7, roughness: .25 });
        if (i === 3) { const heart = new T.Mesh(new T.OctahedronGeometry(.65, 0), glow); heart.position.y = .7; artifact.add(heart); }
        else { this.cylinder(artifact, 0, .3, 0, .5, .65, 1.3, p.metal); for (const y of [-.1, .4, .9]) this.cylinder(artifact, 0, y, 0, .68, .68, .09, glow); const ring = new T.Mesh(new T.TorusGeometry(.9, .06, 8, 32), p.yellow); ring.position.y = .6; ring.rotation.x = i * .7; artifact.add(ring); }
        const light = new T.PointLight(i === 3 ? '#75ecc4' : '#edb965', 1.5, 9, 1.3); light.position.y = 1.1; g.add(light);
        this.sign(g, `SURVEY ${String(i + 1).padStart(2, '0')}`, i === 3 ? 'THE HEART' : 'RECOVER RECORD', 0, 1.9, .2, 1.6, .48, 0);
        artifact.visible = i === 3 ? !state.core : !state.relics.includes(i); this.relicModels.push({ artifact, light });
      });
    }
    makeTool() {
      this.toolScene = new T.Scene(); this.toolCamera = new T.PerspectiveCamera(62, innerWidth / innerHeight, .01, 10);
      this.toolScene.add(new T.HemisphereLight('#fff1d4', '#39463d', .65)); const light = this.toolKey = new T.DirectionalLight('#fff1d4', 1.6); light.position.set(-2, 4, 3); this.toolScene.add(light);
      this.tool = new T.Group(); this.tool.position.set(.34, -.30, -.78); this.tool.scale.setScalar(.7); this.tool.rotation.set(.2, .4, -.04); this.toolScene.add(this.tool); const p = this.palette;
      const housing=new T.Shape();housing.moveTo(-.10,-.12);housing.lineTo(.10,-.12);housing.lineTo(.13,-.09);housing.lineTo(.13,.09);housing.lineTo(.10,.12);housing.lineTo(-.10,.12);housing.lineTo(-.13,.09);housing.lineTo(-.13,-.09);housing.closePath();
      this.toolHousing=new T.Mesh(new T.ExtrudeGeometry(housing,{depth:.36,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.008,bevelThickness:.008}),p.yellow);this.toolHousing.position.z=-.18;this.tool.add(this.toolHousing); this.box(this.tool, 0, -.15, .06, .12, .25, .14, p.dark); this.box(this.tool, 0, -.26, .12, .18, .13, .18, p.black);
      for (const x of [-.13, .13]) this.box(this.tool, x, .035, -.035, .025, .14, .21, p.metal);
      for (let i = 0; i < 4; i++) this.box(this.tool, -.131, .02, -.09 + i * .045, .006, .08, .012, p.black);
      const gauge = new T.Mesh(new T.CircleGeometry(.058, 24), new T.MeshBasicMaterial({ color: '#c4cba8' })); gauge.position.set(0, .025, .204); this.tool.add(gauge);
      const rim = new T.Mesh(new T.TorusGeometry(.06, .008, 5, 24), p.dark); rim.position.copy(gauge.position); rim.position.z += .002; this.tool.add(rim);
      this.needle = this.box(this.tool, .006, .038, .21, .004, .039, .003, p.red);
      for (const x of [-.092, .092]) for (const y of [-.087, .087]) { const bolt = this.cylinder(this.tool, x, y, .205, .008, .008, .007, p.steel, 6); bolt.rotation.x = Math.PI / 2; }
      this.box(this.tool, 0, -.069, .205, .095, .018, .005, p.dark);
      this.rotor = new T.Group(); this.rotor.position.z = -.25; this.tool.add(this.rotor);
      const shaft=this.cylinder(this.rotor,0,0,-.145,.045,.09,.34,p.metal,12);shaft.rotation.x=-Math.PI/2;
      for(let side=0;side<2;side++){const points=[];for(let j=0;j<=48;j++){const t=j/48,a=t*Math.PI*5+side*Math.PI,r=.11*(1-t*.65);points.push(new V(Math.cos(a)*r,Math.sin(a)*r,-t*.33));}this.rotor.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,.018,5,false),p.steel));}
      this.box(this.tool, .065, .135, -.04, .085, .026, .07, p.black); this.box(this.tool, .065, .137, -.08, .06, .012, .01, new T.MeshBasicMaterial({ color: '#fff1c0' }));
      this.box(this.tool, .07, -.25, .36, .15, .15, .34, p.dark); this.box(this.tool, .015, -.23, .17, .15, .15, .18, p.wood);
      const cable = new T.CatmullRomCurve3([new V(-.11, -.08, .13), new V(-.2, -.27, .08), new V(-.17, -.3, -.16), new V(-.06, -.09, -.2)]); this.tool.add(new T.Mesh(new T.TubeGeometry(cable, 12, .014, 5), p.black));
    }
    makeParticles() { this.makeFeedback(); }
    resize() { this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.settings.quality)); this.renderer.setSize(innerWidth, innerHeight); this.camera.aspect = this.toolCamera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.toolCamera.updateProjectionMatrix(); this.gameUI?.resize(); }
    render(game, dt, time) {
      const p = game.player, title = game.screen === 'title';
      if (title) { this.camera.position.set(25 + Math.sin(time * .04) * 2, 19, 29); this.camera.lookAt(-1, -1, 0); }
      else { this.camera.position.set(p.x, p.y + p.eye, p.z); this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ'); }
      const depth = Math.max(0, -this.camera.position.y), daylight = Math.exp(-depth * .24);
      this.hemi.intensity = .04 + .48 * daylight; this.sun.intensity = 1.85 * daylight;
      this.lamp.position.copy(this.camera.position); this.lamp.intensity = title ? 0 : .2 + 1.6 * (1 - daylight); this.lamp.distance = 22 + game.economy.state.gear.scanner * 3;
      this.scene.fog.near = 35 - Math.min(25, depth); this.scene.fog.far = 145 - Math.min(95, depth * 4);
      const atmosphere = this.atmosphere(depth); this.lamp.color.copy(atmosphere.lamp);
      this.scene.fog.color.copy(this.skyDome.material.uniforms.horizon.value).lerp(atmosphere.fog, 1 - daylight); this.scene.background.copy(this.scene.fog.color); this.renderHeadlamp(game,daylight); this.renderLook(game,daylight);
      const fire = game.running && game.input.fire && !game.input.aim, moving = this.settings.motion, shake = moving && fire ? .002 : 0;
      this.tool.position.z = -.78 + (moving ? (game.feedback?.kick || 0) * .045 : 0);
      this.tool.position.y = -.30 + Math.sin(time * 8) * (this.settings.motion && Math.hypot(p.vx, p.vz) > .5 ? .006 : 0); this.tool.position.x = .34 + Math.sin(time * 77) * shake;
      this.needle.rotation.z = fire ? -.6 + (moving ? Math.sin(time * 35) * .15 : 0) : .7;
      if (game.expedition) this.renderExpedition(game, dt, time);
      this.renderMining(game, dt); this.renderFeedback(game); this.renderTown(game, dt, time); this.renderCaverns(game); this.renderCombat(game, time); this.renderDeep(game, time); this.renderForeman(game, time); this.renderRescue(game, time); this.renderCrawlers(game, time); this.renderKinetics(game, time); this.renderParcel(game); this.renderFossil(game,time);
      if (this.ghosts) { this.ghosts.material.opacity = B.clamp(game.scanUntil - game.clock, 0, 1) * (.45 + Math.sin(time * 8) * .15); if (game.scanUntil <= game.clock) this.ghosts.count = 0; }
      if (this.relicModels?.[3]) this.relicModels[3].artifact.rotation.y = time * .35;
      if(this.renderer.shadowMap.needsUpdate)this.sun.shadow.needsUpdate=true;
      this.renderer.autoClear = true; this.renderer.render(this.scene, this.camera);
      if (!title && game.ready && game.screen !== 'town') { this.renderer.autoClear = false; this.renderer.clearDepth(); this.renderer.render(this.toolScene, this.toolCamera); }
      this.gameUI.render(game,dt);
    }
  }
  B.View = View;
})(B2);
