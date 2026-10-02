# Chalk landmark reconstruction, local 2.45.0

The eleven chalk wall landmarks now use a thick irregular mineral coat and five unequal fluted drops. This replaces the folded 3 cm shell and its pointed continuous hem. The coat follows the original rock surface; exposed drops keep their solid cross-sections. The existing geometry factory name `drapery` and the `chalk-drapery` ownership tag remain for compatibility.

The same material, shadow flags, eleven support anchors, root transforms, accents and supported cells remain. No frame update, light, texture or mesh is added. This is a native geometry and vertex-colour change. It does not complete the broader hard art pass.

## Evidence and cost

The [before/after deck](../tools/out/chalk-art-review.html) contains six matched model studies, four matched native headlamp views, two rejected native art candidates, counts and remaining criticism. All twenty final native images were individually inspected. Study lighting is fixed; mine lighting and cameras are the production renderer's existing values. Capture guards disable pointer lock and window focus before navigation. No input events or frame-time samples are sent.

| Inventory | Before 2.44.0 | After 2.45.0 |
| --- | ---: | ---: |
| Each chalk landmark | 2,152 triangles | 1,782 triangles |
| Eleven chalk landmarks | 23,672 triangles | 19,602 triangles |
| Entire cavern model | 107,266 triangles | 103,196 triangles |
| Cavern meshes | 114 | 114 |
| Upper / deep / expedition supported cells | 16 / 19 / 10 | 16 / 19 / 10 |

The construction removes 4,070 triangles. That is a model count, not a measured FPS improvement.

| Native mine view | Cached draws before / after | Cached triangles before / after | Shadow refresh draws before / after | Refresh triangles before / after |
| --- | ---: | ---: | ---: | ---: |
| Upright close view | 104 / 104 | 449,200 / 447,720 | 640 / 641 | 1,563,337 / 1,559,199 |
| Steep close view | 110 / 109 | 392,469 / 389,577 | 669 / 668 | 1,517,116 / 1,510,154 |
| Gallery west | 100 / 100 | 455,138 / 454,028 | 634 / 634 | 1,579,659 / 1,573,739 |
| Gallery east | 177 / 177 | 459,269 / 458,159 | 792 / 792 | 1,604,776 / 1,598,856 |

Draw counts can change by one because the shapes and their refreshed bounds change visibility. The upright shadow refresh adds a draw. There is no draw-saving claim for the rebuilt models and no quiet-machine timing result.

## Rejected work

1. [Round one](../tools/out/chalk-art-round-1/report.json) retained full wall projection. The curved wall pulled the tips sideways into spikes. The flat top cuts and narrow pointed fins looked manufactured. Solid-geometry checks alone were insufficient.
2. [Round two](../tools/out/chalk-art-round-2/report.json) kept the hanging bodies rigid and made their ends fuller. The smooth oval backing and broad drops read like a row of teeth. Narrower fluting, varied lengths and a smaller irregular coat replaced it.
3. [Round three](../tools/out/chalk-art-round-3/report.json) improved the shape but still retained primitive bounds after deformation. Its first study fixture also clipped two long tips. The accepted baseline and release studies share expanded framing; native mine cameras never change. The [rejected camera record](../tools/out/chalk-art-camera-rejected/rejection.json) retains the fault.
4. [Round four](../tools/out/chalk-art-round-4/report.json) added seating raycasts while the stale bounds remained. An attachment test still failed. A separate [mounting comparison](../tools/out/chalk-art-mount-alternative.json) showed all 880 attachment queries already pass with simple mounting and refreshed bounds. The accepted source removes the extra seating queries and refreshes the chalk bounds.

Early rejected studies use the tighter original framing. Only the rejected native mine comparisons are presented as matching the accepted cameras.

## Verification

All 506 system checks pass, recorded in [chalk-art-suite.log](../tools/out/chalk-art-suite.log). The new regression verifies closed outward nondegenerate geometry after actual wall mounting, every vertex inside its bounds, and all 880 pendant centre/rim queries inside the mounted coat. Existing checks retain opposite-side visibility, mapped attributes, the mesh/triangle allowance, whole-landmark excavation and portable reload.

[Native conservation](../tools/out/chalk-art-conservation.json) compares 1,148 other scene meshes, including geometry attributes, indices, bounds, instance buffers, transforms, material flags, shadow flags and culling flags. All remain exact. Lights, supported masks/transforms, terrain, collision bounds, original roots/anchors/accents, ore and economy also remain exact.

[Portable source comparison](../tools/out/chalk-art-build-diff.json) compiles all 71 scripts. Only `drapery` construction in `cave-form-art.js`, its wall-mounting branch in `underground-view.js`, and version metadata change. All other factory functions, mounting code, executable scripts, markup and styles remain exact. Physics, camera/input, HUD writes, adaptive ore submission, Trystero and saves retain their sources.

The preceding 2.44.0 complete fossil campaign remains dated at 532.9 simulated seconds. This art-only checkpoint does not claim a new campaign run, human pacing, physical mouse feel or separate-network multiplayer validation.

## Harsh criticism

The silhouettes now have volume, unequal lengths, open spaces between drops and visible fluting. The native headlamp views show the same improvement as the enlarged studies. The deformation no longer turns the hanging tips into swept blades.

The repeated five-drop anatomy remains conspicuous. The coat is too smooth and oval in several views, some flutes look like pencil grooves, and the same pale green material still loses warm colour variation under the headlamp. Mounting follows the original wall normals, so several groups tilt sideways and can read as hanging creatures. These are remaining art problems, not evidence of finished production quality.

The broader goal still includes harder environmental and character criticism, physical Firefox input feel, quiet-machine frame time and separate-network co-op. No push or deployment is included.
