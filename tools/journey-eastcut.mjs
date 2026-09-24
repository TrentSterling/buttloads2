// Continuation of the earned campaign. Uses production input and town services.
import assert from 'node:assert/strict';

export async function journeyEastcut(harness, report) {
  const g=harness.game,B=B2,dt=1/60;
  let ticks=0,phase='',started=0,lastReport=-1;
  const key=code=>harness.handlers.get('keydown')({code,repeat:false,preventDefault(){}});
  const mark=name=>{
    phase=name;started=g.clock;
    const m={name,seconds:+g.clock.toFixed(1),cash:g.economy.state.cash,cargo:g.economy.count,depth:+g.economy.state.deepest.toFixed(1)};
    report.milestones.push(m);console.log(JSON.stringify(m));
  };
  const steer=(target,{cut=false,lift=false,walk=true}={})=>{
    const p=g.player,dx=target.x-p.x,dz=target.z-p.z;
    p.yaw=Math.atan2(-dx,-dz);p.pitch=B.clamp(Math.atan2(target.y-p.head.y,Math.hypot(dx,dz)),-1.54,1.54);
    g.input.keys.clear();if(walk&&Math.hypot(dx,dz)>.4)g.input.keys.add('KeyW');if(lift)g.input.keys.add('Space');g.input.fire=cut;
  };
  const tick=async()=>{
    g.update(dt);ticks++;
    const interval=Math.floor(g.clock/30);if(interval!==lastReport){lastReport=interval;console.log(`t=${g.clock.toFixed(0)} ${phase} p=${g.player.x.toFixed(1)},${g.player.y.toFixed(1)},${g.player.z.toFixed(1)} cargo=${g.economy.count}`);}
    if(g.clock-started>180)throw Error(`Eastcut stalled: ${phase}; freight=${g.freight.status()}`);
    if(ticks%600===0)await new Promise(r=>setTimeout(r,0));
  };
  const walk=async(x,z)=>{
    g.setScreen(null);
    while(Math.hypot(g.player.x-x,g.player.z-z)>.55){steer({x,y:1.55,z});await tick();}
    g.clearInput();
  };
  const talk=async id=>{
    const n=B.TOWN.people.find(n=>n.id===id);
    while(g.interaction()?.id!==id){steer({x:n.x,y:1.55,z:n.z});await tick();}
    g.clearInput();g.use();assert.equal(g.screen,'town');assert.equal(g.townUI.person.id,id);
  };
  const service=async title=>{
    const button=harness.elements.get('town-services').children.find(b=>b.children[0]?.textContent===title);
    assert.ok(button&&!button.disabled,'Unavailable town service: '+title);await button.onclick();
  };
  const reload=async()=>{
    g.clearInput();const field=g.world.field.slice(),east=g.world.parcelField.slice(),snapshot=B.Saves.snapshot(g,true);
    await g.install(B.Saves.validate(snapshot));assert.deepEqual(g.world.field,field);assert.deepEqual(g.world.parcelField,east);g.setScreen(null);
  };

  report.outcome='running';g.recall();mark('Eastcut deed approach');
  await walk(7,29.5);await walk(-9,29.5);await walk(-9,35);await talk('mara');
  await service('Sell your haul');
  const cash=g.economy.state.cash,field=g.world.field.slice(),prefix=g.deposits.nodes.length;
  await service('Eastcut deed');assert.equal(g.world.parcelVersion,1);assert.equal(g.economy.state.cash,cash-B.EASTCUT.price);assert.deepEqual(g.world.field,field);assert.equal(g.deposits.nodes.length,prefix+348);
  mark('Eastcut deed earned and purchased');
  await service('Six work lights');
  await walk(-9,29.5);await walk(19,29.5);await walk(19,35.8);await talk('otis');
  if(!g.freight.state.owned)await service('Freight rig');
  while(g.economy.state.gear.drill<B.GEAR.drill.costs.length && g.economy.state.cash>=B.GEAR.drill.costs[g.economy.state.gear.drill])await service(B.GEAR.drill.name);
  mark('Eastcut machinery purchased');
  await walk(19,29.5);await walk(19,4);await walk(40,4);await walk(40,-8);
  assert.equal(B.Town.region(g.player,g.world),'Eastcut / Claim 03');
  mark('Eastcut first mineral');g.selectTool('lance');
  let ore;
  while(!g.deposits.nodes.slice(prefix).some(n=>n.collected)){
    if(!ore||ore.collected)ore=g.deposits.nodes.slice(prefix).filter(n=>!n.collected&&n.y>-12).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.head.y,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.y-g.player.head.y,b.z-g.player.z))[0];
    steer(ore,{cut:true,lift:g.player.head.y<ore.y-.2});await tick();
  }
  mark('Eastcut cave descent');
  const room=g.world.parcelTerrain.rooms[0];
  while(Math.hypot(g.player.x-room.x,g.player.head.y-room.y,g.player.z-room.z)>.9){steer(room,{cut:true,lift:g.player.head.y<room.y-.2});await tick();}
  g.clearInput();steer({x:g.player.x,y:g.player.head.y-2,z:g.player.z-1},{walk:false});
  const lights=g.gadgets.state.supplies.lights;key('KeyV');assert.equal(g.gadgets.state.supplies.lights,lights-1);
  key('KeyB');assert.ok(g.expedition.state.anchor?.x>14);key('KeyM');assert.match(g.survey.render(18,g).map,/EASTCUT/);g.setScreen(null);
  await reload();assert.ok(g.gadgets.nodes.some(n=>n.type==='lamp'&&n.x>14));assert.ok(g.expedition.state.anchor?.x>14);
  mark('Eastcut cave, lamp and anchor reloaded');
  let placed=false;
  while(!placed){
    steer({x:room.x,y:Math.min(room.y-3,g.player.head.y-2),z:room.z-1},{cut:true,walk:false,lift:g.player.head.y<room.y-.4});
    const pose={pitch:g.player.pitch,yaw:g.player.yaw};let candidate;
    for(const pitch of [-.55,-.85,-1.2]){for(let i=0;i<8;i++){g.player.pitch=pitch;g.player.yaw=i*Math.PI/4;const p=g.freight.placement(g.player);if(!p.reason){candidate=p;break;}}if(candidate)break;}
    if(candidate){g.input.fire=false;key('KeyT');harness.handlers.get('keyup')({code:'KeyT',preventDefault(){}});assert.ok(g.freight.state.dock);placed=true;}
    else Object.assign(g.player,pose);
    await tick();
  }
  mark('Eastcut freight loading');
  while(g.interaction()?.kind!=='freight'){
    const d=g.freight.state.dock;steer({x:d.x,y:d.y+1.6,z:d.z+2},{cut:true,lift:g.player.head.y<d.y+1.3});await tick();
  }
  g.clearInput();g.use();harness.elements.get('freight-send').onclick();const sent=g.freight.loadCount;assert.ok(sent>0);g.setScreen(null);
  mark('Eastcut shaft excavation');let saved=false;
  while(!g.freight.stockCount){
    if(!saved&&g.freight.state.travel>1){const travel=g.freight.state.travel;await reload();assert.equal(g.freight.state.travel,travel);assert.equal(g.freight.loadCount,sent);saved=true;mark('Eastcut shipment reloaded');}
    if(g.freight.obstruction)steer(g.freight.obstruction,{cut:true,lift:g.player.head.y<g.freight.obstruction.y-1});
    else if(g.freight.blockedBy==='Stand clear of the cage'){const d=g.freight.state.dock;steer({x:d.x+2,y:g.player.head.y,z:d.z},{cut:true});}
    else g.clearInput();
    await tick();
  }
  assert.ok(saved);assert.equal(g.freight.stockCount,sent);assert.ok(g.freight.cage.x>46);
  mark('Eastcut freight delivered');g.recall();await walk(7,29.5);await walk(-9,29.5);await walk(-9,35);await talk('mara');
  const before=g.economy.state.cash,value=g.economy.saleValue;await service('Sell your haul');assert.ok(g.economy.state.cash>=before+value);assert.equal(g.freight.stockCount,0);assert.equal(g.economy.saleCount,0);
  g.setScreen(null);key('KeyG');assert.ok(g.player.x>14&&g.player.y<-5);await reload();
  mark('Eastcut haul sold and return anchor used');B.Saves.validate(B.Saves.snapshot(g));report.outcome='complete';
  console.log('COMPLETE Eastcut journey: earned deed, bought town equipment, mined added ore, reached a natural cave, saved lamps and anchor, shipped real ore through a reloaded route, sold once and returned below.');
}
