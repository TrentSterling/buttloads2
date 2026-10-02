# Static sign merging, local 2.43.1

Nineteen static sign faces in the depot and town each used a separate texture and material. The existing mesh merge could not combine them. Construction now copies their original 1024-pixel-wide bitmaps into four bounded atlas pages, remaps the vertical UVs, then uses the existing material merge. Identical BELL barrel lettering occupies one tile. Sixteen-pixel extruded gutters and power-of-two pages retain the original bitmap sizes. This adds no per-frame work.

[Sixteen slides](../tools/out/sign-merge-review.html) retain thirteen native before/after pairs: depot, workshop, barrels, gate, shops, both survey-office states and all five road posts. Cameras, lighting, tool poses, terrain and office visibility match. These are guarded static render observations, with no browser input, pointer lock, activation or FPS measurement. All twenty-six before/final frames were inspected.

| Native inventory / cost | Before 2.43.0 | After 2.43.1 |
| --- | --- | --- |
| Static sign meshes/materials | 19 / 19 | 4 / 4 |
| Depot meshes / model triangles | 32 / 120,984 | 26 / 120,984 |
| Town meshes / model triangles | 218 / 67,212 | 209 / 67,212 |
| Sign model triangles / vertex records | 38 / 114 | 38 / 114 |
| Base texture texels | 4,957,184 | 5,242,880 |

Fifteen meshes/materials are removed. Across the thirteen cameras, cached draws save zero to fourteen; refreshed-shadow draws save fifteen to twenty-nine. The trail view changes from 345 to 331 cached draws and 854 to 825 refresh draws. The depot view changes from 247 to 239 and 756 to 733. Wider atlas bounds submit two to twenty extra sign triangles. Additional base-level RGBA texture capacity is 1,142,784 bytes (1.09 MiB); mipmaps are additional. These counts establish submission changes, without establishing frame-time improvement under the competing GPU workload.

The [native geometry comparison](../tools/out/sign-merge-conservation.json) matches all thirty-eight oriented sign triangles with zero measured attribute difference after inverse UV conversion. All other 1,101 native scene meshes retain exact geometry, transforms, material and shadow/layer state. Terrain bytes, collision records, ore and economy remain exact. Office open/closed signs, interior signs, moving and supported roots retain separate materials and visibility controls. No light is added. Earlier art and mesh savings survive.

The [full suite](../tools/out/system-sign-merge.log) ends with `COMPLETE 484 system checks passed`. Four new tests cover native budgets, indexed geometry and reversible UVs, deduplication/disposal, material/visibility exclusions, office states and ordinary unmapped merging. The [portable comparison](../tools/out/sign-merge-build-diff.json) compiles all seventy-one executable scripts and verifies that only `render.js` and version metadata change. Physics, input, simulation, art construction, co-op, protocol, room, save sources, shaders, styles and other markup remain exact.

The first direct cross-process canvas-hash comparison failed on two large depot labels. The [raw mismatch](../tools/out/sign-merge-cross-process-bitmaps.json) and earlier identical-code diagnostic capture remain; that comparison alone does not locate the cause or establish a lossy copy. A [same-browser pixel test](../tools/out/sign-merge-bitmaps.json) rebuilds every native descriptor and compares source pixels with atlas rectangles immediately around the production operation. All eighteen descriptors match exactly both with and without prior source readback: thirty-six comparisons and zero changed channels. No production copy change was needed. This is copy conservation, not pixel-identical rendered frames.

The [rendered pixel comparison](../tools/out/sign-merge-pixels.json) retains differences of 0.00007% to 0.6662% of frame pixels, with a maximum channel difference of 150 at lettering edges. Texture filtering changes with atlas placement; separately rasterized source canvases also differ for two labels. Native frames keep legible lettering, with small edge differences. Both office states differ at only one to three pixels by one channel level.

The harsh critic pass remains open: reverse-side post poles still obscure lettering, sign boards are plain, slopes are bright and sparse, some distant facades remain flat and the central mouse-look prompt overlaps the subject. This targeted performance change preserves those weaknesses. Quiet-machine frame time, physical Firefox mouse feel, separate-network co-op and the broader hard art/movement/performance goal remain unverified. No push or deployment is part of this checkpoint.
