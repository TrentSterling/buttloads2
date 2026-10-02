// Actual Game/Crew prediction and HUD, with inert rendering and transport.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {nodeGame} from './node-game.mjs';

const baseline=process.argv.includes('--baseline');
const h=await nodeGame(baseline?{multiplayerSource:fs.readFileSync(new URL('out/frame-cost-before/multiplayer.js',import.meta.url),'utf8')}:{});
const g=h.game,n=g.net,B=B2,failures=[];
export let guestContactChecks=0;
const test=async(label,fn)=>{
  try{await fn();guestContactChecks++;console.log('PASS guest contact: '+label);}
  catch(error){failures.push(error);console.error('FAIL guest contact: '+label+' / '+error.message);}
};
try{
  g.play();n.role='guest';n.ready=true;n.serverPose=null;
  await test('real guest rock hits carry geology into the visible contact label',()=>{
    g.clearInput();g.player.teleport(0,.06,11.5);g.player.yaw=0;g.player.pitch=-.35;
    for(const tool of ['cutter','scoop','lance']){
      g.expedition.state.tool=tool;n.updateGuest(0);
      const hit=g.cutter.contact;assert.ok(hit,'fresh-claim rim not found for '+tool);
      assert.equal(hit.protected,false);assert.equal(hit.layer,B.geology(hit.y).name);
      assert.equal(h.elements.get('contact').textContent,hit.layer);
      assert.equal(g.cutter.edited,false);assert.ok(hit.normal.every(Number.isFinite));
    }
    // Check the hit depth rather than the capsule's surface stratum. Only the
    // ray result is supplied here; production prediction, geology and HUD run.
    const trace=g.cutter.trace;
    try{
      for(const y of [-.5,-15,-32,-50,-65]){
        g.cutter.trace=()=>({x:0,y,z:6,distance:3});n.updateGuest(0);
        assert.equal(g.cutter.contact.layer,B.geology(y).name);
        assert.equal(h.elements.get('contact').textContent,B.geology(y).name);
      }
    }finally{g.cutter.trace=trace;}
  });
  await test('protected common ground cannot produce successful predicted cutting or load beats',()=>{
    g.clearInput();g.player.teleport(24,B.COMMON.height(24,11.5)+.08,11.5);g.player.yaw=0;g.player.pitch=-1.2;
    const before=g.world.field.slice();
    for(const tool of ['cutter','scoop','lance']){
      g.expedition.state.tool=tool;g.input.fire=true;g.mining.reset();const serial=g.mining.serial;
      n.updateGuest(1/60);
      assert.ok(g.cutter.contact,'common ground not hit for '+tool);
      assert.equal(g.cutter.contact.protected,true);
      assert.equal(g.cutter.edited,false,'protected ground predicts successful cutting');
      assert.equal(g.mining.serial,serial);assert.equal(g.mining.load,0);assert.equal(g.mining.beat,0);
      assert.equal(h.elements.get('contact').textContent,'Unowned ground / stay inside the claim markers');
    }
    assert.deepEqual(g.world.field,before);
  });
  await test('air misses, aiming and other weapons clear or suppress guest mechanical feedback',()=>{
    g.clearInput();g.player.teleport(0,.06,11.5);g.player.yaw=0;g.player.pitch=-.35;
    g.expedition.state.tool='cutter';g.input.fire=true;n.updateGuest(0);
    assert.ok(g.cutter.contact);assert.equal(g.cutter.edited,true);
    g.input.aim='bomb';n.updateGuest(0);
    assert.ok(g.cutter.contact);assert.equal(g.cutter.edited,false);
    g.input.aim=null;g.player.pitch=1.54;n.updateGuest(0);
    assert.equal(g.cutter.contact,null);assert.equal(g.cutter.edited,false);assert.equal(h.elements.get('contact').textContent,'');
    g.player.pitch=-.35;
    for(const tool of ['axe','sling','resonance','gravity']){
      g.expedition.state.tool=tool;n.updateGuest(0);
      assert.equal(g.cutter.contact,null);assert.equal(g.cutter.edited,false);
    }
  });
}finally{g.clearInput();n.role='offline';n.room=null;clearInterval(n.timer);h.close();}
if(failures.length)throw new AggregateError(failures,'Guest contact regressions');
console.log(`COMPLETE ${guestContactChecks} guest contact checks passed`);
