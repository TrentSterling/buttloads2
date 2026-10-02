// Native geometry diagnostic, without browser input or performance timing.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nodeGame} from './node-game.mjs';
const root=new URL('../',import.meta.url),out=new URL('out/',import.meta.url),sha=file=>createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex');
const before=JSON.parse(fs.readFileSync(new URL('meadow-before/report.json',out))),windBefore=JSON.parse(fs.readFileSync(new URL('meadow-wind-before.json',out))),h=await nodeGame();
try{
 const v=h.game.view,groups={},a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
 let maxPlacementDifference=0;const same=(actual,expected)=>{if(typeof actual==='number'){const delta=Math.abs(actual-expected);maxPlacementDifference=Math.max(maxPlacementDifference,delta);assert.ok(delta<1e-10,'cross-runtime placement differs');}else if(actual&&typeof actual==='object'){assert.deepEqual(Object.keys(actual),Object.keys(expected));for(const key of Object.keys(actual))same(actual[key],expected[key]);}else assert.equal(actual,expected);};
 same(v.commonMeadow,before.inventory.meadow);same(v.commonTrees,before.inventory.trees);same(JSON.parse(JSON.stringify(v.obstacles)),before.inventory.obstacles);
 assert.equal(sha('tools/out/meadow-before/polish.js'),windBefore.polishSourceSha256);
 for(const [name,meshes]of [['verge',v.verge.children],['yardTufts',[v.yardTufts]],['windGrass',[v.windGrass]]]){
  let triangles=0,minArea=Infinity,minNormal=Infinity,maxNormal=0;
  for(const mesh of meshes){
   const g=mesh.geometry,p=g.attributes.position,normal=g.attributes.normal;assert.equal(normal.count,p.count);assert.equal(g.attributes.color.count,p.count);
   for(const attr of Object.values(g.attributes))assert.ok(attr.array.every(Number.isFinite));
   for(let j=0;j<p.count;j++){n.fromBufferAttribute(normal,j);minNormal=Math.min(minNormal,n.length());maxNormal=Math.max(maxNormal,n.length());}
   const count=g.index?.count||p.count;triangles+=count/3;
   for(let j=0;j<count;j+=3){const index=k=>g.index?g.index.getX(k):k;a.fromBufferAttribute(p,index(j));b.fromBufferAttribute(p,index(j+1)).sub(a);c.fromBufferAttribute(p,index(j+2)).sub(a);minArea=Math.min(minArea,b.cross(c).length()*.5);}
  }
  assert.ok(minArea>1e-12,name+' degenerate triangle');assert.ok(minNormal>.9999&&maxNormal<1.0001,name+' invalid normals');groups[name]={triangles,meshes:meshes.length,minArea,minNormal,maxNormal};
 }
 const p=v.windGrass.geometry.attributes.position,w=v.windGrass.geometry.attributes.windWeight,random=B2.random(28945);assert.equal(w.count,p.count);let blade=0,maxRootError=0;
 // Replay the unchanged baseline placement stream, independent of blade shape.
 for(let i=0;i<2200;i++){
  const x=(random()-.5)*150,z=(random()-.5)*150;if(!B2.COMMON.planting(x,z,.2))continue;random();random();random();const k=blade*5;
  maxRootError=Math.max(maxRootError,Math.hypot((p.getX(k)+p.getX(k+1))*.5-x,(p.getZ(k)+p.getZ(k+1))*.5-z));
  assert.equal(w.getX(k),0);assert.equal(w.getX(k+1),0);assert.equal(w.getX(k+4),1);
  for(let j=0;j<5;j++)assert.ok(w.getX(k+j)>=0&&w.getX(k+j)<=1);blade++;
 }
 assert.equal(blade,windBefore.triangles);assert.equal(p.count,blade*5);assert.ok(maxRootError<1e-5);
 const report={date:new Date().toISOString(),version:JSON.parse(fs.readFileSync(new URL('package.json',root))).version,groups,meadowTreeContactPlacementTolerance:1e-10,maxPlacementDifference,windBlades:blade,windRootPlacementTolerance:1e-5,maxRootError,windRootWeight:0,windTipWeight:1,sourceSha256:Object.fromEntries(['common-view.js','yard-art.js','polish.js'].map(file=>[file,sha('src/'+file)]))};
 fs.writeFileSync(new URL('meadow-geometry-report.json',out),JSON.stringify(report,null,2));console.log('COMPLETE meadow diagnostic: finite attributes, unit normals, nondegenerate triangles, placement/contact records within stated cross-runtime tolerance and '+blade+' anchored wind blades.');
}finally{h.close();}
