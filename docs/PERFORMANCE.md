# Performance fix, local 2.27.1

The accepted 2.27.0 artwork is preserved. Measured CPU work per frame falls by 48% to 64% across the captured scenes.

| Scene | CPU before | CPU after | Reduction | Mean draw calls before / after |
| --- | ---: | ---: | ---: | ---: |
| Yard | 7.22 ms | 3.77 ms | 48% | 210 / 102 |
| Four moving remote miners | 9.78 ms | 4.15 ms | 58% | 753 / 502 |
| Underground | 9.20 ms | 3.30 ms | 64% | 236 / 135 |
| Cutting underground | 9.92 ms | 4.39 ms | 56% | 348 / 296 |

CPU work means mean simulation time plus mean render submission time. It is not GPU time or an FPS multiplier. Captures use isolated headless Chrome, a 1920 by 1080 viewport, pixel ratio 1 and the RTX 5070 Ti through D3D11. Each scene warms 100 completed frames, then samples for six seconds. Capture refresh is capped at 60 Hz; these measurements describe frame-budget headroom. Four-miner scenes use moving rendering fixtures, rather than pretending to measure internet conditions.

## Fixed costs

- Supported, wedged minerals retained tangential velocity despite making no positional progress. They stayed awake indefinitely and repeatedly ran swept collision searches. Sustained supported immobility now puts them to sleep. Excavation wakes them and resets the sleep timer. Standing-still simulation falls from 4.53 ms to 0.65 ms in the matched captures.
- Miner grounding traced every terrain mesh, the entire yard, the town and the surrounding ground. It now traces only chunks crossed by the short vertical ray, uses the existing common-ground height function and includes the apron where applicable. The crew-render p95 falls from 6.9 ms to 0.2 ms. Chunk-edge tests compare against the previous full terrain query.
- Rigid tool parts now merge by material while needles, heads, forks, field cores and joint pivots remain independently animated. Static mesh local matrices remain cached. The same source geometry continues to supply remote weapons.
- Surface NPC animation refreshes the sun map when nearby. The underground headlamp refreshes when its position, aim, range, terrain or game state changes. Nearby creature animation and moving crew retain periodic shadow refreshes.

A branch-based lighting shader experiment was rejected: alternating native/modified runs did not show a reliable overall improvement. Native Three.js lighting remains. Raw GPU elapsed queries varied across the runs, so this release makes no GPU speedup claim.

## Receipts

- [Offline before/after presentation](../tools/out/performance-review.html)
- [Preserved accepted art build](../tools/out/perf-before/build.html)
- [Matched baseline measurements and CPU profiles](../tools/out/perf-matched-before/report.json)
- [Final release measurements and CPU profiles](../tools/out/perf-release/report.json)
- [Final art captures](../tools/out/art-perf-final/capture.json): 28 views, zero runtime errors, no pointer lock. The miner, depot and all seven local and remote weapons were visually inspected after batching.
- [System log](../tools/out/system-performance.log): `COMPLETE 337 system checks passed`.
- `node tools/test-art.mjs`: 21 weapon/aim grip poses and 26 grounding checks pass.
- `node tools/test-underground-art.mjs`: all seven checks pass again after creature-shadow invalidation.
- `node tools/build.mjs`: 64 scripts compile, no external scripts or stylesheets.

Run `node tools/perf-gauntlet.mjs release` and `node tools/make-perf-review.mjs` to regenerate the release measurements and presentation. The baseline uses `node tools/perf-gauntlet.mjs matched-before tools/out/perf-before/build.html`. Tests remain isolated from desktop input and never request pointer lock.
