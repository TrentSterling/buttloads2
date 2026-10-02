# Ground and cover checkpoint, local 2.29.1

The northern foreground now receives meadow patches, and common land has baked dry-grass, damp-green and soil variation. Meadow colours follow the same field. Five outcrops use independently rotated rounded profiles, different proportions and sloping crests. The player controller, shared collision, saved excavation, trees, buildings and powered beacon retain their existing behavior.

The [ten-slide comparison](../tools/out/world-art-review.html) contains six matched views, two rejected comparisons, performance and checks. All twelve [final native game frames](../tools/out/landscape-world-final/capture.json) were visually inspected. The preceding [2.29.0 capture](../tools/out/landscape-final-2/capture.json) is reused with its original date and hash; every camera matches exactly. The previous portable and art sources remain in `tools/out/world-art-before/`, including the renderer extracted from that portable. Final changed sources and the portable are preserved beside the final capture report.

## Critic findings and corrections

The initial meadow rendered black because `View.merge` retained position, normal and UV streams but discarded colours. The [red regression](../tools/out/world-art-colors-rejected.log) fails with `merger dropped meadow colours`. The corrected merger preserves the colour stream for materials that use it, and supplies white for source meshes lacking colours. A mixed coloured/plain mesh check verifies the complete stream after batching.

The first new outcrop profile still looked like a regular abrupt shelf. It was rejected alongside the black meadow. `landscape-world-01` preserves both renders. The final rounded profiles vary their orientation and proportions. These rocks still show broad triangular facets, and their established approximate box contact remains; this checkpoint does not claim precise capsule contact with every rock face.

The northern camera now has visible cover between the walking position and the existing stand. The meadow still reads as angular separate tufts close to the player. Ground finish has a slope contribution and broad dry/damp patches; its joins fade to the original field colour at the actual excavation boundary. Colours are baked during construction, without adding per-frame field sampling or extra fragment-noise work.

The western rise, grove, reservoir, both gardens, town, workshop, unpowered/powered wells, conifer and outcrop were also inspected. Earlier flowers, pines, root flares, furniture and facade grain remain. Uniform distant hills improve with material variation, while the distant cliff, garden borders and broad facade/interior contrast still need art direction.

## Verification

The complete log ends with **COMPLETE 410 system checks passed**. [Full log](../tools/out/system-world-art.log). Three new checks cover a complete nonblack meadow colour stream, correct coloured/plain merging, exact field colour joins and finite shared-height ground vertices. Existing exterior-face, victory-gate, planting, town UV, route, save, all-seven-weapon, controller, prediction and authority checks still pass.

The original seam check initially selected only the old grass material and excluded the new coloured ground meshes. Its [failed aggregate log](../tools/out/world-art-seam-selector-rejected.log) is retained. Its selector now includes the actual `surfaceGround` meshes; all 80 ray probes remain and pass. This was a stale test selector, not a geometry slit.

The standalone compiles 65 scripts with no external scripts or stylesheets. Protocol, public room and saved crew generation retain v3. This pass does not claim a new public network session or full campaign run. The following movement and public-network review must retain the original objective rather than treat this art checkpoint as full completion.

The [release record](../tools/out/world-art-release.json) binds the current portable hash to final game renders and the current hardware profile. The [slideshow report](../tools/out/world-art-review-report.json) confirms all ten slides render with decoded images, visible navigation and zero errors. All ten slide layouts were visually inspected. The [dated current camera report](../tools/out/movement-build-2.29.1-report.json) confirms interpolated translation and immediate yaw/pitch against exact expected transforms. These checks do not establish physical mouse feel. Headless pages never acquire pointer lock or send desktop input.

## Performance method

The [before](../tools/out/perf-world-art-before/report.json) and [after](../tools/out/perf-world-art-after/report.json) profiles use the preserved 2.29.0 portable and current 2.29.1 portable. Each runs the yard, animated four-miner rendering fixture, actual northern rise and actual outcrop approach. Hardware Chrome uses RTX 5070 Ti, D3D11, 1920 by 1080, pixel ratio one, 100 completed warm frames and six-second samples. CPU is mean simulation plus render submission. Shadow refresh can vary mean draw counts in the animated scene. GPU values and frame tails remain observations rather than a rendering-speedup claim.

| Scene | CPU before / after (ms) | CPU change (ms) | Mean draws before / after | Frame p95 before / after (ms) |
| --- | --- | --- | --- | --- |
| Yard | 3.22 / 2.99 | -0.23 | 107 / 108 | 16.80 / 16.80 |
| Animated four miners | 4.56 / 4.24 | -0.32 | 509 / 513 | 16.80 / 16.80 |
| Northern rise | 3.03 / 3.33 | +0.30 | 58 / 59 | 16.80 / 16.80 |
| Outcrop approach | 2.86 / 3.01 | +0.14 | 45 / 46 | 16.80 / 16.80 |

Changes use unrounded samples. The four-miner maximum frame was 33.4 ms before and 49.9 ms after. That spike remains in the raw report and slideshow; unchanged p95 does not establish hitch-free play. The lower yard and crew CPU samples are not attributed to an art speedup.

The verge has five material batches and 46,207 triangles, versus four and 43,885 before. The additional meadow material carries vertex colours. Common scene, town, ridgeline and beacon triangle/batch counts remain unchanged. The ground keeps its original triangle grid and acquires a colour attribute.

Physical Firefox mouse delivery and play feel still need human review. The earlier controller fixes are retained, and physical movement feedback was requested during this pass. No response is treated as a successful play-feel verdict. The broad improvement goal remains active. No push or deployment is part of this checkpoint.
