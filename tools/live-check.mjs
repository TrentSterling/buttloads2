// Read-only runtime smoke check. Pass an explicit URL to inspect a deployment.
import { launch, until } from './cdp.mjs';
const url = process.argv[2];
if (!url) throw new Error('Usage: node tools/live-check.mjs <URL>. For local gameplay verification use tools/verify-remake.mjs.');
const P = await launch({ port: 9489, width: 1280, height: 800 });
try {
  await P.goto(url); await until(() => P.eval('window.__buttloads?.ready'), { timeout: 90000, label: 'remake boot' });
  console.log(await P.eval('({origin:location.origin,secure:isSecureContext,ready:__buttloads.ready,saveVersion:B2.Saves.VERSION,chunks:__buttloads.world.chunks.size})'));
  if (P.logs.some(s => /EXCEPTION|error:/i.test(s))) throw new Error(P.logs.join('\n'));
  console.log('COMPLETE deployed remake boot passed');
} finally { P.kill(); }
