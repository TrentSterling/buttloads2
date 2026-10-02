/* Mechanical attachments and contact marks, rendered entirely in the game. */
'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeMiningTools = function () {
    for (const root of [this.scoopHead, this.lanceHead]) { root.traverse(n => n.geometry?.dispose()); root.clear(); }
    const art=this.artToolKit.p,steel=art.steel,edge=art.edge,bronze=art.copper,A=B.ToolArt;
    const add = (root, geometry, material, x, y, z) => { const m = new T.Mesh(geometry, material); m.position.set(x, y, z); root.add(m); return m; };
    add(this.scoopHead,A.bucketFloor(),steel,0,0,0);
    for(const x of [-.254,.254]) {
      add(this.scoopHead,A.bucketCheek(),steel,x,0,0);
      this.box(this.scoopHead,x,.01,-.31,.033,.053,.15,art.iron);
      add(this.scoopHead,new T.CylinderGeometry(.034,.034,.030,16),bronze,x,.056,-.317).rotation.z=Math.PI/2;
    }
    for(let i=0;i<6;i++){
      const x=-.210+i*.084;
      add(this.scoopHead,A.housing([[-.875,.040,.012,.003,-.077],[-.852,.050,.025,.004,-.074],[-.783,.060,.041,.005,-.070],[-.726,.056,.037,.005,-.072]],1),edge,x,0,0);
      this.box(this.scoopHead,x,-.085,-.735,.046,.020,.095,art.iron);
    }
    add(this.lanceHead,A.turned([[-.245,.073],[-.260,.103],[-.284,.110],[-.430,.110],[-.480,.085],[-.550,.070],[-.556,.049],[-.245,.049]]),steel,0,0,0);
    for(const [z,r]of [[-.287,.115],[-.429,.112]])add(this.lanceHead,A.turned([[z+.012,r-.008],[z+.008,r],[z-.008,r],[z-.012,r-.008],[z-.012,r-.015],[z+.012,r-.015]]),bronze,0,0,0);
    this.lanceStriker=new T.Group();this.lanceHead.add(this.lanceStriker);
    add(this.lanceStriker,A.turned([[-.485,.039],[-.741,.039],[-.782,.034],[-.940,.005],[-.965,.002],[-.965,.001],[-.485,.001]]),edge,0,0,0);
    add(this.lanceStriker,A.turned([[-.555,.043],[-.565,.062],[-.593,.062],[-.600,.048],[-.600,.040],[-.555,.040]]),bronze,0,0,0);
    for(const x of [-.091,.091])this.box(this.lanceHead,x,-.025,-.513,.018,.036,.20,art.iron);
    this.miningMarks=new T.Group();this.scene.add(this.miningMarks);this.miningTicks=[];
    for(let i=0;i<8;i++) {
      const material=new T.MeshBasicMaterial({color:'#ffe1a1',transparent:true,opacity:.6,depthWrite:false});
      const mesh=add(this.miningMarks,new T.BoxGeometry(.075,.012,.012),material,0,0,0);this.miningTicks.push(mesh);
    }
  };
  B.View.prototype.renderMining = function (game, dt) {
    const f=game.mining;if(!f||!this.miningMarks)return;
    const mode=game.expedition.state.tool, moving=this.settings.motion && game.running;
    this.miningMarks.visible=game.running&&!game.input.aim&&!!f.preview;
    for(let i=0;i<8;i++) {
      const tick=this.miningTicks[i],c=f.contacts[i];tick.visible=!!c;
      if(!c)continue;
      tick.position.set(c.x+c.normal[0]*.025,c.y+c.normal[1]*.025,c.z+c.normal[2]*.025);
      tick.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...c.normal).normalize());
      tick.material.color.set(c.protected?'#e56e56':f.wasCutting?'#fff4c9':'#d4b980');tick.material.opacity=f.wasCutting?.85:.4;
    }
    // Tool motion stays in the viewmodel; player aim and the world camera never move.
    if(!B.CUT_SHAPES[mode])return;
    if(moving)this.rotor.rotation.z+=dt*(1+f.rev*(36-12*f.load));
    this.scoopHead.rotation.x=moving?Math.sin(f.stroke*Math.PI*2)*.14*f.rev:0;
    this.scoopHead.position.z=moving?Math.sin(f.stroke*Math.PI*2)*.035*f.rev:0;
    this.lanceStriker.position.z=moving?(1-Math.pow(1-f.stroke,3))*.065*f.rev:0;
    if(moving){
      const recoil=mode==='scoop'?Math.sin(f.stroke*Math.PI*2)*.014:mode==='lance'?f.beat*.022:f.load*.003*Math.sin(f.phase*11);
      this.tool.position.z+=recoil;this.tool.position.y-=f.load*(mode==='scoop'?.012:.004);
    }
    this.needle.rotation.z=.7-f.rev*.75-f.load*.6;
  };
})(B2);
