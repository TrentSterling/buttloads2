// Render verification through page evaluation only. No input events or pointer lock.
import {launch,until,sleep} from './cdp.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const deck=process.argv[2]||'surface';if(!['miner-glove','miner-carry','miner-garment','miner-motion','crew-assets','crew-equipment','attachment-art','cutter-art','crew-batching','chalk-art','ore-batching','corner-slide','hud-writes','sign-merge','fungal-art','contact-scan','creature-art','growth-contact','growth-pass','prop-merge','foreman-merge','mine-asset','freight-merge','surface','grounds','crew-compat','guest-motion','authority','latency','landscape','world-art','crew-arrival','mouse-entry','depot-art','foliage','stone','fracture','escarpment','meadow','runtime','merge','step-camera','reservoir','foliage-batching','perimeter','ground-cover','buried-merge','cave-form'].includes(deck))throw Error('Unknown receipt deck');
const dataDeck=['miner-glove','miner-carry','miner-garment','miner-motion','crew-assets','crew-equipment','attachment-art','cutter-art','crew-batching','chalk-art','ore-batching','corner-slide','hud-writes','sign-merge','fungal-art','contact-scan','creature-art','growth-contact','growth-pass','prop-merge','foreman-merge','mine-asset','freight-merge','crew-compat','guest-motion','authority','latency','mouse-entry','depot-art','foliage','stone','fracture','escarpment','meadow','runtime','merge','step-camera','reservoir','foliage-batching','perimeter','ground-cover','buried-merge','cave-form'].includes(deck);
const api=deck==='miner-glove'?'__minerGloveReview':deck==='miner-carry'?'__minerCarryReview':deck==='miner-garment'?'__minerGarmentReview':deck==='miner-motion'?'__minerMotionReview':deck==='crew-assets'?'__crewAssetsReview':deck==='crew-equipment'?'__crewEquipmentReview':deck==='attachment-art'?'__attachmentArtReview':deck==='cutter-art'?'__cutterArtReview':deck==='crew-batching'?'__crewBatchingReview':deck==='chalk-art'?'__chalkArtReview':deck==='ore-batching'?'__oreBatchingReview':deck==='corner-slide'?'__cornerSlideReview':deck==='hud-writes'?'__hudWritesReview':deck==='sign-merge'?'__signMergeReview':deck==='fungal-art'?'__fungalArtReview':deck==='contact-scan'?'__contactScanReview':deck==='creature-art'?'__creatureArtReview':deck==='growth-contact'?'__growthContactReview':deck==='growth-pass'?'__growthPassReview':deck==='prop-merge'?'__propMergeReview':deck==='foreman-merge'?'__foremanMergeReview':deck==='mine-asset'?'__mineAssetReview':deck==='freight-merge'?'__freightMergeReview':deck==='cave-form'?'__caveFormReview':deck==='buried-merge'?'__buriedMergeReview':deck==='ground-cover'?'__groundCoverReview':deck==='perimeter'?'__perimeterReview':deck==='foliage-batching'?'__foliageBatchingReview':deck==='reservoir'?'__reservoirReview':deck==='step-camera'?'__stepCameraReview':deck==='merge'?'__mergeReview':deck==='runtime'?'__runtimeReview':deck==='meadow'?'__meadowReview':deck==='escarpment'?'__escarpmentReview':deck==='fracture'?'__fractureReview':deck==='stone'?'__stoneReview':deck==='foliage'?'__foliageReview':deck==='depot-art'?'__depotArtReview':deck==='mouse-entry'?'__mouseEntryReview':deck==='crew-arrival'?'__crewArrivalReview':deck==='world-art'?'__worldArtReview':deck==='landscape'?'__landscapeReview':deck==='latency'?'__latencyReview':deck==='authority'?'__authorityReview':deck==='guest-motion'?'__guestMotionReview':deck==='crew-compat'?'__crewCompatReview':'__surfaceReview',slideCount=deck==='miner-glove'?6:deck==='miner-carry'?6:deck==='miner-garment'?9:deck==='miner-motion'?6:deck==='crew-assets'?5:deck==='crew-equipment'?18:deck==='attachment-art'?20:deck==='cutter-art'?20:deck==='crew-batching'?16:deck==='chalk-art'?15:deck==='ore-batching'?12:deck==='corner-slide'?7:deck==='hud-writes'?4:deck==='sign-merge'?16:deck==='fungal-art'?14:deck==='contact-scan'?6:deck==='creature-art'?23:deck==='growth-contact'?16:deck==='growth-pass'?18:deck==='prop-merge'?14:deck==='foreman-merge'?12:deck==='mine-asset'?22:deck==='freight-merge'?11:deck==='cave-form'?17:deck==='buried-merge'?17:deck==='ground-cover'?13:['foliage-batching','perimeter'].includes(deck)?11:deck==='step-camera'?5:deck==='merge'?8:deck==='stone'?11:['foliage','depot-art','fracture','escarpment','meadow','runtime','merge','step-camera','reservoir'].includes(deck)?9:['crew-arrival','mouse-entry'].includes(deck)?5:deck==='world-art'?10:deck==='landscape'?17:deck==='guest-motion'?5:['crew-compat','authority','latency'].includes(deck)?6:13;
const out=new URL('./out/',import.meta.url),p=await launch({port:9498,width:1440,height:1000,gpu:true});
try{
 await p.goto(new URL('current-review.html',out).href);await until(()=>p.eval('!!document.querySelector("iframe")'));await sleep(250);await p.shot(new URL('current-review.png',out).pathname.replace(/^\//,''));
 await p.goto(new URL(deck+'-review.html',out).href);await until(()=>p.eval('!!window.'+api));
 const surface={slides:[],errors:[],pointerLock:false};
 const count=await p.eval(api+'.slides.length');
 for(let i=0;i<count;i++){
  await p.eval(api+'.show('+i+');true');
  await until(()=>p.eval('[...document.images].every(img=>img.complete&&img.naturalWidth>0)'));
  if(['miner-glove','miner-carry','miner-garment','miner-motion'].includes(deck)){
   const samples=await p.eval(api+'.slides['+i+'].frames?.length||0');
   for(let n=0;n<samples;n++){await p.eval(api+'.frame('+n+');true');await until(()=>p.eval('[...document.images].every(img=>img.complete&&img.naturalWidth>0)'));}
   surface.decodedSamplePairs=(surface.decodedSamplePairs||0)+samples;
   if(samples)await p.eval(api+'.frame(0);true');
   await until(()=>p.eval('[...document.images].every(img=>img.complete&&img.naturalWidth>0)'));
  }
  surface.slides.push(await p.eval('({title:document.getElementById("title").textContent,images:document.images.length})'));
  if(dataDeck||['landscape','world-art','crew-arrival'].includes(deck)){
   const layout=await p.eval('({footerBottom:document.querySelector("footer").getBoundingClientRect().bottom,viewport:innerHeight,horizontalOverflow:document.documentElement.scrollWidth>innerWidth})');
   if(layout.footerBottom>layout.viewport+.5||layout.horizontalOverflow)throw Error('Slide navigation clipped');
   await p.shot(new URL(deck+'-slide-'+(i+1)+'.png',out).pathname.replace(/^\//,''));
  }
 }
 await p.eval(api+'.show(1);'+(dataDeck?'':api+'.split(0);')+'true');await until(()=>p.eval('[...document.images].every(img=>img.complete&&img.naturalWidth>0)'));
 await p.shot(new URL(deck+'-review.png',out).pathname.replace(/^\//,''));
 surface.pointerLock=await p.eval('!!document.pointerLockElement');surface.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));
 if(surface.pointerLock||surface.errors.length||count!==slideCount||deck==='miner-motion'&&surface.decodedSamplePairs!==39||deck==='miner-garment'&&surface.decodedSamplePairs!==31||deck==='miner-carry'&&surface.decodedSamplePairs!==29||deck==='miner-glove'&&surface.decodedSamplePairs!==33)throw Error('Receipt rendering failed');
 fs.writeFileSync(new URL(deck+'-review-report.json',out),JSON.stringify(surface,null,2));
 console.log('COMPLETE '+deck+' review: '+count+' slides render, all images decode, zero errors and no pointer lock.');
 await p.goto(new URL('coop-controller-review.html',out).href);await until(()=>p.eval('document.querySelector("#command")?.width>1000'));await p.shot(new URL('coop-controller-review.png',out).pathname.replace(/^\//,''));
 await p.goto(new URL('movement-review.html',out).href);await until(()=>p.eval("!!document.querySelector('#details')?.textContent"));await p.shot(new URL('movement-review.png',out).pathname.replace(/^\//,''));
 await p.goto(pathToFileURL(new URL('../dist/index.html',import.meta.url).pathname.replace(/^\//,'')).href+'?offline&movement-current');await until(()=>p.eval('!!window.__buttloads?.ready'),{timeout:90000});
 const report=await p.eval(`(()=>{const g=__buttloads;g.setScreen(null);g.view.render=(()=>{const original=g.view.render;g._verifyRender=original;return ()=>{};})();g.update=()=>{};
  g.player.teleport(0,.06,11.5);g.player.yaw=Math.PI;g.player.pitch=-.05;g.player.step(1/120,new Set(['KeyD']),6);g.accumulator=1/240;
  const expected=(g.player.previous.x+g.player.x)/2;g.player.look(20,-10,1);g._verifyRender.call(g.view,g,1/240,5);
  const gl=g.view.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');return {version:document.querySelector('meta[name=application-version]').content,crewProtocol:B2.CREW_PROTOCOL,crewRoom:B2.CREW_ROOM,crewSaveKey:B2.CREW_SAVE_KEY,expectedCameraX:expected,cameraX:g.view.camera.position.x,yaw:g.player.yaw,cameraYaw:g.view.camera.rotation.y,pitch:g.player.pitch,cameraPitch:g.view.camera.rotation.x,pointerLock:!!document.pointerLockElement,hardware:gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)};})()`);
 if(Math.abs(report.cameraX-report.expectedCameraX)>1e-9||Math.abs(report.yaw-report.cameraYaw)>1e-9||Math.abs(report.pitch-report.cameraPitch)>1e-9||report.pointerLock)throw Error('Release camera verification failed');
 await p.shot(new URL('movement-build.png',out).pathname.replace(/^\//,''));
 report.errors=p.logs.filter(s=>/EXCEPTION|error:/i.test(s));if(report.errors.length)throw Error(report.errors.join('\n'));
 report.buildSha256=createHash('sha256').update(fs.readFileSync(new URL('../dist/index.html',import.meta.url))).digest('hex');
 fs.writeFileSync(new URL('movement-build-report.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{p.kill();}
