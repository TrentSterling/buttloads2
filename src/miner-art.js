/* Authored worker volumes, garment construction and articulated equipment. */
'use strict';
(function(B){
 const T=THREE;
 function loft(rings,segments=16){
  if(rings[0][0]>rings[rings.length-1][0])rings=[...rings].reverse();
  const positions=[],uv=[],indices=[];
  rings.forEach(([y,rx,rz,z=0,x=0],row)=>{for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;positions.push(x+Math.sin(a)*rx,y,z+Math.cos(a)*rz);uv.push(j/segments,row/(rings.length-1));}});
  for(let row=0;row<rings.length-1;row++)for(let j=0;j<segments;j++){const a=row*(segments+1)+j,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
  for(const row of [0,rings.length-1]){const [y,,,z=0,x=0]=rings[row],center=positions.length/3;positions.push(x,y,z);uv.push(.5,.5);for(let j=0;j<segments;j++){const a=row*(segments+1)+j;indices.push(center,...(row?[a,a+1]:[a+1,a]));}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
 }
 function bevel(w,h,d,r=.012){
  const b=Math.min(r,d*.24,w*.2,h*.2),x=w/2-b,y=h/2-b,c=Math.min(r,x*.4,y*.4),s=new T.Shape();
  s.moveTo(-x+c,-y);s.lineTo(x-c,-y);s.quadraticCurveTo(x,-y,x,-y+c);s.lineTo(x,y-c);s.quadraticCurveTo(x,y,x-c,y);s.lineTo(-x+c,y);s.quadraticCurveTo(-x,y,-x,y-c);s.lineTo(-x,-y+c);s.quadraticCurveTo(-x,-y,-x+c,-y);
  const geo=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:3});geo.translate(0,0,-d/2+b);return geo;
 }
 function woven(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#bfc0b9';c.fillRect(0,0,256,256);
  for(let i=0;i<256;i+=3){c.fillStyle=i%2?'#afafa7':'#cbcbc3';c.fillRect(i,0,1,256);c.fillStyle='rgba(48,50,43,.10)';c.fillRect(0,i,256,1);}
  let seed=68132;for(let i=0;i<1800;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%256;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed%256;c.fillStyle=i%3?'rgba(255,255,235,.13)':'rgba(35,37,32,.15)';c.fillRect(x,y,2,1);}
  const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;return tex;
 }
 function mergeRigid(group,exclude=new Set(),recursive=false){
  // Callers identify rigid assemblies. Excluded meshes/groups retain their
  // identity, animation, material changes and independent visibility.
  const buckets=new Map(),collect=node=>{
   for(const mesh of [...node.children]){
    if(exclude.has(mesh)||!mesh.visible)continue;
    if(recursive&&mesh.isGroup){collect(mesh);continue;}
    if(!mesh.isMesh||mesh.isInstancedMesh||mesh.children.length||Array.isArray(mesh.material)||mesh.material.transparent||mesh.geometry.drawRange.start!==0||Number.isFinite(mesh.geometry.drawRange.count)||Object.keys(mesh.geometry.morphAttributes).length)continue;
    const attributes=mesh.geometry.attributes;
    if(Object.keys(attributes).some(k=>!['position','normal','uv','color'].includes(k)||attributes[k].isInterleavedBufferAttribute||attributes[k].normalized))continue;
    const key=[mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.frustumCulled,mesh.renderOrder,mesh.layers.mask,!!mesh.userData.viewmodelOnly].join(':');
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(mesh);
   }
  };collect(group);
  if(recursive)group.updateWorldMatrix(true,true);
  const inverse=recursive?group.matrixWorld.clone().invert():null;
  for(const meshes of buckets.values()){
   if(meshes.length<2){const mesh=meshes[0];mesh.updateMatrix();mesh.matrixAutoUpdate=false;continue;}
   const source=meshes[0],geometries=meshes.map(mesh=>{
    mesh.updateMatrix();return mesh.geometry.clone().applyMatrix4(recursive?new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld):mesh.matrix);
   }),vertices=geometries.reduce((n,g)=>n+g.attributes.position.count,0),indices=geometries.reduce((n,g)=>n+(g.index?.count||g.attributes.position.count),0),geometry=new T.BufferGeometry();
   const names=new Set(geometries.flatMap(g=>Object.keys(g.attributes)));
   for(const name of names){
    const size=geometries.find(g=>g.attributes[name]).attributes[name].itemSize,data=new Float32Array(vertices*size);if(name==='color')data.fill(1);
    let offset=0;for(const geo of geometries){const a=geo.attributes[name];if(a)data.set(a.array,offset*size);offset+=geo.attributes.position.count;}
    geometry.setAttribute(name,new T.BufferAttribute(data,size));
   }
   const index=vertices>65535?new Uint32Array(indices):new Uint16Array(indices);let at=0,offset=0;
   for(const geo of geometries){const n=geo.index?.count||geo.attributes.position.count;for(let i=0;i<n;i++)index[at++]=offset+(geo.index?geo.index.getX(i):i);offset+=geo.attributes.position.count;geo.dispose();}
   geometry.setIndex(new T.BufferAttribute(index,1));geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const mesh=new T.Mesh(geometry,source.material);for(const key of ['castShadow','receiveShadow','frustumCulled','renderOrder'])mesh[key]=source[key];mesh.layers.mask=source.layers.mask;mesh.userData={...source.userData};mesh.matrixAutoUpdate=false;
   for(const old of meshes){old.geometry.dispose();old.parent.remove(old);}group.add(mesh);
  }
 }
 function partitionRigid(mesh,size=96){
  // Only explicit static callers opt in. Whole triangles keep their original
  // attributes; compact per-cell buffers give each batch its actual bounds.
  const source=mesh.geometry,position=source.attributes.position;
  if(!(size>0)||!Number.isFinite(size)||mesh.children.length||Array.isArray(mesh.material)||mesh.material.transparent||source.groups.length||source.drawRange.start!==0||Number.isFinite(source.drawRange.count)||Object.keys(source.morphAttributes).length)throw new Error('Unsupported static partition');
  const names=Object.keys(source.attributes).filter(key=>source.attributes[key].count===position.count);
  if(names.some(key=>source.attributes[key].isInterleavedBufferAttribute||source.attributes[key].normalized)||!names.includes('normal')||mesh.material.vertexColors&&!names.includes('color')||mesh.material.map&&!names.includes('uv'))throw new Error('Incomplete static partition attributes');
  const count=source.index?.count||position.count,cells=new Map();
  for(let i=0;i<count;i+=3){
   const ids=[0,1,2].map(k=>source.index?source.index.getX(i+k):i+k),x=ids.reduce((n,id)=>n+position.getX(id),0)/3,z=ids.reduce((n,id)=>n+position.getZ(id),0)/3,key=Math.floor(x/size)+':'+Math.floor(z/size);
   if(!cells.has(key))cells.set(key,[]);cells.get(key).push(...ids);
  }
  if(cells.size<2)return[mesh];
  const result=[];
  for(const [key,ids]of cells){
   const slots=new Map(),index=[];for(const id of ids){if(!slots.has(id))slots.set(id,slots.size);index.push(slots.get(id));}
   const geo=new T.BufferGeometry();
   for(const name of names){const attribute=source.attributes[name],values=new attribute.array.constructor(slots.size*attribute.itemSize);for(const [old,slot]of slots)values.set(attribute.array.subarray(old*attribute.itemSize,(old+1)*attribute.itemSize),slot*attribute.itemSize);geo.setAttribute(name,new T.BufferAttribute(values,attribute.itemSize));}
   geo.setIndex(index);geo.computeBoundingBox();geo.computeBoundingSphere();
   const node=new T.Mesh(geo,mesh.material);node.name=(mesh.name||'static')+'-cell-'+key;node.position.copy(mesh.position);node.quaternion.copy(mesh.quaternion);node.scale.copy(mesh.scale);node.matrix.copy(mesh.matrix);node.matrixAutoUpdate=mesh.matrixAutoUpdate;
   for(const property of ['castShadow','receiveShadow','frustumCulled','renderOrder','visible'])node[property]=mesh[property];node.layers.mask=mesh.layers.mask;node.userData={...mesh.userData,staticCell:key};mesh.parent?.add(node);result.push(node);
  }
  mesh.parent?.remove(mesh);source.dispose();return result;
 }
 B.WorkshopShapes={loft,bevel,mergeRigid,partitionRigid};
 B.buildMinerArt=function(view,color){
  const root=new T.Group(),materials=[],textures=[],fabric=woven();textures.push(fabric);
  const material=(hex,roughness=.85,metalness=0,extras={})=>{const m=new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness,metalness,...extras});materials.push(m);return m;};
  const dye=new T.Color(B.CREW_COLORS[color]).convertSRGBToLinear().multiplyScalar(.55);
  const cloth=new T.MeshStandardMaterial({color:dye,roughness:.95,map:fabric,bumpMap:fabric,bumpScale:.003});materials.push(cloth);
  const darkCloth=material('#354746',.98,0,{map:fabric,bumpMap:fabric,bumpScale:.002}),shirt=material('#a99e81',.97,0,{map:fabric,bumpMap:fabric,bumpScale:.002}),leather=material('#594635',.87),rubber=material('#252b29',.97),edge=material('#79634b',.85),skin=material('#b98261',.92),skinShadow=material('#8f5e45',.95),hair=material('#403a31',.98),steel=material('#727c79',.47,.72),brass=material('#a58a53',.6,.6),yellow=material('#c38d2f',.74,.08),reflector=material('#d4c6a0',.55,.12),glass=material('#2d444c',.22,.2),lampGlass=material('#e8d5a5',.35,.04,{emissive:new T.Color('#c7a969').convertSRGBToLinear(),emissiveIntensity:.5});
  const add=(parent,geometry,m,x=0,y=0,z=0)=>{const mesh=new T.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const block=(parent,m,x,y,z,w,h,d,r=.012)=>add(parent,bevel(w,h,d,r),m,x,y,z);
  const ball=(parent,m,x,y,z,rx,ry=rx,rz=rx)=>{const mesh=add(parent,new T.SphereGeometry(1,14,10),m,x,y,z);mesh.scale.set(rx,ry,rz);return mesh;};
  const wire=(parent,m,points,r=.003)=>add(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(6,points.length*4),r,5,false),m);
  const bolt=(parent,x,y,z,r=.007)=>{const mesh=add(parent,new T.CylinderGeometry(r,r,.006,6),steel,x,y,z);mesh.rotation.x=Math.PI/2;return mesh;};
  const torso=new T.Group();root.add(torso);
  // A waist, abdomen, ribcage and rounded shoulder line, rather than a rectangular shell.
  add(torso,loft([[.84,.181,.121],[.89,.197,.134],[.96,.192,.135],[1.06,.210,.145],[1.19,.237,.147],[1.29,.242,.13],[1.35,.204,.115],[1.38,.112,.085]],20),cloth);
  add(torso,loft([[.77,.168,.105],[.80,.193,.127],[.85,.197,.132],[.895,.185,.122]],18),darkCloth);
  add(torso,loft([[1.31,.105,.079],[1.37,.091,.068],[1.43,.062,.055]],16),shirt);
  add(torso,loft([[1.38,.06,.056],[1.43,.062,.055],[1.46,.065,.056]],12),skin);
  // Shaped bib, stitched pockets, folded collar and hardware give the clothing a construction.
  block(torso,darkCloth,0,1.095,-.137,.295,.335,.034,.025);
  wire(torso,edge,[[-.13,.94,-.16],[-.135,1.19,-.17],[-.11,1.24,-.161],[.11,1.24,-.161],[.135,1.19,-.17],[.13,.94,-.16]],.0022);
  block(torso,cloth,0,1.092,-.166,.217,.13,.018,.015);block(torso,darkCloth,0,1.165,-.179,.235,.027,.014,.004);
  for(const x of [-.091,.091])bolt(torso,x,1.177,-.19,.006);
  for(const side of [-1,1]){
   const strap=wire(torso,reflector,[[side*.154,.925,-.133],[side*.178,1.18,-.139],[side*.172,1.30,-.101],[side*.135,1.364,.025],[side*.117,1.11,.143]],.015);
   block(torso,leather,side*.153,.951,-.161,.039,.055,.026,.006);bolt(torso,side*.153,.951,-.178);
   const collar=block(torso,shirt,side*.075,1.352,-.071,.088,.079,.022,.006);collar.rotation.z=side*.37;collar.rotation.x=-.21;
   block(torso,darkCloth,side*.153,.895,-.105,.08,.083,.035,.013);
   block(torso,leather,side*.225,.875,.01,.078,.144,.103,.021);block(torso,edge,side*.225,.95,.01,.085,.027,.109,.007);
   const clip=add(torso,new T.TorusGeometry(.026,.005,6,14,Math.PI*1.7),steel,side*.233,.982,-.025);clip.rotation.y=Math.PI/2;
  }
  add(torso,loft([[.865,.20,.139],[.889,.20,.139]],20),leather);block(torso,brass,0,.877,-.149,.057,.039,.019,.006);block(torso,leather,0,.877,-.16,.023,.024,.012,.004);
  for(const x of [-.13,-.055,.055,.13])block(torso,darkCloth,x,.878,-.143,.022,.052,.015,.004);
  // A shaped rear pack and an actual cylindrical lamp battery, secured to the back.
  block(torso,leather,0,1.096,.158,.286,.337,.126,.029);block(torso,edge,0,1.272,.176,.30,.068,.145,.019);
  for(const x of [-.099,.099]){block(torso,darkCloth,x,1.07,.23,.026,.32,.026,.004);block(torso,brass,x,1.01,.247,.036,.043,.009,.004);}
  const battery=add(torso,new T.CylinderGeometry(.058,.058,.252,14),steel,.195,1.10,.171);battery.rotation.z=.12;
  for(const y of [1.002,1.193])add(torso,new T.CylinderGeometry(.065,.065,.018,14),rubber,.195,y,.171);
  wire(torso,rubber,[[.188,1.238,.17],[.212,1.43,.151],[.16,1.48,.09],[.114,1.515,.109]],.007);
  const head=new T.Group();head.position.y=1.51;root.add(head);
  const face=loft([[-.143,.092,.081,-.02],[-.121,.125,.11,-.01],[-.074,.158,.135],[.006,.164,.142],[.069,.151,.139],[.118,.132,.12],[.15,.09,.078]],24),fp=face.attributes.position;
  for(let i=0;i<fp.count;i++){const x=fp.getX(i),y=fp.getY(i),z=fp.getZ(i);if(z<-.06){const cheek=Math.exp(-Math.pow((Math.abs(x)-.102)/.045,2)-Math.pow((y+.055)/.045,2));fp.setZ(i,z-.012*cheek);}}face.computeVertexNormals();add(head,face,skin);
  // Cheeks, a formed nose, ears and jaw stubble keep the face human under the goggles.
  for(const side of [-1,1]){
   ball(head,skin,side*.157,-.005,.008,.022,.035,.021);ball(head,skinShadow,side*.173,-.003,.006,.005,.021,.013);
   ball(head,hair,side*.138,-.04,.046,.024,.077,.067);
  }
  add(head,loft([[-.054,.024,.023,-.158],[-.04,.030,.031,-.166],[-.015,.023,.023,-.151],[.021,.015,.014,-.139]],12),skin);
  for(const side of [-1,1])ball(head,skinShadow,side*.019,-.053,-.19,.008,.005,.006);
  add(head,loft([[-.148,.080,.063,-.027],[-.137,.115,.097,-.011],[-.115,.128,.102,-.005],[-.089,.127,.097,.002]],18),hair);
  wire(head,hair,[[-.065,-.073,-.128],[-.036,-.068,-.148],[0,-.075,-.155],[.036,-.068,-.148],[.065,-.073,-.128]],.011);
  wire(head,skinShadow,[[-.033,-.091,-.138],[0,-.099,-.145],[.033,-.091,-.138]],.004);
  // The goggle strap follows the skull; separate rubber seals, metal frames and dark lenses.
  add(head,loft([[.018,.169,.151],[.045,.169,.151]],24),rubber);
  for(const side of [-1,1]){
   const frame=block(head,rubber,side*.076,.032,-.133,.134,.095,.052,.015);frame.rotation.y=side*.13;
   const rim=block(head,steel,side*.076,.034,-.163,.118,.078,.016,.009);rim.rotation.y=side*.13;
   const lens=block(head,glass,side*.076,.034,-.173,.104,.062,.012,.009);lens.rotation.y=side*.13;
   bolt(head,side*.144,.032,-.134,.005);
  }
  block(head,rubber,0,.035,-.15,.027,.023,.017,.005);
  // The hardhat has a molded crown, rolled brim, ribs, rivets and a recessed lamp.
  add(head,loft([[.066,.195,.184],[.096,.20,.183],[.155,.177,.164],[.207,.127,.127],[.237,.056,.071],[.242,.022,.03]],24),yellow);
  add(head,loft([[.062,.222,.217],[.071,.226,.219],[.087,.219,.208]],24),yellow);
  add(head,loft([[.047,.188,.177],[.062,.191,.18]],24),rubber);
  for(const x of [-.067,0,.067])wire(head,yellow,[[x,.097,-.176],[x,.187,-.101],[x,.236,.002],[x,.189,.106],[x,.104,.171]],.009);
  for(const side of [-1,1]){bolt(head,side*.183,.105,-.088,.006);block(head,rubber,side*.187,.118,.017,.014,.049,.046,.005);}
  const housing=add(head,new T.CylinderGeometry(.054,.064,.07,20),steel,0,.135,-.194);housing.rotation.x=Math.PI/2;
  const rim=add(head,new T.TorusGeometry(.043,.008,8,20),rubber,0,.135,-.238);
  ball(head,lampGlass,0,.135,-.241,.039,.039,.011);block(head,rubber,0,.193,-.161,.025,.022,.023,.004);
  const legs=[],knees=[],feet=[],arms=[],elbows=[];
  for(const side of [-1,1]){
   const leg=new T.Group();leg.position.set(side*.12,.89,0);leg.rotation.z=side*.04;root.add(leg);legs.push(leg);
   add(leg,loft([[0,.101,.103],[-.08,.112,.111],[-.20,.10,.099],[-.31,.085,.087],[-.38,.082,.082]],16),cloth);
   wire(leg,edge,[[side*.092,-.05,-.04],[side*.096,-.18,-.042],[side*.077,-.33,-.045]],.002);
   const knee=new T.Group();knee.position.y=-.38;leg.add(knee);knees.push(knee);
   add(knee,loft([[.012,.085,.087],[-.07,.092,.086],[-.19,.087,.081],[-.27,.073,.068],[-.31,.074,.067]],16),cloth);
   block(knee,rubber,0,-.015,-.088,.151,.17,.046,.026);block(knee,leather,0,-.021,-.115,.112,.124,.018,.02);
   for(const y of [-.059,-.021,.017])block(knee,edge,0,y,-.127,.075,.009,.008,.002);
   for(const y of [-.105,.069])add(knee,loft([[y,.088,.089],[y+.016,.089,.089]],16),rubber);
   const foot=new T.Group();foot.position.y=-.50;foot.rotation.y=-side*.10;knee.add(foot);feet.push(foot);
   add(foot,loft([[0,.095,.148,-.028],[.024,.103,.165,-.039],[.060,.105,.165,-.037],[.077,.096,.151,-.031]],20),rubber);
   add(foot,loft([[.065,.091,.149,-.03],[.105,.096,.142,-.031],[.153,.089,.106,-.008],[.185,.075,.076,.012],[.241,.072,.074,.015]],20),leather);
   add(foot,loft([[.223,.08,.079,.015],[.245,.08,.08,.015]],16),edge);
   wire(foot,edge,[[-.075,.085,-.101],[-.07,.09,-.171],[0,.095,-.184],[.07,.09,-.171],[.075,.085,-.101]],.003);
   for(let j=0;j<4;j++){const y=.131+j*.019,z=-.109+j*.009;for(const x of [-.031,.031])bolt(foot,x,y,z,.005);wire(foot,reflector,[[-.03,y,z-.006],[.03,y+.015,z+.003]],.0025);wire(foot,reflector,[[.03,y,z-.006],[-.03,y+.015,z+.003]],.0025);}
   for(const z of [-.12,-.045,.03,.10])block(foot,rubber,0,.015,z,.19,.018,.019,.003);
   const arm=new T.Group();arm.position.set(side*.251,1.30,.018);arm.rotation.z=side*-.10;root.add(arm);arms.push(arm);
   add(arm,loft([[.078,.026,.034],[.058,.059,.063],[.025,.079,.077],[-.015,.087,.086],[-.11,.078,.077],[-.217,.064,.064],[-.257,.061,.062]],18),shirt);
   add(arm,loft([[-.08,.088,.086],[-.095,.086,.084]],18),reflector);
   const elbow=new T.Group();elbow.position.y=-.245;elbow.rotation.x=side>0?.28:.11;arm.add(elbow);elbows.push(elbow);
   add(elbow,loft([[.02,.060,.061],[-.055,.068,.067],[-.13,.06,.061],[-.205,.047,.05]],18),shirt);
   add(elbow,loft([[-.188,.052,.054],[-.214,.053,.054]],16),darkCloth);
   block(elbow,leather,0,-.254,-.01,.102,.113,.078,.02);block(elbow,edge,0,-.237,.033,.079,.035,.014,.005);
   for(let finger=0;finger<4;finger++){const x=-.034+finger*.022;ball(elbow,leather,x,-.31,-.018,.011,.029,.022);ball(elbow,edge,x,-.285,-.046,.012,.013,.008);}
   const thumb=ball(elbow,leather,side*.06,-.265,-.032,.018,.034,.019);thumb.rotation.z=side*-.6;
  }
  for(const group of [torso,head,...legs,...knees,...feet,...arms,...elbows])mergeRigid(group);
  root.name='miner-sculpted-worker';return{root,head,torso,legs,knees,feet,arms,elbows,materials,textures};
 };
})(B2);
