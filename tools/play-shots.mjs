// Headless playthrough with screenshots: start screen, yard, first dig, shop, deep. Local server, zero deps.
import {launch, sleep, until} from './cdp.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..'); const out = path.join(root, 'tools', 'out'); fs.mkdirSync(out, {recursive: true});
const server = http.createServer((req, res) => { const f = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]); try { res.end(fs.readFileSync(f)); } catch { res.statusCode = 404; res.end(); } }).listen(0);
const P = await launch({port: 9470, width: 1280, height: 800});
await P.goto(`http://127.0.0.1:${server.address().port}/`);
await until(() => P.eval("window.__dirt && __dirt.ready && document.getElementById('loading').hidden"), {timeout: 90000, label: 'boot'});
await P.shot(path.join(out, 'p0-start.png'));
await P.eval('__dirt.play(); 1'); await sleep(400);
await P.shot(path.join(out, 'p1-yard.png'));
await P.eval('__dirt.setLook(Math.PI, -0.1); 1'); await sleep(300); await P.shot(path.join(out, 'p2-workshop.png'));
await P.eval('__dirt.setLook(0, -0.6); 1');
for (let y = 0.4; y > -8; y -= 1.0) { await P.eval(`__dirt.excavate(new __dirt.V(0,${y},4),1.6); 1`); await sleep(60); }
await sleep(1500); await P.shot(path.join(out, 'p3-dug.png'));
await P.eval('__dirt.player.feet.set(0,-6,4); __dirt.setLook(0.8,-0.5); 1'); await sleep(1500); await P.shot(path.join(out, 'p4-inhole.png'));
console.log('state', await P.eval('JSON.stringify(__dirt.state)'));
console.log('ore total', await P.eval('__dirt.state.mined'));
console.log('logs', P.logs.slice(0, 10));
P.kill(); server.close(); process.exit(0);
