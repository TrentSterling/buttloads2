/* Original chamber silhouettes and machinery. Geometry follows existing support. */
'use strict';
(function(B){
 const T=THREE,V=T.Vector3;
 const material=(hex,metalness=0,glow=0)=>{const color=new T.Color(hex).convertSRGBToLinear();return new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:glow,metalness,roughness:metalness?.54:.88});};
 function helpers(view,root){
  const add=(geo,m,x=0,y=0,z=0)=>{const n=new T.Mesh(geo,m);n.position.set(x,y,z);n.castShadow=n.receiveShadow=true;root.add(n);return n;};
  return {add,box:(...a)=>view.box(root,...a),cyl:(...a)=>view.cylinder(root,...a),tube:(points,r,m,sides=6)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new V(...p))),Math.max(8,points.length*5),r,sides,false),m)};
 }
 B.View.prototype.makeSurveyCabinet=function(node,network){
  const root=new T.Group(),{box,cyl,add,tube}=helpers(this,root),iron=material('#324842',.3),brass=material('#ab8952',.5),paper=material('#9e9b78'),ink=material('#425951'),black=material('#1b272a'),linen=material('#c5b799');
  box(0,-.065,.015,.87,.98,.54,iron);box(0,-.10,-.266,.72,.72,.035,black);box(0,-.10,-.29,.66,.66,.018,paper);
  for(const x of [-.385,.385]){box(x,-.08,-.285,.035,.89,.035,brass);for(const y of [-.43,.31])cyl(x,y,-.311,.022,.022,.013,brass,6).rotation.x=Math.PI/2;}
  for(const y of [-.44,.24])box(0,y,-.303,.7,.022,.022,brass);
  for(let j=0;j<4;j++){const pts=[];for(let i=0;i<=22;i++){const a=i/22*Math.PI*2;pts.push([Math.cos(a)*(.09+j*.046)+Math.sin(a*3)*.012,-.095+Math.sin(a)*(.07+j*.043),-.307]);}tube(pts,.003,ink,3);}
  if(network){const pts=network.nodes.map(n=>[(n.x-network.chamber.x)*.073,-.1+(n.z-network.chamber.z)*.063,-.312]);pts.push(pts[0]);tube(pts,.006,brass,4);}
  for(const x of [-.34,.34])box(x,-.525,.02,.15,.09,.54,black);
  cyl(.335,-.03,.04,.068,.068,.66,linen,10);cyl(.335,.312,.04,.037,.037,.025,black,10);
  for(const y of [-.27,.23])box(.33,y,-.03,.12,.03,.035,brass);
  box(0,.45,0,.91,.065,.6,iron);box(0,.49,-.18,.61,.025,.2,brass);
  const lampGroup=new T.Group();root.add(lampGroup);const lens=this.box(lampGroup,0,.525,-.22,.51,.075,.075,material('#ffe0a0',0,.06));
  for(const x of [-.28,0,.28])box(x,.529,-.272,.015,.1,.024,iron);
  box(0,.566,-.20,.61,.025,.2,iron);box(0,.325,-.281,.36,.10,.022,black);
  for(let i=0;i<=node.id;i++)box((i-node.id/2)*.045,.325,-.296,.016,.055,.006,brass);
  this.merge(root);return {root,lens,node};
 };
 B.View.prototype.makeStationMachine=function(node){
  const root=new T.Group(),{box,cyl,add,tube}=helpers(this,root),iron=material('#263d3c',.5),steel=material('#6c8580',.65),brass=material('#bd8e4b',.62),copper=material('#a66647',.55),ceramic=material('#bcb898'),dark=material('#142b2d'),paint=material(['#626f45','#894839','#53697b'][node.id],.25);
  box(0,-.91,0,2.13,.24,1.7,iron);for(const x of [-.91,.91])for(const z of [-.69,.69])cyl(x,-.767,z,.055,.055,.04,brass,6);
  const wheel=new T.Group();root.add(wheel);
  const wheelR=node.id===0?.33:node.id===1?.17:.25;
  wheel.position.set(node.id===0?-.39:node.id===1?.73:0,node.id===0?-.07:node.id===1?-.42:.07,-.75);
  wheel.add(new T.Mesh(new T.TorusGeometry(wheelR,.035,7,24),brass));
  for(let i=0;i<6;i++){const spoke=this.box(wheel,0,0,0,.025,wheelR*1.8,.03,brass);spoke.rotation.z=i*Math.PI/3;}
  const gauge=(x,y,z,r)=>{cyl(x,y,z,r,r,.07,brass,20).rotation.x=Math.PI/2;cyl(x,y,z-.04,r*.84,r*.84,.015,ceramic,20).rotation.x=Math.PI/2;
   for(let i=0;i<9;i++){const a=-2.1+i*.52,t=box(x+Math.sin(a)*r*.68,y+Math.cos(a)*r*.68,z-.052,.012,r*.16,.008,dark);t.rotation.z=-a;}
   const needle=box(x+r*.16,y+r*.16,z-.06,.012,r*.62,.008,copper);needle.rotation.z=-.65;
  };
  if(node.id===0){
   root.userData.machine='pump';
   cyl(-.39,-.03,-.1,.55,.55,1.12,paint,24).rotation.x=Math.PI/2;
   for(const z of [-.66,.42]){const ring=add(new T.TorusGeometry(.51,.065,7,24),iron,-.39,-.03,z);}
   cyl(-.39,-.03,-.693,.25,.25,.06,steel,18).rotation.x=Math.PI/2;
   tube([[-.39,-.5,.18],[-.39,-.68,.18],[.56,-.68,.18],[.84,-.45,.18],[.84,.52,.18]],.105,copper,10);
   cyl(.49,-.08,.13,.28,.28,.99,iron,16);for(let j=0;j<9;j++)cyl(.49,-.5+j*.105,.13,.32,.32,.027,steel,16);
   gauge(.52,.60,-.19,.20);box(-.4,.73,.12,.76,.12,.57,paint);box(-.4,.59,.12,.35,.23,.36,iron);
  }else if(node.id===1){
   root.userData.machine='exchange';
   for(const x of [-.48,.48]){
    cyl(x,-.1,.12,.19,.19,1.22,iron,14);for(const y of [-.72,.56])cyl(x,y,.12,.29,.29,.12,ceramic,16);
    for(let j=0;j<12;j++){const coil=add(new T.TorusGeometry(.23,.036,6,20),copper,x,-.63+j*.10,.12);coil.rotation.x=Math.PI/2;}
    for(const y of [-.49,.32])cyl(x,y,.12,.31,.31,.045,brass,18);
   }
   tube([[-.48,.64,.12],[-.48,.81,.12],[.48,.81,.12],[.48,.64,.12]],.035,copper,6);
   box(0,.64,-.30,1.15,.10,.14,iron);for(const x of [-.48,.48])box(x,.61,-.14,.10,.14,.45,brass);
   box(0,-.53,-.53,1.67,.39,.34,paint);gauge(-.47,-.48,-.74,.13);gauge(.04,-.48,-.74,.13);
   for(const x of [-.94,.94]){box(x,.03,.49,.11,1.58,.13,steel);box(x,.8,.14,.11,.1,.8,steel);}
  }else{
   root.userData.machine='receiver';
   for(const x of [-.87,.87]){box(x,-.08,.28,.16,1.5,.38,paint);for(const y of [-.69,.51])cyl(x,y,-.01,.06,.06,.07,brass,6).rotation.x=Math.PI/2;}
   const points=[[.12,0],[.28,.025],[.45,.08],[.63,.2],[.78,.38]].map(([r,y])=>new T.Vector2(r,y));
   const bowl=add(new T.LatheGeometry(points,32),steel,0,.06,.01);bowl.rotation.x=Math.PI/2;bowl.material.side=T.DoubleSide;
   const rim=add(new T.TorusGeometry(.78,.045,7,36),brass,0,.06,-.37);
   tube([[0,-.69,.26],[0,-.14,.26],[0,.06,.0],[0,.06,-.69]],.055,copper,8);
   for(let j=0;j<7;j++){const a=j/7*Math.PI*2;box(Math.cos(a)*.86,.06+Math.sin(a)*.86,-.01,.09,.12,.16,iron).rotation.z=a;}
   box(0,-.71,-.13,1.53,.13,.9,paint);
  }
  const lg=new T.Group();root.add(lg);const lens=this.box(lg,0,.64,-.449,.31,.11,.075,material(node.color,0,.06));
  box(0,.64,-.405,.40,.19,.055,dark);box(0,.52,-.39,.13,.19,.14,iron);box(0,-.90,-.858,.9,.12,.035,dark);
  for(let j=0;j<=node.id;j++)box((j-node.id/2)*.07,-.9,-.88,.032,.07,.012,brass);
  root.traverse(n=>{if(n.isMesh)n.castShadow=n.receiveShadow=true;});this.merge(root);return {root,lens,wheel,node};
 };
 B.View.prototype.makeCaveLandmarks=function(game){
  const world=game.world,base=Object.create(B.World.prototype);base.density=(x,y,z)=>world.base(x,y,z);
  const rng=B.random(world.seed^0x241991),mats=[
   [material('#836145'),material('#d09b55',0,.08),material('#baad73',0,.20)],
   [material('#b6c3b1'),material('#759b8c'),material('#9ad0bd',0,.17)],
   [material('#434554',.3),material('#887ca7',.25),material('#b3a1cf',.2,.18)]
  ];
  this.caveAccentSites=[];
  for(const network of world.caverns.networks){
   const c=network.chamber;
   for(let j=0;j<11;j++){
    const a=j/11*Math.PI*2+.18,origin={x:c.x,y:c.y+(j%3-1)*.65,z:c.z},direction={x:Math.cos(a),y:.06,z:Math.sin(a)};
    const hit=base.ray(origin,direction,5.5);if(!hit)continue;
    const normal=new V(...base.normal(hit.x,hit.y,hit.z));if(normal.lengthSq()<.8)continue;
    const anchor={x:hit.x-normal.x*.21,y:hit.y-normal.y*.21,z:hit.z-normal.z*.21};
    const root=new T.Group(),{add,tube}=helpers(this,root),[body,edge,light]=mats[network.id];
    root.userData.formation=['lantern-shelves','chalk-drapery','amethyst-fan'][network.id];
    for(const m of [body,edge,light])m.vertexColors=true;
    if(network.id===0){
     // Keep the same random draw per shelf, preserving later anchors.
     for(let k=0;k<4;k++){
      const r=.32+rng()*.3,px=(k%2?-.27:.21),py=(k-1.5)*.29,seed=network.id*17+j*.73+k*1.21;
      const cap=B.CaveForms.shelf(r,seed);add(cap,k%2?body:edge,px,py,0);
      for(const rib of cap.userData.gills)tube(rib.map(([x,y,z])=>[px+x,py+y,z]),.006,light,3);
     }
    }else if(network.id===1){
     const drops=Array.from({length:5},()=>.10+rng()*.12);add(B.CaveForms.drapery(j*.83,drops),body);
    }else{
     for(let k=0;k<8;k++){
      const length=.38+rng()*.67,seed=j*.79+k*1.17,gem=new T.Group();root.add(gem);gem.position.set((k-3.5)*.115+.035*Math.sin(seed),Math.sin(k*1.4)*.09,.035+.055*Math.sin(seed)**2);gem.rotation.set(.4+(k%3)*.21+.10*Math.sin(seed),.12*Math.sin(seed*2),(k-3.5)*-.13+.09*Math.cos(seed));
      const shaft=new T.Mesh(B.CaveForms.crystal(.042+.055*Math.sin(seed)**2,length*(.83+.17*Math.cos(seed)**2),seed),edge);gem.add(shaft);
      if(k%3===0){const chip=new T.Mesh(B.CaveForms.crystal(.022,length*.45,seed+2),light);chip.position.set(.052,length*.08,.02);chip.rotation.z=.3;gem.add(chip);}
     }
     for(let k=0;k<4;k++){const foot=add(new T.DodecahedronGeometry(.22,0),body,(k-1.5)*.24,-.10+.025*Math.sin(j+k),.045);foot.scale.set(1.05,.65,1.05);foot.rotation.set(.24*k,.39*j,.21*k);}
    }
    // Conform the attachment plane to the actual curved wall. A tangent-plane
    // decoration otherwise leaves its outer edges hanging in air on rounded caves.
    const rotation=new T.Quaternion().setFromUnitVectors(new V(0,0,1),normal),surfaceCache=new Map();
    const wallOffset=(x,y)=>{
     const key=x.toFixed(3)+','+y.toFixed(3);if(surfaceCache.has(key))return surfaceCache.get(key);
     const from=new V(x,y,1.6).applyQuaternion(rotation).add(new V(hit.x,hit.y,hit.z)),p=base.ray(from,{x:-normal.x,y:-normal.y,z:-normal.z},3.3),offset=p?1.6-p.distance:-.22;
     surfaceCache.set(key,offset);return offset;
    };
    for(const object of root.children){
     if(object.isGroup){object.position.z+=wallOffset(object.position.x,object.position.y);continue;}
     object.updateMatrix();const geo=object.geometry.clone().applyMatrix4(object.matrix),positions=geo.attributes.position;
     if(geo.userData.chalkParts){
      // The shoulder follows rock, while each pendant keeps its solid section.
      // Projecting every pendant vertex follows the retreating cave wall and
      // stretches mineral drops into blades rather than hanging bodies.
      for(const part of geo.userData.chalkParts){const offset=part.mount?wallOffset(...part.mount):null;for(let i=part.start;i<part.start+part.count;i++)positions.setZ(i,positions.getZ(i)+(offset??wallOffset(positions.getX(i),positions.getY(i)))-.035);}
      geo.computeBoundingBox();geo.computeBoundingSphere();
     }else for(let i=0;i<positions.count;i++)positions.setZ(i,positions.getZ(i)+wallOffset(positions.getX(i),positions.getY(i))-.035);
     geo.computeVertexNormals();object.geometry.dispose();object.geometry=geo;object.position.set(0,0,0);object.rotation.set(0,0,0);object.scale.set(1,1,1);
    }
    root.traverse(n=>{if(!n.isMesh)return;n.castShadow=n.receiveShadow=true;if(!n.geometry.attributes.color)n.geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(n.geometry.attributes.position.count*3).fill(1),3));});B.WorkshopShapes.mergeRigid(root,new Set(),true);root.position.set(hit.x,hit.y,hit.z);root.quaternion.copy(rotation);this.cavernScene.add(root);
    root.visible=world.density(anchor.x,anchor.y,anchor.z)<-.015;
    this.caveGrowth.push({root,anchor});
    if(j%3===0){const point=new V(0,network.id===0?.1:-.28,.48).applyQuaternion(root.quaternion).add(root.position);this.caveAccentSites.push({root,point,color:['#d6ad67','#96cdbb','#af9fcb'][network.id]});}
   }
  }
  this.caveAccents=Array.from({length:2},()=>{const light=new T.PointLight('#ddbd85',0,4.2,1.8);this.cavernScene.add(light);return light;});
 };
 B.View.prototype.renderCaveAccents=function(game){
  if(!this.caveAccents)return;
  const head=game.player.head,eye=new V(head.x,head.y,head.z),near=this.caveAccentSites.filter(s=>s.root.visible&&s.point.distanceTo(eye)<6&&game.world.density(s.point.x,s.point.y,s.point.z)>.03&&game.world.clearLine(head,s.point,.05)).sort((a,b)=>a.point.distanceTo(eye)-b.point.distanceTo(eye));
  this.caveAccents.forEach((light,i)=>{const s=near[i];light.intensity=s ? .34 : 0;if(s){light.position.copy(s.point);light.color.set(s.color);}});
 };
 B.View.prototype.makeHeadlamp=function(){
  this.headlamp=new T.SpotLight('#ffe8bf',0,19,.64,.75,1.35);this.headlamp.castShadow=true;this.headlamp.shadow.mapSize.set(768,768);this.headlamp.shadow.camera.near=.12;this.headlamp.shadow.bias=-.00008;this.headlamp.shadow.normalBias=.018;
  this.scene.add(this.headlamp,this.headlamp.target);this.renderer.shadowMap.autoUpdate=true;this.sun.shadow.autoUpdate=false;this.headlamp.shadow.autoUpdate=false;
 };
 B.View.prototype.renderHeadlamp=function(game,daylight){
  const on=game.screen!=='title',amount=on?1-daylight:0,d=game.player.direction;
  this.headlamp.position.copy(this.camera.position);this.headlamp.target.position.set(this.camera.position.x+d.x*8,this.camera.position.y+d.y*8,this.camera.position.z+d.z*8);
  this.headlamp.color.copy(this.lamp.color);this.headlamp.intensity=2.4*amount;this.headlamp.castShadow=amount>.1&&this.settings.quality>=1;
  this.headlamp.distance=19+game.economy.state.gear.scanner*1.5;
  const cache=this.headlampPose,p=game.player;
  if(this.headlamp.castShadow&&(!cache||cache.world!==game.world||cache.terrain!==game.world.revision||cache.state!==game.revision||this.renderer.shadowMap.needsUpdate||Math.hypot(p.x-cache.x,p.y-cache.y,p.z-cache.z)>.02||Math.abs(p.yaw-cache.yaw)>.004||Math.abs(p.pitch-cache.pitch)>.004||cache.range!==this.headlamp.distance)){
   this.headlamp.shadow.needsUpdate=true;
   this.headlampPose={world:game.world,terrain:game.world.revision,state:game.revision,x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch,range:this.headlamp.distance};
  }
  // Wing beats and articulated creatures do not increment the save revision.
  // Refresh their nearby moving shadows at the same cadence as the crew.
  if(this.headlamp.castShadow&&this.settings.motion&&game.clock-(this.headlampDynamicAt||0)>.1){
   const moving=(game.combat?.enemies||[]).concat(game.foreman?.nodes||[],game.crawlers?.nodes||[]).some(n=>n.hp>0&&n.phase!=='buried'&&Math.hypot(n.x-p.x,n.y-p.y,n.z-p.z)<this.headlamp.distance);
   if(moving){this.headlamp.shadow.needsUpdate=true;this.headlampDynamicAt=game.clock;}
  }
  this.lamp.intensity=on ? .20+.30*amount : 0;this.lamp.distance=on?8+game.economy.state.gear.scanner:8;
 };
})(B2);
