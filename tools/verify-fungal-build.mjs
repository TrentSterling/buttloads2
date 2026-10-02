import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';import {createHash} from 'node:crypto';
const out=new URL('out/',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex'),before=fs.readFileSync(new URL('fungal-art-before/index.html',out),'utf8'),after=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const parse=html=>[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json'));
const a=parse(before),b=parse(after),names=[...fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/ld+json')).map((m,i)=>m[1].match(/src="([^"]+)"/)?.[1]||'inline-'+i);
assert.equal(a.length,71);assert.equal(b.length,a.length);assert.equal(names.length,a.length);const changes=[];
for(let i=0;i<a.length;i++){new vm.Script(b[i][2]);if(a[i][2]!==b[i][2])changes.push({file:names[i],beforeSha256:sha(a[i][2]),afterSha256:sha(b[i][2])});}
assert.deepEqual(changes.map(n=>n.file),['src/beauty.js','src/cave-form-art.js']);
const markup=html=>html.replace(/<script([^>]*)>[\s\S]*?<\/script>/g,'<script$1></script>').replace(/(<meta name="application-version" content=")[^"]+/, '$1VERSION');assert.equal(markup(after),markup(before));
const report={date:new Date().toISOString(),beforeVersion:'2.42.1',afterVersion:'2.43.0',beforeBuildSha256:sha(before),afterBuildSha256:sha(after),executableScripts:71,changes,allOtherExecutableScriptsExact:true,stylesAndOtherMarkupExactExceptVersion:true,roomProtocolAndSaveSourcesExact:true};
fs.writeFileSync(new URL('fungal-art-build-diff.json',out),JSON.stringify(report,null,2));console.log('COMPLETE 71-script portable comparison: fungal construction/helper and version metadata alone change.');console.log(report.afterBuildSha256);
