// Geometry/contact regressions for surface art. Inert renderer, no browser/input.
import assert from 'node:assert/strict';import fs from 'node:fs';import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,B=B2,T=THREE;export let surfaceArtChecks=0;const test=async(name,fn)=>{await fn();surfaceArtChecks++;console.log('PASS surface art: '+name);};
try{
 await test('path faces match ground at scattered interior points and every reservoir bend is covered',()=>{
  g.view.scene.updateMatrixWorld(true);const mesh=g.view.commonPath,ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),pos=mesh.geometry.attributes.position;assert.ok(mesh);
  for(let i=0;i<pos.count;i+=Math.max(3,Math.floor(pos.count/400/3)*3)){const x=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,z=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3,y=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3;assert.ok(Math.abs(y-B.COMMON.height(x,z)-.034)<1e-5,'path sinks below shared ground');}
  for(const [x,z]of B.COMMON.paths.at(-1).points.slice(1,-1))for(let j=0;j<12;j++){const a=j/12*6.283,px=x+Math.cos(a)*.65,pz=z+Math.sin(a)*.65;ray.set(new T.Vector3(px,30,pz),down);const hit=ray.intersectObject(mesh)[0];assert.ok(hit,'missing path join');assert.ok(Math.abs(hit.point.y-B.COMMON.height(px,pz)-.034)<1e-5);}
 });
 await test('new tree construction preserves original planted coordinates and trunk obstacles',()=>{
  const original=JSON.parse(fs.readFileSync(new URL('fixtures/surface-layout-2273.json',import.meta.url),'utf8')),trees=g.view.commonTrees,obstacles=g.view.obstacles;
  assert.deepEqual(trees,original.trees);for(const t of trees)if(t.x>B.SURFACE.minX+.6&&t.x<B.SURFACE.maxX-.6&&t.z>B.SURFACE.minZ+.6&&t.z<B.SURFACE.maxZ-.6)assert.ok(obstacles.some(b=>b[0]===t.x-.27&&b[2]===t.z-.27));
 });
 await test('decorative ridges remain outside traversable land and all surface geometry is finite',()=>{
  for(const [x0,z0,x1,z1]of g.view.ridgeBounds)assert.ok(x1<B.SURFACE.minX||x0>B.SURFACE.maxX||z1<B.SURFACE.minZ||z0>B.SURFACE.maxZ,'ridge enters walking area');
  for(const root of [g.view.commonScene,g.view.ridgeline,g.view.townScene])root.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
 });
 await test('pitched roofs stop lift, support traversal and use their slope rather than a flat invisible box',()=>{
  const p=g.player;
  for(const b of B.TOWN.buildings){const box=p.obstacles.find(o=>o.roof?.x===b.x),r=box.roof;for(const t of [-.8,-.4,0,.4,.8]){const x=b.x+r.reach*t,y=p.obstacleTop(box,x);assert.equal(p.blocked(x,y+.002,b.z),false);assert.equal(p.blocked(x,y-.002,b.z),true);}
   p.teleport(b.x,1.12,b.z-1);for(let i=0;i<240;i++)p.step(1/120,new Set(['Space']),6);assert.ok(p.y+p.height<=r.eave+r.rise+.03,'lift passes through attic');
   const x=b.x-r.reach*.6;p.teleport(x,p.obstacleTop(box,x)+.025,b.z);p.yaw=0;for(let i=0;i<90;i++)p.step(1/120,new Set(['KeyD']),6);assert.ok(p.x>x+2);assert.ok(!p.blocked(p.x,p.y,p.z));assert.ok(Math.abs(p.y-p.obstacleTop(box,p.x))<.04);
  }
 });
 await test('grounded remote boots resolve onto actual pitched roof geometry',()=>{
  g.view.scene.updateMatrixWorld(true);const m=g.view.makeMiner('roof-grounding',1,'Test'),b=B.TOWN.buildings[0],box=g.player.obstacles.find(o=>o.roof?.x===b.x),ray=new T.Raycaster(new T.Vector3(b.x+2,15,b.z),new T.Vector3(0,-1,0));
  const hit=ray.intersectObjects(g.view.townRoofs)[0];assert.ok(hit);const target={x:b.x+2,y:g.player.obstacleTop(box,b.x+2),z:b.z,grounded:true};assert.ok(Math.abs(g.view.minerFloor(m,target,g.world)-(hit.point.y-.012))<1e-6);g.view.removeMiner('roof-grounding');
 });
}finally{h.close();}
console.log(`COMPLETE ${surfaceArtChecks} surface art checks passed`);
