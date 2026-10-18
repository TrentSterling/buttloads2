# Excavated cave geology pass

Status: experimental branch `codex/cave-geology-20261017`.

## Reference

This pass was prompted by two MrCollison terrain posts recovered from Trent's October 17 X session:

- https://x.com/MrCollison/status/2110845251950981465
- https://x.com/MrCollison/status/2111200252136968330

The posts are visual references, not imported source. Their implementation was not available in the recovered session, so this change adapts the visible geological treatment to BUTTLOADS 2's existing renderer rather than claiming a code port.

## Implementation

BUTTLOADS 2 already owns an editable density field, incremental Surface Nets, collision and persistence. Those systems remain untouched. `src/beauty.js` now gives the generated surface:

- warped world-space bedding instead of uniform horizontal bands;
- coarse and fine triplanar rock aggregate from the existing packed texture;
- stable fault families and hairline fractures;
- deeper damp seams with reduced roughness;
- orientation-aware fresh wall grain and ceiling cavity darkening;
- derivative normal relief for beds, aggregate and recessed cracks;
- distance fading for fine relief;
- a depth branch that skips the added fault and seep calculations on surface fragments.

The pass adds no terrain geometry, colliders, save data, network state, materials, lights or texture allocations. It reuses the existing cached 512 x 512 packed terrain texture.

## Verification performed

- `node --check src/beauty.js`
- shader hook executed against the exact bundled Three.js r140 `ShaderLib.standard` source;
- all Three.js shader includes recursively expanded;
- injected vertex and fragment shader delimiters and hook ordering checked;
- cached terrain texture identity and dimensions checked;
- `tools/test-beauty.mjs` now guards the geology cache key, fracture/wetness hooks, roughness hook and recessed normal detail.

The complete repository test suite and a native visual/performance capture still need to run in a full checkout. No FPS claim is made from the shader-only validation.

## Manual acceptance pass

1. Start a clean claim and inspect fresh cuts near 10 m, 30 m and 60 m.
2. Confirm fractures stay fixed while digging and do not swim with the camera.
3. Confirm the surface/common-land seam is unchanged.
4. Compare GPU time above ground and underground at the same render scale.
5. Reject the pass if damp seams read as painted black lines, bedding becomes noisy camouflage, or the new fragment cost is excessive.
