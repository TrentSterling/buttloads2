# Buried growth and rigid assemblies, local 2.38.1

The preceding ground-cover audit identified hundreds of cavern, discovery and deep-scene submissions in close surface views. This pass consolidates stationary supported growth and explicit rigid assemblies. It removes 446 render meshes while retaining native art and independent excavation decisions. All 447 system checks pass. The competing desktop GPU workload remains recorded; this checkpoint measures submissions and conservation, without a net frame-time claim.

## Geometry and state

`src/support-batches.js` adds `WorkshopShapes.batchSupported(parent, records, 16)`. Stationary growth groups by material, attributes, shadow/layer state and 16 m spatial cells. Original records retain visibility handles and immutable triangle ranges. Existing density decisions still determine visibility. A changed mask rewrites the existing index buffer and draw range; unchanged masks skip uploads. There are 45 supported batches: 16 cavern, 19 deep and 10 expedition. Empty source groups remain support handles, and disposed source geometries retain CPU arrays through their records. The reduction is render meshes, not equivalent total JavaScript object or memory reduction.

The existing rigid merge also consolidates each deep machine wheel under its original animated group, rootway rings/teeth, salvage chassis/spokes, vault hoops and the heart's rigid core/hoops. Lenses retain separate materials and repair glow. Falling bodies, collection visibility and gate opening retain original parent transforms and state. Rune materials, animated beams and independently changing objects remain separate. No materials, textures, lights or shaders are added.

`verify-buried-merge.mjs` compares complete oriented triangles grouped by material, shadow/layer state and every position, normal, UV and colour attribute. Supported batches use immutable complete source ranges, including hidden support, rather than unused index capacity. All 121,200 model triangles and 146,960 vertex records remain. Maximum measured float difference is 0.000003814697265625 against an absolute tolerance of 0.00004. Terrain bytes, contacts, support anchors and economy state remain exact.

| Native scene | Before render meshes | After | Model triangles retained | Maximum attribute difference |
| --- | ---: | ---: | ---: | ---: |
| Cavern | 312 | 136 | 83,519 | 0.0000000149011612 |
| Deep | 162 | 47 | 15,140 | 0.0000002384185791 |
| Discovery | 364 | 209 | 22,541 | 0.0000038146972656 |
| Combined | 838 | 392 | 121,200 | 0.0000038146972656 |

Production excavation/reload checks preserve independently removed cave and deep supports. Expedition growth retains its existing generation from edited `world.ray` results on reload, so array membership can change; regenerated supports follow the original density decision. Rendering does not edit terrain.

## Native submissions

Fourteen matched views use frozen 2.38.0 and 2.38.1 portables, seed 260923, fixed time/light and identical cameras at 1440 by 1000. Seven views use the actual game renderer. Seven isolate native assembly clones under fixed studio lights. These are static observations with no input or pointer lock.

| Actual game view | Cached draws before / after | Cached triangles before / after | Refreshed-shadow draws before / after |
| --- | ---: | ---: | ---: |
| Western leaf detail | 932 / 524 | 749,313 / 749,583 | 1,472 / 1,045 |
| Outcrop gravel detail | 531 / 371 | 722,062 / 725,200 | 1,071 / 892 |
| Mine entrance | 102 / 102 | 595,528 / 595,528 | 642 / 623 |
| Lantern chamber | 147 / 124 | 525,877 / 528,229 | 749 / 707 |
| Chalk chamber | 92 / 89 | 512,880 / 515,550 | 685 / 663 |
| Amethyst chamber | 106 / 82 | 392,299 / 393,163 | 696 / 653 |
| Lower mine room | 38 / 38 | 241,906 / 242,161 | 591 / 572 |

Cached views save zero to 408 draws. Wider supported-batch bounds add zero to 3,138 submitted triangles in these views. Each measured game shadow refresh saves 19 further draws beyond cached-frame savings, with unchanged shadow triangles. Wider bounds are a recorded cost, not a triangle-reduction claim.

| Isolated native assembly | Cached draws before / after | Triangles before / after |
| --- | ---: | ---: |
| Pump | 15 / 9 | 2,860 / 2,860 |
| Exchange | 15 / 9 | 7,900 / 7,900 |
| Receiver | 14 / 8 | 1,896 / 1,896 |
| Rootway | 10 / 2 | 864 / 864 |
| Salvage | 13 / 5 | 564 / 564 |
| Vault | 4 / 2 | 1,232 / 1,232 |
| Heart | 4 / 2 | 2,168 / 2,168 |

