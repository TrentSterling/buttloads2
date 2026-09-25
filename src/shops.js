/* Authored counter scenes. Small stock sits on supported shelves behind the shopkeeper. */
'use strict';
(function(B){
  const T=THREE;
  const material=(color,metalness=0)=>new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),metalness,roughness:metalness?.5:.88});
  B.View.prototype.makeShopInterior=function(parent,b,n){
    const g=new T.Group();g.name='interior-'+b.person;parent.add(g);const otis=b.person==='otis',mara=b.person==='mara';
    const timber=material('#695242'),edge=material('#9e7e57'),dark=material('#283c39'),board=material(otis?'#3d504c':mara?'#314d45':'#566356'),linen=material('#d7c5a2'),brass=material('#ad8749',.65),iron=material('#718382',.7),red=material('#a45b43'),blue=material('#426b72');
    const box=(x,y,z,w,h,d,m)=>this.box(g,x,y,z,w,h,d,m);
    const cyl=(x,y,z,r1,r2,h,m,sides=12)=>this.cylinder(g,x,y,z,r1,r2,h,m,sides);
    const add=(geo,m,x,y,z)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;};
    const back=b.z+b.d/2-.3,z=back-.43,left=b.x-b.w/2+.5,right=b.x+b.w/2-.5;
    // Dark backboards frame the face. Cabinets and stocked shelves have a physical boundary.
    box(b.x,1.96,back-.02,b.w-.75,3.03,.12,board);
    for(let x=left;x<right;x+=.36)box(x,1.96,back-.09,.014,3.03,.012,timber);
    box(b.x,.48,back-.33,b.w-1,.82,.73,timber);
    for(let x=left+.46;x<right-.1;x+=.88){box(x,.5,back-.714,.82,.68,.022,board);box(x+.29,.57,back-.736,.036,.12,.028,brass);}
    for(const y of [.93,1.91]){
      box(b.x,y,z,b.w-.85,.065,.72,edge);box(b.x,y-.045,z-.355,b.w-.85,.055,.027,timber);
      for(const x of [left+.18,right-.18]){const brace=box(x,y-.20,back-.32,.06,.36,.07,dark);brace.rotation.x=-.6;}
    }
    this.obstacles.push([left-.1,0,back-.82,right+.1,2.65,back+.04]);
    // Counter joints and knee panels retain the original collision footprint.
    for(let i=0;i<5;i++){const x=n.x-1.94+i*.97;box(x,.50,n.z-1.154,.91,.83,.016,board);for(const side of [-1,1])box(x+side*.42,.51,n.z-1.169,.025,.75,.014,edge);}
    for(const x of [n.x-2.25,n.x+2.25])for(const y of [.17,.84])add(new T.SphereGeometry(.024,8,5),brass,x,y,n.z-1.183);
    for(let i=0;i<3;i++)box(n.x,1.092,n.z-1.10+i*.30,4.94,.006,.011,timber);
    // Practical overhead fittings replace the featureless glowing bar.
    for(const x of [b.x-2,b.x+2]){
      const y=b.h-.65;box(x,(b.h+y)/2,b.z,.025,b.h-y,.025,dark);
      cyl(x,y,b.z,.10,.31,.20,board);cyl(x,y-.107,b.z,.265,.265,.016,linen);
      const bulb=material('#efd391');bulb.emissive.set('#efbd73');bulb.emissiveIntensity=.5;cyl(x,y-.14,b.z,.07,.06,.08,bulb);
    }
    const lamp=(x,y,z,scale=1)=>{
      const lens=material('#e1c98b');lens.emissive.set('#dabb75');lens.emissiveIntensity=.16;
      cyl(x,y+.20*scale,z,.075*scale,.085*scale,.27*scale,lens,10);
      for(const dy of [.055,.35])cyl(x,y+dy*scale,z,.13*scale,.13*scale,.045*scale,brass);
      for(const dx of [-.105,.105])box(x+dx*scale,y+.2*scale,z,.018*scale,.32*scale,.026*scale,iron);
      add(new T.TorusGeometry(.09*scale,.012*scale,5,12,Math.PI),iron,x,y+.405*scale,z);
    };
    const crate=(x,y,z,w=.75)=>{
      box(x,y+.02,z,w,.05,.53,timber);
      for(const side of [-1,1]){box(x+side*(w/2-.025),y+.19,z,.05,.34,.53,edge);box(x,y+.15,z+side*.25,w,.13,.04,edge);}
    };
    if(mara){
      for(const x of [left+.65,left+1.8]){
        crate(x,.973,z);
        for(let i=0;i<4;i++){const px=x-.21+i*.14;for(const dz of [-.10,.09]){cyl(px,1.155,z+dz,.047,.047,.31,red,8);cyl(px,1.155,z+dz,.05,.05,.046,dark,8);box(px,1.34,z+dz,.012,.06,.012,linen);}}
      }
      for(let i=0;i<5;i++)lamp(b.x+.4+i*.5,.966,z,.8+(i%2)*.15);
      for(let i=0;i<3;i++){
        const x=left+.62+i*.74;box(x,2.115,z,.57,.32,.4,i%2?blue:linen);for(const dx of [-.16,.16])box(x+dx,2.115,z-.21,.06,.32,.018,timber);
        box(x,2.288,z,.64,.035,.43,edge);
      }
      for(let i=0;i<3;i++)lamp(b.x+.8+i*.74,1.945,z,1.15);
      this.sign(g,'LIGHT / CHARGES / SUPPLIES','PACK FOR THE WAY HOME',b.x,2.90,back-.15,4.1,.42,Math.PI,'#2b4039','#d9c99f');
      // A brass weighing pan and loose sample minerals make the ore service visible.
      cyl(n.x-1.50,1.18,n.z-.73,.12,.17,.15,brass);box(n.x-1.5,1.43,n.z-.73,.036,.47,.036,iron);box(n.x-1.5,1.68,n.z-.73,.67,.03,.035,brass);
      for(const dx of [-.27,.27]){box(n.x-1.5+dx,1.5,n.z-.73,.009,.34,.009,iron);cyl(n.x-1.5+dx,1.33,n.z-.73,.17,.11,.05,brass);}
      for(let i=0;i<3;i++){const rock=add(new T.DodecahedronGeometry(.06+i*.015),i%2?brass:iron,n.x-1.76+i*.12,1.15,n.z-.91);rock.scale.y=.7;}
    }else if(otis){
      // Gear stock occupies one bay; real wrenches, bits and an engine fill the others.
      for(const [i,r] of [.24,.18,.29].entries()){
        const x=left+.50+i*.58,y=1.26;
        const gear=add(new T.TorusGeometry(r,.045,6,16),iron,x,y,z);gear.rotation.x=.08;
        for(let j=0;j<12;j++){const a=j*Math.PI/6,t=box(x+Math.sin(a)*(r+.01),y+Math.cos(a)*(r+.01),z,.08,.09,.055,iron);t.rotation.z=-a;}
        cyl(x,y,z,.062,.062,.09,brass).rotation.x=Math.PI/2;
      }
      for(let i=0;i<5;i++){
        const x=b.x-.70+i*.40,length=.40+(i%3)*.10;
        box(x,2.37,z+.17,.044,length,.036,iron);
        const jaw=add(new T.TorusGeometry(.068,.018,6,12,Math.PI*1.5),iron,x,2.37+length/2,z+.17);jaw.rotation.z=-Math.PI/4;
        cyl(x,2.37-length/2,z+.17,.045,.045,.036,brass).rotation.x=Math.PI/2;
        box(x,2.45,back-.15,.035,.04,.14,brass);
      }
      for(let i=0;i<4;i++){
        const x=b.x+.9+i*.28;box(x,1.04,z,.20,.13,.36,dark);cyl(x,1.28,z,.026,.06,.4,iron,6);cyl(x,1.13,z,.065,.065,.04,brass);
      }
      const ex=right-.7;box(ex,2.06,z,.8,.20,.47,timber);
      cyl(ex,2.31,z,.20,.20,.48,iron).rotation.z=Math.PI/2;
      for(const dx of [-.25,.25])cyl(ex+dx,2.31,z,.23,.23,.045,brass).rotation.z=Math.PI/2;
      for(const dx of [-.30,-.12,.08])box(ex+dx,2.49,z,.027,.13,.36,dark);
      this.sign(g,'BELL WORKS','REPAIRS / MODIFICATIONS / FREIGHT',b.x,3.05,back-.15,4.4,.50,Math.PI,'#2b4039','#d9c99f');
      // Bench vise and disassembled rotor stay outside the conversation sight line.
      box(n.x+1.45,1.145,n.z-.65,.47,.11,.31,iron);box(n.x+1.45,1.30,n.z-.65,.30,.23,.19,board);
      for(const dx of [-.11,.11])box(n.x+1.45+dx,1.43,n.z-.65,.065,.10,.33,iron);
      cyl(n.x+1.45,1.30,n.z-.9,.025,.025,.31,brass).rotation.x=Math.PI/2;
      box(n.x+1.45,1.29,n.z-1.07,.026,.23,.026,iron);
      cyl(n.x-1.30,1.21,n.z-.7,.11,.11,.43,iron).rotation.z=Math.PI/2;
      for(const dx of [-.13,0,.13])cyl(n.x-1.30+dx,1.21,n.z-.7,.15,.15,.035,brass).rotation.z=Math.PI/2;
    }else{
      // Survey volumes, rolled maps and an original contour board.
      for(let i=0;i<12;i++){
        const x=left+.35+i*.18,h=.34+(i%4)*.055;
        box(x,1.94+h/2,z,.14,h,.34,i%3===0?blue:i%3===1?red:linen);box(x,1.97+h/2,z-.175,.012,h-.05,.008,brass);
      }
      for(let i=0;i<6;i++)cyl(right-.34-i*.21,1.24,z,.065,.065,.54,linen,10);
      for(let i=0;i<3;i++){const x=left+.6+i*.61;box(x,1.08,z,.53,.23,.43,board);box(x,1.08,z-.22,.1,.035,.012,brass);}
      box(b.x+.65,2.54,back-.17,2.3,.91,.08,timber);box(b.x+.65,2.54,back-.22,2.16,.78,.025,linen);
      for(let i=0;i<6;i++){
        const pts=[];for(let j=0;j<=30;j++){const a=j/30*Math.PI*2,r=.13+i*.067;pts.push(new T.Vector3(b.x+.65+Math.cos(a)*r*1.7,2.54+Math.sin(a)*r*.58+Math.sin(a*3)*.014,back-.239));}
        add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),50,.004,3,false),board,0,0,0);
      }
      this.sign(g,'ROOK / FIELD SURVEYS','NO TWO SEAMS ARE THE SAME',b.x,3.03,back-.15,3.9,.36,Math.PI,'#3b4b43','#dfd0a9');
      cyl(n.x+1.45,1.125,n.z-.70,.19,.19,.057,brass,16);cyl(n.x+1.45,1.16,n.z-.70,.16,.16,.014,linen,16);
      const needle=box(n.x+1.45,1.174,n.z-.70,.019,.005,.23,red);needle.rotation.y=.7;
    }
    // Glazed mug with a handle and a dark hollow, instead of a solid cylinder.
    const mx=n.x+1.90,mz=n.z-.63;cyl(mx,1.2,mz,.09,.076,.21,linen);cyl(mx,1.309,mz,.074,.074,.004,dark);
    add(new T.TorusGeometry(.052,.013,6,12),linen,mx+.093,1.22,mz).rotation.y=Math.PI/2;
    this.merge(g);
    this.shopInteriors ||= [];this.shopInteriors.push({person:b.person,root:g,bounds:[left-.1,0,back-.82,right+.1,2.65,back+.04]});
  };
})(B2);
