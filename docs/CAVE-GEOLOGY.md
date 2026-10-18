# Excavated cave geology — revision 3

Status: experimental, unmerged branch `codex/cave-geology-20261017`, PR #1.
Shipped baseline: `a28fa21085ddcf30e9d7f77cec74fd99e3657b2b` (2.64.0).
Rendering implementation commit: `9007ee15ea7124cbe0d53ae7fb2dcf01d73daeb7`.
Rendering file Git blob: `940d84da645750b9cb474ee0402cbeae819b2ee0`.

## Reference and limits

Prompted by the MrCollison posts recovered from Trent's October 17 X session:

- https://x.com/MrCollison/status/2110845251950981465
- https://x.com/MrCollison/status/2111200252136968330

No code or assets from that project were imported. This is an original material and local density-lighting implementation, not a port of the author's renderer and not radiance-cascade global illumination.

## What replaced the first branch pass

`src/beauty.js` now bakes dedicated periodic rock material and normal maps rather than reusing grass fibers or drawing prominent dark fault lines. Three-axis world-space projection follows newly exposed terrain without UV regeneration. Rock roughness, interrupted fractures, mineral grain and sparse depth-dependent wetness share the existing geological color palette. The blend starts at 1.5 m and reaches full rock at 7 m; grass/common-land paint is retained.

The first trial derived normals from an 8-bit height map and produced visible stepping. Normals now come from the unquantized CPU height field, then are stored as a normal texture. Surface gradients are projected into the mesh tangent plane to blend the three axes. Several excessive relief and closed-cell/cracked-mud versions were rejected before the retained comparison.

WebGL2 adds a camera-local 32 x 32 x 32 scalar-density texture at 0.5 m sample spacing. Five ambient probes darken nearby occluded directions. Five bounded samples per visible point/spot light approximate short-range contact shadows over at most 2.5 m. These are local approximations, not full-range shadows or a bounce-light solution. The field is clamped to [-2,2] and is not treated as an exact signed distance field; no sphere-tracing step depends on its magnitude.

The volume updates when the world reference/revision changes or the camera crosses a metre boundary, throttled to one update per 100 ms within a world. Idle frames reuse it; surface frames disable it; edge fading hides the finite bounds. Rapid edits can leave lighting up to roughly 100 ms behind geometry. WebGL1 uses the rock material without the density volume.

Only rendering code changes executable game behavior. The mesher, saved density, collision, ore generation, economy and network protocol are not modified. The field-lighting component only reads `world.density` and `world.revision`.

## Explicit added costs

- Two shared 512 x 512 RGBA8 rock textures: 2 MiB before mipmaps, about 2.67 MiB with a complete mip chain, plus CPU copies.
- One WebGL2 R8 density volume: 32 KiB before driver overhead.
- A one-time CPU rock-texture bake and temporary float height array.
- 32,768 density queries per volume refresh; up to about ten refreshes per second during ongoing movement/edits in one world.
- Additional material texture fetches, plus five ambient density probes and up to five contact probes per relevant light. Current material sampling is also present on surface fragments even where its blend weight is zero.

No added terrain triangles, collision geometry, save payload, or network fields. No FPS improvement or acceptable frame-time budget has been established.

## Verification completed

`node --check src/beauty.js` passes. `node tools/test-cave-geology.mjs` passes all 20 isolated checks covering deterministic texture data, normal validity, map caching, seam statistics, fallback behavior, field invalidation, bounded refreshes, no world mutation, uniform bindings and shader include expansion. `tools/test-beauty.mjs` imports those checks into the existing suite and updates its shader assertions. The complete suite itself was not run.

Offscreen Mesa llvmpipe OpenGL 4.5 compiled, linked and rendered the expanded Three.js r140 standard material. GLSL syntax was adapted for desktop OpenGL; this is not a browser/WebGL certification. The isolated terrain fixture used the exact Surface Nets mesher blob `7633be3ce3e4ffc7cca68e83d750c3ec03269576` and a synthetic excavated cave, not the complete game's generated world, props, HUD, saves or multiplayer.

Matched before/after fixture captures were rendered at 1280 x 720 for 10 m excavation, 30 m chamber, 60 m close-up and a surface control. Mesh attributes, indices, camera and lights were checked equal in each pair. All eight renders completed without an OpenGL error. In the surface control, seven pixels differed by at most one 8-bit channel value. The retained `compare-30m.png` shows the matched chamber pair and crops; its labels sit outside the captures.

A later no-op-for-this-fixture optimization adds early returns for disabled/out-of-volume lighting and safely resets shader defines. The uploaded source matches the recorded rendering file blob above. The retained images are fixture evidence, not live gameplay or hardware performance evidence.

## Remaining acceptance gates

1. Run `node tools/test.mjs` from a complete checkout, then build with `node tools/build.mjs`.
2. Verify actual browser shader compilation, camera movement, excavation and save loading. Preserve the repository's no-OS-input/no-agent-pointer-lock restrictions.
3. Inspect real generated cave walls, ceilings, new cuts, chunk transitions and the common-land seam.
4. Measure CPU refresh cost and GPU time above/below ground with the real light count. Bound or make field lighting optional if the cost is excessive.
5. Inspect update lag and repeated rock patterns. This does not yet match the reference demo's full lighting or geometry quality.

Keep PR #1 in draft until those checks pass. Public `main` remains unchanged.
