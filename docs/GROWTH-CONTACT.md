# Native growth contact, local 2.41.1

Upper and deep cave formations now rotate to the sampled rock normal and seat their complete crystal root rings into the field. This corrects placement of the 2.41.0 art; its triangle shapes remain intact. Construction performs the field queries once before the existing supported batching. The original garden placement remains unchanged.

`COMPLETE 466 system checks passed` in [the full log](../tools/out/system-growth-contact.log). Three new checks cover sloping floor/ceiling geometry preservation, actual production root contact and excavation/portable reload. [Conservation](../tools/out/growth-contact-conservation.json) compares the frozen 2.41.0 production sources with the release.

| Native scene | Before meshes / triangles | After meshes / triangles |
|---|---:|---:|
| Upper caverns | 114 / 97,214 | 114 / 97,214 |
| Deep workings | 51 / 25,364 | 51 / 25,364 |
| Discovery | 125 / 45,640 | 125 / 45,640 |

All 45 cells, original support anchors, root poses and independent visibility masks remain exact. All other common/cavern/deep/discovery geometry, materials, shadow flags, terrain, contacts, ore and economy remain exact. All supported UVs, colours, indices and vertex counts stay exact. The maximum world triangle-edge change across the 300 mounted sources is 6.704e-8 metres. The remaining 141 supported sources preserve their original positions.

The fresh native seed checks 13,998 crystal base vertex records. Upper root records in air decrease from 636 to zero; deep decreases from 2,226 to zero. The unchanged garden retains zero. After excavation and portable reload, all surviving upper/deep crystal roots meet solid field. The unchanged garden regeneration has a measured 0.001829 positive field residual in that fixture; only that system retains a 0.003 test allowance.

Twelve matched cameras preserve seed, native light, terrain and camera poses. Four mine cameras retain identical cached draws, submitted triangles and refreshed-shadow submissions. All 36 baseline, rejected and final native frames were inspected. The [sixteen-slide review](../tools/out/growth-contact-review.html) preserves the comparisons, rejected fixed-offset revision, exact cost and criticism. It leads the thirty-five-section [receipt hub](../tools/out/current-review.html).

The first revision uses a fixed 10 cm burial and also modifies the already grounded garden. Inspection rejects the loss of exposed secondary crystals; the deep root check still finds nine positive vertex records, with a maximum 0.004897 field residual. Final placement seats each upper/deep root ring only as far as necessary and preserves the garden. Its [frozen native report](../tools/out/growth-contact-round-1/report.json) and build remain available.

The [read-only mesh candidate audit](../tools/out/mesh-candidates-2.41.1.json) finds that the largest remaining same-material groups are deliberately separate: editable terrain chunks, spatial canopy/growth cells and ground-cover/perimeter batches. Rune symbols and rings have independent rotation, visibility and materials; optical rings rotate independently; echo halos pulse and hide independently. Rescue cable length changes separately from its post, and bell seams retain their original transforms after an earlier visual regression. These are potential counts from a compatibility scan, not accepted merge savings. The preceding [30-mesh prop merge](PROP-MERGING.md) remains intact.

This correction does not complete the hard art request. Broad clean crystal faces, pencil shafts, repeated three-part clusters and strongly sideways ceiling drops remain criticism. Native mine close-ups improve contact but retain crude rock and model silhouettes. Quiet-machine timing, physical Firefox movement feel and separate-network co-op remain unverified; the retained public Trystero proof is dated 2.35.0. This is a local verified-progress checkpoint, with no push or deployment.
