/* The Stonewright workshop and a sling that throws existing loose minerals. */
'use strict';
(function (B) {
  const SIZE = [4.2, 2.4, 1.5], offsets = () => B.boxOffsets(SIZE);
  const point = n => ({ x: n.x, y: n.y, z: n.z }), distance = (a, b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  function segmentBox(a, b, box) {
    let lo = 0, hi = 1;
    for (const [i, k] of ['x','y','z'].entries()) {
      const d=b[k]-a[k];
      if (Math.abs(d)<1e-10) { if(a[k]<box[i] || a[k]>box[i+3]) return null; continue; }
      let l=(box[i]-a[k])/d, h=(box[i+3]-a[k])/d; if(l>h)[l,h]=[h,l];
      lo=Math.max(lo,l);hi=Math.min(hi,h);if(lo>hi)return null;
    }
    return lo;
  }
  class Kinetics {
    static site(world) {
      if (!world.depthVersion) return null;
      const room=(world.deepTerrain || new B.DeepTerrain(world.seed)).rooms[1];
      return {id:0,x:room.x,y:room.y-2,z:room.z+.8,name:'Stonewright workshop'};
    }
    constructor(world, progress, ore, combat) {
      this.world=world;this.progress=progress;this.ore=ore;this.combat=combat;
      this.state=progress.expedition.kinetics ||= {version:1,known:false,coils:[],unlocked:false,bodies:[],held:null,charge:0,flights:[]};
      const site=Kinetics.site(world);
      this.nodes=site?[{...site,size:SIZE,kind:0,radius:2.6,collected:false,offsets:offsets()}]:[];
      this.physics=new B.OreSystem(world,this.nodes,this.state.bodies);
      this.physics.supportRadius=Math.hypot(...SIZE)/2;
      this.events=[];this.player=null;this.obstacles=[];this.obstruction=null;this.pulseSerial=0;this.wasHeld=false;this.revision=0;
      // Loading preserves the physical mineral, but never resumes a held trigger.
      this.state.held=null;this.state.charge=0;
      for(const n of ore.nodes) { n.slingHeld=false;n.slingFlight=this.state.flights.some(f=>f.id===n.id); }
      ore.motionOverride=(n,dt)=>this.holdStep(n,dt);
      ore.onSweep=(n,a,b)=>this.projectileContact(n,a,b);
      ore.onSolid=n=>this.endFlight(n);
      ore.onImpulse=n=>{if(n.id===this.state.held)this.cancel();};
    }
    get bench() { return this.nodes[0]; }
    coil(i) { const n=this.bench;return n?{x:n.x+(i?1.55:-1.55),y:n.y+.48,z:n.z+.45}:null; }
    obstaclesForPlayer() { return this.nodes.map(n=>[n.x-2.1,n.y-1.2,n.z-.75,n.x+2.1,n.y+1.2,n.z+.75]); }
    exposed(p) { return [[0,0,0],[-.25,0,0],[.25,0,0],[0,-.25,0],[0,.25,0],[0,0,-.25],[0,0,.25]].every(o=>this.world.density(p.x+o[0],p.y+o[1],p.z+o[2])>=-.004); }
    interaction(player) {
      const n=this.bench;if(!n)return null;
      const p={x:n.x,y:n.y-.18,z:n.z+.76}, h=player.head,d=player.direction,r=distance(h,p);
      if(r>3.3 || r<.1 || ((p.x-h.x)*d.x+(p.y-h.y)*d.y+(p.z-h.z)*d.z)/r<.8 || !this.world.clearLine(h,p,.05))return null;
      const buried=this.physics.contact(n).density<-.004;
      return {kind:'stonewright',locked:!this.progress.expedition.deep?.open || buried || this.state.coils.length<2,
        label:buried?'Excavate the entire workshop frame':this.state.unlocked?'Stonewright sling recovered / equip with 7':this.state.coils.length<2?`Expose and resonate both field coils / ${this.state.coils.length}/2 charged`:'Recover the Stonewright sling / no supplies needed'};
    }
    recover(player) {
      const a=this.interaction(player);if(!a || a.locked || this.state.unlocked)return false;
      this.state.known=this.state.unlocked=true;this.revision++;
      this.events.push({title:'The Stonewright sling',text:'The old workshop used mineral weights to move its machinery. Press 7. Aim at a loose mineral and hold the trigger to lift and charge it; release to throw. Thrown minerals damage creatures and remain yours to collect. Pausing or changing tools gently releases your hold.'});return true;
    }
    scan(head,range) { if(!this.bench || distance(head,this.bench)>range)return [];this.state.known=true;return [{...point(this.bench),scanKey:'stonewright',name:'Stonewright workshop'}]; }
    markers() { return this.state.known && this.bench?[{...point(this.bench),name:this.state.unlocked?'Restored Stonewright workshop':'Stonewright workshop / buried sling',type:'station',color:'#a9ddcb'}]:[]; }
    pulseTarget(head,dir,reach) {
      if(!this.bench || this.state.unlocked)return null;
      let best=null;
      for(let i=0;i<2;i++){
        if(this.state.coils.includes(i))continue;
        const p=this.coil(i),dx=p.x-head.x,dy=p.y-head.y,dz=p.z-head.z,along=dx*dir.x+dy*dir.y+dz*dir.z;
        if(along>0 && along<=reach && Math.hypot(dx-dir.x*along,dy-dir.y*along,dz-dir.z*along)<.42 && this.world.clearLine(head,p,.05) && (!best || along<best.distance))best={...p,distance:along};
      }
      return best;
    }
    candidate(player) {
      if(!this.state.unlocked || this.state.flights.length>=6)return null;
      const h=player.head,d=player.direction;let found=null,best=Infinity;
      for(const n of this.ore.index.query(h.x,h.y,h.z,8)) {
        if(n.collected || n.motion==='embedded' || n.slingFlight || this.ore.contact(n).density<-.004)continue;
        const dx=n.x-h.x,dy=n.y-h.y,dz=n.z-h.z,along=dx*d.x+dy*d.y+dz*d.z;
        const off=Math.max(0,dx*dx+dy*dy+dz*dz-along*along);
        if(along<.3 || off>Math.pow(n.radius+.14*Math.max(1,along),2) || !this.world.clearLine(h,n,.05))continue;
        const score=Math.sqrt(off)*3+along*.12;if(score<best){best=score;found=n;}
      }
      return found;
    }
    reserve(n) { return n.slingHeld || n.slingFlight || this.progress.expedition.tool==='sling' && this.player && this.candidate(this.player)===n; }
    cancel() {
      const n=this.ore.nodes.find(n=>n.id===this.state.held);
      if(n){n.slingHeld=false;n.vx=n.vy=n.vz=0;n.motion='falling';this.ore.awake.add(n);this.revision++;}
      this.state.held=null;this.state.charge=0;this.wasHeld=false;this.obstruction=null;
    }
    fire(player) {
      const n=this.ore.nodes.find(n=>n.id===this.state.held);if(!n)return false;
      const d=player.direction,speed=12+12*this.state.charge;
      n.slingHeld=false;n.slingFlight=true;n.vx=d.x*speed;n.vy=d.y*speed;n.vz=d.z*speed;
      n.motion='falling';this.ore.awake.add(n);this.state.flights.push({id:n.id,remaining:3});
      this.state.held=null;this.state.charge=0;this.revision++;this.events.push({kind:'sling-fire',point:point(n)});return true;
    }
    endFlight(n) { if(!n.slingFlight)return;n.slingFlight=false;this.state.flights=this.state.flights.filter(f=>f.id!==n.id);this.revision++; }
    bodyBox(n,b) {
      const ext=[0,1,2].map(i=>Math.max(...n.offsets.map(o=>Math.abs(o[i]))));
      return b.map((v,i)=>v+(i<3?-1:1)*ext[i%3]);
    }
    blocker(n,a,b) {
      let nearest=null;
      for(const box of this.obstacles) {const t=segmentBox(a,b,this.bodyBox(n,box));if(t!==null && (nearest===null || t<nearest))nearest=t;}
      return nearest;
    }
    holdStep(n,dt) {
      if(n.id!==this.state.held || !this.player)return undefined;
      const h=this.player.head,d=this.player.direction;
      if(n.collected || distance(h,n)>8.5 || !this.world.clearLine(h,n,.05)){this.cancel();return undefined;}
      const target={x:h.x+d.x*2.15,y:h.y+d.y*2.15,z:h.z+d.z*2.15},length=distance(n,target),travel=Math.min(length,12*dt),steps=Math.max(1,Math.ceil(travel/.05));
      const from=point(n);let moved=false;this.obstruction=null;
      for(let i=1;i<=steps;i++) {
        const t=length?travel/length*i/steps:0,p={x:from.x+(target.x-from.x)*t,y:from.y+(target.y-from.y)*t,z:from.z+(target.z-from.z)*t};
        const contact=this.ore.contact(n,p.x,p.y,p.z);
        if(contact.density<-.004 || this.blocker(n,n,p)!==null){this.obstruction=point(contact.density<-.004?contact:p);break;}
        Object.assign(n,p);moved ||= distance(from,n)>1e-8;
      }
      n.vx=n.vy=n.vz=0;n.motion='falling';this.state.charge=Math.min(1,this.state.charge+dt/.85);this.revision++;
      return moved;
    }
    projectileContact(n,a,b) {
      if(!n.slingFlight)return null;
      let hit=null,t=this.blocker(n,a,b);
      for(const enemy of this.combat.targets()) {
        if(enemy.hp<=0 || enemy.phase==='buried')continue;
        const size=enemy.size || (this.combat.crawlers?.owns(enemy)?B.CRAWLER_SIZE:B.MOTH_SIZE);
        const box=this.bodyBox(n,[enemy.x-size[0]/2,enemy.y-size[1]/2,enemy.z-size[2]/2,enemy.x+size[0]/2,enemy.y+size[1]/2,enemy.z+size[2]/2]);
        const at=segmentBox(a,b,box);if(at===null || t!==null && at>t+1e-8)continue;
        const p={x:a.x+(b.x-a.x)*at,y:a.y+(b.y-a.y)*at,z:a.z+(b.z-a.z)*at};
        if(!this.world.clearLine(p,enemy,.025))continue;
        hit=enemy;t=at;
      }
      if(t===null)return null;
      const speed=Math.hypot(n.vx,n.vy,n.vz),dir={x:n.vx/(speed||1),y:n.vy/(speed||1),z:n.vz/(speed||1)};
      if(hit && speed>5) { this.combat.hit(hit,Math.min(78,speed*3),'kinetic',dir);this.events.push({kind:'sling-hit',point:point(hit)}); }
      this.endFlight(n);n.vx*=-.12;n.vy=Math.min(3,Math.max(0,-n.vy*.12));n.vz*=-.12;return t;
    }
    update(dt,player,fire,active,expedition,obstacles=[]) {
      const before=this.revision;this.player=player;this.obstacles=obstacles;
      if(this.physics.update(dt))this.revision++;
      const n=this.bench;
      if(n && distance(player.head,n)<8 && this.world.clearLine(player.head,n,.05) && !this.state.known){this.state.known=true;this.revision++;}
      if(expedition.pulseSerial!==this.pulseSerial) {
        this.pulseSerial=expedition.pulseSerial;const pulse=expedition.lastPulse;
        if(n && pulse && !pulse.magic && this.progress.expedition.deep?.open)for(let i=0;i<2;i++){
          const p=this.coil(i);
          if(!this.state.coils.includes(i) && distance(p,pulse)<=pulse.radius+.35 && this.exposed(p) && this.world.clearLine(pulse,p,.05)) {
            this.state.coils.push(i);this.state.known=true;this.revision++;this.events.push({kind:'coil',point:p});
          }
        }
      }
      for(const f of [...this.state.flights]) { f.remaining=Math.max(0,f.remaining-dt);const ore=this.ore.nodes[f.id];if(!f.remaining || ore.collected || ore.motion==='resting')this.endFlight(ore); }
      if(!active || !this.state.unlocked)this.cancel();
      else {
        if(!fire && this.wasHeld && this.state.held!==null)this.fire(player);
        if(fire && this.state.held===null){const ore=this.candidate(player);if(ore){this.state.held=ore.id;this.state.charge=0;ore.slingHeld=true;ore.motion='falling';this.ore.awake.add(ore);this.revision++;}}
        this.wasHeld=fire;
      }
      this.save();return this.revision!==before;
    }
    hint() { return this.state.held!==null?this.obstruction?'Mineral caught. Lift or clear the rock around it.':`Release to throw / ${Math.round(this.state.charge*100)}% power`:'Hold on a loose mineral to lift it. Release to throw.'; }
    save() { this.state.bodies=this.physics.snapshot(); }
    static validate(s,world,progress,loose,player) {
      const finite=(v,lo,hi)=>Number.isFinite(v)&&v>=lo&&v<=hi;
      if(!s || s.version!==1 || typeof s.known!=='boolean' || typeof s.unlocked!=='boolean' || !Array.isArray(s.coils) || s.coils.length>2 || new Set(s.coils).size!==s.coils.length || s.coils.some(v=>v!==0&&v!==1) || s.coils.length && (!s.known || !progress.expedition.deep?.open) || s.unlocked && s.coils.length!==2 || !world.depthVersion && (s.known||s.coils.length||s.unlocked||s.bodies?.length) || !Array.isArray(s.bodies) || s.bodies.length>1 || !finite(s.charge,0,1) || s.held===null && s.charge!==0 || !Array.isArray(s.flights) || s.flights.length>6)throw Error('Invalid Stonewright sling.');
      for(const n of s.bodies)if(!n || n.id!==0 || !finite(n.x,-14,14) || !finite(n.z,-14,14) || !finite(n.y,world.floor,-80) || !['vx','vy','vz'].every(k=>finite(n[k],-25,25)) || offsets().some(o=>world.density(n.x+o[0],n.y+o[1],n.z+o[2])<-.01))throw Error('Invalid Stonewright frame.');
      const seen=new Set();
      if(s.held!==null) {const n=loose.find(n=>n.id===s.held);if(!s.unlocked || !Number.isInteger(s.held) || !n || distance(n,{...player,y:player.y+1.58})>8.5 || n.vx || n.vy || n.vz)throw Error('Invalid held sling mineral.');seen.add(s.held);}
      for(const f of s.flights){if(!f || !s.unlocked || !Number.isInteger(f.id) || seen.has(f.id) || !loose.some(n=>n.id===f.id) || !finite(f.remaining,0,3) || !f.remaining)throw Error('Invalid sling projectile.');seen.add(f.id);}
      return {version:1,known:s.known,coils:[...s.coils],unlocked:s.unlocked,bodies:s.bodies.map(n=>({id:n.id,...point(n),vx:n.vx,vy:n.vy,vz:n.vz})),held:s.held,charge:s.charge,flights:s.flights.map(f=>({id:f.id,remaining:f.remaining}))};
    }
  }
  Object.assign(B,{Kinetics,STONEWRIGHT_SIZE:SIZE,segmentBox});
})(B2);
