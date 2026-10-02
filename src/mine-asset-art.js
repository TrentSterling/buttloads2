/* Constructed salvage and fractured living minerals; native opaque geometry. */
'use strict';
(function(B){
 const T=THREE,V=T.Vector3;
 function kit(){
  const definitions={iron:['#33413d',.83,.35],steel:['#89958b',.44,.58],paint:['#b68b42',.80,.14],bronze:['#92734f',.63,.48],rubber:['#262e29',.99,0],bone:['#c8c4a7',.88,0],rock:['#53605b',.97,0],shell:['#869081',.93,0,.045],amber:['#dba35e',.49,.08,.32],tide:['#789cb8',.47,.12,.32],jade:['#7ecaa7',.55,.10,.48],violet:['#978bb6',.55,.12,.25],heart:['#4e7562',.90,.04]},materials={};
  const m=name=>{if(!materials[name]){const [hex,roughness,metalness,emissiveIntensity=0]=definitions[name],color=new T.Color(hex).convertSRGBToLinear();materials[name]=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity,roughness,metalness,vertexColors:true});}return materials[name];};
  const add=(root,geo,name,x=0,y=0,z=0)=>{
   if(!geo.attributes.color){const p=geo.attributes.position,colors=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),grain=.91+.045*Math.sin(x*73+y*31+z*47)+.02*Math.sin(x*137-z*59);colors.set([grain,grain,grain],i*3);}geo.setAttribute('color',new T.BufferAttribute(colors,3));}
   const mesh=new T.Mesh(geo,m(name));mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;
  };
  const box=(root,name,x,y,z,w,h,d,r=.008)=>add(root,chamfer(w,h,d,r),name,x,y,z);
  const cylinder=(root,name,x,y,z,r,h,axis='y',sides=16)=>{const n=add(root,new T.CylinderGeometry(r,r,h,sides),name,x,y,z);if(axis!=='y')n.rotation[axis==='x'?'z':'x']=Math.PI/2;return n;};
  const beam=(root,name,a,b,w,d)=>{const av=new V(...a),bv=new V(...b),delta=bv.clone().sub(av),mesh=box(root,name,...av.add(bv).multiplyScalar(.5).toArray(),w,delta.length(),d);mesh.quaternion.setFromUnitVectors(new V(0,1,0),delta.normalize());return mesh;};
  const ring=(root,name,x,y,z,inner,outer,depth,axis='z')=>{const s=new T.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(hole);const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:12});geo.translate(0,0,-depth/2);const n=add(root,geo,name,x,y,z);if(axis!=='z')n.rotation[axis==='x'?'y':'x']=Math.PI/2;return n;};
  const sector=(root,name,inner,outer,start,end,depth,y)=>{const s=new T.Shape();s.moveTo(Math.cos(start)*outer,Math.sin(start)*outer);s.absarc(0,0,outer,start,end,false);s.lineTo(Math.cos(end)*inner,Math.sin(end)*inner);s.absarc(0,0,inner,end,start,true);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:3});geo.translate(0,0,-depth/2);const n=add(root,geo,name,0,y,0);n.rotation.x=Math.PI/2;return n;};
  const tube=(root,name,points,r,segments=18,linear=false)=>add(root,sweep(points,r,segments,linear),name);
  const bolt=(root,x,y,z,axis='z',radius=.019)=>cylinder(root,'steel',x,y,z,radius,.022,axis,6);
  const gauge=(root,x,y,z,r)=>{
   cylinder(root,'iron',x,y,z,r*1.17,.055,'z');cylinder(root,'bone',x,y,z-.032,r,.008,'z',24);
   ring(root,'steel',x,y,z-.036,r*.99,r*1.13,.015);
   for(let i=0;i<9;i++){const a=-.8+i*.49,mark=box(root,'iron',x+Math.sin(a)*r*.77,y+Math.cos(a)*r*.77,z-.044,.007,r*.16,.004,.0006);mark.rotation.z=-a;}
   const needle=box(root,'bronze',x-r*.11,y+r*.18,z-.049,.010,r*.8,.008,.001);needle.rotation.z=.57;cylinder(root,'iron',x,y,z-.055,r*.10,.011,'z',8);
  };
  return{m,add,box,cylinder,beam,ring,sector,tube,bolt,gauge};
 }
 function chamfer(w,h,d,r){
  const b=Math.min(r,d*.24,w*.2,h*.2),x=w/2-b,y=h/2-b,c=Math.min(r,x*.4,y*.4),s=new T.Shape();
  for(const [i,p]of [[-x+c,-y],[x-c,-y],[x,-y+c],[x,y-c],[x-c,y],[-x+c,y],[-x,y-c],[-x,-y+c]].entries())s[i?'lineTo':'moveTo'](...p);s.closePath();
  const geo=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:1,curveSegments:1});geo.translate(0,0,-d/2+b);return geo;
 }
 function sweepCurve(points,linear=false){
  if(!linear)return new T.CatmullRomCurve3(points.map(p=>new V(...p)));
  // Keep every crease knot at a ring so interpolated tube segments cannot bridge a fold.
  const curve=new T.Curve(),vertices=points.map(p=>new V(...p));curve.getPoint=(t,target=new V())=>{const scaled=t*(vertices.length-1),i=Math.min(vertices.length-2,Math.floor(scaled));return target.lerpVectors(vertices[i],vertices[i+1],scaled-i);};curve.getPointAt=(t,target)=>curve.getPoint(t,target);curve.getTangentAt=t=>curve.getTangent(t);return curve;
 }
 function sweep(points,radius,segments=18,linear=false){
  const curve=sweepCurve(points,linear),frames=curve.computeFrenetFrames(segments,false),p=[],uv=[],indices=[],sides=6;
  for(let j=0;j<=segments;j++){const t=j/segments,c=curve.getPointAt(t),r=typeof radius==='number'?radius:radius[0]*(1-t)+radius[1]*t;for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,q=c.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);p.push(...q.toArray());uv.push(i/sides,t);}}
  for(let j=0;j<segments;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides,c=a+sides,d=b+sides;indices.push(a,b,d,a,d,c);}
  for(const j of [0,segments]){const center=p.length/3;p.push(...curve.getPointAt(j/segments).toArray());uv.push(.5,.5);for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;indices.push(...(j?[center,a,b]:[center,b,a]));}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
 }
 function leaf(seed=0){
  const centers=[[.10,-.72,.015],[.32,-.60,.09],[.65,-.30,.14],[.74,.05,.18],[.67,.40,.15],[.47,.67,.09],[.23,.80,.009]],p=[],uv=[],ix=[],cols=8,rows=centers.length,half=rows*(cols+1);
  for(const back of [false,true])for(let j=0;j<rows;j++)for(let i=0;i<=cols;i++){const u=i/cols*2-1,[x,y,w]=centers[j],bend=.055*(1-u*u)*Math.sin(j/(rows-1)*Math.PI),r=x+bend+(back?-.032:0);p.push(r,y+.016*Math.sin(seed+j*.9)*Math.sin(j/(rows-1)*Math.PI),u*w);uv.push(i/cols,j/(rows-1));}
  for(const back of [false,true])for(let j=0;j<rows-1;j++)for(let i=0;i<cols;i++){const a=(back?half:0)+j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;ix.push(...(back?[a,b,d,a,d,c]:[a,d,b,a,c,d]));}
  const contour=[...Array.from({length:cols+1},(_,i)=>i),...Array.from({length:rows-1},(_,j)=>(j+1)*(cols+1)+cols),...Array.from({length:cols},(_,i)=>(rows-1)*(cols+1)+cols-1-i),...Array.from({length:rows-2},(_,j)=>(rows-2-j)*(cols+1))];
  for(let i=0;i<contour.length;i++){const a=contour[i],b=contour[(i+1)%contour.length];ix.push(a,b,b+half,a,b+half,a+half);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();geo.userData.vein=centers.map((_,j)=>[p[(j*(cols+1)+cols/2)*3]+.002,p[(j*(cols+1)+cols/2)*3+1],0]);return geo;
 }
 function rockPlate(vertices,seed){
  const center=vertices.reduce((c,v)=>c.add(v),new V()).multiplyScalar(1/3),outline=[];
  for(let i=0;i<3;i++){const v=vertices[i].clone().lerp(center,.11+.035*Math.sin(seed+i)),prev=vertices[(i+2)%3].clone().lerp(center,.11),next=vertices[(i+1)%3].clone().lerp(center,.11);outline.push(v.clone().lerp(prev,.12),v.clone().lerp(next,.12));}
  const points=[],indices=[],uv=[],colors=[],face=(vertices,color)=>{const at=points.length/3;for(const v of vertices){points.push(...v.toArray());uv.push(v.x,v.z);colors.push(...color);}for(let i=1;i<vertices.length-1;i++)indices.push(at,at+i,at+i+1);};
  const apex=center.clone().addScaledVector(center.clone().normalize(),.022),bottom=outline.map(v=>v.clone().multiplyScalar(.82));
  for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length,shade=.85+.12*Math.sin(seed*1.7+i);face([apex,outline[i],outline[j]],[shade,shade*.97,shade*.91]);face([outline[i],bottom[i],bottom[j],outline[j]],[.67,.71,.66]);}face([...bottom].reverse(),[.68,.70,.67]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
 }
 function salvage(root,spec,k){
  const {add,box,cylinder,beam,ring,tube,bolt,gauge}=k,small=spec.id===0,railX=small?1.44:2.20,railZ=small?.48:.67,bottom=small?-.52:-.76;
  root.userData.mineAsset=small?'survey-flywheel':'resonance-engine';
  for(const z of [-railZ,railZ]){box(root,'iron',0,bottom,z,railX,.075,.16);box(root,'steel',0,bottom+.055,z,railX,.036,.085);}
  for(const x of small?[-.56,.56]:[-.98,.98]){
   box(root,'iron',x,bottom+.09,0,.20,.07,railZ*2+.13);
   for(const z of [-railZ,railZ])bolt(root,x,bottom+.14,z,'y');
  }
  if(small){
   ring(root,'paint',0,.015,0,.402,.526,.115,'x');for(const x of [-.067,.067])ring(root,'steel',x,.015,0,.506,.531,.018,'x');
   cylinder(root,'iron',0,.015,0,.12,.33,'x',20);cylinder(root,'steel',0,.015,0,.077,1.35,'x',16);
   for(let i=0;i<6;i++){const a=i*Math.PI/3,from=[0,.015+Math.sin(a)*.10,Math.cos(a)*.10],to=[0,.015+Math.sin(a)*.438,Math.cos(a)*.438];beam(root,'paint',from,to,.075,.11);for(const x of [-.078,.078])bolt(root,x,.015+Math.sin(a)*.466,Math.cos(a)*.466,'x',.014);}
   for(const x of [-.56,.56]){
    for(const z of [-.37,.37])beam(root,'iron',[x,bottom+.11,z],[x,-.055,z*.24],.10,.10);
    ring(root,'bronze',x,.015,0,.082,.172,.13,'x');ring(root,'steel',x-.08,.015,0,.085,.125,.025,'x');
    beam(root,'iron',[x,.13,0],[x,.24,0],.07,.075);ring(root,'steel',x,.27,0,.035,.062,.035,'x');
   }
   tube(root,'rubber',[[-.52,-.06,.11],[-.45,-.30,.19],[.30,-.36,.20],[.51,-.08,.10]],.026,18);
   box(root,'paint',.58,-.29,-.21,.13,.15,.25);gauge(root,.58,-.28,-.349,.065);
  }else{
   cylinder(root,'rubber',0,-.06,0,.365,1.63,'x',24);
   for(const x of [-.84,.84]){cylinder(root,'iron',x,-.06,0,.45,.13,'x',24);ring(root,'steel',x+Math.sign(x)*.08,-.06,0,.22,.395,.04,'x');for(let i=0;i<6;i++){const a=i*Math.PI/3;bolt(root,x+Math.sign(x)*.112,-.06+Math.sin(a)*.30,Math.cos(a)*.30,'x');}box(root,'iron',x,-.52,0,.25,.30,.60);}
   for(let i=0;i<9;i++)ring(root,'bronze',-.54+i*.135,-.06,0,.365,.414,.047,'x');
   for(const z of [-.435,.435])box(root,'iron',0,-.06,z,1.37,.075,.075);
   for(const x of [-.32,.32])ring(root,'steel',x,-.06,0,.418,.455,.025,'x');
   for(const x of [-.98,.98])for(const z of [-railZ,railZ]){box(root,'paint',x,-.02,z,.10,1.41,.10);for(const y of [-.59,.56])bolt(root,x,y,z-.062);}
   for(const z of [-railZ,railZ])box(root,'iron',0,.685,z,2.20,.10,.15);
   for(const x of [-.73,.73]){box(root,'iron',x,.685,0,.11,.10,1.34);ring(root,'steel',x,.79,0,.037,.069,.045);box(root,'iron',x,.715,0,.12,.04,.12);}
   box(root,'paint',0,.42,-.62,1.26,.39,.17);box(root,'iron',0,.42,-.716,1.15,.30,.03);
   for(const x of [-.34,.06])gauge(root,x,.46,-.748,.10);
   for(const y of [.36,.43,.50])box(root,'violet',.41,y,-.742,.16,.024,.025,.003);
   for(const x of [-.56,.56])for(const y of [.28,.56])bolt(root,x,y,-.756,'z',.016);
   tube(root,'bronze',[[-.80,-.30,.31],[-.90,.16,.34],[-.60,.57,.36],[.38,.57,.36],[.73,.26,.30]],.036,22);
   tube(root,'rubber',[[.72,-.18,-.29],[.74,-.46,-.40],[.26,-.49,-.52],[.03,.23,-.55]],.027,18);
  }
  B.WorkshopShapes.mergeRigid(root);
 }
 function rootway(root,k){
  const {box,sector,ring,tube,bolt}=k;root.userData.mineAsset='rootway-iris';
  for(let i=0;i<12;i++){const a=i*Math.PI/6+.014,b=(i+1)*Math.PI/6-.014;sector(root,i%4===0?'bronze':'rock',.745,1.125,a,b,.075,.002);if(i%3===0)sector(root,'jade',.85,.875,a+.05,b-.08,.013,.044);const t=(a+b)/2;bolt(root,Math.cos(t)*1.04,.053,Math.sin(t)*1.04,'y',.023);}
  ring(root,'iron',0,-.025,0,.675,.755,.08,'y');
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3,shape=new T.Shape();shape.moveTo(.045,-.045);shape.quadraticCurveTo(.24,-.39,.65,-.30);shape.lineTo(.73,.02);shape.quadraticCurveTo(.37,.18,.045,.065);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.027,bevelEnabled:false,curveSegments:8});geo.translate(0,0,-.0135);const plate=k.add(root,geo,i%2?'iron':'rock',0,.017+(i%2)*.007,0);plate.rotation.set(Math.PI/2,0,a);
   const cord=tube(root,'heart',[[.10,.032,0],[.30,.057,-.07],[.57,.047,-.15],[.82,.038,-.19],[1.03,.035,-.18]],[.031,.012],12);cord.rotation.y=a;
  }
  box(root,'bronze',0,.048,0,.12,.024,.12,.012);B.WorkshopShapes.mergeRigid(root);
 }
 function vault(root,index,k){
  const {add}=k,name=['amber','tide','jade'][index],scale=[new V(.82,1.20,.82),new V(1.03,.72,1.02),new V(.73,1.16,.82)][index],sourceGeo=new T.IcosahedronGeometry(.82,0),source=sourceGeo.attributes.position;
  root.userData.mineAsset=['amber-egg','drowned-star','tomorrow-seed'][index];
  const core=add(root,new T.IcosahedronGeometry(.602,2),name);core.scale.copy(scale);
  for(let i=0;i<source.count;i+=3){const vertices=[0,1,2].map(j=>new V().fromBufferAttribute(source,i+j).multiply(scale));add(root,rockPlate(vertices,i+index*7),'shell');}sourceGeo.dispose();
  for(let i=0;i<(index===1?5:index===2?3:0);i++){
   const a=i*Math.PI*2/(index===1?5:3)+.4,dir=index===1?new V(Math.cos(a),.08*Math.sin(a*2),Math.sin(a)).normalize():new V(Math.cos(a)*.23,1,Math.sin(a)*.23).normalize(),geo=B.CaveForms.crystal(index===1?.065:.043,index===1?.30:.28,index+i*1.9);geo.translate(0,-.04,0);const shard=add(root,geo,name,...dir.clone().multiplyScalar(index===1?.53:.57).multiply(scale).toArray());shard.quaternion.setFromUnitVectors(new V(0,1,0),dir);
  }
  B.WorkshopShapes.mergeRigid(root);
 }
 function heart(root,k){
  const {add,tube}=k;root.userData.mineAsset='living-heart';
  const core=add(root,new T.IcosahedronGeometry(.47,2),'jade',0,.02,0);core.scale.set(.91,1.34,.86);
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7,geo=leaf(i),petal=add(root,geo,'heart');petal.rotation.y=a;petal.scale.set(1+.07*Math.sin(i*1.4),.92+.12*Math.cos(i*2.1),1);
   const vein=tube(root,i%3===0?'bone':'jade',geo.userData.vein,[.020,.012],24,true);vein.rotation.y=a;vein.scale.copy(petal.scale);
  }
  const stem=add(root,B.WorkshopShapes.loft([[-.78,.075,.07],[-.65,.18,.16],[-.45,.19,.17],[-.30,.13,.12]],12),'bone');stem.rotation.z=.08;
  for(let i=0;i<3;i++){const shard=add(root,B.CaveForms.crystal(.075,.44,i*1.6),'jade',Math.sin(i*2.1)*.18,-.22,Math.cos(i*2.1)*.17);shard.rotation.z=(i-1)*.35;}
  B.WorkshopShapes.mergeRigid(root);
 }
 B.MineAssetArt={kit,salvage,rootway,vault,heart,sweep,sweepCurve,leaf,rockPlate,chamfer};
})(B2);
