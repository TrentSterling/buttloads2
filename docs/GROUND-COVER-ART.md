# Native ground and low cover, local 2.38.0

The preceding perimeter views still show broad beige ground and isolated tall grass. This checkpoint adds a lower vegetation scale and scattered angular stone fragments to selected slopes. It also reduces the beige slope blend and bakes green/soil variation around the cover into the existing ground colour stream. It is a modest detail pass; the wide landscape remains unfinished.

The new native mesh contains 693 plants with three folded, notched leaves each, plus 218 closed angular stone fragments. Each leaf has a raised centre and continuous normals; stone faces keep their angular normals. Independent deterministic placement follows the shared surface height, excludes the protected claim, walking routes, buildings and reservoir, and biases fragments downhill. The mesh splits into six bounded static batches and shares the existing ground material. No new material, texture or light is allocated.

## Critic passes

Ten matched clear supported views cover the western slope/outcrop, northern meadow, reservoir path, southern grove, western boundary, northeast corner, mine entrance and two close details. The frozen portable frames preserve seed, light, time, camera and 1440 by 1000 viewport. Ten baseline, eight first-round, eight second-round, ten third-round and ten release frames were inspected. Five duplicate baseline recaptures are byte-identical to earlier inspected frames; three changed recaptures were opened again, along with both new detail views.

Round one fails inspection: the leaves face backwards, mostly showing as dark slivers, and the smooth fragments form a ring around the outcrop. Its frozen source fails the upward-leaf ray contract. Round two fixes winding, makes the fragments angular and shifts their distribution downhill, but the visible leaves still look like pale flat picks. Round three reduces their size and brightness, adds a folded centre and gives the outline two distal lobes with a notch. Both rejected revisions retain their sources, builds and native images.

An intermediate test sampled exactly at the shared leaf root. That point lies on a floating-point triangle edge, so its exact ray was unreliable after conversion to Float32 geometry. The fixture now probes a small neighbourhood around each sampled root and requires an upward face. This fixture correction is distinct from round one's backwards winding failure; the corrected fixture still rejects round one.

Remaining criticism: repeated three-leaf clusters, simple chip silhouettes, sparse coverage and broad empty slopes. The western slope and close details improve most. The reservoir path is chiefly a palette difference. The northeast view submits no new cover batch at all. The wide mine view changes little. Dark rear foliage, tall bare trunks, oversized crowns, faceted outcrops, broad wall faces, continuous cliff shelves and facades/interiors remain unfinished. The deck explicitly retains these weak views.

## Geometry and actual submission cost

| Model inventory | Before | Release |
| --- | ---: | ---: |
| Common scenery triangles | 376,698 | 376,698 |
| Perimeter triangles | 34,912 | 34,912 |
| Separate cover triangles | 0 | 20,556 |
| Combined common/perimeter/cover batches | 67 | 73 |

| Matched native view | Cached draws before / after | Cached triangles before / after |
| --- | ---: | ---: |
| Western slope | 54 / 55 | 467,526 / 478,344 |
| Western outcrop | 46 / 47 | 439,308 / 450,126 |
| Northern meadow | 43 / 44 | 397,567 / 400,813 |
| Reservoir path | 56 / 57 | 410,266 / 414,234 |
| Southern grove | 43 / 44 | 429,548 / 440,366 |
| Western boundary | 46 / 47 | 436,703 / 447,521 |
| Northeast corner | 29 / 29 | 337,962 / 337,962 |
| Mine entrance | 100 / 102 | 590,470 / 595,528 |
| Broadleaf detail | 931 / 932 | 738,495 / 749,313 |
| Gravel detail | 527 / 531 | 706,564 / 722,062 |

Cached frames add zero to four draws and zero to 15,498 triangles. Every shadow refresh adds six further draws and 20,556 triangles above the cached-frame difference. This art adds cost; no FPS benefit is claimed. The earlier rigid merging and spatial canopy batches remain intact. Trent reports another Claude workload hammering the GPU, so quiet-machine timing remains pending.

The two close views expose a separate existing submission problem. `inspect-ground-submissions.mjs` observes actual renderer calls with draw ranges and instance counts, then requires exact agreement with both `renderer.info` and the frozen native totals. The broadleaf baseline includes 284 cavern, 147 discovery and 128 deep-scene draws; its release retains the same counts and adds one cover draw. The gravel baseline includes 160 cavern, 134 town and 65 discovery draws; its release retains those counts and adds four cover draws. These assemblies are candidates for the next merge/visibility audit. This observation does not yet prove which objects are occluded or safe to combine.

The first diagnostic used object callbacks, which do not account correctly for actual draw ranges, instancing and repeated material passes. Its total assertion failed before any result was saved. The corrected diagnostic observes `renderBufferDirect`, accounts for range/instance counts and passes exact totals in all eight baseline/release observations.

## Verification

`node tools/test.mjs` ends with **COMPLETE 442 system checks passed**. Three new contracts cover visible upward leaf faces, visible closed stone tops and buried foundations, complete finite attributes, bounded batches, shallow geometry and exclusion from protected areas/buildings. The frozen first revision fails the concrete leaf regression.

`node tools/verify-ground-cover-conservation.mjs` compares sorted oriented triangles by material and original position, normal, UV and colour attributes. All 376,698 common triangles and all measured perimeter, ridge and verge geometry remain exact. Contacts, tree/meadow/garden/rock placement, understory, ridge bounds and terrain bytes match. Ground positions, normals, UVs and indices match exactly; only its colour stream changes.

The final guarded headless rendering check observes thirteen slides, image decoding, navigation, exceptions and pointer-lock state. Page-scoped evaluation also checks immediate yaw/pitch and interpolated capsule translation on the portable build. The current hub contains 27 receipt sections and retains a 719-pixel-wide native image at the checked viewport, with visible navigation and no overflow. No OS input, browser activation or pointer lock is used. Physical Firefox mouse feel remains unverified. The public Trystero audit stays dated 2.35.0; separate-network traversal remains unverified.

- [Thirteen-slide native review](../tools/out/ground-cover-review.html)
- [Frozen baseline](../tools/out/ground-cover-before-detail/report.json)
- [Rejected first revision](../tools/out/ground-cover-round-1/report.json)
- [Failed leaf contract](../tools/out/ground-cover-round-1-contracts.log)
- [Rejected second revision](../tools/out/ground-cover-round-2/report.json)
- [Third revision](../tools/out/ground-cover-round-3/report.json)
- [Frozen release](../tools/out/ground-cover-release/report.json)
- [Exact conservation](../tools/out/ground-cover-conservation.json)
- [Actual submission inventory](../tools/out/ground-submissions.json)
- [Full system log](../tools/out/system-ground-cover.log)
- [Portable camera check](../tools/out/ground-cover-build-report.json)
- [Slide rendering check](../tools/out/ground-cover-review-report.json)
- [Hub rendering check](../tools/out/ground-cover-hub-report.json)

Baseline SHA256: `09b1c3a8b69389b089414ac488b1598d39b9744d2420d05630d0189bf5db6218`.

Release SHA256: `c28c1e51c09d414e891e6e77c67ae59b6a10a1c63c45d88dbf70db98765722cb`.

Build and receipts are sent to Firefox through standard new-tab requests. Foreground visibility is unverified. No push or deployment; the broader improvement goal remains active.
