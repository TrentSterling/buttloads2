/* Mechanical attachments and contact marks, rendered entirely in the game. */
'use strict';
(function (B) {
  const T = THREE;
  B.View.prototype.makeMiningTools = function () {
    const p = this.palette;
    for (const root of [this.scoopHead, this.lanceHead]) { root.traverse(n => n.geometry?.dispose()); root.clear(); }
    const steel = new T.MeshStandardMaterial({ color: '#a3b5b4', metalness: .72, roughness: .37 });
    const edge = new T.MeshStandardMaterial({ color: '#d1d5bf', metalness: .8, roughness: .23 });
    const bronze = new T.MeshStandardMaterial({ color: '#bd8442', metalness: .6, roughness: .42 });
    const add = (root, geometry, material, x, y, z) => { const m = new T.Mesh(geometry, material); m.position.set(x, y, z); root.add(m); return m; };
    // Formed bucket: a curved back and floor, closed side cheeks and replaceable teeth.
    const section = [[.12,-.28],[.05,-.37],[-.065,-.48],[-.10,-.62],[-.075,-.77]], verts = [];
    const quad = (a,b,c,d) => verts.push(...a,...b,...c,...a,...c,...d);
    for (let i=0;i<section.length-1;i++) {
      const [y,z]=section[i],[ny,nz]=section[i+1];
      quad([-.27,y,z],[.27,y,z],[.27,ny,nz],[-.27,ny,nz]);
      quad([-.27,ny-.025,nz],[.27,ny-.025,nz],[.27,y-.025,z],[-.27,y-.025,z]);
      for(const x of [-.27,.27])quad([x,y,z],[x,y-.025,z],[x,ny-.025,nz],[x,ny,nz]);
    }
    for(const i of [0,section.length-1]) {const [y,z]=section[i];quad([-.27,y,z],[-.27,y-.025,z],[.27,y-.025,z],[.27,y,z]);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();
    // The bucket interior is visible from above, so both faces must be drawable.
    steel.side=T.DoubleSide;add(this.scoopHead,geo,steel,0,0,0);
    for(const x of [-.268,.248]) {
      const shape=new T.Shape();shape.moveTo(-.28,.12);shape.lineTo(-.72,.055);for(let i=section.length-1;i>=0;i--)shape.lineTo(section[i][1],section[i][0]);shape.closePath();
      const cheek=add(this.scoopHead,new T.ExtrudeGeometry(shape,{depth:.02,bevelEnabled:false}),steel,x,0,0);cheek.rotation.y=-Math.PI/2;
      // Extrusion rotation maps local profile X to tool Z.
      this.box(this.scoopHead,x,0,-.37,.036,.065,.3,p.metal);
      add(this.scoopHead,new T.CylinderGeometry(.045,.045,.038,12),bronze,x,.045,-.33).rotation.z=Math.PI/2;
    }
    for(let i=0;i<6;i++){
      const tooth=add(this.scoopHead,new T.BoxGeometry(.06,.035,.16),edge,-.225+i*.09,-.07,-.8);tooth.rotation.x=-.08;
      this.box(this.scoopHead,-.225+i*.09,-.093,-.70,.034,.026,.15,p.metal);
    }
    const barrel=(root,z,r,length,material)=>{const m=add(root,new T.CylinderGeometry(r,r,length,12),material,0,0,z);m.rotation.x=Math.PI/2;return m;};
    barrel(this.lanceHead,-.36,.11,.24,p.metal);barrel(this.lanceHead,-.48,.092,.15,steel);
    for(let i=0;i<4;i++)barrel(this.lanceHead,-.31-i*.052,.12,.017,bronze);
    this.lanceStriker=new T.Group();this.lanceHead.add(this.lanceStriker);
    barrel(this.lanceStriker,-.64,.042,.37,edge);barrel(this.lanceStriker,-.60,.07,.045,bronze);
    const tip=add(this.lanceStriker,new T.ConeGeometry(.045,.19,4),edge,0,0,-.89);tip.rotation.x=-Math.PI/2;
    for(const x of [-.086,.086])this.box(this.lanceHead,x,-.035,-.57,.017,.026,.31,p.steel);
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
