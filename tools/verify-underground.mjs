// Underground verification: strata, ore veins, scanner ghosts, hard rock, darkness.
// Boots the game, carves a shaft, checks depth-based color/brightness, vein glitter
// before/after exposure, hard rock resistance vs clay, scanner ghost reveal, and
// frame/edit timing. Screenshots into tools/out/<prefix>-*.png.
import { launch, sleep, until } from './cdp.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'tools', 'out'); fs.mkdirSync(out, { recursive: true });
const PORT = +(process.env.PORT || 9470);
const PREFIX = process.env.PREFIX || 'ug';

const server = http.createServer((req, res) => {
  const f = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { res.end(fs.readFileSync(f)); } catch { res.statusCode = 404; res.end(); }
}).listen(0);

async function launchRetry(basePort, opts) {
  let lastErr;
  for (let p = basePort; p < basePort + 5; p++) {
    try { return await launch({ port: p, ...opts }); } catch (e) { lastErr = e; console.warn('chrome failed on port', p, e.message); }
  }
  throw lastErr;
}

const yawTo = (fromX, fromZ, toX, toZ) => Math.atan2(-(toX - fromX), -(toZ - fromZ));
const shot = (name) => P.shot(path.join(out, `${PREFIX}-${name}.png`));
const ev = (expr) => P.eval(expr);

// Most test spots are mid-air inside a carved shaft or pocket (no floor), and
// the real game loop keeps running (gravity included) for the whole sleep.
// A single teleport-then-sleep(1500) lets the player fall for 1.5 real seconds,
// which under normal gravity (24 m/s^2) is many meters - enough to land at the
// bottom of a 30 m shaft instead of at the depth being tested, and each extra
// eval() round trip itself costs real time the render loop keeps ticking
// through. teleport() already forces an immediate camera.position sync via its
// own movePlayer(0), so one settle sleep plus one final re-pin right before the
// shot is enough: total wait stays modest (swiftshader still gets several
// rendered frames) and residual fall after the last pin is a few tens of cm.
async function holdAt(x, y, z, yaw, pitch, totalMs = 500) {
  const deadline = Date.now() + totalMs;
  do {
    await ev(`__dirt.teleport(${x}, ${y}, ${z}); __dirt.setLook(${yaw}, ${pitch}); 1`);
    await sleep(80);
  } while (Date.now() < deadline);
}

// Firing itself keeps the real game loop running for a full 2 s, and the test
// spots are floating in a carved pocket with no floor, so unpinned gravity
// would carry the camera (and therefore the aim ray) away from the rock being
// tested well before the window ends. Re-pin position only (never touch
// yaw/pitch or `firing`, and never call __dirt.fire again) every ~150 ms so
// the aim stays fixed; lastTarget/cutDirection are untouched by teleport(), so
// the drill's own continuous-contact tracking is unaffected by the correction.
async function fireFor(x, y, z, ms) {
  await ev('__dirt.fire(true); 1');
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    await sleep(150);
    await ev(`__dirt.player.feet.set(${x}, ${y}, ${z}); __dirt.player.velocity.set(0, 0, 0); 1`);
  }
  await ev('__dirt.fire(false); 1');
}

// Direct, non-frame-rate-dependent measurement of how far a 2 s cut actually
// reached: probes fixed points along the known aim ray with tiny excavate()
// calls (already-carved ground reports 0 changes; the first still-solid point
// reports >0 and is the tunnel's current leading edge). editedFrames/samplesChanged
// alone are misleading here because a fast digger can run out of the 5.4 m
// cutter reach and then just miss every remaining frame, which *raises* its
// hit-frame (and therefore edited-frame) count relative to a slow digger that
// never reaches the cap - the opposite of what those counters look like they mean.
async function tunnelDepth(camX, camY, camZ, yaw) {
  const dx = -Math.sin(yaw), dz = -Math.cos(yaw);
  return await ev(`
    (function(){
      let tunnelEnd = 0;
      for (let dist = 0.3; dist <= 5.4; dist += 0.35) {
        const px = ${camX} + ${dx} * dist, pz = ${camZ} + ${dz} * dist;
        const changes = __dirt.excavate(new __dirt.V(px, ${camY}, pz), 0.2);
        tunnelEnd = dist;
        if (changes > 0) break;
      }
      return tunnelEnd;
    })()
  `);
}

let P, failed = false;
const problems = [];

