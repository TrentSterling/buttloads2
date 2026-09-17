// Load the deployed page over HTTPS: boot, start, dig, confirm the IndexedDB save lands on the real origin.
import {launch, sleep, until} from './cdp.mjs';
const url = process.argv[2] || 'https://tront.xyz/buttloads2/';
const P = await launch({port: 9465, width: 1280, height: 800});
await P.goto(url);
await until(() => P.eval("window.__dirt && __dirt.ready && document.getElementById('loading').hidden"), {timeout: 90000, label: 'boot'});
console.log('origin', await P.eval('location.origin'), 'secure', await P.eval('isSecureContext'));
await P.eval('__dirt.play(); 1');
await sleep(300);
console.log('running', await P.eval('__dirt.running'));
for (let y = 0.4; y > -6; y -= 1.2) { await P.eval(`__dirt.excavate(new __dirt.V(0,${y},1),2.2); 1`); await sleep(40); }
await sleep(4000);
console.log('state', await P.eval('JSON.stringify({cash:__dirt.state.cash,mined:__dirt.state.mined,cargo:__dirt.state.cargo,deepest:__dirt.state.deepest})'));
console.log('idb', await P.eval('indexedDB.databases().then(d=>JSON.stringify(d))'));
console.log('export', await P.eval('(()=>{try{__dirt.exportSave();return "ok"}catch(e){return e.message}})()'));
await sleep(800);
console.log('toast', await P.eval("document.getElementById('toast')?.textContent"));
console.log('exceptions', P.logs.filter(l => /EXCEPTION|error/i.test(l)).slice(0, 10));
P.kill(); process.exit(0);
