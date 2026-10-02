# Common grounds art, local 2.28.1

The [13-slide review](../tools/out/grounds-review.html) compares the preserved portable 2.28.0 build with the current build at eight matching cameras. The deck includes failed liner and root rounds. Lighting, HUD, seed and postprocessing remain identical across the pairs. All eight final frames were visually inspected; the camera above the well and the powered state are explicitly labeled inspection fixtures.

The well has three staggered masonry courses, separate cap stones, a continuous inset liner, recessed water and a low spill lip. Its old solid AABB is replaced with shared ring segments, leaving the visible opening clear to the capsule. The three benches have separated bevelled seat and back slats, reclined back support, curved frames, armrests, feet and bolts. Their wood reuses the original depot texture. Shared seat and back contact replaces the former disconnected leg blockers; grounded remote miners query the actual furniture meshes only within the furniture bounds.

Tree bases now flare through a small continuous ring. Every bottom vertex follows common height and sits 65 mm below it, replacing the sharp claw-like pieces. Low rosettes have visible connected spines and folded leaves. Planting uses an independent seed outside claim soil and public paths, retaining all original tree records and trunk obstacles. A compacted bed covers the grass joints beneath the square's retained flagstones.

## Critic iterations

| Round | Failure | Correction |
| --- | --- | --- |
| 01 | The continuous liner used only three subdivisions and cut a triangle through the well. Smooth normals also made the blocks look inflated. | Tessellated the full circle separately and used hard face normals with the existing world-space stone grain. |
| 01 | Root ribbons formed sharp stars. Leaflets looked detached. | Replaced the ribbons with a smaller continuous root flare and connected the leaflets to ground-based spines. |
| 02 | The liner outer radius exceeded the stone-course radius and hid the exterior masonry. | Inset the liner; horizontal rays now verify visible exterior courses. The intentional spill lip is excluded from those course probes. |

One capture ran before the rebuilt distribution was produced; `grounds-final` is retained but excluded from final evidence. The authoritative [final capture report](../tools/out/grounds-final-2/capture.json) records the exact portable SHA-256. Both after-performance reports match that hash.

## Behavior verification

`node tools/test.mjs` ended with **COMPLETE 371 system checks passed**. The [complete log](../tools/out/system-grounds.log) includes the town doorway walk, the real route to Inez and the reservoir walk without lift. `node tools/test-common-art.mjs` passes four new checks: open well and visible masonry, host/guest seat support, remote boot placement on the well and all seats, and conforming root bases with protected planting. Mapped geometry also has matching position/UV counts and finite attributes.

`node tools/build.mjs` produces a portable 1356 KiB build with 65 compiled scripts and no external scripts or stylesheets. [Presentation verification](../tools/out/grounds-review-report.json) confirms all 13 slides render and every image decodes. [Portable camera verification](../tools/out/movement-build-2.28.1-report.json) confirms immediate aim and interpolated translation in 2.28.1. Both report zero errors and no pointer lock. All browser verification uses isolated headless page evaluation and rendering; no input events or foreground activation.

The preceding full fossil journey remains dated 2.28.0, at 535.4 simulated seconds. This checkpoint does not claim a new full campaign or public internet run. The current system suite covers fossil behavior and save conservation; preceding public Trystero, all-seven-weapon and host-migration receipts remain in their dated tabs.

## Matched performance

| Scene | CPU before | CPU after | Frame interval p95, before / after |
| --- | --- | --- | --- |
| Yard | 3.30 ms | 3.24 ms | 16.80 / 16.90 ms |
| Four miners | 4.55 ms | 4.56 ms | 16.80 / 16.90 ms |
| Mine | 3.79 ms | 3.74 ms | 16.80 / 16.80 ms |
| Cutting | 5.78 ms | 4.76 ms | 16.90 / 16.90 ms |
| Well square | 3.06 ms | 3.27 ms | 16.80 / 17.40 ms |
| Grove | 2.93 ms | 2.88 ms | 16.80 / 16.80 ms |

CPU work is mean simulation plus mean render submission. Each pair is sequential, with no pure-system jobs running during sampling: 1920 x 1080, pixel ratio one, RTX 5070 Ti, D3D11 headless Chrome, 100 completed warmup frames and six-second samples. The [main before](../tools/out/perf-grounds-before/report.json), [main after](../tools/out/perf-grounds-after/report.json), [detail before](../tools/out/perf-grounds-detail-before/report.json) and [detail after](../tools/out/perf-grounds-detail-after/report.json) preserve raw data, versions and build hashes. Four-miner samples use rendering fixtures. Small differences and the cutting reduction should not be sold as a speedup from this art change. GPU elapsed queries vary; these captures do not certify physical Firefox frame delivery.

The furniture is eight static material meshes and 7,840 triangles. Common geometry remains 20 meshes and grows from 191,752 to 224,260 triangles, including the connected planting. Town remains 230 meshes and drops to 63,216 triangles because its placeholder well and benches were removed. The separate ridgeline stays at three meshes and 4,320 triangles.

## Remaining critic findings

The existing powered-well crystals wash out to white. Conifers repeat tiers, open slopes remain sparse, older outcrops are too geometric, and garden flowers still look primitive. Root flares read better than the rejected stars but remain simple. Physical Firefox mouse delivery and human movement feel remain a play-review question. The broader improvement goal stays active. No push or deployment is part of this checkpoint.
