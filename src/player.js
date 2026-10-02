'use strict';
(function (B) {
  class Player {
    constructor(world) { this.world = world; this.x = 0; this.y = .06; this.z = 11.5; this.vx = this.vy = this.vz = 0; this.yaw = 0; this.pitch = -.35; this.grounded = false; this.eye = 1.58; this.radius = .3; this.height = 1.75; this.liftTime = 0; this.obstacles = []; this.nearObstacles = []; this.collisionObstacles = null; this.resetView(); }
    get position() { return { x: this.x, y: this.y, z: this.z }; }
    get head() { return { x: this.x, y: this.y + this.eye, z: this.z }; }
    get direction() { const c = Math.cos(this.pitch); return { x: -Math.sin(this.yaw) * c, y: Math.sin(this.pitch), z: -Math.cos(this.yaw) * c }; }
    teleport(x, y, z) { this.x = x; this.y = y; this.z = z; this.vx = this.vy = this.vz = 0; this.grounded = false; this.liftTime = 0; this.resetView(); }
    resetView() { this.previous = this.position; this.stepOffset = this.previousStepOffset = 0; }
    correctPosition(x,y,z) { const old=this.position;this.x=x;this.y=y;this.z=z;this.previous.x+=x-old.x;this.previous.y+=y-old.y;this.previous.z+=z-old.z; }
    cameraPose(alpha = 1) {
      const a = B.clamp(alpha, 0, 1), old = this.previous;
      return { x: old.x + (this.x-old.x)*a, y: old.y + (this.y-old.y)*a + this.previousStepOffset+(this.stepOffset-this.previousStepOffset)*a, z: old.z + (this.z-old.z)*a, yaw: this.yaw, pitch: this.pitch };
    }
    obstacleTop(b,x){const r=b.roof;if(!r)return b[4];const d=Math.max(0,Math.abs(x-r.x)-this.radius);return Math.max(r.eave+r.rise*Math.max(0,1-d/r.reach),d<=.105?r.ridge:-Infinity);}
    obstacleOverlap(b,x,y,z) {
      if(x+this.radius<=b[0]||x-this.radius>=b[3]||z+this.radius<=b[2]||z-this.radius>=b[5]||y+this.height<=b[1]||y>=this.obstacleTop(b,x))return false;
      const dx=x-B.clamp(x,b[0],b[3]),dz=z-B.clamp(z,b[2],b[5]);
      return dx*dx+dz*dz<this.radius*this.radius;
    }
    obstacleEntry(b,from,to) {
      const dx=to.x-from.x,dz=to.z-from.z,r=this.radius,a=dx*dx+dz*dz;
      if(a<1e-20)return null;
      // Most contacts hit a face. Its entry is exact while the other coordinate
      // stays on that face, so no corner roots or candidate arrays are needed.
      if(from.z>=b[2]&&from.z<=b[5]&&dx){const n=from.x<b[0]?-1:from.x>b[3]?1:0,t=((n<0?b[0]-r:b[3]+r)-from.x)/dx,z=from.z+dz*t;if(n&&t>=0&&t<=1&&dx*n<0&&z>=b[2]&&z<=b[5])return {t,x:n,z:0};}
      if(from.x>=b[0]&&from.x<=b[3]&&dz){const n=from.z<b[2]?-1:from.z>b[5]?1:0,t=((n<0?b[2]-r:b[5]+r)-from.z)/dz,x=from.x+dx*t;if(n&&t>=0&&t<=1&&dz*n<0&&x>=b[0]&&x<=b[3])return {t,x:0,z:n};}
      let best=null;
      const take=(t,x,z)=>{if(t< -1e-8||t>1+1e-8||dx*x+dz*z>=0)return;if(!best||t<best.t)best={t:B.clamp(t,0,1),x,z};};
      if(dx){for(const [x,n]of [[b[0]-r,-1],[b[3]+r,1]]){const t=(x-from.x)/dx,z=from.z+dz*t;if(z>=b[2]&&z<=b[5])take(t,n,0);}}
      if(dz){for(const [z,n]of [[b[2]-r,-1],[b[5]+r,1]]){const t=(z-from.z)/dz,x=from.x+dx*t;if(x>=b[0]&&x<=b[3])take(t,0,n);}}
      for(const [x,sx]of [[b[0],-1],[b[3],1]])for(const [z,sz]of [[b[2],-1],[b[5],1]]){
        const ox=from.x-x,oz=from.z-z,dot=ox*dx+oz*dz,c=ox*ox+oz*oz-r*r,disc=dot*dot-a*c;
        if(disc<0)continue;
        const t=(-dot-Math.sqrt(disc))/a,nx=ox+dx*t,nz=oz+dz*t;
        if(nx*sx>= -1e-9&&nz*sz>= -1e-9){const length=Math.hypot(nx,nz);if(length)take(t,nx/length,nz/length);}
      }
      return best;
    }
    blocked(x, y, z) {
      const area = B.SURFACE;
      if (x < area.minX + this.radius || x > area.maxX - this.radius || z < area.minZ + this.radius || z > area.maxZ - this.radius || y < this.world.floor - 1) return true;
      for (const b of this.collisionObstacles || this.obstacles) if (this.obstacleOverlap(b,x,y,z)) return true;
      for (const h of [.025, .45, 1, 1.7]) {
        if (this.world.density(x, y + h, z) < -.005) return true;
        for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4; if (this.world.density(x + Math.cos(angle) * this.radius, y + h, z + Math.sin(angle) * this.radius) < -.005) return true; }
      }
      return false;
    }
    // Find the outward contact direction only after the cheap occupancy test hits.
    contact(from, to) {
      const area = B.SURFACE, r = this.radius;
      if(to.x < area.minX+r)return {x:1,z:0}; if(to.x > area.maxX-r)return {x:-1,z:0};
      if(to.z < area.minZ+r)return {x:0,z:1}; if(to.z > area.maxZ-r)return {x:0,z:-1};
      let obstacleNormal=null,entryTime=Infinity;
      for(const b of this.collisionObstacles || this.obstacles) {
        if(!this.obstacleOverlap(b,to.x,to.y,to.z))continue;
        const entry=this.obstacleEntry(b,from,to);
        if(entry){if(entry.t<entryTime){entryTime=entry.t;obstacleNormal={x:entry.x,z:entry.z};}continue;}
        const dx=to.x-from.x,dz=to.z-from.z;
        const tx=dx>0?(b[0]-r-from.x)/dx:dx<0?(b[3]+r-from.x)/dx:-Infinity;
        const tz=dz>0?(b[2]-r-from.z)/dz:dz<0?(b[5]+r-from.z)/dz:-Infinity;
        if(!obstacleNormal)obstacleNormal=tx>tz?{x:-Math.sign(dx),z:0}:{x:0,z:-Math.sign(dz)};
      }
      if(obstacleNormal)return obstacleNormal;
      let sample=null,depth=-.005;
      for(const h of [.025,.45,1,1.7])for(let i=-1;i<8;i++) {
        const a=i*Math.PI/4,x=to.x+(i<0?0:Math.cos(a)*r),y=to.y+h,z=to.z+(i<0?0:Math.sin(a)*r),d=this.world.density(x,y,z);
        if(d<depth){depth=d;sample={x,y,z};}
      }
      if(!sample)return null;
      const {x,y,z}=sample,e=.025,n=this.world.normal?.(x,y,z)||[this.world.density(x+e,y,z)-this.world.density(x-e,y,z),this.world.density(x,y+e,z)-this.world.density(x,y-e,z),this.world.density(x,y,z+e)-this.world.density(x,y,z-e)];
      const length=Math.hypot(n[0],n[2]);return length>.001?{x:n[0]/length,z:n[2]/length}:null;
    }
    travelFraction(x,y,z,dx,dy,dz) {
      let lo=0,hi=1;const passes=Math.max(1,Math.ceil(Math.log2(Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))/.0001)));
      for(let i=0;i<passes;i++){const t=(lo+hi)/2;if(this.blocked(x+dx*t,y+dy*t,z+dz*t))hi=t;else lo=t;}
      return lo;
    }
    recoverOverlap() {
      const candidates=[],r=this.radius;
      for(const b of this.collisionObstacles || this.obstacles) {
        const top=this.obstacleTop(b,this.x);if(!this.obstacleOverlap(b,this.x,this.y,this.z))continue;
        const dx=this.x-B.clamp(this.x,b[0],b[3]),dz=this.z-B.clamp(this.z,b[2],b[5]),length=Math.hypot(dx,dz),distance=r-length+.001;
        if(length>1e-9&&distance<=.35)candidates.push({x:this.x+dx/length*distance,z:this.z+dz/length*distance,distance});
        for(const [axis,edge]of [['x',b[0]-r-.001],['x',b[3]+r+.001],['y',b[1]-this.height-.001],['y',top+.001],['z',b[2]-r-.001],['z',b[5]+r+.001]]) {
          const distance=Math.abs(edge-this[axis]);if(distance<=.35)candidates.push({axis,edge,distance});
        }
      }
      if(!candidates.length||!this.blocked(this.x,this.y,this.z))return;
      candidates.sort((a,b)=>a.distance-b.distance);
      for(const c of candidates){const p=this.position;if(c.axis)p[c.axis]=c.edge;else{p.x=c.x;p.z=c.z;}if(this.blocked(p.x,p.y,p.z))continue;if(c.axis){const delta=c.edge-this[c.axis];this[c.axis]=c.edge;if(c.axis==='y'&&Math.abs(delta)>.045)this.stepOffset=B.clamp(this.stepOffset-delta,-.3,.3);}else{this.x=c.x;this.z=c.z;}return;}
    }
    moveHorizontal(dx,dz,canStep) {
      for(let pass=0;pass<3&&Math.hypot(dx,dz)>.00001;pass++) {
        const from=this.position,to={x:this.x+dx,y:this.y,z:this.z+dz};
        if(!this.blocked(to.x,to.y,to.z)){this.x=to.x;this.z=to.z;return;}
        // Raise only as far as necessary, then settle onto the actual tread.
        if(canStep&&!this.blocked(from.x,from.y+.3,from.z)&&!this.blocked(to.x,to.y+.3,to.z)) {
          const down=this.travelFraction(to.x,to.y+.3,to.z,0,-.3,0),rise=.3*(1-down);
          this.x=to.x;this.z=to.z;this.y+=rise;
          if(rise>.045)this.stepOffset=Math.max(-.3,this.stepOffset-rise);
          return;
        }
        const t=this.travelFraction(from.x,from.y,from.z,dx,0,dz),hit={x:from.x+dx*Math.min(1,t+.002),y:from.y,z:from.z+dz*Math.min(1,t+.002)};
        this.x+=dx*t;this.z+=dz*t;
        const n=this.contact(from,hit)||this.contact(from,to);
        if(!n){this.vx=this.vz=0;return;}
        dx*=1-t;dz*=1-t;const into=dx*n.x+dz*n.z;
        if(into>=0)return;
        dx-=n.x*into;dz-=n.z*into;
        const velocity=this.vx*n.x+this.vz*n.z;if(velocity<0){this.vx-=n.x*velocity;this.vz-=n.z*velocity;}
      }
    }
    step(dt, keys, liftSpeed) {
      // Include full travel and the maximum overlap recovery. Preserve box order.
      const reach=this.radius+.351+Math.max(6,Math.hypot(this.vx,this.vz))*Math.max(0,dt),near=this.nearObstacles;
      near.length=0;
      for(const b of this.obstacles)if(b[0]<=this.x+reach&&b[3]>=this.x-reach&&b[2]<=this.z+reach&&b[5]>=this.z-reach)near.push(b);
      this.collisionObstacles=near;
      try { this.advanceStep(dt,keys,liftSpeed); }
      finally { this.collisionObstacles=null; }
    }
    advanceStep(dt, keys, liftSpeed) {
      this.recoverOverlap();
      this.previous = this.position;
      this.previousStepOffset = this.stepOffset;
      // Ease once per simulation tick so painting cadence cannot change stair motion.
      this.stepOffset *= Math.exp(-Math.max(0,dt)*18);
      let mx = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0), mz = (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
      const len = Math.hypot(mx, mz) || 1, speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 6 : 3.8; mx /= len; mz /= len;
      const tx = (mx * Math.cos(this.yaw) + mz * Math.sin(this.yaw)) * speed, tz = (-mx * Math.sin(this.yaw) + mz * Math.cos(this.yaw)) * speed;
      const moving = mx !== 0 || mz !== 0;
      const supported = this.grounded || this.blocked(this.x,this.y-.06,this.z);
      const rate = supported ? moving ? 32 : 42 : moving ? 13 : 9;
      const blend = 1 - Math.exp(-dt * rate); this.vx += (tx - this.vx) * blend; this.vz += (tz - this.vz) * blend;
      if (!moving && Math.hypot(this.vx,this.vz)<.015) this.vx=this.vz=0;
      if (keys.has('Space')) { this.liftTime += dt; this.vy += ((this.liftTime > .14 ? liftSpeed : 5.5) - this.vy) * Math.min(1, dt * 8); } else { this.liftTime = 0; this.vy = Math.max(-20, this.vy - 23 * dt); }
      if (this.y > 16 && this.vy > 0) this.vy = 0;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(this.vx), Math.abs(this.vy), Math.abs(this.vz)) * dt / .1)), h = dt / steps;
      this.grounded = false;
      for (let i = 0; i < steps; i++) {
        this.moveHorizontal(this.vx*h,this.vz*h,supported&&!keys.has('Space')&&this.vy<=0);
        if(this.vy<=0&&supported&&!keys.has('Space')) {
          if(this.blocked(this.x,this.y-.002,this.z)){this.grounded=true;this.vy=0;continue;}
          if(this.blocked(this.x,this.y-.3,this.z)){const drop=.3*this.travelFraction(this.x,this.y,this.z,0,-.3,0);this.y-=drop;if(drop>.045)this.stepOffset=Math.min(.3,this.stepOffset+drop);this.grounded=true;this.vy=0;continue;}
        }
        const dy=this.vy*h;
        if (!this.blocked(this.x,this.y+dy,this.z)) this.y+=dy;
        else { this.y+=dy*this.travelFraction(this.x,this.y,this.z,0,dy,0);if(this.vy<0)this.grounded=true;this.vy=0; }
      }
    }
    look(dx, dy, sensitivity) { if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(sensitivity))return;this.yaw -= dx * .002 * sensitivity; this.pitch = B.clamp(this.pitch - dy * .002 * sensitivity, -1.54, 1.54); }
  }
  class Cutter {
    constructor(world) { this.world = world; this.target = null; this.lastDirection = null; this.contact = null; this.edited = false; this.frames = 0; }
    trace(player, level, mode = 'cutter', reach = 5.2) {
      const tool = B.TOOLS?.[mode] || { radius: 1, power: 1 };
      const origin = player.head, direction = player.direction, radius = B.clamp(B.GEAR.drill.values[level] * tool.radius, .72, 2.8);
      let hit = this.world.ray(origin, direction, reach);
      // Wide brush contact: a center ray falling through its own hole does not release firing.
      const brush = B.cutBrush(player, radius, mode), [side, up] = brush.basis;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, offset = radius * .62;
        const from = { x: origin.x + (side.x * Math.cos(a) * brush.axes[0] + up.x * Math.sin(a) * brush.axes[1]) * offset, y: origin.y + up.y * Math.sin(a) * brush.axes[1] * offset, z: origin.z + (side.z * Math.cos(a) * brush.axes[0] + up.z * Math.sin(a) * brush.axes[1]) * offset };
        const candidate = this.world.ray(from, direction, reach);
        if (candidate && (!hit || candidate.distance < hit.distance - radius * .4)) hit = candidate;
      }
      // Once the center is open, probe the cutting edge to ream a smaller existing tunnel.
      // Keeping the inner ring for forward cuts avoids pinning the brush to its own rim.
      if (!hit) {
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4, offset = radius * .9;
          const from = { x: origin.x + (side.x * Math.cos(a) * brush.axes[0] + up.x * Math.sin(a) * brush.axes[1]) * offset, y: origin.y + up.y * Math.sin(a) * brush.axes[1] * offset, z: origin.z + (side.z * Math.cos(a) * brush.axes[0] + up.z * Math.sin(a) * brush.axes[1]) * offset };
          const candidate = this.world.ray(from, direction, reach);
          if (candidate && (!hit || candidate.distance < hit.distance)) hit = candidate;
        }
      }
      return hit;
    }
    update(dt, player, level, held, mode = 'cutter', resolved = undefined) {
      this.edited = false; this.contact = null;
      if (!held) { this.target = null; return; }
      this.frames++;
      const tool = B.TOOLS?.[mode] || { radius: 1, power: 1 };
      const origin = player.head, direction = player.direction, radius = B.clamp(B.GEAR.drill.values[level] * tool.radius, .72, 2.8);
      const hit = resolved === undefined ? this.trace(player, level, mode) : resolved;
      if (!hit) { this.target = null; return; }
      const layer = B.geology(hit.y), efficiency = mode === 'scoop' && hit.y < -25 ? .22 : mode === 'lance' && hit.y > -9 ? .5 : 1;
      const amount = B.GEAR.drill.power[level] * tool.power * (mode === 'axe' && this.world.impactHead ? 2 : 1) * efficiency * dt / layer.resistance * (hit.y < -80 && this.world.deepUpgrades?.includes(0) ? 2 : 1);
      // Project rim contacts onto the center line, keeping the tunnel wide enough for the capsule.
      const brush = B.cutBrush(player, radius, mode), shape = mode === 'scoop' || mode === 'lance' ? brush : null;
      const distance = hit.distance + radius * brush.axes[2] * .27;
      const target = { x: origin.x + direction.x * distance, y: origin.y + direction.y * distance, z: origin.z + direction.z * distance };
      this.contact = { ...hit, normal: this.world.normal(hit.x, hit.y, hit.z), layer: layer.name, protected: !this.world.canDig(hit.x,hit.y,hit.z,.2) };
      if (this.contact.protected) return;
      this.edited = this.world.carve(target, radius, amount, shape) > 0; this.target = target;
      // Interpolation can leave a sliver at a rim probe after the centered brush saturates.
      // Bite into that actual contact instead of repeatedly carving the same empty volume.
      if (!this.edited) { this.edited = this.world.carve(hit, radius, amount, shape) > 0; this.target = hit; }
    }
  }
  Object.assign(B, { Player, Cutter });
})(B2);