try {
  P = await launchRetry(PORT, { width: 1280, height: 800 });
  await P.goto(`http://127.0.0.1:${server.address().port}/`);
  await until(() => P.eval("window.__dirt && __dirt.ready && document.getElementById('loading').hidden"), { timeout: 90000, label: 'boot' });
  await ev('__dirt.play(); 1');
  await sleep(300);

  const dirtMembers = await ev('Object.keys(__dirt).sort().join(",")');
  const kMembers = await ev('Object.keys(__dirt.K).sort().join(",")');
  console.log('__dirt members:', dirtMembers);
  console.log('K members:', kMembers);

  // ---- (a) Shaft down the middle: strata by depth ----
  await ev(`
    (function(){
      for (let y = 0; y >= -30; y -= 1) __dirt.excavate(new __dirt.V(0, y, 4), 1.3);
      return 1;
    })()
  `);
  await sleep(200);

  const depths = [5, 16, 29];
  for (const d of depths) {
    await holdAt(0, -d, 4, 0, -0.1, 700);
    await shot(`depth${d}-yaw0`);
    await holdAt(0, -d, 4, Math.PI, -0.1, 400);
    await shot(`depth${d}-yawpi`);
  }
  console.log('step a: 6 depth/wall shots done');

  // ---- (b) Iron vein: glitter before exposure, nugget after ----
  const ironVein = JSON.parse(await ev(`
    JSON.stringify(__dirt.K.generateVeins(__dirt.state.seed).filter(v => v.kind === 1)[0])
  `));
  console.log('first iron vein:', ironVein);
  const vApproachX = ironVein.x + 3.0, vApproachZ = ironVein.z;
  await ev(`__dirt.excavate(new __dirt.V(${vApproachX}, ${ironVein.y}, ${vApproachZ}), 1.5); 1`);
  const vStandX = ironVein.x + 2.6;
  const vYaw = yawTo(vStandX, vApproachZ, ironVein.x, ironVein.z);
  await holdAt(vStandX, ironVein.y - 1.6, vApproachZ, vYaw, 0, 700);
  const beforeExposed = await ev(`
    __dirt.ore.filter(o => !o.collected && o.p.distanceTo(new __dirt.V(${ironVein.x},${ironVein.y},${ironVein.z})) < 2.2 && o.mesh.visible).length
  `);
  console.log('iron vein: visible nuggets before breakthrough:', beforeExposed);
  await shot('vein-before');
  await ev(`__dirt.excavate(new __dirt.V(${ironVein.x}, ${ironVein.y}, ${ironVein.z}), 2.2); 1`);
  await holdAt(vStandX, ironVein.y - 1.6, vApproachZ, vYaw, 0, 500);
  const afterExposed = await ev(`
    __dirt.ore.filter(o => !o.collected && o.p.distanceTo(new __dirt.V(${ironVein.x},${ironVein.y},${ironVein.z})) < 2.2 && o.mesh.visible).length
  `);
  console.log('iron vein: visible nuggets after breakthrough:', afterExposed);
  await shot('vein-after');
  if (!(afterExposed > beforeExposed)) problems.push('vein breakthrough did not increase visible nuggets');

  // ---- (c) Hard rock: find a boulder by grid-sampling K.hardness, preferring
  // one clear of any vein's glow radius so the demo shot reads as plain hard
  // rock and not a boulder that happens to sit inside a crystal vein's glow.
  const boulder = JSON.parse(await ev(`
    (function(){
      const K = __dirt.K, seed = __dirt.state.seed, veins = K.generateVeins(seed);
      let best = null, bestScore = -Infinity;
      for (let x = -8; x <= 8; x += 1.2)
        for (let z = -8; z <= 8; z += 1.2)
          for (let y = -15; y >= -43; y -= 1.2) {
            const h = K.hardness(x, y, z, seed);
            if (h < 0.85) continue;
            let clearance = Infinity;
            for (const v of veins) { const d = Math.hypot(x - v.x, y - v.y, z - v.z) - v.r; if (d < clearance) clearance = d; }
            if (clearance > bestScore) { bestScore = clearance; best = {x, y, z, h, clearance}; }
          }
      return JSON.stringify(best);
    })()
  `));
  console.log('boulder probe (max hardness, clearest of any vein):', boulder);
  if (!boulder || boulder.h < 0.5) problems.push('no boulder found on grid (hardness < 0.5)');

  // Probe the 4 cardinal directions through the found center and pick the
  // longest hardness>0.5 chord, so the drill stays inside the boulder for the
  // whole 2 s test instead of tunnelling through a thin edge and back into
  // normal rock partway through.
  const axis = JSON.parse(await ev(`
    (function(){
      const K = __dirt.K, seed = __dirt.state.seed, bx = ${boulder.x}, by = ${boulder.y}, bz = ${boulder.z};
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      let best = null;
      for (const [dx,dz] of dirs) {
        let lo = null, hi = null;
        for (let t = -2; t <= 2; t += 0.08) {
          if (K.hardness(bx + dx*t, by, bz + dz*t, seed) > 0.5) { if (lo === null) lo = t; hi = t; }
        }
        const span = lo === null ? 0 : hi - lo;
        if (!best || span > best.span) best = {dx, dz, lo, hi, span};
      }
      return JSON.stringify(best);
    })()
  `));
  console.log('boulder longest cardinal chord:', axis);
  if (axis.span < 1.2) problems.push(`boulder chord too short to test cleanly (${axis.span.toFixed(2)}m)`);

  const edgeX = boulder.x + axis.dx * axis.hi, edgeZ = boulder.z + axis.dz * axis.hi;
  const bApproachX = boulder.x + axis.dx * (axis.hi + 1.5), bApproachZ = boulder.z + axis.dz * (axis.hi + 1.5);
  await ev(`__dirt.excavate(new __dirt.V(${bApproachX}, ${boulder.y}, ${bApproachZ}), 1.9); 1`);
  const bStandX = boulder.x + axis.dx * (axis.hi + 0.15), bStandZ = boulder.z + axis.dz * (axis.hi + 0.15), bStandY = boulder.y - 1.6;
  const bYaw = yawTo(bStandX, bStandZ, boulder.x, boulder.z);
  await holdAt(bStandX, bStandY, bStandZ, bYaw, 0, 700);
  await shot('hardrock');

  await ev(`__dirt.teleport(${bStandX}, ${bStandY}, ${bStandZ}); __dirt.setLook(${bYaw}, 0); 1`);
  const before1 = JSON.parse(await ev('JSON.stringify({e:__dirt.audit.editedFrames,s:__dirt.audit.samplesChanged,p:__dirt.audit.pacedFrames,f:__dirt.audit.freeFrames,fi:__dirt.audit.fireFrames,h:__dirt.audit.hitFrames})'));
  await fireFor(bStandX, bStandY, bStandZ, 2000);
  const after1 = JSON.parse(await ev('JSON.stringify({e:__dirt.audit.editedFrames,s:__dirt.audit.samplesChanged,p:__dirt.audit.pacedFrames,f:__dirt.audit.freeFrames,fi:__dirt.audit.fireFrames,h:__dirt.audit.hitFrames})'));
  const hardDelta = after1.e - before1.e, hardSamples = after1.s - before1.s;
  console.log('hard rock: editedFrames delta over 2s:', hardDelta, 'samplesChanged delta:', hardSamples);
  console.log('  paced delta:', after1.p - before1.p, 'free delta:', after1.f - before1.f, 'fire delta:', after1.fi - before1.fi, 'hit delta:', after1.h - before1.h);
  await shot('hardrock-after');
  const hardTunnel = await tunnelDepth(bStandX, bStandY + 1.6, bStandZ, bYaw);
  console.log('hard rock: tunnel reach after 2s fire:', hardTunnel.toFixed(2), 'm');

  // Clay comparison spot: away from the shaft and starter patch, depth 6 m (clay layer).
  const clayX = 6, clayY = -6, clayZ = -6, clayStandY = clayY - 1.6;
  await ev(`__dirt.excavate(new __dirt.V(${clayX + 3}, ${clayY}, ${clayZ}), 1.6); 1`);
  const clayYaw = yawTo(clayX + 2.6, clayZ, clayX, clayZ);
  await holdAt(clayX + 2.6, clayStandY, clayZ, clayYaw, 0, 700);
  const before2 = JSON.parse(await ev('JSON.stringify({e:__dirt.audit.editedFrames,s:__dirt.audit.samplesChanged,p:__dirt.audit.pacedFrames,f:__dirt.audit.freeFrames,fi:__dirt.audit.fireFrames,h:__dirt.audit.hitFrames})'));
  await fireFor(clayX + 2.6, clayStandY, clayZ, 2000);
  const after2 = JSON.parse(await ev('JSON.stringify({e:__dirt.audit.editedFrames,s:__dirt.audit.samplesChanged,p:__dirt.audit.pacedFrames,f:__dirt.audit.freeFrames,fi:__dirt.audit.fireFrames,h:__dirt.audit.hitFrames})'));
  const clayDelta = after2.e - before2.e, claySamples = after2.s - before2.s;
  console.log('clay: editedFrames delta over 2s:', clayDelta, 'samplesChanged delta:', claySamples);
  console.log('  paced delta:', after2.p - before2.p, 'free delta:', after2.f - before2.f, 'fire delta:', after2.fi - before2.fi, 'hit delta:', after2.h - before2.h);
  const clayTunnel = await tunnelDepth(clayX + 2.6, clayStandY + 1.6, clayZ, clayYaw);
  console.log('clay: tunnel reach after 2s fire:', clayTunnel.toFixed(2), 'm');
  console.log(`editedFrames alone: hard=${hardDelta} clay=${clayDelta} (a fast digger can run out of the 5.4m reach and then just miss, which raises its own edited-frame count - tunnel reach above is the real comparison)`);
  if (!(hardTunnel < clayTunnel - 0.5)) problems.push(`hard rock tunnel not clearly shorter than clay after 2s (hard=${hardTunnel.toFixed(2)}m clay=${clayTunnel.toFixed(2)}m)`);

  // ---- (d) Scanner: pick a spot near depth 16 m with 3+ deposits in range ----
  const scanSpot = JSON.parse(await ev(`
    (function(){
      const pts = [[0,-16,0],[0,-16,4],[3,-16,-3],[-3,-16,3],[0,-16,-4],[4,-16,4],[-4,-16,-4],[0,-16,6],[0,-16,-6],[5,-16,0],[-5,-16,2]];
      let best = null, bestCount = -1;
      for (const [x,y,z] of pts) {
        const p = new __dirt.V(x,y,z);
        const count = __dirt.ore.filter(o => !o.collected && o.p.distanceTo(p) <= 10).length;
        if (count > bestCount) { bestCount = count; best = {x,y,z,count}; }
      }
      return JSON.stringify(best);
    })()
  `));
  console.log('scan spot candidate:', scanSpot);
  await ev(`__dirt.excavate(new __dirt.V(${scanSpot.x}, ${scanSpot.y}, ${scanSpot.z}), 2.6); 1`);
  await holdAt(scanSpot.x, scanSpot.y - 1.6, scanSpot.z, 0.4, -0.05, 700);
  const inRangeBefore = await ev(`
    __dirt.ore.filter(o => !o.collected && o.p.distanceTo(__dirt.camera.position) <= __dirt.levels.scanner.values[__dirt.state.scanner]).length
  `);
  console.log('deposits actually in scanner range at this spot:', inRangeBefore);
  if (inRangeBefore < 3) problems.push(`scan spot only has ${inRangeBefore} deposits in range, wanted 3+`);
  await ev('__dirt.scan(); 1');
  await sleep(400);
  await shot('scan');
  console.log('scan HUD text:', await ev("document.getElementById('scan-name').textContent + ' / ' + document.getElementById('scan-info').textContent"));

  // ---- (e) Timing ----
  const frameMs = JSON.parse(await ev('JSON.stringify(__dirt.audit.frameMs)'));
  const editsMs = JSON.parse(await ev('JSON.stringify(__dirt.audit.editsMs)'));
  const p95 = arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length * 0.95)]; };
  const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN;
  const frameP95 = p95(frameMs), editsMean = mean(editsMs);
  console.log(`audit.frameMs p95: ${frameP95.toFixed(2)} ms over ${frameMs.length} frames`);
  console.log(`audit.editsMs mean: ${editsMean.toFixed(3)} ms over ${editsMs.length} edits`);
  if (frameP95 >= 40) problems.push(`frameMs p95 ${frameP95.toFixed(2)}ms >= 40ms`);

  // ---- (f) Exceptions ----
  const exceptions = P.logs.filter(l => /EXCEPTION/.test(l));
  console.log('exception count:', exceptions.length);
  if (exceptions.length) { console.log(exceptions.slice(0, 20)); problems.push(`${exceptions.length} EXCEPTION log lines`); }

  console.log('SUMMARY:', problems.length ? 'PROBLEMS: ' + JSON.stringify(problems) : 'all checks passed');
  failed = problems.length > 0;
} catch (e) {
  console.error('SCRIPT ERROR:', e);
  failed = true;
} finally {
  P?.kill();
  server.close();
  process.exit(failed ? 1 : 0);
}
