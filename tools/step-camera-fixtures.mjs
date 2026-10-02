// Deterministic production Player fixtures; no browser or input events.
import {playerFrom,replay} from './movement-fixtures.mjs';
export const rates=[30,60,75,90,120,144,165,240];
export const checkpoints=Array.from({length:20},(_,i)=>(i+1)/10);
export function stairPlayer(text){
 const p=playerFrom(text);p.vx=3.8;p.grounded=true;
 p.obstacles=Array.from({length:8},(_,i)=>[1+i*.8,0,-2,1.8+i*.8,.16*(i+1),2]);
 return p;
}
export function checkpointSchedule(hz){
 // Insert common read times into the regular frame schedule. Some intervals
 // are shorter than 1/hz; this avoids comparing interpolated plot samples.
 const times=[0,...Array.from({length:hz*2},(_,i)=>(i+1)/hz),...checkpoints]
  .sort((a,b)=>a-b).filter((t,i,a)=>!i||t-a[i-1]>1e-10);
 return times.slice(1).map((t,i)=>t-times[i]);
}
export function stairReplay(text,hz,{matched=true}={}){
 const p=stairPlayer(text),times=matched?checkpointSchedule(hz):Array.from({length:hz*2},()=>1/hz);
 const trace=replay(p,times,new Set(['KeyD']));
 return {hz,trace,samples:matched?checkpoints.map(t=>trace.find(f=>Math.abs(f.time-t)<1e-8)):[],
  finalBody:{x:p.x,y:p.y,z:p.z,vx:p.vx,vy:p.vy,vz:p.vz},finalOffset:p.stepOffset,
  maxCameraStepM:Math.max(...trace.slice(1).map((f,i)=>Math.abs(f.camera.y-trace[i].camera.y)))};
}
