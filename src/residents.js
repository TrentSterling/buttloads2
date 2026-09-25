/* Original, articulated Ridge Common residents. Rendering never writes town state. */
'use strict';
(function(B){
  const T=THREE,V=T.Vector3;
  const material=(color,metalness=0,roughness=.85)=>new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),metalness,roughness});
  function loft(rows,sides=12,arc=Math.PI*2,start=0){
    const positions=[],indices=[],closed=Math.abs(arc-Math.PI*2)<.001,columns=closed?sides:sides+1;
    for(const [y,w,d,z=0] of rows)for(let j=0;j<columns;j++){const a=start+j/sides*arc;positions.push(Math.sin(a)*w,y,z-Math.cos(a)*d);}
    for(let r=0;r<rows.length-1;r++)for(let j=0;j<sides;j++){
      const k=(j+1)%columns,a=r*columns+j,b=r*columns+k,c=(r+1)*columns+k,d=(r+1)*columns+j;indices.push(a,d,c,a,c,b);
    }
    if(closed)for(const r of [0,rows.length-1]){
      const id=positions.length/3;positions.push(0,rows[r][0],rows[r][3]||0);
      for(let j=0;j<sides;j++){const a=r*columns+j,b=r*columns+(j+1)%sides;indices.push(...(r?[id,b,a]:[id,a,b]));}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  B.View.prototype.makeTownPerson=function(person,parent=this.townScene){
    const id=person.id,otis=id==='otis',mara=id==='mara',inez=id==='inez',nell=id==='nell';
    const root=new T.Group();root.name='resident-'+id;root.position.set(person.x,0,person.z);root.visible=!person.unlock;parent.add(root);
    const skin=material(person.skin),cheek=material(otis?'#be8b6c':mara?'#ab654d':'#9d614e'),coat=material(person.coat),cloth=material(nell?'#39475b':otis?'#40413c':'#283f3c'),leather=material('#5c4030'),boot=material('#30332e'),linen=material('#d4c3a1'),stitch=material('#aa9570'),hair=material(otis?'#716658':mara?'#362a23':inez?'#322c28':'#bac0b2'),brass=material('#b89552',.62,.4),dark=material('#222e2d'),white=material('#d8d2ba');
    const add=(group,geometry,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m;};
    const orb=(g,x,y,z,sx,sy,sz,m)=>{const n=add(g,new T.SphereGeometry(1,12,8),m,x,y,z);n.scale.set(sx,sy,sz);return n;};
    const box=(g,x,y,z,w,h,d,m)=>this.box(g,x,y,z,w,h,d,m);
    const tube=(g,points,r,m)=>add(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new V(...p))),Math.max(6,points.length*3),r,5,false),m);
    const width=otis?1.1:inez?.92:1;
    // Trousers taper into worn boots; the jacket has a waist, shoulders and collar.
    for(const side of [-1,1]){
      const x=side*.115;
      add(root,loft([[.12,.071,.086],[.4,.084,.09],[.78,.105,.113],[.89,.103,.113]]),cloth,x);
      orb(root,x,.10,-.055,.091,.097,.174,leather);box(root,x,.032,-.06,.185,.045,.33,boot);
      add(root,loft([[.14,.079,.097],[.27,.078,.09]]),leather,x);
      for(let j=0;j<3;j++)box(root,x,.15+j*.022,-.128,.1,.01,.012,stitch);
    }
    const body=new T.Group();body.position.y=.86;root.add(body);
    add(body,loft([[0,.20*width,.13],[.11,.21*width,.135],[.38,.235*width,.16],[.53,.22*width,.145],[.59,.13,.105]]),coat);
    add(body,loft([[.035,.21*width,.139],[.083,.211*width,.14]]),leather);
    box(body,0,.061,-.148,.074,.052,.018,brass);box(body,0,.061,-.161,.042,.028,.006,leather);
    if(!nell)box(body,0,.44,-.161,.082,.15,.014,linen);
    if(!nell)for(const side of [-1,1]){
      const lapel=box(body,side*.057,.48,-.146,.065,.17,.028,coat);lapel.rotation.z=side*.23;
      for(const y of [.45])orb(body,side*.021,y,-.169,.008,.008,.005,brass);
    }
    const apron=otis?leather:mara?cloth:null;
    const panel=(rows,m)=>{
      const points=[],indices=[];for(const [y,w,z] of rows)for(let i=0;i<7;i++){const u=(i-3)/3;points.push(u*w,y,z+u*u*.026);}
      for(let j=0;j<rows.length-1;j++)for(let i=0;i<6;i++){const a=j*7+i;indices.push(a,a+7,a+8,a,a+8,a+1);}
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();return add(body,geo,m);
    };
    if(apron){
      panel([[-.16,.24*width,-.169],[.03,.218*width,-.175],[.30,.177,-.201],[.43,.145,-.183]],apron);
      for(const side of [-1,1])tube(body,[[side*.14,.43,-.166],[side*.16,.57,-.08],[side*.17,.53,.12]],.016,leather);
      box(body,.015,.17,-.207,.205,.135,.014,apron);tube(body,[[-.085,.235,-.22],[.02,.22,-.224],[.115,.235,-.22]],.003,stitch);
      for(let i=0;i<3;i++){box(body,-.065+i*.047,.205,-.228,.009,.115,.01,i===1?brass:linen);}
    }
    if(inez){
      tube(body,[[.17,.58,-.045],[.07,.33,-.178],[-.17,.015,-.14]],.025,leather);
      orb(body,-.20,.08,-.025,.13,.15,.065,leather);
      for(const x of [-.13,.13]){box(body,x,.34,-.174,.13,.15,.018,cloth);box(body,x,.413,-.189,.145,.037,.025,coat);}
    }
    if(nell){
      add(body,loft([[-.47,.265,.174],[-.18,.24,.17],[.1,.22,.177],[.43,.245,.182],[.59,.16,.12]]),coat);
      for(const side of [-1,1])tube(body,[[side*.08,.55,-.112],[side*.1,.25,-.153],[side*.13,-.2,-.148],[side*.19,-.43,-.13]],.008,stitch);
      add(body,loft([[.45,.249,.197],[.53,.247,.196],[.60,.145,.134]]),linen);
      orb(body,-.1,.51,-.203,.042,.038,.018,brass);
    }
    // Two-link arms and palms with fingers. Forearms rest above the counter edge.
    const arms=[],forearms=[],hands=[];
    for(const side of [-1,1]){
      const arm=new T.Group();arm.position.set(side*.232*width,.55,0);body.add(arm);arm.rotation.x=.32;arm.rotation.z=side*.035;
      add(arm,loft([[-.265,.063,.075],[-.08,.082,.09],[.025,.073,.086]]),coat);
      add(arm,loft([[-.245,.072,.084],[-.19,.076,.088]]),linen);
      const lower=new T.Group();lower.position.y=-.26;lower.rotation.x=1.05;arm.add(lower);
      add(lower,loft([[-.205,.047,.059],[-.02,.063,.072],[.018,.061,.068]]),otis||mara?skin:coat);
      if(inez||nell)add(lower,loft([[-.212,.054,.063],[-.17,.055,.064]]),cloth);
      const hand=new T.Group();hand.position.set(0,-.223,0);lower.add(hand);
      orb(hand,0,0,0,.05,.059,.027,skin);
      for(let i=0;i<4;i++){
        const x=-.031+i*.021,length=i===0||i===3?.043:.053;
        const finger=orb(hand,x,-.045-length*.25,-.004,.012,length*.6,.014,skin);finger.rotation.x=.22;
        orb(hand,x,-.039,-.022,.008,.010,.006,skin);
      }
      const thumb=orb(hand,-side*.045,-.006,-.017,.018,.038,.018,skin);thumb.rotation.z=-side*.4;
      arms.push(arm);forearms.push(lower);hands.push(hand);
    }
    const neck=add(root,new T.CylinderGeometry(.067,.078,.13,10),skin,0,1.445,0);
    const head=new T.Group();head.position.set(0,1.622,0);root.add(head);
    const faceRows=[[-.165,.064,.075,.015],[-.125,.111,.107],[-.055,.145,.128],[.065,.151,.13,.007],[.135,.12,.104,.015],[.173,.056,.057,.02]];
    for(const row of faceRows){row[0]*=inez?1.06:nell?.96:1;row[1]*=otis?1.08:inez?.94:nell?.96:1;}
    add(head,loft(faceRows,16),skin);
    for(const side of [-1,1]){orb(head,side*.146,-.005,.001,.03,.048,.025,skin);orb(head,side*.158,-.007,-.016,.012,.029,.008,cheek);}
    const eyes=[],pupils=[];
    for(const side of [-1,1]){
      const socket=new T.Group();socket.position.set(side*.059,.032,-.125);head.add(socket);eyes.push(socket);
      orb(socket,0,0,0,.029,.013,.009,white);
      const pupil=orb(socket,0,0,-.009,.010,.011,.005,dark);pupils.push(pupil);orb(socket,-.003,.005,-.014,.003,.003,.0015,linen);
      tube(head,[[side*.031,.060,-.129],[side*.06,(mara?.070:otis?.061:.065),-.130],[side*.094,.058,-.111]],otis?.007:.0055,hair);
      tube(socket,[[-.027,.006,-.004],[0,.010,-.009],[.027,.005,-.004]],.0035,skin);
      if(inez)for(let i=0;i<3;i++)orb(head,side*(.085+i*.01),-.028+(i%2)*.009,-.104+i*.004,.0017,.0017,.0015,leather);
    }
    // A small bridge and shaped tip replace the projecting box nose.
    orb(head,0,.012,-.132,.016,.041,.024,skin);
    orb(head,0,-.025,-.156,otis?.029:.022,.018,.024,skin);
    for(const side of [-1,1])orb(head,side*.018,-.035,-.147,.011,.010,.011,skin);
    tube(head,[[-.037,-.081,-.112],[0,-.088,-.125],[.037,-.081,-.112]],.0045,leather);
    orb(head,0,-.096,-.116,.027,.006,.004,skin);
    if(otis){
      add(head,loft([[-.206,.048,.066,-.012],[-.17,.095,.103,-.01],[-.11,.127,.119],[ -.064,.128,.113,.008]],14),hair);
      for(const side of [-1,1]){const moustache=orb(head,side*.029,-.059,-.131,.041,.018,.025,hair);moustache.rotation.z=side*.13;tube(head,[[side*.074,-.112,-.102],[side*.06,-.16,-.092],[side*.031,-.187,-.073]],.0035,stitch);}
      add(head,new T.CylinderGeometry(.155,.167,.05,14),dark,0,.164,.012);
      const cap=add(head,new T.SphereGeometry(.177,14,7,0,Math.PI*2,0,Math.PI/2),cloth,0,.185,.014);cap.scale.y=.52;
      const brim=orb(head,0,.173,-.125,.179,.02,.119,dark);brim.rotation.x=-.05;
      tube(head,[[-.15,.185,-.04],[0,.20,-.155],[.15,.185,-.04]],.014,leather);
      const glass=material('#456b69',.35,.24);
      for(const x of [-.055,.055]){add(head,new T.TorusGeometry(.04,.007,6,16),brass,x,.211,-.15);orb(head,x,.211,-.152,.034,.034,.008,glass);}
      // Wrench gripped by the left hand, rather than a floating cuboid.
      const wrench=new T.Group();hands[0].add(wrench);wrench.rotation.x=-1.37;
      box(wrench,0,.04,-.014,.026,.27,.022,brass);
      const jaw=add(wrench,new T.TorusGeometry(.039,.013,5,10,Math.PI*1.5),brass,0,.18,-.014);jaw.rotation.z=-Math.PI*.25;
    }else if(mara){
      const crown=add(head,new T.SphereGeometry(.17,14,8,0,Math.PI*2,0,Math.PI*.43),hair,0,.063,.026);crown.scale.y=.85;
      orb(head,0,.078,.16,.115,.095,.077,hair);
      const band=add(head,loft([[.126,.155,.125,.015],[.165,.151,.12,.02]]),coat);band.rotation.z=-.06;
      for(const side of [-1,1]){const fold=box(head,side*.035,.077,.221,.049,.13,.02,coat);fold.rotation.z=side*.3;add(head,new T.TorusGeometry(.018,.004,5,10),brass,side*.16,-.042,-.013);}
      tube(body,[[-.067,.53,-.12],[0,.42,-.174],[.067,.53,-.12]],.004,brass);orb(body,0,.42,-.18,.016,.022,.006,brass);
    }else if(inez){
      add(head,loft([[-.13,.13,.068,.07],[.08,.156,.105,.035],[.18,.095,.068,.03]],14),hair);
      const cap=add(head,new T.CylinderGeometry(.124,.173,.13,12),coat,0,.193,.016);cap.rotation.z=.04;
      const brim=add(head,new T.CylinderGeometry(.227,.221,.025,16),leather,0,.139,-.018);brim.rotation.z=.035;
      tube(head,[[-.152,.188,-.04],[0,.194,-.155],[.152,.188,-.04]],.016,leather);
      add(head,new T.CylinderGeometry(.039,.039,.023,12),brass,0,.20,-.166).rotation.x=Math.PI/2;
      const lamp=material('#e5cf8d');lamp.emissive.set('#ffd180');lamp.emissiveIntensity=.4;orb(head,0,.20,-.181,.03,.03,.006,lamp);
      const book=new T.Group();hands[0].add(book);book.rotation.set(-1.1,.1,-.15);box(book,0,0,-.035,.17,.235,.026,leather);box(book,0,0,-.051,.145,.208,.006,linen);
      for(let i=0;i<6;i++)box(book,-.018,i*.025-.07,-.057,.075+(i%2)*.025,.0025,.002,stitch);
      box(book,0,.123,-.043,.055,.035,.02,brass);
    }else if(nell){
      const hood=coat.clone();hood.side=T.DoubleSide;
      const rows=[[-.18,.17,.145,.024],[-.05,.202,.163,.024],[.12,.205,.16,.023],[.22,.148,.119,.018],[.255,.018,.02,.012]];
      add(head,loft(rows,18,Math.PI*2-1.8,.9),hood);
      for(const side of [-1,1])tube(head,rows.map(([y,w,d,z])=>[side*Math.sin(.9)*w,y,z-Math.cos(.9)*d]),.009,linen);
      tube(head,[[-.014,.255,0],[0,.258,-.001],[.014,.255,0]],.009,linen);
      for(let i=0;i<5;i++)orb(head,.124,-.045-i*.045,.014,.026,.035,.026,hair);
      arms[1].rotation.x=.8;forearms[1].rotation.x=1.1;
      const lantern=new T.Group();hands[1].add(lantern);lantern.rotation.x=-1.9;lantern.position.z=-.012;
      add(lantern,new T.TorusGeometry(.045,.007,5,12),brass,0,-.02,0);
      const glow=material('#a4d2b7');glow.emissive.set('#a4d2b7');glow.emissiveIntensity=.6;
      add(lantern,new T.CylinderGeometry(.05,.065,.12,8),glow,0,-.16,0);
      for(const y of [-.09,-.225])add(lantern,new T.CylinderGeometry(.07,.07,.025,10),brass,0,y,0);
      for(const x of [-.058,.058])box(lantern,x,-.16,0,.009,.15,.012,brass);
    }
    for(const group of [root,body,head,...arms,...forearms,...hands]){
      const buckets=new Map();for(const mesh of [...group.children]){if(!mesh.isMesh||mesh.material.map)continue;const list=buckets.get(mesh.material)||[];list.push(mesh);buckets.set(mesh.material,list);}
      for(const [mat,meshes] of buckets){
        if(meshes.length<2)continue;const positions=[],normals=[];
        for(const mesh of meshes){mesh.updateMatrix();const geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geo.applyMatrix4(mesh.matrix);positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);geo.dispose();mesh.geometry.dispose();group.remove(mesh);}
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));add(group,geo,mat);
      }
    }
    const rest=arms.map(a=>a.rotation.clone());
    return {person,root,body,head,neck,arms,forearms,hands,eyes,pupils,rest};
  };
  B.View.prototype.animateResident=function(rig,game,time,motion){
    const p=rig.person,close=game.player.y>-2&&Math.hypot(game.player.x-p.x,game.player.z-p.z)<7;
    const offset=B.TOWN.people.findIndex(n=>n.id===p.id)*1.37,t=motion?time+offset:0;
    rig.body.rotation.z=motion?Math.sin(t*.85)*.009:0;
    rig.head.rotation.y=close?B.clamp(Math.atan2(p.x-game.player.x,p.z-game.player.z),-.6,.6):motion?Math.sin(t*.28)*.10:0;
    rig.head.rotation.z=motion?Math.sin(t*.7)*.014:0;
    rig.head.rotation.x=motion?(close?Math.sin(t*1.1)*.016:.025+Math.sin(t*.55)*.018):0;
    rig.arms.forEach((arm,i)=>{arm.rotation.copy(rig.rest[i]);if(motion)arm.rotation.x+=Math.sin(t*(close?.85:.55)+i)*.018;});
    const blink=motion&&t%5.3>5.16;rig.eyes.forEach(eye=>eye.scale.y=blink?.12:1);
    for(const pupil of rig.pupils)pupil.position.x=close?B.clamp((game.player.x-p.x)*.004,-.006,.006):0;
  };
})(B2);
