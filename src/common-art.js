/* Original masonry and public seating, built at the shared contact coordinates. */
'use strict';
(function(B){
 const T=THREE;
 B.View.prototype.makeCommonFurniture=function(){
  const g=this.furnitureScene=new T.Group();this.scene.add(g);
  const mat=(color,metalness=0)=>new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),metalness,roughness:metalness?.56:.89});
  const stone=[mat('#929483'),mat('#aba995'),mat('#7b8376')],mortar=mat('#626a60'),iron=mat('#354c48',.65),brass=mat('#af9867',.55);
  for(const m of stone)B.TERRAIN_LOOK.apply(m);
  const wood=this.yardArtMaterials.wood.clone();wood.color.set('#baa078').convertSRGBToLinear();
  const water=mat('#254e51',.25);water.roughness=.20;
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  const box=(x,y,z,w,h,d,m)=>this.box(g,x,y,z,w,h,d,m);
  const tube=(points,r,material)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),12,r,7,false),material);
  const plank=(x,y,z,w,h,d)=>{
   const shape=new T.Shape();shape.moveTo(-w/2,-d/2);shape.lineTo(w/2,-d/2);shape.lineTo(w/2,d/2);shape.lineTo(-w/2,d/2);shape.closePath();
   const geo=new T.ExtrudeGeometry(shape,{depth:h-.024,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.012,bevelThickness:.012});geo.translate(0,0,-(h-.024)/2);geo.rotateX(-Math.PI/2);return add(geo,wood,x,y,z);
  };
  const w=B.TOWN.well;
  // Every block has an inner face; the well is an open ring, not a capped cylinder.
  const arc=(a0,a1,y0,y1,r0,r1,material)=>{
   const pos=[],idx=[],n=Math.max(3,Math.ceil((a1-a0)/Math.PI*24));
   for(const y of [y0,y1])for(const r of [r0,r1])for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pos.push(w.x+Math.cos(a)*r,y,w.z+Math.sin(a)*r);}
   const row=n+1;
   for(let i=0;i<n;i++){
    const a=i,b=i+1,c=row+i,d=row+i+1,e=2*row+i,f=e+1,h=3*row+i,k=h+1;
    idx.push(a,e,b,b,e,f,c,d,h,d,k,h,e,h,f,f,h,k,a,b,c,b,d,c);
   }
   idx.push(0,row,2*row,row,3*row,2*row,n,2*row+n,row+n,row+n,2*row+n,3*row+n);
   for(let i=0;i<idx.length;i+=3)[idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);const flat=geo.toNonIndexed();geo.dispose();flat.computeVertexNormals();return add(flat,material);
  };
  arc(0,Math.PI*2,.04,.77,w.inner+.015,w.outer-.10,mortar);
  for(let course=0;course<3;course++)for(let j=0;j<16;j++){
   const phase=course%2*Math.PI/16,a=j/16*Math.PI*2+phase;
   arc(a+.009,a+Math.PI/8-.009,.06+course*.235,.28+course*.235,w.inner,w.outer-.05,stone[(j+course*2)%3]);
  }
  for(let j=0;j<16;j++){const a=j*Math.PI/8;arc(a+.008,a+Math.PI/8-.008,.79,w.top,w.inner-.045,w.outer,stone[j%3]);}
  const pool=add(new T.CircleGeometry(w.inner-.055,32),water,w.x,.19,w.z);pool.rotation.x=-Math.PI/2;pool.castShadow=false;
  for(const r of [.24,.47,.66]){const ring=add(new T.TorusGeometry(r,.005,4,40),water,w.x,.198,w.z);ring.rotation.x=-Math.PI/2;ring.castShadow=false;}
  // A low spill lip and drain give the basin a manufactured second read.
  box(w.x,.30,w.z-w.outer+.055,.24,.28,.11,iron);box(w.x,.405,w.z-w.outer+.11,.28,.05,.18,brass);
  for(let j=0;j<4;j++)box(w.x-.082+j*.055,.306,w.z-w.outer-.007,.018,.20,.022,mortar);
  this.furnitureBounds=[[w.x-w.outer,0,w.z-w.outer,w.x+w.outer,w.top,w.z+w.outer]];
  for(const b of B.TOWN.benches()){
   const {x,y,z,width,depth,back}=b;
   // Five separated seat slats, three reclined back slats and bolted curved frames.
   for(let j=0;j<5;j++)plank(x,y+.49+.012*Math.sin(j/4*Math.PI),z-depth/2+.065+j*(depth-.13)/4,width-.04,.075,.10);
   for(let j=0;j<3;j++){const board=plank(x,y+.77+j*.14,z+back*(.29+j*.028),width-.04,.075,.115);board.rotation.x=back*(Math.PI/2-.12);}
   for(const side of [-1,1]){
    const sx=x+side*(width/2-.29),floor=B.COMMON.height(sx,z),rear=z+back*.26;
    tube([[sx,floor+.03,z-back*.24],[sx,y+.36,z-back*.20],[sx,y+.45,z],[sx,y+.49,rear],[sx,y+.76,rear+back*.045],[sx,y+1.13,rear+back*.09]],.035,iron);
    tube([[sx,floor+.03,rear+back*.055],[sx,y+.27,rear],[sx,y+.47,rear]],.035,iron);
    tube([[sx,y+.48,z-back*.12],[sx,y+.64,z-back*.13],[sx,y+.70,z+back*.02],[sx,y+.70,rear],[sx,y+.78,rear+back*.035]],.029,iron);
    box(sx,floor+.035,z-back*.24,.15,.06,.17,iron);box(sx,floor+.035,rear+back*.055,.15,.06,.17,iron);
    for(let j=0;j<5;j++){const bolt=add(new T.CylinderGeometry(.015,.015,.016,6),brass,sx,y+.54,z-depth/2+.065+j*(depth-.13)/4);bolt.castShadow=false;}
   }
   box(x,y+.36,z,width-.46,.045,.04,iron);
   this.furnitureBounds.push([x-width/2-.03,y,z-depth/2-.09,x+width/2+.03,y+1.18,z+depth/2+.13]);
  }
  this.merge(g,true);this.renderer.shadowMap.needsUpdate=true;
 };
})(B2);
