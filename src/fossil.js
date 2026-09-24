/* A supported fossil, illuminated field study and the lantern keeper's reward. */
'use strict';
(function(B){
  const bones=[],segments=(points,r)=>{for(let i=1;i<points.length;i++)bones.push({a:points[i-1],b:points[i],r});};
  segments([[-4,-.35,0],[-3,.22,0],[-1.5,.7,0],[0,.7,0],[1.5,.58,0],[2.6,.2,0]],.16);
  for(const x of [-2.7,-1.8,-.9,0,.9,1.8])for(const side of [-1,1]){
    const size=.75+.25*Math.sin((x+3.3)/6*Math.PI),points=[];
    for(let j=0;j<=8;j++){const angle=j/8*2.5;points.push([x+Math.sin(angle)*.13,.7-(1-Math.cos(angle))*1.15*size,side*Math.sin(angle)*1.4*size]);}
    for(let j=1;j<points.length;j++)segments([points[j-1],points[j]],.13-j*.007);
  }
  for(const side of [-1,1]){
    segments([[2.2,.16,side*.14],[2.85,-.28,side*.5],[4,-.18,side*.2]],.14);
    segments([[2.65,.4,side*.3],[2.2,.85,side*.55]],.11);
    segments([[-3.4,-.2,0],[-4.2,.22,side*.68]],.095);
  }
  const skull={p:[3,.23,0],size:[.95,.4,.5]},plates=[[-2.5,.32,.7],[0,.45,.7],[2.55,.38,.4]],names=['Tail fan','Rib vault','Lantern skull'];
  const offsets=[];
  for(const {a,b,r} of bones){
    const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),axis=d.map(v=>v/length),base=Math.abs(axis[1])<.9?[0,1,0]:[1,0,0];
    const u=[axis[1]*base[2]-axis[2]*base[1],axis[2]*base[0]-axis[0]*base[2],axis[0]*base[1]-axis[1]*base[0]],ul=Math.hypot(...u);for(let i=0;i<3;i++)u[i]/=ul;
    const v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]],steps=Math.max(1,Math.ceil(length/.3));
    for(let j=0;j<=steps;j++)for(let k=0;k<8;k++){const t=k*Math.PI/4;offsets.push(a.map((n,i)=>n+d[i]*j/steps+r*(u[i]*Math.cos(t)+v[i]*Math.sin(t))));}
  }
  for(let i=0;i<12;i++)for(let j=0;j<=6;j++){const a=i*Math.PI/6,b=j*Math.PI/6;offsets.push([skull.p[0]+skull.size[0]*Math.sin(b)*Math.cos(a),skull.p[1]+skull.size[1]*Math.cos(b),skull.p[2]+skull.size[2]*Math.sin(b)*Math.sin(a)]);}
  for(const p of plates)for(const o of [[.13,0,0],[-.13,0,0],[0,.13,0],[0,-.13,0],[0,0,.13],[0,0,-.13]])offsets.push(p.map((n,i)=>n+o[i]));
  const zone=p=>p[0]<-1.25?0:p[0]<1.25?1:2,groups=[0,1,2].map(id=>offsets.filter(p=>zone(p)===id));
  const point=n=>({x:n.x,y:n.y,z:n.z}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  class Fossil {
    static site(world){if(!world.depthVersion)return null;const r=(world.deepTerrain||new B.DeepTerrain(world.seed)).rooms[3];return {x:r.x,y:r.y-1,z:r.z+6};}
    constructor(world,progress){
      this.world=world;this.progress=progress;this.state=progress.expedition.fossil||={version:1,known:false,plates:[],recovered:false,lenses:false,bodies:[]};
      const site=Fossil.site(world);this.nodes=site?[{id:0,...site,kind:0,radius:4.5,size:[8.6,2.8,3.1],collected:false,offsets}]:[];
      this.physics=new B.OreSystem(world,this.nodes,this.state.bodies);this.physics.supportRadius=5;this.events=[];this.elapsed=1;
    }
    get body(){return this.nodes[0];}
    point(id){const n=this.body,p=plates[id];return n&&{x:n.x+p[0],y:n.y+p[1],z:n.z+p[2]};}
    cover(id){const n=this.body;if(!n)return null;let hit={density:Infinity};for(const p of groups[id]){const q={x:n.x+p[0],y:n.y+p[1],z:n.z+p[2]},density=this.world.density(q.x,q.y,q.z);if(density<hit.density)hit={...q,density};}return hit;}
    exposed(id){const hit=this.cover(id);return !!hit&&hit.density>=-.0041;}
    illuminated(id,gadgets){const p=this.point(id);return p&&gadgets.nodes.some(n=>n.type==='lamp'&&distance(n,p)<3.5&&this.world.clearLine({x:n.x,y:n.y+.23,z:n.z},p,.025));}
    aimed(player,p,reach){const h=player.head,d=player.direction,r=distance(h,p);return r>.1&&r<=reach&&((p.x-h.x)*d.x+(p.y-h.y)*d.y+(p.z-h.z)*d.z)/r>.82&&this.world.clearLine(h,p,.05);}
    scan(player,range,gadgets){
      const n=this.body,s=this.state;if(!n||distance(player.head,n)>range)return [];
      s.known=true;
      if(this.progress.expedition.deep?.open&&!s.recovered)for(let i=0;i<3;i++)if(!s.plates.includes(i)&&this.aimed(player,this.point(i),5.5)){
        if(!this.exposed(i))this.events.push({text:names[i]+': expose the surrounding bones before scanning.'});
        else if(!this.illuminated(i,gadgets))this.events.push({text:names[i]+': place a work light within 3.5 metres, with a clear path to the marking.'});
        else{s.plates.push(i);this.events.push({text:names[i]+` recorded / ${s.plates.length}/3. `+(s.plates.length===3?'The skull is warm. E recovers its ember.':'Follow the pale ribs to the next marking.'),tone:720+i*130});}
      }
      return [{...point(n),scanKey:'fossil',name:'The lantern leviathan',color:'#e9d9ae'}];
    }
    interaction(player){
      if(!this.body||!this.state.known||!this.aimed(player,this.point(2),3.3))return null;
      const s=this.state;return {kind:'fossil',locked:s.recovered||s.plates.length<3||!this.progress.expedition.deep?.open,label:s.recovered?'The lantern leviathan / ember recovered':s.plates.length<3?`Illuminate and scan the fossil / ${s.plates.length}/3 markings`:'Recover the warm ember from the skull'};
    }
    recover(player){
      const a=this.interaction(player);if(!a||a.locked)return false;this.state.recovered=true;
      this.events.push({title:'Something kept the light.',text:'A warm bead slips from the fossil skull. The bone goes quiet. Back in Ridge Common, a lantern cart has appeared west of the well. Nell Wick seems to have been expecting you. Bring her the ember.'});return true;
    }
    buyLenses(economy){if(!this.state.recovered||this.state.lenses||economy.state.cash<350)return false;economy.state.cash-=350;this.state.lenses=true;return true;}
    obstacles(){const n=this.body;if(!n)return [];const boxes=bones.map(({a,b,r})=>[Math.min(a[0],b[0])-r+n.x,Math.min(a[1],b[1])-r+n.y,Math.min(a[2],b[2])-r+n.z,Math.max(a[0],b[0])+r+n.x,Math.max(a[1],b[1])+r+n.y,Math.max(a[2],b[2])+r+n.z]);boxes.push(...[skull].map(s=>[...s.p.map((v,i)=>v-s.size[i]+[n.x,n.y,n.z][i]),...s.p.map((v,i)=>v+s.size[i]+[n.x,n.y,n.z][i])]));return boxes;}
    update(dt,player){let changed=this.physics.update(dt);this.elapsed+=dt;if(this.body&&!this.state.known&&this.elapsed>.4){this.elapsed=0;for(let i=0;i<3;i++){const p=this.point(i);if(distance(player.head,p)<6&&this.world.clearLine(player.head,p,.05)){this.state.known=true;changed=true;break;}}}return changed;}
    markers(){return this.body&&this.state.known?[{...point(this.body),type:'fossil',name:this.state.recovered?'Lantern leviathan / studied':`Lantern leviathan / ${this.state.plates.length}/3 markings`,color:'#e8d5ae'}]:[];}
    save(){this.state.bodies=this.physics.snapshot();}
    static validate(s,world,progress){
      const finite=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
      if(!s||s.version!==1||['known','recovered','lenses'].some(k=>typeof s[k]!=='boolean')||!Array.isArray(s.plates)||s.plates.length>3||new Set(s.plates).size!==s.plates.length||s.plates.some(n=>!Number.isInteger(n)||n<0||n>2)||s.plates.length&&(!s.known||!progress.expedition.deep?.open)||s.recovered&&s.plates.length!==3||s.lenses&&!s.recovered||!Array.isArray(s.bodies)||s.bodies.length>1||!world.depthVersion&&(s.known||s.recovered||s.plates.length||s.bodies.length))throw Error('Invalid lantern fossil.');
      for(const n of s.bodies)if(!n||n.id!==0||!finite(n.x,-14,14)||!finite(n.z,-14,14)||!finite(n.y,world.floor,-80)||!['vx','vy','vz'].every(k=>finite(n[k],-25,25))||offsets.some(o=>world.density(n.x+o[0],n.y+o[1],n.z+o[2])<-.01))throw Error('Invalid fossil support or position.');
      return {version:1,known:s.known,plates:[...s.plates],recovered:s.recovered,lenses:s.lenses,bodies:s.bodies.map(n=>({id:0,...point(n),vx:n.vx,vy:n.vy,vz:n.vz}))};
    }
  }
  Object.assign(B,{Fossil,FOSSIL_ART:{bones,skull,plates,names,offsets}});
})(B2);
