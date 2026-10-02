/* Constructed field equipment. Shared geometry is also used by the remote crew. */
'use strict';
(function(B){
 const T=THREE;
 const mat=(hex,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness,metalness});
 function geometry(positions,uv,indices){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
 }
 function housing(rings,steps=8){
  const positions=[],uv=[],indices=[],segments=(steps+1)*4;
  const section=([z,w,h,r,y=0],j)=>{if(j===segments)j=0;const q=Math.floor(j/(steps+1)),t=(j%(steps+1))/steps,a=(q+t)*Math.PI/2,x=(q===0||q===3?1:-1)*(w/2-r),cy=(q<2?1:-1)*(h/2-r);return[x+Math.cos(a)*r,y+cy+Math.sin(a)*r,z];};
  const perimeter=([,w,h,r],j)=>{if(j===segments)return 1;const q=Math.floor(j/(steps+1)),arc=r*Math.PI/2,length=2*(w+h-4*r)+4*arc,edges=[w-2*r,h-2*r,w-2*r,h-2*r];return(q*arc+edges.slice(0,q).reduce((a,b)=>a+b,0)+(j%(steps+1))/steps*arc)/length;};
  const low=rings[0][0],span=rings.at(-1)[0]-low;
  rings.forEach(ring=>{for(let j=0;j<=segments;j++){positions.push(...section(ring,j));uv.push(perimeter(ring,j),(ring[0]-low)/span);}});
  for(let row=0;row<rings.length-1;row++)for(let j=0;j<segments;j++){const a=row*(segments+1)+j,c=a+segments+1;indices.push(a,a+1,c,a+1,c+1,c);}
  for(const row of [0,rings.length-1]){const [z,,,r,y=0]=rings[row],base=positions.length/3;for(let j=0;j<segments;j++){positions.push(...section(rings[row],j));uv.push(.5+positions.at(-3)/rings[row][1],.5+(positions.at(-2)-y)/rings[row][2]);}const center=positions.length/3;positions.push(0,y,z);uv.push(.5,.5);for(let j=0;j<segments;j++)indices.push(center,...(row?[base+j,base+(j+1)%segments]:[base+(j+1)%segments,base+j]));}
  const g=geometry(positions,uv,indices),n=g.attributes.normal;
  for(let row=0;row<rings.length;row++){const a=row*(segments+1),b=a+segments,v=new T.Vector3().fromBufferAttribute(n,a).add(new T.Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}
  let start=rings.length*(segments+1);for(const sign of [-1,1]){for(let j=0;j<=segments;j++)n.setXYZ(start+j,0,0,sign);start+=segments+1;}return g;
 }
 function flight(side,steps=96){
  const parts=[{p:[],uv:[],i:[]},{p:[],uv:[],i:[]}];
  const point=(t,k)=>{const angle=t*Math.PI*5.4+side,z=-.058-t*.31,inner=.05-.022*(-z-.035)/.33-.001,outer=.108*(1-t*.63),thick=.004*(1-t*.45),bevel=Math.min(.004,(outer-inner)*.24),profile=[[inner,-.5],[outer-bevel,-.5],[outer,-.18],[outer,.18],[outer-bevel,.5],[inner,.5]],r=profile[k][0];return[Math.cos(angle)*r,Math.sin(angle)*r,z+profile[k][1]*thick];};
  for(let strip=0;strip<6;strip++){
   const data=parts[strip>=1&&strip<=3?1:0],base=data.p.length/3;
   for(let row=0;row<=steps;row++)for(const k of [strip,(strip+1)%6]){data.p.push(...point(row/steps,k));data.uv.push(row/steps,k/6);}
   for(let row=0;row<steps;row++){const a=base+row*2;data.i.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  for(const end of [0,1]){const data=parts[0],base=data.p.length/3;for(let k=0;k<6;k++){data.p.push(...point(end,k));data.uv.push(k/5,end);}for(let k=1;k<5;k++)data.i.push(base,...(end?[base+k+1,base+k]:[base+k,base+k+1]));}
  return{body:geometry(parts[0].p,parts[0].uv,parts[0].i),edge:geometry(parts[1].p,parts[1].uv,parts[1].i)};
 }
 // Closed turned sections retain a hard profile and smooth radial normals.
 function turned(profile,segments=24){
  const p=[],uv=[],indices=[];
  for(let row=0;row<profile.length;row++){
   const next=(row+1)%profile.length,base=p.length/3;
   for(let j=0;j<=segments;j++)for(const k of [row,next]){const [z,r]=profile[k],a=j/segments*Math.PI*2;p.push(Math.cos(a)*r,Math.sin(a)*r,z);uv.push(j/segments,k/profile.length);}
   for(let j=0;j<segments;j++){const a=base+j*2;indices.push(a,a+1,a+2,a+2,a+1,a+3);}
  }
  const g=geometry(p,uv,indices),n=g.attributes.normal;
  for(let row=0;row<profile.length;row++)for(let k=0;k<2;k++){const a=row*(segments+1)*2+k,b=a+segments*2,v=new T.Vector3().fromBufferAttribute(n,a).add(new T.Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}return g;
 }
 function bucketProfile(){
  const curve=new T.CatmullRomCurve3([[.118,-.267],[.055,-.337],[-.028,-.424],[-.082,-.536],[-.089,-.660],[-.068,-.768]].map(([y,z])=>new T.Vector3(0,y,z))),inner=[],outer=[];
  for(let i=0;i<=24;i++){const t=i/24,v=curve.getPoint(t),d=curve.getTangent(t);inner.push([v.z,v.y]);outer.push([v.z-d.y*.020,v.y+d.z*.020]);}
  return{inner,outer};
 }
 function plate(points,width){
  const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,curveSegments:1});g.rotateY(-Math.PI/2);g.translate(width/2,0,0);g.computeBoundingBox();g.computeBoundingSphere();return g;
 }
 function bucketFloor(){
  const {inner,outer}=bucketProfile(),g=plate([...inner,...outer.slice().reverse()],.50),p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++)if(Math.abs(n.getX(i))<.1)for(const [points,sign]of [[inner,1],[outer,-1]]){
   const j=points.findIndex(([z,y])=>Math.abs(p.getZ(i)-z)<1e-6&&Math.abs(p.getY(i)-y)<1e-6);if(j<0)continue;
   const a=inner[Math.max(0,j-1)],b=inner[Math.min(24,j+1)],normal=new T.Vector3(0,-(b[0]-a[0]),b[1]-a[1]).normalize().multiplyScalar(sign);
   if(normal.dot(new T.Vector3().fromBufferAttribute(n,i))>.5)n.setXYZ(i,normal.x,normal.y,normal.z);
  }return g;
 }
 function bucketRib(){const {outer}=bucketProfile();return plate([...outer,...outer.map(([z,y])=>[z,y-.016]).reverse()],.018);}
 function bucketCheek(){const {outer}=bucketProfile();return plate([[-.267,.118],[-.300,.132],[-.411,.102],[-.574,.052],[-.718,-.023],...outer.slice().reverse()],.018);}
 function coil(){
  const p=[],uv=[],indices=[],steps=144,profile=[[.092,-.006],[.104,-.006],[.104,.006],[.092,.006]];
  const point=(t,k)=>{const a=t*Math.PI*10,[r,d]=profile[k];return[Math.cos(a)*r,Math.sin(a)*r,-.286-t*.225+d];};
  for(let k=0;k<4;k++){const base=p.length/3;for(let i=0;i<=steps;i++)for(const side of [k,(k+1)%4]){p.push(...point(i/steps,side));uv.push(i/steps,side/4);}for(let i=0;i<steps;i++){const a=base+i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}
  for(const end of [0,1]){const base=p.length/3;for(let k=0;k<4;k++){p.push(...point(end,k));uv.push(k/3,end);}indices.push(base,...(end?[base+2,base+1]:[base+1,base+2]),base,...(end?[base+3,base+2]:[base+2,base+3]));}return geometry(p,uv,indices);
 }
 B.ToolArt={housing,flight,turned,bucketFloor,bucketRib,bucketCheek,coil};
 function paintFinish(material){
  const canvas=document.createElement('canvas'),rough=document.createElement('canvas');canvas.width=canvas.height=rough.width=rough.height=256;
  const c=canvas.getContext('2d'),r=rough.getContext('2d'),random=B.random(845712);c.fillStyle='#bc8d35';c.fillRect(0,0,256,256);r.fillStyle='#eeeeee';r.fillRect(0,0,256,256);
  for(let i=0;i<1600;i++){const x=random()*256,y=random()*256,size=.3+random()*.8;c.fillStyle=i%2?'rgba(255,239,182,.06)':'rgba(74,50,22,.05)';c.fillRect(x,y,size,size);}
  for(let i=0;i<70;i++){const x=random()*256,y=random()*256;c.strokeStyle='rgba(239,216,154,.19)';c.lineWidth=.35+random()*.4;c.beginPath();c.moveTo(x,y);c.lineTo(x+1+random()*5,y+random()*1.5);c.stroke();}
  for(let i=0;i<160;i++){const x=random()*256,y=(i%2?30:224)+(random()-.5)*18,w=.5+random()*2.5,h=.3+random()*1.2;c.fillStyle=i%3?'#8c8e7e':'#655d48';c.fillRect(x,y,w,h);r.fillStyle='#777777';r.fillRect(x,y,w,h);}
  material.color.setRGB(1,1,1);material.map=new T.CanvasTexture(canvas);material.map.encoding=T.sRGBEncoding;material.roughnessMap=new T.CanvasTexture(rough);
  for(const texture of [material.map,material.roughnessMap]){texture.anisotropy=4;texture.wrapS=T.RepeatWrapping;texture.wrapT=T.ClampToEdgeWrapping;}
  material.userData.toolPaint={seed:845712,size:256,channels:['albedo','roughness']};
 }
 function kit(view){
  if(view.artToolKit)return view.artToolKit;
  const p={paint:mat('#bc8d35',.73,.12),iron:mat('#344441',.76,.32),steel:mat('#88938f',.39,.56),edge:mat('#bac0b3',.3,.61),copper:mat('#a4774e',.62,.48),rubber:mat('#292e2b',.98),leather:mat('#655039',.91),cloth:mat('#837c61',.99),wood:mat('#886340',.92),glass:mat('#334f53',.24,.3)};
  paintFinish(p.paint);
  const add=(g,geo,m,x=0,y=0,z=0)=>{const n=new T.Mesh(geo,m);n.position.set(x,y,z);n.castShadow=n.receiveShadow=true;g.add(n);return n;};
  const block=(g,m,x,y,z,w,h,d,r=.008)=>add(g,B.WorkshopShapes.bevel(w,h,d,r),m,x,y,z);
  const tube=(g,m,points,r=.008)=>add(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),Math.max(12,points.length*5),r,8,false),m);
  const barrel=(g,m,x,y,z,r,h,axis='z')=>{const n=add(g,new T.CylinderGeometry(r,r,h,24),m,x,y,z);n.rotation[axis==='z'?'x':'z']=Math.PI/2;return n;};
  const bolt=(g,x,y,z,axis='z',r=.007)=>barrel(g,p.steel,x,y,z,r,.008,axis);
  const clear=g=>{g.traverse(n=>n.geometry?.dispose());g.clear();};
  const hand=(g,x,y,z)=>{
   const h=new T.Group();h.position.set(x,y,z);h.userData.viewmodelOnly=true;g.add(h);
   block(h,p.leather,0,-.025,0,.124,.123,.11,.023);
   for(let i=0;i<4;i++){const finger=add(h,new T.SphereGeometry(1,12,8),p.leather,-.039+i*.026,-.046,-.059);finger.scale.set(.013,.043,.023);block(h,p.rubber,-.039+i*.026,-.018,-.080,.019,.024,.013,.005);}
   const thumb=add(h,new T.SphereGeometry(1,12,8),p.leather,.067,.009,-.021);thumb.scale.set(.024,.045,.022);thumb.rotation.z=-.55;
   barrel(h,p.rubber,0,-.04,.10,.067,.058);const sleeve=add(h,B.WorkshopShapes.loft([[0,.068,.066],[.08,.09,.086],[.30,.101,.095],[.43,.117,.11]],16),p.cloth,0,-.04,.12);sleeve.rotation.x=Math.PI/2;
   barrel(h,p.leather,0,-.04,.16,.093,.035);return h;
  };
  return view.artToolKit={p,add,block,tube,barrel,bolt,clear,hand};
 }
 B.View.prototype.makeFieldCutter=function(){
  const {p,add,block,tube,barrel,bolt,hand}=kit(this),g=this.tool;
  add(g,housing([[-.197,.184,.162,.040],[-.173,.216,.194,.048],[-.130,.254,.215,.051],[-.098,.272,.229,.056],[.078,.272,.229,.056],[.112,.241,.199,.046],[.140,.217,.179,.042]].map(r=>[...r,.006])),p.iron);
  add(g,housing([[-.145,.238,.198,.049],[-.127,.265,.223,.055],[-.095,.286,.235,.058],[.072,.286,.235,.058],[.101,.270,.221,.054],[.113,.253,.209,.050]].map(r=>[...r,.006])),p.paint);
  add(g,housing([[.103,.282,.239,.058,.006],[.126,.261,.222,.052,.006],[.150,.237,.200,.047,.006]]),p.iron);
  add(g,housing([[-.205,.190,.167,.041],[-.186,.228,.197,.049],[-.150,.270,.228,.056],[-.125,.274,.232,.057]].map(r=>[...r,.006])),p.iron);
  for(const side of [-1,1]){
   block(g,p.iron,side*.144,.004,0,.011,.138,.151,.011);
   for(let i=0;i<5;i++){block(g,p.rubber,side*.152,-.012,-.052+i*.027,.005,.068,.012,.002);const louvre=block(g,p.iron,side*.156,.010,-.054+i*.027,.006,.065,.010,.002);louvre.rotation.x=-.16;}
   for(const y of [-.051,.059])for(const z of [-.059,.059])bolt(g,side*.153,y,z,'x',.006);
   block(g,p.paint,side*.150,.061,0,.006,.010,.12,.003);
  }
  block(g,p.iron,0,-.149,.08,.095,.12,.093,.014);
  const grip=block(g,p.rubber,0,-.232,.096,.103,.174,.119,.024);grip.rotation.x=-.12;
  for(let i=0;i<5;i++)block(g,p.iron,0,-.166-i*.033,.162,.107,.012,.014,.003);
  block(g,p.iron,0,-.322,.09,.155,.084,.204,.015);block(g,p.copper,0,-.342,.165,.127,.019,.028,.004);
  tube(g,p.iron,[[-.08,-.088,.10],[-.12,-.135,.126],[-.114,-.215,.134],[-.049,-.25,.133]],.007);
  block(g,p.copper,.052,-.135,.148,.021,.05,.025,.006);
  const dialCanvas=document.createElement('canvas');dialCanvas.width=dialCanvas.height=256;const c=dialCanvas.getContext('2d');c.fillStyle='#d9d4bc';c.fillRect(0,0,256,256);c.strokeStyle='#3b4742';c.lineWidth=4;
  for(let i=0;i<=20;i++){const a=-2.3+i*.23,outer=112,inner=i%5?98:88;c.beginPath();c.moveTo(128+Math.sin(a)*inner,128-Math.cos(a)*inner);c.lineTo(128+Math.sin(a)*outer,128-Math.cos(a)*outer);c.stroke();}
  c.fillStyle='#39433b';c.textAlign='center';c.font='bold 21px monospace';c.fillText('BELL',128,179);c.font='14px monospace';c.fillText('TORQUE / 02',128,198);
  const map=new T.CanvasTexture(dialCanvas);map.encoding=T.sRGBEncoding;add(g,new T.CircleGeometry(.056,40),new T.MeshStandardMaterial({map,roughness:.78}),0,.033,.155);
  barrel(g,p.iron,0,.033,.136,.064,.025);add(g,new T.TorusGeometry(.058,.005,10,40),p.steel,0,.033,.157);
  this.needle=block(g,mat('#a34330'),.004,.047,.160,.004,.037,.002,.001);add(g,new T.SphereGeometry(.005,10,6),p.copper,0,.033,.162);
  for(const x of [-.095,.095])for(const y of [-.069,.083])bolt(g,x,y,.155);
  this.sign(g,'BELL WORKS','FIELD EQUIPMENT',0,-.064,.155,.12,.034,0,'#35443d','#d0be91');
  block(g,p.iron,0,.135,-.035,.082,.027,.113,.009);block(g,p.copper,0,.15,-.025,.045,.008,.045,.003);
  tube(g,p.rubber,[[-.098,-.075,.045],[-.192,-.22,.06],[-.175,-.36,-.071],[-.093,-.088,-.144]],.012);
  this.rotor=new T.Group();this.rotor.position.z=-.218;g.add(this.rotor);
  barrel(this.rotor,p.iron,0,0,.014,.078,.075);barrel(this.rotor,p.steel,0,0,-.033,.064,.064);
  const shaft=add(this.rotor,new T.CylinderGeometry(.028,.05,.33,24),p.steel,0,0,-.20);shaft.rotation.x=-Math.PI/2;
  // Closed flights share smooth lengthwise normals. A separate bevel uses the
  // existing edge material; rigid merging retains the animated rotor itself.
  for(const side of [0,Math.PI]){
   const shapes=flight(side);add(this.rotor,shapes.body,p.steel);add(this.rotor,shapes.edge,p.edge);
  }
  const tip=add(this.rotor,new T.ConeGeometry(.033,.06,12),p.edge,0,0,-.388);tip.rotation.x=-Math.PI/2;
  this.firstPersonHand=hand(g,0,-.209,.113);
 };
 const make=B.View.prototype.makeTool;B.View.prototype.makeTool=function(){make.call(this);kit(this).clear(this.tool);this.makeFieldCutter();};
 B.View.prototype.makeToolFinish=function(){};
 const expedition=B.View.prototype.makeExpedition;B.View.prototype.makeExpedition=function(exp){
  expedition.call(this,exp);if(this.magicTool.userData.authored)return;
  const {p,add,block,tube,barrel,bolt,clear,hand}=kit(this);clear(this.resonatorHead);
  const resonatorGlow=new T.MeshStandardMaterial({color:'#bba4d0',emissive:'#977bc8',emissiveIntensity:.55,roughness:.3,metalness:.25});
  add(this.resonatorHead,turned([[-.251,.067],[-.274,.080],[-.488,.080],[-.527,.065],[-.527,.055],[-.251,.055]]),p.glass);
  add(this.resonatorHead,coil(),p.copper);
  for(const z of [-.272,-.518])add(this.resonatorHead,turned([[z+.009,.090],[z+.005,.111],[z-.005,.111],[z-.009,.090],[z-.005,.084],[z+.005,.084]]),resonatorGlow);
  add(this.resonatorHead,turned([[-.522,.090],[-.531,.119],[-.556,.119],[-.565,.101],[-.565,.081],[-.522,.081]]),p.iron);
  for(let i=0;i<3;i++){
   const angle=i*Math.PI*2/3+.52,x=Math.cos(angle)*.115,y=Math.sin(angle)*.115;
   const rail=add(this.resonatorHead,new T.BoxGeometry(.026,.029,.264),p.iron,x,y,-.397);rail.rotation.z=angle;
   for(const z of [-.284,-.521]){const pin=add(this.resonatorHead,new T.CylinderGeometry(.008,.008,.012,8),p.steel,x*1.12,y*1.12,z);pin.rotation.z=angle-Math.PI/2;}
  }
  barrel(this.resonatorHead,p.glass,0,0,-.550,.074,.014);clear(this.magicTool);
  this.magicCore=add(this.magicTool,new T.IcosahedronGeometry(.087,1),new T.MeshStandardMaterial({color:new T.Color('#6da99a').convertSRGBToLinear(),emissive:new T.Color('#53a48c').convertSRGBToLinear(),emissiveIntensity:.45,roughness:.35,metalness:.25}),0,.012,0);
  const rings=[];for(let i=0;i<3;i++){const ring=add(this.magicTool,new T.TorusGeometry(.158+i*.016,.009,10,44),p.copper);ring.rotation.set(i*.8,.7,i);rings.push(ring);}
  for(const side of [-1,1]){
   tube(this.magicTool,p.iron,[[side*.053,-.18,.015],[side*.143,-.09,.025],[side*.166,.038,0],[side*.114,.133,-.025]],.021);
   barrel(this.magicTool,p.steel,side*.153,-.035,.017,.028,.035,'x');
  }
  block(this.magicTool,p.iron,0,-.168,.037,.107,.063,.094,.015);hand(this.magicTool,0,-.238,.056);this.magicTool.scale.setScalar(.85);this.magicTool.userData.authored=true;
 };
 const combat=B.View.prototype.makeCombat;B.View.prototype.makeCombat=function(game){
  combat.call(this,game);if(this.axeTool.userData.authored)return;const {p,add,block,tube,bolt,clear,hand}=kit(this),g=this.axeTool;clear(g);
  add(g,B.WorkshopShapes.loft([[-.46,.028,.035,0,-.035],[-.34,.034,.032,0,-.029],[-.14,.03,.029,0,-.013],[.12,.025,.028,0,.009],[.29,.028,.031,0,.019]],16),p.wood);
  for(let i=0;i<9;i++)block(g,p.leather,-.02,-.205+i*.021,.003,.074,.013,.079,.005);
  const outline=new T.Shape();outline.moveTo(-.139,.27);outline.lineTo(-.13,.17);outline.lineTo(.015,.178);outline.quadraticCurveTo(.15,.13,.27,.096);outline.quadraticCurveTo(.307,.219,.26,.356);outline.quadraticCurveTo(.157,.291,.041,.295);outline.closePath();
  const blade=add(g,new T.ExtrudeGeometry(outline,{depth:.059,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:3,curveSegments:14}),p.iron,0,0,-.029);
  tube(g,p.edge,[[.274,.104,0],[.292,.219,0],[.262,.348,0]],.008);block(g,p.steel,.01,.238,.039,.079,.139,.018,.014);for(const y of [.206,.268])bolt(g,.012,y,.053);
  block(g,p.copper,-.116,.222,0,.069,.093,.094,.014);hand(g,-.013,-.131,.022);g.scale.setScalar(.73);g.userData.authored=true;
 };
 const kinetics=B.View.prototype.makeKinetics;B.View.prototype.makeKinetics=function(game){
  kinetics.call(this,game);if(this.slingTool.userData.authored)return;const {p,add,block,tube,barrel,bolt,clear,hand}=kit(this),g=this.slingTool;clear(g);
  block(g,p.iron,0,-.079,.01,.12,.235,.151,.021);block(g,p.leather,0,-.113,.024,.132,.121,.156,.022);
  block(g,p.iron,0,.057,-.042,.271,.132,.284,.025);block(g,p.copper,0,.113,-.082,.249,.043,.24,.011);
  this.slingForks=[];for(const side of [-1,1]){
   const fork=new T.Group();fork.position.set(side*.159,.065,-.151);g.add(fork);this.slingForks.push(fork);
   tube(fork,p.copper,[[0,-.05,.027],[side*.042,.108,-.044],[side*.008,.224,-.073],[-side*.055,.25,-.079]],.027);
   tube(fork,p.steel,[[0,-.026,.04],[side*.019,.11,-.014],[0,.217,-.041]],.012);bolt(fork,side*.012,.211,-.083);
  }
  this.slingToolCore=add(g,new T.IcosahedronGeometry(.059,1),new T.MeshStandardMaterial({color:new T.Color('#8aba9e').convertSRGBToLinear(),emissive:new T.Color('#639c8b').convertSRGBToLinear(),emissiveIntensity:.6,metalness:.3,roughness:.3}),0,.125,-.172);
  barrel(g,p.steel,0,.056,.125,.036,.016);tube(g,p.rubber,[[-.108,.08,.073],[-.12,-.12,.078],[.02,-.22,.089],[.101,.079,.032]],.009);hand(g,0,-.119,.022);g.scale.setScalar(.85);g.userData.authored=true;
  // Keep animated heads, needles and field cores separate. Every other rigid
  // part shares a material batch, including the first-person glove.
  const keep=new Set([this.needle,this.magicCore,this.slingToolCore]);
  for(const root of [this.tool,this.magicTool,this.axeTool,this.slingTool]){
   root.traverse(n=>{
    if(!n.isGroup)return;
    // The previous equipment merge enabled shadows on combined parts. Keep
    // that appearance when the indexed merger preserves render-state flags.
    const batches=new Map();for(const mesh of n.children)if(mesh.isMesh&&!keep.has(mesh)){const list=batches.get(mesh.material)||[];list.push(mesh);batches.set(mesh.material,list);}
    for(const list of batches.values())if(list.length>1)for(const mesh of list)mesh.castShadow=mesh.receiveShadow=true;
    B.WorkshopShapes.mergeRigid(n,keep);
   });
  }
 };
 const mining=B.View.prototype.makeMiningTools;B.View.prototype.makeMiningTools=function(){
  mining.call(this);const {p,add}=kit(this);
  for(const x of [-.17,0,.17])add(this.scoopHead,bucketRib(),p.iron,x);
  for(const side of [-1,1])for(const [y,z]of [[.08,-.30],[-.016,-.47],[-.061,-.66]]){const pin=add(this.scoopHead,new T.CylinderGeometry(.010,.010,.010,8),p.steel,side*.267,y,z);pin.rotation.z=Math.PI/2;}
 };
 const renderCombat=B.View.prototype.renderCombat;B.View.prototype.renderCombat=function(game,time){renderCombat.call(this,game,time);if(game.expedition.state.tool==='axe')this.axeTool.position.x-=.12;};
})(B2);
