# Cutter reconstruction, local 2.46.0

The cutter now has fitted rounded motor covers, recessed dark louvres, a visible rear maker plate, subtle painted wear and closed bevelled auger flights. The first-person model and remote crew equipment use the same production geometry. The scoop, lance and resonator retain their original attachments with the revised common motor casing.

This is a bounded art checkpoint. Two casing candidates were rejected after visual inspection. The shaft facets, bright clean metal, repeated paint wear, broad rear panel and stiff miner posture still fail a finished-art standard. The broader improvement goal remains active.

## Model and submission costs

| Inventory | 2.45.1 | 2.46.0 |
| --- | --- | --- |
| Mechanical tool, all heads | 32 meshes / 19,310 triangles | 31 meshes / 22,922 triangles |
| Animated cutter rotor | 4 meshes / 660 triangles | 3 meshes / 2,644 triangles |
| Gravity | 7 meshes / 5,840 triangles | Exact |
| Axe | 11 meshes / 5,533 triangles | Exact |
| Sling | 13 meshes / 4,660 triangles | Exact |

The flight body now shares the existing steel material, allowing the rigid rotor merge to remove one render mesh. The rotor and torque needle remain independent. The new casing and flights add 3,612 model triangles. The shared casing alone adds 1,628 when the other mechanical heads are equipped.

| Matched native view | Cached calls / triangles, before to after | Shadow refresh frame calls / triangles, before to after |
| --- | --- | --- |
| Local cutter | 232 / 592,092 to 231 / 595,704 | 726 / 1,418,171 to 725 / 1,421,783 |
| Local scoop | 234 / 594,676 to 234 / 596,304 | 728 / 1,420,755 to 728 / 1,422,383 |
| Native cave cutter | 134 / 495,424 to 133 / 499,036 | 702 / 1,649,385 to 701 / 1,652,997 |
| Local gravity | 225 / 585,702 to exact | 719 / 1,411,781 to exact |

Two shared 256 by 256 paint textures add 524,288 bytes of base capacity, or 699,048 bytes including complete mip levels. The existing paint material uses albedo and roughness channels; crew material clones reuse both maps. Equipment material objects decrease from 24 to 23; all lights remain exact. These counts do not establish an FPS gain under the reported competing GPU workload. Previous world, ore and crew batching scripts remain byte-identical.

## Verification and receipt method

The frozen baseline is the 2.45.1 portable. The [conservation report](../tools/out/cutter-art-conservation.json) compares the entire scene and unaffected tool submodels: 1,190 other mesh records, attributes, transforms, material values, terrain bytes, contacts, ore/economy state, lights and animation roots remain exact. All 71 portable scripts compile; only `src/tool-art.js` and version metadata change. The portable SHA-256 is `b44a600709b82ebe1076afb01482fef1ba9b0f6bcd5725a761af5dc26d4e664a`.

Twenty-four matched views retain six equipment studies, all seven equipped miner studies, both aiming extremes, all seven first-person tools, an active cutting pose and a native cave camera. All 48 final baseline/current frames were inspected individually. The [inspection manifest](../tools/out/cutter-art-inspection.json) records hashes and findings for those frames, all twenty rendered slides, the hub and the build (70 final files). Studies use identical neutral lighting and are explicitly labelled; native frames retain production lights and terrain. Simulations and transport are inert. The cutting frame sets the actual mining state and advances its presentation only. These are static art and submission receipts, not gameplay traversal, physical input, public co-op or frame-time measurements.

Five new structural regressions pass: closed outward flights across both material seams, closed capped housings with complete UVs/bounds, actual FrontSide raycasts from physical faces, map reuse after crew removal and all seven grips at three pitches with independent rotor/needle animation. All 519 system checks pass. The [full suite log](../tools/out/cutter-art-suite.log) records the complete checkpoint run. The twenty-slide deck presents fifteen matched pairs, two rejected art candidates, counts, checks and remaining criticism; its raw links retain all twenty-four pairs.

## Rejections and remaining criticism

1. [Round one](../tools/out/cutter-art-round-1/critic.json): painted and inner casings intersected, creating jagged scalloped seams. Bright vent bars looked pasted on. The yellow panel stayed blank and the flight contour remained coarse.
2. [Round two](../tools/out/cutter-art-round-2/critic.json): the rear cover improved but the front paint still intersected its core. A top study clipped the tip. The final front cover changes actual cross sections; both final top cameras contain the full tool.
3. [Cutting fixture](../tools/out/cutter-art-rejected-action-fixture/rejection.json): it wrote a nonexistent mining-frame property and disabled animation. The corrected frozen-baseline/current pair drives actual `g.mining` state and verifies a rotated rotor.
4. [Grip fixture](../tools/out/cutter-art-rejected-grip-fixture.json): the new test left descendant world matrices stale, producing a false grip failure. Updating descendants fixes the test; production grip coordinates are unchanged.

The auger shaft still shows facets close up. Smooth clean metal lacks dirt and convincing wear; flight ends terminate abruptly. Paint chips repeat in bands and are modest at native scale. The rear panel, switch and regular vents remain simple. The headlamp makes the yellow body pale. The scoop underside retains rough triangle seams. The scoop, lance, resonator and miner posture still need stronger art and motion criticism. Quiet-machine CPU/GPU timing, physical Firefox mouse/strafing feel and separate-network NAT traversal remain unverified.

The preceding full fossil campaign remains dated 2.44.0. Public default-lobby receipts remain dated 2.35.0; no new public run is claimed here. No commit, push or deployment is included.
