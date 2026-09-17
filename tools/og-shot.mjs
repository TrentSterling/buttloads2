// Capture 1200x630 in-engine OG candidates into tools/out/og-*.png: a fresh claim with a shaft dug down the middle.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import {launch, sleep, until} from './cdp.mjs';
const root = path.resolve(import.meta.dirname, '..');
const server = http.createServer((req, res) => { res.writeHead(200, {'content-type': 'text/html'}); res.end(fs.readFileSync(path.join(root, 'index.html'))); }).listen(0);
const out = path.join(root, 'tools', 'out'); fs.mkdirSync(out, {recursive: true});
const P = await launch({port: 9462, width: 1200, height: 630});
await P.goto(`http://127.0.0.1:${server.address().port}/`);
await until(() => P.eval("window.__dirt && __dirt.ready && document.getElementById('loading').hidden"), {timeout: 60000, label: 'boot'});
await P.eval('__dirt.play(); 1');
await sleep(300);
const hideChrome = "for (const e of document.querySelectorAll('.hud,#aim,.overlay,#toast')) e.style.setProperty('display','none','important'); 1";
// Dig a shaft straight down in front of the yard, widening at the top, then stand at the lip looking in.
const dig = async (x, y, z, r) => { await P.eval(`__dirt.excavate(new __dirt.V(${x},${y},${z}),${r}); 1`); await sleep(30); };
await dig(0, 0.4, 1, 3.2); await dig(0, -1.5, 1, 2.8);
for (let y = -2; y > -16; y -= 1.2) await dig(Math.sin(y) * .4, y, 1 + Math.cos(y) * .4, 2.1);
await dig(1.5, -9, 1, 2.6); await dig(-1.6, -13, 1.2, 2.6);
await P.eval('__dirt.player.feet.set(0,0.01,5.6); __dirt.player.velocity.set(0,0,0); __dirt.setLook(0,-0.72); __dirt.movePlayer(0); 1');
await sleep(400);
for (let i = 0; i < 4; i++) { await P.eval(hideChrome); await P.shot(path.join(out, `og-${i}-lip.png`)); await P.eval(`__dirt.setLook(${(i - 1.5) * 0.08}, ${-0.55 - i * 0.12}); 1`); await sleep(300); }
// From the far edge of the yard: hole in front, workshop and fence behind it.
await P.eval('__dirt.player.feet.set(0,0.01,-6.5); __dirt.player.velocity.set(0,0,0); __dirt.setLook(Math.PI,-0.42); __dirt.movePlayer(0); 1');
await sleep(300);
for (let i = 0; i < 3; i++) { await P.eval(hideChrome); await P.shot(path.join(out, `og-yard-${i}.png`)); await P.eval(`__dirt.setLook(Math.PI + ${(i - 1) * 0.15}, ${-0.42 - i * 0.1}); 1`); await sleep(250); }
// Inside the shaft looking down at an angle.
await P.eval('__dirt.player.feet.set(0,-5.5,1); __dirt.setLook(0.6,-0.85); __dirt.movePlayer(0); 1');
await sleep(400);
for (let i = 4; i < 7; i++) { await P.eval(hideChrome); await P.shot(path.join(out, `og-${i}-inside.png`)); await P.eval(`__dirt.setLook(${0.6 + (i - 4) * 1.2}, -0.85); 1`); await sleep(300); }
console.log('state', await P.eval('JSON.stringify({cash:__dirt.state.cash,mined:__dirt.state.mined,feet:__dirt.player.feet.toArray()})'));
console.log('exceptions', P.logs.filter(l => /EXCEPTION|error/i.test(l)).slice(0, 10));
P.kill(); server.close(); process.exit(0);
