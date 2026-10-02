# Perimeter construction, local 2.37.0

The common boundary previously used three aligned box rows, including a painted green middle stripe. Each box sampled the ground only at its centre. The steep northeast corner exposed large floating undersides, separated courses and a staircase silhouette. This pass reconstructs the native wall mesh; lighting, post-processing and terrain are preserved.

Unequal stone lengths, staggered courses, clipped vertical shoulders, shallow front profiles and subdued stone colours replace the boxes. Every vertex follows the shared ground height. Foundations bury below the surface; a narrow recessed rubble heart closes through-joints. All decorative vertices remain outside the traversable surface rectangle. The existing capsule boundary, contacts, terrain and saved mine stay unchanged.

## Critic passes

Eight matched supported camera positions cover the west, north, east and south faces, steep northeast corner, west grove, east path and mine entrance. The native frozen frames use the same seed, light, time and 1440 by 1000 viewport. All eight baseline, eight rejected first-round, eight revised and eight release frames were individually inspected. Wide views deliberately retain the limited visual impact at distance.

Round one passes the face/cap and foundation contracts, but fails the third contract with an open through-joint at west z=22.95, ground lift 0.45 metres. It also looks like clipped bricks with patchy colour. Round two reshapes the visible front shoulders, reduces colour contrast and adds recessed rubble backing. All three current contracts pass. Sources, portable builds, native frames and the failing contract log remain retained.

The first observation fixture used terrain height at the capsule centre and could not find a clear east pose on the steep slope. This was a capture setup failure. The corrected fixture samples the capsule footprint, then independently checks that the chosen capsule is clear and supported. Accepted baseline and candidate camera records match exactly; the rejected partial fixture remains separate.

Remaining criticism: broad stone faces, three fairly regular courses and triangular lit-face shading. Sparse surrounding terrain, repeated vegetation, thin pine sprays, continuous cliff shelves and other facades/interiors are still unfinished. The wall pass fixes floating and disconnected construction; it does not pass the whole environment as finished.

## Geometry and submission cost

| Model inventory | Before | Release |
| --- | ---: | ---: |
| Common-scene triangles, including old wall | 387,354 | 376,698 |
| Separate perimeter triangles | 0 | 34,912 |
| Combined triangles | 387,354 | 411,610 |
| Combined mesh batches | 61 | 67 |

The old wall contributes 10,656 triangles. Its replacement adds 34,912, for a net increase of 24,256 triangles. The new vertex-coloured material clones an existing stone material and shader; it adds one material allocation, no textures and no lights. Six bounded static batches replace the old wall's inclusion in larger stone/moss bounds. Earlier canopy partitioning and rigid assembly merging remain intact.

| Matched native view | Cached draws before / after | Cached triangles before / after |
| --- | ---: | ---: |
| West face | 46 / 46 | 442,766 / 436,703 |
| North face | 41 / 41 | 397,838 / 395,070 |
| East face | 44 / 45 | 382,850 / 381,346 |
| South face | 49 / 49 | 436,823 / 430,752 |
| Northeast corner | 30 / 29 | 358,860 / 337,962 |
| West grove | 41 / 42 | 422,932 / 421,628 |
| East path | 48 / 49 | 403,772 / 402,268 |
| Mine entrance | 99 / 100 | 585,240 / 590,470 |

Shadow refresh adds six further draws and 24,256 triangles above the cached-frame difference in every view. Total refresh submission increases in every view. Cached submission falls in seven views because the old wall shared wider stone bounds; the mine view adds 5,230 cached triangles. These are native draw and geometry counts, not an FPS improvement. Trent reports another Claude GPU workload, so quiet-machine timing remains pending.

## Verification and receipts

`node tools/test.mjs` ends with **COMPLETE 439 system checks passed**. Three new contracts check visible inner faces and caps, buried foundations, traversal exclusion and backed face joints. The frozen first revision fails the concrete joint regression.

`node tools/verify-perimeter-conservation.mjs` reconstructs only the old wall with its exact original box operations, subtracts its 10,656 oriented triangles from the frozen baseline, and compares every remaining common triangle by material and original position, normal, UV and colour attributes. All 376,698 other common triangles match exactly. Ridge and verge geometry, contact tuples, tree/meadow/garden/rock placement and terrain bytes also match.

The final guarded headless rendering check observes eleven slides, image decoding, navigation, exceptions and pointer-lock state. It also checks immediate yaw/pitch and interpolated capsule translation on the portable build through page evaluation. No OS input, browser activation or pointer lock occurs. Physical Firefox input feel remains unverified. The public Trystero audit remains dated 2.35.0; separate-network traversal remains unverified.

- [Eleven-slide native review](../tools/out/perimeter-review.html)
- [Frozen baseline report](../tools/out/perimeter-before-clear/report.json)
- [Rejected revision report](../tools/out/perimeter-round-1/report.json)
- [Failed joint contract](../tools/out/perimeter-round-1-contracts.log)
- [Revised geometry report](../tools/out/perimeter-round-2/report.json)
- [Frozen release report](../tools/out/perimeter-release/report.json)
- [Exact conservation report](../tools/out/perimeter-conservation.json)
- [Full system log](../tools/out/system-perimeter.log)
- [Portable camera check](../tools/out/perimeter-build-report.json)
- [Slide rendering check](../tools/out/perimeter-review-report.json)

Baseline SHA256: `f2b5febc3befc21539da2c59b96138ffd35bad9271e73ec04411ad085c2fdcb2`.

Release SHA256: `09b1c3a8b69389b089414ac488b1598d39b9744d2420d05630d0189bf5db6218`.

Build and receipts are sent to Firefox through standard new-tab requests. Foreground visibility is unverified. No push or deployment; the broader improvement goal remains active.
