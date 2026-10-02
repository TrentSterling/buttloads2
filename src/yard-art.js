/* Ridge depot: timber construction, sheet metal, working equipment and stored supplies. */
'use strict';
(function(B){
 const T=THREE;
 function surface(base,kind){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);let seed=78211;
  const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2600;i++){x.fillStyle=kind==='wood'?(i%3?'rgba(225,217,184,.025)':'rgba(29,36,29,.035)'):(i%3?'rgba(225,217,184,.07)':'rgba(29,36,29,.08)');const px=rnd()*512,py=rnd()*512;x.fillRect(px,py,kind==='wood'?1:1+rnd()*4,kind==='wood'?15+rnd()*110:1+rnd()*3);}
  if(kind==='metal')for(let i=0;i<46;i++){const px=rnd()*512,py=rnd()*512;x.fillStyle='rgba(83,48,29,.30)';x.fillRect(px,py,2+rnd()*14,1+rnd()*17);x.fillStyle='rgba(203,187,143,.20)';x.fillRect(px+1,py+1,1+rnd()*5,1);}
  if(kind==='wood')for(let i=0;i<14;i++){x.strokeStyle='rgba(35,31,22,.065)';x.lineWidth=1;const px=rnd()*512;x.beginPath();x.moveTo(px,0);x.bezierCurveTo(px+15,170,px-12,350,px+7,512);x.stroke();}
  const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;return map;
 }
 B.View.prototype.makeSalvageYard=function(g){
  const tex={wood:surface('#a59779','wood'),metal:surface('#aaa38e','metal'),floor:surface('#a7a28f','stone')};
  const mat=(hex,roughness=.86,metalness=0,map=null)=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness,metalness,map,bumpMap:map,bumpScale:map?.014:0});
  const p={wood:mat('#a69676',.96,0,tex.wood),board:mat('#c2b292',.93,0,tex.wood),cream:mat('#e1d0a8',.91),green:mat('#849589',.94,.05,tex.metal),iron:mat('#59685f',.73,.32),steel:mat('#9b9b83',.49,.48),rust:mat('#855a3e',.93,.1,tex.metal),roof:mat('#98a89e',.85,.18,tex.metal),yellow:mat('#b79043',.85,.08,tex.metal),dark:mat('#293632',.99),stone:mat('#8c8b77',.98,0,tex.floor),rubber:mat('#363b32',.99),copper:mat('#95734f',.78,.35),red:mat('#996847',.9,0,tex.metal),glass:mat('#adc5bc',.49)};
  Object.assign(p.glass,{transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide});
  p.wood.bumpScale=p.board.bumpScale=.0025;
  p.stone.map=p.stone.bumpMap=null;B.TERRAIN_LOOK.apply(p.stone);
  const add=(geo,m,x=0,y=0,z=0)=>{const n=new T.Mesh(geo,m);n.position.set(x,y,z);n.castShadow=n.receiveShadow=true;g.add(n);return n;};
  const box=(x,y,z,w,h,d,m,r=.012)=>{
   const geo=B.WorkshopShapes.bevel(w,h,d,r);
   if(m===p.wood||m===p.board){const pos=geo.attributes.position,normal=geo.attributes.normal,uv=geo.attributes.uv,dims=[w,h,d];for(let i=0;i<pos.count;i++){const n=[Math.abs(normal.getX(i)),Math.abs(normal.getY(i)),Math.abs(normal.getZ(i))],skip=n.indexOf(Math.max(...n)),axes=[0,1,2].filter(a=>a!==skip).sort((a,b)=>dims[a]-dims[b]),v=[pos.getX(i),pos.getY(i),pos.getZ(i)];uv.setXY(i,v[axes[0]]/.42+.5,v[axes[1]]/2.7+.5);}}
   return add(geo,m,x,y,z);
  };
  const beam=(a,b,w,d,m)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av),o=box(...av.add(bv).multiplyScalar(.5).toArray(),w,delta.length(),d,m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;};
  const wire=(points,r,m)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),Math.max(12,points.length*6),r,8,false),m);
  const cyl=(x,y,z,r,h,m,axis='y',sides=20)=>{const n=add(new T.CylinderGeometry(r,r,h,sides),m,x,y,z);if(axis!=='y')n.rotation[axis==='z'?'x':'z']=Math.PI/2;return n;};
  const bolt=(x,y,z,axis='z')=>cyl(x,y,z,.033,.018,p.steel,axis,6);
  const sign=(text,sub,x,y,z,w,h,bg='#d0c09b',fg='#36483f')=>this.sign(g,text,sub,x,y,z,w,h,Math.PI,bg,fg);
  // Weatherboards, recessed work bay and a real lean-to roof with fascia and exposed rafters.
  box(-4,1.9,22.4,15,3.8,.20,p.dark);
  for(let row=0;row<17;row++){
   const y=.15+row*.218;
   if(y>.93&&y<2.64){box(-11.395,y,20.07,.11,.205,.10,p.green,.006);box(-5.035,y,20.07,8.05,.205,.10,row%5?p.green:p.roof,.006);}
   else box(-6.23,y,20.07,10.44,.205,.10,row%5?p.green:p.roof,.006);
   box(2.7,y,20.07,1.8,.205,.10,row%4?p.green:p.roof,.006);
   for(const x of [-11.51,3.51])box(x,y,21.29,.12,.205,2.6,p.green,.006);
  }
  for(const x of [-11.55,-1.06,1.79,3.55])box(x,1.96,19.95,.145,3.91,.16,p.board);
  box(.38,3.14,19.91,2.92,.22,.24,p.wood);
  for(const x of [-.83,.37,1.57])box(x,3.17,21.06,.10,.14,2.17,p.wood);box(.36,.18,21.08,2.65,.23,2.23,p.stone);
  const roofY=z=>3.67+(z-16.13)*.145;
  for(let i=0;i<32;i++){
   const x=-12.02+i*.515,glazed=x>-.96&&x<1.63||x>-8.68&&x<-6.61,sections=glazed?[[16.005,18.15],[20.95,22.675]]:[[16.005,22.675]];
   for(const [a,b]of sections){const z=(a+b)/2,o=box(x,roofY(z),z,.521,.055,b-a,p.roof,.004);o.rotation.x=-.144;for(const dx of [-.246,.246])beam([x+dx,roofY(a),a],[x+dx,roofY(b),b],.028,.054,p.roof);}
  }
  // Glazing leaves actual sun openings; frame and rafters still cast their own shadows.
  for(const [x,w]of [[.34,2.575],[-7.65,2.06]]){
   const pane=add(new T.PlaneGeometry(w,2.83),p.glass,x,roofY(19.55)+.024,19.55);pane.rotation.x=-Math.PI/2-.144;pane.castShadow=false;
   for(const side of [-1,1]){const edge=x+side*w/2;beam([edge,roofY(18.15)+.05,18.15],[edge,roofY(20.95)+.05,20.95],.055,.075,p.iron);}
   for(const z of [18.15,19.55,20.95])box(x,roofY(z)+.035,z,w+.10,.055,.055,p.iron,.004);
  }
  for(const z of [16.1,22.65])box(-4,roofY(z)-.09,z,16.58,.19,.12,p.board);
  for(const x of [-12.3,4.3])beam([x,roofY(16.1)-.05,16.1],[x,roofY(22.65)-.05,22.65],.14,.21,p.board);
  for(const x of [-11.4,-9.78,-3.5,.45,3.4]){
   beam([x,3.52,16.23],[x,4.42,22.42],.12,.22,p.wood);
   if(x===-9.78||x===.45)continue;
   box(x,1.76,16.35,.17,3.48,.18,p.wood);box(x,.12,16.35,.29,.23,.33,p.stone);box(x,.35,16.35,.19,.12,.205,p.iron);
   for(const side of [-1,1])beam([x,2.90,16.35],[x+side*.55,3.57,16.35],.085,.10,p.wood);
   for(const y of [.39,3.17])bolt(x,y,16.24);
   this.obstacles.push([x-.16,0,16.19,x+.16,3.5,16.51]);
  }
  // Rain gutter, brackets and downpipe are separate construction.
  cyl(-4,3.58,16.02,.071,16.56,p.iron,'x');for(const x of [-11,-7,-3,1,3])box(x,3.55,16.05,.047,.11,.14,p.steel);
  wire([[3.5,3.59,16.05],[3.82,3.51,16.16],[3.82,2.85,16.39],[3.82,.23,16.39],[4.04,.13,16.52]],.05,p.iron);
  // A framed sign with a painted border, hung from the framing rather than on an empty slab.
  box(-4.4,3.18,19.84,5.22,.99,.12,p.wood);sign('BUTTLOADS','RIDGE COMMON / SALVAGE & SUPPLY',-4.4,3.18,19.765,5.05,.86);
  for(const x of [-6.98,-1.82])for(const y of [2.75,3.59])bolt(x,y,19.755);
  sign('02','CLAIM OFFICE',-10.23,2.96,19.89,1.1,.59,'#46584c','#d5c59c');
  // A deep stock hatch breaks the blank facade. Everything stays inside the depot body.
  box(-10.2,1.75,20.66,2.19,1.68,.08,p.dark);box(-10.2,.91,20.34,2.30,.09,.78,p.board);
  box(-10.2,2.63,20.36,2.21,.075,.76,p.wood);for(const x of [-11.27,-9.13])box(x,1.75,20.36,.065,1.70,.71,p.green);
  for(const x of [-11.34,-9.06])box(x,1.74,20.02,.11,1.75,.20,p.board);
  box(-10.2,2.61,20.02,2.39,.10,.20,p.board);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const labelInk=labelCanvas.getContext('2d');labelInk.fillStyle='#d9ccb0';labelInk.fillRect(0,0,512,128);labelInk.fillStyle='#34443a';labelInk.textAlign='center';labelInk.textBaseline='middle';labelInk.font='700 22px Arial';
  for(const [i,name]of ['NUTS','BOLTS','SEALS','SPRINGS','BITS','BEARINGS','CABLE','FUSES'].entries())labelInk.fillText(name,64+(i%4)*128,32+Math.floor(i/4)*64,116);
  const labelMap=new T.CanvasTexture(labelCanvas);labelMap.encoding=T.sRGBEncoding;labelMap.anisotropy=4;p.labels=new T.MeshStandardMaterial({map:labelMap,roughness:.9,emissiveMap:labelMap,emissive:'#ffffff',emissiveIntensity:.12});
  for(const y of [1.42,2.02]){
   box(-10.2,y,20.4,2.16,.055,.54,p.wood);
   for(let j=0;j<4;j++){
    const x=-10.98+j*.50;box(x,y+.17,20.45,.38,.29,.35,j%2?p.red:p.green);box(x,y+.15,20.265,.20,.075,.012,p.cream,.003);box(x,y+.10,20.242,.09,.018,.018,p.iron,.003);
    const index=(y===2.02?0:4)+j,geo=new T.PlaneGeometry(.194,.069),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(index%4+uv.getX(i))/4,(1-Math.floor(index/4)+uv.getY(i))/2);add(geo,p.labels,x,y+.15,20.256).rotation.y=Math.PI;
   }
  }
  box(-10.9,1.08,20.18,.37,.18,.34,p.rust);
  for(const [x,r]of [[-10.43,.105],[-10.09,.077]]){add(B.WorkshopShapes.loft([[0,r,r],[.033,r,r],[.047,r*.84,r*.84],[.135,r*.72,r*.72],[.155,r*.42,r*.42],[.187,r*.42,r*.42]],20),p.steel,x,.965,20.24);add(new T.TorusGeometry(r*.31,.008,6,16),p.iron,x,1.17,20.24);}
  // Hopper: sloping steel cheeks, a supported throat, toothed grate and an ore pile.
  const hopperX=-7,hopperZ=17.72;
  for(const x of [-8.65,-5.35])for(const z of [16.91,18.55]){box(x,.43,z,.11,.78,.13,p.iron);box(x,.09,z,.24,.08,.25,p.steel);}
  const hopperGeo=new T.BufferGeometry(),v=[],q=(a,b,c,d)=>v.push(...a,...b,...c,...a,...c,...d);
  const bottom=[[-1.33,.53,-.61],[1.33,.53,-.61],[1.33,.53,.61],[-1.33,.53,.61]],top=[[-2.02,1.22,-1.09],[2.02,1.22,-1.09],[2.02,1.22,1.09],[-2.02,1.22,1.09]];
  for(let i=0;i<4;i++)q(bottom[i],bottom[(i+1)%4],top[(i+1)%4],top[i]);hopperGeo.setAttribute('position',new T.Float32BufferAttribute(v,3));hopperGeo.computeVertexNormals();const hopperMat=p.yellow.clone();hopperMat.side=T.DoubleSide;add(hopperGeo,hopperMat,hopperX,0,hopperZ);
  box(-7,.48,17.72,2.62,.18,1.23,p.dark);for(const z of [16.59,18.85])box(-7,1.23,z,4.13,.10,.10,p.iron);
  for(const x of [-9.05,-4.95])box(x,1.23,17.72,.10,.10,2.28,p.iron);
  for(let i=0;i<14;i++)box(-8.88+i*.289,1.257,17.72,.025,.049,2.16,p.steel,.003);
  for(const x of [-8.74,-8.23,-7.72,-7.21,-6.70,-6.19,-5.68,-5.17])bolt(x,1.08,16.78);
  for(let i=0;i<16;i++){const a=i*2.399,r=(i%4)*.21,n=add(new T.DodecahedronGeometry(.13+(i%3)*.04,0),i%3?p.stone:p.copper,-7+Math.cos(a)*r,.96+Math.floor(i/6)*.06,17.72+Math.sin(a)*r);n.scale.set(1.5,.65,1);}
  box(-7,1.0,16.73,1.88,.28,.013,p.dark,.004);sign('ORE / 02','',-7,1.0,16.715,1.72,.22,'#424b38','#d0b476');
  for(const x of [-8.18,-5.82])box(x,1.62,18.84,.043,.74,.07,p.iron);sign('SELL YOUR HAUL','E / WEIGH & SELL',-7,1.94,18.73,2.63,.44,'#d0c09b','#374f45');
  // Workshop bench has legs, drawer fronts, a vice, spare cutters and a stocked pegboard.
  for(const x of [-1.30,1.30])for(const z of [16.99,18.24])box(x,.7,z,.11,1.31,.12,p.iron);
  box(0,1.44,17.59,3.21,.10,1.69,p.wood);box(0,.25,17.7,2.81,.065,1.34,p.iron);
  for(const x of [-.82,0,.82]){box(x,1.22,17.63,.78,.28,1.27,p.green);box(x,1.22,16.977,.67,.205,.019,p.iron);box(x,1.23,16.947,.27,.023,.037,p.steel);}
  box(-1.03,1.63,17.52,.31,.24,.26,p.iron);box(-.97,1.77,17.52,.41,.073,.29,p.steel);cyl(-1.04,1.65,17.28,.028,.31,p.steel,'z');cyl(-1.04,1.65,17.10,.015,.19,p.steel,'x');
  box(.17,1.49,17.44,.74,.029,.61,p.rubber);for(const x of [-.05,.13,.31]){cyl(x,1.54,17.46,.032,.39,p.steel,'z');cyl(x,1.54,17.63,.047,.039,p.iron,'z');}
  box(.93,1.63,17.87,.54,.29,.30,p.red);box(.93,1.77,17.87,.57,.048,.325,p.iron);wire([[.76,1.79,17.88],[.79,1.85,17.88],[1.07,1.85,17.88],[1.1,1.79,17.88]],.014,p.steel);
  box(.37,2.01,21.85,2.57,1.35,.095,p.board);
  for(let row=0;row<7;row++)for(let col=0;col<13;col++)cyl(-.78+col*.19,1.48+row*.17,21.795,.014,.008,p.dark,'z',8);
  // Five distinct silhouettes: open spanner, claw hammer, pliers, hand brace and hacksaw.
  box(-.60,2.13,21.72,.044,.34,.025,p.steel,.006);
  const jawShape=new T.Shape();for(const [i,point]of [[-.08,.095],[-.115,.045],[-.10,-.075],[-.055,-.10],[.055,-.10],[.10,-.075],[.115,.045],[.08,.095],[.05,.025],[-.05,.025]].entries())i?jawShape.lineTo(...point):jawShape.moveTo(...point);jawShape.closePath();add(new T.ExtrudeGeometry(jawShape,{depth:.025,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,steps:1}),p.steel,-.60,2.34,21.70);
  cyl(-.60,1.94,21.72,.029,.034,p.steel,'z',12);
  box(-.12,2.10,21.72,.038,.40,.041,p.wood,.006);box(-.17,2.34,21.72,.19,.071,.060,p.steel,.008);
  for(const dy of [-.02,.02])beam([-.06,2.34+dy,21.72],[.02,2.38+dy*.5,21.72],.025,.03,p.steel);
  for(const side of [-1,1]){beam([.35,2.13,21.70],[.35+side*.062,1.91,21.70],.033,.038,p.red);beam([.35,2.13,21.70],[.35+side*.049,2.29,21.70],.026,.026,p.steel);}bolt(.35,2.13,21.67);
  wire([[.77,1.92,21.72],[.77,2.05,21.72],[.91,2.12,21.72],[.91,2.28,21.72],[.77,2.34,21.72]],.016,p.steel);cyl(.91,2.12,21.72,.032,.13,p.wood);cyl(.77,2.37,21.72,.049,.035,p.wood);
  beam([1.14,2.05,21.72],[1.23,2.33,21.72],.025,.034,p.iron);beam([1.23,2.33,21.72],[1.50,2.33,21.72],.025,.034,p.iron);beam([1.50,2.33,21.72],[1.56,2.05,21.72],.025,.034,p.iron);box(1.35,2.05,21.72,.43,.016,.012,p.steel,.003);box(1.15,2.02,21.72,.06,.15,.049,p.red,.006);
  for(const y of [.65,1.06,2.88]){
   box(.37,y,21.37,2.51,.063,.54,p.wood);
   for(let j=0;j<6;j++){
    const x=-.62+j*.35;
    if(y===2.88&&j===1){cyl(x,y+.135,21.45,.092,.20,p.red);cyl(x,y+.245,21.45,.028,.025,p.steel);wire([[x,y+.245,21.45],[x+.09,y+.28,21.44]],.012,p.steel);}
    else if(y===2.88&&j===3){const roll=cyl(x,y+.11,21.44,.082,.29,p.cream,'x',12);roll.rotation.y=.11;cyl(x-.147,y+.11,21.425,.031,.008,p.dark,'x',12);}
    else if(y===2.88&&j===5){for(let coil=0;coil<3;coil++)add(new T.TorusGeometry(.093,.012,6,16),p.rubber,x,y+.11,21.40+coil*.02);}
    else{const height=y===1.06&&j%3===0?.29:.22;box(x,y+height/2+.025,21.45,.24,height,.32,j%2?p.green:p.red);box(x,y+height/2+.025,21.276,.10,.044,.013,p.cream);}
   }
  }
  sign('GEAR & RECOVERY','E / FIELD WORKSHOP',0,.94,16.924,1.63,.31);
  for(const x of [-8,-4,.5]){
   wire([[x,3.63,18.73],[x,3.33,18.73]],.009,p.rubber);const shade=add(new T.ConeGeometry(.19,.15,24,1,true),p.iron,x,3.3,18.73);shade.rotation.x=Math.PI;
   const bulb=add(new T.SphereGeometry(.063,12,8),new T.MeshStandardMaterial({color:'#dcc8a2',emissive:'#ffcd8b',emissiveIntensity:.9}),x,3.245,18.73);
  }
  const workLight=new T.PointLight('#ffe1a5',1.8,6,1.7);workLight.position.set(.5,2.62,20.85);g.add(workLight);
  // Pallets, barrels, bundled timber, stacked sacks and split boards stay behind the service apron.
  const pallet=(x,y,z)=>{for(const dx of [-.5,0,.5])box(x+dx,y+.09,z,.12,.18,1.24,p.wood);for(let i=0;i<6;i++)box(x,y+.205,z-.5+i*.2,1.35,.075,.15,p.board);};
  for(const x of [5.6,7]){
   pallet(x,0,19.5);const barrel=add(B.WorkshopShapes.loft([[.25,.45,.45],[.29,.51,.51],[.44,.53,.53],[1.3,.53,.53],[1.46,.49,.49],[1.5,.45,.45]],24),p.red,x,0,19.5);
   for(const y of [.35,.64,1.16,1.43])cyl(x,y,19.5,.538,.048,p.iron);cyl(x,1.5,19.5,.46,.012,p.rust);cyl(x+.18,1.514,19.62,.06,.014,p.steel);sign('BELL','TOOL OIL',x,.94,18.948,.50,.32,'#a18355','#434737');
  }
  for(let row=0;row<3;row++){pallet(-14.05,row*.59,19.6);for(let i=0;i<4;i++){const sack=add(new T.SphereGeometry(1,12,8),p.board,-14.53+(i%2)*.83,row*.59+.47,19.27+Math.floor(i/2)*.6);sack.scale.set(.46,.23,.34);sack.rotation.y=.12*(i-1);}}
  for(let i=0;i<8;i++){const x=-16.3+(i%3)*.34,z=18.56+(i%2)*.2,board=box(x,.58+Math.floor(i/3)*.27,z,.25,.22,3.1,p.wood);board.rotation.y=-.18;}
  // Jointed paving with drain channels and wear, clear of the diggable claim.
  for(let col=0;col<15;col++)for(let row=0;row<3;row++)box(-17.98+col*2.57,.031,16.75+row*1.61,2.55,.015,1.59,p.stone,.003);
  for(let i=0;i<27;i++){box(-10.65+i*.55,.047,15.98,.035,.014,.26,p.dark,.001);}
  // Crane headframe: paired channels, gussets, cross braces, access ladder and a supported winch.
  for(const x of [8.5,12]){
   box(x,.12,15.5,.65,.23,.68,p.stone);box(x,.27,15.5,.44,.11,.47,p.iron);
   for(const dx of [-.105,.105])box(x+dx,4.02,15.5,.07,7.51,.38,p.yellow);
   box(x,4.02,15.63,.25,7.51,.057,p.yellow);
   for(const y of [.48,4.25,7.7]){box(x,y,15.28,.42,.25,.03,p.iron);for(const dx of [-.15,.15])bolt(x+dx,y,15.25);}
  }
  for(const y of [3.98,7.7])box(10.25,y,15.5,3.58,.22,.33,p.iron);
  beam([8.57,.58,15.53],[11.93,3.97,15.53],.10,.10,p.iron);beam([11.93,.58,15.54],[8.57,3.97,15.54],.10,.10,p.iron);
  beam([8.56,4.05,15.53],[11.93,7.70,15.53],.1,.1,p.iron);beam([11.93,4.05,15.54],[8.56,7.70,15.54],.1,.1,p.iron);
  for(const x of [12.43,12.99])cyl(x,3.61,15.49,.034,7.05,p.iron);for(let i=0;i<25;i++)cyl(12.71,.32+i*.282,15.47,.018,.62,p.steel,'x');
  cyl(10.25,7.56,15.5,.33,.26,p.steel,'z');for(const z of [15.32,15.68])cyl(10.25,7.56,z,.38,.035,p.iron,'z');
  wire([[10.25,7.82,15.51],[10.56,7.61,15.51],[10.56,5.77,15.51]],.020,p.rubber);cyl(10.56,5.56,15.51,.13,.28,p.iron);
  const hook=add(new T.TorusGeometry(.11,.025,8,24,Math.PI*1.68),p.steel,10.56,5.38,15.51);hook.rotation.z=-.63;
  box(10.25,.47,16.25,1.76,.55,.93,p.iron);cyl(10.25,.96,16.25,.35,1.36,p.steel,'x');for(const x of [9.48,11.02])cyl(x,.96,16.25,.43,.071,p.yellow,'x');
  for(let i=0;i<18;i++)cyl(9.65+i*.071,.96,16.25,.369,.028,p.rubber,'x');wire([[10.25,.96,15.87],[10.25,3.95,15.65],[10.25,7.50,15.16]],.017,p.rubber);
  sign('CLAIM 02','KEEP GOING DOWN',10.25,3.18,15.29,2.45,.61,'#c6b68d','#364e43');
  this.yardArt=g;this.yardArtMaterials=p;
 };
 B.View.prototype.makeGroundArt=function(){
  const g=new T.Group();this.scene.add(g);const rng=B.random(835218);
  const mat=(hex)=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness:1});
  const stone=mat('#8d8c70'),lichen=mat('#969877'),wood=mat('#67573d'),cut=mat('#a4946e');
  const add=(geo,m,x,y,z)=>{const n=new T.Mesh(geo,m);n.position.set(x,y,z);n.castShadow=n.receiveShadow=true;g.add(n);return n;};
  // Outcrops and low shrubs frame the claim while the working ground remains excavatable.
  for(const [cx,cz]of [[-18.8,-12],[-18.9,9],[12.4,-18.9],[22,-13],[-27,19]]){
   for(let j=0;j<5;j++){
    const x=cx+(rng()-.5)*2.7,z=cz+(rng()-.5)*2.7,y=B.COMMON.height(x,z),r=.30+rng()*.55;
    const rock=add(new T.DodecahedronGeometry(r,1),j%3?stone:lichen,x,y+r*.36,z);rock.scale.set(1.5,.60,1.06);rock.rotation.set(rng()*.22,rng()*6,rng()*.12);
    this.obstacles.push([x-r*1.28,y,z-r*.83,x+r*1.28,y+r*.79,z+r*.83]);
   }
  }
  // Broken timber beside the supply pallets, with visible cut ends.
  for(let j=0;j<3;j++){
   const log=add(new T.CylinderGeometry(.13,.17,2.3,14),wood,-18.2,.25+j*.16,20.4+j*.35);log.rotation.z=Math.PI/2;log.rotation.y=.21;
   for(const side of [-1,1]){const end=add(new T.CircleGeometry(side>0?.13:.17,14),cut,-18.2+side*1.124,.25+j*.16,20.4+j*.35-side*.24);end.rotation.y=side*Math.PI/2+.21;}
  }
  this.merge(g);
  // Slim bent blades share the native construction used in the common meadow.
  const blades=B.GrassShapes.buffer(),shades=['#587850','#718859','#918759'].map(h=>new T.Color(h).convertSRGBToLinear());
  for(let i=0;i<660;i++){
   const x=(rng()-.5)*60,z=(rng()-.5)*62;
   if(!B.COMMON.planting(x,z,.12)||Math.abs(x)<15.8&&Math.abs(z)<15.8)continue;
   const count=4+Math.floor(rng()*5);
   for(let j=0;j<count;j++){
    const a=rng()*6.28,h=.10+rng()*.26,lean=.03+rng()*.13,w=.013+rng()*.018,col=shades[(i+j)%3];
    if(j<Math.ceil(count*.6))B.GrassShapes.blade(blades,x,z,a,h,w*.5,lean,col,i*.41+j);
   }
  }
  const geo=B.GrassShapes.geometry(blades);
  const leaf=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});this.yardTufts=new T.Mesh(geo,leaf);this.yardTufts.receiveShadow=true;this.scene.add(this.yardTufts);
 };
})(B2);
