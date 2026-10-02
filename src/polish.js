/* Presentation only. Movement tuning lives in Player; these springs never alter aim. */
'use strict';
(function(B){
 const T=THREE;
 B.View.prototype.makePolish=function(){
  this.feel={phase:0,swayX:0,swayY:0,land:0,vy:0,tool:null,equip:0};
  this.grip=this.firstPersonHand;
  // Original deterministic paint wear, kept subtle so silhouettes read at a glance.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d'),rng=B.random(2826);c.fillStyle='#a9a9a9';c.fillRect(0,0,128,128);
  for(let i=0;i<140;i++){const x=rng()*128,y=rng()*128;c.strokeStyle=`rgba(25,25,25,${.08+rng()*.15})`;c.lineWidth=.5+rng();c.beginPath();c.moveTo(x,y);c.lineTo(x+2+rng()*12,y+rng()*2);c.stroke();}
  const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;this.palette.yellow.roughnessMap=texture;this.palette.yellow.roughness=.75;this.palette.yellow.needsUpdate=true;
  this.toolScene.add(new T.AmbientLight('#66878a',.24));
  this.tool.scale.setScalar(.67);
  this.palette.grass.color.set('#617b4c').convertSRGBToLinear();
  this.sun.color.set('#fff0d8');
  this.skyDome.material.uniforms.zenith.value.set('#638f9f').convertSRGBToLinear();
  this.skyDome.material.uniforms.horizon.value.set('#e1d9bf').convertSRGBToLinear();
  // Moving cloud wisps and hillside grasses make the common read as a place.
  const sky=this.skyDome.material;sky.uniforms.windTime={value:0};
  sky.fragmentShader=sky.fragmentShader.replace('uniform vec3 zenith','uniform float windTime;\n'+B.TERRAIN_LOOK.glsl+'\nuniform vec3 zenith');
  sky.fragmentShader=sky.fragmentShader.replace('sky+=sunColor*sun*.38;',`sky+=sunColor*sun*.38;
   float cloud=smoothstep(.61,.79,b2Noise(d*5.+vec3(windTime*.008,0.,0.))*.65+b2Noise(d*14.)*.35)*smoothstep(.04,.3,d.y)*(1.-smoothstep(.65,.95,d.y));
   sky=mix(sky,sunColor,cloud*.38);`);sky.needsUpdate=true;
  const shapes=B.GrassShapes.buffer(true),blades=B.random(28945),green=new T.Color('#637d50').convertSRGBToLinear();
  for(let i=0;i<2200;i++){const x=(blades()-.5)*150,z=(blades()-.5)*150;if(!B.COMMON.planting(x,z,.2))continue;const h=.16+blades()*.34,w=.02+blades()*.025,a=blades()*Math.PI;B.GrassShapes.blade(shapes,x,z,a+Math.PI*.5,h*.70,w*.26,w*3,green,i*.29,true);}
  const geometry=B.GrassShapes.geometry(shapes);
  const grass=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});this.windUniform={value:0};
  grass.onBeforeCompile=shader=>{shader.uniforms.windTime=this.windUniform;shader.vertexShader='attribute float windWeight;\nuniform float windTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(position.z*.8+position.x*.4+windTime*1.7)*.025*windWeight;');};
  this.windGrass=new T.Mesh(geometry,grass);this.windGrass.receiveShadow=true;this.scene.add(this.windGrass);
  this.makeGroundArt();
 };
 const tools=B.View.prototype.makeToolFinish;B.View.prototype.makeToolFinish=function(){tools.call(this);this.makePolish();};
 const headlamp=B.View.prototype.renderHeadlamp;B.View.prototype.renderHeadlamp=function(g,daylight){headlamp.call(this,g,daylight);this.headlamp.color.lerp(new T.Color('#e1edf0').convertSRGBToLinear(),.28);this.headlamp.intensity*=.88;};
 const kinetics=B.View.prototype.renderKinetics;B.View.prototype.renderKinetics=function(g,time){
  kinetics.call(this,g,time);const f=this.feel,key=g.expedition.state.tool,tool=key==='axe'?this.axeTool:key==='sling'?this.slingTool:key==='gravity'?this.magicTool:null;if(!tool||!f)return;
  if(key==='gravity')tool.position.set(.36,-.25,-.8);if(!g.settings.motion||!g.running)return;const gait=Math.min(1,Math.hypot(g.player.vx,g.player.vz)/4);
  tool.position.x-=f.swayX;tool.position.y+=f.swayY-f.land-f.equip*.16+Math.abs(Math.cos(f.phase))*.012*gait;tool.position.z+=f.equip*.08;tool.rotation.z-=f.swayX*.8;
 };
 const mining=B.View.prototype.renderMining;B.View.prototype.renderMining=function(g,dt){
  mining.call(this,g,dt);const f=this.feel;if(!f)return;const p=g.player,mode=g.expedition.state.tool,moving=this.settings.motion&&g.running;
  this.windUniform.value+=dt;this.skyDome.material.uniforms.windTime.value=this.windUniform.value;
  const speed=Math.hypot(p.vx,p.vz);f.phase+=dt*speed*2.8;
  if(mode!==f.tool){f.tool=mode;f.equip=1;}f.equip*=Math.exp(-dt*11);
  const yawDelta=f.yaw===undefined?0:Math.atan2(Math.sin(p.yaw-f.yaw),Math.cos(p.yaw-f.yaw)),pitchDelta=f.pitch===undefined?0:p.pitch-f.pitch;f.yaw=p.yaw;f.pitch=p.pitch;
  const response=1-Math.exp(-dt*13),lookDt=Math.max(.001,dt);f.swayX+=(B.clamp(yawDelta/lookDt,-3,3)*.009-f.swayX)*response;f.swayY+=(B.clamp(pitchDelta/lookDt,-3,3)*.009-f.swayY)*response;
  if(p.grounded&&f.vy<-2)f.land=Math.min(.06,-f.vy*.005);f.vy=p.vy;f.land*=Math.exp(-dt*13);
  if(moving){const walk=Math.min(1,speed/4)*(p.grounded?1:.15),beat=g.mining?.beat||0,load=g.mining?.load||0;this.tool.position.x+=Math.sin(f.phase)*.012*walk-f.swayX;this.tool.position.y+=Math.abs(Math.cos(f.phase))*.014*walk+f.swayY-f.land-f.equip*.16;this.tool.position.z+=f.equip*.08+beat*.018*load;this.tool.rotation.x=.2+f.swayY*1.2+f.land*1.2;this.tool.rotation.y=.4-f.swayX*1.2;this.tool.rotation.z=-.04+Math.sin(f.phase)*.014*walk-f.swayX*1.8;}else this.tool.rotation.set(.2,.4,-.04);
  const sprint=moving&&speed>4.5?1:0,target=72+sprint*5;if(Math.abs(this.camera.fov-target)>.01){this.camera.fov+=(target-this.camera.fov)*(1-Math.exp(-dt*7));this.camera.updateProjectionMatrix();}
 };
 const title=B.GameUI.prototype.title;B.GameUI.prototype.title=function(){
  const c=this.ctx,g=this.game,x=this.w<700?28:Math.max(64,this.w*.075),w=Math.min(570,this.w-x*2),y=Math.max(38,this.h*.12),size=Math.min(88,w/6.8);
  const shade=c.createLinearGradient(0,0,this.w,0);shade.addColorStop(0,'rgba(9,22,25,.97)');shade.addColorStop(.55,'rgba(9,22,25,.70)');shade.addColorStop(1,'rgba(9,22,25,.06)');c.fillStyle=shade;c.fillRect(0,0,this.w,this.h);
  this.line(x,y,x+36,y,'#f0b94e',3);this.text('TRONT / RIDGE COMMON',x+50,y-7,12,'#f0b94e','monospace');
  this.text('BUTTLOADS',x,y+42,size,'#fff1cd');this.text('2',x,y+38+size,144,'#f0b94e');this.text('THE DEEPENING',x+108,y+99+size,20,'#e6d9b7');
  const by=Math.min(this.h-230,y+260);this.text('BIG HOLES. BETTER COMPANY.',x,by,14,'#f0b94e','monospace');this.wrap('Dig a little too deep. Bring the whole crew.',x,by+29,w,21,'#fff1cd');
  this.button('start',g.net?.syncing?'Joining the crew...':g.net?.count>1?'Dig with the crew':valueStart(g),x,by+83,Math.min(338,w),()=>g.play(),{primary:true,h:58,disabled:!g.ready||g.net?.syncing});
  const controlsY=by+155;this.button('about','Controls & credits',x,controlsY,Math.min(207,w),()=>{g.aboutFrom='title';g.setScreen('about');},{h:40,font:14});
  if(w>330)this.button('crew','The crew',x+219,controlsY,Math.min(119,w-219),()=>g.setScreen('crew'),{h:40,font:14});
  const footer=this.h-47;this.line(x,footer-20,this.w-x,footer-20,'rgba(230,217,183,.25)');
  this.text(g.net?.role==='offline'?'YOUR LOCAL CLAIM':g.net?.syncing?g.net.status:'GLOBAL CO-OP  /  '+(g.net?.count||1)+' MINER'+((g.net?.count||1)>1?'S':''),x,footer,11,'#9cd0aa','monospace');
  if(this.w>620)this.text('297 M DOWN  /  NO GOOD REASON TO STOP',this.w-x,footer,11,'#aab8a5','monospace','right');
 };
 function valueStart(g){return g.economy.state.seconds>20?'Back to the mine':'Start digging';}
 B.GameUI.prototype.hud=function(){
  const g=this.game,s=g.economy.state,e=g.expedition.state,net=g.net,w=this.w,h=this.h,c=this.ctx,small=w<850,touch=matchMedia('(pointer:coarse)').matches,cx=w/2,cy=h/2;
  this.text('RIDGE COMMON',24,22,12,'#f0b94e','monospace');this.text(document.getElementById('layer').textContent||'TOPSOIL',24,42,16,'#fff1cd');
  if(!small){this.button('map','M  Survey',w-399,20,99,()=>g.openSurvey(),{h:36,font:13});this.button('notes','J  Notes',w-292,20,91,()=>g.journal(),{h:36,font:13});this.button('crew',(net?.count||1)+' in crew',w-193,20,93,()=>g.setScreen('crew'),{h:36,font:13});this.button('pause','Esc',w-92,20,68,()=>g.setScreen('pause'),{h:36,font:13});}
  else{this.button('crew','Crew',w-169,18,70,()=>g.setScreen('crew'),{h:34,font:12});this.button('pause','Menu',w-91,18,67,()=>g.setScreen('pause'),{h:34,font:12});}
  if(!small){const mission=document.getElementById('mission').textContent;this.text(document.getElementById('mission-label').textContent,cx,26,10,'#f0b94e','monospace','center');this.text(this.fit(mission,Math.max(180,w-650),13),cx,44,13,'#e6d9b7','sans-serif','center');}
  const gy=h-(touch?350:small?151:86),gx=73;this.gauge(gx,gy,46,Math.max(0,-g.player.y)/(-g.world.floor),'DEPTH / M',Math.max(0,-g.player.y).toFixed(1));
  const bx=132,bw=small?155:197;this.plate(bx,gy-37,bw,77,'rgba(14,27,33,.94)','#66756b');this.text('$'+Math.round(s.cash).toLocaleString('en-US'),bx+15,gy-25,25,'#fff1cd','monospace');this.text(`${g.economy.count} / ${g.economy.capacity} ORE`,bx+15,gy+6,12,'#aab8a5','monospace');
  c.fillStyle='#34443e';c.fillRect(bx+15,gy+28,bw-30,3);c.fillStyle=g.economy.count>=g.economy.capacity?'#e28248':'#f0b94e';c.fillRect(bx+15,gy+28,(bw-30)*Math.min(1,g.economy.count/g.economy.capacity),3);
  const tools=g.expedition.tools(),slot=Math.min(42,(w-(small?120:440))/tools.length),tw=tools.length*slot,tx=small?24:Math.max(364,(w-tw)/2),ty=h-(touch?270:85);
  if(!small)this.text(B.TOOLS[e.tool].name,tx,ty-26,15,'#fff1cd');
  for(let i=0;i<tools.length;i++){const key=tools[i],x=tx+i*slot,selected=key===e.tool;this.plate(x,ty,slot-4,43,selected?'#f0b94e':'rgba(14,27,33,.92)',selected?'#fff1cd':'#66756b');this.icon(key,x+8,ty+6,23,selected?'#18292d':'#e6d9b7');this.text(B.TOOLS[key].key,x+5,ty+31,9,selected?'#18292d':'#aab8a5','monospace');this.hit('tool-'+key,x,ty,slot-4,43,()=>g.selectTool(key));}
  this.button('kit','I  Kit',tx+tw+8,ty,64,()=>g.fieldKit.open(),{h:43,font:13});
  if(!small)this.text(`C  ${g.gadgets.spec().short} ${e.supplies.bombs}   V  Lights ${e.supplies.lights}`,tx,ty+54,12,'#e6d9b7','monospace');
  if(s.expedition.combat.health<100){this.text('HEALTH '+Math.ceil(s.expedition.combat.health),24,82,12,'#ed8066','monospace');this.line(24,103,24+s.expedition.combat.health,103,'#ed8066',3);}
  c.strokeStyle=g.cutter.edited?'#f0b94e':'#fff1cd';c.lineWidth=1.4;c.beginPath();const reach=g.cutter.edited?11+(g.mining?.beat||0)*3:8;for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){c.moveTo(cx+Math.cos(a)*4,cy+Math.sin(a)*4);c.lineTo(cx+Math.cos(a)*reach,cy+Math.sin(a)*reach);}c.stroke();
  if(g.running&&!touch&&document.pointerLockElement!==this.inputCanvas&&g.input.lookPointer==null&&!g.lockRequest)this.text(g.mouseCaptureUnavailable?'Right-drag to turn':'Click to look / right-drag to turn',cx,cy-43,13,'#fff1cd','sans-serif','center');
  const action=g.interaction();if(action&&!g.recallTime)this.prompt((action.locked?'':'[E]  ')+action.label,cy+43,action.locked?'#aab8a5':'#fff1cd');
  else if(g.cutter.contact)this.text(g.cutter.contact.protected?'Claim boundary':document.getElementById('contact').textContent,cx,cy+29,12,g.cutter.contact.protected?'#e28248':'#e6d9b7','sans-serif','center');
  if(g.scanUntil>g.clock)this.prompt(document.getElementById('scan-target').textContent+' / '+document.getElementById('scan-detail').textContent,cy+83,'#9cd0aa');
  if(g.recallTime>0){this.prompt('RETURNING TO THE YARD',cy+43,'#f0b94e');this.line(cx-90,cy+75,cx-90+180*g.recallTime/1.25,cy+75,'#f0b94e',3);}
  if(g.input.aim)this.prompt(document.getElementById('throw-hint').textContent,cy+110,'#f0b94e');
  if(g.pickupUntil>g.clock){const t=1-B.clamp((g.pickupUntil-g.clock)/1.6,0,1);c.save();c.globalAlpha=Math.min(1,(1-t)*4);this.text(document.getElementById('pickup').textContent,cx+28,cy-29-t*22,14,'#f0b94e');c.restore();}
  if(['resonance','gravity','sling'].includes(e.tool)){const charge=e.tool==='sling'?g.kinetics.state.charge:g.expedition.cooldown>0?1-g.expedition.cooldown/(e.tool==='gravity'?2.4:1.3):g.expedition.charge;this.line(cx-36,cy+20,cx+36,cy+20,'#66756b',2);this.line(cx-36,cy+20,cx-36+72*B.clamp(charge,0,1),cy+20,'#f0b94e',3);}
  if(!small&&g.fieldKit.tip&&!document.getElementById('field-tip').hidden){const tip=g.fieldKit.tip;this.plate(24,124,290,172,'rgba(14,27,33,.9)','#66756b');this.text(tip.title,40,138,16,'#f0b94e');this.wrap(tip.text,40,163,256,14);this.button('tip','Y  Got it',40,255,95,()=>g.fieldKit.dismiss(),{h:25,font:12});}
  if(g.gadgets.remoteCount)this.prompt('H / '+g.gadgets.remoteCount+' remote charges ready',h-147,'#e28248');
  for(const prefix of ['threat','foreman']){const id=prefix==='threat'?'threat':'foreman-hud',el=document.getElementById(id);if(!el.hidden){const name=prefix==='threat'?document.getElementById('threat-name').textContent:'THE FOREMAN BELOW';this.prompt(name+' / '+document.getElementById(prefix==='threat'?'threat-action':'foreman-hint').textContent,h*.18,'#e28248');const health=parseFloat(document.getElementById(prefix==='threat'?'enemy-health':'foreman-health').style.width)||0;this.line(cx-120,h*.18+35,cx+120,h*.18+35,'#66756b',4);this.line(cx-120,h*.18+35,cx-120+2.4*health,h*.18+35,'#e28248',4);}}
  if(g.chapterUntil>g.clock){this.text(document.getElementById('chapter-name').textContent,cx,103,26,'#f0b94e','sans-serif','center');this.text(this.fit(document.getElementById('chapter-unlock').textContent,w-48,13),cx,139,13,'#e6d9b7','sans-serif','center');}
  if(g.combat.hurtFlash>0){c.fillStyle=`rgba(146,29,16,${Math.min(.24,g.combat.hurtFlash*.25)})`;c.fillRect(0,0,w,h);}
  if(touch)this.touch();
 };
 const pause=B.GameUI.prototype.pause;B.GameUI.prototype.pause=function(){pause.call(this);if(this.frameBox&&this.frameBox.w>540)this.button('crew','The crew',this.frameBox.x+250,this.frameBox.bottom,125,()=>this.game.setScreen('crew'),{h:32,font:13});};
})(B2);
