// Passive page-scoped rendering only. Never click, focus a window, send input,
// acquire pointer lock, or connect to the public mine. Run against dist/index.html.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'cave-reports/browser');
fs.mkdirSync(out,{recursive:true});
const built=fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),current=fs.readFileSync(path.join(root,'src/beauty.js'),'utf8');
const baselinePath=path.join(root,'cave-reports/baseline-beauty.js');
const pages={R4:built};
if(fs.existsSync(baselinePath)){
 const old=fs.readFileSync(baselinePath,'utf8'),escaped=current.replace(/<\/script/gi,'<\\/script');
 assert.equal(built.split(escaped).length,2,'exact rendering module must occur once in standalone');
 pages.MAIN=built.replace(escaped,old.replace(/<\/script/gi,'<\\/script'));
}
const report={buildSHA256:crypto.createHash('sha256').update(built).digest('hex'),baseline:'a28fa21085ddcf30e9d7f77cec74fd99e3657b2b',method:'Actual generated game, offline, explicit render calls; frame accounting advances before EVERY render; no input/RAF/simulation loop or hardware FPS claim',variants:{},errors:[]};
const server=http.createServer((req,res)=>{const key=new URL(req.url,'http://localhost').pathname.slice(1)||'R4';if(pages[key]){res.writeHead(200,{'Content-Type':'text/html'});res.end(pages[key]);}else{res.writeHead(204);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const name of Object.keys(pages)){
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  report.variants[name]={errors,shots:[],diagnostics:[]};
  await context.route('**/*',route=>route.request().url().startsWith(`http://127.0.0.1:${port}/`)?route.continue():route.abort());
  await page.addInitScript(()=>{
   window.__lockAttempts=0;
   Object.defineProperty(Element.prototype,'requestPointerLock',{configurable:false,value(){window.__lockAttempts++;throw Error('Agent pointer lock is forbidden');}});
   window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};
  });
  await page.goto(`http://127.0.0.1:${port}/${name}?offline`,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.__buttloads?.ready||document.getElementById('loading-message')?.textContent.includes('Could not start'),null,{polling:100,timeout:120000});
  const ready=await page.evaluate(()=>({ready:!!window.__buttloads?.ready,error:document.getElementById('loading-message')?.textContent}));
  assert.ok(ready.ready,JSON.stringify(ready));
  const setup=await page.evaluate(()=>{
   const g=window.__buttloads,v=g.view,gl=v.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
   g.settings.sound=false;g.settings.motion=false;g.settings.quality=1;v.resize();g.screen=null;g.running=false;g.accumulator=0;
   v.gameUI.render=()=>{};v.renderer.info.autoReset=false;
   return {ready:g.ready,webgl2:v.renderer.capabilities.isWebGL2,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),three:THREE.REVISION,oreCount:g.deposits.nodes.length,networkRole:g.net?.role};
  });
  Object.assign(report.variants[name],setup);assert.equal(setup.webgl2,true);assert.equal(setup.networkRole,'offline');
  for(const shot of ['surface','lantern','chalk','violet','gold-embedded','gold-excavated']){
   const record=await page.evaluate(async shot=>{
    const g=window.__buttloads,v=g.view,p=g.player,w=g.world;let eye,target;
    if(shot==='surface'){eye=[0,1.64,11.5];target=[0,1.5,20];}
    else if(shot.startsWith('gold')){
     if(!window.__caveGold){
      const n=g.deposits.nodes.find(n=>n.kind===3&&!n.collected&&n.motion==='embedded'&&Math.abs(n.x)<10&&Math.abs(n.z)<10&&w.density(n.x,n.y,n.z)<-1);
      if(!n)throw Error('No genuinely buried gold deposit for excavation check');window.__caveGold=n;
      w.carve({x:n.x,y:n.y+.1,z:n.z+2.1},1.92);
     }
     const n=window.__caveGold;eye=[n.x,n.y+.1,n.z+2.1];target=[n.x,n.y,n.z];
     if(shot==='gold-excavated')w.carve({x:n.x,y:n.y,z:n.z},1.15);
    }else{
     const net=w.caverns.networks[['lantern','chalk','violet'].indexOf(shot)];
     const at=[net.chamber,...net.nodes].find(c=>w.density(c.x,c.y+.15,c.z)>.6);
     if(!at)throw Error('No air at chamber fixture');eye=[at.x,at.y+.15,at.z];target=[at.x+1.7,at.y-.2,at.z-3];
    }
    if(w.density(...eye)<=0)throw Error('Render camera is inside solid rock');
    p.teleport(eye[0],eye[1]-p.eye,eye[2]);const d=new THREE.Vector3(...target).sub(new THREE.Vector3(...eye));p.yaw=Math.atan2(-d.x,-d.z);p.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));p.resetView();
    window.__caveCaptureTime=Math.max(performance.now()+10000,(window.__caveCaptureTime||0)+1000);const now=window.__caveCaptureTime;
    v.caveLighting?.update(w,{x:eye[0],y:eye[1],z:eye[2]},now);
    v.caveMinerals?.update(w,{x:eye[0],y:eye[1],z:eye[2]},v.caveOreNodes||[],v.caveOreRevision||0,now);
    // WebGLObjects uses info.render.frame as its geometry-upload epoch. Freezing
    // that epoch during warm-up can cache a shadow from the PREVIOUS excavation.
    for(let i=0;i<2;i++){v.renderer.info.reset();v.render(g,0,12);}
    v.renderer.info.reset();v.render(g,0,12);const gl=v.renderer.getContext();gl.finish();
    const bytes=new Uint8Array(w.field.buffer,w.field.byteOffset,w.field.byteLength),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
    const n=window.__caveGold;
    return {shot,eye,target,fieldSHA256:hash,terrainRevision:w.revision,glError:gl.getError(),contextLost:gl.isContextLost(),lockAttempts:window.__lockAttempts,locked:!!document.pointerLockElement,render:{...v.renderer.info.render},memory:{...v.renderer.info.memory},failedPrograms:v.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).map(p=>p.diagnostics),gold:n?{id:n.id,kind:n.kind,motion:n.motion,collected:n.collected,x:n.x,y:n.y,z:n.z}:null};
   },shot);
   report.variants[name].shots.push(record);
   await page.screenshot({path:path.join(out,`${name}-${shot}.png`)});
   assert.equal(record.glError,0);assert.equal(record.contextLost,false);assert.equal(record.lockAttempts,0);assert.equal(record.locked,false);assert.equal(record.failedPrograms.length,0);
   if(shot==='gold-excavated')assert.notEqual(record.gold.motion,'embedded');
   console.log(`PASS actual game WebGL: ${name} ${shot}`);
  }
  if(name==='R4'){
   for(const mode of ['no-shadow-map','no-density','no-mineral','no-clearcoat']){
    const rec=await page.evaluate(mode=>{
     const g=window.__buttloads,v=g.view;
     if(!window.__caveDiagOriginal)window.__caveDiagOriginal={headlamp:v.renderHeadlamp,density:v.caveLighting?.update,mineral:v.caveMinerals?.update,coat:v.terrainMaterial.clearcoat};
     const old=window.__caveDiagOriginal;v.renderHeadlamp=old.headlamp;
     if(v.caveLighting){v.caveLighting.update=old.density;v.caveLighting.strength.value=1;}
     if(v.caveMinerals){v.caveMinerals.update=old.mineral;v.caveMinerals.strength.value=1;}
     v.terrainMaterial.clearcoat=old.coat;v.terrainMaterial.needsUpdate=true;
     if(mode==='no-shadow-map')v.renderHeadlamp=function(...a){old.headlamp.apply(this,a);this.headlamp.castShadow=false;};
     if(mode==='no-density'&&v.caveLighting)v.caveLighting.update=()=>{v.caveLighting.strength.value=0;};
     if(mode==='no-mineral'&&v.caveMinerals)v.caveMinerals.update=()=>{v.caveMinerals.strength.value=0;};
     if(mode==='no-clearcoat'){v.terrainMaterial.clearcoat=0;v.terrainMaterial.needsUpdate=true;}
     for(let i=0;i<2;i++){v.renderer.info.reset();v.render(g,0,12);}const gl=v.renderer.getContext();gl.finish();
     return {mode,glError:gl.getError(),note:'Nonshipping feature-isolation diagnostic; same last excavation/camera'};
    },mode);
    report.variants[name].diagnostics.push(rec);await page.screenshot({path:path.join(out,`diagnostic-${mode}.png`)});assert.equal(rec.glError,0);
   }
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 if(report.variants.MAIN)for(let i=0;i<report.variants.R4.shots.length;i++){
  const a=report.variants.R4.shots[i],b=report.variants.MAIN.shots[i];assert.deepEqual(a.eye,b.eye);assert.deepEqual(a.target,b.target);assert.equal(a.fieldSHA256,b.fieldSHA256,'before/after terrain must match');
 }
 report.pass=true;console.log('PASS offline full-game WebGL, shader programs, excavation and exact-camera/field comparisons');
}catch(e){report.pass=false;report.errors.push(String(e?.stack||e));console.error(e);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();server.close();}
