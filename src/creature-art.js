/* Closed cinder-moth anatomy and layered shale armour; no gameplay state. */
'use strict';
(function(B){
 const T=THREE,V=T.Vector3;
 function builder(seed=0){
  const positions=[],indices=[],uv=[],colors=[];
  function face(points,tone=1){const start=positions.length/3;for(const p of points){positions.push(...p);uv.push(p[0],p[2]);const grain=.91+.07*Math.sin(p[2]*29+seed)+.035*Math.sin(p[0]*43+p[1]*17+seed);colors.push(tone*grain,tone*grain*.97,tone*grain*.91);}for(let i=1;i<points.length-1;i++)indices.push(start,start+i,start+i+1);}
  function rings(rows,tone=1){const count=rows[0].length;for(let r=0;r<rows.length-1;r++)for(let i=0;i<count;i++){const j=(i+1)%count;face([rows[r][i],rows[r+1][i],rows[r+1][j],rows[r][j]],tone*(.88+.12*Math.sin(i*2.7+r+seed)));}face(rows[0],tone*.7);face([...rows.at(-1)].reverse(),tone);}
  function section(rows,sides=10,tone=1){rings(rows.map(([z,rx,ry,cy=0,cx=0])=>Array.from({length:sides},(_,i)=>{const a=i/sides*Math.PI*2;return[cx+Math.sin(a)*rx,cy+Math.cos(a)*ry,z];})),tone);}
  function tube(points,radii,sides=6,tone=1){const p=points.map(n=>new V(...n));rings(p.map((at,i)=>{const tangent=p[Math.min(i+1,p.length-1)].clone().sub(p[Math.max(0,i-1)]).normalize(),axis=Math.abs(tangent.y)>.95?new V(0,0,1):new V(0,1,0),u=axis.cross(tangent).normalize(),v=tangent.clone().cross(u).normalize();return Array.from({length:sides},(_,j)=>at.clone().addScaledVector(u,Math.sin(j/sides*Math.PI*2)*radii[i]).addScaledVector(v,Math.cos(j/sides*Math.PI*2)*radii[i]).toArray());}),tone);}
  function finish(part){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData.creaturePart=part;return g;}
  return{face,rings,section,tube,finish};
 }
 function mothBody(seed=0){
  const b=builder(seed);b.section([[-.31,.018,.024,-.015],[-.25,.071,.061,-.018],[-.16,.10,.072,-.005],[-.055,.079,.067],[.02,.105,.091,.018],[.10,.111,.097,.026],[.17,.072,.06,.035],[.23,.08,.065,.038],[.29,.048,.045,.042]],10);
  for(const side of [-1,1]){
   b.tube([[side*.047,.083,.22],[side*.085,.15,.29],[side*.15,.19,.36],[side*.18,.17,.40]],[.018,.011,.007,.0025],5,.7);
   for(let i=0;i<3;i++){const z=.08-i*.075;b.tube([[side*.065,-.045,z],[side*.12,-.10,z-.012],[side*.16,-.14,z+.025]],[.017,.012,.004],5,.76);}
   for(let i=0;i<4;i++){const z=.12-i*.072;b.tube([[side*.066,.032,z],[side*.119,.042,z-.012],[side*.142,.019,z-.035]],[.024,.016,.0025],5,1.08);}
  }
  return b.finish('moth-body');
 }
 function mothEyes(seed=0){const b=builder(seed);for(const side of [-1,1])b.section([[.252,.026,.037,.062,side*.065],[.279,.039,.048,.062,side*.065],[.298,.026,.033,.062,side*.065]],8,1);return b.finish('moth-eyes');}
 function mothWing(side=1,seed=0){
  const b=builder(seed),fore=[[.075,.13],[.20,.24],[.34,.26],[.43,.20],[.468,.08],[.446,.025],[.414,-.025],[.33,-.053],[.11,-.05]],hind=[[.105,-.035],[.31,-.06],[.38,-.145],[.348,-.18],[.326,-.24],[.27,-.285],[.224,-.255],[.173,-.21],[.09,-.17]];
  function membrane(outline,center,ocellus=false){
   let ring=outline.map(([x,z])=>[side*x,.003+Math.sin(x*8+z*4)*.004,z]);if(side<0)ring.reverse();const peak=[side*center[0],.022,center[1]],bottom=ring.map(p=>[p[0],p[1]-.006,p[2]]),under=[peak[0],-.006,peak[2]];
   const upward=(points,tone)=>{const a=new V(...points[0]),n=new V(...points[1]).sub(a).cross(new V(...points[2]).sub(a));b.face(n.y<0?[...points].reverse():points,tone);};
   if(ocellus){
    const roof=(x,z)=>{for(let i=0;i<ring.length;i++){const a=peak,q=ring[i],r=ring[(i+1)%ring.length],den=(q[2]-r[2])*(a[0]-r[0])+(r[0]-q[0])*(a[2]-r[2]),u=((q[2]-r[2])*(x-r[0])+(r[0]-q[0])*(z-r[2]))/den,v=((r[2]-a[2])*(x-r[0])+(a[0]-r[0])*(z-r[2]))/den;if(u>=-1e-6&&v>=-1e-6&&u+v<=1.000001)return u*a[1]+v*q[1]+(1-u-v)*r[1];}throw Error('Moth ocellus outside wing');};
    const patch=radius=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,x=side*(.33+Math.cos(a)*.057*radius),z=.10+Math.sin(a)*.064*radius;return[x,roof(x,z),z];}),outer=patch(1),inner=patch(.54),points=[...ring,...outer],contour=ring.map(p=>new T.Vector2(p[0],p[2])),hole=outer.map(p=>new T.Vector2(p[0],p[2]));
    for(const ids of T.ShapeUtils.triangulateShape(contour,[hole]))upward(ids.map(i=>points[i]),.83);
    const center=[side*.33,roof(side*.33,.10),.10];for(let i=0;i<8;i++){const j=(i+1)%8;upward([outer[i],inner[i],inner[j]],1.25);upward([outer[i],inner[j],outer[j]],1.25);upward([center,inner[i],inner[j]],.15);}
   }else for(let i=0;i<ring.length;i++)b.face([peak,ring[i],ring[(i+1)%ring.length]],i%3===0?1.05:.83);
   for(let i=0;i<ring.length;i++){const j=(i+1)%ring.length;b.face([under,bottom[j],bottom[i]],.63);b.face([ring[i],bottom[i],bottom[j],ring[j]],.58);}
  }
  membrane(fore,[.24,.09],true);membrane(hind,[.235,-.14]);
  let vein=0;for(const [end,bend]of [[[.33,.25],[.20,.135]],[[.43,.18],[.27,.10]],[[.466,.075],[.29,.065]],[[.414,-.025],[.30,.005]],[[.376,-.146],[.25,-.08]],[[.325,-.237],[.25,-.135]],[[.225,-.252],[.18,-.125]]])b.tube([[side*.09,.024,.004+vein++*.002],[side*bend[0],.024,bend[1]],[side*end[0],.008,end[1]]],[.0045,.003,.001],4,.34);
  const geo=b.finish('moth-wing'),p=geo.attributes.position,c=geo.attributes.color;
  for(let i=0;i<p.count;i++){const x=Math.abs(p.getX(i)),z=p.getZ(i),edge=x>.35?.62:1,band=.72+.28*Math.pow(Math.sin(z*24+x*13+seed*.1),2);for(let j=0;j<3;j++)c.array[i*3+j]*=edge*band;}
  geo.scale(.94,.94,.94);return geo;
 }
 function carapace(seed=0){const b=builder(seed);for(let i=0;i<4;i++){const z=-.36+i*.205,width=[.37,.47,.46,.37][i],shift=Math.sin(seed+i*2.3)*.012;b.section([[z-.13,width*.71,.048,.13,shift],[z-.045,width,.16,.17,shift],[z+.105,width*.86,.067,.12,shift]],10,.86+i*.05);}return b.finish('crawler-shell');}
 function abdomen(seed=0){const b=builder(seed);b.section([[-.43,.10,.12],[-.34,.27,.24,-.015],[-.30,.23,.21,-.015],[-.24,.35,.29,-.02],[-.19,.30,.25,-.02],[-.13,.38,.31,-.02],[-.07,.33,.265,-.02],[0,.37,.31,-.012],[.065,.315,.26,-.012],[.14,.32,.29],[.20,.265,.245],[.29,.24,.26],[.42,.13,.17,.02]],10);for(const side of [-1,1])b.tube([[side*.14,.025,.37],[side*.15,-.04,.46],[side*.07,-.07,.49]],[.065,.05,.012],6,.46);return b.finish('crawler-body');}
 function rear(seed=0){const b=builder(seed);b.section([[-.018,.125,.07],[0,.18,.11],[.018,.15,.085]],8,.8);return b.finish('crawler-rear');}
 function leg(side=1,lower=false,seed=0,mount=.2){const b=builder(seed),attachment=[side*(mount-.44),.13,0];if(lower)b.tube([[side*.24,-.13,0],[side*.285,-.24,.01],[side*.30,-.33,.055]],[.048,.027,.006],6,.72);else b.tube([attachment,[0,0,0],[side*.095,-.025,-.018],[side*.21,-.09,-.008],[side*.24,-.13,0]],[.047,.053,.073,.05,.043],6);const geo=b.finish(lower?'crawler-foot':'crawler-leg');if(!lower)geo.userData.attachment=attachment;return geo;}
 function claw(side=1,fingers=false,seed=0){const b=builder(seed);if(fingers){for(const [x,z]of [[.035,.315],[.15,.32]])b.tube([[side*x,.01,.235],[side*x,-.002,z],[side*.095,.018,.375]],[.034,.025,.004],6,.73);}else b.section([[-.065,.048,.048,.07,side*-.11],[.015,.055,.055,0,side*.03],[.10,.074,.08,.005,side*.07],[.205,.086,.084,.012,side*.095],[.255,.07,.069,.01,side*.095]],8,.98);const geo=b.finish(fingers?'crawler-pincers':'crawler-claw');if(!fingers)geo.userData.attachment=[side*-.11,.07,-.065];return geo;}
 function crawlerEyes(seed=0){const b=builder(seed);for(const side of [-1,1])b.section([[.585,.037,.026,.045,side*.19],[.606,.048,.035,.045,side*.19],[.627,.033,.024,.045,side*.19]],8);return b.finish('crawler-eyes');}
 function mesh(root,geo,material){material.vertexColors=true;const m=new T.Mesh(geo,material);root.add(m);return m;}
 function tint(material,color,emissive){material.color.set(color).convertSRGBToLinear();if(emissive)material.emissive.set(emissive).convertSRGBToLinear();}
 function moth(root,body,wing,light,seed=0){tint(body,'#47302a');tint(wing,'#b47b51');tint(light,'#e1a955','#ef8235');const anatomy=mesh(root,mothBody(seed),body);anatomy.castShadow=anatomy.receiveShadow=true;mesh(root,mothEyes(seed),light);wing.side=T.FrontSide;const wings=[-1,1].map(side=>mesh(root,mothWing(side,seed),wing));return{wings};}
 function crawler(root,stone,dark,core,glow,seed=0){
  tint(stone,'#59635c','#59635c');tint(dark,'#273330','#273330');tint(core,'#8c5038','#8c5038');tint(glow,'#e5bf70','#e5bf70');
  const body=mesh(root,abdomen(seed),core);body.scale.set(1.15,.65,1.45);const shell=new T.Group();root.add(shell);mesh(shell,carapace(seed),stone);const tail=mesh(root,rear(seed),core);tail.position.set(0,-.035,-.63);tail.castShadow=tail.receiveShadow=true;const legs=[],claws=[];
  for(const side of [-1,1]){for(const [z,mount]of [[-.38,.12],[-.1,.27],[.18,.21]]){const group=new T.Group();group.position.set(side*.44,-.15,z);root.add(group);mesh(group,leg(side,false,seed,mount),stone);mesh(group,leg(side,true,seed),dark);legs.push(group);}const group=new T.Group();group.position.set(side*.32,-.04,.34);root.add(group);mesh(group,claw(side,false,seed),stone);mesh(group,claw(side,true,seed),dark);claws.push(group);}
  for(const group of [...legs,...claws])for(const part of group.children)part.castShadow=part.receiveShadow=true;
  mesh(root,crawlerEyes(seed),glow);return{body,shell,rear:tail,legs,claws};
 }
 B.CreatureArt={mothBody,mothEyes,mothWing,carapace,abdomen,rear,leg,claw,crawlerEyes,moth,crawler};
})(B2);
