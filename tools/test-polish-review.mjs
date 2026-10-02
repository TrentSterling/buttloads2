// Headless inspection of the portable presentation, with the CDP input guard.
import {launch,until} from './cdp.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const out=path.join(import.meta.dirname,'out'),page=await launch({port:9488,width:1440,height:1000}),report={slides:[],pointerLock:false,errors:[]};
try{
 await page.goto(pathToFileURL(path.join(out,'polish-review.html')).href);await until(()=>page.eval('!!window.__review'),{label:'review boot'});
 const count=await page.eval('__review.slides.length');assert.ok(count>=20);
 for(let i=0;i<count;i++){await page.eval('__review.show('+i+');true');await until(()=>page.eval('[...document.images].every(img=>img.complete&&img.naturalWidth>0)'),{label:'slide '+(i+1)});if(await page.eval('!document.getElementById("mode")?.hidden')){await page.eval('document.getElementById("mode").click();true');await until(()=>page.eval('[...document.images].every(img=>img.complete&&img.naturalWidth>0)'),{label:'first-person '+(i+1)});await page.eval('document.getElementById("mode").click();true');}report.slides.push(await page.eval('({title:document.getElementById("title").textContent,images:document.images.length})'));}
 const metrics=await page.eval('[...document.querySelectorAll(".metric strong")].map(el=>Number(el.textContent))');assert.ok(metrics.every(n=>Number.isInteger(n)&&n>0));assert.equal(metrics[1],JSON.parse(fs.readFileSync(path.join(out,'network/public-report.json'),'utf8')).checks.length);assert.equal(metrics[2],JSON.parse(fs.readFileSync(path.join(out,'network/public-standalone-report.json'),'utf8')).checks.length);report.metrics=metrics;
 await page.shot(path.join(out,'review-receipts.png'));await page.eval('__review.show(0);document.getElementById("split").value="25";document.getElementById("split").dispatchEvent(new Event("input"));true');assert.equal(await page.eval('document.getElementById("stage").style.getPropertyValue("--split")'),'25%');
 await page.shot(path.join(out,'review-title.png'));await page.eval('document.getElementById("next").click();true');assert.equal(await page.eval('document.getElementById("index").textContent'),'02 / '+count);
 await page.eval('document.getElementById("present").click();true');assert.equal(await page.eval('document.body.classList.contains("present")'),true);
 report.pointerLock=await page.eval('!!document.pointerLockElement');assert.equal(report.pointerLock,false);report.errors=page.logs.filter(log=>log.startsWith('EXCEPTION'));assert.deepEqual(report.errors,[]);
 console.log(`COMPLETE review: ${count} slides load, all images decode, comparison slider and navigation work, receipts ${metrics.join(' / ')}, zero exceptions and no pointer lock.`);
}finally{fs.writeFileSync(path.join(out,'review-report.json'),JSON.stringify(report,null,2));page.kill();}
