import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const sources={before:fs.readFileSync(new URL('./out/before-player.js',import.meta.url),'utf8'),after:fs.readFileSync(new URL('../src/player.js',import.meta.url),'utf8')};
const report={fixture:'Identical flat capsule floor, 120 Hz fixed step, normal walk speed unchanged at 3.8 m/s',results:{}};
for(const [label,source]of Object.entries(sources)){
 const context=vm.createContext({B2:{clamp:(v,l,h)=>Math.max(l,Math.min(h,v)),SURFACE:{minX:-150,maxX:150,minZ:-150,maxZ:150}}});vm.runInContext(source,context);const player=new context.B2.Player({density:(x,y,z)=>y,floor:-297});player.teleport(0,.06,0);const speeds=[];
 for(let i=0;i<60;i++){player.step(1/120,new Set(['KeyW']),6);if([5,11,23,59].includes(i))speeds.push({ms:(i+1)/120*1000,speed:Math.hypot(player.vx,player.vz)});}
 const distance=Math.hypot(player.x,player.z);for(let i=0;i<24;i++)player.step(1/120,new Set(),6);report.results[label]={speeds,distance500ms:distance,speedAfter200msBraking:Math.hypot(player.vx,player.vz)};
}
assert.ok(report.results.after.speeds[1].speed>report.results.before.speeds[1].speed);assert.ok(report.results.after.speedAfter200msBraking<.02);fs.writeFileSync(new URL('./out/polish-feel.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
