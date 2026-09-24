import assert from 'node:assert/strict';
import { nodeGame } from './node-game.mjs';
const h = await nodeGame(), g = h.game, B = B2;
export let crawlerChecks = 0;
const test = async (name, fn) => { await fn(); crawlerChecks++; console.log('PASS crawlers: ' + name); };
const frames = (s, fn, hz = 60) => { for (let i = 0; i < s * hz; i++) fn(1 / hz); };
const aim = (p, n) => { const dx=n.x-p.x, dy=n.y-p.head.y, dz=n.z-p.z; p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(dy,Math.hypot(dx,dz)); };
function setup() {
  const world = new B.World(260923, 1, 1); world.deepOpen = true;
  for (let z=0;z<world.nz;z++) for(let y=0;y<world.ny;y++) { const at=world.index(0,y,z); world.field.fill(B.clamp(world.bottom+y*.5+96,-2,2),at,at+world.nx); }
  const state=B.freshState(); state.deepest=100; state.expedition.supplies={bombs:3,lights:6}; state.expedition.deep={open:true};
  const combat=new B.Combat(world,state), c=new B.Crawlers(world,state,combat), n=c.nodes[0], player=new B.Player(world);
  Object.assign(n,{x:0,y:-95.49,z:0,phase:'idle'}); player.teleport(0,-95.98,4);aim(player,n);
  return {world,state,combat,c,n,player};
}
try {
  await test('fresh lower creatures are gated, supported after settling and compatible with untouched saves', () => {
    assert.equal(g.crawlers.nodes.length,3);assert.deepEqual(g.crawlers.targets(),[]);assert.deepEqual(g.crawlers.markers(),[]);
    assert.equal(g.crawlers.buy(),false);const field=g.world.field.slice();frames(3,dt=>g.crawlers.update(dt,g.player));
    for(const n of g.crawlers.nodes) {assert.equal(n.hp,110);assert.equal(n.known,false);assert.ok(!g.crawlers.terrain(n));assert.ok(g.crawlers.supported(n));}
    assert.deepEqual(g.world.field,field);B.Saves.validate(B.Saves.snapshot(g));
  });
  await test('front shell resists drill, lance breaks it faster and the exposed rear takes direct damage', () => {
    const q=setup(),front={x:0,y:0,z:-1};q.c.hit(q.n,20,'cutter',front);assert.equal(q.n.hp,110);assert.equal(q.n.shell,82);
    q.c.hit(q.n,20,'lance',front);assert.equal(q.n.shell,34);q.c.hit(q.n,20,'lance',front);assert.equal(q.n.shell,0);assert.equal(q.n.phase,'stunned');
    q.c.hit(q.n,20,'cutter',front);assert.equal(q.n.hp,90);
    const rear=setup();rear.c.hit(rear.n,20,'axe',{x:0,y:0,z:1});assert.equal(rear.n.hp,85);assert.equal(rear.n.shell,90);
    rear.world.density=()=>-2;assert.equal(rear.c.hit(rear.n,500,'blast'),false);
  });
  await test('shared production lance targeting breaks armor without excavating behind the creature', () => {
    const q=setup(),cutter=new B.Cutter(q.world),actions=new B.ToolActions(q.world,cutter,q.combat);q.state.expedition.tool='lance';
    const field=q.world.field.slice();frames(1.1,dt=>actions.update(dt,q.player,q.state,true));assert.equal(q.n.shell,0);assert.ok(q.n.hp<110);assert.equal(actions.target.node,q.n);assert.deepEqual(q.world.field,field);
  });
  await test('claw windup commits its direction, deals one hit and can be dodged sideways or upward', () => {
    const run=(dodge)=>{const q=setup();q.player.z=2.9;q.c.update(1/60,q.player);assert.equal(q.n.phase,'windup');const dir={...q.n.direction};
      if(dodge==='side')q.player.x=3; if(dodge==='lift')q.player.y+=2;
      frames(1.4,dt=>q.c.update(dt,q.player));assert.deepEqual(q.n.direction,dir);return q;};
    assert.equal(run(null).combat.state.health,76);assert.equal(run('side').combat.state.health,100);assert.equal(run('lift').combat.state.health,100);
  });
  await test('ground navigation finds a supported detour and never clips a slab or walks across an excavated gap', () => {
    const q=setup(),density=q.world.density.bind(q.world);q.world.density=(x,y,z)=>Math.abs(x)<.3&&Math.abs(z)<2.3&&y>-96&&y<-92?-2:density(x,y,z);
    Object.assign(q.n,{x:-3,z:0});const target={x:3,y:q.n.y,z:0},route=q.c.path(q.n,target);assert.ok(route.length>3);assert.ok(route.some(p=>Math.abs(p.z)>3));
    let prior=q.n;for(const p of route){assert.ok(q.c.segment(prior,p,q.n.id,false));assert.ok(q.c.supported(p));prior=p;}
    frames(9,dt=>{q.c.time+=dt;q.c.navigate(q.n,target,dt);assert.ok(!q.c.terrain(q.n));});assert.ok(q.n.x>1);
    q.world.density=(x,y,z)=>x>0&&x<5&&y>-101?2:density(x,y,z);const from={x:-1,y:-95.49,z:0};assert.equal(q.c.groundStep(from,3,0,q.n.id,false),null);
  });
  await test('undermining causes a swept fall and landing damage; dead shells continue obeying gravity', () => {
    const q=setup();q.n.known=true;q.player.teleport(8,-95.98,8);const start=q.n.y;q.world.carve({x:0,y:-98.5,z:0},4.5);
    frames(2,dt=>q.c.update(dt,q.player));assert.ok(q.n.y<start-4);assert.ok(q.n.hp<110);assert.ok(q.c.supported(q.n));assert.ok(!q.c.terrain(q.n));
    q.c.hit(q.n,1000,'rift');q.c.hit(q.n,1000,'rift');assert.equal(q.n.hp,0);const dead=q.n.y;q.world.carve({x:0,y:dead-2,z:0},3);frames(1.5,dt=>q.c.update(dt,q.player));assert.ok(q.n.y<dead-1);assert.equal(q.n.reward,3);
  });
  await test('fixed-step movement and mid-windup saves preserve the same attack at 30/60/120 Hz', () => {
    const out=[];for(const hz of [30,60,120]) {const q=setup();q.player.z=2.9;q.c.update(.1,q.player);q.c.save();const restored=B.Crawlers.validate(q.c.state,q.world,q.state), c=new B.Crawlers(q.world,{...q.state,expedition:{...q.state.expedition,crawlers:restored}},q.combat);frames(1.1,dt=>c.update(dt,q.player),hz);out.push([q.combat.state.health,c.nodes[0].phase,c.nodes[0].z]);}
    assert.deepEqual(out[0].slice(0,2),out[1].slice(0,2));assert.deepEqual(out[0].slice(0,2),out[2].slice(0,2));assert.ok(Math.max(...out.map(a=>a[2]))-Math.min(...out.map(a=>a[2]))<1e-8);
    const edge=setup();edge.c.homes[0].x=4;edge.c.homes[0].z=0;edge.n.x=11;edge.player.teleport(13.4,-95.98,0);edge.c.update(1/60,edge.player);
    assert.equal(edge.n.lastSeen.x,13.4);assert.ok(B.Crawlers.validate(edge.c.state,edge.world,edge.state));
    edge.c.state.enemies[0].lastSeen.x=14.1;assert.throws(()=>B.Crawlers.validate(edge.c.state,edge.world,edge.state),/crawler/i);
  });
  await test('actual blast records break shell once and leave rock-occluded targets untouched', () => {
    const q=setup(),game={player:q.player,gadgets:{nodes:[],blasts:[{serial:1,x:0,y:q.n.y,z:0,radius:2.8}]},refuges:{nodes:[],state:{lit:[]}},expedition:{pulseSerial:0}};
    q.combat.update(1/60,game);assert.equal(q.n.shell,0);assert.equal(q.n.hp,110);q.combat.update(1/60,game);assert.equal(q.n.hp,110);
    game.gadgets.blasts.push({serial:2,x:0,y:q.n.y,z:0,radius:2.8});q.combat.update(1/60,game);assert.equal(q.n.hp,40);
    const hp=q.n.hp,density=q.world.density.bind(q.world);q.world.density=(x,y,z)=>z>1&&z<1.4?-2:density(x,y,z);game.gadgets.blasts.push({serial:3,x:0,y:q.n.y,z:2,radius:3});q.combat.update(1/60,game);assert.equal(q.n.hp,hp);
  });
  await test('tooth collection, partial supplies and the paid impact head cannot duplicate rewards', () => {
    const q=setup();q.c.hit(q.n,1000,'rift');q.c.hit(q.n,1000,'rift');q.player.teleport(0,-95.98,2.5);aim(q.player,q.n);q.state.expedition.supplies.bombs=98;
    assert.ok(q.c.collect(q.n.id,q.player));assert.deepEqual(q.c.state.recovered,[200]);assert.equal(q.n.reward,2);assert.equal(q.state.expedition.supplies.bombs,99);assert.equal(q.c.collect(q.n.id,q.player),false);
    q.state.expedition.supplies.bombs=97;assert.ok(q.c.collect(q.n.id,q.player));assert.equal(q.n.reward,0);assert.equal(q.c.collect(q.n.id,q.player),false);
    q.state.cash=239;assert.equal(q.c.buy(),false);q.state.cash=240;assert.ok(q.c.buy());assert.equal(q.state.cash,0);assert.ok(q.world.impactHead);assert.equal(q.c.buy(),false);
    q.c.save();assert.ok(B.Crawlers.validate(q.c.state,q.world,q.state));
  });
  await test('earned impact head changes actual axe damage and terrain removal without changing swing cadence', () => {
    const results=[];for(const impact of [false,true]) {const q=setup();q.n.shell=0;q.state.expedition.tool='axe';q.c.state.impactHead=q.world.impactHead=impact;q.player.z=2.5;aim(q.player,q.n);
      const cutter=new B.Cutter(q.world),actions=new B.ToolActions(q.world,cutter,q.combat);frames(.3,dt=>actions.update(dt,q.player,q.state,true));assert.equal(q.n.hp,impact?58:76);
      q.player.teleport(6,-95.98,5);q.player.pitch=-1.3;const before=q.world.density(6,-96.7,4.3);cutter.update(.06,q.player,0,true,'axe');results.push(q.world.density(6,-96.7,4.3)-before);
    }assert.ok(results[1]>results[0]*1.5 && results[0]>0);
  });
  await test('real Game collection, Otis purchase, HUD, models and portable reload agree', async () => {
    Object.assign(g.expedition.state,{recovered:[0,1],runes:[0,1,2],awakened:true});for(const b of g.expedition.bodies)b.collected=true;g.expedition.physics.loose.clear();g.expedition.physics.awake.clear();g.deep.state.open=g.world.deepOpen=true;g.economy.state.deepest=100;
    const n=g.crawlers.nodes[0];g.world.carve(n,3);g.player.teleport(n.x,n.y-g.player.eye,n.z+2.5);aim(g.player,n);g.play();g.crawlers.hit(n,1000,'rift');g.crawlers.hit(n,1000,'rift');assert.equal(g.interaction()?.kind,'crawler-loot');g.use();assert.ok(g.crawlers.state.recovered.includes(n.id));
    g.player.teleport(19,.06,36);aim(g.player,{x:19,y:1.55,z:38.4});g.economy.state.cash=240;g.use();const button=h.elements.get('town-services').children.find(b=>b.children[0]?.textContent==='Impact axe head');assert.ok(button);button.onclick();assert.equal(g.economy.state.cash,0);assert.ok(g.crawlers.state.impactHead);
    const save=B.Saves.snapshot(g,true),field=g.world.field.slice();await g.install(B.Saves.validate(save));assert.ok(g.crawlers.state.impactHead);assert.deepEqual(g.world.field,field);g.selectTool('axe');g.view.render(g,0,1);assert.ok(g.view.impactAxe.visible);assert.match(h.elements.get('tool-name').textContent,/Impact/);
    for(const m of g.view.crawlerModels) for(const yaw of [0,.4,.8,1.5]) {m.node.yaw=yaw;g.view.renderCrawlers(g,0);const b=new THREE.Box3().setFromObject(m.root);for(const [i,k] of ['x','y','z'].entries()){assert.ok(b.min[k]>=m.node[k]-B.CRAWLER_SIZE[i]/2-1e-5);assert.ok(b.max[k]<=m.node[k]+B.CRAWLER_SIZE[i]/2+1e-5,`${k} ${b.max[k]-m.node[k]} yaw ${yaw}`);}}
  });
  await test('corrupt armor, loot and upgrades reject; older claims gain creatures without terrain changes', async () => {
    const good=B.Saves.snapshot(g);for(const mutate of [s=>s.enemies[0].shell=91,s=>s.enemies[0].hp=1,s=>s.recovered.push(200),s=>s.enemies[0].direction={x:0,y:0,z:0},s=>s.enemies[0].y=0,s=>s.enemies[0].reward=4,s=>s.recovered=[]]){const bad=structuredClone(good);mutate(bad.state.expedition.crawlers);assert.throws(()=>B.Saves.validate(bad),/crawler/i);}
    const old=structuredClone(good);delete old.state.expedition.crawlers;await g.install(B.Saves.validate(old));assert.deepEqual(g.world.field,good.field);assert.equal(g.crawlers.state.impactHead,false);assert.equal(g.crawlers.nodes.length,3);
    const before=B.Saves.snapshot(g);g.view.render(g,.05,99);assert.deepEqual(g.economy.state,before.state);assert.deepEqual(g.world.field,before.field);
  });
} finally { h.close(); }
console.log(`COMPLETE ${crawlerChecks} crawler checks passed (inert scene and DOM; no browser or OS input)`);
