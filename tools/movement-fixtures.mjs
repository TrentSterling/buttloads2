// Deterministic movement replay. No browser, pointer capture, or OS input.
import fs from 'node:fs';
import vm from 'node:vm';
export const flat={density:(x,y,z)=>y,normal:()=>[0,1,0],floor:-297};
export function playerFrom(source,world=flat){
 const context=vm.createContext({B2:{clamp:(v,l,h)=>Math.max(l,Math.min(h,v)),SURFACE:{minX:-58,maxX:58,minZ:-50,maxZ:68}}});
 vm.runInContext(source,context);const p=new context.B2.Player(world);p.teleport(0,.06,0);return p;
}
export const source=()=>fs.readFileSync(new URL('../src/player.js',import.meta.url),'utf8');
export function replay(p,times,keys=new Set(['KeyW']),speed=6){
 let accumulator=0,time=0;const trace=[];
 for(const dt of times){time+=dt;accumulator+=dt;while(accumulator>=1/120){p.step(1/120,keys,speed);accumulator-=1/120;}
  const pose=p.cameraPose?p.cameraPose(accumulator*120,dt):{x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch};
  trace.push({time,dt,x:p.x,y:p.y,z:p.z,camera:pose,speed:Math.hypot(p.vx,p.vz),grounded:p.grounded});
 }
 return trace;
}
export function cadence(hz,sourceText=source()){
 const p=playerFrom(sourceText);p.vz=-3.8;p.grounded=true;
 const trace=replay(p,Array.from({length:hz*2},()=>1/hz)),errors=trace.slice(20).map((f,i)=>Math.abs((f.camera.z-trace[i+19].camera.z)/f.dt+3.8));
 return {hz,zeroMovementFrames:trace.slice(20).filter((f,i)=>Math.abs(f.camera.z-trace[i+19].camera.z)<1e-9).length,maxSpeedError:Math.max(...errors),rmsSpeedError:Math.sqrt(errors.reduce((s,v)=>s+v*v,0)/errors.length),trace};
}
export const ramp={density:(x,y,z)=>y-x*.25,normal:()=>[-.25,1,0],floor:-297};
export const diagonal={density:(x,y,z)=>Math.min(y,(z-x+2)/Math.SQRT2),normal:(x,y,z)=>(z-x+2)/Math.SQRT2<y?[-Math.SQRT1_2,0,Math.SQRT1_2]:[0,1,0],floor:-297};
export function slope(sourceText=source()){
 const p=playerFrom(sourceText,ramp);p.vx=3.8;p.grounded=true;
 const trace=replay(p,Array.from({length:144*2},()=>1/144),new Set(['KeyD']));
 const jumps=trace.slice(1).map((f,i)=>Math.abs(f.camera.y-trace[i].camera.y));
 return {maxCameraStep:Math.max(...jumps),distance:p.x,trace};
}
