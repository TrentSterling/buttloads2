/* Solid native mineral forms. Existing anchors and material batches own placement. */
'use strict';
(function(B){
 const T=THREE;
 function geometry(points,indices,color){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex(indices);g.computeVertexNormals();
  const colors=[],uv=[];for(const [x,y,z]of points){const variation=.92+.05*Math.sin(x*21+y*13+z*17)+.025*Math.sin(x*43-z*25);colors.push(...color(x,y,z,variation));uv.push(x,z);}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingBox();g.computeBoundingSphere();return g;
 }
 function shelf(radius,seed=0){
  const p=[],ix=[],segments=28,rings=4;
  const point=(t,a,bottom)=>{const scallop=1+.040*Math.sin(a*7+seed)+.021*Math.sin(a*13-seed*.7),r=radius*t*scallop,x=Math.cos(a)*r*(1+.12*Math.sin(seed)),z=Math.sin(a)*r*.82-radius*.08*(1-t),arch=radius*(.19*Math.sin(t*Math.PI*.82)+.024*Math.sin(a*4+seed)*t),thickness=radius*(.025+.15*Math.sin(t*Math.PI*.94)),gills=bottom?radius*.008*Math.sin(a*30+seed)*t:0,y=arch-(bottom?thickness:0)+gills;return[x,y,z];};
  for(const bottom of [false,true]){const start=p.length;p.push(point(0,0,bottom));for(let j=1;j<=rings;j++)for(let i=0;i<=segments;i++)p.push(point(j/rings,i/segments*Math.PI,bottom));
   const tri=(a,b,c)=>ix.push(...(bottom?[a,c,b]:[a,b,c]));for(let i=0;i<segments;i++)tri(start,start+2+i,start+1+i);
   for(let j=0;j<rings-1;j++)for(let i=0;i<segments;i++){const a=start+1+j*(segments+1)+i,b=a+1,c=a+segments+1,d=c+1;tri(a,b,d);tri(a,d,c);}
  }
  const half=p.length/2,contour=[0,...Array.from({length:rings},(_,j)=>1+j*(segments+1)),...Array.from({length:segments},(_,i)=>1+(rings-1)*(segments+1)+i+1),...Array.from({length:rings-1},(_,j)=>1+(rings-2-j)*(segments+1)+segments)];
  for(let i=0;i<contour.length;i++){const a=contour[i],b=contour[(i+1)%contour.length];ix.push(a,b,b+half,a,b+half,a+half);}
  const g=geometry(p,ix,(x,y,z,v)=>{const t=Math.hypot(x,z)/radius,band=.70+.22*Math.sin(t*28+seed)**2,lip=.13*Math.max(0,(t-.87)/.13);return[v*(band+lip),v*(band*.92+lip),v*(band*.74+lip)];});
  const color=g.attributes.color;for(let i=half;i<p.length;i++)color.setXYZ(i,1.18,.99,.68);
  g.userData.gills=[.4,1.3,2.2].map(a=>Array.from({length:6},(_,i)=>{const q=point(.18+.61*i/5,a,true);q[1]-=.002;return q;}));return g;
 }
 function drapery(seed=0,drops=[.16,.17,.14,.19,.15]){
  const p=[],ix=[],parts=[];
  // A buried deposit shoulder joins the thick runnels. Each shell closes
  // independently, so the existing wall-conformation pass keeps solid backs.
  const start=p.length,sides=24,levels=10,top=p.length;
  p.push([0,.66,.035]);
  for(let j=1;j<levels;j++)for(let i=0;i<sides;i++){
   const a=i/sides*Math.PI*2,t=j/levels*Math.PI,bulge=1+.11*Math.sin(a*3+seed+t*2)+.045*Math.sin(a*7-seed),r=Math.sin(t)*bulge;
   p.push([Math.cos(a)*r*.68,.45+Math.cos(t)*.21+.035*Math.sin(a*3+seed)*Math.sin(t),Math.sin(a)*r*.24+.035]);
  }
  const bottom=p.length;p.push([0,.24,.035]);
  for(let i=0;i<sides;i++)ix.push(top,1+(i+1)%sides,1+i);
  for(let j=0;j<levels-2;j++)for(let i=0;i<sides;i++){const a=1+j*sides+i,b=1+j*sides+(i+1)%sides,c=a+sides,d=b+sides;ix.push(a,b,d,a,d,c);}
  for(let i=0;i<sides;i++)ix.push(bottom,1+(levels-2)*sides+i,1+(levels-2)*sides+(i+1)%sides);
  parts.push({kind:'shoulder',start,count:p.length-start});
  const ringTimes=[0,.12,.24,.36,.50,.65,.78,.90,1],centers=[-.48,-.28,-.02,.18,.43];
  for(let k=0;k<5;k++){
   const first=p.length,phase=seed*.41+k*1.77,x0=centers[k]+.04*Math.sin(phase*2),height=.36+drops[k]*2.5+.425*(1+Math.sin(phase+.5)),width=(k===2?.13:.085)+.0175*(1+Math.sin(phase*1.3)),z0=.05+.035*Math.sin(phase)**2,topY=.46+.025*Math.sin(phase),bend=.085*Math.sin(phase*1.7),segments=15,profile=[.32,.66,.92,1.06,.91,.80,.70,.45,.14];
   for(let j=0;j<ringTimes.length;j++){const t=ringTimes[j];
    const radius=width*profile[j]*(1+.09*Math.sin(t*19+phase)),cx=x0+bend*t*t,cy=topY-height*t,cz=z0+.12*Math.sin(t*Math.PI*.6);
    for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,flute=1+.20*Math.sin(a*5+phase+t*.6)+.055*Math.sin(a*3-phase),r=radius*flute;p.push([cx+Math.cos(a)*r,cy,cz+Math.sin(a)*r*.82]);}
   }
   for(let j=0;j<ringTimes.length-1;j++)for(let i=0;i<segments;i++){const a=first+j*segments+i,b=first+j*segments+(i+1)%segments,c=a+segments,d=b+segments;ix.push(a,b,d,a,d,c);}
   for(const end of [0,ringTimes.length-1]){const t=ringTimes[end],center=p.length;p.push([x0+bend*t*t,topY-height*t,z0+.12*Math.sin(t*Math.PI*.6)]);for(let i=0;i<segments;i++){const a=first+end*segments+i,b=first+end*segments+(i+1)%segments;ix.push(...(end?[center,a,b]:[center,b,a]));}}
   parts.push({kind:'runnel',start:first,count:p.length-first,mount:[x0,topY],rimCount:segments});
  }
  const g=geometry(p,ix,(x,y,z,v)=>{const band=.71+.11*Math.sin(y*20+seed+.8*Math.sin(x*3)),stain=.22*Math.sin(x*32+seed+.7*Math.sin(y*3))**10,shade=band-stain;return[v*shade,v*shade*.91,v*shade*.73];});
  g.userData.chalkParts=parts;return g;
 }
 function crystal(radius,length,seed=0){
  const p=[],ix=[],sides=6,phase=seed*.37,rings=[[-.04,radius*.97],[length*.12,radius],[length*.73,radius*.96],[length*.91,radius*.85]];
  const ring=rings.map(([y,r],k)=>Array.from({length:sides},(_,i)=>{const a=i/sides*Math.PI*2+phase,wide=1+.12*Math.sin(seed+i*2.4),lean=y*.035;return[Math.cos(a)*r*wide+lean,y+(k===3?radius*.30*Math.sin(a+seed):0),Math.sin(a)*r*wide];}));
  const face=points=>{const s=p.length;p.push(...points);for(let i=1;i<points.length-1;i++)ix.push(s,s+i,s+i+1);};
  for(let k=0;k<ring.length-1;k++)for(let i=0;i<sides;i++){const j=(i+1)%sides;face([ring[k][i],ring[k+1][i],ring[k+1][j],ring[k][j]]);}
  const tip=[length*.035+radius*.18*Math.sin(seed),length+radius*.55,radius*.19*Math.cos(seed)];for(let i=0;i<sides;i++)face([ring[3][i],tip,ring[3][(i+1)%sides]]);face(ring[0]);
  return geometry(p,ix,(x,y,z,v)=>{const inclusion=.84+.12*Math.sin(y*31+seed),termination=y>length*.73?1.25:.98;return[v*inclusion*.96*termination,v*inclusion*.97*termination,v*inclusion*termination];});
 }
 function stalactite(radius,length,seed=0){
  const p=[],ix=[],segments=10,rings=8;
  for(let j=0;j<=rings;j++)for(let i=0;i<segments;i++){const t=j/rings,a=i/segments*Math.PI*2,r=radius*(.03+.97*(1-t)**1.4)*(1+.12*Math.sin(a*3+seed+t*6));p.push([Math.cos(a)*r+Math.sin(t*2+seed)*t*radius*.25,-t*length,Math.sin(a)*r]);}
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*segments+i,b=j*segments+(i+1)%segments,c=a+segments,d=b+segments;ix.push(a,b,d,a,d,c);}
  for(const end of [0,rings]){const center=p.length;p.push([end?Math.sin(2+seed)*radius*.25:0,end?-length:0,0]);for(let i=0;i<segments;i++){const a=end*segments+i,b=end*segments+(i+1)%segments;ix.push(...(end?[center,a,b]:[center,b,a]));}}
  return geometry(p,ix,(x,y,z,v)=>[v,v,v*.94]);
 }
 // Ordinary growth stays centered on the former cone axis and consumes no
 // placement RNG. Mapped colours share the existing supported material cells.
 function ordinary(radius,length,seed=0,kind='prism',cluster=false){
  const points=[],indices=[],face=vertices=>{const start=points.length;points.push(...vertices);for(let i=1;i<vertices.length-1;i++)indices.push(start,start+i,start+i+1);};
  const shell=(r,h,offset,phase,bend,drop,small=false)=>{
   const sides=drop?7:6,levels=drop?[[0,1.12],[.18,.95],[.40,.52],[.73,.23],[1,.025]]:small?[[0,.80],[.70,.93],[1,.19]]:[[0,.81],[.10,1],[.73,.87],[1,.19]];
   const rings=levels.map(([t,width])=>Array.from({length:sides},(_,i)=>{const a=i/sides*Math.PI*2+phase,uneven=1+.13*Math.sin(i*2.31+seed),drift=bend*t*t,flute=drop?1+.14*Math.sin(a*3+seed+t*4):1;return[offset[0]+Math.cos(a)*r*width*uneven*flute+drift,offset[1]+h*t+(drop?0:r*.28*Math.sin(a+phase)*t),offset[2]+Math.sin(a)*r*width*uneven+drift*.37];}));
   for(let k=0;k<rings.length-1;k++)for(let i=0;i<sides;i++){const j=(i+1)%sides;face([rings[k][i],rings[k+1][i],rings[k+1][j],rings[k][j]]);}
   face(rings[0]);face(rings[rings.length-1].slice().reverse());
  };
  shell(radius,length,[0,-length*.5,0],seed*.37,radius*Math.sin(seed)*(kind==='drop'?1.25:.42),kind==='drop');
  if(cluster&&kind!=='drop'){
   shell(radius*.43,length*(.33+.14*Math.sin(seed)),[radius*.62,-length*.5,radius*.32],seed*.37+.42,radius*.65,false,true);
   shell(radius*.31,length*(.54+.12*Math.cos(seed)),[-radius*.55,-length*.5,-radius*.40],seed*.37-.27,-radius*.55,false,true);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex(indices);g.computeVertexNormals();const uv=[],colors=[];for(const [x,y,z]of points){uv.push(x,z+y*.08);const t=B.clamp(y/length+.5,0,1),mineral=.42+.42*t+.07*Math.sin(y/length*24+seed)+.045*Math.sin(x/radius*9+z/radius*5+seed);colors.push(mineral*.94,mineral*.97,mineral);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingBox();g.computeBoundingSphere();g.userData.ordinaryGrowth=kind;return g;
 }
 // Three closed pieces retain the original source poses and material cells.
 // The cap's coordinates compensate for its existing .42 Y scale.
 function fungus(radius,height,seed=0){
  const lean=[radius*.13*Math.sin(seed),radius*.10*Math.cos(seed*.8)],segments=24;
  const radial=(t,a)=>{const r=radius*1.6*t*(1+.065*Math.sin(a*3+seed)+.035*Math.sin(a*7-seed));return[lean[0]+Math.cos(a)*r,lean[1]+Math.sin(a)*r*.92];};
  const top=(t,a)=>radius*(.58*Math.pow(Math.max(0,1-t*t),.78)-.035+.065*Math.sin(a*5+seed)*Math.pow(t,4)+.05*Math.sin(a*2+seed)*t*(1-t));
  const underside=(t,a)=>radius*(-.11+.075*t+.065*Math.sin(a*5+seed)*Math.pow(t,4));
  const capPoints=[[lean[0],top(0,0)/.42,lean[1]]],capIndex=[],levels=[.22,.50,.78,1];
  for(const t of levels)for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,[x,z]=radial(t,a);capPoints.push([x,top(t,a)/.42,z]);}
  for(let i=0;i<segments;i++)capIndex.push(0,1+(i+1)%segments,1+i);
  for(let j=0;j<levels.length-1;j++)for(let i=0;i<segments;i++){const a=1+j*segments+i,b=1+j*segments+(i+1)%segments,c=a+segments,d=b+segments;capIndex.push(a,b,d,a,d,c);}
  const lowerCenter=capPoints.length;capPoints.push([lean[0],underside(0,0)/.42,lean[1]]);const lowerStart=capPoints.length;
  for(const t of levels.slice(0,-1))for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,[x,z]=radial(t,a);capPoints.push([x,underside(t,a)/.42,z]);}
  const lowerRing=(j,i)=>j===3?1+3*segments+i:lowerStart+j*segments+i;
  for(let i=0;i<segments;i++)capIndex.push(lowerCenter,lowerStart+i,lowerStart+(i+1)%segments);
  for(let j=0;j<3;j++)for(let i=0;i<segments;i++){const a=lowerRing(j,i),b=lowerRing(j,(i+1)%segments),c=lowerRing(j+1,i),d=lowerRing(j+1,(i+1)%segments);capIndex.push(a,d,b,a,c,d);}
  const cap=geometry(capPoints,capIndex,(x,y,z,v)=>{const t=Math.min(1,Math.hypot(x-lean[0],(z-lean[1])/.92)/(radius*1.6)),pigment=.055*(1+Math.sin(x/radius*5+Math.sin(z/radius*4+seed)+seed)),lip=Math.pow(t,9)*.13,body=.20+.23*t+pigment;return[v*(body+lip),v*(body*.74+lip*.91),v*(body*.39+lip*.62)];});
  const color=cap.attributes.color;for(let i=lowerCenter;i<capPoints.length;i++)color.setXYZ(i,.40,.35,.24);
  const stemPoints=[],stemIndex=[],sides=10,rings=6,length=height*.7;
  for(let j=0;j<=rings;j++){const t=j/rings,width=radius*(.17+.14*Math.exp(-t*9)+.12*Math.pow(t,7));for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,r=width*(1+.07*Math.sin(a*3+seed+t*2));stemPoints.push([lean[0]*t*t+Math.cos(a)*r,-height*.35+length*t,lean[1]*t*t+Math.sin(a)*r]);}}
  for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides,c=a+sides,d=b+sides;stemIndex.push(a,c,b,b,c,d);}
  for(const end of [0,rings]){const center=stemPoints.length;stemPoints.push([end?lean[0]:0,-height*.35+(end?length:0),end?lean[1]:0]);for(let i=0;i<sides;i++){const a=end*sides+i,b=end*sides+(i+1)%sides;stemIndex.push(...(end?[center,b,a]:[center,a,b]));}}
  const stem=geometry(stemPoints,stemIndex,(x,y,z,v)=>{const t=B.clamp((y+height*.35)/length,0,1),fiber=.03*Math.sin(Math.atan2(z,x)*10+seed),shade=.30+.36*t+fiber;return[v*shade,v*shade*.89,v*shade*.64];});stem.userData.fungalGrowth='stem';stem.userData.rootVertices=Array.from({length:sides},(_,i)=>i);
  const gillPoints=[],gillIndex=[];
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2+seed*.13+.022*Math.sin(i*2.7+seed),phase=.012+(i%3)*.002,first=gillPoints.length,levels=[.15,.53,.93-.025*Math.sin(i*2+seed)];
   for(let j=0;j<3;j++){const t=levels[j],bend=.10*Math.sin(t*3+i*.7+seed)*(t-.15),width=phase*(j===1?1.6:j===2?.4:.8),depth=radius*(j===0?.055:j===1?.14+.025*Math.sin(i*1.7+seed):.020);
    for(const [side,down]of [[-1,false],[1,false],[1,true],[-1,true]]){const angle=a+bend+side*width,[x,z]=radial(t,angle),y=underside(t,angle)+height*.01+(down?-depth:radius*.014);gillPoints.push([x,y,z]);}
   }
   for(let j=0;j<2;j++)for(let k=0;k<4;k++){const a=first+j*4+k,b=first+j*4+(k+1)%4,c=a+4,d=b+4;gillIndex.push(a,b,c,b,d,c);}
   gillIndex.push(first,first+2,first+1,first,first+3,first+2,first+8,first+9,first+10,first+8,first+10,first+11);
  }
  const gills=geometry(gillPoints,gillIndex,(x,y,z,v)=>[v*.29,v*.24,v*.15]);
  for(const [name,g]of Object.entries({cap,stem,gills}))g.userData.fungalPart=name;
  return{cap,stem,gills};
 }
 function growthColors(root){root.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry;if(!g.attributes.color){const data=new Float32Array(g.attributes.position.count*3);data.fill(1);g.setAttribute('color',new T.BufferAttribute(data,3));}const material=mesh.material;material.vertexColors=true;material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance *= vColor;\n#endif');};material.customProgramCacheKey=()=> 'ordinary-mineral-colour-v1';});}
 function mountGrowth(root,world,hit,ceiling=false,axis=null){
  root.updateWorldMatrix(true,true);const point=new T.Vector3(hit.x,hit.y,hit.z),from=axis?new T.Vector3(...axis):new T.Vector3(0,ceiling?-1:1,0),normal=new T.Vector3(...world.normal(hit.x,hit.y,hit.z));if(normal.lengthSq()<.01)normal.copy(from);normal.normalize();
  // Placement runs once before batching. Refine the analytic hit against the
  // sampled field and move the whole solid only as far as its root ring needs.
  const start=point.clone().addScaledVector(normal,.65),surface=world.ray({x:start.x,y:start.y,z:start.z},{x:-normal.x,y:-normal.y,z:-normal.z},1.3),mount=surface?new T.Vector3(surface.x,surface.y,surface.z):point.clone();mount.addScaledVector(normal,-.02);
  const turn=new T.Quaternion().setFromUnitVectors(from.normalize(),normal),rotation=new T.Matrix4().makeRotationFromQuaternion(turn),move=()=>new T.Matrix4().makeTranslation(mount.x,mount.y,mount.z).multiply(rotation).multiply(new T.Matrix4().makeTranslation(-point.x,-point.y,-point.z)),meshes=[],roots=[];
  root.traverse(mesh=>{if(!mesh.isMesh)return;meshes.push(mesh);const geo=mesh.geometry;if(geo.userData.ordinaryGrowth||geo.userData.fungalGrowth){const p=geo.attributes.position,min=geo.boundingBox.min.y;if(!geo.userData.fungalGrowth)geo.userData.rootVertices=Array.from({length:p.count},(_,i)=>i).filter(i=>Math.abs(p.getY(i)-min)<1e-6);for(const i of geo.userData.rootVertices)roots.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));}});
  for(let pass=0;pass<10&&roots.length;pass++){const matrix=move();let worst=-Infinity;for(const p of roots){const v=p.clone().applyMatrix4(matrix);worst=Math.max(worst,world.density(v.x,v.y,v.z));}if(worst<=-.002)break;mount.addScaledVector(normal,-Math.min(.08,Math.max(.005,worst+.005)));}
  const matrix=move();for(const mesh of meshes){const geo=mesh.geometry,transform=mesh.matrixWorld.clone().invert().multiply(matrix).multiply(mesh.matrixWorld);geo.applyMatrix4(transform);geo.computeBoundingBox();geo.computeBoundingSphere();geo.userData.growthMount={normal:normal.toArray(),point:mount.toArray(),matrix:transform.toArray()};}
 }
 B.CaveForms={shelf,drapery,crystal,stalactite,ordinary,fungus,growthColors,mountGrowth};
})(B2);
