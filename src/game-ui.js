/* Game interface: painted instruments and ledgers uploaded to the WebGL compositor.
   The hidden control model bridges existing transactions; no HTML is rasterized.
   All input is scoped to the game canvas. */
'use strict';
(function(B){
  const $=id=>document.getElementById(id), cash=n=>'$'+Math.round(n).toLocaleString('en-US');
  const C={ink:'#18292d',deep:'#0e1b21',edge:'#66756b',paper:'#e6d9b7',white:'#fff1cd',muted:'#aab8a5',gold:'#f0b94e',orange:'#e28248',green:'#9cd0aa',red:'#ed8066'};
  const DEFAULT={...C},PAPER={ink:'#e1d1af',deep:'#d4c49f',edge:'#ad9770',paper:'#34443e',white:'#203632',muted:'#65705c',gold:'#97662d',orange:'#97462d',green:'#49745b',red:'#ab392c'};
  const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
  const value=id=>clean($(id)?.textContent||$(id)?.innerHTML||'');
  class GameUI{
    constructor(view,canvas){
      this.view=view;this.inputCanvas=canvas;this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');
      this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);this.camera.position.z=1;
      this.texture=new THREE.CanvasTexture(this.canvas);this.texture.encoding=THREE.sRGBEncoding;this.texture.minFilter=THREE.LinearFilter;this.texture.generateMipmaps=false;
      this.material=new THREE.MeshBasicMaterial({map:this.texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
      this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material));
      this.hits=[];this.page=0;this.pages=1;this.focus=-1;this.hover=null;this.pointer={x:-1,y:-1};this.held=new Map();this.age=1;this.dirty=true;this.lastScreen=undefined;
      this.resize();this.bind();
    }
    attach(game){this.game=game;this.present();}
    resize(){
      this.w=innerWidth;this.h=innerHeight;this.ratio=Math.min(devicePixelRatio||1,2,2048/Math.max(1,this.w));
      this.canvas.width=Math.max(1,Math.round(this.w*this.ratio));this.canvas.height=Math.max(1,Math.round(this.h*this.ratio));this.dirty=true;
    }
    present(){if(!this.game)return;this.draw();this.view.renderer.autoClear=true;this.view.renderer.render(this.scene,this.camera);}
    render(game,dt){
      this.game=game;this.age+=dt;
      // HUD paints at 20 Hz. WebGL composites every frame; pointer feedback paints immediately.
      if(this.dirty||this.lastScreen!==game.screen||this.age>=.05){this.draw();this.age=0;}
      this.view.renderer.autoClear=false;this.view.renderer.clearDepth();this.view.renderer.render(this.scene,this.camera);
    }
    text(text,x,y,size=16,color=C.paper,font='sans-serif',align='left'){
      const c=this.ctx;c.fillStyle=color;c.font=`600 ${size}px ${font==='monospace'?'Consolas, monospace':'Arial, sans-serif'}`;c.textAlign=align;c.textBaseline='top';
      if(this.game?.running){c.strokeStyle='rgba(7,18,22,.75)';c.lineWidth=3;c.lineJoin='round';c.strokeText(clean(text),x,y);}
      c.fillText(clean(text),x,y);
    }
    fit(text,width,size=16,font='Arial, sans-serif'){
      const c=this.ctx;c.font=`600 ${size}px ${font}`;let s=clean(text);if(c.measureText(s).width<=width)return s;
      while(s&&c.measureText(s+'...').width>width)s=s.slice(0,-1);return s+'...';
    }
    wrap(text,x,y,width,size=17,color=C.paper){
      const c=this.ctx;c.font=`600 ${size}px Arial, sans-serif`;let line='';const lines=[];
      for(const word of clean(text).split(' ')){const next=line?line+' '+word:word;if(line&&c.measureText(next).width>width){lines.push(line);line=word;}else line=next;}
      if(line)lines.push(line);lines.forEach((l,i)=>this.text(l,x,y+i*size*1.45,size,color));
      return y+lines.length*size*1.45;
    }
    line(x,y,xx,yy,color=C.edge,width=1){const c=this.ctx;c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
    plate(x,y,w,h,fill=C.ink,stroke=C.edge,bolts=false){
      const c=this.ctx,k=8;c.beginPath();c.moveTo(x+k,y);c.lineTo(x+w-k,y);c.lineTo(x+w,y+k);c.lineTo(x+w,y+h-k);c.lineTo(x+w-k,y+h);c.lineTo(x+k,y+h);c.lineTo(x,y+h-k);c.lineTo(x,y+k);c.closePath();c.fillStyle=fill;c.fill();c.lineWidth=1.5;c.strokeStyle=stroke;c.stroke();
      if(bolts)for(const bx of [x+10,x+w-10])for(const by of [y+10,y+h-10]){c.beginPath();c.arc(bx,by,2.7,0,Math.PI*2);c.fillStyle=C.edge;c.fill();this.line(bx-1.5,by-1.5,bx+1.5,by+1.5,C.deep);}
    }
    hit(id,x,y,w,h,action,disabled=false,hold=null){
      if(!disabled)this.hits.push({id,label:id,x,y,w,h,action,hold});
      return this.hover===id || this.focus>=0&&this.hits[this.focus]?.id===id;
    }
    button(id,label,x,y,w,action,options={}){
      const h=options.h||44,active=this.hit(id,x,y,w,h,action,options.disabled,options.hold),color=options.disabled?'#718079':options.primary?C.ink:C.paper;
      if(!options.disabled)this.hits[this.hits.length-1].label=label;
      this.plate(x,y,w,h,options.primary?(active?C.white:C.gold):active?'#385051':C.ink,options.selected?C.gold:active?C.paper:C.edge);
      this.text(this.fit(label,w-28,options.font||16),x+14,y+(h-18)/2,options.font||16,color);if(active)this.line(x+8,y+10,x+8,y+h-10,C.gold,3);
    }
    control(id,x,y,w,label){const el=$(id);this.button(id,label||value(id),x,y,w,()=>{if(!el.disabled)el.onclick?.();},{disabled:!!el.disabled});}
    slider(id,label,x,y,w,value,min,max,step,set){
      const change=v=>{set(B.clamp(Math.round(v/step)*step,min,max));this.dirty=true;},move=px=>change(min+B.clamp((px-x-16)/(w-32),0,1)*(max-min));
      this.hit(id,x,y,w,46,()=>change(value+step),false,{start:()=>move(this.pointer.x),move,stop:()=>{}});this.hits[this.hits.length-1].adjust=dir=>change(value+dir*step);this.hits[this.hits.length-1].label=label+', '+value.toFixed(2)+'. Arrow left and right adjust.';
      this.plate(x,y,w,46,C.deep,this.hits[this.focus]?.id===id?C.gold:C.edge);this.text(label,x+14,y+6,14);this.text(value.toFixed(2),x+w-14,y+6,12,C.gold,'monospace','right');this.line(x+16,y+33,x+w-16,y+33,C.edge,3);
      const knob=x+16+(w-32)*(value-min)/(max-min);this.line(x+16,y+33,knob,y+33,C.gold,3);this.ctx.beginPath();this.ctx.arc(knob,y+33,6,0,Math.PI*2);this.ctx.fillStyle=C.gold;this.ctx.fill();
    }
    icon(kind,x,y,size,color=C.paper){
      const c=this.ctx;c.save();c.translate(x,y);c.scale(size/32,size/32);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2;c.lineCap='round';c.lineJoin='round';c.beginPath();
      if(kind==='axe'){c.moveTo(9,29);c.lineTo(22,7);c.moveTo(13,8);c.lineTo(25,2);c.lineTo(31,11);c.lineTo(20,18);c.closePath();}
      else if(kind==='lamp'){c.rect(9,10,14,17);c.moveTo(8,29);c.lineTo(24,29);c.moveTo(12,9);c.bezierCurveTo(8,-1,24,-1,20,9);c.moveTo(16,14);c.lineTo(16,24);}
      else if(kind==='bomb'){c.arc(15,20,10,0,Math.PI*2);c.moveTo(15,10);c.lineTo(18,5);c.lineTo(25,7);c.moveTo(25,1);c.lineTo(25,4);c.moveTo(29,5);c.lineTo(27,6);}
      else if(kind==='gravity'){c.moveTo(16,29);c.bezierCurveTo(-5,12,2,-1,16,9);c.bezierCurveTo(30,-1,37,12,16,29);c.moveTo(18,8);c.lineTo(12,16);c.lineTo(20,19);c.lineTo(16,26);}
      else if(kind==='resonance'){c.moveTo(12,30);c.lineTo(12,21);c.lineTo(7,15);c.lineTo(7,3);c.lineTo(12,3);c.lineTo(12,14);c.lineTo(20,14);c.lineTo(20,3);c.lineTo(25,3);c.lineTo(25,15);c.lineTo(20,21);c.lineTo(20,30);c.closePath();c.moveTo(2,8);c.lineTo(4,8);c.moveTo(28,8);c.lineTo(30,8);}
      else if(kind==='sling'){c.moveTo(5,3);c.lineTo(5,14);c.lineTo(12,22);c.lineTo(12,30);c.lineTo(20,30);c.lineTo(20,22);c.lineTo(27,14);c.lineTo(27,3);c.moveTo(5,8);c.lineTo(16,17);c.lineTo(27,8);c.moveTo(12,7);c.lineTo(16,2);c.lineTo(20,7);c.lineTo(16,12);c.closePath();}
      else if(kind==='lance'){c.moveTo(5,18);c.lineTo(20,9);c.lineTo(29,5);c.lineTo(24,14);c.lineTo(9,23);c.closePath();c.moveTo(10,23);c.lineTo(12,28);c.lineTo(7,31);c.lineTo(4,25);c.moveTo(20,10);c.lineTo(24,14);}
      else if(kind==='scoop'){c.moveTo(7,28);c.lineTo(19,13);c.lineTo(15,8);c.lineTo(25,2);c.lineTo(30,11);c.lineTo(22,16);c.closePath();}
      else {c.moveTo(5,12);c.lineTo(20,12);c.lineTo(30,17);c.lineTo(20,22);c.lineTo(5,22);c.closePath();c.moveTo(9,22);c.lineTo(9,30);c.lineTo(15,30);c.lineTo(15,22);for(let n=20;n<28;n+=3){c.moveTo(n,14);c.lineTo(n-3,20);}}
      c.stroke();c.restore();
    }
    gauge(x,y,r,fraction,label,reading,color=C.gold){
      const c=this.ctx;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=C.deep;c.fill();c.strokeStyle=C.edge;c.lineWidth=3;c.stroke();
      for(let i=0;i<=24;i++){const a=Math.PI*.75+i/24*Math.PI*1.5,rr=r-(i%4?8:13);this.line(x+Math.cos(a)*rr,y+Math.sin(a)*rr,x+Math.cos(a)*(r-5),y+Math.sin(a)*(r-5),i<=fraction*24?color:C.edge,i%4?1:2);}
      const a=Math.PI*.75+B.clamp(fraction,0,1)*Math.PI*1.5;this.line(x,y,x+Math.cos(a)*(r-16),y+Math.sin(a)*(r-16),color,2);
      this.text(reading,x,y+5,18,C.white,'monospace','center');this.text(label,x,y+r-18,9,C.muted,'monospace','center');
    }
    draw(){
      const g=this.game;if(!g)return;
      if(this.lastScreen!==g.screen){this.lastScreen=g.screen;this.page=0;this.focus=-1;this.hover=null;this.releaseHolds();}
      Object.assign(C,DEFAULT);this.paper=false;
      const c=this.ctx;c.setTransform(this.ratio,0,0,this.ratio,0,0);c.clearRect(0,0,this.w,this.h);this.hits=[];this.pages=1;this.dirty=false;
      if(!g.ready){this.loading();}
      else if(g.screen==='title'){this.title();}
      else if(g.screen){this.menu();}
      else {this.hud();}
      Object.assign(C,DEFAULT);
      const toast=value('toast');if(toast&&$('toast').classList?.contains?.('visible'))this.notice(toast);
      const hit=this.at(this.pointer.x,this.pointer.y);this.hover=hit?.id||null;
      this.inputCanvas.style.cursor=g.screen?(hit?'pointer':'default'):document.pointerLockElement?'none':hit?'pointer':'crosshair';
      const accessible=g.screen?`Buttloads 2, ${g.screen}. ${this.hits[Math.max(0,this.focus)]?.label||''}. Tab selects, Enter activates, Escape returns.`:'Buttloads 2. WASD move, mouse look, left mouse uses tool, Space lifts, E interacts, I opens the field kit, Escape pauses.';
      if(this.accessible!==accessible){this.inputCanvas.setAttribute('aria-label',accessible);this.accessible=accessible;}
      this.texture.needsUpdate=true;
    }
    loading(){
      this.ctx.fillStyle=C.deep;this.ctx.fillRect(0,0,this.w,this.h);const w=Math.min(460,this.w-48),x=(this.w-w)/2,y=this.h/2-65;
      this.text('BUTTLOADS 2',x,y,34,C.gold);this.wrap(value('loading-message')||'Building the ground beneath you...',x,y+52,w,17);
      this.ctx.fillStyle=C.edge;this.ctx.fillRect(x,y+108,w,3);this.ctx.fillStyle=C.gold;this.ctx.fillRect(x,y+108,w*Number($('loading-progress').value||0),3);
    }
    title(){
      const c=this.ctx,x=this.w<700?28:Math.max(52,this.w*.08),y=Math.max(45,this.h*.18),w=Math.min(530,this.w-x*2),size=Math.min(72,w/7.3);
      const shade=c.createLinearGradient(0,0,this.w,0);shade.addColorStop(0,'rgba(9,22,25,.94)');shade.addColorStop(.7,'rgba(9,22,25,.28)');shade.addColorStop(1,'rgba(9,22,25,0)');c.fillStyle=shade;c.fillRect(0,0,this.w,this.h);
      this.text('TRONT / INDEPENDENT EXCAVATION',x,y,13,C.gold,'monospace');this.text('BUTTLOADS',x,y+40,size,C.white);
      this.text('2',x,y+40+size,130,C.gold);this.text('THE DEEPENING',x+102,y+94+size,20,C.paper);
      const by=Math.min(this.h-170,y+245);this.wrap('Start with a drill. End with a god complex.',x,by,w,19);
      this.button('start',value('start-button')||'Start digging',x,by+56,Math.min(330,w),()=>this.game.play(),{primary:true,h:58,disabled:!this.game.ready});
      this.button('about','Controls & credits',x,by+127,Math.min(220,w),()=>{this.game.aboutFrom='title';this.game.setScreen('about');});
      this.text('CLAIM 02  /  RIDGE COMMON',this.w-28,this.h-32,12,C.paper,'monospace','right');
    }
    hud(){
      const g=this.game,s=g.economy.state,e=g.expedition.state,w=this.w,h=this.h,small=w<800,touch=matchMedia('(pointer:coarse)').matches;
      this.text('CLAIM 02',24,22,12,C.gold,'monospace');this.text(value('layer'),24,40,14,C.white);
      if(!small){this.button('map','M  Survey',w-328,18,104,()=>g.openSurvey());this.button('notes','J  Notes',w-216,18,100,()=>g.journal());this.button('pause','Esc',w-108,18,84,()=>g.setScreen('pause'));}
      else this.button('pause','Menu',w-104,18,84,()=>g.setScreen('pause'));
      const gx=small?64:86,gy=h-(small?(touch?320:155):touch?245:82);this.gauge(gx,gy,small?44:55,Math.max(0,-g.player.y)/(-g.world.floor),'DEPTH / M',Math.max(0,-g.player.y).toFixed(1));
      const bx=gx+(small?55:72),bw=small?158:212;this.plate(bx,gy-44,bw,88,C.ink,C.edge,true);this.text(cash(s.cash),bx+16,gy-29,small?20:26,C.white,'monospace');this.text(`${g.economy.count} / ${g.economy.capacity} ORE`,bx+16,gy+8,13,C.muted,'monospace');
      this.ctx.fillStyle=C.deep;this.ctx.fillRect(bx+16,gy+29,bw-32,4);this.ctx.fillStyle=g.economy.count>=g.economy.capacity?C.orange:C.gold;this.ctx.fillRect(bx+16,gy+29,(bw-32)*Math.min(1,g.economy.count/g.economy.capacity),4);
      if(g.combat.state.health<100){this.text('HEALTH '+Math.ceil(g.combat.state.health),24,80,12,C.red,'monospace');this.line(24,101,24+g.combat.state.health,101,C.red,3);}
      const tools=g.expedition.tools(),slot=small?42:48,tw=tools.length*slot,tx=small?Math.max(20,(w-tw)/2):w-Math.max(300,tw)-26,ty=h-(touch?256:88);
      for(let i=0;i<tools.length;i++){const key=tools[i],x=tx+i*slot,selected=key===e.tool;this.plate(x,ty,slot-4,48,selected?C.gold:C.ink,selected?C.white:C.edge);this.icon(key,x+10,ty+7,23,selected?C.ink:C.paper);this.text(B.TOOLS[key].key,x+6,ty+33,9,selected?C.ink:C.muted,'monospace');this.hit('tool-'+key,x,ty,slot-4,48,()=>g.selectTool(key));}
      if(!small){this.text(B.TOOLS[e.tool].name,tx,ty-27,16,C.gold);this.button('kit','I  Kit',w-100,ty-38,76,()=>g.fieldKit.open(),{h:30,font:13});this.text(`C  ${g.gadgets.spec().short} ${e.supplies.bombs}     V  Lights ${e.supplies.lights}`,tx,ty+59,12,C.paper,'monospace');}
      const c=this.ctx,cx=w/2,cy=h/2;c.strokeStyle=g.cutter.edited?C.gold:C.white;c.lineWidth=1.5;c.beginPath();for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){c.moveTo(cx+Math.cos(a)*5,cy+Math.sin(a)*5);c.lineTo(cx+Math.cos(a)*9,cy+Math.sin(a)*9);}c.stroke();
      const action=g.interaction();if(action&&!g.recallTime){const label=(action.locked?'':'[E]  ')+action.label;this.prompt(label,cy+45,action.locked?C.muted:C.white);}
      else if(g.cutter.contact)this.prompt(value('contact'),cy+35,g.cutter.contact.protected?C.orange:C.muted);
      else if(g.mining?.preview?.protected)this.prompt('Common land / claim boundary',cy+35,C.orange);
      if(g.scanUntil>g.clock)this.prompt(value('scan-target')+'  /  '+value('scan-detail'),cy+83,C.green);
      if(g.recallTime>0){this.prompt('RETURNING TO THE YARD',cy+45,C.gold);this.line(cx-90,cy+74,cx-90+180*g.recallTime/1.25,cy+74,C.gold,3);}
      if(g.input.aim)this.prompt(value('throw-hint'),cy+110,C.gold);
      if(g.pickupUntil>g.clock)this.prompt(value('pickup'),cy+140,C.gold);
      if(!small&&g.fieldKit.tip&&!$('field-tip').hidden){const tip=g.fieldKit.tip;this.plate(24,118,280,120,'rgba(14,27,33,.88)',C.edge);this.text(tip.title,40,132,16,C.gold);this.wrap(tip.text,40,157,244,14);this.button('tip','Y  Got it',40,201,95,()=>g.fieldKit.dismiss(),{h:27,font:12});}
      if(!small){this.text(value('mission-label'),cx,24,11,C.gold,'monospace','center');this.text(value('mission'),cx,44,13,C.paper,'sans-serif','center');}
      if(['resonance','gravity','sling'].includes(e.tool)){const charge=e.tool==='sling'?g.kinetics.state.charge:g.expedition.cooldown>0?1-g.expedition.cooldown/(e.tool==='gravity'?2.4:1.3):g.expedition.charge;this.line(cx-36,cy+22,cx+36,cy+22,C.edge,2);this.line(cx-36,cy+22,cx-36+72*B.clamp(charge,0,1),cy+22,C.gold,3);}
      if(g.gadgets.remoteCount)this.prompt('H / '+g.gadgets.remoteCount+' remote charges ready',h-145,C.orange);
      for(const prefix of ['threat','foreman']){const id=prefix==='threat'?'threat':'foreman-hud';if(!$(id).hidden){const name=prefix==='threat'?value('threat-name'):'THE FOREMAN BELOW';this.prompt(name+' / '+value(prefix==='threat'?'threat-action':'foreman-hint'),h*.18,C.orange);const health=parseFloat($(prefix==='threat'?'enemy-health':'foreman-health').style.width)||0;this.line(cx-120,h*.18+35,cx+120,h*.18+35,C.edge,4);this.line(cx-120,h*.18+35,cx-120+2.4*health,h*.18+35,C.orange,4);this.text(prefix==='foreman'?value('foreman-locks'):value('enemy-armor'),cx,h*.18+45,12,C.gold,'monospace','center');}}
      if(g.chapterUntil>g.clock){this.text(value('chapter-name'),cx,100,28,C.gold,'sans-serif','center');this.text(value('chapter-unlock'),cx,136,14,C.paper,'sans-serif','center');}
      if(g.combat.hurtFlash>0){c.fillStyle=`rgba(146,29,16,${Math.min(.24,g.combat.hurtFlash*.25)})`;c.fillRect(0,0,w,h);}
      if(touch)this.touch();
    }
    prompt(text,y,color){if(!text)return;this.ctx.font='600 13px Arial, sans-serif';const w=Math.min(this.w-36,Math.max(170,this.ctx.measureText(clean(text)).width+40));this.plate((this.w-w)/2,y-5,w,34,'rgba(14,27,33,.86)',C.edge);this.text(this.fit(text,w-24,13),this.w/2,y+3,13,color,'sans-serif','center');}
    notice(text){const w=Math.min(600,this.w-36),y=this.game.screen?this.h-94:82;this.plate((this.w-w)/2,y,w,52,C.gold,C.white);this.wrap(text,(this.w-w)/2+16,y+10,w-32,14,C.ink);}
    frame(title,subtitle,options={}){
      const c=this.ctx;c.fillStyle='rgba(5,14,18,.66)';c.fillRect(0,0,this.w,this.h);
      if(options.paper){Object.assign(C,PAPER);this.paper=true;}
      const w=Math.min(options.side?620:960,this.w-32),h=Math.min(746,this.h-36),x=options.side?16:(this.w-w)/2,y=(this.h-h)/2;
      this.plate(x+4,y+7,w,h,'rgba(0,0,0,.5)',C.deep);this.plate(x,y,w,h,C.ink,C.edge,true);
      if(options.paper){for(let n=y+110;n<y+h-24;n+=25)this.line(x+24,n,x+w-24,n,'rgba(120,93,52,.09)');this.line(x+20,y+110,x+20,y+h-25,'rgba(170,77,48,.35)',2);}
      this.plate(x+14,y+14,w-28,80,C.deep,C.edge);this.text(this.fit(subtitle.toUpperCase(),w-150,11,'Consolas, monospace'),x+32,y+29,11,C.gold,'monospace');this.text(this.fit(title,w-150,this.w<600?23:30),x+32,y+49,this.w<600?23:30,C.white);
      this.button('close','Close',x+w-104,y+34,76,()=>this.game.play(),{h:38,font:14});
      this.frameBox={x:x+28,y:y+112,w:w-56,h:h-178,bottom:y+h-55};return this.frameBox;
    }
    paginate(rows,render,rowHeight=84){
      const b=this.frameBox,n=Math.max(1,Math.floor(b.h/rowHeight));this.pages=Math.max(1,Math.ceil(rows.length/n));this.page=B.clamp(this.page,0,this.pages-1);
      rows.slice(this.page*n,(this.page+1)*n).forEach((row,i)=>render(row,b.x,b.y+i*rowHeight,b.w,i));
      if(this.pages>1){this.button('prev','<',b.x,b.bottom,48,()=>{this.page=Math.max(0,this.page-1);this.focus=-1;},{h:32,disabled:this.page===0});this.text(`${this.page+1} / ${this.pages}`,b.x+64,b.bottom+9,12,C.muted,'monospace');this.button('next','>',b.x+130,b.bottom,48,()=>{this.page=Math.min(this.pages-1,this.page+1);this.focus=-1;},{h:32,disabled:this.page===this.pages-1});}
      if(b.w>520)this.text('TAB SELECT   ENTER USE   ESC BACK',b.x+b.w,b.bottom+10,10,C.muted,'monospace','right');
    }
    row(title,detail,price,action,disabled,x,y,w,id){
      const active=this.hit(id,x,y,w,74,action,disabled);
      if(!disabled)this.hits[this.hits.length-1].label=title+', '+price;
      if(this.paper){if(active){this.ctx.fillStyle='rgba(161,103,30,.12)';this.ctx.fillRect(x,y,w,74);}this.line(x,y+73,x+w,y+73,C.edge);}
      else this.plate(x,y,w,74,active?'#314649':C.deep,active?C.gold:C.edge);
      if(w<420){this.text(this.fit(title,w-28,15),x+14,y+8,15,disabled?C.muted:C.white);this.wrap(this.fit(detail,(w-28)*1.65,12),x+14,y+29,w-28,12,C.muted);this.text(this.fit(price,w-28,10,'Consolas, monospace'),x+w-14,y+60,10,C.gold,'monospace','right');}
      else {this.text(this.fit(title,w-145,18),x+16,y+10,18,disabled?C.muted:C.white);this.wrap(this.fit(detail,(w-155)*1.7,13),x+16,y+36,w-150,13,C.muted);this.text(this.fit(price,115,13,'Consolas, monospace'),x+w-16,y+23,13,disabled?C.muted:C.gold,'monospace','right');}
    }
    menu(){
      const g=this.game,s=g.screen;
      if(s==='pause')this.pause();else if(s==='kit')this.kit();else if(s==='town')this.town();else if(s==='shop')this.shop();else if(s==='survey')this.survey();else if(s==='journal')this.journal();else if(s==='about')this.about();else this.special(s);
    }
    pause(){
      const g=this.game,b=this.frame('Tools down.','Field station / paused'),cols=b.w>650?2:1,space=16,cw=(b.w-space*(cols-1))/cols;
      const actions=[['resume','Back to digging',()=>g.play()],['kit','Field kit',()=>g.fieldKit.open()],['export','Export this claim',()=>g.export()],['import','Import a claim',()=>$('import-file').click()],['return','Return to the yard',()=>{g.recall();g.play();}],['new','Start a new claim',()=>g.setScreen('confirm')],['about','Controls & credits',()=>{g.aboutFrom='pause';g.setScreen('about');}]];
      const rows=actions.map(([id,label,fn])=>({id,label,fn}));
      for(const key of ['sound','tips','motion','sensitivity','quality'])rows.push({key});
      const size=56,per=Math.max(1,Math.floor(b.h/size))*cols;this.pages=Math.ceil(rows.length/per);this.page=B.clamp(this.page,0,this.pages-1);
      rows.slice(this.page*per,(this.page+1)*per).forEach((r,i)=>{const x=b.x+(i%cols)*(cw+space),y=b.y+Math.floor(i/cols)*size;if(r.key){const names={sound:'Sound',tips:'Field tips',motion:'Tool motion',sensitivity:'Look sensitivity',quality:'Render scale'},v=g.settings[r.key],set=value=>{g.settings[r.key]=value;g.syncSettings();g.changed();if(r.key==='quality')g.view.resize();if(r.key==='sound')g.audio.start();};if(typeof v==='boolean')this.button('setting-'+r.key,names[r.key]+'  '+(v?'ON':'OFF'),x,y,cw,()=>set(!v));else this.slider('setting-'+r.key,names[r.key],x,y,cw,v,r.key==='quality'?.75:.25,r.key==='quality'?2:3,r.key==='quality'?.25:.05,set);}else this.button(r.id,r.label,x,y,cw,r.fn,{primary:r.id==='resume'});});
      this.text(value('save-status'),b.x,b.bottom-24,12,C.muted);this.footer(b);
    }
    footer(b){if(this.pages>1){const narrow=b.w<480;this.button('prev',narrow?'<':'Previous',b.x,b.bottom,narrow?44:116,()=>{this.page=Math.max(0,this.page-1);},{h:32,disabled:!this.page});this.button('next',narrow?'>':'Next',b.x+(narrow?52:124),b.bottom,narrow?44:92,()=>{this.page=Math.min(this.pages-1,this.page+1);},{h:32,disabled:this.page===this.pages-1});}this.text(`${b.w>520?'TAB / ENTER    ':''}${this.page+1} OF ${this.pages}`,b.x+b.w,b.bottom+9,11,C.muted,'monospace','right');}
    kit(){
      const g=this.game,e=g.expedition.state,b=this.frame('Field kit',e.supplies.bombs+' charges / '+e.supplies.lights+' work lights');
      const tw=Math.min(220,(b.w-12)/2);this.button('kit-tools','Tools',b.x,b.y,tw,()=>{this.kitTab=0;this.page=0;},{h:36,selected:!this.kitTab});this.button('kit-supplies','Demolition & gear',b.x+tw+12,b.y,tw,()=>{this.kitTab=1;this.page=0;},{h:36,font:14,selected:!!this.kitTab});b.y+=52;b.h-=52;
      if(!this.kitTab){
        const cols=b.w>780?3:b.w>480?2:1,cw=(b.w-16*(cols-1))/cols,rh=158,n=cols*Math.max(1,Math.floor(b.h/rh)),tools=Object.entries(B.TOOLS);this.pages=Math.ceil(tools.length/n);this.page=B.clamp(this.page,0,this.pages-1);
        tools.slice(this.page*n,(this.page+1)*n).forEach(([key,t],i)=>{
          const x=b.x+i%cols*(cw+16),y=b.y+Math.floor(i/cols)*rh,owned=g.expedition.tools().includes(key),selected=e.tool===key,hover=this.hit('equip-'+key,x,y,cw,rh-12,()=>{g.selectTool(key);g.fieldKit.sync();},!owned);
          this.plate(x,y,cw,rh-12,C.deep,selected?C.gold:hover?C.white:C.edge);this.icon(key,x+18,y+13,58,owned?C.gold:C.edge);this.text(owned?t.key:'LOCKED',x+cw-14,y+15,11,owned?C.paper:C.muted,'monospace','right');
          this.text(this.fit(t.name,cw-28,18),x+14,y+80,18,owned?C.white:C.muted);const copy=selected?'EQUIPPED':owned?t.hint:t.depth?'Unlock at '+t.depth+' m':t.magic?'Wake the heart':key==='sling'?'Discover the buried workshop':'Recover the engine';this.wrap(this.fit(copy,(cw-28)*1.6,12),x+14,y+108,cw-28,12,selected?C.gold:C.muted);
        });this.footer(b);
      }else{
        const rows=Object.keys(B.CHARGES).map(key=>({charge:key}));rows.push({note:'V places a work light. Aim and E retrieves it. Hold C to aim a charge, release to throw. N changes charge type; H fires remote satchels.'});
        for(const id of ['kit-anchor','kit-freight','kit-foundry','kit-rift'])if(!$(id).hidden)rows.push({note:value(id)});
        this.paginate(rows,(r,x,y,w)=>{if(r.charge){const t=g.gadgets.spec(r.charge),owned=g.gadgets.modes().includes(r.charge);this.row(t.name,t.hint,e.chargeMode===r.charge?'SELECTED':owned?'SELECT':B.CHARGES[r.charge].depth+' m',()=>g.selectCharge(r.charge),!owned,x,y,w,'charge-'+r.charge);}else this.wrap(r.note,x+8,y+4,w-16,14);},94);
      }
    }
    town(){
      const g=this.game,p=g.townUI.person,b=this.frame(p?.name||value('town-name'),(p?.role||'Trading post')+' / '+cash(g.economy.state.cash),{side:true,paper:true});
      const dy=this.wrap(value('town-dialogue'),b.x,b.y,b.w,18,C.paper),cw=Math.min(165,(b.w-12)/2);this.control('town-news',b.x,dy+12,cw,'About the mine');this.control('town-advice',b.x+cw+12,dy+12,cw,'Any advice?');
      const used=dy+70-b.y;b.y+=used;b.h-=used;
      const rows=Array.from($('town-services').children);this.paginate(rows,(el,x,y,w,i)=>{const [a,d,p]=Array.from(el.children);this.row(a?.textContent,d?.textContent,p?.textContent,()=>el.onclick?.(),el.disabled,x,y,w,'service-'+(this.page*20+i));},88);
    }
    shop(){
      const g=this.game,s=g.economy.state,b=this.frame('Supply ledger',cash(s.cash)+' available',{paper:true});
      const rows=[{title:'Sell your haul',detail:g.economy.saleCount+' minerals including yard stock',price:cash(g.economy.saleValue),disabled:!g.economy.saleCount,fn:()=>g.sell()},{title:'Three charges',detail:'Blast, remote satchel and bore supplies',price:'$32',disabled:s.cash<32||s.expedition.supplies.bombs>96,fn:()=>g.restock('bomb')},{title:'Six work lights',detail:'Place with V. Retrieve with E.',price:'$24',disabled:s.cash<24||s.expedition.supplies.lights>93,fn:()=>g.restock('lamp')}];
      for(const [key,t] of Object.entries(B.GEAR)){const l=s.gear[key],price=t.costs[l];rows.push({title:t.name,detail:t.values[l]+(price===undefined?'':' to '+t.values[l+1])+' '+t.unit,price:price===undefined?'COMPLETE':cash(price),disabled:price===undefined||s.cash<price,fn:()=>g.buy(key)});}
      rows.push({title:'Freight crane',detail:value('freight-shop-detail'),price:value('buy-freight'),disabled:$('buy-freight').disabled,fn:()=>$('buy-freight').onclick?.()});
      this.paginate(rows,(r,x,y,w,i)=>this.row(r.title,r.detail,r.price,r.fn,r.disabled,x,y,w,'shop-'+i),92);
    }
    survey(){
      const g=this.game,b=this.frame('The mine, on record.','Survey instrument / explored passages only'),depth=Number($('survey-depth').value)||0;
      const controlsY=b.y;this.button('shallower','- 5 m',b.x,controlsY,92,()=>this.changeDepth(depth-5),{h:36});this.text(depth+' METRES',b.x+110,controlsY+10,14,C.gold,'monospace');this.button('deeper','+ 5 m',b.x+235,controlsY,92,()=>this.changeDepth(depth+5),{h:36});
      this.button('here','My level',b.x,controlsY+44,92,()=>this.changeDepth(-g.player.head.y),{h:32,font:12});
      this.button('projection',this.mapProfile?'Profile':'Plan',b.x+100,controlsY+44,85,()=>{this.mapProfile=!this.mapProfile;},{h:32,font:12});
      if(g.mysteries.state.solved.includes(1))this.button('focus',B.ORES[g.mysteries.state.focus]?.name||'All ore',b.x+193,controlsY+44,Math.min(130,b.w-193),()=>{g.mysteries.focus((g.mysteries.state.focus+2)%6-1);g.changed();g.updateSurvey();},{h:32,font:12});
      const side=Math.min(b.w,b.h-(b.w>650?96:166),b.w>650?b.w*.58:b.w),x=b.x,y=b.y+92,cols=g.survey.columns,unit=side/cols,top=y+(side-32*unit)/2,tiles=g.survey.slice(depth),c=this.ctx;
      c.fillStyle=C.deep;c.fillRect(x,y,side,side);
      for(let i=0;i<tiles.length;i++)if(tiles[i]){c.fillStyle=tiles[i]===2?'#91a18a':'#394c45';c.fillRect(x+(i%cols)*unit,top+Math.floor(i/cols)*unit,unit+.2,unit+.2);}
      for(let i=0;i<=cols;i+=4)this.line(x+i*unit,top,x+i*unit,top+32*unit,'rgba(213,220,184,.12)');for(let i=0;i<=32;i+=4)this.line(x,top+i*unit,x+side,top+i*unit,'rgba(213,220,184,.12)');
      const markers=g.survey.markers(g);for(const m of markers)if(Math.abs(-m.y-depth-.5)<=1.5){c.beginPath();c.arc(x+(m.x+16)*unit,top+(m.z+16)*unit,m.type==='ore'?2.5:5,0,Math.PI*2);c.fillStyle=m.color||C.gold;c.fill();}
      const px=x+(g.player.x+16)*unit,py=top+(g.player.z+16)*unit;c.save();c.translate(px,py);c.rotate(-g.player.yaw);c.beginPath();c.moveTo(0,-9);c.lineTo(6,7);c.lineTo(0,3);c.lineTo(-6,7);c.closePath();c.fillStyle=C.white;c.fill();c.restore();
      this.text('N',x+side/2,y+6,12,C.paper,'monospace','center');
      if(this.mapProfile){
        c.fillStyle=C.deep;c.fillRect(x,y,side,side);const sx=(side-40)/cols,sy=(side-36)/(g.survey.maxDepth+1);
        for(const layer of B.STRATA){if(layer.depth>g.survey.maxDepth)continue;const yy=y+12+layer.depth*sy;this.line(x+30,yy,x+side-10,yy,layer.color);this.text(layer.depth,x+2,yy+2,9,C.muted,'monospace');}
        c.fillStyle='#91a18a';for(const id of g.survey.profileColumns())c.fillRect(x+30+(id%cols)*sx,y+12+Math.floor(id/cols)*sy,sx,Math.max(1,sy));
        this.line(x+30,y+12+depth*sy,x+side-10,y+12+depth*sy,C.gold,2);
        for(const m of markers)if(!['ore','lamp'].includes(m.type)){c.beginPath();c.arc(x+30+(m.x+16)*sx,y+12-m.y*sy,4,0,Math.PI*2);c.fillStyle=m.color||C.gold;c.fill();}
        c.beginPath();c.arc(x+30+(g.player.x+16)*sx,y+12+Math.max(0,-g.player.head.y)*sy,4,0,Math.PI*2);c.fillStyle=C.white;c.fill();this.text('W / EXPLORED PASSAGES / E',x+side/2,y+side-16,9,C.muted,'monospace','center');
      }
      const contacts=markers.filter(m=>!['ore','lamp'].includes(m.type));const lx=b.w>650?x+side+24:x,ly=b.w>650?y:y+side+12,lw=b.w>650?b.w-side-24:b.w,n=Math.max(1,Math.floor((b.w>650?side:Math.max(44,b.h-side-110))/48));this.pages=Math.max(1,Math.ceil(contacts.length/n));this.page=B.clamp(this.page,0,this.pages-1);
      contacts.slice(this.page*n,(this.page+1)*n).forEach((m,i)=>this.button('signal-'+i,Math.round(-m.y)+' m / '+m.name,lx,ly+i*48,lw,()=>this.changeDepth(-m.y),{font:12,h:42}));this.footer(b);
    }
    changeDepth(d){$('survey-depth').value=B.clamp(Math.round(d),0,this.game.survey.maxDepth);this.game.updateSurvey();}
    journal(){
      const g=this.game,s=g.economy.state,b=this.frame('Field notes','Deepest '+s.deepest.toFixed(1)+' m / earned '+cash(s.earned),{paper:true}),rows=[];
      rows.push({title:'Your mineral ledger',text:B.ORES.map((o,i)=>`${o.name}: ${s.cargo[i]} carried, ${s.sold[i]} sold (${cash(o.value)} each)`).join(' / ')});
      const html=$('discovery-list').innerHTML||'';for(const m of html.matchAll(/<strong>([\s\S]*?)<\/strong>\s*<p>([\s\S]*?)<\/p>/g))rows.push({title:clean(m[1]),text:clean(m[2])});
      for(const m of B.MYSTERIES||[]){if(!g.mysteries.state.known.includes(m.id))continue;const solved=g.mysteries.state.solved.includes(m.id);rows.push({title:m.name+(solved?' / RECOVERED':''),text:clean(m.clue+' '+m.benefit),mystery:solved?undefined:m.id});}
      // Measure text before pagination so long discovery notes never disappear under buttons.
      const per=this.h<720||b.w<600?1:2;this.pages=Math.max(1,Math.ceil(rows.length/per));this.page=B.clamp(this.page,0,this.pages-1);let y=b.y;
      for(const r of rows.slice(this.page*per,(this.page+1)*per)){this.text(this.fit(r.title,b.w,21),b.x,y,21,C.gold);y=this.wrap(r.text,b.x,y+34,b.w,16)+24;if(r.mystery!==undefined){const tracked=g.mysteries.state.tracked===r.mystery;this.button('track-'+r.mystery,tracked?'Stop tracking':'Track signal',b.x,y,150,()=>{g.mysteries.track(tracked?-1:r.mystery);g.changed();g.journal();g.updateHUD();});y+=60;}}
      this.button('chart','Open mine survey',b.x+b.w-185,b.bottom-54,185,()=>g.openSurvey());this.footer(b);
    }
    about(){
      const b=this.frame('Inside the hole.','Controls / a game by Trent Sterling');this.hits[0].action=()=>this.game.setScreen(this.game.aboutFrom||'pause');
      const rows=[['Move / run','WASD / Shift'],['Look','Mouse, or right-drag without capture'],['Cut / attack / use tool','Hold left mouse'],['Lift','Hold Space'],['Interact / collect placed equipment','E'],['Equip tools / field kit','1-7 / I'],['Aim and throw explosive','Hold and release C'],['Charge type / detonate remotes','N / H'],['Place light / scan','V / F'],['Mine survey / field notes','M / J'],['Return to yard / anchor return','Hold R / G'],['Place return anchor / freight','B / hold and release T'],['Rift / foundry bore','Q / Z, after unlocking'],['Save / import / accessibility settings','Escape menu'],['Credits','Game, procedural art and sound: Trent Sterling. Three.js and Surface Nets: MIT.'],['Touch','Left stick moves. Drag elsewhere to look. Hold the Cut or Lift controls. Tap tools and menus.']];
      this.paginate(rows,([title,copy],x,y,w)=>{this.text(title,x,y+8,18,C.gold);this.wrap(copy,x,y+36,w,15);},78);
    }
    special(screen){
      const g=this.game,defs={confirm:['Start a new claim?','This replaces the saved mine. Export this claim first if you want to return to it.'],discovery:[value('discovery-name'),value('discovery-text')+' '+value('discovery-reward')],ending:['The ground keeps going.','The heart is awake. The upper mine is yours. The ring below the heart opens the older workings. Bring charges and lights; restored stations give you return routes.'],foreman:['The furnace belongs to you.','Ridge Common has power again. The town pays $5,000 once. Z now melts a 12 m passage with a six-second recharge. Your mine stays yours.'],rescue:['Inez Rook. Still here.','The brake held when the roof came down. Expose the bell, fit one work-light cell, and clear a shaft above it. '+value('rescue-status')],freight:['Keep the mine moving.',value('freight-dock-status')+' / Pack: '+value('freight-pack-count')+' / Cage: '+value('freight-load-count')+' / Yard: '+value('freight-stock-count')]};
      const [title,copy]=defs[screen]||['Field station','Return to digging.'],b=this.frame(title,'Claim 02 / '+screen);let y=this.wrap(copy,b.x,b.y,b.w,20)+32;
      if(['ending','foreman'].includes(screen)){const s=g.economy.state;y=this.wrap(`${cash(s.earned)} earned / ${s.deepest.toFixed(1)} m deepest / ${s.trips} hauls delivered`,b.x,y,b.w,18,C.gold)+24;}
      const actions=screen==='confirm'?[['confirm-export','Export current save'],['confirm-cancel','Keep this claim'],['confirm-new','Replace claim']]:screen==='freight'?[['freight-send','Load and send'],['freight-recall','Recall cage'],['freight-take','Take cargo back'],['freight-pack','Pack crane']]:screen==='rescue'?[['rescue-control',value('rescue-control')||'Fit cell & raise bell']]:[];
      for(const [id,label] of actions){this.control(id,b.x,y,Math.min(360,b.w),label);y+=56;}
      if(screen==='ending'){this.button('export','Export this claim',b.x,y,240,()=>g.export());y+=56;}
      if(screen!=='confirm')this.button('continue','Back to digging',b.x,Math.min(y,b.bottom-54),Math.min(260,b.w),()=>g.play(),{primary:true});
    }
    touch(){
      const g=this.game,h=this.h,w=this.w,e=g.expedition.state;
      const rows=this.touchPage?[['mode','Type',()=>g.cycleCharge()],['remote','Fire',()=>g.detonate()],['freight','Crane',()=>g.aimFreight(),()=>g.releaseFreight()],['anchor','Anchor',()=>g.player.y<-.5?g.anchor():g.descend()],['rift','Rift',()=>{if(e.awakened&&g.expedition.pulse(g.player,true))g.changed();}],['foundry','Bore',()=>g.foundryBore()],['notes','Notes',()=>g.journal()],['kit','Kit',()=>g.fieldKit.open()],['recall','Return',()=>g.input.keys.add('KeyR'),()=>g.input.keys.delete('KeyR')],['more','Back',()=>{this.touchPage=0;}]]:[['cut','Cut',()=>{g.input.fire=true;},()=>{g.input.fire=false;}],['lift','Lift',()=>g.input.keys.add('Space'),()=>g.input.keys.delete('Space')],['use','E Use',()=>g.use()],['scan','Scan',()=>g.scan()],['lamp','Light',()=>g.deploy('lamp')],['bomb','Charge',()=>g.aimBomb(),()=>g.releaseBomb()],['kit','Kit',()=>g.fieldKit.open()],['map','Map',()=>g.openSurvey()],['recall','Return',()=>g.input.keys.add('KeyR'),()=>g.input.keys.delete('KeyR')],['more','More',()=>{this.touchPage=1;}]];
      rows.forEach(([id,label,start,stop],i)=>this.button('touch-'+id,label,w-206+(i%3)*66,h-205+Math.floor(i/3)*49,60,stop?()=>{}:start,{h:43,font:12,hold:stop?{start,stop}:null}));
      this.gauge(64,h-82,45,0,'MOVE','',C.edge);this.hit('stick',12,h-134,104,104,()=>{},false,{start:()=>{},stop:()=>{for(const k of ['KeyW','KeyA','KeyS','KeyD'])g.input.keys.delete(k);},move:(x,y)=>{const dx=x-64,dy=y-(h-82);for(const [key,on] of [['KeyW',dy<-15],['KeyS',dy>15],['KeyA',dx<-15],['KeyD',dx>15]])on?g.input.keys.add(key):g.input.keys.delete(key);}});
    }
    at(x,y){return [...this.hits].reverse().find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);}
    activate(hit){if(!hit)return;hit.action?.();this.dirty=true;}
    releaseHolds(){for(const h of this.held.values())h.hold?.stop();this.held.clear();}
    bind(){
      const canvas=this.inputCanvas,stop=e=>{e.preventDefault();e.stopImmediatePropagation?.();e.__b2UIHandled=true;};
      const point=e=>{const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*this.w/rect.width,y:(e.clientY-rect.top)*this.h/rect.height};};
      canvas.addEventListener('pointerdown',e=>{
        if(!this.game||document.pointerLockElement===canvas)return;
        const p=point(e),hit=this.at(p.x,p.y);this.pointer=p;
        if(!hit&&!this.game.screen)return;
        stop(e);canvas.focus({preventScroll:true});if(e.button!==0&&e.pointerType!=='touch')return;
        if(hit?.hold){this.held.set(e.pointerId,hit);canvas.setPointerCapture(e.pointerId);hit.hold.start();hit.hold.move?.(p.x,p.y);}else this.activate(hit);
      },true);
      canvas.addEventListener('pointermove',e=>{const p=point(e);this.pointer=p;const h=this.held.get(e.pointerId);if(h){stop(e);h.hold.move?.(p.x,p.y);}const hover=this.at(p.x,p.y)?.id||null;if(hover!==this.hover){this.hover=hover;this.dirty=true;}},true);
      for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{const h=this.held.get(e.pointerId);if(h){stop(e);this.held.delete(e.pointerId);if(type==='pointerup')h.hold.stop();else {this.game.clearInput();this.releaseHolds();}this.dirty=true;}},true);
      canvas.addEventListener('wheel',e=>{if(!this.game?.screen)return;stop(e);this.page=B.clamp(this.page+Math.sign(e.deltaY),0,this.pages-1);this.focus=-1;this.dirty=true;},{capture:true,passive:false});
      window.addEventListener('keydown',e=>{
        if(!this.game?.screen||e.ctrlKey||e.altKey||e.metaKey)return;
        if(['Tab','ArrowDown','ArrowUp'].includes(e.code)){stop(e);const direction=e.shiftKey||e.code==='ArrowUp'?-1:1;this.focus=(this.focus+direction+this.hits.length)%Math.max(1,this.hits.length);this.dirty=true;}
        else if(['Enter','Space'].includes(e.code)){stop(e);this.activate(this.hits[Math.max(0,this.focus)]);}
        else if(['ArrowLeft','ArrowRight'].includes(e.code)&&this.hits[this.focus]?.adjust){stop(e);this.hits[this.focus].adjust(e.code==='ArrowLeft'?-1:1);}
        else if(['PageDown','PageUp'].includes(e.code)){stop(e);this.page=B.clamp(this.page+(e.code==='PageDown'?1:-1),0,this.pages-1);this.focus=-1;this.dirty=true;}
      },true);
      window.addEventListener('blur',()=>this.releaseHolds());
    }
  }
  B.GameUI=GameUI;
})(B2);
