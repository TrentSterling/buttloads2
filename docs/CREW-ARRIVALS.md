# Clear crew arrivals, local 2.29.2

A current public lobby audit passed automatic joining and mine transfer, but visual inspection rejected its late-join frame: the newcomer appeared inside another miner’s head. The host previously used `1.1 * (peerCount % 3)` for arrival X, which reused occupied positions after departures. The [original public frame](../tools/out/network-idle-2.29.1/late-join-2.png) and [failed production regression](../tools/out/crew-spawn-before-failure.log) preserve the defect. The portable and original network source remain in `tools/out/crew-spawn-before/`.

The host now allocates from actual occupied positions, including miners in menus. Candidates respect the existing capsule, terrain and machinery collision, leave 0.1 m beyond summed capsule radii, and require ground beneath an entrance arrival. A clear supplied pose and its aim survive reconstruction. Existing miners in the same world retain their bodies, position and velocity. Only new or reconstructed remote bodies perform the search; no per-frame allocation search was added. Contact rules, protocol, room and save generation remain v3. Crew leads need 2.29.2 for the allocation fix.

## Current verification

The [complete system log](../tools/out/system-crew-spawn.log) ends with **COMPLETE 416 system checks passed**. Six new checks reproduce joining after a departure, allocate 64 distinct miners, avoid machinery without changing terrain, preserve a clear supplied pose and aim, replace an overlapping pose, and keep a new arrival supported beside an actual excavated entrance. This is a 64-miner allocation fixture, not a 64-browser networking or performance certification.

The [current standalone public report](../tools/out/network-idle-2.29.2/report.json) passes **seven observations**. Separate guarded Chrome profiles open the portable file with the production app and `ridge-common-v3`; there are no configuration or room overrides. Three browsers automatically share identical terrain bits, seed and epoch. Open SCTP data channels record messages and bytes in both directions. Closing the owned lead transfers authority without changing the observed mine. A fourth fresh browser automatically joins the survivors, with all observed arrivals separated. No test input, firing, pointer lock or runtime exception occurs.

All eight current browser frames were visually inspected. The corrected late arrival sees two miners with equipped cutters beside them, rather than from inside their head. Other views show automatic join and authority-transfer messages with the expected crew counts. The [five-slide comparison](../tools/out/crew-arrival-review.html) preserves three real network sequences and the performance evidence. Cameras follow their allocated arrivals; these are behavioral comparisons, rather than identical-camera asset studies. Earlier all-seven-weapon captures retain their dates and current weapon/grip checks still pass.

The audit initially made two bad assumptions. Inactive aiming is `null`, not `false`. An individual selected ICE pair could report bytes in one direction after traffic moved between nominated pairs, while an open data channel retained substantial bidirectional traffic. The audit now asserts open data-channel message and byte counters and retains every candidate-pair counter. [Rejected aim assertion](../tools/out/network-idle-2.29.1/rejected-aim-fixture.json), [first route selector](../tools/out/network-idle-2.29.1/rejected-route-selector.json), [selected-pair counter assumption](../tools/out/network-idle-2.29.1/rejected-transport-counter.json). These were audit failures; none justifies a networking repair claim.

Public signaling used both production trackers, and observed selected routes were host/UDP on this computer. This establishes public discovery and current application behavior through actual WebRTC channels. It does not certify separate-network NAT traversal, TURN allocation or physical Firefox mouse delivery. The audit performs no mining, purchasing or input actions; earlier public gameplay assertions remain dated.

## Longer frame samples

The earlier art profile’s 49.9 ms frame remains in [its original report](../tools/out/perf-world-art-after/report.json). The repeat investigation used the same animated four-miner rendering fixture, hardware RTX 5070 Ti / D3D11, 1920 by 1080, pixel ratio one and 100 completed warm frames.

| Portable | Sample | Frames | Frame p95 (ms) | Maximum (ms) | Frames above 25 ms |
| --- | --- | --- | --- | --- | --- |
| 2.29.1 repeat | 6 s | 361 | 16.8 | 17.0 | Not separately recorded |
| 2.29.0 preserved baseline | 30 s | 1,802 | 16.8 | 17.0 | 0 |
| 2.29.1 investigation | 30 s | 1,801 | 16.8 | 33.9 | 1 |
| 2.29.2 final | 30 s | 1,803 | 16.8 | 17.3 | 0 |

[Short repeat](../tools/out/perf-crew-hitch-repeat-1/report.json), [long baseline](../tools/out/perf-crew-hitch-long-before/report.json), [long investigation](../tools/out/perf-crew-hitch-long-1/report.json), [final profile](../tools/out/perf-crew-spawn-current/report.json). The profiler now records the complete sample’s frame intervals rather than truncating longer runs to the game’s 600-frame ring buffer. Optional slow-frame records retain work in the affected and preceding frames.

Around the 33.9 ms frame, previous/current render CPU measured 2.8 / 3.5 ms and simulation 0.6 / 0.9 ms. That is insufficient to attribute the delay to simulation; GPU or browser scheduling remains uncertain. The final system suite was running during the final profile, and CPU/GPU samples vary between runs. No speedup or permanent hitch removal is attributed to the spawn fix.

The [release record](../tools/out/crew-arrival-release.json) binds the current portable to network captures, profile and completed system checks. The standalone compiles 65 bundled scripts without external scripts or stylesheets. The [deck report](../tools/out/crew-arrival-review-report.json) confirms five slides render with decoded images, visible navigation and zero errors; all five layouts and the receipt hub were visually inspected. The [dated camera report](../tools/out/movement-build-2.29.2-report.json) confirms exact translation/yaw/pitch with no test pointer lock. The 2.29.2 portable and current network source are preserved beside the public report. Standard tabs for the build and comparison were sent to the existing Firefox session without activation. Physical movement review and remaining landscape/interior art work stay open. No push or deployment is part of this checkpoint.
