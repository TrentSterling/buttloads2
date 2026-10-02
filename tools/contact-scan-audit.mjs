import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
import {nativeRoutes,contactReplay} from './contact-scan-fixtures.mjs';
const out=new URL('out/',import.meta.url),before=fs.readFileSync(new URL('contact-scan-before/player.js',out),'utf8'),after=fs.readFileSync(new URL('../src/player.js',import.meta.url),'utf8'),sha=v=>createHash('sha256').update(v).digest('hex');
const h=await nodeGame();
try{
 const world=h.game.world,boxes=h.game.player.obstacles,fieldSha256=sha(world.field),rows=[];
 for(const definition of nativeRoutes){
  const route={...definition,at:definition.at?.slice()};
  if(route.surface)route.at[1]=B2.COMMON.height(route.at[0],route.at[2])+.2;
  if(route.room){const r=route.room==='upper'?world.caverns.networks[0].chamber:world.deepTerrain.rooms[0],floor=world.ray(r,{x:0,y:-1,z:0},7);assert.ok(floor);route.at=[r.x,floor.y+.2,r.z];}
  const b=contactReplay(before,world,boxes,route),a=contactReplay(after,world,boxes,route);
  assert.equal(b.initiallyBlocked,false,route.name+' starts inside contact');assert.equal(a.initiallyBlocked,false);
  assert.equal(a.traceSha256,b.traceSha256,route.name+' changed capsule, camera, velocity, support or aim');assert.equal(a.counts.density,b.counts.density);assert.equal(a.counts.queries,b.counts.queries);
  rows.push({name:route.name,before:b,after:a});console.log(JSON.stringify({route:route.name,ticks:a.ticks,before:b.counts,after:a.counts,traceExact:true}));
 }
 assert.equal(sha(world.field),fieldSha256);
 const report={date:new Date().toISOString(),beforeVersion:'2.42.0',sourceSha256:{before:sha(before),after:sha(after)},obstacles:boxes.length,fieldSha256,rows,scope:'Static native world and current production obstacle list. Direct held-key/yaw replay through actual Player code; no DOM, browser, physical input or GPU timing. Exact traces compare capsule, velocity, support, both interpolation endpoints, offsets, lift and camera/aim.'};
 fs.writeFileSync(new URL('contact-scan-report.json',out),JSON.stringify(report,null,2));console.log('COMPLETE eight native contact traces conserved.');
}finally{h.close();}
