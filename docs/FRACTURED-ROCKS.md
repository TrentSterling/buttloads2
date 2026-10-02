# Fractured outcrops, local 2.33.0

The 2.32.0 rocks repeated the same wrapped bands and cap. This pass replaces all five with separate fractured stone masses, varying shoulder heights, angled break faces, shallow surface deformation and grounded chips. The native model changes in `common-view.js`; the captured sunlight, exposure and camera settings remain identical.

Closed polygon beds are clipped into irregular outlines, split along narrow fissures and triangulated with shared boundary midpoints. Continuous position deformation breaks the long planar faces. Crack shading uses restrained vertex colour. Independent construction seeds preserve the existing planting and terrain.

All six baseline, first-round, second-round, third-round, candidate and release images were visually inspected: 36 native frames. The [nine-slide review](../tools/out/fracture-review.html) contains six matched views, two rejected revisions and geometry cost. The first revision resembled concrete blocks; the second made pointed pyramids with dark stripes. The third reduced those problems but retained manufactured faces; the final candidate adds surface deformation and broken lower corners. Every revision retains its actual build, source, six images and report.

| Native group | 2.32.0 baseline | 2.33.0 release |
| --- | ---: | ---: |
| Common scene triangles | 376,270 | 380,184 |
| Common material batches | 21 | 21 |
| Distant ridge triangles | 8,640 | 8,640 |
| Distant ridge material batches | 1 | 1 |
| Lights in these groups | 0 | 0 |
| Trees | 64 | 64 |
| Collision tuples | 154 | 154 |
| Field byte fingerprint | 695,863,042 | 695,863,042 |

Common geometry adds 3,914 triangles. The native reports compare exact tree, garden, rock, distant footprint, obstacle and terrain records. Mapped UVs, coloured streams and normal counts are complete and finite. Existing landscape checks pass for all five central support heights and outward-facing exteriors. These checks do not establish exact capsule contact across every newly shaped shoulder; the pre-existing collision bounds remain.

The full suite passes: `COMPLETE 423 system checks passed`, retained in [system-fracture.log](../tools/out/system-fracture.log). The [release report](../tools/out/fracture-release/report.json) binds the six actual frames to SHA256 `bd74a2796f68e77693c9ce772888fd672ed47b9dee25e829e888dd76ba3f6834`. The baseline SHA256 is `541cd7bc97c6ba2ea5f8714e2c9651cfab678da5d5382f9f66273484e87cc74b`. Intermediate 2.32.0 version labels refer to distinct recorded hashes. The deck generator checks these frozen hashes and matching cameras before producing slides.

The [deck render report](../tools/out/fracture-review-report.json) verifies all nine slides, decoded images, visible navigation, zero runtime errors and no pointer lock. All nine slide layouts, the receipt hub and the portable camera frame were visually inspected. The [2.33.0 camera report](../tools/out/movement-build-2.33.0-report.json) records exact direct rotation and interpolated translation in the portable build. The [inspection record](../tools/out/fracture-inspection.json) retains the review scope and limitations. Standard new-tab delivery of the build and standalone deck to Firefox succeeded; foreground visibility was not observed.

Remaining criticism: broad break faces still look stylized and partly manufactured; shallow triangular surface shading is visible, especially on the southern bright face; nearby foliage occludes part of the eastern rock; several chips are small or hidden by grass. Soft distant cliffs, regular strata, oversized broadleaf leaves, angular meadow tips, garden soil and other interiors remain open art work. This checkpoint addresses repeated rock bands; it does not accept the whole game's art.

Trent reports competing Qwen audio generation and has not tried the mouse changes. This pass makes no new CPU/GPU timing claim. Quiet-machine performance, physical Firefox mouse delivery, wall-slide feel and separate-network co-op remain unverified. Static captures use guarded headless rendering and page evaluation with no browser input events or pointer lock. No push or deployment is included.
