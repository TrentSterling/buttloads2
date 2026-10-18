/* World-space strata, excavated cave geology, a painted sky and the Bell Works tool finish. Cosmetic only. */
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
 const glsl=`
 uniform sampler2D b2GroundDetail;
 uniform float b2GroundJoin;
 float b2Hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float b2Noise(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(b2Hash(i),b2Hash(i+vec3(1,0,0)),f.x),mix(b2Hash(i+vec3(0,1,0)),b2Hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(b2Hash(i+vec3(0,0,1)),b2Hash(i+vec3(1,0,1)),f.x),mix(b2Hash(i+vec3(0,1,1)),b2Hash(i+vec3(1,1,1)),f.x),f.y),f.z);
 }
 float b2Fbm(vec3 p){
  float f=b2Noise(p)*.56;
  p=p*2.03+vec3(17.1,-9.2,4.7);f+=b2Noise(p)*.29;
  p=p*2.11+vec3(-7.7,13.4,19.2);f+=b2Noise(p)*.15;
  return f;
 }
 vec3 b2TriWeights(vec3 n){vec3 w=abs(n);w=w*w*w+.0001;return w/(w.x+w.y+w.z);}
 vec4 b2TriDetail(vec3 p,vec3 n,float scale,vec3 offset){
  vec3 w=b2TriWeights(n);
  return texture2D(b2GroundDetail,p.yz*scale+offset.yz)*w.x+texture2D(b2GroundDetail,p.xz*scale+offset.xz)*w.y+texture2D(b2GroundDetail,p.xy*scale+offset.xy)*w.z;
 }
 vec4 b2SurfaceDetail(vec3 p,vec3 n){return b2TriDetail(p,n,.36,vec3(0.));}
 float b2StrataPhase(vec3 p){
  float warp=(b2Noise(p*.075+vec3(4.1,11.7,-6.3))-.5)*12.;
  warp+=(b2Noise(p*.24+vec3(-9.4,2.8,17.2))-.5)*3.5;
  return (p.y+warp)*5.9+p.x*.105+p.z*.067;
 }
 float b2Beds(vec3 p){
  float phase=b2StrataPhase(p);
  return sin(phase)*.72+sin(phase*3.17+b2Noise(p*.47)*3.4)*.28;
 }
 float b2FaultLine(float phase,float width){return 1.-smoothstep(width,width*3.2,abs(sin(phase)));}
 float b2Fractures(vec3 p,vec3 n){
  float warp=(b2Fbm(p*.13+vec3(7.,-13.,19.))-.5)*7.5;
  float major=b2FaultLine(p.x*.43+p.y*.17-p.z*.31+warp,.020);
  float cross=b2FaultLine(-p.x*.19+p.y*.29+p.z*.37-warp*.63+1.7,.016);
  float hair=b2FaultLine(dot(p,vec3(.73,.41,-.29))*1.7+(b2Noise(p*.61)-.5)*4.8,.012);
  float walls=1.-smoothstep(.70,.96,abs(n.y));
  float ceiling=smoothstep(.08,.82,-n.y);
  float depth=smoothstep(7.,19.,-p.y);
  return max(max(major,cross*.72),hair*.34)*depth*mix(.72,1.,max(walls,ceiling));
 }
 float b2Wetness(vec3 p,vec3 n,float faults){
  float depth=smoothstep(22.,58.,-p.y);
  float ceiling=smoothstep(.05,.82,-n.y),wall=1.-smoothstep(.28,.88,abs(n.y));
  float seep=smoothstep(.58,.88,b2Fbm(p*.095+vec3(-31.,8.,14.)));
  return faults*depth*(.46+.54*max(ceiling,wall))*mix(.45,1.,seep);
 }
 float b2Cavity(vec3 p,vec3 n){
  float depth=smoothstep(8.,34.,-p.y),ceiling=smoothstep(.02,.92,-n.y);
  float pocket=smoothstep(.42,.88,b2Fbm(p*.065+vec3(12.,-4.,27.)));
  return depth*(.035+ceiling*.13+pocket*.045);
 }
 float b2Grass(vec3 p,vec3 n,vec3 base){return smoothstep(.02,.10,(base.g-base.r)/max(.001,base.r+base.g))*smoothstep(.3,.72,n.y)*(1.-smoothstep(.45,1.4,-p.y));}
 vec3 b2Mineral(vec3 p,vec3 n,vec3 base,float detailFade,float faults,float wet){
  vec4 aggregate=b2TriDetail(p,n,.29,vec3(.17,.41,.73));
  vec4 grain=b2TriDetail(p,n,1.31,vec3(.63,.11,.37));
  float macro=b2Fbm(p*.19),beds=b2Beds(p),lamina=smoothstep(.68,.98,beds);
  float grainValue=.78+aggregate.g*.31+(grain.r-.5)*.16*detailFade+b2Noise(p*8.7)*.055*detailFade;
  vec3 stone=base*grainValue;
  float facies=b2Noise(vec3(p.x*.035,-p.y*.072,p.z*.035)+vec3(21.,7.,-14.));
  stone*=mix(vec3(1.07,.94,.82),vec3(.84,.98,1.08),smoothstep(.34,.72,facies));
  stone*=1.-lamina*(.075+.055*detailFade);
  float chalk=smoothstep(22.,28.,-p.y)*(1.-smoothstep(39.,45.,-p.y));
  stone=mix(stone,stone*vec3(.91,1.025,1.065),chalk*(.20+.34*macro));
  float freshWall=(1.-smoothstep(.58,.94,abs(n.y)))*smoothstep(7.,17.,-p.y);
  stone*=1.+freshWall*(aggregate.b-.48)*.13;
  vec3 faultTint=mix(vec3(.26,.20,.16),vec3(.16,.24,.27),smoothstep(35.,70.,-p.y));
  stone=mix(stone,faultTint*(.70+.22*aggregate.g),faults*(.48+.16*detailFade));
  stone=mix(stone,stone*vec3(.55,.64,.67),wet*.58);
  stone*=1.-b2Cavity(p,n);
  return stone;
 }
 vec3 b2Terrain(vec3 p,vec3 n,vec3 base,float detailFade,float faults,float wet){
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
  if(p.y<=-13.)return b2Mineral(p,n,base,detailFade,faults,wet);
  vec4 detail=b2SurfaceDetail(p,n);
  float grass=b2Grass(p,n,base),top=1.-smoothstep(8.,13.,-p.y);
  float cover=b2Noise(p*.085)*.72+b2Noise(p*.21+vec3(19.,0.,-11.))*.28;
  vec3 earth=base*(.81+detail.g*.37)*(1.-smoothstep(.55,.8,cover)*.13);
  vec3 turf=base*(.81+detail.r*.31)*mix(vec3(.84,.95,.79),vec3(1.08,1.,.85),smoothstep(.36,.72,cover));
  turf*=mix(vec3(.80,.94,.73),vec3(1.10,1.04,.84),smoothstep(.32,.79,detail.r));
  float worn=smoothstep(.58,.76,detail.a*.35+b2Noise(p*.28)*.65);
  turf=mix(turf,vec3(.18,.13,.075)*(.81+detail.g*.37),worn*.55);
  vec3 upper=mix(earth,turf,grass);
  if(p.y>=-8.)return upper;
  return mix(b2Mineral(p,n,base,detailFade,faults,wet),upper,top);
 }
 float b2Height(vec3 p){
  if(p.y>=-8.)return 0.;
  float depth=smoothstep(.5,8.,-p.y),beds=smoothstep(.66,.98,b2Beds(p));
  return ((b2Noise(p*10.7)-.5)*.020+(b2Noise(p*2.15)-.5)*.062+beds*.024)*mix(.15,1.,depth)*smoothstep(8.,13.,-p.y);
 }
 float b2SurfaceHeight(vec3 p,vec3 n,vec3 base){if(p.y<=-13.)return 0.;vec4 d=b2SurfaceDetail(p,n);return mix(d.g*.006+d.b*.002,d.r*.006,b2Grass(p,n,base))*(1.-smoothstep(8.,13.,-p.y));}
 float b2TerrainRoughness(vec3 p,vec3 n,float faults,float wet){
  if(p.y>-8.)return 1.;
  float compact=mix(1.035,.93,smoothstep(34.,76.,-p.y));
  compact=mix(compact,.68,wet);
  compact=mix(compact,.86,faults*(1.-wet)*.35);
  return compact;
 }
 `;
 B.TERRAIN_LOOK={glsl,apply(material,groundJoin=false){
  material.extensions={...material.extensions,derivatives:true};
  material.customProgramCacheKey=()=> 'b2-cave-geology-1';
  material.onBeforeCompile=shader=>{
   shader.uniforms=shader.uniforms||{};shader.uniforms.b2GroundDetail={value:B.GROUND_DETAIL.texture()};shader.uniforms.b2GroundJoin={value:groundJoin?1:0};
   shader.vertexShader='varying vec3 vGround; varying vec3 vGroundNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=(modelMatrix*vec4(transformed,1.)).xyz;vGroundNormal=normalize(mat3(modelMatrix)*normal);');
   shader.fragmentShader='varying vec3 vGround; varying vec3 vGroundNormal;\n'+glsl+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 b2WorldNormal=normalize(vGroundNormal);
    float b2DetailFade=1.-smoothstep(16.,68.,length(vViewPosition));
    float b2FaultMask=0.,b2WetMask=0.;
    if(vGround.y< -7.5){b2FaultMask=b2Fractures(vGround,b2WorldNormal);b2WetMask=b2Wetness(vGround,b2WorldNormal,b2FaultMask);}
    diffuseColor.rgb=b2Terrain(vGround,b2WorldNormal,diffuseColor.rgb,b2DetailFade,b2FaultMask,b2WetMask);`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=clamp(roughnessFactor*b2TerrainRoughness(vGround,b2WorldNormal,b2FaultMask,b2WetMask),.55,1.);`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    float strataHeight=b2Height(vGround)*b2DetailFade;
    strataHeight+=b2SurfaceHeight(vGround,b2WorldNormal,diffuseColor.rgb)*b2DetailFade;
    strataHeight-=b2FaultMask*(.014+.012*b2DetailFade)+b2WetMask*.008;
    vec3 strataQ0=dFdx(-vViewPosition),strataQ1=dFdy(-vViewPosition),strataR0=cross(strataQ1,normal),strataR1=cross(normal,strataQ0);
    float strataDet=dot(strataQ0,strataR0);
    if(abs(strataDet)>1e-8)normal=normalize(abs(strataDet)*normal-sign(strataDet)*(dFdx(strataHeight)*strataR0+dFdy(strataHeight)*strataR1));`);
  };
 }};
 B.SKY_LOOK={zenith:'#7599a2',horizon:'#d8cbb0',sun:'#fff0c4'};
 B.View.prototype.makeLook=function(){
  B.TERRAIN_LOOK.apply(this.terrainMaterial,true);
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
  this.skyDome.position.copy(this.camera.position);this.skyDome.visible=daylight>.01;
  this.skyDome.material.uniforms.daylight.value=daylight;this.skyDome.material.uniforms.deepFog.value.copy(this.scene.fog.color);
  this.toolKey.color.copy(this.lamp.color).lerp(new T.Color('#fff1d4'),daylight);this.toolKey.intensity=1.3+.3*daylight;
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
