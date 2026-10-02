# Spatial canopy batching, local 2.36.1

The four landscape-wide canopy meshes previously submit all 220,332 leaf triangles in each of eight observed directions. Their roughly 96 m bounding spheres intersect the camera frustum even when much of the grove is behind the camera. Explicit static partitioning now gives the same triangles 64 m spatial batches. Mean main-camera canopy submission falls to 76,129.5 triangles across the eight clear views, a 65.4% reduction. This is a submission count, not a measured FPS gain.

The earlier rigid-assembly merging remains intact: it removed 388 mesh objects and reduced yard/parcel draw counts in 2.35.1. This checkpoint changes only the four native canopy materials. It does not simplify the art or alter grass, terrain, contacts, player models, tools, lighting or multiplayer.

Each whole triangle goes into the X/Z cell containing its centroid. The helper retains original vertex attributes and material identity, copies rigid transforms/shadow/layer state, and computes each batch's actual bounds. Indexed buffers compact the original vertex IDs within each cell. No vertices are welded or normals recomputed. Transparent, partial, grouped and articulated inputs are rejected before mutation; only the explicit static canopy caller opts in.

The common model still contains 387,354 triangles and 1,162,062 vertex records. Sorted oriented triangle hashes include original position, normal, UV and colour values for each material. These hashes, contact tuples, tree/meadow records and terrain hash match frozen baseline exactly. Common mesh batches increase from 21 to 61; canopy batches increase from 4 to 44. New index buffers and mesh objects have a cost. No new materials, textures or lights are allocated by the partition.

Eight matched, clear native cameras record the following counts. Cached whole-frame counts include the other scene/tool/UI passes; canopy counts isolate the primary camera.

| View | Canopy triangles, before → after | Cached whole-frame draws, before → after | Cached whole-frame triangles, before → after |
|---|---:|---:|---:|
| Depot and yard | 220,332 → 83,522 | 228 → 240 | 779,276 → 642,466 |
| Mine entrance | 220,332 → 96,000 | 88 → 101 | 709,972 → 585,640 |
| West grove | 220,332 → 89,862 | 43 → 51 | 589,014 → 458,544 |
| North grove | 220,332 → 75,136 | 42 → 46 | 587,962 → 442,766 |
| East path | 220,332 → 29,506 | 44 → 48 | 590,538 → 399,712 |
| Eastern parcel | 220,332 → 88,389 | 63 → 75 | 599,610 → 467,667 |
| Reservoir | 220,332 → 16,552 | 49 → 52 | 600,822 → 397,042 |
| Away from west grove | 220,332 → 130,069 | 491 → 507 | 861,097 → 770,834 |

Cached draws increase by 3–16 per view. A shadow refresh adds another 40 draws relative to that cached difference. Shadow-pass triangles remain unchanged at 755,343 above the cached whole-frame count; there is no shadow-geometry saving. Moving bodies can invalidate the shadow cache, so the refresh cost matters in play. These observations alone do not establish a net frame-time win under the reported competing Claude GPU workload.

The 96 m alternative is frozen and rendered in the same eight clear poses. Mean canopy submission is 119,062.5 triangles in 8.5 draws, versus 76,129.5 in 13 draws at 64 m. Pure Three.js frustum predictions also compare 24/32/48 m cells. A 48 m grid saves another 1,604 triangles per mean view while adding 3.625 mean canopy draws. The 64 m choice is provisional; quiet-machine CPU/GPU timing should decide whether it needs adjustment. Predictions are labelled separately from native renderer observations in the receipts. An initial prediction used the Node fixture's 1440 ? 900 aspect rather than the capture's 1440 ? 1000 aspect. That [rejected prediction](../tools/out/foliage-batching-prediction-rejected-projection.json) remains frozen; corrected predictions agree with every native 64/96 m canopy count.

Initial baseline and 96 m capture fixtures included three blocked observation positions. Those raw reports and images remain frozen. The accepted harness resolves each nominal position to its nearest clear supported pose, checks capsule clearance, and captures all alternatives at exactly the same resulting cameras. Camera-fixture failures are not described as game art regressions.

All eight baseline, eight 64 m candidate and eight release native frames were individually visually inspected. Final release images match baseline in seven views; the west-grove frame differs in two of 1,440,000 pixels, with maximum channel difference one. The separate candidate comparison retains its 2–16 changed-pixel counts. Native geometry and shadows appear preserved. This preservation check does not approve repeated grass clumps, dark rear foliage, thin pine fins, sparse slopes, long cliff shelves or other weak facades as finished art.

Verification: `COMPLETE 436 system checks passed` in [the full system log](../tools/out/system-foliage-batching.log). Four new pure contracts cover oriented triangle attributes, rejection of behind-camera geometry while preserving front-face ray hits, rigid transforms/shadow/layer state, and rejection of unsupported inputs. [Geometry conservation](../tools/out/foliage-batching-conservation.json), [final pixel differences](../tools/out/foliage-batching-pixels-release.json), [native release counts](../tools/out/foliage-batching-release/report.json) and [cell predictions](../tools/out/foliage-batching-prediction.json) retain the raw evidence.

The [eleven-slide review](../tools/out/foliage-batching-review.html) shows all eight native comparisons, counts, alternatives, criticism and raw links. Frozen baseline is 2.36.0; frozen release is 2.36.1. Guarded headless verification uses direct page evaluation, no input events, no focus changes and no pointer lock. Physical Firefox mouse feel remains untried, the public Trystero audit remains dated 2.35.0, and separate-network NAT behavior remains unverified. No push or deployment is part of this checkpoint. The broader improvement goal remains active.
