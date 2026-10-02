# Delayed guest movement, local 2.28.3

The [five-slide review](../tools/out/guest-motion-review.html) records a reproduced stale-pose failure and the remaining latency findings. The preceding [compatibility fix](CREW-COMPATIBILITY.md), controller, art and performance passes remain in the current build.

## Reproduction and change

In the production-code replay, the host continues receiving movement inputs while authority pose messages are suppressed for 2.5 seconds. The old guest keeps correcting toward the last received pose after its velocity extrapolation stops. Walking nearly stalls, then fresh authority poses cause an 8.17 m teleport. The old run accumulates 8.39 m of small corrections, excluding that teleport.

Guest correction targets now expire 250 ms after receipt, allowing local capsule prediction to continue through a missing-update interval. The identical replay has no teleport and 0.14 m of total small corrections. Fresh modest corrections still preserve velocity, interpolation and aim while checking collision. A fresh error over 2.5 m still relocates the guest; expiry does not discard legitimate new authority state.

Pose broadcasts and full world frames include their authority capture time. An older frame can install world state without replacing newer miner positions, health or equipped weapons. Guest health and its own sling grip/charge are preserved during shared-state copying before fresh member data is applied. A final regression reproduced the old frame clearing a newer sling grip; the [failing check](../tools/out/guest-motion-sling-before.log) is retained. Snapshot installation resets the ordering watermark for its new epoch.

Capture timestamps are required by crew protocol 3. Current builds automatically join `ridge-common-v3` and write to `crew-global-v3`, preventing untimestamped older hosts from bypassing ordering. Startup prefers that slot, then carries a v2 or v1 crew claim forward; both prior slots and the personal claim remain intact. Compatibility integration rejects both older wire generations, transfers the actual mine between current miners, preserves authority migration and tests all three save-selection paths.

The bundled Trystero source sends transmissions as separate nonce-tagged chunk sequences. Each transmission can await data-channel backpressure; receive callbacks complete when its last chunk arrives. That supports explicitly guarding game pose ordering. The replay controls message order; no actual public-network occurrence of that ordering is claimed here.

## Measured scope

| Case | Simulated RTT | Small corrections before | Small corrections after | Teleports after |
| --- | --- | --- | --- | --- |
| Straight walking | 0 ms | 0.00 m | 0.00 m | 0 |
| Straight walking | 100 ms | 0.00 m | 0.00 m | 0 |
| Straight walking | 250 ms | 0.16 m | 0.16 m | 0 |
| Turning | 100 ms | 0.57 m | 0.57 m | 0 |
| Turning | 250 ms | 3.15 m | 3.15 m | 0 |
| Wall sliding | 100 ms | 0.24 m | 0.24 m | 0 |
| Pose-message gap | 100 ms | 8.39 m | 0.14 m | 0 |

Every replay uses production Crew input/pose admission and prediction, production capsule contact, 20 Hz messages, 120 Hz movement and 144 Hz camera sampling for four seconds. Inputs continue during the pose gap. Other game systems and presentation are inert; the host capsule advances from admitted input through production `Player.step`. [Before traces](../tools/out/guest-motion-before.json) and [after traces](../tools/out/guest-motion-after.json) retain samples, versions and source hashes. Small correction totals are accumulated displacement, not a single jump or distance from the host.

Sustained latency cases are unchanged. Turning at 250 ms still generates 3.15 m of small corrections over four seconds. That is an open movement finding; this checkpoint does not accept overall network feel. Physical Firefox mouse delivery remains unverified. The existing no-desktop-input restriction remains in force.

## Verification

- `node tools/test-guest-motion.mjs`: seven new checks pass. They cover the long pose gap, expiry versus fresh corrections, blocked correction contact, ordering of position/health/weapons, required wire timestamps, turning/sliding at 60/144/240 Hz, and actual world-frame installation while retaining newer guest state and sling grip/charge. The existing snapshot test also verifies ordering reset.
- `node tools/test.mjs`: **COMPLETE 383 system checks passed**. [Full log](../tools/out/system-guest-motion.log).
- `node tools/build.mjs`: portable 1357 KiB, 65 scripts compile, no external scripts or stylesheets. [Release hash](../tools/out/guest-motion-release.json).
- [Presentation verification](../tools/out/guest-motion-review-report.json): all five slides render with visible navigation, zero errors and no pointer lock. All five were visually inspected, including the unchanged latency table.
- [Portable camera verification](../tools/out/movement-build-2.28.3-report.json): version 2.28.3, crew generation/room/save v3, immediate aim and interpolated translation, zero errors and no pointer lock. Its SHA-256 matches the release record. Verification uses isolated headless page evaluation and rendering.

No new physical mouse test, public-WebRTC run, full campaign or frame-performance measurement is claimed. The preceding full fossil campaign stays dated 2.28.0; art and six-scene performance captures stay dated 2.28.1. No push or deployment is part of this checkpoint. The broader goal remains active.
