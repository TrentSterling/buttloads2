# Simulation-driven camera elevation, 2.35.2

The controller audit found that `Player.cameraPose` advanced stair-height easing on each read. Elevation depended on presentation cadence even when the capsule followed the same route. Reading the pose twice with a 1/60-second argument moved its height by 3.456 cm without advancing simulation.

The decay now runs once inside `Player.step`. Previous and current elevation offsets interpolate with the same endpoints as capsule translation. Camera reads leave those endpoints unchanged. Immediate yaw/pitch, physical capsule movement, support, collision and network wire/save formats retain their behavior.

The [five-slide comparison](../tools/out/step-camera-review.html) includes production-code plots, four native fixture frames and baseline contract failures. Frozen [2.35.1](../tools/out/step-camera-before/build.html) compares with [2.35.2](../tools/out/step-camera-after/build.html). The preceding 388-mesh optimization remains in this build.

The [raw replay](../tools/out/step-camera-report.json) uses eight 16 cm treads, 120 Hz physics and a 3.8 m/s starting horizontal velocity over two seconds. Eight presentation schedules range from 30 to 240 Hz. Common read checkpoints every 0.1 seconds shorten some intervals; they compare actual camera reads at matching times. Separate uniform-rate traces preserve ordinary frame spacing.

| Presentation schedule | Maximum matched height difference versus 240 Hz, before | After |
| --- | ---: | ---: |
| 30 Hz | 4.725 cm | <0.000001 cm |
| 60 Hz | 1.697 cm | <0.000001 cm |
| 75 Hz | 1.065 cm | <0.000001 cm |
| 90 Hz | 0.630 cm | <0.000001 cm |
| 120 Hz | 1.077 cm | <0.000001 cm |
| 144 Hz | 0.622 cm | <0.000001 cm |
| 165 Hz | 0.284 cm | <0.000001 cm |

Every capsule position, horizontal speed and support sample matches the baseline for its presentation schedule. The lower-rate presentation still has fewer frames; this correction does not remove actual scheduling stalls or supply missed images. The sub-micrometre numerical agreement describes this controlled replay, not a physical precision claim.

[Baseline](../tools/out/step-camera-before/capture.json) and [release](../tools/out/step-camera-after/capture.json) render the actual portable's camera at the 0.2-second checkpoint. A synthetic stair fixture is added to the native yard, and the replay's final look direction faces the depot. It uses direct page evaluation with no game input, mouse/keyboard events, foreground activation or pointer lock. Both builds' actual camera transforms match their replay poses. The baseline 30/240 Hz camera heights are 1.638238/1.590987 m; the release heights are both 1.553376 m. All four frames were individually inspected; the held cutter and depot remain visible. This fixture is not ordinary gameplay or a public co-op run.

`node tools/test-step-camera.mjs --before` fails all three contracts on frozen baseline source; [the failure log](../tools/out/step-camera-before-contracts.log) remains. Current checks pass for read purity, eight matched cadences, simulation without rendering, collision and fresh aim. Existing 17 movement checks retain raw input ownership, fixed-step presentation, ramps, wall slides, ceilings, shafts, lift, teleport/menu reset and guest corrections. `node tools/test.mjs` finishes with [COMPLETE 429 system checks passed](../tools/out/system-step-camera.log).

The portable compiles 65 scripts and has no external scripts/styles. The guarded [slide report](../tools/out/step-camera-review-report.json) and [portable camera report](../tools/out/step-camera-build-report.json) preserve their rendering scope and input restrictions.

This identifies a camera-elevation defect. It does not establish the cause of Trent's physical Firefox mouse jitter or certify turning/strafe feel. He has not tried the input changes while competing GPU work continues. Quiet-machine timing, separate-network co-op and wider hard art criticism remain open. Public-room evidence stays dated 2.35.0, and mesh-merging evidence stays dated 2.35.1. No push or deployment is part of this checkpoint. The broader goal stays active.

Final build SHA-256: `d4c122694ab6a49ef7092f9d5dd5e9ab515785b7796875c68ee9d55e700014d0`.
