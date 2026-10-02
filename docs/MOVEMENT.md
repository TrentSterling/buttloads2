# Movement and mouse input, local 2.27.3

## Co-op consistency, 2.27.3

Ordinary command replies previously teleported guests to the host's position sample. A scan reply delivered after a simulated 100 ms delay moved the camera backward **36.04 cm** and reset walking velocity from **3.80 m/s to zero**. The new reply preserves both velocity and camera history. Host commands include a position only when the command changes it; actual recall and return travel still teleport.

Guest collision now refreshes from current replicated machinery, including moved and collected salvage. Guest prediction and host remote simulation use the same hauling caps and restored deep-lift limit as local movement. Recalls and new snapshot epochs clear old reconciliation targets. Save installation recovers shallow machinery overlap before considering a return to the entrance.

- [Matched co-op plots](../tools/out/coop-controller-review.html) and [raw production-code traces](../tools/out/coop-controller-report.json).
- `node tools/test-coop-controller.mjs`: **8 integration checks pass**. The ordinary-reply and current-machinery tests were run against the old behavior and failed before their fixes.
- `node tools/test.mjs`: **362 system checks pass**. [Full log](../tools/out/system-coop-controller.log).
- `node tools/simulate-journey.mjs --fossil`: the complete lantern campaign passes through recovery, reload, Nell and living lenses, finishing at **535.4 simulated seconds**. [Journey log](../tools/out/journey-coop-controller.log).
- [Current receipt hub](../tools/out/current-review.html) keeps the movement, art and performance before/after evidence together.

The co-op plots replay production code with a fixed simulated reply delay. They do not measure internet latency. The mouse/translation measurements below describe the preserved 2.27.2 pass, which is included in 2.27.3.

The previous build attached locked look to `pointermove`, displayed the latest 120 Hz physics position directly, and climbed terrain with fixed 28 cm increments. The new build gives locked mouse input one `mousemove` handler, interpolates capsule translation between ticks, and resolves actual tread heights and wall contacts. Yaw and pitch use the latest input without smoothing or a physics-tick delay.

## Matched replay

Both controllers use the same flat floor, 120 Hz simulation and constant 3.8 m/s walking speed. Each cadence replay lasts two seconds and excludes the first 20 presentation frames from its statistics.

| Presentation rate | Repeated movement frames before | After | RMS apparent speed error before | After |
| --- | ---: | ---: | ---: | ---: |
| 60 Hz | 0 | 0 | 0.000 m/s | <0.000001 m/s |
| 75 Hz | 0 | 0 | 1.164 m/s | <0.000001 m/s |
| 90 Hz | 0 | 0 | 1.348 m/s | <0.000001 m/s |
| 120 Hz | 0 | 0 | 0.000 m/s | <0.000001 m/s |
| 144 Hz | 45 | 0 | 1.704 m/s | <0.000001 m/s |
| 165 Hz | 85 | 0 | 2.331 m/s | <0.000001 m/s |
| 240 Hz | 230 | 0 | 3.800 m/s | <0.000001 m/s |

On a smooth 25% ramp at 144 Hz, the largest camera elevation jump falls from **27.84 cm to 0.67 cm**. These are deterministic production-code replays, not measured Firefox mouse delivery or physical-mouse feel. The interpolation delays position by one simulation tick (8.33 ms), while rotation remains direct.

## Input and contact changes

- Locked mouse look consumes `mousemove` deltas once. Compatibility pointer events cannot double the rotation. Right-drag and touch still use absolute pointer coordinates, and UI hover processing is skipped during pointer lock.
- Human Start requests `unadjustedMovement` where supported. Promise rejection and legacy event-based APIs fall back to regular capture. Pause, capture loss and malformed input cannot alter aim.
- The camera interpolates the previous and current capsule positions using the physics accumulator. Teleports and menu transitions clear interpolation history. Guest corrections translate both endpoints and preserve local aim.
- Ground movement finds the required step height instead of adding 28 cm. Supported descents follow nearby ground; discrete tread changes ease camera elevation. Freefall and lift retain direct vertical motion.
- Horizontal contacts stop at the surface and project remaining displacement and velocity along the wall. Tall obstructions, ceilings and world boundaries remain solid.
- Moving salvage can slightly overlap the capsule between simulation updates. Bounded recovery moves it to the nearest valid obstacle boundary; the campaign test caught and verified this case. Normal movement skips the expensive overlap query.

The input route follows the [Pointer Lock specification's mousemove stream](https://www.w3.org/TR/pointerlock/#extensions-to-the-mouseevent-interface), with the [documented raw-movement fallback](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API#handling_promise_and_non-promise_versions_of_requestpointerlock). Browser reports alone do not establish that a particular Firefox defect caused Trent's observed jitter.

## Verification and receipts

- [Interactive before/after plots](../tools/out/movement-review.html) and [raw replay data](../tools/out/movement-report.json).
- `node tools/test-movement.mjs`: **17 checks pass**, including 1,000 mouse packets, duplicate pointer events, raw-input fallback, seven refresh rates, irregular frame times, actual view transforms, guest correction, measured steps, diagonal walls, low ceilings, thin obstructions, shafts, lift and moving-salvage overlap.
- `node tools/simulate-journey.mjs`: the fresh campaign completes in **265.2 simulated seconds**. It earns upgrades, hauls both machines, opens the seal, awakens the heart, recovers all geodes and validates the save. [Journey log](../tools/out/journey-movement.log).
- `node tools/test.mjs`: **354 system checks pass**. [System log](../tools/out/system-movement-final.log).
- `node tools/build.mjs`: **64 scripts compile**, with no external scripts or stylesheets.
- `node tools/verify-movement-build.mjs`: checks the portable build's actual camera transform in isolated GPU-backed rendering through page evaluation. It never requests pointer lock or sends mouse/keyboard input. [Build report](../tools/out/movement-build-report.json) and [captured frame](../tools/out/movement-build.png).

The art and prior performance fixes remain in the build. Physics, saves and public Trystero room membership retain their existing formats. No deployment or push is included in this local checkpoint.
