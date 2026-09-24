/* Append-only neighboring claims. The original mine keeps its field and ore IDs. */
'use strict';
(function(B){
  const EASTCUT=Object.freeze({version:1,name:'Eastcut',price:1500,minX:14,maxX:46,minZ:-14,maxZ:-2,bottom:-80,floor:-73,nx:64,ny:165,nz:65});
  function claimContains(east,x,z,margin=0){
    if(z<=-14+margin || z>=14-margin || x<=-14+margin)return false;
    return x<14-margin || !!east && z<-2-margin && x<46-margin;
  }
  class ParcelTerrain {
    constructor(seed){
      const rng=B.random(seed^0x63d48f27),j=()=>rng()*.8-.4;
      this.rooms=[{x:24+j(),y:-18+j(),z:-8+j(),r:3.4},{x:39+j(),y:-35+j(),z:-8+j(),r:3.5},{x:27+j(),y:-58+j(),z:-8+j(),r:3.3}];
      this.paths=[];
      for(let i=0;i<2;i++){const a=this.rooms[i],b=this.rooms[i+1];this.paths.push([a,{x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:-10},b]);}
    }
    density(x,y,z){
      let d=y;
      if(y>-10 || y<-65 || x<19 || x>44 || z<-13 || z>-3)return B.clamp(d,-2,2);
      for(const r of this.rooms)d=Math.max(d,r.r-Math.hypot((x-r.x)*.85,(y-r.y)*1.2,z-r.z));
      for(const path of this.paths)for(let i=1;i<path.length;i++){
        const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,t=B.clamp(((x-a.x)*dx+(y-a.y)*dy+(z-a.z)*dz)/(dx*dx+dy*dy+dz*dz),0,1);
        d=Math.max(d,1.65-Math.hypot(x-a.x-dx*t,y-a.y-dy*t,z-a.z-dz*t));
      }
      return B.clamp(d,-2,2);
    }
    field(){
      const f=new Float32Array(EASTCUT.nx*EASTCUT.ny*EASTCUT.nz);
      for(let z=0;z<65;z++)for(let y=0;y<165;y++)for(let x=0;x<64;x++)f[x+64*(y+165*z)]=this.density(16.5+x*.5,-80+y*.5,-16+z*.5);
      return f;
    }
  }
  function appendParcelDeposits(seed,nodes,veins){
    const rng=B.random(seed^0x31fd8264);
    for(let i=0;i<58;i++){
      const x=18+rng()*25,y=-3-rng()*65,z=-11.5+rng()*6.5,kind=y>-14?1:y>-30?2:y>-52?3:4,id=veins.length;
      veins.push({x,y,z,kind,radius:2.5,name:'Eastcut '+B.ORES[kind].name.toLowerCase()+' seam'});
      for(let j=0;j<6;j++)nodes.push({id:nodes.length,x:B.clamp(x+(j-2.5)*.35,17,44),y:y-j*.18,z:z+Math.sin(j)*.35,kind,vein:id,radius:.2+rng()*.12,collected:false});
    }
  }
  Object.assign(B,{EASTCUT,ParcelTerrain,appendParcelDeposits,claimContains});
})(B2);
