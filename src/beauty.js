/* World-space strata, a painted sky and the Bell Works tool finish. Cosmetic only. */
'use strict';
(function(B){
 const T=THREE;
 const glsl=`
 float b2Hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float b2Noise(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(b2Hash(i),b2Hash(i+vec3(1,0,0)),f.x),mix(b2Hash(i+vec3(0,1,0)),b2Hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(b2Hash(i+vec3(0,0,1)),b2Hash(i+vec3(1,0,1)),f.x),mix(b2Hash(i+vec3(0,1,1)),b2Hash(i+vec3(1,1,1)),f.x),f.y),f.z);
 }
 float b2Beds(vec3 p){return sin(p.y*7.5+b2Noise(p*.38)*4.+p.x*.13+p.z*.08);}
 vec3 b2Terrain(vec3 p,vec3 n,vec3 base){
  float macro=b2Noise(p*.72),fine=b2Noise(p*11.5),beds=b2Beds(p);
  float rock=smoothstep(2.,14.,-p.y),lamina=smoothstep(.73,.98,beds);
  float grain=.87+.16*macro+.09*fine+.045*b2Noise(p*43.);
  vec3 stone=base*grain*(1.-lamina*.14*rock);
  float chalk=smoothstep(22.,28.,-p.y)*(1.-smoothstep(39.,45.,-p.y));
  stone=mix(stone,stone*vec3(.90,1.01,1.045),chalk*macro*.45);
  float seams=smoothstep(.87,.99,sin(p.x*2.2+p.z*1.8+b2Noise(p*.9)*8.));
  stone*=1.-seams*.095*rock;
  return stone;
 }
 float b2Height(vec3 p){float depth=smoothstep(.5,8.,-p.y);return (b2Noise(p*11.5)*.012+b2Noise(p*2.3)*.035+smoothstep(.7,.98,b2Beds(p))*.018)*mix(.15,1.,depth);}
 `;
 B.TERRAIN_LOOK={glsl,apply(material){
  material.extensions={...material.extensions,derivatives:true};
  material.customProgramCacheKey=()=> 'b2-strata-1';
  material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 vGround; varying vec3 vGroundNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=(modelMatrix*vec4(transformed,1.)).xyz;vGroundNormal=normalize(mat3(modelMatrix)*normal);');
   shader.fragmentShader='varying vec3 vGround; varying vec3 vGroundNormal;\n'+glsl+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=b2Terrain(vGround,normalize(vGroundNormal),diffuseColor.rgb);');
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    float strataHeight=b2Height(vGround)*(1.-smoothstep(5.,22.,length(vViewPosition)));
    vec3 strataQ0=dFdx(-vViewPosition),strataQ1=dFdy(-vViewPosition),strataR0=cross(strataQ1,normal),strataR1=cross(normal,strataQ0);
    float strataDet=dot(strataQ0,strataR0);
    if(abs(strataDet)>1e-8)normal=normalize(abs(strataDet)*normal-sign(strataDet)*(dFdx(strataHeight)*strataR0+dFdy(strataHeight)*strataR1));`);
  };
 }};
 B.SKY_LOOK={zenith:'#7599a2',horizon:'#d8cbb0',sun:'#fff0c4'};
 B.View.prototype.makeLook=function(){
  B.TERRAIN_LOOK.apply(this.terrainMaterial);
  this.palette.grass.color.set('#71854e').convertSRGBToLinear();
  B.TERRAIN_LOOK.apply(this.palette.grass);
  this.palette.leaf.color.set('#526e49').convertSRGBToLinear();
  this.palette.leafLight=this.palette.leaf.clone();this.palette.leafLight.color.set('#7e9254').convertSRGBToLinear();
  this.palette.leafShade=this.palette.leaf.clone();this.palette.leafShade.color.set('#3c5846').convertSRGBToLinear();
  this.sun.position.set(-38,52,12);this.sun.target.position.set(0,0,22);this.scene.add(this.sun.target);
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
   add(new T.CylinderGeometry(radius*.18,radius*.28,height*.7,7),growth,0,height*.35,0);
   const cap=add(new T.SphereGeometry(radius*1.6,10,5,0,Math.PI*2,0,Math.PI/2),glow,0,height*.7,0);cap.scale.y=.42;
   add(new T.CylinderGeometry(radius*1.5,radius*.9,.045,10),growth,0,height*.69,0);
  }else if(theme===1&&ceiling){
   for(let i=0;i<3;i++){const points=[];for(let j=0;j<9;j++){const t=j/8;points.push(new T.Vector3(Math.sin(t*4+i)*t*radius,-t*height*(1-i*.16),Math.cos(t*3+i)*t*radius));}add(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.025+i*.006,5,false),growth,0,0,0);}
  }else{
   for(let i=0;i<3;i++){const h=height*(1-i*.23),m=add(new T.ConeGeometry(radius*(i? .58:1),h,theme===2?6:5),i===0?growth:glow,(i-1)*radius*.42,(ceiling?-1:1)*h*.45,0);m.rotation.z=(ceiling?Math.PI:0)+(i-1)*.16;}
  }
 };
})(B2);
