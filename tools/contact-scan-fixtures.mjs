// Production-controller replay only. No browser, input events or pointer lock.
import {playerFrom} from './movement-fixtures.mjs';
import {createHash} from 'node:crypto';

export const nativeRoutes=[
 {name:'depot strafe',at:[0,.06,11.5],keys:['KeyD'],seconds:2},
 {name:'yard diagonal',at:[-6,.06,9],keys:['KeyW','KeyD'],seconds:2},
 {name:'well approach',at:[5,0,49],surface:true,keys:['KeyW'],seconds:2},
 {name:'western slope',at:[-42,0,32],surface:true,keys:['KeyD'],seconds:2},
 {name:'upper mine',room:'upper',keys:['KeyW','KeyD'],seconds:2},
 {name:'deep mine',room:'deep',keys:['KeyA','KeyW'],seconds:2},
 {name:'lift',at:[6,.06,6],keys:['Space','KeyD'],seconds:2},
 {name:'sprint and turn',at:[-6,.06,9],keys:['KeyW','ShiftLeft'],turn:true,seconds:2},
];
const body=p=>[p.x,p.y,p.z,p.vx,p.vy,p.vz,p.grounded,p.stepOffset,p.previousStepOffset,p.previous.x,p.previous.y,p.previous.z,p.liftTime,p.yaw,p.pitch];
export function contactReplay(text,world,boxes,route,{instrument=true}={}){
 const counts={density:0,obstacleReads:0,queries:0,maxQueryBoxes:0};
 const observedWorld=instrument?new Proxy(world,{get(target,key){if(key==='density')return(...args)=>{counts.density++;return target.density(...args);};const v=Reflect.get(target,key);return typeof v==='function'?v.bind(target):v;}}):world;
 const p=playerFrom(text,observedWorld);p.teleport(...route.at);p.yaw=route.yaw||0;
 const wrapped=instrument?boxes.map(box=>new Proxy(box,{get(target,key){if(typeof key==='string'&&/^[0-5]$/.test(key))counts.obstacleReads++;return Reflect.get(target,key);}})):boxes;
 p.obstacles=wrapped;
 if(instrument){const blocked=p.blocked;p.blocked=function(...args){counts.queries++;counts.maxQueryBoxes=Math.max(counts.maxQueryBoxes,(this.collisionObstacles||this.obstacles).length);return blocked.apply(this,args);};}
 const initiallyBlocked=p.blocked(p.x,p.y,p.z);Object.assign(counts,{density:0,obstacleReads:0,queries:0,maxQueryBoxes:0});
 const trace=[],keys=new Set(route.keys),dt=route.dt||1/120,ticks=Math.round(route.seconds/dt);
 for(let i=0;i<ticks;i++){
  if(route.turn)p.look(2,0,1);
  if(route.mutate)route.mutate(p,i);
  const old={...counts};p.step(dt,keys,6);
  const state=body(p),camera={...p.cameraPose(.35)};
  trace.push({time:(i+1)*dt,state,camera,density:counts.density-old.density,obstacleReads:counts.obstacleReads-old.obstacleReads,queries:counts.queries-old.queries});
 }
 const states=trace.map(t=>[t.state,t.camera]);
 return {name:route.name,start:route.at,initiallyBlocked,ticks,counts,trace,final:body(p),traceSha256:createHash('sha256').update(JSON.stringify(states)).digest('hex')};
}
