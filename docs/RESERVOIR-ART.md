# Reservoir construction art, local 2.36.0

The ridge reservoir had smooth pole supports, a single dark slab under its tank, applied seam strips and a plain cone. The replacement uses chamfered rectangular posts with stone footings and iron shoes, paired timber bracing and joint plates, separate deck boards over joists, guarded catwalk edges, ladder brackets and curved handholds. Thick shaped tank staves have recessed gaps, hollow hoops and clamps. Sheet-metal roofing has standing seams, an opaque underside, eave and capped vent. An outlet pipe, flanges and valve finish the support area.

These are native Three.js meshes, merged into the common scene's existing material batches. Wood and roof surfaces reuse existing yard maps. Exposure, sunlight, shared terrain, collision and gameplay systems retain their previous configuration.

The [nine-slide comparison](../tools/out/reservoir-review.html) retains six matched views of frozen [baseline 2.35.2](../tools/out/reservoir-before/report.json) and [release 2.36.0](../tools/out/reservoir-release/report.json). Five views use walking-height cameras; the tank close-up is explicitly an elevated model study. The town-distance frame shows the foreground workshop unchanged and much of the tower occluded. The deck does not treat that small distant change as a whole-town makeover.

The [first reconstruction](../tools/out/reservoir-round-1/report.json) is rejected. Its exterior roof winding was correct, but it lacked an underside. The tank study showed sky through the front roof panels. Cream bolts also produced large repeated dots, tiny overlapping rail segments added clutter, and rounded timber extrusions were expensive. The corrected [second round](../tools/out/reservoir-round-2/report.json) adds a closed roof shell, smaller steel bolts, simpler rails and planar timber chamfers. Each timber piece uses 44 triangles. The valve spokes now lie in the wheel plane.

The [inspection record](../tools/out/reservoir-inspection.json) covers all six baseline, six rejected, six revised and six frozen release images. All nine slide layouts, the receipt hub and the portable camera frame are also visually inspected. The rejected build/source remain intact. The final construction is more readable, but the timber still looks uniformly clean, some broad stave faces and seams remain strong, and paired bracing is repetitive. Deep deck joints are dark. Sparse slopes, repeated planting and the other facades/interiors remain wider criticism. This checkpoint does not accept the entire environment.

| Structural inventory | Baseline | Release |
| --- | ---: | ---: |
| Common-scene triangles | 380,184 | 387,354 |
| Common-scene mesh/material batches | 21 | 21 |
| Common-scene lights | 0 | 0 |
| Common-scene texture references | 2 | 3 |
| Approach cached draws | 50 | 49 |
| Approach shadow-refresh draws | 538 | 537 |

Net geometry adds **7,170 triangles**. The corrected revision removes **6,816 triangles** relative to round one. Its extra common-scene texture reference reuses the yard's metal map; no new texture is created. All six views' draw counts stay equal or fall by one or two as batch bounds change. The common-scene material batch count stays 21. Full-frame triangle counts include the rest of the scene and shadow passes; they differ from the common inventory. No new timing benchmark runs under the reported competing GPU workload, and these counts do not establish FPS gains.

Frozen native reports verify exact cameras, obstacle tuples, tree and meadow placement records, and terrain hash. All capture poses are unblocked; mapped/coloured attributes are complete and finite. Build and source hashes match their frozen files. The release SHA-256 is `88b02d78feeea36f00122ebfb17b31ee395847c0c7bc5822ca290cdf02e93599`.

`node tools/test-reservoir.mjs tools/out/reservoir-round-1/common-view.js` reproduces the missing underside in the [retained failure log](../tools/out/reservoir-round-1-contracts.log). Its tank-front and hoop-surface checks already pass. Release tests probe all 24 roof panels from above and below, all 32 stave fronts and 16 hoop positions from both sides. `node tools/test.mjs` ends with [COMPLETE 432 system checks passed](../tools/out/system-reservoir.log).

The preceding [388-mesh merge](MESH-MERGING.md) and [simulation-driven camera easing](STEP-CAMERA.md) remain in this release. Guarded static rendering uses no mouse/keyboard events, activation or pointer lock. Physical Firefox input feel and quiet-machine timing remain pending. Public Trystero evidence stays dated 2.35.0; this art pass does not claim another public gameplay run or separate-network NAT verification. The broader improvement goal remains active.

The [guarded slide report](../tools/out/reservoir-review-report.json) verifies nine decoded slides, visible navigation, zero exceptions and no pointer lock. The [portable camera report](../tools/out/reservoir-build-report.json) records exact interpolated position and immediate yaw/pitch on the RTX 5070 Ti D3D11 renderer. The 2.36.0 build and standalone reservoir deck were sent through standard Firefox new-tab requests without explicit window activation; foreground visibility is unverified.
