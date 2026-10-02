# Stone construction, local 2.32.0

The five nearby outcrops had broad tent-like faces. Garden borders were four straight bars below a rectangular soil slab, and distant escarpments showed a checkerboard of large triangles. The native construction in `common-view.js` now uses joined rock shelves, separate chamfered edging stones and resculpted distant crests with continuous surface shading.

Outcrop shelves share an irregular perimeter, inset seams, sloped beds and a small angular fracture. All five established rock/contact records and central peak heights remain exact. Garden stones have narrow joints, slightly sloping planar caps, chamfered corners and restrained height/colour variation. Their independent random stream preserves flowers and the rest of the planting. The edging remains decorative soft contact, as before; this pass does not establish exact capsule travel on its visible stones.

The five distant footprints retain their locations beyond traversable ground. Broad back slopes, steeper front faces, connected crests and shallow gullies change their silhouettes. Shared normals and continuous baked moss colour remove abrupt triangle patches. One native stone material uses a deterministic 128 x 256 strata texture with colour and bump; mapped ridges merge into one material batch. Sunlight, exposure and post processing retain the preceding settings.

Eight identical walking-height cameras render the baseline and release at 1440 x 1000. All sixteen baseline/release frames were visually inspected. The [eleven-slide comparison](../tools/out/stone-review.html) retains the eight pairs, two actual rejected rounds and native geometry cost. All eight frames in each intermediate round were inspected too.

The first revision failed: denser grids retained tent facets, the distant cliff retained triangle camouflage, and soil cut through the stone caps. The second revision fixed the rim height but made tiered cakes of the rocks, exposed triangular cap fans, and left mapped cliffs unmerged. The third round narrowed the ledges, made planar caps, blended cliff colour continuously and restored merging. Its frozen build predates the final shallow gully refinement.

The first pure-system run after introducing a pixel texture also failed because the inert canvas harness returned no ImageData. The harness now supplies a real-sized byte array for createImageData. The final system result below uses that corrected harness; no browser input is involved.

| Native group | 2.31.0 baseline | 2.32.0 release |
| --- | ---: | ---: |
| Common scene triangles | 367,520 | 376,270 |
| Common material batches | 21 | 21 |
| Distant ridge triangles | 4,320 | 8,640 |
| Distant ridge material batches | 3 | 1 |
| Lights in these groups | 0 | 0 |
| Tree records | 64 | 64 |
| Gardens | 4 | 4 |
| Collision tuples | 154 | 154 |
| Field byte fingerprint | 695,863,042 | 695,863,042 |

Combined geometry adds 13,070 triangles and removes two material batches. Tree, garden, outcrop, distant footprint and obstacle records compare exactly. Native mapped UVs, coloured streams and normal counts are complete and finite. [The full system log](../tools/out/system-stone.log) ends with `COMPLETE 423 system checks passed`. Existing checks include all five outward-facing rock exteriors and their established support heights, shared ground joins, grounding, host/guest contact and multiplayer/controller behavior.

The [release report](../tools/out/stone-release/report.json) binds the actual eight frames to build SHA256 `541cd7bc97c6ba2ea5f8714e2c9651cfab678da5d5382f9f66273484e87cc74b`. The baseline, both rejected rounds, third candidate and release retain their own build/source snapshots and hashes. The later [deck render report](../tools/out/stone-review-report.json) covers decoded images, visible navigation, runtime errors and pointer-lock state. Static observation uses guarded headless rendering with page evaluation only.

Trent reports Qwen audio generation loading the machine and has not tried physical Firefox mouse feel. This pass runs no new CPU/GPU timing sweep. Quiet-machine performance, physical mouse delivery, wall-slide feel and separate-network co-op remain unverified. Previous timing and public lobby evidence keep their original versions and scope.

Remaining criticism: the outcrops still repeat concentric bands and have simplified caps; gardens retain rectangular soil and sparse planting; the distant mass is too soft, its strata too regular, and its erosion shallow. Oversized broadleaf leaves, radial twig clusters, dark lower pine overlap, angular meadow tips, other interiors and the wider environment still need art judgment. This is an improvement checkpoint; the full game review stays open.
