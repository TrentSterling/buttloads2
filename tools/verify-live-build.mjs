// Read-only deployed asset comparison. No browser input or network game clients.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),version=JSON.parse(fs.readFileSync(new URL('package.json',root))).version;
const base=new URL('https://tront.xyz/buttloads2/'),stamp=Date.now();
const textHash=bytes=>createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g,'\n')).digest('hex');
const byteHash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function get(file,bust=true){const url=new URL(file,base);if(bust)url.searchParams.set('verify',version+'-'+stamp);const r=await fetch(url,{cache:'no-store',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,url.href+' status');return{bytes:Buffer.from(await r.arrayBuffer()),lastModified:r.headers.get('last-modified'),url:url.href};}
const local=fs.readFileSync(new URL('index.html',root)),index=await get('index.html'),plain=await get('');
const liveVersion=index.bytes.toString().match(/<meta name="application-version" content="([^"]+)"/)?.[1];
assert.equal(liveVersion,version,'Public version is stale');
assert.equal(textHash(index.bytes),textHash(local),'Public index differs');
assert.equal(textHash(plain.bytes),textHash(local),'Unversioned public URL differs');
const html=local.toString(),files=[...new Set([...html.matchAll(/<script src="([^"]+)"|<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]||m[2]).concat('og-image.png'))];
const results=[];let next=0;
await Promise.all(Array.from({length:6},async()=>{while(next<files.length){const file=files[next++];assert.ok(!file.includes('..')&&!/^[a-z]+:/i.test(file));const r=await get(file),expected=fs.readFileSync(new URL(file,root)),hash=/\.(js|css)$/.test(file)?textHash:byteHash;assert.equal(hash(r.bytes),hash(expected),file+' does not match the verified local build');results.push({file,status:200,sha256:hash(r.bytes),normalization:hash===textHash?'LF text':'exact bytes',bytes:r.bytes.length});}}));
results.sort((a,b)=>a.file.localeCompare(b.file));
const report={date:new Date().toISOString(),version,publicUrl:base.href,rootAndUnversionedIndexMatch:true,localIndexNormalizedSha256:textHash(local),lastModified:index.lastModified,assets:results.length,allAssetsMatch:true,files:results};
fs.mkdirSync(new URL('tools/out/',root),{recursive:true});fs.writeFileSync(new URL('tools/out/deployment-report.json',root),JSON.stringify(report,null,2));
console.log(`COMPLETE public ${version}: root index and ${results.length} referenced assets match the verified local files.`);
