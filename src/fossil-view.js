/* Original leviathan skeleton and the lantern keeper's travelling workshop. */
'use strict';
(function(B){
  const T=THREE,V=T.Vector3;
  B.View.prototype.makeFossil=function(game){
    if(this.fossilScene){const mats=new Set();this.fossilScene.traverse(n=>{n.geometry?.dispose();if(n.material&&!Object.values(this.palette).includes(n.material))mats.add(n.material);});for(const m of mats){m.map?.dispose();m.dispose();}this.scene.remove(this.fossilScene);}
    const root=this.fossilScene=new T.Group();this.scene.add(root);
    const material=(color,metalness=0,emissive=0)=>new T.MeshStandardMaterial({color,roughness:.78,metalness,emissive:color,emissiveIntensity:emissive});
    const ivory=material('#dcc9a2'),ochre=material('#b39b77'),dark=material('#293b39'),brass=material('#c6a463',.5),blue=material('#596b92');
    const bone=this.fossilModel=new T.Group();root.add(bone);const art=B.FOSSIL_ART;
    art.bones.forEach((s,i)=>{
      const a=new V(...s.a),b=new V(...s.b),delta=b.clone().sub(a),mesh=new T.Mesh(new T.CylinderGeometry(s.r,s.r,delta.length(),8),i%4?ivory:ochre);
      mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new V(0,1,0),delta.normalize());bone.add(mesh);
    });
    const skull=new T.Mesh(new T.SphereGeometry(1,12,6),ivory);skull.position.set(...art.skull.p);skull.scale.set(...art.skull.size);bone.add(skull);
    for(const side of [-1,1]){const eye=new T.Mesh(new T.OctahedronGeometry(.1),dark);eye.position.set(3.22,.45,side*.36);bone.add(eye);}
    this.fossilPlates=art.plates.map(p=>{const m=new T.Mesh(new T.OctahedronGeometry(.13),material('#dbc688',.3,.25));m.position.set(...p);bone.add(m);return m;});
    this.fossilEmber=new T.Mesh(new T.OctahedronGeometry(.09),material('#bceacf',.2,2));this.fossilEmber.position.set(3.4,.35,0);bone.add(this.fossilEmber);
    this.fossilLight=new T.PointLight('#d6ebc4',0,8,1.6);root.add(this.fossilLight);
    const cart=this.lanternCart=new T.Group();root.add(cart);cart.position.set(-6,0,51);
    const box=(...a)=>this.box(cart,...a),cyl=(...a)=>this.cylinder(cart,...a);
    box(0,.67,0,4.5,.62,1.05,dark);box(0,1.04,-.32,4.8,.09,.8,ochre);
    for(const x of [-1.8,1.8])for(const z of [-.45,.45]){const wheel=cyl(x,.38,z,.36,.36,.13,dark,12);wheel.rotation.x=Math.PI/2;const hub=cyl(x,.38,z*1.15,.11,.11,.15,brass,8);hub.rotation.x=Math.PI/2;}
    for(const x of [-2.4,2.4])box(x,1.35,0,.15,2.7,1.4,ochre);
    box(0,2.72,-.1,5.2,.12,2.2,blue);box(0,2.64,-1.16,5.2,.28,.055,blue);
    for(let x=-2.4;x<=2.4;x+=.4)box(x,2.64,-1.2,.18,.28,.055,ivory);
    this.sign(cart,'NELL WICK / LANTERNS','THE DARK IS NOT EMPTY. LIGHT IT ANYWAY.',0,.62,-.56,3.9,.43,Math.PI,'#293b39','#e4d5ac');
    this.keeperLanterns=[];
    for(const [x,y,z] of [[-1.7,1.25,-.35],[-1.05,1.34,-.28],[1.15,1.27,-.25],[1.8,1.4,-.3],[-1.8,2.12,-.1],[1.7,2.12,-.1]]){
      const glass=material('#c6ecd0',.15,1.3);const core=cyl(x,y,z,.085,.085,.23,glass,8);this.keeperLanterns.push(core);
      for(const dy of [-.15,.15])cyl(x,y+dy,z,.14,.14,.055,brass,8);
      for(const dx of [-.11,.11])box(x+dx,y,z,.02,.3,.025,brass);
      const handle=new T.Mesh(new T.TorusGeometry(.09,.014,4,12,Math.PI),brass);handle.position.set(x,y+.19,z);cart.add(handle);
      if(y>2)box(x,2.43,z,.018,.27,.018,brass);
    }
    this.sign(cart,'LIVING LENSES','RECOVER AN EMBER / LIGHT THE MINE',0,2.26,-.18,2.5,.36,Math.PI,'#293b39','#bceacf');
    this.keeperLight=new T.PointLight('#c6ecd0',0,10,1.8);this.keeperLight.position.set(-6,2.1,50);root.add(this.keeperLight);
    this.renderFossil(game,0);this.renderer.shadowMap.needsUpdate=true;
  };
  B.View.prototype.renderFossil=function(game,time){
    const f=game.fossil;if(!f||!this.fossilScene)return;const n=f.body,s=f.state;
    this.fossilModel.visible=!!n;
    if(n){
      this.fossilModel.position.set(n.x,n.y,n.z);this.fossilEmber.visible=!s.recovered;
      this.fossilPlates.forEach((m,i)=>{const on=s.plates.includes(i);m.material.color.set(on?'#bceacf':'#dbc688');m.material.emissive.copy(m.material.color);m.material.emissiveIntensity=on?1.2:.25;});
      const p=f.point(2);this.fossilLight.position.set(p.x,p.y+.3,p.z);this.fossilLight.intensity=s.plates.length===3&&!s.recovered&&Math.hypot(n.x-game.player.x,n.y-game.player.y,n.z-game.player.z)<12&&game.world.clearLine(game.player.head,p,.05)?1.1:0;
      const slot=this.ghostSlots?.get('fossil');if(slot!==undefined){const dummy=new T.Object3D();dummy.position.set(n.x,n.y,n.z);dummy.scale.setScalar(5);dummy.updateMatrix();this.ghosts.setMatrixAt(slot,dummy.matrix);this.ghosts.instanceMatrix.needsUpdate=true;}
    }
    if(this.lanternCart.visible!==s.recovered)this.renderer.shadowMap.needsUpdate=true;
    this.lanternCart.visible=s.recovered;this.keeperLight.intensity=s.recovered&&game.player.y>-3&&Math.hypot(game.player.x+6,game.player.z-51)<14?1.5:0;
    for(const m of this.keeperLanterns)m.material.emissiveIntensity=this.settings.motion?1.3+Math.sin(time*1.2+m.position.x)*.06:1.3;
  };
})(B2);
