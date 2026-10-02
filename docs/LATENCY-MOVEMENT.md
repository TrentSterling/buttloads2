# Latency movement, local 2.28.5

The guest now compares a host pose with its recorded prediction for the acknowledged input. It applies the remaining position error to current movement. Local mouse aim stays immediate, and modest corrections retain velocity and translation interpolation.

The preserved 2.28.4 source, portable and first rejected prototype remain in `tools/out/latency-before/`. Paired [before](../tools/out/latency-before.json) and [after](../tools/out/latency-after.json) reports retain every sample. The [six-slide review](../tools/out/latency-review.html) includes the full matrix and rejected work.

## Reproduced behavior

The fixture runs production `Crew.tick`, `receive`, `members`, `stepRemotes`, `updateGuest` and actual `Player` capsule contact. Packets have simulated delay, with 144 updates/sec and 20 Hz producer deadlines. Nonmovement world systems, rendering and transport are inert. Accumulated correction is the sum of modest position adjustments, not travel distance, instantaneous divergence or measured mouse latency.

| Four-second replay | Before total correction | After total correction |
| --- | ---: | ---: |
| Turning, 100 ms RTT | 0.476 m | 0 m |
| Turning, 250 ms RTT | 3.061 m | 0.192 m |
| Turning, 500 ms RTT | 6.463 m | 0.668 m |
| Turning, 250 ms RTT with 35 ms jitter | 3.009 m | 0.217 m |
| Stop at two seconds, 250 ms RTT | 0.384 m | 0.133 m |
| Shared wall slide, 250 ms RTT | 0.621 m | 0 m |
| Fresh start, 250 ms RTT | 3.354 m | 0 m |
| Fresh start, 500 ms RTT | 6.947 m | 0 m |
| Genuine 0.8 m host error at one second | 3.568 m | 1.009 m |

During seconds 1 through 4, the 250 ms turn improves from 2.376 m to 0.015 m of correction. A 37-second host clock offset produces the same current result. Missing poses from 0.5 through 3 seconds preserve movement without a teleport. All twelve current report cases have zero teleports, zero blocked frames and exact immediate camera aim.

The [first rejected prototype](../tools/out/latency-startup-rejected.json) reduced the 250 ms turn to 0.518 m but increased the stop case to 0.408 m and still dragged fresh starts. Its source is retained as `trial-multiplayer.js`. Final startup grace is bounded to one second, and acknowledgements report actual simulated input duration rather than wall time. The actual Game check includes a 30-second stall while simulation catches up only 250 ms.

## Implementation and compatibility

The host adds an optional `{seq, age}` acknowledgement for each remote miner. `seq` identifies the latest admitted input; `age` measures capsule simulation under that input. The guest anchors that sequence to completed local physics and interpolates its recorded positions at `sent + age`. Host and guest wall clocks do not need synchronization.

History retains at most 361 physics samples spanning three seconds and 64 input anchors. Consumed corrections shift the stored positions so later packets do not apply the same correction twice. Invalid, unknown or expired acknowledgements use the preceding compatible correction path. Fresh large errors still relocate, blocked modest corrections stay rejected, and teleports, pause, install, role changes and leaving clear history.

Protocol, public room and saved crew generation remain v3. Every crew lead should reload 2.28.5 for acknowledgements. A current guest connected to an older compatible host retains the old correction behavior until that lead updates.

## Verification and cost

- The preserved source fails `node tools/test-latency.mjs --baseline` with 3.061 m accumulated turning correction. [Failure log](../tools/out/latency-regression-before.log).
- Eleven latency checks pass, covering 60/144/240 Hz and 0/100/250/500 ms delays, contact, stops, jitter, gaps, startup, real errors, correction consumption, fallback, reset paths and actual Game integration.
- The aggregate log ends with **COMPLETE 403 system checks passed**. [Full log](../tools/out/system-latency.log).
- The portable compiles 65 bundled scripts without external scripts or stylesheets. [Artifact hash](../tools/out/latency-release.json).
- Six slides render with visible navigation, decoded images, zero errors and no pointer lock. Each slide was visually inspected; the dense matrix was tightened after its method caption exceeded the first capture's visible area. [Deck verification](../tools/out/latency-review-report.json).
- The portable camera has exact interpolated translation and immediate yaw/pitch. [Dated 2.28.5 camera verification](../tools/out/movement-build-2.28.5-report.json).

Paired [baseline](../tools/out/perf-latency-before/report.json) and [current](../tools/out/perf-latency-after/report.json) hardware captures use a stationary production guest, simulated 250 ms pose delivery, inert transport, 1920 by 1080 and an RTX 5070 Ti. Samples run six seconds after 100 completed warm frames. Guest update mean is 0.497 / 0.510 ms; p95 is 0.700 / 0.800 ms. Both have 16.8 ms frame p95, 105 draws and 448,455 triangles. Current history reaches 361 samples and 64 inputs with acknowledged alignment active. CPU render mean is 2.85 / 2.74 ms. GPU mean varies from 13.75 to 8.24 ms; this is not credited as a rendering speedup.

## Remaining work

Actual Firefox mouse delivery and human play feel remain unverified. The reproduced prediction problem does not establish the cause of Trent's physical mouse complaint. Residual corrections remain, especially startup at higher delay; this is an improvement checkpoint rather than final movement acceptance.

Those art findings were carried into the following [2.29.0 landscape checkpoint](LANDSCAPE-ART.md). Earlier miner, tool, terrain, furniture and performance changes remain in the dated [receipt hub](../tools/out/current-review.html). No new public-network session, full campaign, push or deployment is claimed by this latency checkpoint. The broader goal remains active.