The earlier 2.35.1 rigid pass removes 388 other meshes. The earlier canopy pass retains its dated 65.4% mean main-camera submission reduction. Neither those results nor current counts establish quiet-machine FPS gains.

## Visual inspection and rejected fixtures

All fourteen baseline and fourteen final frames were opened individually, followed by all seventeen rendered slides, the portable-build frame and receipt hub. Geometry, materials and silhouettes show no visible merge regression. Seven pairs are pixel-identical: leaf detail, gravel detail, mine entrance, pump, exchange, receiver and vault. Other pairs differ by at most 22 of 1,440,000 pixels (0.00153%). Salvage has 17 changed pixels with maximum RGB difference 36; remaining pairs have maximum RGB differences of ten or less. Raw differences remain linked.

The first studio fixture refreshed its key shadow automatically, invalidating the supposed cached count; that report is retained separately. Initial candidate studio cameras fitted each model's bounds, which change after merging: heart/vault comparisons differed by 4.20% and 11.61%. Those comparisons were rejected. A recapture initially failed to wire the frozen camera preset into page evaluation. The corrected fixture asserts exact camera equality for every accepted pair. Focused inspection of rejected heart/vault examples does not claim inspection of every rejected frame.

First test assumptions were also corrected: deep progression must unlock before carving its supports, and expedition reload already regenerates growth from edited rays. These are fixture corrections, without production progression/reload changes. Each wheel fixture now starts at the same time before checking repair motion.

The art remains unfinished. Surface cover repeats obvious three-leaf forms and leaves broad empty slopes. Cave frames show repeated shelves, pale flattened ovals, uniform crystal rods and broad triangular wall shading. Salvage is a plain slab chassis with a large ring; rootway, vault and heart read as primitive assemblies. Studio frames expose those weaknesses. Merging preserves them; this is no new hard-art acceptance. Dark foliage, broad rock/wall faces, continuous cliff shelves and facades/interiors remain in the wider critic record.

## Verification and delivery

`node tools/test.mjs` ends with **COMPLETE 447 system checks passed**. Five new contracts verify transformed indexed attributes, independent support removal/reappearance, unchanged-mask upload skipping, rejection before mutation, production excavation/reload, wheel motion, lenses, falling transforms and rootway visibility. Pre-existing multiplayer, movement, art and progression checks also pass.

Guarded headless verification renders seventeen slides with decoded images, visible navigation, no exceptions and no pointer lock. Direct page evaluation checks portable yaw/pitch and interpolated capsule translation: expected camera values match exactly on the RTX 5070 Ti D3D11 renderer. The twenty-eight-section hub has no overflow and retains a 756-pixel-wide comparison image at the checked viewport. Physical Firefox mouse feel remains unverified. Public Trystero evidence remains dated 2.35.0; separate-network traversal remains unverified.

- [Seventeen-slide comparisons](../tools/out/buried-merge-review.html)
- [Current receipt hub](../tools/out/current-review.html)
- [Frozen baseline](../tools/out/buried-merge-before/report.json)
- [Frozen release](../tools/out/buried-merge-release/report.json)
- [Model conservation](../tools/out/buried-merge-conservation.json)
- [Accepted pixel comparison](../tools/out/buried-merge-pixels.json)
- [Rejected fitted cameras](../tools/out/buried-merge-round-1-framing/report.json)
- [Rejected framing pixel comparison](../tools/out/buried-merge-first-framing-pixels.json)
- [Rejected automatic-shadow fixture](../tools/out/buried-merge-before-shadow-auto/report.json)
- [Full system log](../tools/out/system-buried-merge.log)
- [Portable camera check](../tools/out/buried-merge-build-report.json)
- [Slide rendering check](../tools/out/buried-merge-review-report.json)
- [Hub rendering check](../tools/out/buried-merge-hub-report.json)
- [Inspection record](../tools/out/buried-merge-inspection.json)

Baseline SHA256: `c28c1e51c09d414e891e6e77c67ae59b6a10a1c63c45d88dbf70db98765722cb`.

Release SHA256: `8bd1d5ebb4944ce88e6fefebadbc580d0d830aedca126b95a515c5a870b99cd1`.

Build and receipts were sent to Firefox through standard new-tab requests. Foreground visibility is unverified; no OS input, window activation or pointer-lock automation was used. No commit, push or deployment is part of this checkpoint. The broader improvement goal remains active.
