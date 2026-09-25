// Paint the actual game UI with a native 2D canvas. No browser or OS input.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {nodeGame} from './node-game.mjs';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require('./out/ui-render/node_modules/@napi-rs/canvas');
const h=await nodeGame({canvasFactory:createCanvas}),g=h.game,ui=g.view.gameUI;
const out=path.join(import.meta.dirname,'out','interface');fs.mkdirSync(out,{recursive:true});
function capture(name,screen,w=1440,height=900){
 globalThis.innerWidth=w;globalThis.innerHeight=height;ui.resize();g.setScreen(screen);ui.draw();
 fs.writeFileSync(path.join(out,name+'.png'),ui.canvas.toBuffer('image/png'));
 const outside=ui.hits.filter(r=>r.x<0||r.y<0||r.x+r.w>w+.01||r.y+r.h>height+.01);
 if(outside.length)throw Error(name+' has offscreen controls: '+outside.map(r=>r.id));
 console.log(name+': '+ui.hits.length+' game controls / '+ui.pages+' pages');
}
try{
 capture('title','title');capture('hud',null);capture('pause','pause');g.fieldKit.open();capture('kit','kit');g.updateShop();capture('shop','shop');
 g.townUI.person=B2.TOWN.people[1];h.elements.get('town-name').textContent=g.townUI.person.name;h.elements.get('town-dialogue').textContent='Bring the right tool. I can tune your cutter, make room for a bigger haul, and give you a quicker way back down.';g.townUI.refresh();capture('otis','town');
 g.openSurvey();capture('survey','survey');g.journal();capture('journal','journal');capture('about','about');capture('confirm','confirm');
 g.economy.state.deepest=35;g.updateHUD();g.fieldKit.open();capture('kit-laptop','kit',1280,720);capture('pause-small','pause',640,720);
 globalThis.matchMedia=()=>({matches:true});capture('hud-touch',null,390,844);capture('kit-touch','kit',390,844);
 // Rich journal fixture: presentation coverage, not earned campaign evidence.
 g.expedition.state.recovered=[0,1];g.expedition.state.runes=[0,1,2];g.expedition.state.awakened=true;g.economy.state.deepest=290;g.fossil.state.known=true;g.deep.state.open=true;g.foreman.state.known=true;g.crawlers.nodes[0].known=true;g.mysteries.state.known=[0,1];g.journal();capture('journal-late','journal',390,844);
 for(let i=1,n=ui.pages;i<n;i++){ui.page=i;ui.draw();fs.writeFileSync(path.join(out,'journal-late-'+i+'.png'),ui.canvas.toBuffer('image/png'));}
 globalThis.matchMedia=()=>({matches:false});g.expedition.state.tool='cutter';g.updateHUD();h.elements.get('toast').classList.remove('visible');capture('hud-laptop',null,1280,720);capture('case-laptop','kit',1280,720);
 const sceneFile=path.join(import.meta.dirname,'out','beauty-interface','yard.png');
 if(fs.existsSync(sceneFile)){
  const scene=await loadImage(sceneFile),composite=createCanvas(1280,720),ctx=composite.getContext('2d');
  for(const [name,screen] of [['hud-study',null],['case-study','kit']]){g.setScreen(screen);ui.draw();ctx.drawImage(scene,0,0);ctx.drawImage(ui.canvas,0,0,1280,720);fs.writeFileSync(path.join(out,name+'.png'),composite.toBuffer('image/png'));}
 }
 g.setScreen(null);const begin=performance.now();for(let i=0;i<100;i++)ui.draw();console.log('Native canvas HUD mean paint: '+((performance.now()-begin)/100).toFixed(2)+' ms (offline CPU measurement, not browser FPS)');
 fs.writeFileSync(path.join(out,'README.txt'),'Actual GameUI canvas paint, exported without a browser. Transparent HUD images omit the 3D scene. Does not verify WebGL compositing or human input.\n');
}finally{h.close();}
