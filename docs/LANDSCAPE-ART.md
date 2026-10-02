# Landscape art checkpoint, local 2.29.0

The landscape now uses branched conifers, stemmed flowers, grounded meadow patches, exposed rock faces and a jade/brass powered beacon. Town weatherboards receive original procedural grain, small wear, joints and nails. This is a geometry and material pass through `common-view.js`, `town-view.js` and `foreman-view.js`.

The [17-slide review](../tools/out/landscape-review.html) contains twelve matched game views, three rejected rounds, performance and behavior receipts. The [baseline portable and source](../tools/out/landscape-before/) preserve 2.28.5. [Baseline captures](../tools/out/landscape-baseline/capture.json) and [final captures](../tools/out/landscape-final-2/capture.json) record identical cameras, seed, sunlight and 1440 by 1000 viewport. These are actual game renders. The powered view explicitly sets the existing victory state for inspection.

## Construction and critic passes

Conifers have 42 to 48 curved boughs with folded foliage fans and visible woody connections. Tree coordinates, trunk obstacles and original placement-stream consumption stay exact. The first thin model was rejected because it looked like a fishbone. Fuller foliage improves the silhouette, although nearby branch fans still look papery and angular.

Flowers now have curved stems, attached lance-shaped leaves, seven to nine folded petals and flattened centres. The pointed pinwheel petals of the first pass were softened. Low connected rosettes meet the soil instead of floating above the bed. Original garden positions remain. The raised rectangular bed borders still need further construction detail.

Grass uses a separate seeded stream and gathers in patches around existing stands. Every bent blade starts at shared ground height. Claims, public roads and service areas stay clear. The west-slope view improves considerably; the north-slope foreground remains too bare. The grove still contains open ground between its bands of planting.

Outcrops use uneven exposed heightfields that descend into the original ground. Dark faces vary with slope and a seam. They replace floating overlapping slabs. The first bevelled blocks and the later capped prisms were rejected: after the normals were corrected, they still looked like bunkers. The final rocks sit in the slope, but the five outcrops retain a similar pointed family silhouette. Existing approximate box obstacles remain; this checkpoint does not claim exact rock-surface capsule contact.

The powered beacon uses three six-sided jade crystals with brass cups and supporting struts, a brass rim and a thin mint inlay. The old white diamonds and halo lost all colour in sunlight. A ray regression caught reversed exterior winding in the replacement; the visible facets and normals are now checked explicitly. The ordinary well remains open and unpowered until the same furnace victory gate.

Weatherboards use a small original canvas texture for grain and wear, with subtle joints and nail heads. Mapped geometry retains UVs through material merging. An early mapped-material build left 537 separate town meshes and was rejected; the final town has 233 versus 230 before. The final walking-height views show finish detail, but stronger broad material and interior contrast remain open art work.

All twelve final native frames were visually inspected. This includes both gardens, unpowered and powered wells, the workshop, the wide town, the reservoir, both slopes, grove, conifer and outcrop. The reservoir tower, benches, broadleaf crowns and distant cliff retain earlier models. Their presence in a comparison is not a claim that this pass rebuilt them.

Rejected renders remain in `landscape-round-01`, `landscape-round-02` and `landscape-round-03`. The [rejected exterior-ray log](../tools/out/landscape-winding-rejected.log) retains the culled-top failure. A capture accidentally made before the last successful build is retained separately as `landscape-stale-round-03` and excluded from the final evidence. The accepted capture hash is recorded in [landscape-release.json](../tools/out/landscape-release.json).

## Verification

The complete system log ends with **COMPLETE 407 system checks passed**. [Full log](../tools/out/system-landscape.log). Four new checks cover outward outcrop peaks and exposed flanks, visible crystal exterior faces and the victory gate, protected planting on shared height, and complete finite UVs for mapped facade batches. The outcrop flank ray uses the exposed upper face because a fixed low ray can pass beneath rising ground at the eastern edge.

The existing terrain, routes, furniture contact, remote boot grounding, saves, all seven weapons, prediction and authority checks still pass. The portable build compiles 65 bundled scripts without external scripts or stylesheets. Crew protocol, public room and saved crew slot retain v3. New public network sessions and a full campaign are outside this checkpoint's evidence.

All seventeen slides decode their images and render with visible navigation, zero errors and no test pointer lock. [Deck check](../tools/out/landscape-review-report.json). All slide layouts were visually inspected, with the two data slides also checked at full size. The [dated 2.29.0 camera check](../tools/out/movement-build-2.29.0-report.json) confirms exact interpolated translation and immediate yaw/pitch. Its portable hash matches the art and current performance reports. The final portable and three changed art sources are also preserved beside the capture report.

## Measured cost

The [baseline](../tools/out/perf-landscape-before/report.json) and [current](../tools/out/perf-landscape-after/report.json) captures use isolated hardware Chrome at 1920 by 1080, pixel ratio one, RTX 5070 Ti, 100 completed warm frames and six-second samples. CPU is mean simulation plus render submission. The four-miner view animates rendering fixtures.

| Scene | CPU before / after | Draws before / after | Frame p95 before / after |
| --- | ---: | ---: | ---: |
| Yard | 3.26 / 3.16 ms | 105 / 107 | 16.9 / 16.8 ms |
| Four miners | 4.44 / 4.93 ms | 517 / 508 mean | 31.9 / 16.8 ms |
| Mine | 3.92 / 4.29 ms | 138 / 139 mean | 16.9 / 16.8 ms |
| Cutting | 4.96 / 5.24 ms | 299 / 301 mean | 16.9 / 16.8 ms |
| Well square | 3.44 / 3.49 ms | 161 / 145 mean | 50.0 / 16.8 ms |
| Grove | 3.24 / 3.07 ms | 52 / 53 | 17.4 / 16.8 ms |

The direct [well/grove baseline](../tools/out/perf-landscape-detail-before/report.json) and [current](../tools/out/perf-landscape-detail-after/report.json) use the same protocol. Animated shadow refresh makes crew and well draw counts vary over a sample. The lower frame p95 in the current crew and well samples is retained as an observation, rather than attributed to this art as a speedup. GPU timer values vary between samples and remain in the raw reports. The new art adds geometry and modest submission cost in the mine and crew scenes. All six current samples have 16.8 ms frame p95; these short headless captures do not establish physical Firefox performance.

| Asset group | Meshes before / after | Triangles before / after |
| --- | ---: | ---: |
| Common scene | 20 / 21 | 224,260 / 266,996 |
| Verge and meadow | 4 / 4 | 2,125 / 43,885 |
| Town scene | 230 / 233 | 63,216 / 67,212 |
| Ridgeline | 3 / 3 | 4,320 / 4,320 |
| Powered beacon | 7 / 4 | 636 / 1,980 |

## Remaining work

The wider art goal remains active: northern foreground coverage, uniform ground colour, angular foliage, similar outcrop silhouettes, bed borders, broad facade/interior contrast and distant-cliff composition still need judgment. The current shapes improve identifiable failures without completing visual acceptance.

Physical Firefox mouse delivery and play feel remain unverified. The earlier acknowledged-history fix and current camera transform checks are automated evidence, not a human input-feel verdict. No test acquires pointer lock or sends desktop input. No push or deployment is part of this checkpoint.
