# Continuous miner joints, 2.58.0

The previous separate thigh, knee and shin pieces exposed scalloped rigid overlap when bent. Whole trouser and sleeve surfaces now bend continuously around their existing joints. Knee pads and hollow retention bands use the same deformation, so they remain attached through the inspected knee poses. Existing carry, capsule travel, boot/glove anchors and all seven weapons remain.

The [ten-slide review](../tools/out/miner-joint-review.html) contains all 29 matched native pairs, two rejected equipment trials, an actual native-versus-instanced GPU comparison and unchanged atlas pixels. It leads the 60-section [current hub](../tools/out/current-review.html). Evidence is bound to portable SHA `fce398e6d3f28780168a1d9f3ee05631d82679ded9c4eab47aacf1647fdb8e88` in [conservation](../tools/out/miner-joint-conservation.json) and [inspection](../tools/out/miner-joint-inspection.json).

## Construction and resource cost

Smooth weights blend a normalized joint quaternion along each garment. The upper endpoint remains fixed; the cuff endpoint follows the complete lower-joint rotation. Surface, directional depth and point-distance shaders share this transform. Normals use the inverse deformation Jacobian rather than only rotating the original normal. Sweep spheres use the maximum vertex distance from the joint pivot, which bounds any weighted quaternion rotation. No garment vertices are rebuilt on the CPU each frame.

Ten joint meshes have their own surface and shadow material hooks. Compatible instance groups upload one independent quaternion per active source, including different left/right elbow rotations. Each group's owned geometry clone is disposed when the batch is cleared or resized; native geometry and borrowed materials survive.

| Per worker resource | 2.57.0 | 2.58.0 | Change |
| --- | ---: | ---: | ---: |
| Body meshes | 52 | 48 | -4 |
| Model triangles | 27,168 | 26,224 | -944 |
| Model geometry bytes | 1,457,744 | 1,431,792 | -25,952 |
| Main body material objects | 15 | 25 | +10 |
| Additional custom shadow material objects | 0 | 20 | +20 |
| Total owned rig material objects | 15 | 45 | +30 |
| Textures | 1 | 1 | 0 |

The fifteen base material objects retain their properties. The existing 256 x 256 atlas pixels stay exact (262,144 base bytes before mipmaps); full trousers and sleeves change their UV placement. Thirty-eight other body pieces retain exact attributes, transforms and material boundaries. All 1,260 compatible same-material comparisons across eight crew colours pass.

Four active miners add 242,096 bytes of cloned joint geometry and 640 bytes of quaternion data. Those batch buffers exceed the four models' combined 103,808-byte geometry saving. The fixture has 192 body instances and 12,928 allocated matrix/quaternion bytes. Lower geometry counts do not establish a net memory reduction or zero execution cost.

## Verification and inspection

Two completed pure-system runs end with `COMPLETE 581 system checks passed`. Six new joint checks cover exact untouched pieces, closed directed-edge topology and positive volume through anatomical bends, finite arbitrary-axis sweeps inside conservative bounds, fixed and fully rotated endpoints, independent instance poses, matching shadow hooks and buffer/material ownership. Topology does not certify freedom from self-intersection. Existing garment coverage thresholds were retained using disposable posed geometry references; a real elbow-volume failure was corrected by increasing the sleeve radii. All 71 standalone scripts compile.

Only `miner-art.js` and `crew-view.js` change executable behaviour against 2.57.0. The other 69 scripts and normalized portable shell remain exact, including input, controller, networking and world art. The suite ran before the metadata-only version bump; the final executable sources match the profiled candidate.

All 29 final camera and bone-pose pairs match exactly. Body inventory and render counts intentionally change. All seven first-person draw/triangle counts match. Twenty-nine candidate and nine baseline full PNGs were individually viewed this pass. Twenty other baseline PNGs hash-match the previously individually inspected 2.57.0 frames, giving all 58 frames explicit inspection provenance.

The elbow stress fixture now applies the 100-degree bend after the weapon carry solve, which previously overwrote it. Its tool is hidden to inspect the joint; the seven remote tool and two aim fixtures verify carry appearance separately. Five local PNGs are byte-identical; the scoop differs by thirteen pixels at one channel level. The resonator has a visible coil-region difference, so exact first-person pixel conservation is not claimed despite unchanged weapon executable code.

The actual [GPU fixture](../tools/out/miner-joint-gpu.json) freezes four different arm/knee poses and refreshes shadows. Native source draws submit 1,803,217 triangles in 1,056 calls; instanced draws submit the same triangles in 702 calls. Ten active bend groups retain forty different joint quaternions. The two PNGs differ at 35 pixels, maximum channel difference 23; they are not pixel-identical. These are local render fixtures, not connected internet clients.

The first retained bend trial left rigid bands trailing away from the trouser. The second rotated the pad halfway but broke its attachment to the bands. Both were rejected after looking at the native frames. The accepted construction bends all three knee material pieces with the trouser. The earlier rigid-only trials remain in their dated local review and did not ship.

## Dated performance windows

Three guarded RTX capture windows use 1920 x 1080 and four-second yard/four-moving-miner fixtures. No input or actual peers are dispatched. The candidate build had 2.57.0 metadata; its executable sources match final 2.58.0 exactly. All six profile PNGs were individually inspected. Animation phases are not fixed between profile screenshots, so they are not matched art comparisons.

| Four-miner measurement | Baseline 19:32 UTC | Candidate 19:46 UTC | Repeated baseline 19:49 UTC |
| --- | ---: | ---: | ---: |
| Mean simulation plus render CPU, ms | 2.79 | 3.38 | 4.28 |
| Mean GPU, ms | 10.63 | 15.32 | 9.89 |
| Frame p95, ms | 16.8 | 16.7 | 16.8 |
| Cached calls | 214 | 204 | 214 |
| Refreshed-shadow p95 calls | 796 | 776 | 796 |

The unchanged yard's GPU means are 7.69, 14.30 and 13.69 ms, with exactly 107 calls and 589,264 triangles throughout. Competing machine load is unknown. The runs establish stable capped cadence in those windows and lower submission counts; they do not isolate incremental shader cost, prove a speedup or accept quiet-machine FPS.

## Harsh verdict and remaining work

The knees and elbows now read as continuous clothing, and equipment follows the bent knee. Accept that improvement. Shoulder caps still look molded; broad stretched folds need more deliberate crease placement. Repeated anatomy, primitive moustache, clean leather and fixed claw-like glove curl remain visible. The native strafe retains a wide crouched pose. The wider landscape still has broad cliff panels, sparse hills and repetitive foliage.

Physical Firefox turning/strafing, quiet-machine timing and separate-network/relay acceptance remain unverified. The last actual public global-lobby audit remains dated 2.51.1 with unchanged network sources. The broader polish goal stays active. Packaging/deployment evidence belongs in [shipment](../tools/out/miner-joint-shipment.json); a standard Firefox tab request does not certify foreground visibility or physical feel.
