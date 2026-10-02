import assert from 'node:assert/strict';import {nodeGame} from './node-game.mjs';
const h=await nodeGame(),g=h.game,v=g.view,T=THREE;
export let signMergeChecks=0;
const test=(name,fn)=>{fn();signMergeChecks++;console.log('PASS sign merge: '+name);};
const sign=(root,text='TEST',height=.45)=>v.sign(root,text,'READ ME',0,1,0,2.5,height);
try{
 test('native depot/town remove fifteen static meshes with bounded full-resolution atlas storage',()=>{
  let faces=0,pages=0,pixels=0,triangles=0;
  for(const root of [v.scene.children[10],v.townScene]){const signs=root.children.filter(m=>m.isMesh&&m.material.userData.signAtlas);assert.equal(signs.length,2);for(const mesh of signs){const m=mesh.material,c=m.map.image;pages++;pixels+=c.width*c.height;triangles+=mesh.geometry.attributes.position.count/3;faces+=mesh.geometry.attributes.position.count/6;assert.equal(m.map,m.emissiveMap);assert.equal(m.emissiveIntensity,.18);assert.equal(m.roughness,.85);assert.equal(c.width,1024);assert.ok(c.height<=2048);assert.equal(c.height&(c.height-1),0);assert.equal(mesh.castShadow,true);assert.equal(mesh.receiveShadow,true);for(const t of m.userData.signAtlas.tiles){assert.ok(t.y>=16&&t.y+t.height+16<=c.height);}}}
  assert.equal(faces,19);assert.equal(pages,4);assert.equal(triangles,38);assert.equal(pixels,5242880);assert.ok((pixels-4957184)*4<1.2*1024*1024);
 });
 test('different signs and duplicate lettering retain original indexed positions/normals and reversible UVs',()=>{
  const root=new T.Group(),meshes=[sign(root,'TEST'),sign(root,'TEST'),sign(root,'OTHER',.55)],original=meshes.map(m=>({position:m.geometry.attributes.position.array.slice(),normal:m.geometry.attributes.normal.array.slice(),uv:m.geometry.attributes.uv.array.slice(),key:m.material.userData.signSource.key,material:m.material,texture:m.material.map}));
  let disposedMaterial=0,disposedTexture=0;for(const o of original){o.material.addEventListener('dispose',()=>disposedMaterial++);o.texture.addEventListener('dispose',()=>disposedTexture++);}
  v.prepareSignAtlas(root);assert.equal(new Set(meshes.map(m=>m.material)).size,1);assert.equal(meshes[0].material.userData.signAtlas.tiles.length,2);
  for(let i=0;i<meshes.length;i++){const m=meshes[i],o=original[i],tile=m.material.userData.signAtlas.tiles.find(t=>t.key===o.key),height=m.material.map.image.height;assert.deepEqual(m.geometry.attributes.position.array,o.position);assert.deepEqual(m.geometry.attributes.normal.array,o.normal);assert.ok(m.geometry.index);for(let j=0;j<o.uv.length/2;j++){assert.equal(m.geometry.attributes.uv.getX(j),o.uv[j*2]);assert.ok(Math.abs((1-(1-m.geometry.attributes.uv.getY(j))*height/tile.height+tile.y/tile.height)-o.uv[j*2+1])<1e-6);}}
  assert.equal(disposedMaterial,3);assert.equal(disposedTexture,3);const atlas=meshes[0].material;v.prepareSignAtlas(root);assert.equal(meshes[0].material,atlas);
 });
 test('transparent, custom material, hidden and nested faces retain their independent textures',()=>{
  const root=new T.Group(),nested=new T.Group();root.add(nested);const a=sign(root,'A'),b=sign(root,'B'),hidden=sign(root,'HIDDEN'),transparent=sign(root,'GLASS'),custom=sign(root,'METAL'),child=sign(nested,'CHILD');hidden.visible=false;transparent.material.transparent=true;transparent.material.opacity=.5;custom.material.metalness=.5;
  const excluded=[hidden,transparent,custom,child],materials=excluded.map(m=>m.material),textures=excluded.map(m=>m.material.map);v.prepareSignAtlas(root);assert.equal(a.material,b.material);for(let i=0;i<excluded.length;i++){assert.equal(excluded[i].material,materials[i]);assert.equal(excluded[i].material.map,textures[i]);}assert.equal(child.parent,nested);assert.equal(hidden.visible,false);
 });
 test('both native office visibility states and ordinary unmapped merge stay independent',()=>{
  const closed=v.officeClosed.children.find(m=>m.material?.userData.signSource),open=v.officeOpen.children.find(m=>m.material?.userData.signSource);assert.ok(closed&&open);const materials=[closed.material,open.material];
  for(const rescued of [false,true,false,true]){g.rescue.state.phase=rescued?'rescued':'stranded';v.renderTown(g,0,0);assert.equal(v.officeOpen.visible,rescued);assert.equal(v.officeClosed.visible,!rescued);assert.equal(v.officeLight.intensity,rescued?.75:0);assert.equal(closed.material,materials[0]);assert.equal(open.material,materials[1]);assert.equal(closed.material.userData.signAtlas,undefined);assert.equal(open.material.userData.signAtlas,undefined);}
  const root=new T.Group(),a=sign(root,'A'),b=sign(root,'B'),materialsBefore=[a.material,b.material];v.merge(root);assert.equal(root.children.length,2);assert.equal(a.material,materialsBefore[0]);assert.equal(b.material,materialsBefore[1]);
 });
}finally{h.close();clearInterval(g.net.timer);}
console.log(`COMPLETE ${signMergeChecks} sign merge checks passed (inert renderer; no input or timing claim)`);
