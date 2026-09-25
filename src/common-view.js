/* Ridge Common: shared ground, worn paths, planted gardens and a water tower. */
'use strict';
(function(B){
 const T=THREE,C=B.COMMON;
 const mat=(hex,metalness=0)=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness:.9,metalness});
 function clip(points,axis,edge,side){
  const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],inside=side*(a[axis]-edge)>=0,next=side*(b[axis]-edge)>=0;
   if(inside)out.push(a);if(inside!==next){const t=(edge-a[axis])/(b[axis]-a[axis]),p=a.map((v,k)=>v+(b[k]-v)*t);p[axis]=edge;out.push(p);}
  }return out;
 }
 B.View.prototype.makeCommonGround=function(){
  this.surfaceGround=[];
  for(const [x0,z0,x1,z1] of [[-134,15.75,134,134],[-134,-134,134,-16.25],[-134,-16.25,-16.25,15.75],[47.75,-16.25,134,15.75]]){
   const pos=[],uv=[],indices=[],vertices=new Map();
   const vertex=p=>{const key=p[0]+','+p[2];if(!vertices.has(key)){vertices.set(key,pos.length/3);pos.push(...p);uv.push(p[0]*.2,p[2]*.2);}return vertices.get(key);};
   // Clip the original triangles at the fractional Surface Nets boundary. Merely
   // moving a grid column would change its diagonal and disagree with collision.
   for(let z=Math.floor(z0/2)*2;z<z1;z+=2)for(let x=Math.floor(x0/2)*2;x<x1;x+=2){
    const v=[[x,z],[x+2,z],[x,z+2],[x+2,z+2]].map(([px,pz])=>[px,C.height(px,pz),pz]);
    for(const tri of [[v[0],v[3],v[1]],[v[0],v[2],v[3]]]){
     let poly=tri;for(const [axis,edge,side] of [[0,x0,1],[0,x1,-1],[2,z0,1],[2,z1,-1]])poly=clip(poly,axis,edge,side);
     for(let i=1;i<poly.length-1;i++)indices.push(vertex(poly[0]),vertex(poly[i]),vertex(poly[i+1]));
    }
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
   const mesh=new T.Mesh(geo,this.palette.grass);mesh.receiveShadow=true;this.scene.add(mesh);this.surfaceGround.push(mesh);
  }
 };
 B.View.prototype.makeCommon=function(){
  const g=this.commonScene=new T.Group(),p=this.palette,rng=B.random(99273);this.scene.add(g);
  const bark=mat('#66513f'),barkLight=mat('#887050'),stone=mat('#827e66'),rockDark=mat('#626b61'),sand=mat('#8e7858'),path=mat('#a39374'),moss=mat('#747d55'),board=mat('#a4865b'),wood=mat('#68553e'),rust=mat('#865742'),iron=mat('#435354',.35),cream=mat('#d6c4a1');
  const leaves=[mat('#637c4e'),mat('#839657'),mat('#486647'),mat('#9aa665')],flowers=[mat('#d4ae5d'),mat('#bdc5b8'),mat('#aa7e8b')];
  const box=(...a)=>this.box(g,...a),cyl=(...a)=>this.cylinder(g,...a),height=C.height;
  const add=(geo,m,x,y,z)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  const beam=(a,b,r1,r2,m,sides=7)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=add(new T.CylinderGeometry(r2,r1,d.length(),sides),m,...av.add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;};
  const obstacle=(x,y,z,rx,ry,rz=rx)=>{const b=[x-rx,y,z-rz,x+rx,y+ry,z+rz];this.obstacles.push(b);return b;};
  // A strip conforms to the shared ground. Small irregular shoulders break up the
  // old ruler-straight concrete rectangles without obstructing a walking route.
  const ribbon=(points,width,material,offset,irregular)=>{
   const verts=[];
   for(let k=1;k<points.length;k++){
    const a=points[k-1],b=points[k],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,steps=Math.ceil(length/.7);
    for(let i=0;i<steps;i++){
     const corners=[];
     for(const t of [i/steps,(i+1)/steps])for(const side of [-1,1]){
      const x=a[0]+dx*t,z=a[1]+dz*t,w=width/2+(irregular ? .11*Math.sin(x*2.7+z*1.9)+.07*Math.cos(z*3.1-x) : 0),px=x+nx*w*side,pz=z+nz*w*side;
      corners.push([px,height(px,pz)+offset,pz]);
     }
     for(const j of [0,1,3,0,3,2])verts.push(...corners[j]);
    }
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();const m=new T.Mesh(geo,material);m.receiveShadow=true;g.add(m);return m;
  };
  for(const route of C.paths){
   ribbon(route.points,route.width+.4,sand,.019,true);ribbon(route.points,route.width,path,.034,true);
   // Individual edge stones and sparse gravel have distinct silhouettes at eye level.
   for(let k=1;k<route.points.length;k++){
    const a=route.points[k-1],b=route.points[k],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    for(let t=.6;t<len;t+=1.3+rng()*1.6)for(const side of [-1,1]){
     const x=a[0]+dx*t/len-dz/len*side*(route.width*.5+.16),z=a[1]+dz*t/len+dx/len*side*(route.width*.5+.16);
     const o=add(new T.DodecahedronGeometry(.10+rng()*.08,0),rng()>.5?stone:sand,x,height(x,z)+.045,z);o.scale.set(1.3,.4,1);
    }
   }
  }
  // Flagstones around the well, with irregular joints and a compact paved edge.
  for(let row=0;row<11;row++)for(let col=0;col<12;col++){
   const x=-1.05+col*1.02+(row%2)*.25,z=40.65+row*.93;
   if(x>10.6||Math.hypot(x-5,z-46)<1.25)continue;
   box(x,.025,z,.97,.05,.875,(row+col)%4?stone:cream);
  }
  this.commonTrees=[];
  const tree=(x,z,h,conifer=false)=>{
   const y=height(x,z),lean=(rng()-.5)*.55;this.commonTrees.push({x,y,z,height:h,conifer});
   beam([x,y-.06,z],[x+lean,y+h*.82,z+.12],.24,.065,bark,8);
   if(x>B.SURFACE.minX+.6&&x<B.SURFACE.maxX-.6&&z>B.SURFACE.minZ+.6&&z<B.SURFACE.maxZ-.6)obstacle(x,y,z,.27,h*.85);
   for(let j=0;j<(conifer?6:7);j++){
    const a=j*2.399+lean,r=conifer?.2:(j?1.1+rng()*.8:0),cx=x+Math.cos(a)*r,cz=z+Math.sin(a)*r,cy=y+h*(conifer?.32+j*.105:.75+rng()*.22);
    if(!conifer&&j)beam([x+lean*.5,y+h*.5,z],[cx,cy,cz],.085,.025,j%2?bark:barkLight,6);
    const geo=conifer?new T.ConeGeometry(h*(.3-j*.026),h*.31,9):new T.IcosahedronGeometry(1,1),aPos=geo.attributes.position;
    for(let i=0;i<aPos.count;i++){const vx=aPos.getX(i),vy=aPos.getY(i),vz=aPos.getZ(i),scale=1+.12*Math.sin(vx*7+vz*9+vy*5);aPos.setXYZ(i,vx*scale,vy*(1+.07*Math.sin(vz*8)),vz*scale);}
    geo.computeVertexNormals();const crown=add(geo,leaves[(j+(conifer?2:0))%leaves.length],cx,cy,cz);crown.rotation.y=a;
    if(!conifer)crown.scale.set(h*.24,h*.18,h*.22);
   }
   for(let j=0;j<3;j++){const a=j*2.1;beam([x+Math.cos(a)*.6,y-.02,z+Math.sin(a)*.6],[x,y+.4,z],.09,.06,bark);}
  };
  // Trees grow in stands with deliberate openings toward the shops and tower.
  for(const [cx,cz,count] of [[-43,20,9],[-39,-31,8],[29,-39,8],[45,36,6],[-40,54,7],[22,65,6],[69,39,8],[-73,4,9],[0,-70,10]]){
   for(let i=0;i<count;i++){const a=rng()*Math.PI*2,r=3+rng()*12,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(!C.planting(x,z,2)||Math.hypot(x-42,z-51)<7)continue;tree(x,z,5+rng()*4,i%4===0);}
  }
  for(const [x,z,h] of [[-1,36,5.5],[-18,43,5.8],[19,46,5.2],[-12,59,6.8]])tree(x,z,h);
  this.commonGardens=[];
  const garden=(x,z,w,d)=>{
   const y=height(x,z);box(x,y+.12,z,w,.24,d,sand);box(x,y+.08,z-d/2,w+.14,.16,.14,stone);box(x,y+.08,z+d/2,w+.14,.16,.14,stone);
   box(x-w/2,y+.08,z,.14,.16,d,stone);box(x+w/2,y+.08,z,.14,.16,d,stone);this.commonGardens.push({x,y,z,w,d});
   // The low edging can be stepped over. Large shrubs are visible, soft planting.
   for(let i=0;i<25;i++){const px=x+(rng()-.5)*(w-.4),pz=z+(rng()-.5)*(d-.35);if(Math.hypot(px-x,pz-z)<.6)continue;
    const h=.24+rng()*.3;beam([px,y+.16,pz],[px,y+h,pz],.018,.009,leaves[2],4);
    for(let j=0;j<3;j++){const leaf=add(new T.IcosahedronGeometry(.13,0),leaves[j],px+(j-1)*.075,y+h*.65,pz);leaf.scale.set(.6,1.1,.6);}
    add(new T.IcosahedronGeometry(.065,1),flowers[i%3],px,y+h,pz);
   }
  };
  for(const q of [[-1,36,3.8,2.8],[-18,43,3.6,2.6],[19,46,3.6,2.8],[-12,59,4.5,3]])garden(...q);
  // Perennial clumps and small broken strata stay on protected ground.
  const verge=this.verge=new T.Group();this.scene.add(verge);
  this.commonRocks=[];
  for(let i=0;i<1300;i++){
   const x=-56+rng()*112,z=-48+rng()*114;if(!C.planting(x,z,.4)||Math.hypot(x-42,z-51)<5)continue;
   if(Math.sin(x*.21+z*.13)+Math.cos(z*.27-x*.08)<-.5)continue;
   const y=height(x,z),h=.18+rng()*.32,verts=[];
   for(let j=0;j<5;j++){const a=rng()*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a),w=.04+rng()*.025,px=x+dx*.16,pz=z+dz*.16;verts.push(px-dz*w,height(px-dz*w,pz+dx*w),pz+dx*w,px+dz*w,height(px+dz*w,pz-dx*w),pz-dx*w,px+dx*.13,y+h,pz+dz*.13);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();verge.add(new T.Mesh(geo,leaves[i%4]));
   if(i%17===0){const o=add(new T.IcosahedronGeometry(.09,0),flowers[i%3],x,y+h,z);o.scale.y=.55;}
   if(i%31===0){const r=.22+rng()*.35,o=add(new T.DodecahedronGeometry(r,0),i%2?stone:rockDark,x,y+r*.28,z);o.scale.set(1.35,.55,.9);}
  }
  // Chunky weathered outcrops frame the slopes, away from all path shoulders.
  for(const [x,z,w,h,d] of [[-46,25,4.4,1.6,2.6],[-41,28,2.8,1.25,2],[-38,-37,4.2,1.6,2.8],[49,43,3.4,1.8,2.8],[35,62,3.8,1.7,2.5]]){
   const y=height(x,z);for(let j=0;j<3;j++){const o=add(new T.DodecahedronGeometry(1,0),j?stone:rockDark,x+(j-1)*w*.17,y+h*.3+j*.17,z+j*.28);o.scale.set(w*.55,h*.5,d*.55);o.rotation.y=.35*j;}
   this.commonRocks.push({x,y,z,bounds:obstacle(x,y,z,w*.58,h*1.1,d*.65)});
  }
  // A timber reservoir gives the ridge trail a visible destination and the town
  // a recognisable silhouette. It is scenery, not a hidden resource transaction.
  const tx=42,tz=51,ty=height(tx,tz);this.waterTower={x:tx,y:ty,z:tz};
  for(const dx of [-1.55,1.55])for(const dz of [-1.55,1.55]){
   const ground=height(tx+dx,tz+dz);
   beam([tx+dx,ground,tz+dz],[tx+dx*.82,ty+7.4,tz+dz*.82],.18,.14,wood);obstacle(tx+dx,ground,tz+dz,.45,ty+7.5-ground);
   box(tx+dx,ground+.13,tz+dz,.64,.26,.64,stone);
  }
  for(const side of [-1,1]){
   beam([tx-1.4,ty+1,tz+side*1.5],[tx+1.4,ty+6.7,tz+side*1.5],.065,.065,iron,5);
   beam([tx+side*1.5,ty+1,tz-1.4],[tx+side*1.5,ty+6.7,tz+1.4],.065,.065,iron,5);
  }
  box(tx,ty+7.4,tz,4.5,.22,4.5,wood);cyl(tx,ty+9.2,tz,2,2,3.4,board,28);
  for(let j=0;j<28;j++){const a=j/28*Math.PI*2;beam([tx+Math.cos(a)*2.01,ty+7.6,tz+Math.sin(a)*2.01],[tx+Math.cos(a)*2.01,ty+10.85,tz+Math.sin(a)*2.01],.026,.026,j%3?wood:cream,4);}
  for(const y of [7.85,9.3,10.65])cyl(tx,ty+y,tz,2.055,2.055,.12,iron,28);
  add(new T.ConeGeometry(2.3,1.15,28),rust,tx,ty+11.4,tz);cyl(tx,ty+12.05,tz,.08,.1,.45,iron,8);
  for(const x of [tx-.35,tx+.35])beam([x,ty,tz-2.18],[x,ty+8,tz-2.18],.045,.045,iron);
  for(let j=0;j<24;j++)beam([tx-.35,ty+.3+j*.32,tz-2.18],[tx+.35,ty+.3+j*.32,tz-2.18],.03,.03,iron,5);
  obstacle(tx,ty+7.25,tz,2.3,4.8);this.sign(g,'RIDGE RESERVOIR','BELL WORKS / BUILT TO LAST',tx,ty+9.1,tz-2.07,2.9,.75);
  // Seating faces back toward the claim. The path arrives to its eastern side.
  const benchY=Math.max(height(38.2,48),height(40.2,48));
  box(39.2,benchY+.48,48,2.6,.15,.65,board);box(39.2,benchY+.91,48.3,2.6,.68,.12,board);
  for(const x of [38.2,40.2]){const floor=height(x,48);box(x,(floor+benchY+.48)/2,48,.14,benchY+.48-floor,.5,iron);}obstacle(39.2,Math.min(height(38.2,48),height(40.2,48)),48,1.35,1.7,.4);
  // Replace the single enclosing slab with irregular dry-stone courses. Ground
  // and wall both follow the same rise; the traversal limit remains visible.
  const wall=(a,b)=>{const length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/1.6);for(let i=0;i<steps;i++){
   const t=(i+.5)/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,y=height(x,z),yaw=Math.atan2(a[1]-b[1],b[0]-a[0]);
   for(let row=0;row<3;row++)box(x,y+.18+row*.31,z,length/steps+.04,.30,row===2?.52:.66,row===1?moss:stone,yaw);
  }};
  wall([-58.3,-50.3],[-58.3,68.3]);wall([58.3,-50.3],[58.3,68.3]);wall([-58.3,-50.3],[58.3,-50.3]);wall([-58.3,68.3],[58.3,68.3]);
  this.merge(verge);this.merge(g);this.renderer.shadowMap.needsUpdate=true;
 };
})(B2);
