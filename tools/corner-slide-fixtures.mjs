import {playerFrom,flat} from './movement-fixtures.mjs';
import {createHash} from 'node:crypto';
export const seamCases=[.2,.5,1,2].flatMap(width=>[0,.001,-.001].map(inset=>({name:width+' m joints / '+inset+' m offset',width,inset})));
export function seamReplay(source,{width,inset},hz=120){
 const p=playerFrom(source,flat);p.teleport(.699,-.02995,-3);p.grounded=true;p.vz=3.8/Math.SQRT2;
 p.obstacles=Array.from({length:40},(_,i)=>[1+inset*(i%2),0,-4+i*width,2,3,-4+(i+1)*width]);
 const trace=[],keys=new Set(['KeyD','KeyS']);let accumulator=0;
 for(let i=0;i<hz*2;i++){accumulator+=1/hz;while(accumulator>=1/120){p.step(1/120,keys,6);accumulator-=1/120;}
  trace.push({time:(i+1)/hz,x:p.x,y:p.y,z:p.z,vx:p.vx,vz:p.vz,camera:{...p.cameraPose(accumulator*120)},blocked:p.blocked(p.x,p.y,p.z)});
 }
 const speeds=trace.slice(1).map((s,i)=>(s.camera.z-trace[i].camera.z)*hz),settled=speeds.slice(Math.ceil(hz/6));
 return {hz,trace,distance:trace.at(-1).z+3,minTangential:Math.min(...settled),stoppedFrames:settled.filter(n=>n<.01).length,traceSha256:createHash('sha256').update(JSON.stringify(trace)).digest('hex')};
}
