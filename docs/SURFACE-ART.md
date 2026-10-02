# Surface geometry critic record, local 2.28.0

The [surface slideshow](../tools/out/surface-review.html) compares the preserved portable 2.27.3 build with 2.28.0 at eight identical cameras. The foreground depot, miner and tool artwork remain from the preceding hard art pass. This checkpoint changes background geometry and construction; lighting, postprocessing, HUD and gameplay values stay consistent across the pairs.

Broadleaf trees have tapered trunks, curved boughs, irregular flattened crowns and pointed leaf sprays attached to small twigs. Conifers use staggered branch clusters. Construction has its own random stream, while the original 64 planted tree records and trunk obstacles remain exact. Bark reuses the existing original timber texture. Root endpoints follow common height and the trunk extends beneath it, though their angular silhouette still needs refinement.

The three shops have pitched panels, standing seams, closed gables, ridge flashing, verge trim, gutters and downpipes. Their porch posts now support awnings and braces. Roof collision uses the capsule footprint and slope rather than a flat invisible roof box. Grounded remote miners query the actual roof meshes in the roof height band. The added porch posts were repositioned after the full rescue check found one blocking the public approach to Inez.

Five separate grooved crags sit outside the walkable land. They add silhouette without changing shared ground height, saved excavation or movement boundaries. Path polygons split along the exact two-metre ground triangles, eliminating slope intersections. Round conforming joins cover the reservoir route's bends.

## Rejected iterations

| Round | Finding | Result |
| --- | --- | --- |
| 01 | Continuous rock rim looked like an enclosing wall; common geometry reached 274,532 triangles. | Rejected. Separated the crags and reduced crown geometry. |
| 02 | Rounded layered rocks resembled stacked cakes; path corners exposed grass wedges. | Rejected. Rebuilt crags as irregular grooved heightfields and added conforming round joins. |
| 03 | Leaf-edge detail needed connected twigs; old porch posts supported nothing. | Added twig connections, awnings and bracing, then recaptured. |
| First awning | Canopy covered the original shop names. A new post obstructed the route to Inez. | Rejected. Moved supports inward and reran the unchanged real rescue walk. |
| Gable signage | Moving the signs above the awning still hid them from the matched close camera. | Rejected. Mounted names on the canopy front and reinspected both shops. |

These failed capture folders remain under `tools/out/`. The slideshow includes wall, stone-cake and covered-sign comparisons. No automated art score is used. All eight final frames were visually inspected; the final capture report remains `UNREVIEWED` because that field is the harness status, not an art-approval mechanism.

## Verification

- `node tools/test.mjs`: **COMPLETE 367 system checks passed**. The successful [complete log](../tools/out/system-surface-passing.log) supersedes the retained failed post-obstruction run.
- `node tools/test-surface-art.mjs`: five geometry/contact checks pass. They cover scattered path face interiors and all reservoir bends, original tree planting, crag bounds and finite geometry, real roof lift/traversal, and remote roof boot placement.
- `node tools/test-rescue.mjs`: all 11 checks pass, including the actual walk to Inez after rescue.
- `node tools/simulate-journey.mjs --fossil`: [complete journey](../tools/out/journey-surface-final.log) passes through ember recovery/reload, Nell, living lenses and upgraded placed lamps at 535.4 simulated seconds.
- `node tools/build.mjs`: portable 1348 KiB build; 64 scripts compile with no external scripts or stylesheets.
- [Final GPU capture report](../tools/out/surface-final-3/capture.json): 2.28.0, eight frames, zero runtime errors, no pointer lock. Page evaluation and render capture only; no desktop input or foreground automation.

The static common group remains 20 merged meshes, now 191,752 triangles versus 83,360 in the baseline. Town remains 230 meshes and 63,416 triangles. The separate ridgeline adds three meshes and 4,320 triangles. This geometry increase is stated explicitly; acceptance cannot come from merely adding polygons.

## Performance evidence and limits

The [before report](../tools/out/perf-surface-clean-before/report.json) and [after report](../tools/out/perf-surface-clean-after/report.json) measure four scenes sequentially after the pure simulation jobs finished. Each records portable version and SHA-256, hardware, completed warmup frames, six-second samples, CPU submission, simulation, frame intervals, draw calls and raw GPU elapsed queries. The slideshow displays their exact CPU-work change. Four-miner views use rendering fixtures, not new public network sessions.

Both runs use 1920 x 1080, pixel ratio one, RTX 5070 Ti and D3D11 headless Chrome. CPU work means mean simulation plus mean render submission, not FPS. Captures run near the 60 Hz limit; raw GPU elapsed values vary and do not establish a GPU improvement. The earlier performance-fix claims remain dated 2.27.1 in PERFORMANCE.md.

| Scene | CPU before | CPU after | Frame interval p95, before / after |
| --- | --- | --- | --- |
| Yard | 3.35 ms | 3.35 ms | 16.80 / 16.80 ms |
| Four miners | 4.70 ms | 4.61 ms | 16.80 / 16.80 ms |
| Mine | 4.15 ms | 4.02 ms | 16.80 / 16.80 ms |
| Cutting | 5.38 ms | 5.40 ms | 16.80 / 16.80 ms |

The observed CPU differences are small and should not be interpreted as a speedup. The [13-slide presentation report](../tools/out/surface-review-report.json) confirms image decoding with zero runtime errors and no pointer lock. The [preserved portable camera report](../tools/out/movement-build-2.28.0-report.json) confirms immediate aim and translation interpolation in 2.28.0.

## Open critic findings

Ground cover is sparse. Roots still look angular, conifers repeat tiers, and the well, benches, gardens and broad facade pattern remain basic. The surface reads with more varied silhouettes, but this is not full-game art acceptance. Physical Firefox mouse delivery and human movement feel also remain Trent's play-review question. The full improvement goal remains active. No push or deployment accompanies this checkpoint.
