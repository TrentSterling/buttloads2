/* Low native groundcover and broken stone, grouped outside work and walking routes. */
'use strict';
(function(B){
 const T=THREE,C=B.COMMON;
 const green=[[-39,15,3.8,2.8],[-49,20,3.2,3.2],[-49,36,3.8,2.5],[-37,33,3.5,3.1],[-38,48,3.2,2.8],[-48,57,4,3],[-29,-37,3.5,2.5],[15,-36,3.2,3],[30,-44,4,2.8],[51,42,2.6,3.5],[38,61,3.3,2.5],[50,58,3,2.6],[-4,64,3,2.6]];
 const scree=[[-46,25,4.4,3.6],[-41,28,3.6,3.3],[-38,-37,3.7,3.1],[49,43,3.6,3.6],[35,62,3.7,3],[-52,41,4,3.5],[28,-47,3.8,2.5]];
 B.GROUND_COVER={green,scree,coverage(x,z){
  const coverage=patches=>{let value=0;for(const [cx,cz,rx,rz]of patches){const dx=x-cx+.55*Math.sin(z*.43+x*.19),dz=z-cz+.45*Math.sin(x*.51-z*.27);value=Math.max(value,Math.exp(-((dx/rx)**2+(dz/rz)**2)*1.6));}return value;};
  return{green:coverage(green),scree:coverage(scree)};
 }};
 B.View.prototype.makeGroundCover=function(){
  const group=this.groundCoverScene=new T.Group();this.scene.add(group);this.groundCoverRecords=[];
  const pos=[],color=[],uv=[],indices=[],leafTone=new T.Color(),chipTone=new T.Color();
  const greenA=new T.Color('#3f5c40').convertSRGBToLinear(),greenB=new T.Color('#6b7c50').convertSRGBToLinear(),stoneA=new T.Color('#8d8b77').convertSRGBToLinear(),stoneB=new T.Color('#636c60').convertSRGBToLinear();
  const vertex=(x,y,z,tone,shade=1)=>{const id=pos.length/3;pos.push(x,y,z);color.push(tone.r*shade,tone.g*shade,tone.b*shade);uv.push(x*.2,z*.2);return id;};
  const safe=(x,z,r)=>{
   for(let j=0;j<9;j++){const a=j/8*Math.PI*2,px=x+(j===8?0:Math.cos(a)*r),pz=z+(j===8?0:Math.sin(a)*r);if(px<-57||px>57||pz<-49||pz>67||!C.planting(px,pz,.05)||Math.hypot(px-42,pz-51)<5)return false;
    if(this.obstacles.some(b=>px>b[0]-.08&&px<b[3]+.08&&pz>b[2]-.08&&pz<b[5]+.08))return false;}
   return true;
  };
  const leaf=(x,z,angle,length,width,h,tone)=>{
   const dx=Math.cos(angle),dz=Math.sin(angle),stations=[[0,0],[.27,.72],[.62,1],[1,.48],[.94,0]],pairs=[];
   for(const [t,w]of stations){const ids=[];for(const side of w?[-1,1]:[0]){const px=x+dx*length*t-dz*width*w*side,pz=z+dz*length*t+dx*width*w*side,y=C.height(px,pz)+.016+h*.65*Math.sin(t*Math.PI);ids.push(vertex(px,y,pz,tone,.87+.13*t));}pairs.push(ids);}
   const px=x+dx*length*.52,pz=z+dz*length*.52,centre=vertex(px,C.height(px,pz)+.016+h*.95,pz,tone,.95),outline=[pairs[0][0],pairs[1][1],pairs[2][1],pairs[3][1],pairs[4][0],pairs[3][0],pairs[2][0],pairs[1][0]];
   for(let i=0;i<outline.length;i++)indices.push(centre,outline[i],outline[(i+1)%outline.length]);
  };
  for(const [patch,[cx,cz,rx,rz]]of green.entries()){
   const random=B.random(74123+patch*1387);
   for(let n=0;n<56;n++){const angle=random()*Math.PI*2,r=Math.sqrt(random()),x=cx+Math.cos(angle)*r*rx,z=cz+Math.sin(angle)*r*rz,length=.12+random()*.15,width=length*(.30+random()*.12),h=.023+random()*.027;
    if(!safe(x,z,length+.04))continue;leafTone.copy(greenA).lerp(greenB,random()*.62);
    for(let j=0;j<3;j++)leaf(x,z,angle+j*Math.PI*2/3+.13*(random()-.5),length*(.83+random()*.17),width,h,leafTone);
    this.groundCoverRecords.push({kind:'leaf',x,z,y:C.height(x,z),radius:length+.04,height:h+.016});
   }
  }
  const leafIndexCount=indices.length;
  for(const [patch,[cx,cz,rx,rz]]of scree.entries()){
   const random=B.random(93461+patch*947);
   const sx=(C.height(cx+.3,cz)-C.height(cx-.3,cz))/.6,sz=(C.height(cx,cz+.3)-C.height(cx,cz-.3))/.6,down=Math.max(.08,Math.hypot(sx,sz));
   for(let n=0;n<52;n++){const angle=random()*Math.PI*2,r=Math.sqrt(random()),x=cx-sx/down*rx*.48+Math.cos(angle)*r*rx,z=cz-sz/down*rz*.48+Math.sin(angle)*r*rz,size=.065+random()*.15,h=.022+random()*.065;
    if(!safe(x,z,size*1.3))continue;chipTone.copy(stoneA).lerp(stoneB,random()*.67);const rim=[],lower=[],phase=random()*Math.PI*2;
    for(let j=0;j<5;j++){const a=phase+j*Math.PI*2/5,scale=.85+random()*.15,px=x+Math.cos(a)*size*scale,pz=z+Math.sin(a)*size*.77*scale;rim.push(vertex(px,C.height(px,pz)+h*(.45+random()*.16),pz,chipTone,.94));lower.push(vertex(px,C.height(px,pz)-.022,pz,chipTone,.80));}
    const cap=vertex(x+size*.05,C.height(x+size*.05,z)+h,z,chipTone,1.02);
    for(let j=0;j<5;j++){const k=(j+1)%5;indices.push(cap,rim[k],rim[j],rim[j],rim[k],lower[j],lower[j],rim[k],lower[k]);}
    for(let j=1;j<4;j++)indices.push(lower[0],lower[j],lower[j+1]);
    this.groundCoverRecords.push({kind:'chip',x,z,y:C.height(x,z),radius:size*1.3,height:h});
   }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  // Leaves keep smooth bends; stone fragments keep their angular break faces.
  const flat=geometry.toNonIndexed(),p=flat.attributes.position,n=flat.attributes.normal,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  for(let i=leafIndexCount;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);const normal=b.sub(a).cross(c.sub(a)).normalize();for(let j=0;j<3;j++)n.setXYZ(i+j,normal.x,normal.y,normal.z);}geometry.dispose();
  const mesh=new T.Mesh(flat,this.commonGroundMaterial);mesh.receiveShadow=true;mesh.castShadow=true;mesh.matrixAutoUpdate=false;group.add(mesh);B.WorkshopShapes.partitionRigid(mesh,64);
 };
})(B2);
