// Earned lower-mine continuation. No fixture terrain, free cash or direct teleports.
import assert from 'node:assert/strict';
export async function journeyFossil(harness,report){
 const g=harness.game,B=B2,dt=1/60;let phase='',started=0,ticks=0,lastReport=-1,lastLamp=-10;
 const key=code=>harness.handlers.get('keydown')({code,repeat:false,preventDefault(){}});
 const mark=name=>{phase=name;started=g.clock;const m={name,seconds:+g.clock.toFixed(1),cash:g.economy.state.cash,cargo:g.economy.count,depth:+g.economy.state.deepest.toFixed(1)};report.milestones.push(m);console.log(JSON.stringify(m));};
 const steer=(n,{cut=false,lift=false,walk=true}={})=>{const p=g.player,dx=n.x-p.x,dz=n.z-p.z;p.yaw=Math.atan2(-dx,-dz);p.pitch=B.clamp(Math.atan2(n.y-p.head.y,Math.hypot(dx,dz)),-1.54,1.54);g.input.keys.clear();if(walk&&Math.hypot(dx,dz)>.4)g.input.keys.add('KeyW');if(lift)g.input.keys.add('Space');g.input.fire=cut;};
 const tick=async()=>{g.update(dt);ticks++;const i=Math.floor(g.clock/30);if(i!==lastReport){lastReport=i;console.log(`t=${g.clock.toFixed(0)} ${phase} p=${g.player.x.toFixed(1)},${g.player.y.toFixed(1)},${g.player.z.toFixed(1)} plates=${g.fossil.state.plates} lamps=${g.gadgets.state.supplies.lights}`);}if(g.clock-started>180)throw Error('Fossil journey stalled: '+phase);if(ticks%600===0)await new Promise(r=>setTimeout(r,0));if(!g.running)g.setScreen(null);};
 const walk=async(x,z)=>{g.setScreen(null);while(Math.hypot(g.player.x-x,g.player.z-z)>.6){steer({x,y:1.55,z});await tick();}g.clearInput();};
 const reload=async()=>{g.clearInput();const field=g.world.field.slice(),save=B.Saves.snapshot(g,true);await g.install(B.Saves.validate(save));assert.deepEqual(g.world.field,field);g.setScreen(null);};
 report.outcome='running';mark('Lantern leviathan outer approach');g.setScreen(null);g.selectTool('lance');
 // Move beyond the ribs before lifting from a lower station. A diagonal ascent
 // would drive the pilot into the skeleton's underside, which cannot be drilled.
 const approachY=g.player.head.y;
 while(true){const n=g.fossil.body,target={x:n.x-2.5,y:approachY,z:n.z+3.4};if(Math.hypot(g.player.x-target.x,g.player.z-target.z)<.6)break;steer(target,{cut:true,lift:g.player.head.y<approachY-.15});await tick();}
 mark('Lantern leviathan approach');
 while(true){const n=g.fossil.body,target={x:n.x-2.5,y:n.y+1.6,z:n.z+3.4};if(Math.hypot(g.player.x-target.x,g.player.head.y-target.y,g.player.z-target.z)<.8)break;steer(target,{cut:true,lift:g.player.head.y<target.y-.2});await tick();}
 for(let id=0;id<3;id++){
  mark('Fossil study / '+B.FOSSIL_ART.names[id]);
  while(!g.fossil.state.plates.includes(id)){
   const f=g.fossil,p=f.point(id),stand={x:p.x,y:f.body.y+1.6,z:f.body.z+3.4},away=Math.hypot(g.player.x-stand.x,g.player.z-stand.z);
   if(away>.65)steer(stand,{cut:true,lift:g.player.head.y<stand.y-.2});
   else if(!f.exposed(id)){const cover=f.cover(id);steer(cover,{cut:true,walk:false,lift:g.player.head.y<f.body.y+1.4});}
   else {
    steer(p,{cut:false,walk:false,lift:g.player.head.y<f.body.y+1.2});
    if(!f.illuminated(id,g.gadgets)&&g.clock-lastLamp>3){if(!g.gadgets.state.supplies.lights)throw Error('Fossil pilot used its work lights without illuminating the marking');const before=g.gadgets.state.supplies.lights;key('KeyV');if(g.gadgets.state.supplies.lights<before)lastLamp=g.clock;}
    key('KeyF');
   }
   await tick();
  }
 }
 mark('Fossil ember recovery');
 while(!g.fossil.state.recovered){const p=g.fossil.point(2);steer(p,{cut:false,lift:g.player.head.y<p.y-.15,walk:Math.hypot(g.player.x-p.x,g.player.z-p.z)>2.2});if(g.interaction()?.kind==='fossil'&&!g.interaction().locked){g.clearInput();g.use();}await tick();}
 key('KeyB');assert.ok(g.expedition.state.anchor?.y<-200);await reload();assert.ok(g.fossil.state.recovered);assert.deepEqual(g.fossil.state.plates,[0,1,2]);
 mark('Fossil ember and support reloaded');g.recall();await walk(7,29.5);await walk(-6,48.8);
 const nell=B.TOWN.people.find(p=>p.id==='nell');while(g.interaction()?.id!=='nell'){steer({x:nell.x,y:1.55,z:nell.z});await tick();}g.clearInput();g.use();assert.equal(g.screen,'town');
 const service=harness.elements.get('town-services').children.find(b=>b.children[0]?.textContent==='Living lantern lenses');assert.ok(service&&!service.disabled);const cash=g.economy.state.cash;service.onclick();assert.equal(g.economy.state.cash,cash-350);assert.ok(g.fossil.state.lenses);
 await reload();assert.ok(g.town.state.met.includes('nell'));assert.equal(g.gadgets.lampProfile.reach,24);assert.equal(g.gadgets.lampProfile.deter,5);mark('Nell met and living lenses purchased');
 key('KeyG');assert.ok(g.player.y<-200);g.view.render(g,0,g.clock);assert.ok(g.view.workLights.some(l=>l.intensity===3.4&&l.distance===24));B.Saves.validate(B.Saves.snapshot(g));
 mark('Living lamps verified at the fossil');report.outcome='complete';console.log('COMPLETE lantern journey: excavated and illuminated all fossil sections, scanned their markings, recovered and reloaded the ember, met Nell, bought/reloaded living lenses and returned to upgraded placed lamps.');
}
