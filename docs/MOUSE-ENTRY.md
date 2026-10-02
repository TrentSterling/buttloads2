# Mouse entry and HUD drag, local 2.29.3

An automatic guest joins through `Crew.receiveSnapshot`, which installs the mine and enters play without a human Start gesture. The running game previously treated the first left world press as tool fire without requesting mouse capture. Separately, the HUD capture listener stopped right presses over its buttons before the game could start drag look. These are reproduced input defects; they do not establish the cause of every physical Firefox jitter report.

The first unlocked desktop world press now requests raw mouse capture without firing the tool. Pending requests are not duplicated. Captured presses still fire normally. The existing raw-to-standard fallback remains. A refused capture enables unlocked tool use and right-drag look; a later successful Resume capture clears that fallback. Left HUD actions and touch input retain their owners.

Right-drag starting over the running HUD now reaches the game. Active look gestures skip HUD pointer coordinates, hover changes and layout reads, while UI-owned touch controls still receive their moves. A small desktop help cue describes the acquisition gesture and hides during requests, captured play, drag and touch play. Two matched native frames verify that cue with the same camera and unchanged art.

| Actual registered-handler observation | Frozen 2.29.2 | Current 2.29.3 |
| --- | --- | --- |
| Capture requests on first automatic-guest world press | 0 | 1, raw movement requested |
| Tool fires on acquisition press | true | false |
| Right-drag beginning over HUD stopped by HUD | true | false |
| Yaw from that 25 px horizontal drag | 0 rad | -0.05 rad |
| World-start drag crossing HUD | 0.08 rad | 0.08 rad |
| HUD dirtied by that active drag move | true | false |
| Layout reads on that active drag move | 1 | 0 |
| Captured world press fires tool | true | true |

The [matched trace](../tools/out/mouse-entry-report.json) runs the real portable-snapshot installation and registered handlers on inert elements. It uses frozen prior Game and GameUI sources, then current sources. The [baseline failure](../tools/out/mouse-entry-before-failure.log) expects a raw capture request and observes none. The first fixture attempt mistakenly encoded a nonportable typed-array snapshot; its [rejected fixture log](../tools/out/mouse-entry-invalid-snapshot.log) remains separate. The corrected failure validates a portable snapshot before asserting the missing request.

Verification: `COMPLETE 423 system checks passed`, retained in [the complete log](../tools/out/system-mouse-entry.log). Seven new checks cover automatic entry, pending-request deduplication, HUD-start drag, left HUD and touch routing, raw fallback, refused capture with working tools and later success, and help-cue visibility. The existing 17 movement checks pass, including direct locked aim, duplicate-event exclusion, refresh-rate interpolation, ramps, wall slides and actual camera presentation.

The standalone build compiles 65 scripts. Its SHA256 is `2495b1b726ba979281f1c207e1346f4b575b7f50aadf85f7b7a2afbff38d27fe`; the frozen baseline is `e841e5ee4c9e2722f0b59cd108f30e87f3b3f3bff33a512724c6611bd142071b`. The [native render report](../tools/out/mouse-entry-render-report.json) records matched 1440 × 1000 RTX 5070 Ti views, the cue, zero errors and no pointer lock. The headless helper's pre-navigation capture guard stays enabled. No browser input, OS input or foreground activation is used. Source hashes accompany the trace, and the receipt builder rejects mismatched evidence.

The [five-slide comparison](../tools/out/mouse-entry-review.html) leads with the behavioral results. All five slide layouts and both native game frames were visually inspected; navigation remains visible. The [guarded release camera check](../tools/out/movement-build-2.29.3-report.json) verifies current aim and interpolated translation exactly. The [receipt hub](../tools/out/current-review.html) preserves earlier art, network, movement and performance studies with their original dates. The public global-room audit remains dated 2.29.2; this input-only checkpoint does not claim a new public gameplay run. Protocol, room and saved crew generation remain v3. The preceding 30-second four-miner profile remains 16.8 ms frame p95 and 17.3 ms maximum; no speedup is attributed to this change.

Critic assessment: the acquisition and gesture-ownership defects are fixed in these reproductions. The new label explains an action; it is not an art pass. Physical Firefox mouse delivery, capture success and wall-slide feel remain unverified until human play. Intermittent scheduling spikes still have no confirmed cause. Close foliage and rocks, garden borders, shop interiors and distant-cliff composition remain art findings. No push or deployment is part of this checkpoint. The broader improvement goal remains active.
