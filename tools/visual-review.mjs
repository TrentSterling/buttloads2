import { launch, sleep, until } from './cdp.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = path.resolve(import.meta.dirname, '..'), out = path.join(root, 'tools/out');
const P = await launch({ port: 9486, width: 1440, height: 900 });
try {
  await P.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await until(() => P.eval('window.__buttloads?.ready'), { timeout: 60000 });
  await P.eval('__buttloads.setScreen(null);__buttloads.running=false;__buttloads.updateHUD()');
  await sleep(500); await P.shot(path.join(out, 'review-yard.png'));
  console.log(await P.eval('({colors:Object.fromEntries(Object.entries(__buttloads.view.palette).map(([k,m])=>[k,m.color.toArray()])),lights:__buttloads.view.scene.children.filter(m=>m.isLight).map(m=>({type:m.type,intensity:m.intensity})),exposure:__buttloads.view.renderer.toneMappingExposure})'));
  await P.eval(`(()=>{const g=__buttloads;for(let y=0;y>-35;y-=.8)g.world.carve({x:0,y,z:0},2.5);g.player.teleport(0,-16,0);g.player.pitch=-1.15;g.player.yaw=.2;g.updateHUD()})()`);
  await sleep(500); await P.shot(path.join(out, 'review-shaft.png'));
  await P.eval('__buttloads.player.teleport(0,.04,13);__buttloads.player.pitch=.05;__buttloads.player.yaw=Math.PI;__buttloads.updateHUD()');
  await sleep(500); await P.shot(path.join(out, 'review-workshop.png'));
  console.log('logs', P.logs);
} finally { P.kill(); }
