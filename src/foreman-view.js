/* Original furnace machinery, attack tells and the powered common. */
'use strict';
(function (B) {
  const T = THREE, V = T.Vector3;
  B.View.prototype.makeForeman = function (game) {
    if (this.foremanScene) { const mats = new Set(); this.foremanScene.traverse(n => { n.geometry?.dispose(); if (n.material) mats.add(n.material); }); mats.forEach(m => m.dispose()); this.scene.remove(this.foremanScene); }
    const group = this.foremanScene = new T.Group(); this.scene.add(group); this.foremanModels = []; this.pressureLinks = [];
    const mat = (color, glow = 0, metal = .65) => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glow, roughness: .58, metalness: metal });
    for (const n of game.foreman.nodes) { const model=this.makeForemanMachine(n);group.add(model.root);this.foremanModels.push(model); }
    const tube = color => { const mesh = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshBasicMaterial({ color, transparent: true, opacity: .8, depthWrite: false })); group.add(mesh); return mesh; };
    for (let i = 0; i < 3; i++) this.pressureLinks.push(tube('#91c7b7'));
    this.furnaceJet = tube('#f2bd83'); this.foundryBeam = tube('#85f4ce');
    const waveGeometry=new T.BufferGeometry();waveGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(96*6*3),3).setUsage(T.DynamicDrawUsage));waveGeometry.setAttribute('normal',new T.BufferAttribute(new Float32Array(96*6*3),3));waveGeometry.setDrawRange(0,0);
    this.furnaceRing=new T.Mesh(waveGeometry,new T.MeshBasicMaterial({color:'#ffab51',side:T.DoubleSide,transparent:true,opacity:.68,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));this.furnaceRing.frustumCulled=false;group.add(this.furnaceRing);
    this.furnaceImpact=new T.Mesh(new T.TorusGeometry(.7,.018,6,48),new T.MeshBasicMaterial({color:'#ffae5e',transparent:true,opacity:.85,depthWrite:false}));group.add(this.furnaceImpact);
    this.furnaceLight = new T.PointLight('#ffb173', 0, 18, 1.6); group.add(this.furnaceLight);
    const beacon = this.commonBeacon = new T.Group(); beacon.position.set(5, .6, 46); group.add(beacon);
    const finish=(color,glow=0,metalness=0)=>new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),emissive:new T.Color(color).convertSRGBToLinear(),emissiveIntensity:glow,roughness:.43,metalness});
    const jade=finish('#247d68',.16,.12),facet=finish('#56bba0',.10,.08),brass=finish('#9a7a47',0,.58),inlay=finish('#4aaf99',.22,.18);
    this.beaconMaterials={jade,facet,brass,inlay};
    const add=(geometry,material,x,y,z)=>{const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;beacon.add(mesh);return mesh;};
    const strut=(a,b,r)=>{const start=new V(...a),end=new V(...b),delta=end.clone().sub(start),mesh=add(new T.CylinderGeometry(r,r,delta.length(),6),brass,...start.add(end).multiplyScalar(.5).toArray());mesh.quaternion.setFromUnitVectors(new V(0,1,0),delta.normalize());};
    for(let i=0;i<3;i++){
      const angle=i*Math.PI*2/3,cx=Math.cos(angle)*.46,cz=Math.sin(angle)*.46,cy=.56+(i===1?.12:0),points=[],buckets=[[],[]];
      for(const [radius,y]of [[.11,-.34],[.23,-.18],[.18,.28],[0,.59]])for(let j=0;j<6;j++){const a=angle+j/6*Math.PI*2;points.push([cx+Math.cos(a)*radius,cy+y,cz+Math.sin(a)*radius]);}
      for(let ring=0;ring<3;ring++)for(let j=0;j<6;j++){const a=ring*6+j,b=ring*6+(j+1)%6;for(const p of [points[a],points[a+6],points[b],points[b],points[a+6],points[b+6]])buckets[j%3===0?1:0].push(...p);}
      for(const [j,pos]of buckets.entries()){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();add(geo,j?facet:jade,0,0,0);}
      add(new T.CylinderGeometry(.16,.20,.09,10),brass,cx,cy-.28,cz);
      for(const side of [-1,1]){const a=angle+side*.28;strut([Math.cos(a)*1.06,.385,Math.sin(a)*1.06],[cx+Math.cos(a)*.10,cy-.30,cz+Math.sin(a)*.10],.017);}
    }
    for(const [radius,y,r,material]of [[1.08,.385,.036,brass],[.97,.42,.014,inlay]]){const ring=add(new T.TorusGeometry(radius,r,6,64),material,0,y,0);ring.rotation.x=Math.PI/2;}
    this.commonLight = new T.PointLight('#a6f9cd', 0, 13, 1.7); this.commonLight.position.set(5, 1.5, 46); group.add(this.commonLight);
    for (const [x, z, w, d] of [[8.8, 38, .055, 14], [11.2, 38, .055, 14], [5, 29.5, 42, .055]]) {this.box(beacon,x-5,-.543,z-46,w*2,.013,d,brass);this.box(beacon,x-5,-.533,z-46,w,.010,d,inlay);}
    this.merge(beacon);
  };
  B.View.prototype.furnaceTube = function (mesh, a, b, radius) {
    const start = new V(a.x, a.y, a.z), end = new V(b.x, b.y, b.z), delta = end.clone().sub(start);
    mesh.position.copy(start.add(end).multiplyScalar(.5)); mesh.scale.set(radius, delta.length(), radius);
    if (delta.lengthSq() > 1e-9) mesh.quaternion.setFromUnitVectors(new V(0, 1, 0), delta.normalize());
  };
  B.View.prototype.renderFurnaceWave = function(game,near) {
    const mesh=this.furnaceRing,f=game.foreman,geometry=mesh.geometry;
    mesh.visible=!!near&&f.state.phase==='quake';geometry.setDrawRange(0,0);if(!mesh.visible)return;
    const radius=f.quakeRadius();if(radius<1.75)return;
    const ground=f.quakeGround(),ring=[],n=f.core,world=game.world;
    // Sample both edges. Missing ground and blocked routes leave a real break.
    for(let i=0;i<96;i++){
      const a=i*Math.PI*2/96,edge=[];
      for(const r of [radius-.54,radius+.54]){
        const x=n.x+Math.cos(a)*r,z=n.z+Math.sin(a)*r,hit=world.ray({x,y:ground+1.09,z},{x:0,y:-1,z:0},2.20);
        edge.push(hit&&world.normal(hit.x,hit.y,hit.z)[1]>.5&&f.quakeReaches(hit)?[hit.x,hit.y+.055,hit.z]:null);
      }
      ring.push(edge);
    }
    const a=geometry.attributes.position;let count=0;
    for(let i=0;i<96;i++){
      const [a0,a1]=ring[i],[b0,b1]=ring[(i+1)%96];if(!a0||!a1||!b0||!b1)continue;
      const heights=[a0[1],a1[1],b0[1],b1[1]];if(Math.max(...heights)-Math.min(...heights)>.38)continue;
      for(const p of [a0,a1,b1,a0,b1,b0]){a.setXYZ(count,...p);geometry.attributes.normal.setXYZ(count++,0,1,0);}
    }
    a.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;geometry.setDrawRange(0,count);mesh.visible=count>0;
  };
  B.View.prototype.renderForeman = function (game, time) {
    const f = game.foreman, s = f.state, n = f.core; if (!this.foremanScene) return;
    const won = s.defeated, near = n && Math.hypot(n.x - game.player.x, n.y - game.player.y, n.z - game.player.z) < 27;
    this.commonBeacon.visible = won; this.commonLight.intensity = won && game.player.y > -1 ? 1.3 : 0;
    const beam = near && ['aim', 'jet'].includes(s.phase) ? f.beam() : null,windup=['aim','quake-windup'].includes(s.phase),charge=windup?1-B.clamp(s.timer/(f.broken===3?1.25:1.65),0,1):0;
    for (const m of this.foremanModels) {
      m.root.position.set(m.node.x, m.node.y, m.node.z);
      const core=m.node===n,dead=m.node.hp<=0,open=core&&n.hp>f.healthFloor,flash=f.hitId===m.node.id?f.flash*4:0;
      m.hot.color.set(won?'#8dbb9d':dead?'#493c2e':open?'#ff993c':'#bd7546').convertSRGBToLinear();
      m.hot.emissive.copy(m.hot.color);m.hot.emissiveIntensity=flash+(dead&&!core?.02:won?.22:core&&open?1.1+charge*.7:s.active?.28+charge*.5:.09);
      if(core){
        for(const shutter of m.shutters)shutter.position.y=won?-.65:open?-.60:0;
        const aim=beam?.direction||s.aim&&new V(s.aim.x-n.x,s.aim.y-n.y-.8,s.aim.z-n.z).normalize()||new V(0,0,1);
        m.head.quaternion.setFromUnitVectors(new V(0,0,1),won?new V(0,-.48,.877).normalize():new V(aim.x,aim.y,aim.z));
        const vertical=won?-.48:aim.y;m.barrel.scale.z=vertical>.01?B.clamp((1.3-.55*Math.sqrt(1-vertical*vertical))/(vertical*1.14),1,1.5):1.5;
        m.ram.position.y=s.phase==='quake-windup'?charge*.23:0;
        m.shock.visible=s.phase==='quake-windup'||s.phase==='quake';
        for(let i=0;i<m.indicators.length;i++){
          const gauge=m.indicators[i],hp=f.nodes[i+1].hp/80;gauge.rotation.z=2.2-hp*4.4;
          const lamp=gauge.userData.lamp;lamp.material.color.set(hp?'#8aa8a0':'#eaa94b').convertSRGBToLinear();lamp.material.emissive.copy(lamp.material.color);lamp.material.emissiveIntensity=hp?.08:.9;
        }
      }else{
        const pressure=m.node.hp/80;m.needle.rotation.z=2.2-pressure*4.4;
        for(const fill of m.shutters)fill.scale.y=Math.max(.015,pressure);
        m.valve.rotation.y=(1-pressure)*Math.PI*1.3;m.split.visible=pressure<.6;
      }
      const slot = this.ghostSlots?.get('foreman:' + m.node.id); if (slot !== undefined) { const dummy = new T.Object3D(); dummy.position.copy(m.root.position); dummy.scale.setScalar(m.node.id === 100 ? 7 : 3); dummy.updateMatrix(); this.ghosts.setMatrixAt(slot, dummy.matrix); this.ghosts.instanceMatrix.needsUpdate = true; }
    }
    this.pressureLinks.forEach((mesh, i) => { const lock = f.nodes[i + 1],end=n?{x:n.x,y:n.y+.6,z:n.z}:null;mesh.visible=!!lock&&lock.hp>0&&s.active&&near&&game.world.clearLine(lock,end,.1);if(mesh.visible)this.furnaceTube(mesh,lock,end,.018); });
    this.furnaceJet.visible = !!beam; if (beam) { this.furnaceTube(this.furnaceJet, beam.from, s.phase === 'jet' && s.impact ? s.impact : beam.to, s.phase === 'jet' ? .3 : .025+charge*.025); this.furnaceJet.material.opacity = s.phase === 'jet' ? .95 : .7; }
    this.furnaceImpact.visible=!!beam?.hit&&s.phase==='aim';
    if(this.furnaceImpact.visible){const normal=new V(...game.world.normal(beam.hit.x,beam.hit.y,beam.hit.z));this.furnaceImpact.position.set(beam.hit.x,beam.hit.y,beam.hit.z).addScaledVector(normal,.03);this.furnaceImpact.quaternion.setFromUnitVectors(new V(0,0,1),normal);}
    this.renderFurnaceWave(game,near);
    this.furnaceLight.intensity = near && game.world.clearLine(game.player.head, n, .1) ? won ? .6 : s.phase === 'jet' ? 3 : .9 : 0; if (n) this.furnaceLight.position.set(n.x, n.y + 1, n.z);
    this.foundryBeam.visible = !!f.bore;
    if (f.bore) { const b = f.bore, end = { x: b.from.x + b.direction.x * b.length, y: b.from.y + b.direction.y * b.length, z: b.from.z + b.direction.z * b.length }; this.furnaceTube(this.foundryBeam, b.from, end, b.time * .25); this.foundryBeam.material.opacity = b.time; }
  };
})(B2);
