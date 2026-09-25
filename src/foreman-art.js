/* Original furnace assemblies. Moving parts stay inside the existing bodies. */
'use strict';
(function(B){
 const T=THREE,V=T.Vector3;
 const mat=(hex,metal=.55,glow=0)=>{const color=new T.Color(hex).convertSRGBToLinear();return new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:glow,roughness:metal?.57:.85,metalness:metal});};
 B.View.prototype.makeForemanMachine=function(node){
  const root=new T.Group(),frame=new T.Group();root.add(frame);
  // View.merge bakes world matrices. Assemble each group at identity first.
  const merge=group=>{const parent=group.parent,p=group.position.clone(),q=group.quaternion.clone();parent?.remove(group);group.position.set(0,0,0);group.quaternion.identity();group.updateMatrixWorld(true);this.merge(group);group.position.copy(p);group.quaternion.copy(q);parent?.add(group);};
  const iron=mat('#354544'),dark=mat('#142323',.25),steel=mat('#82918b'),brass=mat('#b79058'),copper=mat('#99573a'),enamel=mat('#bcb799',.1),paint=mat('#62594a',.25),hot=mat('#ef8d3e',.1,.2);
  const box=(parent,...a)=>this.box(parent,...a),cyl=(parent,...a)=>this.cylinder(parent,...a);
  const add=(parent,geo,m,x=0,y=0,z=0)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const ring=(parent,r,t,m,x,y,z,flat=false)=>{const mesh=add(parent,new T.TorusGeometry(r,t,6,32),m,x,y,z);if(flat)mesh.rotation.x=Math.PI/2;return mesh;};
  const pipe=(parent,points,r,m)=>add(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new V(...p))),points.length*6,r,6,false),m);
  const gauge=(parent,x,y,z,r)=>{
   cyl(parent,x,y,z,r,r,.065,brass,24).rotation.x=Math.PI/2;
   cyl(parent,x,y,z+.037,r*.82,r*.82,.014,enamel,24).rotation.x=Math.PI/2;
   for(let i=0;i<11;i++){const a=-2.2+i*.44,t=box(parent,x+Math.sin(a)*r*.65,y+Math.cos(a)*r*.65,z+.05,.012,r*.17,.008,i>7?copper:dark);t.rotation.z=-a;}
   const needle=new T.Group();needle.position.set(x,y,z+.059);parent.add(needle);box(needle,0,r*.27,0,.016,r*.68,.012,copper);cyl(needle,0,0,.005,.029,.029,.021,dark,10).rotation.x=Math.PI/2;return needle;
  };
  const result={root,hot,node,shutters:[],indicators:[]};
  if(node.id===100){
   root.userData.machine='pressure-furnace';
   for(const x of [-1.05,1.05])for(const z of [-1.05,1.05]){
    box(frame,x,-1.95,z,.95,.29,.95,iron);box(frame,x,-1.78,z,.68,.06,.67,brass);
    for(const a of [-.22,.22])cyl(frame,x+a,-1.727,z,.045,.045,.045,steel,6);
   }
   cyl(frame,0,-1.61,0,1.48,1.54,.32,iron,12);cyl(frame,0,-1.42,0,1.30,1.45,.08,brass,12);
   const ram=result.ram=new T.Group();root.add(ram);
   cyl(ram,0,-1.25,0,.66,.66,.48,steel,16);for(const y of [-1.44,-1.3,-1.16])cyl(ram,0,y,0,.75,.75,.045,dark,16);
   for(const y of [-1.02,.63]){cyl(frame,0,y,0,1.49,1.49,.18,iron,12);cyl(frame,0,y+.10,0,1.51,1.51,.036,brass,12);}
   cyl(frame,0,-.17,0,1.12,1.12,1.55,hot,24);
   for(const y of [-.72,-.35,.02,.38])cyl(frame,0,y,0,1.20,1.20,.065,copper,24);
   for(let i=0;i<8;i++){
    const a=i*Math.PI/4,rib=new T.Group();rib.rotation.y=a;root.add(rib);
    box(rib,0,-.19,1.16,.045,1.5,.085,dark);merge(rib);
    const mount=new T.Group();mount.rotation.y=a;root.add(mount);
    const shutter=new T.Group();mount.add(shutter);
    box(shutter,0,-.22,1.31,.81,1.40,.18,paint);box(shutter,0,-.22,1.412,.64,1.12,.025,iron);
    for(const y of [-.63,-.28,.07])box(shutter,0,y,1.436,.53,.035,.012,brass);
    for(const x of [-.32,.32])for(const y of [-.81,.36])cyl(shutter,x,y,1.42,.026,.026,.028,brass,6).rotation.x=Math.PI/2;
    merge(shutter);result.shutters.push(shutter);
   }
   for(const x of [-1.59,1.59])for(const z of [-.63,.63]){
    cyl(frame,x,.23,z,.12,.12,2.2,steel,10);cyl(frame,x,-.45,z,.18,.18,.84,iron,10);
    for(const y of [-.88,.01,1.27])cyl(frame,x,y,z,.2,.2,.095,brass,10);
   }
   for(const x of [-1.25,1.25]){
    pipe(frame,[[x,-.88,-.5],[x,.67,-.75],[x,1.6,-.75],[x*.82,1.76,-.6]],.105,copper);
    cyl(frame,x*.82,1.85,-.6,.18,.12,.25,iron,10);cyl(frame,x*.82,2.015,-.6,.20,.20,.08,brass,10);
   }
   cyl(frame,0,.78,0,.67,.81,.19,dark,20);ring(frame,.67,.055,brass,0,.90,0,true);
   // The gimbal's origin is exactly the gameplay beam origin, local Y +0.8.
   const head=result.head=new T.Group();head.position.y=.8;root.add(head);
   add(head,new T.SphereGeometry(.53,16,10),iron,0,0,0);
   const barrel=result.barrel=new T.Group();head.add(barrel);
   cyl(barrel,0,0,.61,.32,.32,.81,dark,16).rotation.x=Math.PI/2;
   for(const z of [.27,.44,.61,.78,.95])ring(barrel,.34,.047,z===.95?brass:copper,0,0,z);
   cyl(barrel,0,0,1.025,.30,.32,.13,iron,16).rotation.x=Math.PI/2;
   ring(barrel,.24,.037,hot,0,0,1.10);cyl(barrel,0,0,1.095,.20,.20,.008,dark,16).rotation.x=Math.PI/2;merge(barrel);
   for(const x of [-.38,.38]){box(head,x,.19,.3,.09,.15,.33,brass);box(head,x,.19,.48,.055,.09,.03,hot);}
   merge(head);
   // Three mechanical indicators mirror the three remote locks.
   for(let i=0;i<3;i++){
    const panel=new T.Group();panel.rotation.y=(i-1)*Math.PI*.55;root.add(panel);
    box(panel,0,.88,1.40,.53,.51,.15,iron);result.indicators.push(gauge(panel,0,.89,1.50,.205));
    const lampGroup=new T.Group();panel.add(lampGroup);const lamp=box(lampGroup,0,.57,1.49,.16,.075,.04,mat('#9cb6a3',.1,.1));result.indicators[i].userData.lamp=lamp;
    merge(panel);
   }
   const shock=result.shock=ring(root,1.4,.047,hot,0,-1.91,0,true);shock.castShadow=false;
   box(frame,0,-1.6,1.545,.78,.19,.026,dark);
   for(let i=0;i<5;i++)box(frame,(i-2)*.13,-1.6,1.564,.055,.105,.016,brass);
  }else{
   root.userData.machine='pressure-governor';
   box(frame,0,-1.19,0,1.23,.22,1.23,iron);box(frame,0,-1.05,0,1.07,.05,1.07,brass);
   cyl(frame,0,-.15,0,.31,.34,1.69,copper,16);
   for(const y of [-.91,.63])cyl(frame,0,y,0,.46,.46,.14,iron,12);
   for(const x of [-.46,.46])for(const z of [-.46,.46]){cyl(frame,x,-.04,z,.044,.044,2.06,steel,8);for(const y of [-1.005,.93])cyl(frame,x,y,z,.075,.075,.04,brass,6);}
   box(frame,0,1.0,0,1.17,.17,1.17,iron);box(frame,0,1.12,0,.81,.06,.83,brass);
   const valve=result.valve=new T.Group();valve.position.set(0,1.21,0);root.add(valve);
   ring(valve,.33,.024,copper,0,0,0,true);for(let i=0;i<3;i++)box(valve,0,0,0,.025,.025,.62,brass,i*Math.PI/3);merge(valve);
   for(const z of [-.43,.43]){
    box(frame,0,-.26,z,.22,1.22,.07,dark);
    const fill=new T.Group();fill.position.set(0,-.84,z+Math.sign(z)*.047);root.add(fill);box(fill,0,.56,0,.11,1.12,.026,hot);result.shutters.push(fill);
    for(const x of [-.15,.15])box(frame,x,-.26,z,.024,1.29,.05,brass);
    for(let i=0;i<8;i++)box(frame,.16,-.77+i*.145,z,.065,.015,.035,steel);
   }
   box(frame,0,.58,.47,.57,.63,.08,paint);result.needle=gauge(frame,0,.58,.538,.25);
   pipe(frame,[[-.32,-.81,0],[-.50,-.61,0],[-.50,.64,0],[-.36,.78,0]],.057,brass);
   for(let i=0;i<node.id-100;i++)box(frame,(i-(node.id-101)/2)*.14,-1.185,.626,.065,.10,.008,enamel);
   const split=result.split=new T.Group();root.add(split);
   for(let i=0;i<4;i++){const b=box(split,(i%2?1:-1)*.11,-.29+i*.135,.537,.14,.027,.018,dark);b.rotation.z=i%2?.65:-.4;}
  }
  merge(frame);return result;
 };
})(B2);
