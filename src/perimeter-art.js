/* Original dry-stone boundary, grounded outside the shared traversal limits. */
'use strict';
(function(B){
 const T=THREE,C=B.COMMON;
 B.View.prototype.makeCommonPerimeter=function(){
  const root=this.perimeterScene=new T.Group();this.scene.add(root);this.perimeterStones=[];
  const material=this.commonRockMaterials[0].clone();material.color.setRGB(1,1,1);material.vertexColors=true;material.roughness=.97;B.TERRAIN_LOOK.apply(material);
  const tones=['#827e6a','#767a6b','#96907b','#6f7569'].map(hex=>new T.Color(hex).convertSRGBToLinear());
  const positions=[],colors=[],uv=[],normals=[],tone=new T.Color();
  const area=(a,b,c)=>new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));
  const tri=(a,b,c,shades)=>{const face=area(a,b,c).normalize();for(const [i,p]of [a,b,c].entries()){positions.push(...p);uv.push((p[0]+p[2])*.6,p[1]*.8);normals.push(...(shades?.[i]||face).toArray());const relative=p[1]-C.height(p[0],p[2]),moss=Math.max(0,.13-relative*.17);colors.push(tone.r*(1-moss*.20),tone.g*(1+moss*.08),tone.b*(1-moss*.10));}};
  const quad=(a,b,c,d)=>{const normal=area(a,b,c).add(area(b,d,c)).normalize();tri(a,b,c,[normal,normal,normal]);tri(b,d,c,[normal,normal,normal]);};
  const stone=(side,row,a,direction,start,end,random)=>{
   const along=(start+end)/2,length=end-start,depth=.47+random()*.045,cx=a[0]+direction[0]*along,cz=a[1]+direction[1]*along;
   const base=[-.10,.26,.555][row],top=[.35,.655,.935][row]+(random()-.5)*.10,cut=Math.min(length*.22,.11+random()*.09),hw=length/2,hd=depth/2;
   // Unequal front shoulders, rather than only chamfers in the top outline.
   const corner=Array.from({length:4},()=>.05+random()*.045);
   const outline=[[-hw+cut,base],[hw-cut*.8,base+.012],[hw,base+corner[0]],[hw,top-corner[1]],[hw-cut,top],[-hw+cut*.9,top+.018],[-hw,top-corner[2]],[-hw,base+corner[3]]];
   const slope=(random()-.5)*.035;
   const world=(x,z,offset)=>{const px=cx+direction[0]*x-direction[1]*z,pz=cz+direction[1]*x+direction[0]*z;return[px,C.height(px,pz)+offset,pz];};
   const rings=[-hd,hd].map(z=>outline.map(([x,y])=>world(x,z,y+x*slope)));
   tone.copy(tones[0]).lerp(tones[Math.floor(random()*tones.length)],.38).multiplyScalar(.97+random()*.06);
   const bulge=.008+random()*.015;
   for(const [face,ring]of rings.entries()){
    const center=world(0,(face?1:-1)*(hd+bulge),(base+top)/2),faces=[];
    for(let i=0;i<8;i++){const j=(i+1)%8;faces.push(area(center,ring[face?i:j],ring[face?j:i]));}
    const centerNormal=faces.reduce((n,f)=>n.add(f),new T.Vector3()).normalize(),edgeNormals=faces.map((f,i)=>f.clone().add(faces[(i+7)%8]).normalize());
    for(let i=0;i<8;i++){const j=(i+1)%8,a=face?i:j,b=face?j:i;tri(center,ring[a],ring[b],[centerNormal,edgeNormals[a],edgeNormals[b]]);}
   }
   for(let i=0;i<8;i++){const j=(i+1)%8;quad(rings[0][i],rings[0][j],rings[1][i],rings[1][j]);}
   this.perimeterStones.push({side,row,x:cx,z:cz,y:C.height(cx,cz),length,depth,base,top});
  };
  const routes=[[[-58.3,-50.3],[-58.3,68.3]],[[58.3,-50.3],[58.3,68.3]],[[-58.3,-50.3],[58.3,-50.3]],[[-58.3,68.3],[58.3,68.3]]];
  for(const [side,[a,b]]of routes.entries()){
   const length=Math.hypot(b[0]-a[0],b[1]-a[1]),direction=[(b[0]-a[0])/length,(b[1]-a[1])/length];
   // A narrow buried rubble heart closes through-joints behind the face stones.
   const point=(along,across,y)=>{const x=a[0]+direction[0]*along-direction[1]*across,z=a[1]+direction[1]*along+direction[0]*across;return[x,C.height(x,z)+y,z];};
   const steps=Math.ceil(length/2);tone.copy(tones[0]).multiplyScalar(.73);
   for(let i=0;i<steps;i++){
    const lo=i/steps*length,hi=(i+1)/steps*length,p=[point(lo,-.10,-.10),point(hi,-.10,-.10),point(lo,.10,-.10),point(hi,.10,-.10)],q=[point(lo,-.10,.83),point(hi,-.10,.83),point(lo,.10,.83),point(hi,.10,.83)];
    quad(p[0],q[0],p[1],q[1]);quad(p[2],p[3],q[2],q[3]);quad(q[0],q[2],q[1],q[3]);quad(p[0],p[1],p[2],p[3]);
    if(i===0)quad(p[0],p[2],q[0],q[2]);if(i===steps-1)quad(p[1],q[1],p[3],q[3]);
   }
   for(let row=0;row<3;row++){
    const random=B.random(190631+side*709+row*1531);let cursor=-row*.43;
    while(cursor<length){const next=Math.min(length,cursor+(row===0?1.3:row===1?.85:1.05)+random()*.7),start=Math.max(0,cursor);if(next-start>.12)stone(side,row,a,direction,start+.012,next-.012,random);cursor=next;}
   }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;root.add(mesh);B.WorkshopShapes.partitionRigid(mesh,64);
 };
})(B2);
