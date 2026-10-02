# Adaptive ore submission, local 2.44.0

The previous single ore mesh submitted all 1,956 instances (70,416 triangles) on every native frame. Ore now uses 54 bounded 16 m instance cells when a view can reject most of them. A second, merged mesh preserves the original single draw for dense views. Only one representation renders at a time.

The first unconditional cell candidate is rejected: looking down the native shaft admitted 42 ore draws to save only 9,072 triangles. The accepted selector uses the merged representation if more than 16 cells intersect, or if more than eight intersect and contain over 60% of the instances. The actual shaft and released-ore views consequently keep their original total submissions. These thresholds are a provisional count-based choice; quiet-machine frame time remains unmeasured.

| Native view | Total cached draws before / after | Total triangles before / after | Accepted ore mode |
|---|---:|---:|---|
| Depot | 238 / 238 | 666,172 / 599,752 | Cells |
| Yard | 104 / 108 | 595,556 / 539,720 | Cells |
| Shaft mouth | 485 / 485 | 784,893 / 784,893 | Merged |
| Lantern room | 127 / 134 | 537,876 / 488,664 | Cells |
| Chalk room | 109 / 117 | 505,222 / 460,186 | Cells |
| Amethyst room | 121 / 130 | 474,730 / 430,198 | Cells |
| Released ore | 195 / 195 | 614,111 / 614,111 | Merged |
| Static ore outside its original cell | 236 / 237 | 664,494 / 601,242 | Cells |

Across these eight views, mean ore triangles decrease by 57.6%; mean whole-frame triangles decrease by 6.7%. Cached draws add zero to nine. These are submissions, not FPS gains. Every camera, ore-buffer fingerprint, loose-body position and non-ore submission remains exact. Four native pixel pairs are exact; the others differ by one to five pixels at a maximum channel difference of one. All sixteen accepted frames are individually inspected.

Ore keeps its original geometry, colour and transform, including elongated prisms. Falling, thrown and remote-corrected ore retains its slot and grows that cell's bounds. Bounds deliberately do not shrink, so a long movement history can make a cell less selective. Reinstalling a save rebuilds cells around current positions. Scanner slots, collection, simulation and saved IDs retain their existing behavior.

The accepted representation adds 54 mesh objects and 335,280 bytes (327.4 KiB) of geometry/instance buffer capacity over the original single mesh. Both representations share one material. Render selection adds 54 sphere checks per native frame and moving ore writes both matrix representations. Those CPU and memory costs remain explicit. This adds no shadow caster or texture; it preserves the previous rigid, sign and supported-growth merges.

Cell sizes of 8, 16, 24, 32 and 48 m have separately recorded frustum forecasts. The accepted 16 m forecasts match all eight actual native submissions. Other sizes are predictions, not separately rendered releases. With the same dense fallback, 16 m uses fewer cells and fewer mean triangles than 8 m at the same mean draw count. Larger cells trade lower draw counts for more triangles. Their net frame-time tradeoff remains open.

Ten new pure checks pass: all native matrices/colours and geometry, unique slots/material ownership, complete bounds, visible vertices, large corrections, scanner/collection/resurrection, rebuilding/disposal, sparse submission and both dense fallback conditions. The complete fossil campaign passes at 532.9 simulated seconds, including machinery, heart/geodes, fossil recovery, ember reload and purchased living lenses. Its pilot knows objective coordinates; this proves reachability rather than human pacing. COMPLETE 505 system checks passed on the accepted build.

Portable source comparison changes only render.js and version metadata. Within View, setDeposits/updateOre change, selectOreBatches is added, and render only adds its selection call. Every other executable script and markup/style outside version metadata remains exact, including Player, input, art, HUD, co-op and saves. Public lobby and separate-network traversal have not been rerun for this renderer-only change.

An earlier static capture helper also had reversed pitch: its shaft fixture showed sky. That set is retained as rejected evidence. Production camera math and input were not changed. The static out-of-cell fixture directly positions ore; it does not claim a browser-controlled throw. The released fixture carves actual native terrain and advances the real ore simulation for 90 ticks.

Raw receipts: [baseline](../tools/out/ore-batching-before/report.json), [accepted native release](../tools/out/ore-batching-after/report.json), [pixels](../tools/out/ore-batching-pixels.json), [source scope](../tools/out/ore-batching-build-diff.json), [alternative forecasts](../tools/out/ore-batching-alternatives.json), [rejected unconditional batching](../tools/out/ore-batching-round-1/rejection.json), [rejected camera fixture](../tools/out/ore-batching-camera-rejected/rejection.json), [targeted checks](../tools/out/ore-batching-targeted.log), [full suite](../tools/out/ore-batching-suite.log), [campaign](../tools/out/ore-batching-journey.json) and [campaign terminal log](../tools/out/ore-batching-journey.log).

Broad flat depot boards, uniform pavement, repeated faceted ore and cloth-like chalk remain visible. Physical Firefox movement feel, quiet-machine frame time, separate-network co-op and the wider hard art request remain open. The full improvement goal remains active.
