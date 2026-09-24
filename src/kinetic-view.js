/* An old mineral-launching bench, its recovered gauntlet and a visible holding field. */
'use strict';
(function(B){
  const T=THREE;
  B.View.prototype.makeKinetics=function(game){
    if(this.kineticScene){const materials=new Set();this.kineticScene.traverse(n=>{n.geometry?.dispose();if(n.material)materials.add(n.material);});for(const m of materials){m.map?.dispose();m.dispose();}this.scene.remove(this.kineticScene);}
    const scene=this.kineticScene=new T.Group();this.scene.add(scene);
    const mat=(color,glow=0)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:glow,metalness:.65,roughness:.52});
    const iron=mat('#263a3b'),steel=mat('#84938d'),copper=mat('#ba875a'),dark=mat('#142020');
    const root=this.workshopModel=new T.Group();scene.add(root);this.workshopCoils=[];
    this.box(root,0,-1.04,0,4.2,.32,1.5,iron);
    for(const x of [-1.8,1.8]){this.box(root,x,-.08,-.42,.22,1.92,.25,steel);this.box(root,x,-.51,.42,.24,1,.25,iron);}
    this.box(root,0,.93,-.42,4.15,.3,.3,iron);this.box(root,0,-.41,.14,3.92,.18,1.12,copper);
    this.box(root,0,-.65,.22,1.36,.43,.8,iron);
    this.box(root,0,-.17,.43,.95,.34,.32,dark);
    this.sign(root,'STONEWRIGHT','RESONATE BOTH FIELD COILS',0,.9,-.245,2.6,.3,0,'#243838','#d9c397');
    for(let i=0;i<2;i++){
      const coil=new T.Group();coil.position.set(i?1.55:-1.55,.48,.45);root.add(coil);
      const glow=mat('#edac6d',.2),ring=new T.Mesh(new T.TorusGeometry(.36,.075,6,24),copper);coil.add(ring);
      const core=new T.Mesh(new T.IcosahedronGeometry(.22,1),glow);coil.add(core);
      for(let j=0;j<4;j++){const tab=this.box(coil,0,0,-.05,.08,.88,.12,iron);tab.rotation.z=j*Math.PI/4;}
      this.workshopCoils.push({coil,core,glow});
      this.box(root,i?.78:-.78,-.01,.42,1.12,.055,.055,copper);
    }
    const prize=this.slingPrize=new T.Group();root.add(prize);
    this.box(prize,0,.05,.34,.23,.45,.24,steel);
    for(const x of [-.32,.32]){const fork=this.box(prize,x,.28,.34,.1,.43,.14,copper);fork.rotation.z=x>0?-.24:.24;}
    this.workshopLight=new T.PointLight('#9cdece',0,10,1.8);scene.add(this.workshopLight);
    const field=this.slingField=new T.Group();scene.add(field);
    for(let i=0;i<2;i++){const ring=new T.Mesh(new T.TorusGeometry(.5,.012,5,36),new T.MeshBasicMaterial({color:'#a0f6db',transparent:true,opacity:.65,depthWrite:false}));ring.rotation.x=i*Math.PI/2;field.add(ring);}
    if(!this.slingTool){
      const tool=this.slingTool=new T.Group();this.toolScene.add(tool);
      this.box(tool,0,-.11,0,.15,.29,.19,this.palette.dark);
      this.box(tool,0,.04,-.06,.32,.18,.35,this.palette.steel);
      this.slingForks=[];
      for(const side of [-1,1]){const fork=new T.Group();fork.position.set(side*.17,.04,-.16);tool.add(fork);this.box(fork,0,.09,-.045,.08,.33,.12,this.palette.yellow);this.box(fork,-side*.045,.24,-.045,.13,.06,.12,this.palette.steel);this.slingForks.push(fork);}
      const core=this.slingToolCore=new T.Mesh(new T.IcosahedronGeometry(.063,1),new T.MeshStandardMaterial({color:'#a0f6db',emissive:'#73caaa',emissiveIntensity:1.2,metalness:.35,roughness:.25}));core.position.set(0,.12,-.16);tool.add(core);
    }
    this.renderKinetics(game,0);
  };
  B.View.prototype.renderKinetics=function(game,time){
    const k=game.kinetics;if(!k || !this.kineticScene)return;
    const n=k.bench,s=k.state;this.workshopModel.visible=!!n;
    if(n){
      this.workshopModel.position.set(n.x,n.y,n.z);this.slingPrize.visible=!s.unlocked;
      this.workshopCoils.forEach((m,i)=>{const charged=s.coils.includes(i);m.glow.color.set(charged?'#a4e9cb':'#df9867');m.glow.emissive.copy(m.glow.color);m.glow.emissiveIntensity=charged?1.6:.12;m.core.rotation.y=charged && this.settings.motion?time*.65:0;});
      const p={x:n.x,y:n.y+.4,z:n.z+.8};this.workshopLight.position.set(p.x,p.y,p.z);
      this.workshopLight.intensity=s.coils.length && Math.hypot(p.x-game.player.x,p.y-game.player.head.y,p.z-game.player.z)<12 && game.world.clearLine(game.player.head,p,.05)?1.5:0;
      const slot=this.ghostSlots?.get('stonewright');if(slot!==undefined){const dummy=new T.Object3D();dummy.position.set(n.x,n.y,n.z);dummy.scale.setScalar(4);dummy.updateMatrix();this.ghosts.setMatrixAt(slot,dummy.matrix);this.ghosts.instanceMatrix.needsUpdate=true;}
    }
    const held=s.held===null?null:k.ore.nodes[s.held];this.slingField.visible=!!held;
    if(held){this.slingField.position.set(held.x,held.y,held.z);this.slingField.scale.setScalar(Math.max(.6,held.radius*2.8));this.slingField.rotation.set(this.settings.motion?time*.6:0,this.settings.motion?time*.9:0,0);for(const ring of this.slingField.children)ring.material.color.set(k.obstruction?'#efbd71':'#a0f6db');}
    const equipped=game.expedition.state.tool==='sling';this.slingTool.visible=equipped;
    if(equipped){this.tool.visible=this.magicTool.visible=this.axeTool.visible=false;this.slingTool.position.set(.37,-.22,-.72);this.slingTool.rotation.set(0,-.22,0);this.slingForks.forEach((f,i)=>f.rotation.z=(i?1:-1)*s.charge*.18);this.slingToolCore.material.emissiveIntensity=.5+s.charge*2;}
  };
})(B2);
