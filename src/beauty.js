/* Cave art R4: cellular mineral rock, selective wet specular, ore and atmosphere.
   Rendering only. See docs/CAVE-R4.md for reference frames and validation limits. */
'use strict';
(function(B){
 const T=THREE;
 // One periodic packed texture for grass fibres, earth grains and aggregate.
 // It is constructed once, sampled in world space and shared by every finish.
 let groundMap;
 function groundData(){
  const size=512,data=new Uint8Array(size*size*4),random=B.random(728391);
  const hash=(x,y,seed)=>{let h=Math.imul(x+seed,374761393)^Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
  const noise=(x,y,cells,seed)=>{const px=x/size*cells,py=y/size*cells,ix=Math.floor(px),iy=Math.floor(py);let u=px-ix,v=py-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);const sample=(a,b)=>hash((a+cells)%cells,(b+cells)%cells,seed);return (sample(ix,iy)*(1-u)+sample(ix+1,iy)*u)*(1-v)+(sample(ix,iy+1)*(1-u)+sample(ix+1,iy+1)*u)*v;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=(x+y*size)*4,broad=noise(x,y,8,17),patch=noise(x,y,24,71),fine=hash(x,y,39);
   data[i]=112+36*broad+18*(fine-.5);data[i+1]=91+43*patch+24*(fine-.5);data[i+2]=99+35*patch+17*(fine-.5);data[i+3]=255*(broad*.7+patch*.3);
  }
  const pixel=(x,y)=>( (Math.round(x)&511)+(Math.round(y)&511)*size)*4;
  for(let j=0;j<6800;j++){
   const x=random()*size,y=random()*size,angle=random()*Math.PI*2,length=5+random()*18,bend=(random()-.5)*6,tone=154+random()*57;
   const dx=Math.cos(angle),dy=Math.sin(angle);
   for(let s=0;s<=length;s+=.6){const t=s/length,px=x+dx*s-dy*bend*t*t,py=y+dy*s+dx*bend*t*t,i=pixel(px,py),edge=pixel(px-dy*1.15,py+dx*1.15);
    data[edge]=Math.min(data[edge],75+random()*23);data[i]=Math.max(data[i],tone-28*t);
   }
  }
  for(let j=0;j<11500;j++){
   const x=random()*size,y=random()*size,r=.65+random()*2.7,tone=145+random()*72;
   for(let oy=-Math.ceil(r);oy<=r;oy++)for(let ox=-Math.ceil(r);ox<=r;ox++){
    const d=Math.hypot(ox/r,oy/(r*.75));if(d>1)continue;const i=pixel(x+ox,y+oy),ridge=Math.max(0,1-d),shade=.65+.35*ridge-.11*oy/r;
    data[i+1]=tone*shade;data[i+2]=Math.max(data[i+2],93+ridge*104-oy/r*12);
   }
  }
  return data;
 }
 B.GROUND_DETAIL={data:groundData,texture(){
  if(!groundMap){groundMap=new T.DataTexture(groundData(),512,512,T.RGBAFormat);groundMap.wrapS=groundMap.wrapT=T.RepeatWrapping;groundMap.magFilter=T.LinearFilter;groundMap.minFilter=T.LinearMipmapLinearFilter;groundMap.generateMipmaps=true;groundMap.anisotropy=8;groundMap.needsUpdate=true;}
  return groundMap;
 }};

 // Dedicated periodic rock data. RGBA = albedo, height, roughness, micro-cavity.
 // CPU bake once; world-space sampling means a fresh cut needs no UV regeneration.
 let rockMap,rockNormalMap;
 function rockData(size=512){
  if(!Number.isInteger(size)||size<32||size>1024||(size&(size-1)))throw new RangeError('Rock map size must be a power of two from 32 to 1024');
  const data=new Uint8Array(size*size*4),normalData=new Uint8Array(size*size*4),heights=new Float32Array(size*size),wrap=(v,n)=>(v%n+n)%n;
  const hash=(x,y,s)=>{let h=Math.imul(x+s,374761393)^Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
  const smooth=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);};
  const noise=(u,v,n,seed)=>{const x=u*n,y=v*n,ix=Math.floor(x),iy=Math.floor(y),a=smooth(0,1,x-ix),b=smooth(0,1,y-iy);const h=(x,y)=>hash(wrap(x,n),wrap(y,n),seed);return (h(ix,iy)*(1-a)+h(ix+1,iy)*a)*(1-b)+(h(ix,iy+1)*(1-a)+h(ix+1,iy+1)*a)*b;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const u=(x+.5)/size,v=(y+.5)/size;
   const broad=noise(u,v,4,19),middle=noise(u,v,17,43),grain=noise(u,v,83,79),grit=noise(u,v,197,113);
   const px=u*9+(noise(u,v,7,173)-.5)*.28,py=v*9+(noise(u,v,7,251)-.5)*.28;
   const ix=Math.floor(px),iy=Math.floor(py);let first=99,second=99,cellTone=0,fdx=0,fdy=0;
   for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
    const hx=wrap(ix+i,9),hy=wrap(iy+j,9),dx=ix+i+.16+.68*hash(hx,hy,349)-px,dy=iy+j+.16+.68*hash(hx,hy,571)-py,d=dx*dx+dy*dy;
    if(d<first){second=first;first=d;cellTone=hash(hx,hy,823);fdx=dx;fdy=dy;}else if(d<second)second=d;
   }
   const edge=Math.sqrt(second)-Math.sqrt(first),joint=1-smooth(.008,.047,edge);
   const plate=smooth(.009,.12,edge),grainHeight=(middle-.5)*.023+(grain-.5)*.007+(grit-.5)*.001;
   const broken=joint*(.35+.65*smooth(.32,.72,noise(u,v,7,997)));
   const angle=cellTone*6.283,dx=fdx*Math.cos(angle)-fdy*Math.sin(angle),dy=fdx*Math.sin(angle)+fdy*Math.cos(angle);
   const facet=Math.max(Math.abs(dx),Math.abs(dy)*.87,Math.abs(dx*.62+dy*.73));
   const height=.32-.20*facet+plate*.052+grainHeight*.5+(broad-.5)*.04;
   const faceTone=(Math.floor((Math.atan2(dy,dx)+Math.PI)*.955)*.13+cellTone)%1;
   const value=.54+(faceTone-.5)*.16+(broad-.5)*.10+(middle-.5)*.06+(grain-.5)*.025+(cellTone-.5)*.55-broken*.09;
   const p=(x+y*size)*4;
   data[p]=Math.round(255*Math.max(0,Math.min(1,value)));
   heights[x+y*size]=height;
   data[p+1]=Math.round(255*Math.max(0,Math.min(1,height)));
   data[p+2]=Math.round(255*Math.max(0,Math.min(1,.68+(cellTone-.5)*.35+(grain-.5)*.035+broken*.13)));
   data[p+3]=Math.round(255*(1-broken*.69));
  }
  // Rasterize a jittered triangulated relief mesh into the normal atlas. Broad
  // planar facets, rather than smooth embossed-cell rims, follow the reference.
  // Heights are never quantized before differentiation. All lattice hashes wrap.
  const cells=22,pitch=size/cells;
  const hAt=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy;
   const h=(a,b)=>heights[wrap(a,size)+wrap(b,size)*size];
   return (h(ix,iy)*(1-u)+h(ix+1,iy)*u)*(1-v)+(h(ix,iy+1)*(1-u)+h(ix+1,iy+1)*u)*v;};
  const vertex=(x,y)=>{const hx=wrap(x,cells),hy=wrap(y,cells);
   const px=(x+(hash(hx,hy,1933)-.5)*.58)*pitch,py=(y+(hash(hx,hy,2903)-.5)*.58)*pitch;
   return [px,py,hAt(px,py)];};
  function triangle(a,b,c,tone){
   const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-a[0],vy=c[1]-a[1],det=ux*vy-uy*vx;
   if(Math.abs(det)<1e-6)return;
   let dx=((b[2]-a[2])*vy-(c[2]-a[2])*uy)/det*size*.085;
   let dy=((c[2]-a[2])*ux-(b[2]-a[2])*vx)/det*size*.085;
   const slope=Math.hypot(dx,dy);if(slope>.85){dx*=.85/slope;dy*=.85/slope;}
   const inv=1/Math.hypot(dx,dy,1),nx=Math.round(127.5*(1-dx*inv)),ny=Math.round(127.5*(1-dy*inv)),nz=Math.round(127.5*(1+inv));
   for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));y<=Math.min(size-1,Math.ceil(Math.max(a[1],b[1],c[1])));y++)
    for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));x<=Math.min(size-1,Math.ceil(Math.max(a[0],b[0],c[0])));x++){
     const px=x+.5-a[0],py=y+.5-a[1],u=(px*vy-py*vx)/det,v=(ux*py-uy*px)/det;
     if(u<-.00001||v<-.00001||u+v>1.00001)continue;
     const i=(x+y*size)*4;normalData[i]=nx;normalData[i+1]=ny;normalData[i+2]=nz;normalData[i+3]=255;
     data[i]=Math.min(255,Math.round(data[i]*(.92+.13*tone)));
    }
  }
  for(let y=-1;y<=cells;y++)for(let x=-1;x<=cells;x++){
   const a=vertex(x,y),b=vertex(x+1,y),c=vertex(x,y+1),d=vertex(x+1,y+1),hx=wrap(x,cells),hy=wrap(y,cells);
   if((x+y)&1){triangle(a,b,c,hash(hx,hy,3811));triangle(b,d,c,hash(hx,hy,4391));}
   else{triangle(a,b,d,hash(hx,hy,3811));triangle(a,d,c,hash(hx,hy,4391));}
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=(x+y*size)*4;
   const dx=(heights[wrap(x+1,size)+y*size]-heights[wrap(x-1,size)+y*size])*size*.025;
   const dy=(heights[x+wrap(y+1,size)*size]-heights[x+wrap(y-1,size)*size])*size*.025;
   const inv=1/Math.hypot(dx,dy,1);
   const nx=(normalData[i]/127.5-1)*.65-dx*inv*.35;
   const ny=(normalData[i+1]/127.5-1)*.65-dy*inv*.35;
   const nz=(normalData[i+2]/127.5-1)*.65+inv*.35,scale=127.5/Math.hypot(nx,ny,nz);
   normalData[i]=Math.round(127.5+nx*scale);normalData[i+1]=Math.round(127.5+ny*scale);normalData[i+2]=Math.round(127.5+nz*scale);
  }
  return {data,normalData};
 }
 function ensureRockMaps(){
  if(rockMap)return;
  const bake=rockData(),make=data=>{const map=new T.DataTexture(data,512,512,T.RGBAFormat);map.wrapS=map.wrapT=T.RepeatWrapping;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.anisotropy=8;map.needsUpdate=true;return map;};
  rockMap=make(bake.data);rockNormalMap=make(bake.normalData);
 }
 B.ROCK_DETAIL={data:size=>rockData(size).data,normalData:size=>rockData(size).normalData,texture(){ensureRockMaps();return rockMap;},normalTexture(){ensureRockMaps();return rockNormalMap;}};

 // Camera-local density lighting. The scalar field is clamped, so use bounded
 // fixed-distance visibility probes, NOT sphere tracing or distance-field claims.
 B.createCaveLighting=function(renderer){
  if(!renderer?.capabilities?.isWebGL2)return null;
  const size=32,step=.5,data=new Uint8Array(size**3).fill(255);
  const texture=new T.Data3DTexture(data,size,size,size);texture.format=T.RedFormat;
  texture.type=T.UnsignedByteType;texture.minFilter=texture.magFilter=T.LinearFilter;
  texture.unpackAlignment=1;texture.generateMipmaps=false;texture.needsUpdate=true;
  const origin=new T.Vector3(),strength={value:0};let worldRef=null,revision=-1,key='',last=-Infinity;
  const api={texture,origin,strength,samples:0,updates:0,update(world,camera,now=performance.now()){
   if(!world||typeof world.density!=='function'||!Number.isFinite(camera.x+camera.y+camera.z)||camera.y> -1){strength.value=0;return false;}
   const x=Math.floor(camera.x)-8,y=Math.floor(camera.y)-8,z=Math.floor(camera.z)-8,nextKey=`${x},${y},${z}`;
   if(worldRef===world&&key===nextKey&&revision===world.revision){strength.value=1;return false;}
   if(worldRef===world&&now-last<100){strength.value=1;return false;}
   let at=0;for(let iz=0;iz<size;iz++)for(let iy=0;iy<size;iy++)for(let ix=0;ix<size;ix++){
    const d=world.density(x+ix*step,y+iy*step,z+iz*step);
    data[at++]=Number.isFinite(d)?Math.round(255*Math.max(0,Math.min(1,d*.25+.5))):255;
   }
   origin.set(x,y,z);texture.needsUpdate=true;worldRef=world;revision=world.revision;key=nextKey;last=now;
   strength.value=1;api.samples+=at;api.updates++;return true;
  },dispose(){texture.dispose();strength.value=0;worldRef=null;}};
  return api;
 };
 // Local host-rock inclusions use EXISTING embedded deposit positions. RGBA is
 // premultiplied linear ore color + weight, not a second collectible ore system.
 // Collected/loose nodes contribute nothing. Edge fade and 100 ms cache cap match
 // the density field; WebGL1 still receives the real clustered ore meshes.
 B.createMineralField=function(renderer){
  if(!renderer?.capabilities?.isWebGL2)return null;
  const size=32,step=.5,data=new Uint8Array(size**3*4),map=new T.Data3DTexture(data,size,size,size);
  map.format=T.RGBAFormat;map.type=T.UnsignedByteType;map.minFilter=map.magFilter=T.LinearFilter;map.generateMipmaps=false;map.unpackAlignment=1;
  const origin=new T.Vector3(),strength={value:0};let oldWorld=null,oldNodes=null,key='',revision=-1,terrainRevision=-1,last=-Infinity;
  const colors=['#d99054','#4f6578','#9bdcf0','#ffd35b','#77f8df'].map(c=>new T.Color(c).convertSRGBToLinear());
  const api={texture:map,origin,strength,updates:0,inclusions:0,update(world,camera,nodes=[],oreRevision=0,now=performance.now()){
   if(!world||!Number.isFinite(camera.x+camera.y+camera.z)||camera.y> -1){strength.value=0;return false;}
   const x=Math.floor(camera.x)-8,y=Math.floor(camera.y)-8,z=Math.floor(camera.z)-8,next=`${x},${y},${z}`;
   const same=world===oldWorld&&nodes===oldNodes;
   if(same&&next===key&&oreRevision===revision&&world.revision===terrainRevision){strength.value=1;return false;}
   if(same&&now-last<100){strength.value=1;return false;}
   data.fill(0);origin.set(x,y,z);
   const nearby=[];
   for(const n of nodes){
    if(n.collected||n.motion&&n.motion!=='embedded'||!colors[n.kind]||!Number.isFinite(n.x+n.y+n.z+n.radius)||n.radius<=0)continue;
    const r=Math.min(1.6,n.radius*1.6+.20),d=(n.x-camera.x)**2+(n.y-camera.y)**2+(n.z-camera.z)**2;
    if(n.x+r<x||n.y+r<y||n.z+r<z||n.x-r>x+15.5||n.y-r>y+15.5||n.z-r>z+15.5)continue;
    nearby.push({n,r,d});
   }
   nearby.sort((a,b)=>a.d-b.d||a.n.id-b.n.id);
   let used=0;
   for(const {n,r}of nearby.slice(0,256)){
    const lo=[n.x-r-x,n.y-r-y,n.z-r-z].map(v=>Math.max(0,Math.ceil(v/step))),hi=[n.x+r-x,n.y+r-y,n.z+r-z].map(v=>Math.min(31,Math.floor(v/step))),c=colors[n.kind];
    for(let iz=lo[2];iz<=hi[2];iz++)for(let iy=lo[1];iy<=hi[1];iy++)for(let ix=lo[0];ix<=hi[0];ix++){
     const d=Math.hypot(x+ix*step-n.x,y+iy*step-n.y,z+iz*step-n.z)/r;
     const w=Math.max(0,Math.min(1,(1-d)/.46));const a=Math.round(255*w*w*(3-2*w));if(!a)continue;
     const i=(ix+size*(iy+size*iz))*4;if(a<=data[i+3])continue;
     data[i]=Math.round(c.r*a);data[i+1]=Math.round(c.g*a);data[i+2]=Math.round(c.b*a);data[i+3]=a;
    }used++;
   }
   oldWorld=world;oldNodes=nodes;key=next;revision=oreRevision;terrainRevision=world.revision;last=now;map.needsUpdate=true;strength.value=1;api.updates++;api.inclusions=used;return true;
  },dispose(){map.dispose();strength.value=0;oldWorld=null;oldNodes=null;}};return api;
 };
 const glsl=`
 uniform sampler2D b2GroundDetail;
 uniform sampler2D b2RockDetail;
 uniform sampler2D b2RockNormal;
 uniform float b2GroundJoin;
 #ifdef B2_MINERAL_FIELD
 uniform highp sampler3D b2MineralVolume;uniform vec3 b2MineralOrigin;uniform float b2MineralStrength;
 vec4 b2InclusionSample(vec3 p){
  vec3 cell=(p-b2MineralOrigin)*2.,edge=min(cell,vec3(31.)-cell);
  float fade=smoothstep(0.,4.,min(min(edge.x,edge.y),edge.z))*b2MineralStrength;
  return texture(b2MineralVolume,(cell+.5)/32.)*fade;
 }
 #endif
 #ifdef B2_DENSITY_LIGHTING
 uniform highp sampler3D b2DensityVolume;
 uniform vec3 b2DensityOrigin;
 uniform float b2DensityStrength;
 float b2DensityFade(vec3 p){
  vec3 cell=(p-b2DensityOrigin)*2.;
  vec3 edge=min(cell,vec3(31.)-cell);
  return smoothstep(0.,5.,min(min(edge.x,edge.y),edge.z))*b2DensityStrength;
 }
 float b2FieldDensity(vec3 p){
  vec3 cell=(p-b2DensityOrigin)*2.;
  float inside=step(0.,min(min(cell.x,cell.y),cell.z))*step(max(max(cell.x,cell.y),cell.z),31.);
  return mix(2.,texture(b2DensityVolume,(cell+.5)/32.).r*4.-2.,inside);
 }
 float b2FieldAmbient(vec3 p,vec3 n){
  float fade=b2DensityFade(p);if(fade<=0.)return 1.;
  vec3 t=normalize(cross(n,abs(n.y)<.9?vec3(0.,1.,0.):vec3(1.,0.,0.))),b=cross(n,t);
  vec3 start=p+n*.24;
  float occ=1.-smoothstep(-.14,.28,b2FieldDensity(start+n*.65));
  occ+=1.-smoothstep(-.14,.28,b2FieldDensity(start+n*.85+t*.85));
  occ+=1.-smoothstep(-.14,.28,b2FieldDensity(start+n*.85-t*.85));
  occ+=1.-smoothstep(-.14,.28,b2FieldDensity(start+n*.85+b*.85));
  occ+=1.-smoothstep(-.14,.28,b2FieldDensity(start+n*.85-b*.85));
  return 1.-occ*.13*fade;
 }
 float b2FieldContact(vec3 p,vec3 n,vec3 lightDir,float distanceToLight){
  float fade=b2DensityFade(p);if(fade<=0.)return 1.;
  vec3 start=p+n*.24;float visibility=1.,reach=min(2.5,max(0.,distanceToLight-.24));
  for(int j=1;j<=5;j++)visibility=min(visibility,smoothstep(-.18,.16,b2FieldDensity(start+lightDir*(reach*float(j)/5.))));
  return mix(1.,.22+.78*visibility,fade);
 }
 #endif

 float b2Hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float b2Noise(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(b2Hash(i),b2Hash(i+vec3(1,0,0)),f.x),mix(b2Hash(i+vec3(0,1,0)),b2Hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(b2Hash(i+vec3(0,0,1)),b2Hash(i+vec3(1,0,1)),f.x),mix(b2Hash(i+vec3(0,1,1)),b2Hash(i+vec3(1,1,1)),f.x),f.y),f.z);
 }
 float b2Beds(vec3 p){return sin(p.y*7.5+b2Noise(p*.38)*4.+p.x*.13+p.z*.08);}
 vec4 b2SurfaceDetail(vec3 p,vec3 n){
  vec3 w=abs(n);w*=w;w/=max(.0001,w.x+w.y+w.z);
  return texture2D(b2GroundDetail,p.yz*.36)*w.x+texture2D(b2GroundDetail,p.xz*.36)*w.y+texture2D(b2GroundDetail,p.xy*.36)*w.z;
 }
 float b2Grass(vec3 p,vec3 n,vec3 base){return smoothstep(.02,.10,(base.g-base.r)/max(.001,base.r+base.g))*smoothstep(.3,.72,n.y)*(1.-smoothstep(.45,1.4,-p.y));}

 vec4 b2RockSample(vec3 p,vec3 n){
  vec3 w=abs(n);w*=w;w*=w;w/=max(.0001,w.x+w.y+w.z);
  return texture2D(b2RockDetail,p.yz*.24+vec2(.31,.17))*w.x+texture2D(b2RockDetail,p.xz*.24+vec2(.11,.53))*w.y+texture2D(b2RockDetail,p.xy*.24+vec2(.73,.29))*w.z;
 }
 vec3 b2RockGradient(vec3 p,vec3 n){
  vec3 w=abs(n);w*=w;w*=w;w/=max(.0001,w.x+w.y+w.z);
  vec3 a=texture2D(b2RockNormal,p.yz*.24+vec2(.31,.17)).rgb*2.-1.;
  vec3 b=texture2D(b2RockNormal,p.xz*.24+vec2(.11,.53)).rgb*2.-1.;
  vec3 c=texture2D(b2RockNormal,p.xy*.24+vec2(.73,.29)).rgb*2.-1.;
  vec2 ga=-a.xy/max(a.z,.2),gb=-b.xy/max(b.z,.2),gc=-c.xy/max(c.z,.2);
  vec3 g=vec3(0.,ga.x,ga.y)*w.x+vec3(gb.x,0.,gb.y)*w.y+vec3(gc.x,gc.y,0.)*w.z;
  return g-n*dot(n,g);
 }
 float b2RockBeds(vec3 p){
  float phase=p.y*4.1+p.x*.18+p.z*.11+(b2Noise(p*.11)-.5)*4.;
  float bed=sin(phase+sin(phase*.39)*.65);
  return smoothstep(.69,.99,bed)*( .45+.55*b2Noise(p*.72));
 }
 float b2Wetness(vec3 p,vec3 n,vec4 rock){
  float wetPatch=smoothstep(.30,.68,b2Noise(vec3(p.x*.24,p.y*.052,p.z*.24)+vec3(13.,7.,-9.)));
  float depth=smoothstep(3.,56.,-p.y);
  float sides=1.-smoothstep(.45,.95,n.y);
  return clamp(depth*(.16+.80*wetPatch)*(.55+.45*sides)*(.45+.55*rock.a),0.,.96);
 }
 vec3 b2Mineral(vec3 p,vec3 n,vec3 base,vec4 rock){
  float macro=b2Noise(p*.16),bed=b2RockBeds(p);
  float mid=smoothstep(18.,32.,-p.y),deep=smoothstep(44.,85.,-p.y);
  vec3 host=mix(base,vec3(.13,.14,.14),mid*.70);
  host=mix(host,vec3(.020,.035,.059),deep*.87);
  vec3 stone=host*(.22+rock.r*1.18);
  stone*=mix(vec3(1.05,.96,.86),vec3(.91,1.,1.05),macro);
  stone*=1.-bed*.035;
  float chalk=smoothstep(23.,28.,-p.y)*(1.-smoothstep(39.,45.,-p.y));
  stone=mix(stone,stone*vec3(.97,1.02,1.06),chalk*.35);
  return stone;
 }
 vec3 b2Terrain(vec3 p,vec3 n,vec3 base,vec4 rock){
  // Both the editable field and its clipped common-land neighbour use this
  // world-space paint at their join. Other stone, paving and path finishes do not.
  if(b2GroundJoin>.5&&p.y> -1.5){
   vec2 outside=max(max(vec2(-16.25)-p.xz,p.xz-vec2(47.75,15.75)),vec2(0.));
   float join=(1.-smoothstep(0.,4.,length(outside)))*(1.-smoothstep(.25,1.5,-p.y));
   float meadow=(1.-smoothstep(.35,.65,-p.y+sin(p.x*.24+p.z*.17)*.7))*smoothstep(.35,.7,n.y);
   vec3 paint=mix(vec3(.250158,.114435,.043735),vec3(.165132,.234551,.076185),meadow);
   paint*=.91+.09*sin(p.y*3.1+sin(p.x*.4)+sin(p.z*.3));
   base=mix(base,paint,join);
  }
  if(p.y<=-7.)return b2Mineral(p,n,base,rock);
  vec4 detail=b2SurfaceDetail(p,n);
  float grass=b2Grass(p,n,base),top=1.-smoothstep(8.,13.,-p.y);
  float cover=b2Noise(p*.085)*.72+b2Noise(p*.21+vec3(19.,0.,-11.))*.28;
  vec3 earth=base*(.81+detail.g*.37)*(1.-smoothstep(.55,.8,cover)*.13);
  vec3 turf=base*(.81+detail.r*.31)*mix(vec3(.84,.95,.79),vec3(1.08,1.,.85),smoothstep(.36,.72,cover));
  turf*=mix(vec3(.80,.94,.73),vec3(1.10,1.04,.84),smoothstep(.32,.79,detail.r));
  float worn=smoothstep(.58,.76,detail.a*.35+b2Noise(p*.28)*.65);
  turf=mix(turf,vec3(.18,.13,.075)*(.81+detail.g*.37),worn*.55);
  vec3 upper=mix(earth,turf,grass);
  if(p.y>=-1.5)return upper;
  return mix(upper,b2Mineral(p,n,base,rock),smoothstep(1.5,7.,-p.y));
 }
 float b2Height(vec3 p){if(p.y>=-8.)return 0.;float depth=smoothstep(.5,8.,-p.y);return (b2Noise(p*11.5)*.012+b2Noise(p*2.3)*.035+smoothstep(.7,.98,b2Beds(p))*.018)*mix(.15,1.,depth)*smoothstep(8.,13.,-p.y);}
 float b2SurfaceHeight(vec3 p,vec3 n,vec3 base){if(p.y<=-13.)return 0.;vec4 d=b2SurfaceDetail(p,n);return mix(d.g*.006+d.b*.002,d.r*.006,b2Grass(p,n,base))*(1.-smoothstep(8.,13.,-p.y));}
 `;
 B.TERRAIN_LOOK={glsl,apply(material,groundJoin=false,lighting=null,mineral=null){
  material.extensions={...material.extensions,derivatives:true};
  material.customProgramCacheKey=()=> 'b2-cave-art-4-'+(lighting?'field':'material')+(mineral?'-ore':'');
  material.defines={...material.defines};if(lighting)material.defines.B2_DENSITY_LIGHTING=1;else delete material.defines.B2_DENSITY_LIGHTING;if(mineral)material.defines.B2_MINERAL_FIELD=1;else delete material.defines.B2_MINERAL_FIELD;material.needsUpdate=true;
  material.onBeforeCompile=shader=>{
   shader.uniforms=shader.uniforms||{};shader.uniforms.b2GroundDetail={value:B.GROUND_DETAIL.texture()};shader.uniforms.b2GroundJoin={value:groundJoin?1:0};shader.uniforms.b2RockDetail={value:B.ROCK_DETAIL.texture()};shader.uniforms.b2RockNormal={value:B.ROCK_DETAIL.normalTexture()};
   if(lighting){shader.uniforms.b2DensityVolume={value:lighting.texture};shader.uniforms.b2DensityOrigin={value:lighting.origin};shader.uniforms.b2DensityStrength=lighting.strength;}
   if(mineral){shader.uniforms.b2MineralVolume={value:mineral.texture};shader.uniforms.b2MineralOrigin={value:mineral.origin};shader.uniforms.b2MineralStrength=mineral.strength;}
   shader.vertexShader='varying vec3 vGround; varying vec3 vGroundNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=(modelMatrix*vec4(transformed,1.)).xyz;vGroundNormal=normalize(vec3(dot(normalMatrix*normal,viewMatrix[0].xyz),dot(normalMatrix*normal,viewMatrix[1].xyz),dot(normalMatrix*normal,viewMatrix[2].xyz)));');
   shader.fragmentShader='varying vec3 vGround; varying vec3 vGroundNormal;\n'+glsl+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 b2WorldNormal=normalize(vGroundNormal);
    float b2RockBlend=smoothstep(1.5,7.,-vGround.y);
    // Keep texture derivatives defined across depth transitions.
    vec4 b2RockData=b2RockSample(vGround,b2WorldNormal);
    float b2WetMask=b2Wetness(vGround,b2WorldNormal,b2RockData);
    diffuseColor.rgb=b2Terrain(vGround,b2WorldNormal,diffuseColor.rgb,b2RockData);
    diffuseColor.rgb*=1.-b2WetMask*.21;
    #ifdef B2_MINERAL_FIELD
    vec4 b2Inclusion=b2InclusionSample(vGround);
    // A tight, broken mineral boundary, not the blurred footprint of the volume.
    vec4 b2OreRock=b2RockSample(vGround*3.2+vec3(17.,-9.,31.),b2WorldNormal);
    float b2OreWeight=smoothstep(.12,.50,b2Inclusion.a)*b2RockBlend;
    b2OreWeight*=mix(.24,1.,smoothstep(.29,.61,b2OreRock.r));
    diffuseColor.rgb=mix(diffuseColor.rgb,b2Inclusion.rgb/max(.004,b2Inclusion.a)*(.34+.91*b2OreRock.r),b2OreWeight*.95);
    #endif
    `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    float b2DryRoughness=.61+.25*b2RockData.b;
    float b2WetRoughness=.14+.13*b2RockData.b;
    roughnessFactor=mix(roughnessFactor,mix(b2DryRoughness,b2WetRoughness,b2WetMask),b2RockBlend);
    #ifdef B2_MINERAL_FIELD
    roughnessFactor=mix(roughnessFactor,.25+.16*b2OreRock.b,b2OreWeight);
    #endif
    `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
    #ifdef B2_MINERAL_FIELD
    metalnessFactor=mix(metalnessFactor,.75,b2OreWeight);
    #endif
    `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    float strataHeight=b2Height(vGround)*(1.-smoothstep(5.,22.,length(vViewPosition)))*(1.-b2RockBlend);
    strataHeight+=b2SurfaceHeight(vGround,b2WorldNormal,diffuseColor.rgb)*(1.-smoothstep(5.,22.,length(vViewPosition)))*(1.-b2RockBlend);
    strataHeight-=b2RockBeds(vGround)*.003*b2RockBlend;
    vec3 strataQ0=dFdx(-vViewPosition),strataQ1=dFdy(-vViewPosition),strataR0=cross(strataQ1,normal),strataR1=cross(normal,strataQ0);
    float strataDet=dot(strataQ0,strataR0);
    if(abs(strataDet)>1e-8)normal=normalize(abs(strataDet)*normal-sign(strataDet)*(dFdx(strataHeight)*strataR0+dFdy(strataHeight)*strataR1));
    vec3 b2Face=normalize(cross(dFdx(-vViewPosition),dFdy(-vViewPosition)));
    b2Face*=gl_FrontFacing?1.:-1.;
    normal=normalize(mix(normal,b2Face,.20*b2RockBlend));
    vec3 b2RockSlope=b2RockGradient(vGround,b2WorldNormal);
    #ifdef B2_MINERAL_FIELD
    vec3 b2OreSlope=b2RockGradient(vGround*3.2+vec3(17.,-9.,31.),b2WorldNormal);
    b2RockSlope=mix(b2RockSlope,b2OreSlope,.70*b2OreWeight);
    #endif
    normal=normalize(normal-mat3(viewMatrix)*b2RockSlope*b2RockBlend*(1.-smoothstep(12.,45.,length(vViewPosition))));
    `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <clearcoat_normal_fragment_maps>',`#include <clearcoat_normal_fragment_maps>
    #ifdef USE_CLEARCOAT
    clearcoatNormal=normal;
    #endif
    `);
   // Use the lighting BRDF's own dielectric Fresnel; never add an unlit rim glow.
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
    #ifdef USE_CLEARCOAT
    material.clearcoat=b2WetMask*b2RockBlend*.42;
    material.clearcoatRoughness=.23+.10*(1.-b2WetMask);
    #endif
    `);
   // This is texture micro-occlusion, not geometric AO or a GI solution.
   shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
    reflectedLight.indirectDiffuse*=mix(1.,.68+.32*b2RockData.a,b2RockBlend);
    #ifdef B2_DENSITY_LIGHTING
    reflectedLight.indirectDiffuse*=mix(1.,b2FieldAmbient(vGround,b2WorldNormal),b2RockBlend);
    #endif
    `);
   if(lighting){
    const contact=`
     { if(directLight.visible&&b2RockBlend>.001&&dot(directLight.color,vec3(1.))>0.){ vec3 b2LightWorld=inverseTransformDirection(directLight.direction,viewMatrix);
     directLight.color*=mix(1.,b2FieldContact(vGround,b2WorldNormal,b2LightWorld,length(LIGHT.position-geometry.position)),b2RockBlend); }}`;
    const chunk=T.ShaderChunk.lights_fragment_begin.replace('getPointLightInfo( pointLight, geometry, directLight );','getPointLightInfo( pointLight, geometry, directLight );'+contact.replace('LIGHT','pointLight')).replace('getSpotLightInfo( spotLight, geometry, directLight );','getSpotLightInfo( spotLight, geometry, directLight );'+contact.replace('LIGHT','spotLight'));
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',chunk);
   }
  };
 }};
 B.SKY_LOOK={zenith:'#7599a2',horizon:'#d8cbb0',sun:'#fff0c4'};
 B.View.prototype.makeLook=function(){
  // World meshes have not been bound yet. Only the editable terrain gets a coat.
  const oldTerrain=this.terrainMaterial;
  this.terrainMaterial=new T.MeshPhysicalMaterial({vertexColors:true,color:oldTerrain.color,roughness:oldTerrain.roughness,metalness:0,clearcoat:1,clearcoatRoughness:.2});
  oldTerrain.dispose();
  this.caveLighting=B.createCaveLighting(this.renderer);
  this.caveMinerals=B.createMineralField(this.renderer);
  B.TERRAIN_LOOK.apply(this.terrainMaterial,true,this.caveLighting,this.caveMinerals);
  this.palette.grass.color.set('#71854e').convertSRGBToLinear();
  B.TERRAIN_LOOK.apply(this.palette.grass,true);
  this.palette.leaf.color.set('#526e49').convertSRGBToLinear();
  this.palette.leafLight=this.palette.leaf.clone();this.palette.leafLight.color.set('#7e9254').convertSRGBToLinear();
  this.palette.leafShade=this.palette.leaf.clone();this.palette.leafShade.color.set('#3c5846').convertSRGBToLinear();
  this.sun.position.set(-38,52,-18);this.sun.target.position.set(0,0,22);this.scene.add(this.sun.target);
  Object.assign(this.sun.shadow.camera,{left:-66,right:66,top:66,bottom:-66,near:1,far:155});this.sun.shadow.camera.updateProjectionMatrix();
  const color=x=>new T.Color(x).convertSRGBToLinear();
  const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{zenith:{value:color(B.SKY_LOOK.zenith)},horizon:{value:color(B.SKY_LOOK.horizon)},sunColor:{value:color(B.SKY_LOOK.sun)},sunDirection:{value:this.sun.position.clone().sub(this.sun.target.position).normalize()},daylight:{value:1},deepFog:{value:new T.Color()}},
   vertexShader:'varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`uniform vec3 zenith,horizon,sunColor,sunDirection,deepFog;uniform float daylight;varying vec3 skyDirection;
    void main(){vec3 d=normalize(skyDirection);float h=smoothstep(-.03,.75,d.y);vec3 sky=mix(horizon,zenith,h);float sun=pow(max(0.,dot(d,sunDirection)),160.);sky+=sunColor*sun*.38;gl_FragColor=vec4(mix(deepFog,sky,daylight),1.);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    }`});
  this.skyDome=new T.Mesh(new T.SphereGeometry(190,24,12),mat);this.skyDome.userData.beautySky=true;this.skyDome.frustumCulled=false;this.skyDome.renderOrder=-100;this.scene.add(this.skyDome);

 };
 B.View.prototype.renderLook=function(game,daylight){
  this.caveLighting?.update(game.world,this.camera.position);
  this.caveMinerals?.update(game.world,this.camera.position,this.caveOreNodes||[],this.caveOreRevision||0);
  this.skyDome.position.copy(this.camera.position);this.skyDome.visible=daylight>.01;
  this.skyDome.material.uniforms.daylight.value=daylight;this.skyDome.material.uniforms.deepFog.value.copy(this.scene.fog.color);
  this.toolKey.color.copy(this.lamp.color).lerp(new T.Color('#fff1d4'),daylight);this.toolKey.intensity=1.3+.3*daylight;
  B.CAVE_ART.renderAtmosphere(this,game,daylight);
 };
 B.View.prototype.makeToolFinish=function(){
  const p=this.palette;
  for(let i=0;i<11;i++){
   const a=-2.4+i*.48,tick=this.box(this.tool,Math.sin(a)*.048,.025+Math.cos(a)*.048,.208,.002,.009,.002,i>7?p.red:p.dark);tick.rotation.z=-a;
  }
  for(let i=0;i<5;i++)this.box(this.tool,0,-.14-i*.036,.07,.126,.012,.147,p.black);
  this.sign(this.tool,'BELL WORKS','02 / FIELD CUTTER',0,-.073,.21,.112,.036,0,'#263434','#ddc887');
  for(const side of [-1,1]){
   this.box(this.tool,side*.13,.095,.02,.013,.021,.25,p.pale);
   for(let i=0;i<3;i++){const chip=this.box(this.tool,side*.137,.07-i*.034,.12-i*.04,.003,.009,.027,p.metal);chip.rotation.x=.3;}
  }
 };
 B.View.prototype.makeFormation=function(root,theme,ceiling,height,radius,growth,glow){
  root.userData.formation=theme===0&&!ceiling?'lantern-cap':theme===1&&ceiling?'chalk-roots':'mineral-cluster';
  const add=(geometry,material,x,y,z)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);root.add(m);return m;};
  if(theme===0&&!ceiling){
   const forms=B.CaveForms.fungus(radius,height,root.position.x*.73+root.position.z*1.17);
   add(forms.stem,growth,0,height*.35,0);
   const cap=add(forms.cap,glow,0,height*.7,0);cap.scale.y=.42;
   add(forms.gills,growth,0,height*.69,0);
  }else if(theme===1&&ceiling){
   for(let i=0;i<3;i++){const points=[];for(let j=0;j<9;j++){const t=j/8;points.push(new T.Vector3(Math.sin(t*4+i)*t*radius,-t*height*(1-i*.16),Math.cos(t*3+i)*t*radius));}add(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.025+i*.006,5,false),growth,0,0,0);}
  }else{
   for(let i=0;i<3;i++){const h=height*(1-i*.23),seed=root.position.x*.73+root.position.z*1.17+i*2.8,m=add(B.CaveForms.ordinary(radius*(i? .58:1),h,seed,ceiling?'drop':'prism'),i===0?growth:glow,(i-1)*radius*.42,(ceiling?-1:1)*h*.45,0);m.rotation.z=(ceiling?Math.PI:0)+(i-1)*.16;}
  }
 };
})(B2);

/* R4 ore/atmosphere adapters. Existing ID slots, matrices and culling remain owned
   by View. No new ore, rewards or lights are spawned by these adapters. */
(function(B){
 'use strict';
 const T=THREE;
 const ORE=[
  {color:'#d99054',roughness:.31,metalness:.83,emission:0,crystal:0},
  {color:'#4f6578',roughness:.33,metalness:.72,emission:0,crystal:0},
  {color:'#9bdcf0',roughness:.19,metalness:.50,emission:.016,crystal:.72},
  {color:'#ffd35b',roughness:.23,metalness:.94,emission:0,crystal:0},
  {color:'#77f8df',roughness:.16,metalness:.22,emission:.22,crystal:1}
 ];
 function oreTraits(kind){const o=ORE[kind];if(!o)throw new RangeError('Unknown ore kind');return [o.roughness,o.metalness,o.emission,o.crystal];}
 function oreGeometry(){
  // Constrain both morph targets to the OLD dodecahedron's convex envelope.
  // Physics remains conservative; the new concavities are visual, not colliders.
  const hull=new T.DodecahedronGeometry(1,0),pos=hull.attributes.position,planes=[];
  for(let i=0;i<pos.count;i+=3){const a=new T.Vector3().fromBufferAttribute(pos,i),b=new T.Vector3().fromBufferAttribute(pos,i+1),c=new T.Vector3().fromBufferAttribute(pos,i+2),n=b.sub(a).cross(c.sub(a)).normalize();if(n.dot(a)<0)n.negate();if(!planes.some(p=>p.n.dot(n)>.9999))planes.push({n,d:n.dot(a)});}
  const clamp=p=>{let k=1;for(const plane of planes){const d=plane.n.dot(p);if(d>plane.d)k=Math.min(k,plane.d/d);}return p.multiplyScalar(k);};
  const positions=[],crystals=[];
  const lobes=[[0,-.04,0,.63],[.44,.16,-.10,.39],[-.37,.22,.22,.40],[.07,-.40,.26,.35],[.06,.43,.10,.36]];
  for(let j=0;j<lobes.length;j++){
   const [x,y,z,r]=lobes[j],g=new T.IcosahedronGeometry(1,0),a=g.attributes.position;
   const q=new T.Quaternion().setFromEuler(new T.Euler(j*.71,j*1.17,j*.32));
   for(let i=0;i<a.count;i++){
    const v=new T.Vector3().fromBufferAttribute(a,i).applyQuaternion(q);
    const p=clamp(v.clone().multiplyScalar(r).add(new T.Vector3(x,y,z)));
    const c=clamp(new T.Vector3(v.x*r*.64+x*.8,v.y*r*1.22+y,v.z*r*.68+z*.8));
    positions.push(...p.toArray());crystals.push(...c.toArray());
   }g.dispose();
  }
  hull.dispose();const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('b2CrystalPosition',new T.Float32BufferAttribute(crystals,3));geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();return geo;
 }
 function oreMaterial(mat){
  mat.customProgramCacheKey=()=> 'b2-mineral-ore-4';mat.needsUpdate=true;
  mat.onBeforeCompile=s=>{
   s.uniforms=s.uniforms||{};s.uniforms.b2OreRock={value:B.ROCK_DETAIL.texture()};s.uniforms.b2OreNormal={value:B.ROCK_DETAIL.normalTexture()};
   s.vertexShader='attribute vec4 b2OreTraits; attribute vec3 b2CrystalPosition; varying vec4 vOreTraits; varying vec3 vOreLocal;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vOreTraits=b2OreTraits;transformed=mix(position,b2CrystalPosition,b2OreTraits.w);vOreLocal=transformed;`);
   s.fragmentShader='uniform sampler2D b2OreRock,b2OreNormal; varying vec4 vOreTraits; varying vec3 vOreLocal;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 oreLocalNormal=normalize(cross(dFdx(vOreLocal),dFdy(vOreLocal)));
    vec3 oreAxes=pow(abs(oreLocalNormal),vec3(4.));oreAxes/=max(.0001,oreAxes.x+oreAxes.y+oreAxes.z);
    vec2 oreUVx=vOreLocal.yz*1.38+vec2(.31,.17),oreUVy=vOreLocal.xz*1.38+vec2(.11,.53),oreUVz=vOreLocal.xy*1.38+vec2(.73,.29);
    vec4 oreRock=texture2D(b2OreRock,oreUVx)*oreAxes.x+texture2D(b2OreRock,oreUVy)*oreAxes.y+texture2D(b2OreRock,oreUVz)*oreAxes.z;
    float oreCrust=(1.-smoothstep(.21,.40,oreRock.r))*(1.-vOreTraits.w*.60);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.038,.049,.058),oreCrust*.68);
    diffuseColor.rgb*=.60+oreRock.r*.64;`);
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=mix(clamp(vOreTraits.x+(oreRock.b-.5)*.16,.13,.9),.68,oreCrust);`);
   s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    // Derivatives transform the baked local surface gradient through the actual
    // instanced, nonuniform ore pose. No quantized-height differentiation.
    vec3 oreNx=texture2D(b2OreNormal,oreUVx).rgb*2.-1.,oreNy=texture2D(b2OreNormal,oreUVy).rgb*2.-1.,oreNz=texture2D(b2OreNormal,oreUVz).rgb*2.-1.;
    vec2 oreGx=-oreNx.xy/max(.2,oreNx.z),oreGy=-oreNy.xy/max(.2,oreNy.z),oreGz=-oreNz.xy/max(.2,oreNz.z);
    vec3 oreGradient=vec3(0.,oreGx.x,oreGx.y)*oreAxes.x+vec3(oreGy.x,0.,oreGy.y)*oreAxes.y+vec3(oreGz.x,oreGz.y,0.)*oreAxes.z;
    vec3 oreQ0=dFdx(-vViewPosition),oreQ1=dFdy(-vViewPosition),oreR0=cross(oreQ1,normal),oreR1=cross(normal,oreQ0);
    float oreDet=dot(oreQ0,oreR0);
    vec2 oreDh=vec2(dot(oreGradient,dFdx(vOreLocal)),dot(oreGradient,dFdy(vOreLocal)));
    if(abs(oreDet)>1e-8)normal=normalize(abs(oreDet)*normal-sign(oreDet)*(oreDh.x*oreR0+oreDh.y*oreR1)*.065);`);
   s.fragmentShader=s.fragmentShader.replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
    metalnessFactor=mix(vOreTraits.y,.04,oreCrust);`);
   s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    totalEmissiveRadiance+=diffuseColor.rgb*vOreTraits.z*(1.-oreCrust);`);
  };
 }
 function decorateOre(view,deposits){
  view.caveOreNodes=deposits.nodes;view.caveOreRevision=(view.caveOreRevision||0)+1;
  if(!view.oreMesh)return;
  const template=oreGeometry(),meshes=[view.oreMesh,...view.oreBatches],materials=new Set();
  for(const mesh of meshes){
   const old=mesh.geometry,g=template.clone();
   // r140 instance culling uses geometry bounds, not the unit template bound.
   g.boundingBox=old.boundingBox?.clone()||null;g.boundingSphere=old.boundingSphere?.clone()||null;
   g.setAttribute('b2OreTraits',new T.InstancedBufferAttribute(new Float32Array(mesh.instanceMatrix.count*4),4));
   mesh.geometry=g;old.dispose();materials.add(mesh.material);
  }
  template.dispose();
  for(const n of deposits.nodes){
   const slot=view.oreSlots.get(n.id);if(!slot)throw new Error('Missing existing ore ID slot');
   const values=oreTraits(n.kind),color=new T.Color(ORE[n.kind].color).convertSRGBToLinear();
   for(const [mesh,i]of [[view.oreMesh,n.id],[slot.mesh,slot.index]]){
    if(i<0||i>=mesh.instanceMatrix.count)throw new RangeError('Invalid existing ore slot');
    mesh.geometry.attributes.b2OreTraits.setXYZW(i,...values);mesh.setColorAt(i,color);
   }
  }
  for(const mesh of meshes){mesh.geometry.attributes.b2OreTraits.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  for(const mat of materials)oreMaterial(mat);
 }
 function makeDust(){
  const count=128,random=B.random(47831),p=new Float32Array(count*3);
  for(let i=0;i<p.length;i++)p[i]=random()*18;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
  const m=new T.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,blending:T.AdditiveBlending,
   uniforms:{eye:{value:new T.Vector3()},aim:{value:new T.Vector3()},time:{value:0},gain:{value:0},pointScale:{value:1}},
   vertexShader:`uniform vec3 eye,aim;uniform float time,gain,pointScale;varying float dustAlpha;
    void main(){vec3 p=eye+mod(position+vec3(time*.021,-time*.034,time*.014)-eye+9.,18.)-9.;
     vec3 delta=p-eye;float d=length(delta),cone=smoothstep(.82,.98,dot(normalize(delta),aim));
     dustAlpha=gain*cone*(1.-smoothstep(4.,8.,d))*smoothstep(.6,1.7,d)*.24;
     vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pointScale*4.5/max(1.,-mv.z),1.,3.);}`, 
   fragmentShader:`varying float dustAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.59,.75,.86,dustAlpha*(1.-r*r));
    #include <tonemapping_fragment>
    #include <encodings_fragment>
   }`});
  const points=new T.Points(g,m);points.frustumCulled=false;points.name='cave-air-r4';points.visible=false;return points;
 }
 const lampCool=new T.Color('#c6ddf6').convertSRGBToLinear(),lampKey=new T.Color('#e7f1ff').convertSRGBToLinear(),fogCool=new T.Color('#03070e').convertSRGBToLinear();
 function renderAtmosphere(view,game,daylight){
  const depth=Math.max(0,-view.camera.position.y),underground=T.MathUtils.smoothstep(depth,2,14);
  if(!view.caveDust){view.caveDust=makeDust();view.scene.add(view.caveDust);}
  const u=view.caveDust.material.uniforms;view.caveDust.visible=underground>.01;
  if(underground<=0)return;
  if(view.hemi)view.hemi.intensity*=1-underground*.32;
  if(view.lamp){view.lamp.color.lerp(lampCool,underground*.70);view.lamp.intensity*=1-underground*.76;}
  if(view.headlamp){view.headlamp.color.lerp(lampKey,underground*.70);view.headlamp.intensity*=1+underground*.12;}
  if(view.scene.fog){view.scene.fog.color.lerp(fogCool,underground*.84);view.scene.fog.near=T.MathUtils.lerp(view.scene.fog.near,8,underground);view.scene.fog.far=T.MathUtils.lerp(view.scene.fog.far,34,underground);view.scene.background?.copy(view.scene.fog.color);}
  u.eye.value.copy(view.camera.position);view.camera.getWorldDirection(u.aim.value);u.time.value=Number.isFinite(game.clock)?game.clock:0;u.gain.value=underground*(.5+T.MathUtils.smoothstep(depth,24,85)*.5);u.pointScale.value=view.renderer?.getPixelRatio?.()||1;
 }
 B.CAVE_ART={oreTraits,oreGeometry,decorateOre,makeDust,renderAtmosphere};
 const updateOre=B.View.prototype.updateOre;
 if(updateOre)B.View.prototype.updateOre=function(n){updateOre.call(this,n);this.caveOreRevision=(this.caveOreRevision||0)+1;};
 const setDeposits=B.View.prototype.setDeposits;
 if(setDeposits)B.View.prototype.setDeposits=function(deposits){setDeposits.call(this,deposits);decorateOre(this,deposits);};
})(B2);
