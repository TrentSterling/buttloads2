import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex');
const before=fs.readFileSync(new URL('hud-writes-before/index.html',out),'utf8'),after=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const parse=html=>[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json'));
const a=parse(before),b=parse(after),names=parse(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8')).map((m,i)=>m[1].match(/src="([^"]+)"/)?.[1]||'inline-'+i),changes=[];
assert.equal(a.length,71);assert.equal(b.length,a.length);
for(let i=0;i<a.length;i++){new vm.Script(b[i][2]);if(a[i][2]!==b[i][2])changes.push({file:names[i],beforeSha256:sha(a[i][2]),afterSha256:sha(b[i][2])});}
assert.deepEqual(changes.map(n=>n.file),['src/core.js','src/fieldkit.js','src/game.js']);
const markup=html=>html.replace(/<script([^>]*)>[\s\S]*?<\/script>/g,'<script$1></script>').replace(/(<meta name="application-version" content=")[^"]+/, '$1VERSION');assert.equal(markup(after),markup(before));
for(const [file,start,end]of [['game','    updateCombatHUD() {','    updateShop() {'],['fieldkit','    sync() {','\r\n  }\r\n  Object.assign']]){
 const rest=s=>(s.slice(0,s.indexOf(start))+s.slice(s.indexOf(end,s.indexOf(start)))).replace('  const D = B.DOM;\r\n','');
 assert.equal(rest(fs.readFileSync(new URL('../src/'+file+'.js',import.meta.url),'utf8')),rest(fs.readFileSync(new URL('hud-writes-before/'+file+'.js',out),'utf8')));
}
const oldCore=fs.readFileSync(new URL('hud-writes-before/core.js',out),'utf8'),newCore=fs.readFileSync(new URL('../src/core.js',import.meta.url),'utf8');
assert.equal(newCore.slice(0,newCore.indexOf('  // Compare the live model'))+newCore.slice(newCore.indexOf('  function random')).replace('Object.assign(B, { DOM,','Object.assign(B, {'),oldCore);
const report={date:new Date().toISOString(),beforeVersion:'2.43.1',afterVersion:'2.43.2',beforeBuildSha256:sha(before),afterBuildSha256:sha(after),executableScripts:71,changes,allOtherExecutableScriptsExact:true,stylesAndOtherMarkupExactExceptVersion:true,gameOutsideHudExact:true,fieldGuideAndControlHandlersExact:true,coreOutsideDomWriterExact:true,physicsCameraArtNetworkAndSaveSourcesExact:true};
fs.writeFileSync(new URL('hud-writes-build-diff.json',out),JSON.stringify(report,null,2));console.log('COMPLETE 71-script portable comparison: DOM writer, three hot HUD methods and version metadata alone change.');console.log(report.afterBuildSha256);
