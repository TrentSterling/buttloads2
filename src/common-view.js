/* Ridge Common: shared ground, worn paths, planted gardens and a water tower. */
'use strict';
(function(B){
 const T=THREE,C=B.COMMON;
 B.CANOPY_ART={index(geometry){
  // The static merger expands every leaf into independent triangle records.
  // Share only bit-identical complete records; UV and normal seams stay split.
  const rows=Object.entries(geometry.attributes),count=geometry.attributes.position?.count;
  if(!count||count%3||geometry.index||geometry.groups.length||geometry.drawRange.start!==0||geometry.drawRange.count!==Infinity||Object.keys(geometry.morphAttributes).length)throw Error('Canopy indexing requires a complete unindexed static geometry');
  for(const [,a]of rows)if(a.isInterleavedBufferAttribute||!(a.array instanceof Float32Array)||a.count!==count||!a.array.every(Number.isFinite))throw Error('Canopy indexing requires finite aligned Float32 attributes');
  const bits=rows.map(([,a])=>new Uint32Array(a.array.buffer,a.array.byteOffset,a.array.length)),sourceIds=[],buckets=new Map(),indices=new Array(count);
  const equal=(a,b)=>rows.every(([,attr],k)=>{for(let j=0;j<attr.itemSize;j++)if(bits[k][a*attr.itemSize+j]!==bits[k][b*attr.itemSize+j])return false;return true;});
  for(let i=0;i<count;i++){
   let hash=2166136261;for(let k=0;k<rows.length;k++)for(let j=0;j<rows[k][1].itemSize;j++)hash=Math.imul(hash^bits[k][i*rows[k][1].itemSize+j],16777619)>>>0;
   let candidates=buckets.get(hash),id;
   if(candidates!==undefined)for(const candidate of typeof candidates==='number'?[candidates]:candidates)if(equal(i,sourceIds[candidate])){id=candidate;break;}
   if(id===undefined){id=sourceIds.length;sourceIds.push(i);if(candidates===undefined)buckets.set(hash,id);else if(typeof candidates==='number')buckets.set(hash,[candidates,id]);else candidates.push(id);}
   indices[i]=id;
  }
  const result=new T.BufferGeometry();
  for(const [name,a]of rows){const array=new Float32Array(sourceIds.length*a.itemSize);for(let i=0;i<sourceIds.length;i++)array.set(a.array.subarray(sourceIds[i]*a.itemSize,(sourceIds[i]+1)*a.itemSize),i*a.itemSize);result.setAttribute(name,new T.BufferAttribute(array,a.itemSize,a.normalized).setUsage(a.usage));}
  result.setIndex(indices);result.computeBoundingBox();result.computeBoundingSphere();return result;
 }};
 const mat=(hex,metalness=0)=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness:.9,metalness});
 const fade=(a,b,value)=>{const t=B.clamp((value-a)/(b-a),0,1);return t*t*(3-2*t);};
 const groundNoise=(x,z)=>{
  const ix=Math.floor(x),iz=Math.floor(z),u=fade(0,1,x-ix),v=fade(0,1,z-iz);
  const hash=(a,b)=>{const h=Math.sin(a*127.1+b*311.7+94.3)*43758.5453;return h-Math.floor(h);};
  const a=hash(ix,iz)*(1-u)+hash(ix+1,iz)*u,b=hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u;return a*(1-v)+b*v;
 };
 const groundTones={grass:new T.Color('#536d4d').convertSRGBToLinear(),dry:new T.Color('#9b8c69').convertSRGBToLinear(),soil:new T.Color('#796e57').convertSRGBToLinear(),damp:new T.Color('#496757').convertSRGBToLinear(),join:new T.Color('#71854e').convertSRGBToLinear()};
 B.COMMON_FINISH={
  sample(x,z){
   const broad=groundNoise(x*.075,z*.075),fine=groundNoise(x*.23+19,z*.23-11);
   const dry=fade(.33,.77,broad*.78+fine*.22),damp=fade(.55,.88,groundNoise(x*.095-41,z*.095+27));
   return {dry,damp};
  },
  color(x,z,slope,out=new T.Color()){
   const f=this.sample(x,z),variation=groundNoise(x*.37,z*.37);
   const cover=B.GROUND_COVER?.coverage(x,z)||{green:0,scree:0};
   out.copy(groundTones.grass).lerp(groundTones.dry,f.dry*.38).lerp(groundTones.damp,f.damp*.26+cover.green*.14);
   out.lerp(groundTones.soil,fade(.10,.42,slope)*(.13+f.dry*.26)+cover.scree*.28);out.multiplyScalar(.91+variation*.13);
   // Keep the excavatable field joins from acquiring a cosmetic colour seam.
   const join=Math.hypot(Math.max(-16.25-x,0,x-47.75),Math.max(-16.25-z,0,z-15.75));
   return out.lerp(groundTones.join,1-fade(0,4,join));
  }
 };
 function clip(points,axis,edge,side){
  const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],inside=side*(a[axis]-edge)>=0,next=side*(b[axis]-edge)>=0;
   if(inside)out.push(a);if(inside!==next){const t=(edge-a[axis])/(b[axis]-a[axis]),p=a.map((v,k)=>v+(b[k]-v)*t);p[axis]=edge;out.push(p);}
  }return out;
 }
 function clipEdge(points,a,b,side){
  const value=p=>side*((b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0])),out=[];
  for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length],u=value(p),v=value(q),inside=u>=-1e-8,next=v>=-1e-8;if(inside)out.push(p);if(inside!==next){const t=u/(u-v);out.push(p.map((n,k)=>n+(q[k]-n)*t));}}return out;
 }
 // Shared native blade construction for the common, meadow and working yard.
 // Indexed stations keep the bend smooth without adding a texture or alpha pass.
 B.GrassShapes={
  buffer(wind=false){const data={position:[],color:[],indices:[]};if(wind)data.windWeight=[];return data;},
  blade(data,x,z,angle,h,width,lean,color,phase=0,short=false){
   const offset=data.position.length/3,dx=Math.cos(angle),dz=Math.sin(angle),root=C.height(x,z),shade=color||{r:1,g:1,b:1};
   const point=(t,side,w)=>{
    const bend=lean*Math.pow(t,1.75),twist=.24*Math.sin(t*1.57+phase),px=x+dx*bend-dz*w*side,pz=z+dz*bend+dx*w*side;
    const y=Math.max(root+.005+h*Math.sin(t*1.15)/Math.sin(1.15)+width*side*Math.sin(twist),C.height(px,pz)+.005);
    data.position.push(px,y,pz);const tone=.84+t*.18;data.color.push(shade.r*tone,shade.g*tone,shade.b*tone);if(data.windWeight)data.windWeight.push(t*t);
   };
   const stations=short?[[0,.45],[.54,.65]]:h>.26?[[0,.38],[.25,.85],[.50,.64],[.76,.32]]:[[0,.38],[.32,.82],[.68,.42]];
   for(const [t,w]of stations){point(t,-1,width*w);point(t,1,width*w);}point(1,0,0);
   for(let j=0;j<stations.length-1;j++){const a=offset+j*2,b=a+1,c=a+2,d=a+3;data.indices.push(a,c,b,b,c,d);}const a=offset+(stations.length-1)*2;data.indices.push(a,a+2,a+1);
  },
  geometry(data){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(data.position,3));geo.setAttribute('color',new T.Float32BufferAttribute(data.color,3));if(data.windWeight)geo.setAttribute('windWeight',new T.Float32BufferAttribute(data.windWeight,1));geo.setIndex(data.indices);geo.computeVertexNormals();return geo;}
 };
 B.View.prototype.makeCommonGround=function(){
  this.surfaceGround=[];
  const finish=this.commonGroundMaterial=this.palette.grass.clone();finish.color.set(0xffffff);finish.vertexColors=true;B.TERRAIN_LOOK.apply(finish,true);
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
   const colors=[],normal=geo.attributes.normal,color=new T.Color();for(let i=0;i<pos.length/3;i++){B.COMMON_FINISH.color(pos[i*3],pos[i*3+2],1-normal.getY(i),color);colors.push(color.r,color.g,color.b);}
   geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
   const mesh=new T.Mesh(geo,finish);mesh.receiveShadow=true;this.scene.add(mesh);this.surfaceGround.push(mesh);
  }
 };
 B.View.prototype.makeCommon=function(){
  const g=this.commonScene=new T.Group(),p=this.palette,rng=B.random(99273);this.scene.add(g);
  const bark=mat('#66513f'),barkLight=mat('#887050'),stone=mat('#827e66'),rockDark=mat('#626b61'),sand=mat('#8e7858'),path=mat('#a39374'),moss=mat('#747d55'),board=mat('#a4865b'),wood=mat('#68553e'),rust=mat('#865742'),iron=mat('#435354',.35),cream=mat('#d6c4a1');
  const leaves=[mat('#637c4e'),mat('#839657'),mat('#486647'),mat('#9aa665')],flowers=[mat('#d4ae5d'),mat('#bdc5b8'),mat('#aa7e8b')];
  for(const m of [bark,barkLight]){m.map=this.yardArtMaterials.wood.map;m.bumpMap=m.map;m.bumpScale=.028;}
  for(const m of [...leaves,...flowers])m.side=T.DoubleSide;
  for(const m of leaves)m.vertexColors=true;
  for(const m of [stone,rockDark])B.TERRAIN_LOOK.apply(m);
  for(const m of [sand,path])B.TERRAIN_LOOK.apply(m);
  this.commonRockMaterials=[stone,rockDark,moss];
  const box=(...a)=>this.box(g,...a),cyl=(...a)=>this.cylinder(g,...a),height=C.height;
  const add=(geo,m,x,y,z)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  const beam=(a,b,r1,r2,m,sides=7)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=add(new T.CylinderGeometry(r2,r1,d.length(),sides),m,...av.add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;};
  const obstacle=(x,y,z,rx,ry,rz=rx)=>{const b=[x-rx,y,z-rz,x+rx,y+ry,z+rz];this.obstacles.push(b);return b;};
  // A strip conforms to the shared ground. Small irregular shoulders break up the
  // old ruler-straight concrete rectangles without obstructing a walking route.
  const ribbon=(points,width,material,offset,irregular)=>{
   const verts=[];
   const paint=poly=>{
    const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[2]);
    for(let gz=Math.floor(Math.min(...zs)/2)*2;gz<Math.max(...zs)+1e-6;gz+=2)for(let gx=Math.floor(Math.min(...xs)/2)*2;gx<Math.max(...xs)+1e-6;gx+=2){
     for(const tri of [[[gx,gz],[gx+2,gz+2],[gx+2,gz]],[[gx,gz],[gx,gz+2],[gx+2,gz+2]]]){
      let clipped=poly;for(let j=0;j<3&&clipped.length;j++)clipped=clipEdge(clipped,tri[j],tri[(j+1)%3],-1);
      for(let j=1;j<clipped.length-1;j++)for(const p of [clipped[0],clipped[j],clipped[j+1]])verts.push(p[0],height(p[0],p[2])+offset,p[2]);
     }
    }
   };
   for(let k=1;k<points.length;k++){
    const a=points[k-1],b=points[k],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,steps=Math.ceil(length/.7);
    for(let i=0;i<steps;i++){
     const corners=[];
     for(const t of [i/steps,(i+1)/steps])for(const side of [-1,1]){
      const x=a[0]+dx*t,z=a[1]+dz*t,w=width/2+(irregular ? .11*Math.sin(x*2.7+z*1.9)+.07*Math.cos(z*3.1-x) : 0),px=x+nx*w*side,pz=z+nz*w*side;
      corners.push([px,height(px,pz)+offset,pz]);
     }
     // Split at the ground's exact triangle edges. A ribbon crossing a terrain
     // diagonal otherwise sinks under convex rises despite correct corner heights.
     paint([corners[0],corners[1],corners[3],corners[2]]);
    }
   }
   // Conforming round joins close the exterior wedge between turning segments.
   for(const [x,z]of points.slice(1,-1)){const poly=[];for(let i=0;i<12;i++){const a=-i/12*Math.PI*2,r=width/2+.18;poly.push([x+Math.cos(a)*r,0,z+Math.sin(a)*r]);}paint(poly);}
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
  box(4.72,-.015,45.30,12.75,.046,10.28,sand);
  for(let row=0;row<11;row++)for(let col=0;col<12;col++){
   const x=-1.05+col*1.02+(row%2)*.25,z=40.65+row*.93;
   if(x>10.6||Math.hypot(x-5,z-46)<1.25)continue;
   box(x,.025,z,.97,.05,.875,(row+col)%4?stone:cream);
  }
  this.commonTrees=[];this.rootContacts=[];
  const woodGeometry=pos=>{
   const uv=[];for(let i=0;i<pos.length;i+=3)uv.push(pos[i]*3,pos[i+1]*3);
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();return geo;
  };
  // One shared cutout atlas keeps the many small leaves in one tree material.
  // Left: a veined broadleaf. Right: a short fir shoot with paired needles.
  const canopyCanvas=document.createElement('canvas');canopyCanvas.width=canopyCanvas.height=512;
  const cc=canopyCanvas.getContext('2d'),atlasRandom=B.random(391854);
  const leafPath=()=>{cc.beginPath();cc.moveTo(128,480);cc.bezierCurveTo(22,404,20,225,92,126);cc.bezierCurveTo(110,96,125,60,128,28);cc.bezierCurveTo(148,105,232,171,231,293);cc.bezierCurveTo(232,388,178,447,128,480);cc.closePath();};
  leafPath();const leafShade=cc.createLinearGradient(30,260,235,260);leafShade.addColorStop(0,'#b1bf98');leafShade.addColorStop(.45,'#f2f0d3');leafShade.addColorStop(.53,'#ced6b1');leafShade.addColorStop(1,'#b6c99d');cc.fillStyle=leafShade;cc.fill();cc.save();cc.clip();
  cc.strokeStyle='#a5b681';cc.lineWidth=2;for(let j=0;j<10;j++){const y=120+j*32;for(const side of [-1,1]){cc.beginPath();cc.moveTo(128,y+24);cc.quadraticCurveTo(128+side*44,y+8,128+side*(65+25*Math.sin(j*.31)),y-32);cc.stroke();}}
  for(let j=0;j<650;j++){cc.fillStyle=atlasRandom()>.5?'#ffffff12':'#7f925412';cc.fillRect(28+atlasRandom()*210,75+atlasRandom()*390,1.4,2.2);}cc.restore();
  cc.strokeStyle='#e6e7c6';cc.lineWidth=3;cc.beginPath();cc.moveTo(128,491);cc.quadraticCurveTo(123,269,128,39);cc.stroke();
  cc.lineCap='round';cc.strokeStyle='#acb391';cc.lineWidth=4;cc.beginPath();cc.moveTo(384,491);cc.quadraticCurveTo(373,230,386,30);cc.stroke();
  for(let j=0;j<55;j++)for(const side of [-1,1]){
   const y=49+j*7.9+(atlasRandom()-.5)*7,l=(14+58*Math.sin(j/58*Math.PI))*(.55+atlasRandom()*.7),x=382+Math.sin(j*.19)*3,slope=.24+atlasRandom()*.72,w=1.8+atlasRandom()*1.4;
   cc.fillStyle=['#c2d5b3','#e5ead2','#afc69e'][j%3];cc.beginPath();cc.moveTo(x,y);cc.quadraticCurveTo(x+side*l*.48,y-l*slope*.34-w,x+side*l,y-l*slope);cc.quadraticCurveTo(x+side*l*.5,y-l*slope*.32+w,x,y+2);cc.closePath();cc.fill();
   cc.strokeStyle='#e8efdc';cc.lineWidth=.75;cc.beginPath();cc.moveTo(x+side*4,y);cc.lineTo(x+side*l*.86,y-l*slope*.81);cc.stroke();
  }
  const canopyMap=new T.CanvasTexture(canopyCanvas);canopyMap.encoding=T.sRGBEncoding;canopyMap.anisotropy=8;
  const canopyMaterial=mat('#ffffff');canopyMaterial.map=canopyMap;canopyMaterial.alphaTest=.26;canopyMaterial.side=T.DoubleSide;canopyMaterial.vertexColors=true;canopyMaterial.emissive.set('#405a32').convertSRGBToLinear();canopyMaterial.emissiveIntensity=.045;
  this.canopyMaterial=canopyMaterial;
  const foliageGeometry=(pos,colors,uv,indices)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;};
  // Four faces fold each rectangular carrier around its raised midrib. The
  // atlas supplies the actual small leaf or many-needle shoot outline.
  const foliageCard=(pos,colors,uv,indices,base,angle,length,half,roll,pitch,tone,fir=false)=>{
   const dx=Math.cos(angle),dz=Math.sin(angle),offset=pos.length/3;
   for(const [t,side]of [[0,-1],[0,0],[0,1],[1,-1],[1,0],[1,1]]){
    const along=length*t,across=half*side,lift=-Math.abs(side)*length*.065;
    pos.push(base[0]+dx*along*Math.cos(pitch)-dz*across*Math.cos(roll),base[1]+Math.sin(pitch)*along+Math.sin(roll)*across+lift-length*.08*t*t,base[2]+dz*along*Math.cos(pitch)+dx*across*Math.cos(roll));
    colors.push(tone.r*(1-.04*t),tone.g*(1-.035*t),tone.b*(1-.025*t));uv.push((fir?.75:.25)+side*.21,.04+t*.92);
   }
   for(const [a,b,c]of [[0,3,1],[1,3,4],[1,4,2],[2,4,5]])indices.push(offset+a,offset+b,offset+c);
  };
  const leafTone=(material,t)=>material.color.clone().multiplyScalar(1.25+t*.24);
  const crownGeometry=(seed,material)=>{
   const random=B.random(seed),pos=[],colors=[],uv=[],indices=[],twigs=[],phase=random()*6.28;
   // Eight branching shoots carry seven smaller leaves each, with an open centre
   // and varied inclination rather than a radial umbrella of large discs.
   for(let j=0;j<8;j++){
    const a=phase+j*2.399,root=[0,-.21,0],reach=.70+random()*.30,tilt=-.16+random()*.94;
    const tip=[root[0]+Math.cos(a)*reach,root[1]+tilt,root[2]+Math.sin(a)*reach*.85];
    const ring=[];for(let k=0;k<3;k++){const q=k/3*Math.PI*2;ring.push([root[0]-Math.sin(a)*.008*Math.cos(q),root[1]+.008*Math.sin(q),root[2]+Math.cos(a)*.008*Math.cos(q)]);}for(let k=0;k<3;k++)for(const v of [ring[k],tip,ring[(k+1)%3]])twigs.push(...v);
    for(let k=0;k<7;k++){
     const t=.17+k*.119,side=k%2?1:-1,base=[root[0]+(tip[0]-root[0])*t,root[1]+(tip[1]-root[1])*t,root[2]+(tip[2]-root[2])*t];
     const length=.24+random()*.14,roll=(random()-.5)*1.7,pitch=-.28+random()*.50;
     foliageCard(pos,colors,uv,indices,base,a+side*(.72+random()*.32),length,length*(.25+random()*.045),roll,pitch,leafTone(material,random()));
    }
   }
   const geo=foliageGeometry(pos,colors,uv,indices);geo.userData.twigs=woodGeometry(twigs);return geo;
  };
  const bent=(points,r0,r1,m,segments=5,sides=6)=>{
   const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),geo=new T.TubeGeometry(curve,segments,1,sides,false),attr=geo.attributes.position;
   for(let j=0;j<=segments;j++){const c=curve.getPointAt(j/segments),r=r0+(r1-r0)*j/segments;for(let i=0;i<=sides;i++){const k=j*(sides+1)+i;attr.setXYZ(k,c.x+(attr.getX(k)-c.x)*r,c.y+(attr.getY(k)-c.y)*r,c.z+(attr.getZ(k)-c.z)*r);}}
   geo.computeVertexNormals();return add(geo,m,0,0,0);
  };
  const leafSpray=(x,y,z,angle,size,material)=>{
   const pos=[],colors=[],uv=[],indices=[];
   beam([x-Math.cos(angle)*size*.85,y,z-Math.sin(angle)*size*.85],[x+Math.cos(angle)*size*.85,y,z+Math.sin(angle)*size*.85],.009,.004,barkLight,4);
   for(let j=0;j<8;j++){
    const along=(j/7-.5)*size*1.7,side=j%2?1:-1,base=[x+Math.cos(angle)*along,y,z+Math.sin(angle)*along],length=size*(.21+(j%3)*.025);
    foliageCard(pos,colors,uv,indices,base,angle+side*(.75+j*.035),length,length*.27,.85*Math.sin(j*1.4+angle),-.18+.14*Math.sin(j*1.73),leafTone(material,j%3/3));
   }
   add(foliageGeometry(pos,colors,uv,indices),canopyMaterial,0,0,0);
  };
  const pineBough=(base,angle,length,random,material)=>{
   const dx=Math.cos(angle),dz=Math.sin(angle),point=t=>[base[0]+dx*length*t,base[1]+length*(.13*Math.sin(t*Math.PI)-.15*t*t),base[2]+dz*length*t];
   const middle=point(.55),tip=point(1);beam(base,middle,.026,.014,bark,5);beam(middle,tip,.014,.005,barkLight,4);
   const pos=[],colors=[],uv=[],indices=[],twigs=[];
   for(let j=0;j<7;j++)for(const side of [-1,1]){
    const t=.14+j*.124,p=point(t),reach=length*(.60+.13*random())*Math.sin(t*Math.PI),a=angle+side*(.9+.22*random()),sx=Math.cos(a),sz=Math.sin(a);
    const twigTip=[p[0]+sx*reach*.88,p[1]-.055*reach,p[2]+sz*reach*.88],edge=[p[0]-sz*.004,p[1],p[2]+sx*.004],other=[p[0]+sz*.004,p[1],p[2]-sx*.004];for(const v of [edge,twigTip,other])twigs.push(...v);
    for(let k=0;k<3;k++){
     const along=.12+k*.25,spread=(k%2?1:-1)*.48,l=reach*(.62+.06*(k%3)),base=[p[0]+sx*reach*along,p[1]+reach*(.08*Math.sin(along*Math.PI)-.08*along),p[2]+sz*reach*along];
     foliageCard(pos,colors,uv,indices,base,a+spread,l,l*.31,k*2.399+side*.7,-.12+.09*Math.sin(k*1.9+j),leafTone(material,.24+(j%3)*.12),true);
    }
   }
   add(foliageGeometry(pos,colors,uv,indices),canopyMaterial,0,0,0);add(woodGeometry(twigs),barkLight,0,0,0);
  };
  const tree=(x,z,h,conifer=false)=>{
   // Preserve the original placement stream; construction variation uses its own seed.
   for(let i=0;i<(conifer?1:14);i++)rng();
   const y=height(x,z),random=B.random(Math.round((x+140)*1271+(z+140)*137)),lean=(random()-.5)*1.15,phase=random()*6.28;this.commonTrees.push({x,y,z,height:h,conifer});
   const trunkPoints=[[x,y-.22,z],[x+lean*.18,y+h*.30,z+.05],[x+lean*.75,y+h*.63,z-.11],[x+lean,y+h*.94,z+.10]];
   bent(trunkPoints,.24,.026,bark);
   if(x>B.SURFACE.minX+.6&&x<B.SURFACE.maxX-.6&&z>B.SURFACE.minZ+.6&&z<B.SURFACE.maxZ-.6)obstacle(x,y,z,.27,h*.85);
   if(conifer){
    // Individually curved boughs spiral up the trunk; there are no crown blobs.
    const count=36+Math.floor(random()*5);
    for(let j=0;j<count;j++){
     const t=j/(count-1),cy=y+h*(.20+t*.75),a=phase+j*2.399+(random()-.5)*.55,r=h*(.26*(1-t)+.027)*(.76+random()*.38);
     pineBough([x+lean*(.18+t*.8),cy,z+.04*Math.sin(t*6)],a,r,random,leaves[j%4===0?0:2]);
    }
   }else{
    const trunk=new T.CatmullRomCurve3(trunkPoints.map(p=>new T.Vector3(...p)));
    // Branch collars follow the actual curved trunk, at unequal heights. Four
    // primary boughs carry divided limbs instead of eight identical long forks.
    const trunkAt=level=>{let lo=0,hi=1;for(let i=0;i<24;i++){const t=(lo+hi)/2;if(trunk.getPoint(t).y<y+h*level)lo=t;else hi=t;}return trunk.getPoint((lo+hi)/2);};
    let cluster=0;
    const crown=(anchor,angle)=>{
     const j=cluster++,leafMaterial=leaves[(j+Math.floor(random()*3))%4],geo=crownGeometry(j*93+Math.floor(x*17+z*23),leafMaterial),sy=h*(.165+random()*.045);
     // The local shoot root is y=-.21. Apply its scaled offset exactly, so
     // small and large trees both meet the parent limb without a visible gap.
     const o=add(geo,canopyMaterial,anchor.x,anchor.y+.21*sy,anchor.z);o.scale.set(h*(.145+random()*.035),sy,h*(.15+random()*.025));o.rotation.y=angle;
     const stems=add(geo.userData.twigs,barkLight,o.position.x,o.position.y,o.position.z);stems.scale.copy(o.scale);stems.rotation.copy(o.rotation);
     for(let k=0;k<2;k++){const a2=angle+(k?1:-1)*.95;leafSpray(anchor.x+Math.cos(a2)*h*.11,anchor.y,anchor.z+Math.sin(a2)*h*.11,a2,h*.14,leaves[(j+k)%4]);}
    };
    for(let j=0;j<4;j++){
     const angle=phase+j*2.399+(random()-.5)*.5,root=trunkAt(.50+j*.065+random()*.025),reach=h*(.15+random()*.10),tip=trunkAt(.69+j*.037+random()*.025);
     tip.x+=Math.cos(angle)*reach;tip.z+=Math.sin(angle)*reach;
     const elbow=root.clone().lerp(tip,.49);elbow.y+=h*.018;elbow.x+=Math.sin(angle)*h*.018;
     const points=[root,elbow,tip],bough=new T.CatmullRomCurve3(points);bent(points.map(p=>p.toArray()),h*(.011+random()*.003),h*.005,bark,4);
     for(let k=0;k<2;k++){
      const side=k?1:-1,split=bough.getPointAt(.64+k*.18),a=angle+side*(.43+random()*.31),length=h*(.065+random()*.035),end=tip.clone();
      end.x+=Math.cos(a)*length;end.z+=Math.sin(a)*length;end.y+=h*(-.025+random()*.105);
      const bend=split.clone().lerp(end,.53);bend.y+=h*.025;
      bent([split.toArray(),bend.toArray(),end.toArray()],h*.0065,.012,barkLight,4);crown(end,a);
     }
    }
    crown(trunkAt(.735),phase-.6);crown(trunkAt(.90),phase+.8);
   }
   const verts=[],uv=[],idx=[],sides=16;
   for(let ring=0;ring<3;ring++)for(let j=0;j<=sides;j++){
    const a=phase+j/sides*6.28318530718,r=[.37+.06*Math.sin(a*3+phase),.29,.215][ring],px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,ground=height(px,pz),py=ring===0?ground-.065:ring===1?Math.max(ground+.075,y+.12):y+.34;
    verts.push(px,py,pz);uv.push(j/sides*2,ring*.25);if(ring===0&&j<sides)this.rootContacts.push([px,py,pz]);
   }
   for(let ring=0;ring<2;ring++)for(let j=0;j<sides;j++){const a=ring*(sides+1)+j,b=a+1,c=a+sides+1,d=c+1;idx.push(a,c,b,b,c,d);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();add(geo,bark,0,0,0);
  };
  // Trees grow in stands with deliberate openings toward the shops and tower.
  for(const [cx,cz,count] of [[-43,20,9],[-39,-31,8],[29,-39,8],[45,36,6],[-40,54,7],[22,65,6],[69,39,8],[-73,4,9],[0,-70,10]]){
   for(let i=0;i<count;i++){const a=rng()*Math.PI*2,r=3+rng()*12,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(!C.planting(x,z,2)||Math.hypot(x-42,z-51)<7)continue;tree(x,z,5+rng()*4,i%4===0);}
  }
  for(const [x,z,h] of [[-1,36,5.5],[-18,43,5.8],[19,46,5.2],[-12,59,6.8]])tree(x,z,h);
  this.commonGardens=[];
  const flower=(x,y,z,h,seed,material)=>{
   const random=B.random(seed),a=random()*6.283,dx=Math.cos(a),dz=Math.sin(a),bend=.09+random()*.08,top=[x+dx*bend,y+h,z+dz*bend];
   beam([x,y,z],[x+dx*bend*.3,y+h*.55,z+dz*bend*.3],.012,.008,leaves[2],5);beam([x+dx*bend*.3,y+h*.55,z+dz*bend*.3],top,.008,.004,leaves[2],5);
   const pos=[];
   for(let j=0;j<4;j++){
    const t=.18+j*.15,angle=a+j*2.399,l=.12+random()*.10,sx=Math.cos(angle),sz=Math.sin(angle),p=[x+dx*bend*t,y+h*t,z+dz*bend*t],q=[p[0]+sx*l,p[1]+l*.25,p[2]+sz*l],mid=[p[0]+sx*l*.5,p[1]+l*.3,p[2]+sz*l*.5],w=l*.22;
    const edge=[mid[0]-sz*w,mid[1]-.02,mid[2]+sx*w],other=[mid[0]+sz*w,mid[1]-.02,mid[2]-sx*w];for(const v of [p,edge,mid,edge,q,mid,q,other,mid,other,p,mid])pos.push(...v);
   }
   const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute(pos,3));leafGeo.computeVertexNormals();add(leafGeo,leaves[0],0,0,0);
   const petals=[],r=.105+random()*.045,count=7+seed%3;
   for(let j=0;j<count;j++){
    const angle=a+j/count*Math.PI*2,sx=Math.cos(angle),sz=Math.sin(angle),point=(along,side,lift)=>[top[0]+sx*along-sz*side,top[1]+lift+sz*along*.35,top[2]+sz*along+sx*side];
    const p=point(.018,0,0),left=point(r*.58,-r*.24,.009),right=point(r*.58,r*.24,.009),tip=point(r,0,-.04),tipLeft=point(r*.93,-r*.15,-.032),tipRight=point(r*.93,r*.15,-.032),ridge=point(r*.62,0,.029);
    for(const v of [p,left,ridge,left,tipLeft,ridge,tipLeft,tip,ridge,tip,tipRight,ridge,tipRight,right,ridge,right,p,ridge])petals.push(...v);
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(petals,3));geo.computeVertexNormals();add(geo,material,0,0,0);
   const centre=add(new T.SphereGeometry(.033,7,4),seed%3===0?wood:flowers[0],...top);centre.scale.y=.45;centre.position.y+=.012;
  };
  const soil=mat('#75664c');B.TERRAIN_LOOK.apply(soil);
  const edgingStone=(x,y,z,length,width,h,yaw,random)=>{
   const pos=[],uv=[],rings=[],bevel=.025+random()*.012;
   // Uneven octagonal outlines expose chipped corners and a sloping cap.
   for(let ring=0;ring<4;ring++){
    const inset=ring===0||ring===3?bevel:0,hw=length/2-inset,hd=width/2-inset,b=bevel*.8;
    rings.push([[-hw+b,-hd],[hw-b,-hd],[hw,-hd+b],[hw,hd-b],[hw-b,hd],[-hw+b,hd],[-hw,hd-b],[-hw,-hd+b]].map(([px,pz])=>[px,[-h/2,-h/2+bevel,h/2-bevel,h/2][ring]+(ring>1?px*.025+pz*.018:0),pz]));
   }
   const tri=(a,b,c)=>{for(const p of [a,b,c]){pos.push(...p);uv.push(p[0]*3,p[2]*3);}};
   for(let ring=0;ring<3;ring++)for(let i=0;i<8;i++){const j=(i+1)%8;tri(rings[ring][i],rings[ring+1][i],rings[ring][j]);tri(rings[ring][j],rings[ring+1][i],rings[ring+1][j]);}
   for(let i=0;i<8;i++){const j=(i+1)%8;tri([0,-h/2,0],rings[0][i],rings[0][j]);tri([0,h/2,0],rings[3][j],rings[3][i]);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
   const o=add(geo,random()<.12?rockDark:stone,x,y,z);o.rotation.y=yaw;return o;
  };
  const garden=(x,z,w,d)=>{
   const y=height(x,z);box(x,y+.12,z,w,.24,d,soil);
   const random=B.random(Math.round(x*197+z*571)),course=(cx,cz,length,yaw)=>{
    const count=Math.ceil(length/.48),step=length/count;
    for(let i=0;i<count;i++){
     const along=(i+.5)*step-length/2,h=.29+random()*.025,px=cx+Math.cos(yaw)*along,pz=cz-Math.sin(yaw)*along;
     edgingStone(px,y+h/2-.008,pz,step-.016-random()*.01,.17+random()*.025,h,yaw+(random()-.5)*.028,random);
    }
   };
   course(x,z-d/2,w+.16,0);course(x,z+d/2,w+.16,0);course(x-w/2,z,d-.18,Math.PI/2);course(x+w/2,z,d-.18,Math.PI/2);
   this.commonGardens.push({x,y,z,w,d});
   // The low edging can be stepped over. Large shrubs are visible, soft planting.
   for(let i=0;i<25;i++){const px=x+(rng()-.5)*(w-.4),pz=z+(rng()-.5)*(d-.35);if(Math.hypot(px-x,pz-z)<.6)continue;
    const h=.32+rng()*.32;flower(px,y+.16,pz,h,i*173+Math.floor(x*89+z*197),flowers[i%3]);
    // A grounded leaf rosette gives each stem a planted base.
    const pos=[];for(let j=0;j<5;j++){const a=i+j*2.399,dx=Math.cos(a),dz=Math.sin(a),l=.14+(j%3)*.035,p=[px,y+.24,pz],tip=[px+dx*l,y+.26,pz+dz*l],mid=[px+dx*l*.5,y+.30,pz+dz*l*.5],w=l*.23,edge=[mid[0]-dz*w,mid[1]-.03,mid[2]+dx*w],other=[mid[0]+dz*w,mid[1]-.03,mid[2]-dx*w];for(const v of [p,edge,mid,edge,tip,mid,tip,other,mid,other,p,mid])pos.push(...v);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();add(geo,leaves[2],0,0,0);
   }
  };
  for(const q of [[-1,36,3.8,2.8],[-18,43,3.6,2.6],[19,46,3.6,2.8],[-12,59,4.5,3]])garden(...q);
  // Low rosettes gather around the tree stands. They are soft planting and leave
  // the original placement stream, claim soil and public paths untouched.
  const plantRandom=B.random(928401);this.commonUnderstory=[];
  for(const tree of this.commonTrees)for(let n=0;n<7;n++){
   const angle=plantRandom()*6.283,r=.85+plantRandom()*2.2,x=tree.x+Math.cos(angle)*r,z=tree.z+Math.sin(angle)*r;
   if(x< -57||x>57||z< -49||z>67||!C.planting(x,z,.30))continue;
   const size=.31+plantRandom()*.23,verts=[];
   for(let f=0;f<4;f++){
    const a=angle+f*1.8,dx=Math.cos(a),dz=Math.sin(a);
    const stem=t=>{const px=x+dx*size*t,pz=z+dz*size*t;return[px,height(px,pz)+.025+.19*Math.sin(t*Math.PI),pz];};
    for(let j=0;j<5;j++){
     const p=stem(j/5),q=stem((j+1)/5),w=.008;
     for(const tri of [[p[0]-dz*w,p[1],p[2]+dx*w],[q[0]-dz*w,q[1],q[2]+dx*w],[p[0]+dz*w,p[1],p[2]-dx*w],[p[0]+dz*w,p[1],p[2]-dx*w],[q[0]-dz*w,q[1],q[2]+dx*w],[q[0]+dz*w,q[1],q[2]-dx*w]])verts.push(...tri);
    }
    for(let j=1;j<5;j++)for(const side of [-1,1]){
     const t=j/5,cx=x+dx*size*t,cz=z+dz*size*t,s=size*.20*Math.sin(t*Math.PI),px=cx-dz*s*side+dx*.10,pz=cz+dx*s*side+dz*.10;
     const tip=[px,height(px,pz)+.045+.19*Math.sin(t*Math.PI),pz],base=stem(t),mid=[(px+cx)/2,height((px+cx)/2,(pz+cz)/2)+.065+.19*Math.sin(t*Math.PI),(pz+cz)/2];
     const edge=[mid[0]+dx*.04,mid[1]-.035,mid[2]+dz*.04],other=[mid[0]-dx*.04,mid[1]-.035,mid[2]-dz*.04];
     for(const q of [base,edge,mid,edge,tip,mid,tip,other,mid,other,base,mid])verts.push(...q);
    }
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();add(geo,leaves[n%3],0,0,0);this.commonUnderstory.push({x,y:height(x,z),z,size});
  }
  // Perennial clumps and small broken strata stay on protected ground.
  const verge=this.verge=new T.Group();this.scene.add(verge);
  this.commonRocks=[];
  for(let i=0;i<1300;i++){
   const x=-56+rng()*112,z=-48+rng()*114;if(!C.planting(x,z,.4)||Math.hypot(x-42,z-51)<5)continue;
   if(Math.sin(x*.21+z*.13)+Math.cos(z*.27-x*.08)<-.5)continue;
   const y=height(x,z),h=.18+rng()*.32,blades=B.GrassShapes.buffer();
   for(let j=0;j<5;j++){const a=rng()*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a),w=.04+rng()*.025,px=x+dx*.16,pz=z+dz*.16;if(j<3)B.GrassShapes.blade(blades,px,pz,a,h*.78,w*.24,.13,null,i*.37+j);}
   verge.add(new T.Mesh(B.GrassShapes.geometry(blades),leaves[i%4]));
   if(i%17===0)flower(x,y+.015,z,h+.10,i*37,flowers[i%3]);
   if(i%31===0){const r=.22+rng()*.35,o=add(new T.DodecahedronGeometry(r,0),i%2?stone:rockDark,x,y+r*.28,z);o.scale.set(1.35,.55,.9);}
  }
  // Clip closed beds into angled break faces, then split them along narrow
  // fissures. Independent construction seeds leave shared placement untouched.
  for(const material of this.commonRockMaterials)material.vertexColors=true;
  const bedBox=bottom=>{
   const v=[[-1,bottom,-1],[1,bottom,-1],[1,bottom,1],[-1,bottom,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]];
   return [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]].map(ids=>({points:ids.map(i=>v[i]),fissure:false}));
  };
  const cutBed=(faces,normal,limit,fissure=false)=>{
   const cut=[],result=[],value=p=>p[0]*normal[0]+p[1]*normal[1]+p[2]*normal[2]-limit;
   for(const face of faces){
    const polygon=[];
    for(let i=0;i<face.points.length;i++){
     const a=face.points[i],b=face.points[(i+1)%face.points.length],u=value(a),v=value(b),inside=u<=1e-9,next=v<=1e-9;
     if(inside)polygon.push(a);
     if(inside!==next){const t=u/(u-v),p=a.map((n,k)=>n+(b[k]-n)*t);polygon.push(p);if(!cut.some(q=>q.every((n,k)=>Math.abs(n-p[k])<1e-7)))cut.push(p);}
    }
    if(polygon.length>=3)result.push({...face,points:polygon});
   }
   if(cut.length>=3){
    const n=new T.Vector3(...normal).normalize(),u=new T.Vector3(...(Math.abs(n.y)<.8?[0,1,0]:[1,0,0])).cross(n).normalize(),v=n.clone().cross(u),centre=cut.reduce((p,q)=>p.add(new T.Vector3(...q)),new T.Vector3()).multiplyScalar(1/cut.length);
    const angle=p=>{const q=new T.Vector3(...p).sub(centre);return Math.atan2(q.dot(v),q.dot(u));};
    cut.sort((a,b)=>angle(a)-angle(b));result.push({points:cut,fissure});
   }
   return result;
  };
  const emitBed=(faces,cx,cy,cz,sx,sy,sz,buckets)=>{
   const phase=cx*.17+cz*.23;
   const surface=q=>[cx+(q[0]+.065*Math.sin(q[1]*3.4+q[2]*2.9+phase))*sx,cy+(q[1]+.035*Math.sin(q[0]*3.3+q[2]*4.1+phase)*Math.min(1,Math.max(0,1-q[1])))*sy,cz+(q[2]+.060*Math.sin(q[1]*4.1-q[0]*3.7+phase))*sz];
   for(const face of faces){
    const centre=face.points.reduce((a,b)=>a.map((v,k)=>v+b[k]),[0,0,0]).map(v=>v/face.points.length),p=[];
    for(let i=0;i<face.points.length;i++){const a=face.points[i],b=face.points[(i+1)%face.points.length];p.push(surface(a),surface(a.map((v,k)=>(v+b[k])*.5)));}
    const middle=surface(centre),normal=new T.Vector3(...p[1]).sub(new T.Vector3(...middle)).cross(new T.Vector3(...p[2]).sub(new T.Vector3(...middle))).normalize();
    const tone=normal.y>.65&&groundNoise(cx*.21,cz*.21)>.57?2:0;
    for(let i=0;i<p.length;i++)for(const q of [middle,p[i],p[(i+1)%p.length]]){
     buckets[tone].pos.push(...q);buckets[tone].uv.push(q[0]*.7,q[1]*.9);
     const value=(face.fissure?.78:1)*(.89+.12*groundNoise(q[0]*.95+q[1]*.18,q[2]*.95-q[1]*.14));buckets[tone].color.push(value*.98,value,value*.96);
    }
   }
  };
  for(const [variant,[x,z,w,h,d]] of [[-46,25,4.4,1.6,2.6],[-41,28,2.8,1.25,2],[-38,-37,4.2,1.6,2.8],[49,43,3.4,1.8,2.8],[35,62,3.8,1.7,2.5]].entries()){
   const y=height(x,z),random=B.random(Math.floor(x*37+z*127)),phase=variant*.71+.24,peak=h*1.1,buckets=Array.from({length:3},()=>({pos:[],uv:[],color:[]}));
   const base=Math.min(...[-1,1].flatMap(a=>[-1,1].map(b=>height(x+a*w*.53,z+b*d*.60))))-y-.08;
   let bed=bedBox(base/peak);
   for(let i=0;i<10;i++){
    const angle=phase*.37+i/10*Math.PI*2+(random()-.5)*.18,lean=.02+random()*.16;
    bed=cutBed(bed,[Math.cos(angle),lean,Math.sin(angle)],.88+random()*.18);
    bed=cutBed(bed,[Math.cos(angle),-.26,Math.sin(angle)],1.12+random()*.15);
   }
   for(let i=0;i<5;i++){
    const angle=phase+i*1.25+(random()-.5)*.30,slope=.32+random()*.42,offset=1.07+random()*.14;
    bed=cutBed(bed,[Math.cos(angle)*slope,1,Math.sin(angle)*slope],offset);
   }
   const a=phase+.4,n=[Math.cos(a),.10,Math.sin(a)],split=.30+random()*.11,gap=.018+random()*.012;
   let main=cutBed(bed,n,split-gap,true),side=cutBed(bed,n.map(v=>-v),-split-gap,true);
   side=cutBed(side,[Math.cos(a+1.4)*.22,1,Math.sin(a+1.4)*.22],.64+random()*.20);
   const b=phase+1.7,m=[Math.cos(b),-.08,Math.sin(b)],edge=-.38-random()*.10;
   const foot=cutBed(main,m,edge-gap,true);main=cutBed(main,m.map(v=>-v),-edge-gap,true);
   emitBed(main,x,y,z,w*.53,peak,d*.60,buckets);
   emitBed(side,x+n[0]*w*.012,y,z+n[2]*d*.018,w*.53,peak,d*.60,buckets);
   emitBed(cutBed(foot,[Math.cos(b+.8)*.32,1,Math.sin(b+.8)*.32],.46+random()*.20),x-m[0]*w*.016,y,z-m[2]*d*.016,w*.53,peak,d*.60,buckets);
   for(let i=0;i<8;i++){
    const angle=random()*Math.PI*2,r=.78+random()*.22,cx=x+Math.cos(angle)*w*.53*r,cz=z+Math.sin(angle)*d*.60*r,size=.13+random()*.15;
    let chip=bedBox(-.15);for(let j=0;j<4;j++){const angle=phase+j*Math.PI/2;chip=cutBed(chip,[Math.cos(angle),.5,Math.sin(angle)],1.03);}
    emitBed(chip,cx,height(cx,cz)-.04,cz,size*1.3,size,size*.84,buckets);
   }
   for(const [i,data]of buckets.entries()){if(!data.pos.length)continue;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(data.pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(data.uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(data.color,3));geo.computeVertexNormals();add(geo,this.commonRockMaterials[i],0,0,0);}
   this.commonRocks.push({x,y,z,bounds:obstacle(x,y,z,w*.58,h*1.1,d*.65)});
  }
  // Grass follows compositional patches rather than a uniform scatter. Its own
  // stream leaves existing trees, original clumps and all collision untouched.
  const meadowRandom=B.random(409176),meadow=B.GrassShapes.buffer();this.commonMeadow=[];
  const meadowMat=mat('#ffffff');meadowMat.side=T.DoubleSide;meadowMat.vertexColors=true;this.meadowMaterial=meadowMat;
  const meadowGreen=new T.Color('#586e4c').convertSRGBToLinear(),meadowDry=new T.Color('#a49767').convertSRGBToLinear(),meadowDamp=new T.Color('#405e50').convertSRGBToLinear(),meadowColor=new T.Color();
  const patches=[[-34,12],[-36,17],[-39,21],[-43,15],[-47,18],[-49,26],[-39,29],[-52,6],[-29,-34],[-33,-42],[-40,-44],[26,-31],[29,-38],[35,-43],[38,38],[46,39],[50,29],[37,53],[41,61],[-37,51],[-43,61],[-49,55],[6,-30],[10,-34],[15,-32],[19,-37],[23,-31],[28,-37],[9,-43],[16,-46],[32,-46],[40,-40]];
  for(let patch=0;patch<100;patch++){
   const target=patches[patch%patches.length],cx=patch<64?target[0]+(meadowRandom()-.5)*3:-56+meadowRandom()*112,cz=patch<64?target[1]+(meadowRandom()-.5)*3:-48+meadowRandom()*114,spread=2.4+meadowRandom()*2.2;
   if(!C.planting(cx,cz,.65)||Math.hypot(cx-42,cz-51)<5)continue;
   for(let n=0;n<34;n++){
    const angle=meadowRandom()*6.283,r=Math.sqrt(meadowRandom())*spread,x=cx+Math.cos(angle)*r,z=cz+Math.sin(angle)*r;
    if(x< -57||x>57||z< -49||z>67||!C.planting(x,z,.55)||Math.hypot(x-42,z-51)<5)continue;
    const y=height(x,z),h=.14+meadowRandom()*.25,f=B.COMMON_FINISH.sample(x,z);meadowColor.copy(meadowGreen).lerp(meadowDry,f.dry*.78).lerp(meadowDamp,f.damp*.42).multiplyScalar(.92+meadowRandom()*.15);
    for(let blade=0;blade<6;blade++){
     const a=angle+blade*2.399,dx=Math.cos(a),dz=Math.sin(a),bx=x+dx*.07,bz=z+dz*.07,w=.026+meadowRandom()*.020,l=h*(.7+meadowRandom()*.5),lean=.13+meadowRandom()*.10;
     B.GrassShapes.blade(meadow,bx,bz,a,l*(blade<4?.97:.55),w*.50,lean*.85,meadowColor,patch*.31+blade,blade>=4);
    }
    this.commonMeadow.push({x,y,z,h});
   }
  }
  const meadowMesh=new T.Mesh(B.GrassShapes.geometry(meadow),meadowMat);meadowMesh.receiveShadow=true;verge.add(meadowMesh);
  // A timber reservoir gives the ridge trail a visible destination and the town
  // a recognisable silhouette. It is scenery, not a hidden resource transaction.
  const tx=42,tz=51,ty=height(tx,tz);this.waterTower={x:tx,y:ty,z:tz};
  board.color.set('#d8d0ba').convertSRGBToLinear();board.map=this.yardArtMaterials.wood.map;board.bumpMap=board.map;board.bumpScale=.004;board.vertexColors=true;
  rust.color.set('#ba9b86').convertSRGBToLinear();rust.map=this.yardArtMaterials.rust.map;rust.bumpMap=rust.map;rust.bumpScale=.003;
  this.reservoirMaterials={timber:board,frame:wood,metal:iron,roof:rust};
  const timber=(x,y,z,w,h,d,material=board)=>{
   // Planar chamfers need 44 triangles, without rounded extrusion subdivisions.
   const half=[w/2,h/2,d/2],bevel=Math.min(.012,w*.12,h*.12,d*.12),faces=[];
   for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const axes=[0,1,2].filter(a=>a!==axis);faces.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(pair=>{const v=[0,0,0];v[axis]=sign*half[axis];for(let k=0;k<2;k++)v[axes[k]]=pair[k]*(half[axes[k]]-bevel);return v;}));}
   for(const [a,b,c]of [[0,1,2],[0,2,1],[1,2,0]])for(const sa of [-1,1])for(const sb of [-1,1])faces.push([[0,-1],[0,1],[1,1],[1,-1]].map(([edge,sc])=>{const v=[0,0,0];v[a]=sa*(half[a]-(edge?bevel:0));v[b]=sb*(half[b]-(edge?0:bevel));v[c]=sc*(half[c]-bevel);return v;}));
   for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1])faces.push([0,1,2].map(axis=>half.map((v,a)=>[sx,sy,sz][a]*(v-(a===axis?0:bevel)))));
   const vertices=[];for(const face of faces){const a=new T.Vector3(...face[0]),normal=new T.Vector3(...face[1]).sub(a).cross(new T.Vector3(...face[2]).sub(a)),centre=face.reduce((v,p)=>v.add(new T.Vector3(...p)),new T.Vector3());if(normal.dot(centre)<0)face.reverse();for(let k=1;k<face.length-1;k++)vertices.push(...face[0],...face[k],...face[k+1]);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));geo.computeVertexNormals();
   const pos=geo.attributes.position,normal=geo.attributes.normal,uv=geo.attributes.uv,dims=[w,h,d];
   for(let i=0;i<pos.count;i++){const n=[Math.abs(normal.getX(i)),Math.abs(normal.getY(i)),Math.abs(normal.getZ(i))],skip=n.indexOf(Math.max(...n)),axes=[0,1,2].filter(a=>a!==skip).sort((a,b)=>dims[a]-dims[b]),v=[pos.getX(i),pos.getY(i),pos.getZ(i)];uv.setXY(i,v[axes[0]]/.42+.5,v[axes[1]]/2.7+.5);}
   if(material.vertexColors){const colors=[],tone=.86+.05*Math.sin(x*1.7+z*.83+y*.61);for(let i=0;i<pos.count;i++)colors.push(tone,tone,tone*.98);geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));}
   return add(geo,material,x,y,z);
  };
  const timberBeam=(a,b,w=.29,d=.29)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av),o=timber(...av.add(bv).multiplyScalar(.5).toArray(),w,delta.length(),d);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;};
  const fastener=(x,y,z,r=.026)=>{const n=cyl(x,y,z,r*.65,r*.65,.015,iron,6);n.rotation.x=Math.PI/2;return n;};
  const polar=(a,y,r)=>[tx+Math.cos(a)*r,ty+y,tz+Math.sin(a)*r];
  const surface=(faces,material,tone=1)=>{
   const pos=[],uv=[],colors=[];for(const face of faces)for(const k of [0,1,2,0,2,3]){pos.push(...face[k]);uv.push(k<2?0:.92,material===board?(face[k][1]-ty-7.56)/3.28*1.15:(k===1||k===2?1.15:0));if(material.vertexColors){const y=face[k][1]-ty,fade=B.clamp((y-7.58)/.48,0,1),v=tone*(.80+.20*fade);colors.push(v*.99,v,v*.95);}}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(material.vertexColors)geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return add(geo,material,0,0,0);
  };
  const collar=(y,r,w=.12)=>{
   const faces=[];for(let j=0;j<32;j++){const a=j/32*Math.PI*2,b=(j+1)/32*Math.PI*2,lo=y-w/2,hi=y+w/2,inner=r-.04;
    faces.push([polar(a,lo,r),polar(a,hi,r),polar(b,hi,r),polar(b,lo,r)],[polar(b,lo,inner),polar(b,hi,inner),polar(a,hi,inner),polar(a,lo,inner)],
     [polar(a,hi,r),polar(a,hi,inner),polar(b,hi,inner),polar(b,hi,r)],[polar(a,lo,inner),polar(a,lo,r),polar(b,lo,r),polar(b,lo,inner)]);
   }return surface(faces,iron);
  };
  // Rectangular lumber, seated shoes and bolted joints replace the smooth poles.
  for(const dx of [-1.55,1.55])for(const dz of [-1.55,1.55]){
   const ground=height(tx+dx,tz+dz);
   timberBeam([tx+dx,ground+.25,tz+dz],[tx+dx*.82,ty+7.4,tz+dz*.82]);obstacle(tx+dx,ground,tz+dz,.45,ty+7.5-ground);
   timber(tx+dx,ground+.13,tz+dz,.64,.26,.64,stone);
   box(tx+dx,ground+.27,tz+dz,.37,.055,.37,iron);
   for(const side of [-1,1]){
    box(tx+dx,ground+.40,tz+dz+side*.16,.30,.26,.032,iron);
    for(const offset of [-.08,.08])fastener(tx+dx+offset,ground+.43,tz+dz+side*.19);
   }
   timberBeam([tx+dx*.87,ty+6.15,tz+dz*.87],[tx+dx*.37,ty+7.35,tz+dz*.82],.12,.15);
   for(const y of [2.1,6.65]){const t=B.clamp((ty+y-ground)/(ty+7.4-ground),0,1),x=tx+dx*(1-.18*t),z=tz+dz*(1-.18*t);box(x,ty+y,z-Math.sign(dz)*.155,.27,.23,.038,iron);fastener(x,ty+y,z-Math.sign(dz)*.183,.029);}
  }
  // The old bracing envelope remains, with paired timber diagonals and joints.
  for(const side of [-1,1]){
   for(const direction of [-1,1]){
    timberBeam([tx-direction*1.4,ty+1,tz+side*1.46],[tx+direction*1.4,ty+6.7,tz+side*1.29],.105,.12);
    timberBeam([tx+side*1.46,ty+1,tz-direction*1.4],[tx+side*1.29,ty+6.7,tz+direction*1.4],.12,.105);
   }
   box(tx,ty+3.85,tz+side*1.40,.32,.27,.045,iron);fastener(tx,ty+3.85,tz+side*1.43,.034);
   timberBeam([tx-1.31,ty+6.8,tz+side*1.31],[tx+1.31,ty+6.8,tz+side*1.31],.17,.20);
  }
  // Separated boards expose the joists instead of presenting a black slab.
  for(const x of [-1.8,-.9,0,.9,1.8])timber(tx+x,ty+7.32,tz,.15,.14,4.45);
  for(let j=0;j<15;j++)timber(tx,ty+7.45,tz-2.10+j*.30,4.5,.12,.283);
  for(const side of [-1,1]){
   timber(tx+side*2.20,ty+7.39,tz,.10,.22,4.52);timber(tx,ty+7.39,tz+side*2.20,4.52,.22,.10);
   for(const x of [-2.17,-1.11,1.11,2.17])box(tx+x,ty+7.94,tz+side*2.17,.045,.94,.045,iron);
   for(const z of [-1.15,0,1.15])box(tx+side*2.17,ty+7.94,tz+z,.045,.94,.045,iron);
   beam([tx+side*2.17,ty+8.41,tz-2.17],[tx+side*2.17,ty+8.41,tz+2.17],.025,.025,iron,6);
   beam([tx-2.17,ty+8.41,tz+side*2.17],[tx-.50,ty+8.41,tz+side*2.17],.025,.025,iron,6);
   beam([tx+.50,ty+8.41,tz+side*2.17],[tx+2.17,ty+8.41,tz+side*2.17],.025,.025,iron,6);
  }
  // Each stave has thickness, a shaped profile and its own recessed seam.
  const staveLevels=[[7.56,1.94],[7.75,1.99],[9.20,2.035],[10.64,1.99],[10.84,1.94]];
  for(let j=0;j<32;j++){
   const a=j/32*Math.PI*2+.0035,b=(j+1)/32*Math.PI*2-.0035,faces=[];
   for(let k=1;k<staveLevels.length;k++){
    const [y0,r0]=staveLevels[k-1],[y1,r1]=staveLevels[k];
    faces.push([polar(a,y0,r0),polar(a,y1,r1),polar(b,y1,r1),polar(b,y0,r0)],
     [polar(a,y0,r0-.13),polar(a,y1,r1-.13),polar(a,y1,r1),polar(a,y0,r0)],
     [polar(b,y0,r0),polar(b,y1,r1),polar(b,y1,r1-.13),polar(b,y0,r0-.13)]);
   }
   const [bottom,rb]=staveLevels[0],[top,rt]=staveLevels.at(-1);
   faces.push([polar(a,top,rt),polar(a,top,rt-.13),polar(b,top,rt-.13),polar(b,top,rt)],
    [polar(a,bottom,rb-.13),polar(a,bottom,rb),polar(b,bottom,rb),polar(b,bottom,rb-.13)]);
   surface(faces,board,.94+.045*Math.sin(j*2.399)+.018*Math.cos(j*1.13));
  }
  cyl(tx,ty+9.20,tz,1.905,1.905,3.23,wood,32);
  for(const [y,r]of [[7.86,2.019],[9.3,2.063],[10.55,2.027]]){
   collar(y,r);
   for(const side of [-1,1]){box(tx+side*.055,ty+y,tz-r-.018,.075,.19,.055,iron);fastener(tx+side*.057,ty+y,tz-r-.057,.025);}
  }
  // Folded sheet-metal roof, standing seams, rolled eave and a capped vent.
  const roofFaces=[];
  for(let j=0;j<24;j++){
   const a=j/24*Math.PI*2,b=(j+1)/24*Math.PI*2;
   roofFaces.push([polar(a,10.98,2.25),polar(a,12.01,.17),polar(b,12.01,.17),polar(b,10.98,2.25)],
    [polar(b,10.945,2.25),polar(b,11.975,.17),polar(a,11.975,.17),polar(a,10.945,2.25)],
    [polar(a,10.945,2.25),polar(a,10.98,2.25),polar(b,10.98,2.25),polar(b,10.945,2.25)],
    [polar(a,10.91,2.22),polar(a,10.98,2.25),polar(b,10.98,2.25),polar(b,10.91,2.22)]);
   beam(polar(a,10.98,2.25),polar(a,12.02,.17),.014,.014,iron,5);
  }
  surface(roofFaces,rust);collar(10.94,2.23,.065);
  cyl(tx,ty+12.10,tz,.073,.10,.25,iron,10);add(new T.ConeGeometry(.17,.11,10),rust,tx,ty+12.245,tz);
  // Bolted ladder stand-offs and handles rise through the front rail opening.
  for(const side of [-1,1]){
   const x=tx+side*.35;box(x,ty+3.88,tz-2.18,.060,7.76,.075,iron);
   for(const y of [.45,2.30,4.50,6.65]){box(x,ty+y,tz-1.96,.07,.08,.45,iron);fastener(x,ty+y,tz-2.235,.023);}
   const points=[[x,ty+7.60,tz-2.18],[x,ty+8.27,tz-2.18],[x,ty+8.43,tz-2.04],[x,ty+8.43,tz-1.78]];
   add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),10,.032,6,false),iron,0,0,0);
  }
  for(let j=0;j<24;j++){box(tx,ty+.3+j*.32,tz-2.18,.70,.038,.055,iron);for(const side of [-1,1])fastener(tx+side*.335,ty+.3+j*.32,tz-2.225,.019);}
  // The outlet, flange and valve remain close to the existing front post.
  const px=tx+1.35,pz=tz-1.30,pg=height(px,pz),pipe=[[px,ty+7.58,pz],[px,pg+1.15,pz],[px-.10,pg+.95,pz],[px-.20,pg+.12,pz]];
  add(new T.TubeGeometry(new T.CatmullRomCurve3(pipe.map(v=>new T.Vector3(...v))),14,.052,8,false),iron,0,0,0);
  for(const y of [pg+.85,ty+6.6]){cyl(px,y,pz,.095,.095,.045,iron,12);for(const side of [-1,1])box(px+side*.055,y,pz,.028,.080,.10,iron);}
  add(new T.TorusGeometry(.15,.024,6,16),rust,px,pg+1.02,pz-.13);for(let j=0;j<3;j++)box(px,pg+1.02,pz-.13,.29,.028,.028,iron).rotation.z=j*Math.PI/3;
  box(px,pg+1.02,pz-.065,.055,.055,.18,iron);
  obstacle(tx,ty+7.25,tz,2.3,4.8);
  timber(tx,ty+9.12,tz-2.10,2.78,.76,.080);this.sign(g,'RIDGE RESERVOIR','BELL WORKS / BUILT TO LAST',tx,ty+9.12,tz-2.151,2.65,.65);
  for(const x of [tx-1.33,tx+1.33])for(const y of [ty+8.82,ty+9.42])fastener(x,y,tz-2.159,.024);
  // Reservoir seating is built with the shared common furniture after the town.
  this.makeCommonPerimeter();
  // Exposed escarpments sit beyond the traversable common, behind its original
  // hills. They change the horizon without modifying saved or collidable ground.
  const ridge=this.ridgeline=new T.Group();this.scene.add(ridge);
  const ridgeMaterial=mat('#ffffff');ridgeMaterial.vertexColors=true;this.ridgeBounds=[];
  const ridgeStone=new T.Color('#898876').convertSRGBToLinear(),ridgeMoss=new T.Color('#687660').convertSRGBToLinear(),ridgeColor=new T.Color();
  const strataCanvas=document.createElement('canvas');strataCanvas.width=128;strataCanvas.height=256;
  const strataContext=strataCanvas.getContext('2d'),strataRandom=B.random(581302),strataPixels=strataContext.createImageData(128,256);
  for(let z=0;z<256;z++)for(let x=0;x<128;x++){
   const warp=3*Math.sin(x*.052)+1.6*Math.sin(x*.13+z*.01),beds=[3,23,61,112,159,203,237];
   const seam=Math.max(...beds.map((bed,n)=>Math.exp(-Math.pow((z+warp+Math.sin(x*.021+n)*2-bed)/(n%3?1.2:2.1),2))));
   const tone=Math.round(231-29*seam+4*Math.sin(z*.09)+(strataRandom()-.5)*12),i=(z*128+x)*4;
   strataPixels.data.set([tone,tone,tone,255],i);
  }
  strataContext.putImageData(strataPixels,0,0);const strataTexture=new T.CanvasTexture(strataCanvas);strataTexture.wrapS=strataTexture.wrapT=T.RepeatWrapping;strataTexture.encoding=T.sRGBEncoding;
  ridgeMaterial.map=strataTexture;ridgeMaterial.bumpMap=strataTexture;ridgeMaterial.bumpScale=.055;
  for(const [variant,[cx,cz,rx,rz,rise,phase]]of [[-99,25,18,23,17,.3],[-47,-101,27,19,19,1.8],[92,-48,23,16,22,3.1],[58,108,31,16,14,.8],[-80,98,19,15,18,2.2]].entries()){
   const bands=[0,.24,.43,.53,.62,.65,.66,.72,.75,.82,.91,1],levels=[0,.55,.94,1,1,.61,.60,.56,.22,.13,.05,0],surfaceBands=[0,0,0,1,2,3,3,4,5,5,5];
   const rows=bands.length-1,cols=72,points=[],towardX=-cx/Math.hypot(cx,cz),towardZ=-cz/Math.hypot(cx,cz);
   const crestNoise=t=>{const i=Math.floor(t),f=t-i;return 2*(groundNoise(i*1.7+phase*19,phase*3.1)*(1-f)+groundNoise((i+1)*1.7+phase*19,phase*3.1)*f)-1;};
   const erosion=B.random(284831+variant*197),ravines=Array.from({length:[3,1,4,2,3][variant]},()=>({s:-.62+erosion()*1.24,width:.04+erosion()*.09,depth:.13+erosion()*.24,bend:(erosion()-.5)*.10}));
   for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const s=i/cols*2-1;let qmin=-Infinity,qmax=Infinity;
    for(const [axis,offset]of [[towardX,-s*towardZ],[towardZ,s*towardX]]){if(Math.abs(axis)<1e-8)continue;const a=(-1-offset)/axis,b=(1-offset)/axis;qmin=Math.max(qmin,Math.min(a,b));qmax=Math.min(qmax,Math.max(a,b));}
    const fraction=bands[j]+(j>2&&j<9?.025*crestNoise(s*7+phase):0),q=qmin+(qmax-qmin)*fraction,u=q*towardX-s*towardZ,v=q*towardZ+s*towardX,x=cx+u*rx,z=cz+v*rz;
    const ends=Math.pow(Math.max(0,1-Math.pow(Math.abs(s),8)),.28);
    const top=.84+.11*crestNoise(s*3+phase)+.055*crestNoise(s*11-phase);
    const ravine=Math.min(.58,ravines.reduce((value,r)=>value+r.depth*Math.exp(-Math.pow((s-r.s-r.bend*Math.sin(q*3+phase))/r.width,2)),0));
    const profile=ends*top*levels[j]*(1-ravine*(j<8?1:.5));
    points.push([x,height(x,z)-.25+rise*profile,z]);
   }
   const shared=new T.BufferGeometry(),indices=[],colors=[],uv=[];shared.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
   for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;indices.push(a,b,c,b,d,c);}
   shared.setIndex(indices);shared.computeVertexNormals();const normals=shared.attributes.normal;
   this.ridgeBounds.push([cx-rx,cz-rz,cx+rx,cz+rz]);
   for(let k=0;k<points.length;k++){
    ridgeColor.copy(ridgeStone).lerp(ridgeMoss,fade(.60,.91,normals.getY(k))).multiplyScalar(.94+.06*Math.sin(points[k][0]*.13+points[k][2]*.18+phase));colors.push(ridgeColor.r,ridgeColor.g,ridgeColor.b);uv.push((points[k][0]+points[k][2])*.07,points[k][1]*.085);
   }
   shared.setAttribute('color',new T.Float32BufferAttribute(colors,3));shared.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
   // Adjacent quads follow the actual bed boundaries. Crease only those
   // boundaries, so grid diagonals cannot turn into false vertical ribs.
   const adjacent=Array.from({length:points.length},()=>[]),faces=[];
   for(let i=0;i<indices.length;i+=3){const a=new T.Vector3(...points[indices[i]]),area=new T.Vector3(...points[indices[i+1]]).sub(a).cross(new T.Vector3(...points[indices[i+2]]).sub(a)),band=surfaceBands[Math.floor(i/(cols*6))];faces.push({area,band});for(let k=0;k<3;k++)adjacent[indices[i+k]].push(i/3);}
   const creased=shared.toNonIndexed(),creasedNormals=creased.attributes.normal;
   for(let i=0;i<indices.length;i++){const normal=new T.Vector3(),face=faces[Math.floor(i/3)];for(const j of adjacent[indices[i]])if(face.band===faces[j].band)normal.add(faces[j].area);normal.normalize();creasedNormals.setXYZ(i,normal.x,normal.y,normal.z);}
   shared.dispose();const mesh=new T.Mesh(creased,ridgeMaterial);mesh.receiveShadow=true;ridge.add(mesh);
  }
  this.merge(ridge,true);for(const m of ridge.children)m.castShadow=false;
  this.merge(verge);this.merge(g,true);this.makeGroundCover();
  // Canopies use broad spatial batches rather than landscape-wide bounds.
  for(const mesh of [...g.children])if(mesh.isMesh&&(leaves.includes(mesh.material)||mesh.material===canopyMaterial)){
   if(mesh.material===canopyMaterial){const original=mesh.geometry,start=performance.now(),compact=B.CANOPY_ART.index(original),bytes=geo=>Object.values(geo.attributes).reduce((n,a)=>n+a.array.byteLength,geo.index?.array.byteLength||0);this.canopyIndex={inputVertices:original.attributes.position.count,outputVertices:compact.attributes.position.count,beforeBytes:bytes(original),afterBytes:bytes(compact),creationMs:performance.now()-start};original.dispose();mesh.geometry=compact;}
   B.WorkshopShapes.partitionRigid(mesh,64);
  }
  this.commonPath=g.children.find(m=>m.isMesh&&m.material===path);this.renderer.shadowMap.needsUpdate=true;
 };
})(B2);
