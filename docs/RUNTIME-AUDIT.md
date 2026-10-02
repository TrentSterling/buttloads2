# Current public lobby and surface cost, 2.35.0

After Trent reported that his internet had returned, the actual portable build passed seven production-room observations. Four sequential hardware captures then compared the preserved 2.29.3 pre-art build with current 2.35.0. No game code changed during this audit. The release still has the 423-check result in [system-meadow.log](../tools/out/system-meadow.log).

[The nine-slide runtime review](../tools/out/runtime-review.html) shows current public joining, authority handover, the late arrival, four profile comparisons, repeat CPU work and the 76 ms stall. [The release record](../tools/out/runtime-release.json) binds the current and baseline hashes to all reports.

## Public observations

[The current public report](../tools/out/network-idle-2.35.0/report.json) records three standalone files automatically joining the actual default `ridge-common-v3` room through bundled Trystero. Both production tracker sockets open. Selected routes include host and server-reflexive UDP candidates; open SCTP channels record messages and bytes in both directions. No room or transport configuration overrides are present.

All initial miners share seed 260923, epoch and exact terrain digest 919732532. Closing the owned lead browser promotes a survivor without changing that mine. A fourth fresh browser then joins the survivors. Observed arrival positions remain separate, and the final arrival sees two rebuilt miners with their equipped cutters beside the camera. [Eight native public frames](../tools/out/network-idle-2.35.0/inspection.json) were individually inspected. There are no runtime exceptions, held input, firing or test pointer lock.

All browsers run on this computer. This proves actual public discovery and current application behavior through WebRTC; it does not certify separate-network NAT traversal, TURN allocation, seven-weapon gameplay or physical Firefox mouse delivery. The audit invokes no gameplay or input actions. Earlier all-seven-weapon evidence retains its dates. The current portable and network source are frozen beside this report.

## Repeated surface profiles

Run order is current, baseline, baseline, current. Each capture uses RTX 5070 Ti / D3D11, 1920 x 1080, pixel ratio one, seed 260923, 100 completed warm frames and ten seconds per scene. Yard, four moving miner render fixtures, northern slope and outcrop use the same setup code. Four-miner positions animate directly for rendering; this is separate from the real public-network observations. Cloud and animation phase vary between images. All sixteen profile frames were individually inspected.

| Scene | Baseline mean CPU work (ms), two runs | Current mean CPU work (ms), two runs | Baseline frame maxima (ms) | Current frame maxima (ms) |
| --- | --- | --- | --- | --- |
| Yard | 3.67, 3.37 | 3.18, 3.08 | 16.8, 33.4 | 16.9, 26.8 |
| Four moving miners | 4.23, 4.78 | 4.77, 4.27 | 16.8, 33.4 | 33.3, 19.9 |
| Northern slope | 3.28, 3.30 | 3.44, 3.24 | 17.0, 16.8 | 16.9, 33.3 |
| Outcrop | 3.09, 3.34 | 3.06, 3.86 | 66.6, 16.9 | 33.3, 76.0 |

CPU work means render-submission mean plus simulation mean. All scenes have frame p95 of 16.8 ms under the capture's 60 Hz ceiling. Current samples contain ten frames above 25 ms across 4,795 recorded frames; baseline samples contain six across 4,802 frames. The p95 does not establish hitch-free delivery or uncapped frame rate.

The worst current outcrop interval is 76 ms. Its preceding sample records 56.8 ms render CPU and 20.1 ms simulation; the sample following that interval records 6.8 ms render CPU and 13.3 ms simulation. Another 50 ms interval follows 34.5 ms render CPU and 7.9 ms simulation. Raw records include work in the affected and preceding frames. These observations do not isolate simulation, GPU blocking, browser scheduling, instrumentation, garbage collection or competing processes as the cause.

Native art remains present. Median submitted triangles rise from 539,085 to 710,734 in the yard, from 678,733 to 850,382 with moving miners, from 442,793 to 596,626 on the northern slope and from 435,836 to 589,170 at the outcrop. Median draws are 108 to 108, 369 to 369, 59 to 57 and 46 to 44 respectively. Counts include the full renderer's passes; they differ from the static native asset inventories.

Raw captures: [current first](../tools/out/perf-runtime-current-1/report.json), [baseline first](../tools/out/perf-runtime-baseline-1/report.json), [baseline repeat](../tools/out/perf-runtime-baseline-2/report.json), [current repeat](../tools/out/perf-runtime-current-2/report.json). GPU query values vary substantially between runs and remain in the reports. CPU ranges overlap for moving miners and the northern slope; these captures do not justify a broad rendering repair or speedup claim.

## Workload and remaining review

[Read-only GPU snapshots](../tools/out/runtime-workload.json) show 25% activity and 14,792 MiB allocated before these audits, 25% and 14,394 MiB after the first owned profiler exits, and 22% and 14,555 MiB after the final receipt verifier exits. An unsandboxed, sanitized Chrome process query found no remaining `bb-chrome-` audit profiles before receipt verification. No external applications were stopped or modified. The GPU snapshots are not per-application utilization traces; the earlier Qwen report does not establish its exact current state.

Physical Firefox turning and strafing remain untried. Quiet-machine timings, the cause of intermittent stalls and separate-network co-op remain open. Native art still needs work on bare ground, repeated clumps, oversized leaves, broad rock faces and uneven interiors. No push or deployment is part of this audit. The broader goal remains active.

The guarded [deck render report](../tools/out/runtime-review-report.json) verifies nine slides, decoded images, unclipped navigation, zero errors and no pointer lock. All nine layouts, the twenty-one-section hub and the portable camera frame were visually inspected. [The current camera report](../tools/out/runtime-camera-report.json) again verifies direct aim and interpolated translation within that fixture. The build and standalone runtime deck were sent as new tabs through the existing Firefox process; foreground visibility and physical mouse feel are not inferred from that request. [The inspection record](../tools/out/runtime-inspection.json) retains this scope.

Current release SHA-256: `e0df890c1c0385bbcc37da8c80091e1d853a596fc035e601b18dec6a6f1ae6b4`.

Preserved baseline SHA-256: `2495b1b726ba979281f1c207e1346f4b575b7f50aadf85f7b7a2afbff38d27fe`.
