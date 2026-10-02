# Connected cliff shapes, 2.56.0

Five decorative ridges now have closed connected rock surfaces, unequal crests, interrupted shallow joints and lower end shoulders. The previous layered waves looked artificial. The final native review improves that silhouette but still exposes broad planar sectors and angular caps. This is a limited art checkpoint.

The [nine-slide review](../tools/out/cliff-shape-review.html) and [58-section hub](../tools/out/current-review.html) retain native comparisons and rejected trials. Ten final cameras use the byte-exact 2.55.0 baseline: five face/quarter views, two skyline-only views with hill occlusion, and three wider context views. All ten final frames were directly inspected. The tiny horizon change in the yard is context evidence, not full cliff approval.

## Construction and cost

A local sampled density field combines crest profiles, two oblique joints, low-frequency relief, a clipped original footprint and a fixed datum below sampled terrain. A consistent six-tetrahedron subdivision of each 12 by 12 by 12 grid cell emits shared edge cuts. Face adjacency smooths shallow transitions while retaining creases. Gameplay terrain meshing and collision remain unchanged.

| Ridge cost | 2.55.0 | 2.56.0 |
| --- | ---: | ---: |
| Triangles | 7,920 | 17,784 |
| Geometry bytes including indices | 1,045,440 | 723,320 |
| Meshes | 1 | 1 |
| Cliff texture size | 128 by 256 | 128 by 256 |

Detail adds 9,864 triangles. Complete-record indexing saves 322,120 geometry bytes versus the baseline. The candidate compacts 53,352 to 14,014 records; expanding actual indices preserves all 586,872 checked Float32 words. The index consumes 106,704 bytes. No light, material, shadow caster or per-frame callback is added. Construction, adjacency and indexing add startup work. Texture pixels change; allocation and bump scale remain.

The [actual geometry proof](../tools/out/cliff-shape-conservation.json) finds 26,676 edges paired with opposite direction, five closed components with positive signed volume, zero zero-area triangles, zero misaligned normals and zero vertices outside the original footprints. Exact emitted position identity is used across attribute seams. This does not certify geometric self-intersection freedom or visual quality.

All 1,140 other mesh objects and five other geometry objects retain exact buffers, transforms and material parameters. Field, obstacles, contacts, placements and foliage atlas pixels remain exact. Common inventory remains 43 meshes, 26 foliage batches, 21 materials, 446,736 triangles and 37,370,414 geometry bytes. The earlier batching savings survive.

Only common-view.js changes executable behaviour; seventy other scripts remain exact. The portable shell matches after explicit LF and version normalization. The [suite log](../tools/out/cliff-shape-suite.log) ends with COMPLETE 570 system checks passed; 71 standalone scripts compile. Portable SHA-256: fd7f92a54d0996089f264e0a65a84ddafbb379846bc3793acb4b36c45f79391a.

## Rejected art

The earlier three slab trials were reverted in 2.55.0; all thirty native frames remain in [their rejection review](../tools/out/cliff-trial-review.html). Five connected candidates each retain four native views, all directly inspected. Round one was soft and peaked. Round two retained a hill-warped blade and triangular scars. Round three failed exact topology with four-face edges. Consistent tetrahedral cuts repaired closure in round four, which still retained an eastern fin and overly regular strata. Round five lowered the end shoulders but its dark patina looked spotty. Final material strength was reduced and interrupted directional streaks retained.

A read-only native ray probe localized the fin to the eastern shoulder. The retained eight-edge diagnostic JSON belongs to an intermediate failed source; it is not a final-build failure report. No lighting or camera change earns art approval.

## Fresh performance comparison

All three native RTX 5070 Ti profiles are fresh: [baseline](../tools/out/perf-cliff-shape-before/report.json) at 15:58:39 UTC, [candidate](../tools/out/perf-cliff-shape-after/report.json) at 15:59:25 UTC, and [repeated baseline](../tools/out/perf-cliff-shape-before-repeat/report.json) at 16:00:10 UTC on 2026-10-02. Each samples four six-second scenes at 1920 by 1080. All twelve profile PNGs were directly inspected.

| Scene | CPU work: before / after / repeat (ms) | GPU query mean: before / after / repeat (ms) |
| --- | --- | --- |
| Yard | 2.43 / 2.42 / 2.46 | 13.82 / 13.91 / 14.18 |
| Four miners | 3.33 / 3.31 / 3.34 | 14.57 / 14.46 / 14.10 |
| North slope | 2.24 / 2.26 / 2.32 | 8.44 / 8.08 / 8.15 |
| Outcrop | 2.17 / 2.12 / 2.18 | 9.93 / 8.01 / 10.07 |

CPU work is mean rendering plus simulation. Frame p95 remains 16.7 to 16.8 ms under the 60 Hz cap. Static cached draws remain 107, 52 and 48; the four-miner median remains 214 with periodic shadow refresh. Dynamic mean counts differ slightly with sample phase. Four moving miners are render fixtures. Competing GPU load is unknown; these windows do not establish quiet-machine FPS or a speedup.

## Criticism and delivery

Broad flat panels, triangular facets, a pointed central cap and repeated fracture grammar remain. Bare hills, carpet-like grass, repeated tree crowns, near fir cards, pristine repeated characters and fixed empty-hand curl remain wider art targets. Physical Firefox turning/strafing, quiet-machine FPS and separate-network co-op remain unverified. Actual public-lobby evidence remains dated 2.51.1 with unchanged networking source.

[Release evidence](../tools/out/cliff-shape-release.json), [shipment evidence](../tools/out/cliff-shape-shipment.json) and [deployment comparison](../tools/out/deployment-report.json) record their own dates. Packaging uses dist/buttloads2-2.56.0.zip with index.html, BUILD.json and og-image.png; actual ZIP entries must match the verified files. Public source delivery must match root/index and all 72 referenced assets. Standard existing-session Firefox URL requests do not certify foreground visibility or physical input feel.
