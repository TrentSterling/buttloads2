import { launch, sleep, until } from './cdp.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const root = path.resolve(import.meta.dirname, '..'), out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  try { res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.html') ? 'text/html' : 'image/png'); res.end(fs.readFileSync(file)); } catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
let P, passed = 0;
const check = (name, value) => { assert.ok(value, name); console.log('PASS ' + name); passed++; };
try {
  P = await launch({ port: 9484, width: 1440, height: 900 });
  const ev = source => P.eval(source), shot = name => P.shot(path.join(out, 'remake-' + name + '.png'));
  const press = async (code, down = true) => P.call('Input.dispatchKeyEvent', { type: down ? 'keyDown' : 'keyUp', code, key: code === 'Space' ? ' ' : code.replace('Key', '').toLowerCase() });
  const click = async id => { const r = await ev(`(()=>{const r=document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`); await P.mouse('mousePressed', r.x, r.y); await P.mouse('mouseReleased', r.x, r.y); };
  const url = `http://127.0.0.1:${server.address().port}/`;
  await P.goto(url);
  await until(() => ev('window.__buttloads?.ready'), { timeout: 90000, label: 'remake boot' });
  await sleep(600); await shot('01-title');
  check('local worker construction and fresh claim', await ev('__buttloads.world.chunks.size>=30 && __buttloads.economy.state.cash===0'));
  await click('start-button'); await sleep(500);
  check('start button enters gameplay', await ev('__buttloads.running && document.getElementById("title-screen").hidden'));
  await shot('02-yard');
  await ev('__buttloads.player.pitch=-.65; __buttloads.player.teleport(0,.05,9.3)');
  const before = await ev('__buttloads.world.audit.edits');
  await P.mouse('mousePressed', 720, 450);
  await until(() => ev(`__buttloads.world.audit.edits > ${before + 10}`), { timeout: 15000, label: 'real held pointer digging' });
  await ev('__buttloads.player.pitch=1.2'); await sleep(250);
  check('held trigger survives terrain miss', await ev('__buttloads.input.fire && !__buttloads.cutter.contact'));
  const afterMiss = await ev('__buttloads.world.audit.edits'); await ev('__buttloads.player.pitch=-1.2');
  await until(() => ev(`__buttloads.world.audit.edits > ${afterMiss}`), { timeout: 5000, label: 'cut resumes without reclick' });
  await P.mouse('mouseReleased', 720, 450);
  check('left release ends cutting', await ev('!__buttloads.input.fire'));
  await P.mouse('mousePressed', 720, 450); await P.mouse('mousePressed', 720, 450, 'right'); await P.mouse('mouseReleased', 720, 450, 'right');
  check('releasing another button does not cancel held cut', await ev('__buttloads.input.fire'));
  await P.mouse('mouseReleased', 720, 450);
  // Drive fixed simulation time to exercise the real early-game loop independently of software GPU speed.
  const haul = await ev(`(()=>{const g=__buttloads;g.running=false;g.player.teleport(0,.04,8.2);g.player.pitch=-.9;g.input.fire=true;for(let i=0;i<600;i++){g.player.yaw=Math.sin(i*.017)*.65;if(i>=120&&i<155)g.input.keys.add('KeyW');else g.input.keys.delete('KeyW');g.update(1/60);if(g.economy.count>=g.economy.capacity)break;}g.clearInput();g.running=true;return {cargo:g.economy.count,mined:g.economy.state.mined,depth:g.economy.state.deepest}})()`);
  console.log('FIRST HAUL', JSON.stringify(haul));
  check('continuous excavation exposes and collects starter ore', haul.cargo >= 8);
  const diggingMetrics = await ev('({...__buttloads.world.audit,heldFrames:__buttloads.cutter.frames})');
  await ev('__buttloads.player.teleport(0,.08,10);__buttloads.player.pitch=-.6;__buttloads.player.yaw=0'); await sleep(300); await shot('03-first-cut');
  await ev('__buttloads.recall();__buttloads.player.teleport(-7,.05,14.6)'); await press('KeyE'); await press('KeyE', false); await sleep(250);
  check('E sells actual cargo and pays first contract', await ev('__buttloads.economy.count===0 && __buttloads.economy.state.cash>=112 && __buttloads.economy.state.contracts===1'));
  await ev('__buttloads.player.teleport(0,.05,14.6)'); await press('KeyE'); await press('KeyE', false); await sleep(250);
  check('E opens workshop', await ev('__buttloads.screen==="shop"'));
  await ev('document.querySelector("[data-gear=drill]").click()');
  check('workshop purchase changes cutter capability', await ev('__buttloads.economy.state.gear.drill===1'));
  const paused = await ev('__buttloads.economy.state.seconds'); await sleep(300);
  check('menus freeze simulation and release held input', await ev(`__buttloads.economy.state.seconds===${paused} && !__buttloads.input.fire && __buttloads.input.keys.size===0`));
  await shot('04-workshop');
  await ev('__buttloads.play();__buttloads.player.teleport(0,.05,6);__buttloads.player.yaw=0'); await press('KeyF'); await press('KeyF', false); await sleep(300);
  check('scanner reveals deposits and gives signal bearing', await ev('__buttloads.view.ghosts.count>0 && !document.getElementById("scanner").hidden && document.getElementById("scan-detail").textContent.includes("Signal")'));
  await shot('05-scan');
  // A fixture shaft allows underground lighting, lift and discovery checks without replaying every sale.
  await ev(`(()=>{const g=__buttloads;g.clearInput();for(let y=0;y>-70;y-=1)g.world.carve({x:0,y,z:0},2.2);g.player.teleport(0,-23,0);g.player.pitch=-.25;g.player.yaw=.8;g.setScreen('pause')})()`);
  await ev('__buttloads.screen=null;document.getElementById("pause-screen").hidden=true;document.body.classList.remove("in-menu");__buttloads.player.pitch=-1.1;__buttloads.scanUntil=0;__buttloads.updateHUD();__buttloads.view.render(__buttloads,0,0)'); await sleep(150); await shot('06-underground');
  const lifted = await ev(`(()=>{const g=__buttloads;g.input.keys.add('Space');for(let i=0;i<600;i++)g.update(1/120);g.clearInput();return g.player.y})()`);
  check('free lift returns through excavated shaft', lifted > 0);
  for (let i = 0; i < 4; i++) {
    await ev(`(()=>{const g=__buttloads,r=B2.RELICS[${i}];g.world.carve({x:r.x,y:r.y+.8,z:r.z+1.9},1.1);g.player.teleport(r.x,r.y-.15,r.z+1.6);g.player.yaw=0;g.player.pitch=0;g.running=true;g.screen=null;g.use()})()`);
    check('discovery ' + (i + 1) + ' recovered by proximity interaction', await ev(`__buttloads.screen==='discovery' && ${i === 3 ? '__buttloads.economy.state.core' : `__buttloads.economy.state.relics.includes(${i})`}`));
    if (i === 1) await shot('07-discovery');
  }
  await ev('__buttloads.setScreen(null);__buttloads.recall();__buttloads.player.teleport(-7,.05,14.6);__buttloads.use()');
  check('core delivery produces ending', await ev('__buttloads.screen==="ending" && __buttloads.economy.state.won'));
  await shot('08-ending');
  const saveResult = await ev(`(async()=>{const g=__buttloads;await g.store.pending;const s=B2.Saves.snapshot(g,true);window.__saveFixture=s;const field=g.world.field.slice();await g.import(JSON.parse(JSON.stringify(s)));return g.economy.state.won && g.economy.state.gear.drill===1 && g.world.field.every((v,i)=>v===field[i]);})()`);
  check('portable import preserves edited world, equipment and ending', saveResult);
  const invalid = await ev(`(async()=>{const g=__buttloads,cash=g.economy.state.cash;try{await g.import({format:'terrainlab',version:2})}catch(e){return g.economy.state.cash===cash && g.ready}return false})()`);
  check('invalid import leaves active claim intact', invalid);
  check('back-to-back saves retain the newest state', await ev(`(async()=>{const g=__buttloads;g.settings.sensitivity=.7;const a=g.save();g.settings.sensitivity=1.3;g.changed();const b=g.save();await Promise.all([a,b]);return (await g.store.read()).settings.sensitivity===1.3})()`));
  check('storage failure leaves exportable playable state', await ev(`(async()=>{const g=__buttloads,write=g.store.write;g.store.write=()=>Promise.reject(new Error('quota'));await g.save();g.store.write=write;return g.ready && document.getElementById('save-status').textContent.includes('Export') && B2.Saves.validate(B2.Saves.snapshot(g)).state.won})()`));
  await ev('__buttloads.journal()'); await shot('09-journal');
  await P.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await sleep(400);
  check('phone layout stays within viewport', await ev('document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll(".screen:not([hidden]) .panel")].every(el=>el.getBoundingClientRect().width<=innerWidth)'));
  await shot('10-mobile-notes');
  await ev('__buttloads.setScreen("title")'); await sleep(300); await shot('11-mobile-title');
  await P.call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await ev('__buttloads.play();__buttloads.player.teleport(5,.08,11);__buttloads.player.yaw=0');
  await sleep(200);
  check('touch controls appear for coarse input', await ev('!document.getElementById("touch-controls").hidden'));
  const stick = await ev('(()=>{const r=document.getElementById("joystick").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+15}})()');
  await P.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: stick.x, y: stick.y, id: 1 }] }); await sleep(350);
  check('touch joystick drives movement', await ev('__buttloads.input.keys.has("KeyW") && __buttloads.player.z<11'));
  await P.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check('touch release clears movement', await ev('!__buttloads.input.keys.has("KeyW")'));
  await P.call('Emulation.setTouchEmulationEnabled', { enabled: false });
  await P.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await ev('__buttloads.setScreen("pause");__buttloads.changed();__buttloads.save()'); await ev('__buttloads.store.pending');
  const expectedCash = await ev('__buttloads.economy.state.cash');
  await P.goto(url); await until(() => ev('window.__buttloads?.ready'), { timeout: 90000, label: 'saved reload' });
  check('IndexedDB restores claim after reload', await ev(`__buttloads.economy.state.cash===${expectedCash} && __buttloads.economy.state.won`));
  check('no browser exceptions or shader errors', !P.logs.some(s => /EXCEPTION|error:/i.test(s)));
  const stats = await ev('({chunks:__buttloads.world.chunks.size,renderer:__buttloads.view.renderer.info.render})');
  stats.firstHaulEdits = diggingMetrics;
  console.log('BROWSER STATS', JSON.stringify(stats));
  if (fs.existsSync(path.join(root, 'dist/index.html'))) {
    await P.goto(pathToFileURL(path.join(root, 'dist/index.html')).href); await until(() => ev('window.__buttloads?.ready'), { timeout: 90000, label: 'standalone file boot' });
    check('standalone release boots from file URL', await ev('__buttloads.ready && __buttloads.world.chunks.size>=30'));
  }
  await P.call('Page.addScriptToEvaluateOnNewDocument', { source: 'window.Worker=undefined;' });
  await P.goto(url); await until(() => ev('window.__buttloads?.ready'), { timeout: 90000, label: 'workerless fallback' });
  check('claim loads when worker creation is unavailable', await ev('__buttloads.ready && __buttloads.world.chunks.size>=30'));
  fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ checks: passed, softwareWebGL: true, stats, logs: P.logs }, null, 2));
  console.log(`COMPLETE ${passed} browser checks passed`);
} catch (e) { console.error(e); if (P) { console.error('BROWSER LOGS', P.logs); try { await P.shot(path.join(out, 'remake-failure.png')); console.error(await P.eval('({screen:window.__buttloads?.screen,ready:window.__buttloads?.ready,loading:document.getElementById("loading-message")?.textContent})')); } catch {} } process.exitCode = 1; }
finally { P?.kill(); server.close(); }
