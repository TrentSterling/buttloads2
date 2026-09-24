// Capture the running remake with an excavated claim, no external art assets.
import { launch, sleep, until } from './cdp.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = path.resolve(import.meta.dirname, '..'), out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
const P = await launch({ port: 9488, width: 1200, height: 630 });
try {
  await P.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await until(() => P.eval('window.__buttloads?.ready'), { timeout: 60000, label: 'game boot' });
  await P.eval(`(()=>{const g=__buttloads;for(let y=0;y>-24;y-=.8)g.world.carve({x:3,y,z:1},y>-3?4.2:3);g.setScreen('title');document.querySelector('.start-button').hidden=true;document.querySelector('.save-note').hidden=true;document.querySelector('.title-links').hidden=true;document.querySelector('.title-caption').hidden=true;})()`);
  await sleep(500); await P.shot(path.join(root, 'og-image.png')); await P.shot(path.join(out, 'remake-social.png'));
  console.log('Captured og-image.png at 1200x630');
  if (P.logs.some(s => /EXCEPTION|error:/i.test(s))) throw new Error(P.logs.join('\n'));
} finally { P.kill(); }
